// Universal Utility for File and Image URL Resolution & Conversion (Google Drive, Cloud, Web URLs)

export interface ResolvedUrlResult {
  previewUrl: string;
  originalUrl: string;
  isGoogleDrive: boolean;
  isImage: boolean;
  isPdf: boolean;
  fileName: string;
  mimeType: string;
}

/**
 * Extracts Google Drive File ID from various link formats:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * - https://docs.google.com/file/d/FILE_ID/...
 */
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (fileDMatch && fileDMatch[1]) return fileDMatch[1];

  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
  if (idParamMatch && idParamMatch[1]) return idParamMatch[1];

  const ucMatch = trimmed.match(/\/uc\?[^#]*\bid=([a-zA-Z0-9_-]+)/i);
  if (ucMatch && ucMatch[1]) return ucMatch[1];

  return null;
}

/**
 * Converts any URL (Google Drive, Dropbox, web image) into a direct, embeddable preview URL
 */
export function resolveFileOrImageUrl(url: string, customFileName?: string): ResolvedUrlResult {
  if (!url || typeof url !== 'string') {
    return {
      previewUrl: '',
      originalUrl: '',
      isGoogleDrive: false,
      isImage: false,
      isPdf: false,
      fileName: customFileName || '',
      mimeType: '',
    };
  }

  let trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:')) {
    trimmed = `https://${trimmed}`;
  }

  // 1. Check Google Drive
  const driveId = extractGoogleDriveFileId(trimmed);
  if (driveId) {
    // lh3.googleusercontent.com/d/ID is the official, high-speed CDN preview for Google Drive images
    const previewUrl = `https://lh3.googleusercontent.com/d/${driveId}`;
    return {
      previewUrl,
      originalUrl: trimmed,
      isGoogleDrive: true,
      isImage: true, // Google Drive attachments in photo audit are assumed images or previewable thumbnails
      isPdf: trimmed.toLowerCase().includes('.pdf'),
      fileName: customFileName || `GoogleDrive_Attachment_${driveId.substring(0, 8)}.jpg`,
      mimeType: 'image/jpeg',
    };
  }

  // 2. Check Dropbox
  if (trimmed.includes('dropbox.com')) {
    const previewUrl = trimmed.replace(/\?dl=0$/, '?raw=1').replace(/&dl=0$/, '&raw=1');
    return {
      previewUrl,
      originalUrl: trimmed,
      isGoogleDrive: false,
      isImage: true,
      isPdf: trimmed.toLowerCase().includes('.pdf'),
      fileName: customFileName || 'Dropbox_Attachment.jpg',
      mimeType: 'image/jpeg',
    };
  }

  // 3. Data URL
  if (trimmed.startsWith('data:')) {
    const isImg = trimmed.startsWith('data:image/');
    const isPdf = trimmed.startsWith('data:application/pdf');
    return {
      previewUrl: trimmed,
      originalUrl: trimmed,
      isGoogleDrive: false,
      isImage: isImg,
      isPdf,
      fileName: customFileName || (isImg ? 'Uploaded_Photo.jpg' : 'Document.pdf'),
      mimeType: trimmed.substring(5, trimmed.indexOf(';')) || (isImg ? 'image/jpeg' : 'application/pdf'),
    };
  }

  // 4. Standard Web Image / Document URL
  const cleanUrl = trimmed.split('?')[0].split('#')[0].toLowerCase();
  const isImageExt = /\.(jpeg|jpg|png|webp|gif|svg|bmp|ico)$/i.test(cleanUrl);
  const isPdfExt = /\.pdf$/i.test(cleanUrl);

  const isLikelyImage =
    isImageExt ||
    trimmed.includes('images.unsplash.com') ||
    trimmed.includes('googleusercontent.com') ||
    trimmed.includes('cloudinary.com') ||
    trimmed.includes('imgur.com') ||
    trimmed.includes('cdn.') ||
    trimmed.includes('/photos/') ||
    trimmed.includes('/images/');

  // Extract a readable file name from the URL pathname
  let extractedName = customFileName;
  if (!extractedName) {
    try {
      const parsed = new URL(trimmed);
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length > 0) {
        const lastPart = decodeURIComponent(parts[parts.length - 1]);
        if (lastPart.length < 50 && (lastPart.includes('.') || isLikelyImage)) {
          extractedName = lastPart;
        }
      }
    } catch {}
  }

  return {
    previewUrl: trimmed,
    originalUrl: trimmed,
    isGoogleDrive: false,
    isImage: isLikelyImage || (!isPdfExt && isImageExt),
    isPdf: isPdfExt,
    fileName: extractedName || (isLikelyImage ? 'Web_Image.jpg' : 'Document'),
    mimeType: isLikelyImage ? 'image/jpeg' : (isPdfExt ? 'application/pdf' : 'application/octet-stream'),
  };
}

/**
 * Checks if a URL or data string is an image
 */
export function isImageUrl(url?: string | null, fileName?: string, fileType?: string): boolean {
  if (!url && !fileName && !fileType) return false;
  if (fileType && fileType.startsWith('image/')) return true;
  if (fileType && fileType === 'application/pdf') return false;

  const target = (url || '').trim();
  if (target.startsWith('data:image/')) return true;
  if (target.startsWith('data:application/pdf')) return false;

  if (target.includes('googleusercontent.com') || target.includes('drive.google.com')) return true;

  if (fileName && /\.(jpeg|jpg|png|webp|gif|svg|bmp)$/i.test(fileName)) return true;
  if (fileName && /\.pdf$/i.test(fileName)) return false;

  return /\.(jpeg|jpg|png|webp|gif|svg)($|\?)/i.test(target) ||
    target.includes('images.unsplash.com') ||
    target.includes('imgur.com') ||
    target.includes('cloudinary.com') ||
    target.startsWith('http');
}
