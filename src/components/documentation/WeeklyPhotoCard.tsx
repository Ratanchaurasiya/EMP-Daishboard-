import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ExternalLink,
  FolderOpen,
  Camera,
  Eye,
  Pencil,
  Trash2,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Flag,
  MessageSquare,
  X,
  Check,
  Laptop,
  Smartphone,
  Headphones,
  Keyboard,
  Mouse,
  FileImage,
  FileText,
  Download,
  Database,
  Link2,
} from 'lucide-react';
import { AssetPhotoItem, WeeklyAssetPhotoRecord, WeeklyUploadStatus } from '../../types';
import { ConditionBadge } from '../common/Badge';
import { formatDateDisplay, formatFileSize } from '../../utils/formatters';
import { PhotoLightboxModal } from './PhotoLightboxModal';
import { useApp } from '../../context/AppContext';
import { assetCoreDB } from '../../db/indexedDB';

interface WeeklyPhotoCardProps {
  record: WeeklyAssetPhotoRecord;
  showEmployeeHeader?: boolean;
  filterAssetNumber?: string;
  onEdit?: (record: WeeklyAssetPhotoRecord) => void;
  onDelete?: (recordId: string) => void;
}

export const WeeklyPhotoCard: React.FC<WeeklyPhotoCardProps> = ({
  record,
  showEmployeeHeader = true,
  filterAssetNumber,
  onEdit,
  onDelete,
}) => {
  const { userRole, currentUser, updateWeeklyPhotoRecord, deleteWeeklyPhotoRecord, showToast } = useApp();
  const isAdmin = userRole === 'admin' && currentUser?.role !== 'employee';

  const displayedPhotos = useMemo(() => {
    const photos = record?.assetPhotos || [];
    if (!filterAssetNumber || filterAssetNumber === 'all') {
      return photos;
    }
    return photos.filter(
      p =>
        p?.assetNumber?.toLowerCase() === filterAssetNumber.toLowerCase() ||
        p?.assetId === filterAssetNumber ||
        p?.assetType?.toLowerCase() === filterAssetNumber.toLowerCase()
    );
  }, [record?.assetPhotos, filterAssetNumber]);

  // Permission: Employee can remove photo/link ONLY from their own assigned asset; Admin can remove from any
  const isEmployeeOwner = Boolean(
    (currentUser?.employeeId && (currentUser.employeeId === record.employeeCode || currentUser.employeeId === record.employeeId)) ||
    (currentUser?.id && (currentUser.id === record.employeeId || currentUser.id === record.employeeCode))
  );

  const canRemoveAssetDoc: boolean = isAdmin || isEmployeeOwner;

  const [selectedPhoto, setSelectedPhoto] = useState<AssetPhotoItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [photoToDeleteId, setPhotoToDeleteId] = useState<string | null>(null);

  // Admin Review State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [reviewStatusChoice, setReviewStatusChoice] = useState<WeeklyUploadStatus>(
    record.status || record.reviewStatus || 'Verified'
  );
  const [reviewRemarks, setReviewRemarks] = useState<string>(record.adminRemarks || '');

  const currentStatus: WeeklyUploadStatus = record.status || record.reviewStatus || 'Verified';

  const handleUpdateStatus = (newStatus: WeeklyUploadStatus, remarks?: string) => {
    updateWeeklyPhotoRecord(record.id, {
      status: newStatus,
      reviewStatus: newStatus,
      reviewedBy: currentUser?.name || 'Administrator',
      reviewedAt: new Date().toISOString(),
      adminRemarks: remarks !== undefined ? remarks : (record.adminRemarks || ''),
    });
    showToast(`Weekly upload marked as ${newStatus}`, 'success');
    setIsReviewModalOpen(false);
  };

  const handleRemoveAssetDocumentation = (photoId: string) => {
    const photos = record?.assetPhotos || [];
    const photoToRemove = photos.find(p => p.id === photoId);
    if (!photoToRemove) return;

    // Delete stored file from IndexedDB if present
    if (photoToRemove.storagePath) {
      const fileId = photoToRemove.storagePath.replace('indexeddb://uploadedFiles/', '');
      assetCoreDB.deleteUploadedFile(fileId).catch(() => {});
    }

    const remainingPhotos = photos.filter(p => p.id !== photoId);

    if (remainingPhotos.length === 0) {
      deleteWeeklyPhotoRecord(record.id);
      showToast(
        `Removed documentation for ${photoToRemove.assetType} ${photoToRemove.assetNumber}. (Asset assignment remains intact)`,
        'success'
      );
    } else {
      updateWeeklyPhotoRecord(record.id, {
        assetPhotos: remainingPhotos,
      });
      showToast(
        `Removed documentation for ${photoToRemove.assetType} ${photoToRemove.assetNumber}. (Asset assignment remains intact)`,
        'success'
      );
    }
    setPhotoToDeleteId(null);
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'Laptop':
      case 'Desktop':
        return <Laptop className="w-3.5 h-3.5 text-blue-500" />;
      case 'Mobile Phone':
        return <Smartphone className="w-3.5 h-3.5 text-pink-500" />;
      case 'Keyboard':
        return <Keyboard className="w-3.5 h-3.5 text-amber-500" />;
      case 'Mouse':
        return <Mouse className="w-3.5 h-3.5 text-purple-500" />;
      case 'Headset':
        return <Headphones className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <FileImage className="w-3.5 h-3.5 text-indigo-500" />;
    }
  };

  const handleDownloadFile = (photo: AssetPhotoItem) => {
    if (!photo.photoUrl) return;
    const a = document.createElement('a');
    a.href = photo.photoUrl;
    a.download = photo.fileName || `${photo.assetType}_${photo.assetNumber}_${record.inspectionDate}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const driveUrl = record.googleDriveLink
    ? record.googleDriveLink.startsWith('http')
      ? record.googleDriveLink
      : `https://${record.googleDriveLink}`
    : null;

  return (
    <>
      <div className="rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-all hover:shadow-md">
        {/* Header Bar */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Upload Type Badge */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
              <Camera className="w-3.5 h-3.5 text-indigo-500" />
              <span>Weekly Photo Update</span>
            </span>

            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 flex items-center gap-1.5 shadow-2xs">
              <Calendar className="w-3.5 h-3.5" />
              <span>{record.weekLabel}</span>
            </span>

            {/* Uploaded By */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Uploaded By:</span>
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-500" />
                {record.employeeName}
              </span>
              {record.employeeCode && (
                <span className="font-mono text-[10px] text-slate-400 font-normal">({record.employeeCode})</span>
              )}
            </div>

            {/* Upload Date */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Upload Date:</span>
              <strong className="text-slate-900 dark:text-white font-mono font-bold">
                {formatDateDisplay(record.inspectionDate)}
              </strong>
            </div>

            {/* Asset Tag in Header */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Asset:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {displayedPhotos.map(p => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1 font-bold text-slate-900 dark:text-white"
                  >
                    {getAssetIcon(p.assetType)}
                    <span>{p.assetType}</span>
                    {p.assetNumber && (
                      <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                        ({p.assetNumber})
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Status Badge in Header */}
            {currentStatus === 'Verified' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Verified</span>
              </span>
            ) : currentStatus === 'Pending Review' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-2xs animate-pulse">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Pending Review</span>
              </span>
            ) : currentStatus === 'Needs Attention' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-2xs">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span>Needs Attention</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
                <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                <span>{currentStatus}</span>
              </span>
            )}

            {record.conductedBy && record.conductedBy !== record.employeeName && (
              <span className="text-[11px] text-slate-400 hidden lg:inline">
                • Verified By: <span className="font-semibold text-slate-600 dark:text-slate-400">{record.conductedBy}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Global Drive Folder Button */}
            {driveUrl ? (
              <a
                href={driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 transition-colors shadow-2xs cursor-pointer"
                title="Open Google Drive audit folder"
              >
                <FolderOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Drive Folder</span>
                <ExternalLink className="w-3 h-3 ml-0.5 text-indigo-400" />
              </a>
            ) : null}

            {/* Admin Quick Review & Verification Actions */}
            {isAdmin && (
              <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-2">
                {currentStatus !== 'Verified' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('Verified')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-2xs cursor-pointer"
                    title="Mark as Verified & Approved"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setReviewStatusChoice(currentStatus === 'Needs Attention' ? 'Verified' : 'Needs Attention');
                    setReviewRemarks(record.adminRemarks || '');
                    setIsReviewModalOpen(true);
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer ${
                    currentStatus === 'Needs Attention'
                      ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                  title="Change review status or send remarks to employee"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                  <span>{currentStatus === 'Needs Attention' ? 'Edit Remarks' : 'Review'}</span>
                </button>
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(record)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Edit weekly record"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}

                {onDelete && (
                  <>
                    {confirmDelete ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onDelete(record.id)}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white hover:bg-rose-500"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(false)}
                          className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:text-slate-200"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Delete weekly record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Admin Review / Feedback Notice Banner */}
        {(record.adminRemarks || currentStatus === 'Needs Attention') && (
          <div className={`px-5 py-3 text-xs border-b flex items-start justify-between gap-3 ${
            currentStatus === 'Needs Attention'
              ? 'bg-rose-50/90 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900/60 text-rose-950 dark:text-rose-100'
              : currentStatus === 'Verified'
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-950 dark:text-emerald-100'
              : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 text-amber-950 dark:text-amber-100'
          }`}>
            <div className="flex items-start gap-2.5">
              {currentStatus === 'Needs Attention' ? (
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold uppercase tracking-wider text-[10px]">
                    Admin Review ({record.reviewedBy || 'IT Admin'}{record.reviewedAt ? ` • ${formatDateDisplay(record.reviewedAt)}` : ''}):
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    currentStatus === 'Needs Attention'
                      ? 'bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200'
                      : 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                  }`}>
                    Status: {currentStatus}
                  </span>
                </div>
                <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">
                  {record.adminRemarks || 'Document flagged for attention by the administrator.'}
                </p>
              </div>
            </div>

            {onEdit && (isEmployeeOwner || isAdmin) && (
              <button
                type="button"
                onClick={() => onEdit(record)}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-2xs transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Update / Re-upload</span>
              </button>
            )}
          </div>
        )}

        {/* Remarks if any */}
        {record.overallRemarks && (
          <div className="px-5 py-2.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50/40 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-800/60">
            <strong className="text-slate-400 uppercase text-[10px] tracking-wider mr-1.5">
              Audit Remarks:
            </strong>
            <span>{record.overallRemarks}</span>
          </div>
        )}

        {/* Assigned Assets Upload Grid */}
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedPhotos.map(photo => {
              const hasFile = !!photo.photoUrl && photo.photoUrl.trim() !== '';
              const hasDrive = !!photo.googleDriveLink && photo.googleDriveLink.trim() !== '';
              const isImage = photo.fileType ? photo.fileType.startsWith('image/') : (photo.photoUrl ? photo.photoUrl.startsWith('data:image/') : true);

              const perAssetDriveUrl = photo.googleDriveLink
                ? photo.googleDriveLink.startsWith('http')
                  ? photo.googleDriveLink
                  : `https://${photo.googleDriveLink}`
                : null;

              return (
                <div
                  key={photo.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 overflow-hidden flex flex-col justify-between transition-all hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-xs"
                >
                  {/* Media / Preview Area */}
                  {hasFile ? (
                    <div className="relative h-36 w-full bg-slate-950 overflow-hidden group">
                      {isImage ? (
                        <img
                          src={photo.photoUrl}
                          alt={`${photo.assetType} ${photo.assetNumber}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                          onClick={() => setSelectedPhoto(photo)}
                        />
                      ) : (
                        <div
                          className="w-full h-full flex flex-col items-center justify-center p-4 text-slate-300 cursor-pointer"
                          onClick={() => setSelectedPhoto(photo)}
                        >
                          <FileText className="w-10 h-10 text-blue-400 mb-1" />
                          <p className="text-xs font-bold text-center truncate max-w-full">
                            {photo.fileName || 'Attached Document'}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {formatFileSize(photo.fileSize)}
                          </span>
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedPhoto(photo)}
                          className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 backdrop-blur-xs transition-colors"
                          title="Inspect File"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadFile(photo)}
                          className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 backdrop-blur-xs transition-colors"
                          title="Download File"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {canRemoveAssetDoc && (
                          <button
                            type="button"
                            onClick={() => setPhotoToDeleteId(photo.id)}
                            className="p-2 rounded-lg bg-rose-600/90 text-white hover:bg-rose-600 backdrop-blur-xs transition-colors"
                            title="Remove uploaded photo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Badges on Top */}
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <ConditionBadge condition={photo.condition} size="sm" />
                      </div>

                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-900/80 text-emerald-400 border border-emerald-500/30 backdrop-blur-xs flex items-center gap-1 shadow-xs">
                          <Database className="w-2.5 h-2.5" />
                          <span>IndexedDB Storage</span>
                        </span>
                      </div>
                    </div>
                  ) : hasDrive ? (
                    <div className="h-36 w-full bg-indigo-950/20 dark:bg-indigo-950/40 border-b border-indigo-200/50 dark:border-indigo-900/40 flex flex-col items-center justify-center p-4 text-center">
                      <FolderOpen className="w-8 h-8 text-indigo-500 mb-2" />
                      <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                        Google Drive Asset File
                      </span>
                      {perAssetDriveUrl && (
                        <a
                          href={perAssetDriveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 transition-colors shadow-2xs"
                        >
                          <span>Open File</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <span className="mt-2 px-2 py-0.5 rounded-md text-[9px] font-bold bg-indigo-900/40 text-indigo-300 border border-indigo-500/30">
                        Google Drive Cloud
                      </span>
                    </div>
                  ) : (
                    <div className="h-36 w-full bg-slate-100 dark:bg-slate-800/40 flex items-center justify-center text-slate-400 text-xs">
                      No file or link provided
                    </div>
                  )}

                  {/* Asset Details & Metadata */}
                  <div className="p-3 space-y-2 text-xs flex-1 flex flex-col justify-between">
                    <div>
                      {/* Asset Tag & Type */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          {getAssetIcon(photo.assetType)}
                          <span className="font-mono font-bold text-[11px] text-blue-600 dark:text-blue-400">
                            {photo.assetNumber}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {photo.assetType}
                        </span>
                      </div>

                      {/* Asset Name */}
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-1">
                        {photo.assetName || photo.assetType}
                      </p>

                      {/* File details */}
                      {hasFile && photo.fileName && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          📎 {photo.fileName} {photo.fileSize ? `(${formatFileSize(photo.fileSize)})` : ''}
                        </p>
                      )}

                      {/* Structured Upload Details */}
                      <div className="mt-2.5 p-2 rounded-lg bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Uploaded By:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                            <User className="w-3 h-3 text-blue-500 shrink-0" />
                            <span className="truncate max-w-[130px]">{record.employeeName || 'Assigned Employee'}</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Upload Date:</span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                            {photo.capturedAt ? formatDateDisplay(photo.capturedAt) : formatDateDisplay(record.inspectionDate)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Asset:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            {getAssetIcon(photo.assetType)}
                            <span>{photo.assetType}</span>
                            {photo.assetNumber && (
                              <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold">({photo.assetNumber})</span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Upload Type:</span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                            Weekly Photo Update
                          </span>
                        </div>
                      </div>

                      {/* Individual Drive Link if provided */}
                      {perAssetDriveUrl && (
                        <div className="mt-1.5">
                          <a
                            href={perAssetDriveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            <Link2 className="w-3 h-3" />
                            <span className="truncate max-w-[200px]">Asset Google Drive Link</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        </div>
                      )}

                      {/* Notes */}
                      {photo.notes && (
                        <p
                          className="text-[10px] text-slate-500 dark:text-slate-400 italic mt-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-800"
                          title={photo.notes}
                        >
                          Note: {photo.notes}
                        </p>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {photo.capturedAt ? formatDateDisplay(photo.capturedAt) : formatDateDisplay(record.inspectionDate)}
                      </span>

                      <div className="flex items-center gap-1">
                        {hasFile && (
                          <>
                            <button
                              type="button"
                              onClick={() => setSelectedPhoto(photo)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                              title="Inspect File Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadFile(photo)}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                              title="Download File"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {perAssetDriveUrl && (
                          <a
                            href={perAssetDriveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                            title="Open Google Drive Link"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {/* Remove / Delete Option for Employee (own asset) & Admin (any asset) */}
                        {canRemoveAssetDoc && (
                          photoToDeleteId === photo.id ? (
                            <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/70 p-1 rounded-md border border-rose-200 dark:border-rose-900 animate-in fade-in">
                              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">Delete?</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveAssetDocumentation(photo.id)}
                                className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded hover:bg-rose-500 transition-colors"
                                title="Confirm removal of uploaded photo / link"
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setPhotoToDeleteId(null)}
                                className="px-1 py-0.5 text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPhotoToDeleteId(photo.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                              title={hasFile ? "Remove uploaded photo/file" : "Remove Google Drive link"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lightbox viewer */}
      {selectedPhoto && (
        <PhotoLightboxModal
          isOpen={!!selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          photoItem={selectedPhoto}
          employeeName={record.employeeName}
          weekLabel={record.weekLabel}
          canDelete={canRemoveAssetDoc}
          onDeletePhoto={handleRemoveAssetDocumentation}
        />
      )}

      {/* Admin Review & Remarks Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111827] rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  <span>Admin Review & Action</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {record.employeeName} • {record.weekLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Select Review Status:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Verified', 'Needs Attention', 'Pending Review'] as WeeklyUploadStatus[]).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setReviewStatusChoice(st)}
                      className={`p-2 rounded-xl text-center font-bold text-xs border transition-all cursor-pointer ${
                        reviewStatusChoice === st
                          ? st === 'Verified'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : st === 'Needs Attention'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Admin Feedback / Instructions for Employee:
                </label>
                <textarea
                  rows={3}
                  value={reviewRemarks}
                  onChange={e => setReviewRemarks(e.target.value)}
                  placeholder={
                    reviewStatusChoice === 'Needs Attention'
                      ? 'Specify what needs to be fixed, e.g. "Serial number tag on laptop is not legible, please re-upload a clear photo."'
                      : 'Add any remarks or confirmation notes...'
                  }
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(reviewStatusChoice, reviewRemarks)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Save Review
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
