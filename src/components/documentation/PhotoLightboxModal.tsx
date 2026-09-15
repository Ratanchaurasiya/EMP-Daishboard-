import React, { useState } from 'react';
import {
  X,
  Download,
  ExternalLink,
  Calendar,
  Database,
  FolderOpen,
  FileText,
  FileImage,
  Link2,
  Trash2,
  User,
} from 'lucide-react';
import { AssetPhotoItem } from '../../types';
import { ConditionBadge } from '../common/Badge';
import { formatDateDisplay, formatFileSize } from '../../utils/formatters';

interface PhotoLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoItem: AssetPhotoItem | null;
  employeeName?: string;
  weekLabel?: string;
  canDelete?: boolean;
  onDeletePhoto?: (photoId: string) => void;
}

export const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({
  isOpen,
  onClose,
  photoItem,
  employeeName,
  weekLabel,
  canDelete = false,
  onDeletePhoto,
}) => {
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  if (!isOpen || !photoItem) return null;

  const isImage = photoItem.fileType
    ? photoItem.fileType.startsWith('image/')
    : photoItem.photoUrl
    ? photoItem.photoUrl.startsWith('data:image/')
    : true;

  const handleDownload = () => {
    if (!photoItem.photoUrl) return;
    const a = document.createElement('a');
    a.href = photoItem.photoUrl;
    a.download = photoItem.fileName || `${photoItem.assetType}_${photoItem.assetNumber}_${photoItem.capturedAt.substring(0, 10)}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const driveUrl = photoItem.googleDriveLink
    ? photoItem.googleDriveLink.startsWith('http')
      ? photoItem.googleDriveLink
      : `https://${photoItem.googleDriveLink}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
              {photoItem.assetNumber}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">
                {photoItem.assetName || photoItem.assetType}
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 truncate mt-0.5">
                <span className="text-slate-300 font-semibold flex items-center gap-1">
                  <User className="w-3 h-3 text-blue-400" />
                  Uploaded By: <span className="text-white font-bold">{employeeName || 'Assigned Employee'}</span>
                </span>
                <span>•</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  Weekly Photo Update
                </span>
                {weekLabel && <span>• {weekLabel}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {photoItem.photoUrl && (
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-2xs"
                title="Download Attached File"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </button>
            )}

            {driveUrl && (
              <a
                href={driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-300 bg-indigo-950/70 border border-indigo-700/60 hover:bg-indigo-900/80 transition-colors shadow-2xs"
                title="Open Google Drive File"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Open Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {canDelete && onDeletePhoto && (
              confirmDelete ? (
                <div className="flex items-center gap-1.5 bg-rose-950/80 border border-rose-800 px-2 py-1 rounded-lg">
                  <span className="text-[11px] font-bold text-rose-300">Remove?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onDeletePhoto(photoItem.id);
                      onClose();
                    }}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white hover:bg-rose-500 transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-1.5 py-0.5 rounded text-[10px] text-slate-300 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-300 hover:text-white bg-rose-950/50 hover:bg-rose-900/80 border border-rose-800/60 transition-colors shadow-2xs"
                  title="Remove uploaded asset photo/file"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Remove</span>
                </button>
              )
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Preview Container */}
        <div className="flex-1 min-h-[300px] max-h-[62vh] overflow-auto flex items-center justify-center p-4 bg-slate-950/80">
          {photoItem.photoUrl ? (
            isImage ? (
              <img
                src={photoItem.photoUrl}
                alt={`${photoItem.assetType} ${photoItem.assetNumber}`}
                className="max-h-[58vh] max-w-full object-contain rounded-lg shadow-lg border border-slate-800"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-900 border border-slate-800 rounded-2xl max-w-md text-center">
                <FileText className="w-16 h-16 text-blue-400 mb-3" />
                <h4 className="text-sm font-bold text-white mb-1 truncate max-w-full">
                  {photoItem.fileName || 'Attached Asset Document'}
                </h4>
                <p className="text-xs text-slate-400 mb-4">
                  File Format: {photoItem.fileType || 'Document'} • Size: {formatFileSize(photoItem.fileSize)}
                </p>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Document</span>
                </button>
              </div>
            )
          ) : driveUrl ? (
            <div className="flex flex-col items-center justify-center p-8 bg-slate-900 border border-indigo-900/60 rounded-2xl max-w-md text-center">
              <FolderOpen className="w-16 h-16 text-indigo-400 mb-3" />
              <h4 className="text-sm font-bold text-white mb-1">
                Google Drive Cloud Asset
              </h4>
              <p className="text-xs text-slate-400 mb-4 font-mono break-all max-w-sm">
                {photoItem.googleDriveLink}
              </p>
              <a
                href={driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
              >
                <span>Open in Google Drive</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <p className="text-slate-400 text-xs">No media available.</p>
          )}
        </div>

        {/* Footer Details */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3 text-xs">
          {/* 4-Item Audit Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/70">
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Uploaded By:</span>
              <strong className="text-white text-xs flex items-center gap-1 mt-0.5 truncate">
                <User className="w-3 h-3 text-blue-400 shrink-0" />
                <span>{employeeName || 'Assigned Employee'}</span>
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Upload Date:</span>
              <strong className="text-white font-mono text-xs mt-0.5 block">
                {formatDateDisplay(photoItem.capturedAt)}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Asset:</span>
              <strong className="text-white text-xs mt-0.5 block truncate">
                {photoItem.assetType} {photoItem.assetNumber ? `(${photoItem.assetNumber})` : ''}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Upload Type:</span>
              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 mt-0.5">
                Weekly Photo Update
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px]">Condition:</span>
                <ConditionBadge condition={photoItem.condition} size="sm" />
              </div>
            </div>

            {/* Storage Location Badge */}
            <div className="flex items-center gap-2">
              {photoItem.photoUrl && (
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Storage: Permanent IndexedDB Database</span>
                </span>
              )}
              {driveUrl && (
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-950/70 text-indigo-300 border border-indigo-800/60 flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Storage: Google Drive Cloud</span>
                </span>
              )}
            </div>
          </div>

          {photoItem.fileName && (
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>File Name: <strong className="text-slate-200">{photoItem.fileName}</strong></span>
              <span>• Size: <strong className="text-slate-200">{formatFileSize(photoItem.fileSize)}</strong></span>
              {photoItem.storagePath && (
                <span>• DB Key: <code className="text-blue-400 font-mono">{photoItem.storagePath}</code></span>
              )}
            </div>
          )}

          {photoItem.notes && (
            <div className="w-full text-[11px] text-slate-300 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
              <strong className="text-slate-400">Auditor Notes: </strong>
              {photoItem.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
