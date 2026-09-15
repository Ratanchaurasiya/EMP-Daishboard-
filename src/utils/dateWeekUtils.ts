// Week calculation, formatting, and client-side image compression utilities

export interface WeekInfo {
  weekNumber: number;
  year: number;
  weekLabel: string;
  startDate: string; // YYYY-MM-DD (Monday)
  endDate: string; // YYYY-MM-DD (Sunday)
}

/**
 * Get ISO week number and date boundaries (Monday to Sunday) for any given date
 */
export function getWeekInfo(inputDate: Date | string = new Date()): WeekInfo {
  const date = typeof inputDate === 'string' ? new Date(inputDate) : new Date(inputDate.getTime());
  
  // Set date to Sunday or Monday
  const day = date.getDay(); // 0 is Sunday, 1 is Monday...
  const diffToMonday = date.getDate() - day + (day === 0 ? -6 : 1);
  
  const monday = new Date(date.setDate(diffToMonday));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // ISO Week Number calculation
  const target = new Date(monday.valueOf());
  const dayNr = (monday.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  const year = monday.getFullYear();

  const pad = (n: number) => n.toString().padStart(2, '0');
  const startDateStr = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
  const endDateStr = `${sunday.getFullYear()}-${pad(sunday.getMonth() + 1)}-${pad(sunday.getDate())}`;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const startMonth = monthNames[monday.getMonth()];
  const endMonth = monthNames[sunday.getMonth()];
  const startDay = pad(monday.getDate());
  const endDay = pad(sunday.getDate());

  const rangeLabel = startMonth === endMonth
    ? `${startMonth} ${startDay} - ${endDay}`
    : `${startMonth} ${startDay} - ${endMonth} ${endDay}`;

  const weekLabel = `Week ${weekNumber}, ${year} (${rangeLabel})`;

  return {
    weekNumber,
    year,
    weekLabel,
    startDate: startDateStr,
    endDate: endDateStr,
  };
}

/**
 * Resizes and compresses an image file to Base64 JPEG
 * Keeps maximum dimension <= 1280px to preserve crisp visual detail
 * while maintaining lightning-fast performance and compact storage in IndexedDB
 */
export function compressImageFile(file: File, maxDimension: number = 1280, quality: number = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read photo file'));
    reader.onload = e => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file format'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          // Fallback to original read result if canvas not supported
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
