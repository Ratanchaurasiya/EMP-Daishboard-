import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Upload,
  Camera,
  Calendar,
  ExternalLink,
  Laptop,
  Smartphone,
  Headphones,
  Keyboard,
  Mouse,
  Plus,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle2,
  FolderOpen,
  FileImage,
  FileText,
  Download,
  Database,
  Link2,
} from 'lucide-react';
import {
  AssetCondition,
  AssetPhotoItem,
  AssetType,
  WeeklyAssetPhotoRecord,
} from '../../types';
import { getWeekInfo, compressImageFile } from '../../utils/dateWeekUtils';
import { getEmployeeAssignedCompanyAssets } from '../../utils/assetUtils';
import { formatFileSize } from '../../utils/formatters';
import { PhotoLightboxModal } from './PhotoLightboxModal';

interface WeeklyPhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmployeeId?: string;
  initialAssetNumber?: string;
  editingRecord?: WeeklyAssetPhotoRecord | null;
}

interface TempAssetCard {
  id: string; // Unique temporary card ID
  assetId?: string;
  assetType: AssetType | 'Desktop' | 'Laptop';
  assetNumber: string;
  assetName: string;
  photoUrl: string; // Base64 data URL
  fileName?: string; // Original uploaded file name
  fileSize?: number; // File size in bytes
  fileType?: string; // MIME type
  uploadType?: 'file' | 'drive' | 'both';
  googleDriveLink?: string; // Per-asset Google Drive link
  condition: AssetCondition;
  notes: string;
}

export const WeeklyPhotoUploadModal: React.FC<WeeklyPhotoUploadModalProps> = ({
  isOpen,
  onClose,
  initialEmployeeId,
  initialAssetNumber,
  editingRecord,
}) => {
  const {
    employees,
    computers,
    assets,
    addWeeklyPhotoRecord,
    updateWeeklyPhotoRecord,
    showToast,
    currentUser,
  } = useApp();

  // Selected Employee
  const [selectedEmpId, setSelectedEmpId] = useState<string>(() => {
    if (editingRecord?.employeeId) return editingRecord.employeeId;
    if (initialEmployeeId) {
      const match = employees.find(e => e.id === initialEmployeeId || e.employeeId === initialEmployeeId);
      return match ? match.id : initialEmployeeId;
    }
    return employees[0]?.id || '';
  });

  // Target asset number for visual scroll/highlight
  const [targetAssetNumber, setTargetAssetNumber] = useState<string | undefined>(initialAssetNumber);

  // Date & Week State
  const [inspectionDate, setInspectionDate] = useState<string>(
    editingRecord?.inspectionDate || new Date().toISOString().substring(0, 10)
  );
  const weekInfo = getWeekInfo(inspectionDate);

  // Overall Google Drive Link (for entire folder/audit)
  const [overallDriveLink, setOverallDriveLink] = useState<string>(
    editingRecord?.googleDriveLink || ''
  );

  // Inspector Name
  const [conductedBy, setConductedBy] = useState<string>(
    editingRecord?.conductedBy || currentUser?.name || 'IT Administrator'
  );

  // Overall Remarks
  const [overallRemarks, setOverallRemarks] = useState<string>(
    editingRecord?.overallRemarks || ''
  );

  // Asset Cards for this audit
  const [assetCards, setAssetCards] = useState<TempAssetCard[]>([]);

  // Drag state tracker for dropzones
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);

  // Lightbox preview for inspecting an uploaded photo/document
  const [lightboxPhoto, setLightboxPhoto] = useState<AssetPhotoItem | null>(null);

  // File input refs map
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Sync state whenever modal opens or props change
  useEffect(() => {
    if (!isOpen) return;
    const target = editingRecord?.employeeId || initialEmployeeId;
    if (target) {
      const match = employees.find(e => e.id === target || e.employeeId === target);
      if (match) {
        setSelectedEmpId(match.id);
      } else {
        setSelectedEmpId(target);
      }
    } else if (!selectedEmpId && employees.length > 0) {
      setSelectedEmpId(employees[0].id);
    }

    setTargetAssetNumber(initialAssetNumber);

    if (editingRecord) {
      setInspectionDate(editingRecord.inspectionDate);
      setOverallDriveLink(editingRecord.googleDriveLink || '');
      setConductedBy(editingRecord.conductedBy || currentUser?.name || 'IT Administrator');
      setOverallRemarks(editingRecord.overallRemarks || '');
    } else {
      setInspectionDate(new Date().toISOString().substring(0, 10));
      setOverallDriveLink('');
      setConductedBy(currentUser?.name || 'IT Administrator');
      setOverallRemarks('');
    }
  }, [isOpen, initialEmployeeId, initialAssetNumber, editingRecord, employees, currentUser]);

  // Auto-scroll to target asset card if opened for a specific asset
  useEffect(() => {
    if (!isOpen || !targetAssetNumber || assetCards.length === 0) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`upload-option-${targetAssetNumber.toLowerCase()}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [isOpen, targetAssetNumber, assetCards.length]);

  const selectedEmployee = employees.find(
    e => e.id === selectedEmpId || e.employeeId === selectedEmpId
  );

  // Populate asset cards: STRICTLY ONLY assigned assets for the selected employee
  useEffect(() => {
    if (!isOpen) return;

    if (editingRecord) {
      // Editing existing record: load stored items
      const cards: TempAssetCard[] = editingRecord.assetPhotos.map(p => ({
        id: p.id || Math.random().toString(36).substring(2, 9),
        assetId: p.assetId,
        assetType: p.assetType,
        assetNumber: p.assetNumber,
        assetName: p.assetName,
        photoUrl: p.photoUrl || '',
        fileName: p.fileName,
        fileSize: p.fileSize,
        fileType: p.fileType,
        uploadType: p.uploadType,
        googleDriveLink: p.googleDriveLink || '',
        condition: p.condition,
        notes: p.notes || '',
      }));
      setAssetCards(cards);
      return;
    }

    if (!selectedEmployee) {
      setAssetCards([]);
      return;
    }

    // Dynamic Discovery: Check actual assigned assets for selected employee
    const assignedAssets = getEmployeeAssignedCompanyAssets(selectedEmployee, computers, assets);

    // Map assigned assets into audit cards; if none assigned, provide a default workstation verification card
    let cards: TempAssetCard[] = assignedAssets.map(a => ({
      id: `card-${a.id}`,
      assetId: a.originalComputerId || a.originalAssetId || a.id,
      assetType: a.assetType,
      assetNumber: a.assetNumber,
      assetName: a.deviceName || `${a.brand} ${a.model}`,
      photoUrl: '',
      fileName: undefined,
      fileSize: undefined,
      fileType: undefined,
      uploadType: 'file',
      googleDriveLink: '',
      condition: a.condition || 'Good',
      notes: '',
    }));

    if (cards.length === 0) {
      cards = [
        {
          id: `card-general-${Date.now()}`,
          assetType: 'Laptop',
          assetNumber: 'WRK-DOC-01',
          assetName: 'Workstation & Physical Equipment Verification',
          photoUrl: '',
          fileName: undefined,
          fileSize: undefined,
          fileType: undefined,
          uploadType: 'file',
          googleDriveLink: '',
          condition: 'Good',
          notes: 'Weekly workstation & hardware physical inspection',
        },
      ];
    }

    setAssetCards(cards);
  }, [isOpen, selectedEmpId, editingRecord, selectedEmployee, computers, assets]);

  const handleAddCustomCard = () => {
    const newCardId = `card-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setAssetCards(prev => [
      ...prev,
      {
        id: newCardId,
        assetType: 'Other',
        assetNumber: `DOC-${String(prev.length + 1).padStart(3, '0')}`,
        assetName: 'Additional Asset / Equipment Document',
        photoUrl: '',
        fileName: undefined,
        fileSize: undefined,
        fileType: undefined,
        uploadType: 'file',
        googleDriveLink: '',
        condition: 'Good',
        notes: '',
      },
    ]);
  };

  const handleRemoveCard = (cardId: string) => {
    if (assetCards.length <= 1) {
      showToast('At least one verification item is required.', 'info');
      return;
    }
    setAssetCards(prev => prev.filter(c => c.id !== cardId));
  };

  if (!isOpen) return null;

  // Handle File Upload via Drop or Picker
  const handleFileUpload = async (cardId: string, file: File) => {
    try {
      showToast(`Processing & attaching "${file.name}"...`, 'info');
      
      let base64: string;
      if (file.type.startsWith('image/')) {
        base64 = await compressImageFile(file, 1280, 0.85);
      } else {
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read file contents'));
          reader.readAsDataURL(file);
        });
      }

      setAssetCards(prev =>
        prev.map(card =>
          card.id === cardId
            ? {
                ...card,
                photoUrl: base64,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type || 'application/octet-stream',
              }
            : card
        )
      );
      showToast(`File "${file.name}" successfully attached and ready for permanent database storage.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload file', 'error');
    }
  };

  const handleRemoveFile = (cardId: string) => {
    setAssetCards(prev =>
      prev.map(card =>
        card.id === cardId
          ? {
              ...card,
              photoUrl: '',
              fileName: undefined,
              fileSize: undefined,
              fileType: undefined,
            }
          : card
      )
    );
  };

  const handleUpdateDriveLink = (cardId: string, link: string) => {
    setAssetCards(prev =>
      prev.map(card => (card.id === cardId ? { ...card, googleDriveLink: link } : card))
    );
  };

  const handleUpdateCondition = (cardId: string, condition: AssetCondition) => {
    setAssetCards(prev =>
      prev.map(card => (card.id === cardId ? { ...card, condition } : card))
    );
  };

  const handleUpdateNotes = (cardId: string, notes: string) => {
    setAssetCards(prev =>
      prev.map(card => (card.id === cardId ? { ...card, notes } : card))
    );
  };

  const handleDownloadFile = (card: TempAssetCard) => {
    if (!card.photoUrl) return;
    const a = document.createElement('a');
    a.href = card.photoUrl;
    a.download = card.fileName || `${card.assetType}_${card.assetNumber}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployee) {
      showToast('Please select an employee.', 'error');
      return;
    }

    // Check that at least one assigned asset has either a file or a Google Drive link attached
    const validAssetCards = assetCards.filter(
      c => (c.photoUrl && c.photoUrl.trim() !== '') || (c.googleDriveLink && c.googleDriveLink.trim() !== '')
    );

    if (validAssetCards.length === 0) {
      showToast('Please upload a file or provide a Google Drive link for at least one assigned asset.', 'error');
      return;
    }

    const now = new Date().toISOString();
    const assetPhotoEntries: AssetPhotoItem[] = validAssetCards.map(c => {
      const hasFile = !!c.photoUrl && c.photoUrl.trim() !== '';
      const hasDrive = !!c.googleDriveLink && c.googleDriveLink.trim() !== '';
      
      let uploadType: 'file' | 'drive' | 'both' = 'file';
      if (hasFile && hasDrive) uploadType = 'both';
      else if (hasDrive) uploadType = 'drive';

      const fileId = `FILE-${c.id.replace('card-', '')}`;

      return {
        id: c.id,
        assetId: c.assetId,
        assetType: c.assetType,
        assetNumber: c.assetNumber,
        assetName: c.assetName,
        photoUrl: c.photoUrl || undefined,
        fileName: c.fileName,
        fileSize: c.fileSize,
        fileType: c.fileType,
        uploadType,
        googleDriveLink: c.googleDriveLink?.trim() || undefined,
        storageLocation: hasFile
          ? 'Permanent IndexedDB Secure Storage'
          : (hasDrive ? 'Google Drive Cloud' : undefined),
        storagePath: hasFile ? `indexeddb://uploadedFiles/${fileId}` : undefined,
        condition: c.condition,
        notes: c.notes.trim() || undefined,
        capturedAt: now,
      };
    });

    if (editingRecord) {
      const res = updateWeeklyPhotoRecord(editingRecord.id, {
        inspectionDate,
        weekNumber: weekInfo.weekNumber,
        year: weekInfo.year,
        weekLabel: weekInfo.weekLabel,
        weekStartDate: weekInfo.startDate,
        weekEndDate: weekInfo.endDate,
        googleDriveLink: overallDriveLink.trim() || undefined,
        conductedBy: conductedBy.trim() || currentUser?.name || 'IT Administrator',
        overallRemarks: overallRemarks.trim() || undefined,
        assetPhotos: assetPhotoEntries,
      });
      if (res.success) onClose();
    } else {
      const res = addWeeklyPhotoRecord({
        employeeId: selectedEmployee.id,
        employeeCode: selectedEmployee.employeeId,
        employeeName: selectedEmployee.name,
        department: selectedEmployee.department,
        designation: selectedEmployee.designation,
        weekNumber: weekInfo.weekNumber,
        year: weekInfo.year,
        weekLabel: weekInfo.weekLabel,
        weekStartDate: weekInfo.startDate,
        weekEndDate: weekInfo.endDate,
        inspectionDate,
        uploadDate: inspectionDate || now.substring(0, 10),
        status: 'Pending Review',
        googleDriveLink: overallDriveLink.trim() || undefined,
        conductedBy: conductedBy.trim() || currentUser?.name || selectedEmployee.name || 'Employee',
        overallRemarks: overallRemarks.trim() || undefined,
        assetPhotos: assetPhotoEntries,
      });
      if (res.success) onClose();
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'Laptop':
      case 'Desktop':
        return <Laptop className="w-4 h-4 text-blue-500" />;
      case 'Mobile Phone':
        return <Smartphone className="w-4 h-4 text-pink-500" />;
      case 'Keyboard':
        return <Keyboard className="w-4 h-4 text-amber-500" />;
      case 'Mouse':
        return <Mouse className="w-4 h-4 text-purple-500" />;
      case 'Headset':
        return <Headphones className="w-4 h-4 text-emerald-500" />;
      default:
        return <FileImage className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
        <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingRecord
                    ? 'Update Weekly Asset Upload & Audit'
                    : 'Weekly Asset Upload & Documentation'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upload visual documentation or Google Drive links for currently assigned company assets.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Top metadata grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Employee Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Employee <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedEmpId}
                  onChange={e => setSelectedEmpId(e.target.value)}
                  disabled={!!initialEmployeeId || !!editingRecord}
                  className="w-full text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:opacity-75"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeId}) — {emp.department}
                    </option>
                  ))}
                </select>
                {selectedEmployee && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Designation: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedEmployee.designation}</span>
                  </p>
                )}
              </div>

              {/* Inspection Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Inspection Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={inspectionDate}
                    onChange={e => setInspectionDate(e.target.value)}
                    required
                    className="w-full text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2.5 pl-9 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
                <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400 mt-1">
                  📅 {weekInfo.weekLabel}
                </p>
              </div>

              {/* Auditor / Conducted By */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Auditor / Conducted By
                </label>
                <input
                  type="text"
                  value={conductedBy}
                  onChange={e => setConductedBy(e.target.value)}
                  placeholder="e.g. IT Administrator / Auditor"
                  className="w-full text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Logged in permanent audit trail
                </p>
              </div>
            </div>

            {/* Overall Google Drive Folder Link (Optional Global Folder) */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Audit Drive Archive Folder (Optional)
                  </label>
                </div>
                {overallDriveLink && (
                  <a
                    href={overallDriveLink.startsWith('http') ? overallDriveLink : `https://${overallDriveLink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <span>Open Folder</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <input
                type="url"
                value={overallDriveLink}
                onChange={e => setOverallDriveLink(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/... (Overall folder link)"
                className="w-full text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Assigned Assets Upload Cards Section */}
            <div>
              {/* Telemetry Header */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-transparent dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-transparent border border-blue-200/80 dark:border-blue-900/60 mb-3 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-600 text-white shadow-xs shrink-0">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{assetCards.length} Assigned {assetCards.length === 1 ? 'Asset' : 'Assets'}</span>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold shadow-2xs">
                        {assetCards.length} Photo Upload {assetCards.length === 1 ? 'Option' : 'Options'}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      Number of upload options is automatically based on assets assigned to <strong>{selectedEmployee?.name || 'this employee'}</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddCustomCard}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800/80 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Extra File / Asset</span>
                  </button>
                  <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-white/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800/60 shadow-2xs">
                    {assetCards.length} {assetCards.length === 1 ? 'Upload Option' : 'Upload Options'}
                  </span>
                </div>
              </div>

              {assetCards.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-amber-300 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20 rounded-xl text-slate-600 dark:text-slate-300 text-xs space-y-2">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    0 Assets Currently Assigned to {selectedEmployee?.name || 'this employee'}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-xs">
                    The number of photo upload options is automatically based on the assets currently assigned to this employee.
                    Because 0 company assets are currently assigned, 0 photo upload options are available.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Quick Jump Pills for Multi-Asset Navigation (Never hides cards) */}
                  {assetCards.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin bg-slate-50/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5 mr-1">
                        <Camera className="w-3.5 h-3.5 text-blue-500" />
                        <span>Jump to Option:</span>
                      </span>
                      {assetCards.map((c, idx) => {
                        const hasDoc = !!c.photoUrl || !!c.googleDriveLink;
                        const isTarget = targetAssetNumber?.toLowerCase() === c.assetNumber.toLowerCase();
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setTargetAssetNumber(c.assetNumber);
                              const el = document.getElementById(`upload-option-${c.assetNumber.toLowerCase()}`);
                              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                              isTarget
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400'
                            }`}
                          >
                            <span className="font-mono text-[10px] opacity-75">Option {idx + 1}</span>
                            {getAssetIcon(c.assetType)}
                            <span className="font-bold max-w-[130px] truncate">{c.assetName}</span>
                            <span className="font-mono text-[10px] opacity-75">({c.assetNumber})</span>
                            {hasDoc ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* ALL Assigned Asset Upload Cards are ALWAYS Rendered Simultaneously */}
                  {assetCards.map((card, index) => {
                    const optionIndex = index + 1;
                    const isDragging = draggingCardId === card.id;
                    const hasFile = !!card.photoUrl;
                    const isImage = card.fileType ? card.fileType.startsWith('image/') : (card.photoUrl ? card.photoUrl.startsWith('data:image/') : true);
                    const isTargetAsset = targetAssetNumber && card.assetNumber.toLowerCase() === targetAssetNumber.toLowerCase();

                    return (
                      <div
                        key={card.id}
                        id={`upload-option-${card.assetNumber.toLowerCase()}`}
                        className={`p-4 rounded-xl space-y-3.5 transition-all ${
                          isTargetAsset
                            ? 'bg-blue-50/20 dark:bg-blue-950/20 border-2 border-blue-500 shadow-sm ring-2 ring-blue-500/10'
                            : 'bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800'
                        }`}
                      >
                        {/* Option Header with Prominent Asset Name */}
                        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-1 rounded-md text-xs font-black bg-blue-600 text-white shadow-2xs">
                                Upload Option {optionIndex} of {assetCards.length}
                              </span>
                              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60">
                                {card.assetNumber}
                              </span>
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                                {getAssetIcon(card.assetType)}
                                <span>{card.assetType}</span>
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                                Assigned Asset
                              </span>
                              {isTargetAsset && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                                  Selected Asset
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {assetCards.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCard(card.id)}
                                  className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                                  title="Remove this upload card"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {hasFile ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Uploaded</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>Pending</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Prominent Asset Name Display */}
                          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-700/60">
                            <span className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-wider block">
                              Assigned Asset Name:
                            </span>
                            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-0.5">
                              {card.assetName}
                            </h3>
                          </div>
                        </div>

                        {/* Dual Upload Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {/* Option 1: Drag & Drop File Upload */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Upload className="w-3.5 h-3.5 text-blue-500" />
                                <span>Upload Photo: <strong className="text-blue-600 dark:text-blue-400">{card.assetName}</strong></span>
                              </label>
                              {hasFile && (
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Attached</span>
                                </span>
                              )}
                            </div>

                            {/* Hidden file input */}
                            <input
                              id={`file-input-${card.id}`}
                              type="file"
                              accept="image/*, application/pdf, .pdf, .doc, .docx, .txt"
                              ref={el => {
                                fileInputRefs.current[card.id] = el;
                              }}
                              className="hidden"
                              onClick={e => {
                                (e.target as HTMLInputElement).value = '';
                              }}
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(card.id, file);
                                e.target.value = '';
                              }}
                            />

                            {hasFile ? (
                              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 space-y-2">
                                <div className="flex items-center gap-3">
                                  {isImage ? (
                                    <img
                                      src={card.photoUrl}
                                      alt={`${card.assetType} ${card.assetNumber}`}
                                      className="w-16 h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
                                      onClick={() =>
                                        setLightboxPhoto({
                                          id: card.id,
                                          assetType: card.assetType,
                                          assetNumber: card.assetNumber,
                                          assetName: card.assetName,
                                          photoUrl: card.photoUrl,
                                          fileName: card.fileName,
                                          fileSize: card.fileSize,
                                          fileType: card.fileType,
                                          storageLocation: 'Permanent IndexedDB Secure Storage',
                                          condition: card.condition,
                                          notes: card.notes,
                                          capturedAt: new Date().toISOString(),
                                        })
                                      }
                                    />
                                  ) : (
                                    <div className="w-16 h-16 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 flex flex-col items-center justify-center text-blue-600 dark:text-blue-400">
                                      <FileText className="w-6 h-6" />
                                      <span className="text-[9px] font-bold uppercase mt-1">Document</span>
                                    </div>
                                  )}

                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                      {card.fileName || `${card.assetType}_${card.assetNumber}.jpg`}
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                      Size: {formatFileSize(card.fileSize)}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                      {isImage && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setLightboxPhoto({
                                              id: card.id,
                                              assetType: card.assetType,
                                              assetNumber: card.assetNumber,
                                              assetName: card.assetName,
                                              photoUrl: card.photoUrl,
                                              fileName: card.fileName,
                                              fileSize: card.fileSize,
                                              fileType: card.fileType,
                                              storageLocation: 'Permanent IndexedDB Secure Storage',
                                              condition: card.condition,
                                              notes: card.notes,
                                              capturedAt: new Date().toISOString(),
                                            })
                                          }
                                          className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                        >
                                          <Eye className="w-3 h-3" />
                                          <span>Inspect</span>
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleDownloadFile(card)}
                                        className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                                      >
                                        <Download className="w-3 h-3" />
                                        <span>Download</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => fileInputRefs.current[card.id]?.click()}
                                        className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 flex items-center gap-1"
                                      >
                                        <span>Replace</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveFile(card.id)}
                                        className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        <span>Remove</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Storage Location Indicator */}
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/40 text-[10px] text-emerald-800 dark:text-emerald-300">
                                  <Database className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>Storage: <strong>Permanent IndexedDB Database</strong></span>
                                </div>
                              </div>
                            ) : (
                              <div
                                onClick={() => fileInputRefs.current[card.id]?.click()}
                                onDragOver={e => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setDraggingCardId(card.id);
                                }}
                                onDragEnter={e => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setDraggingCardId(card.id);
                                }}
                                onDragLeave={e => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setDraggingCardId(null);
                                }}
                                onDrop={e => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setDraggingCardId(null);
                                  const file = e.dataTransfer.files?.[0];
                                  if (file) handleFileUpload(card.id, file);
                                }}
                                className={`w-full h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all group ${
                                  isDragging
                                    ? 'border-blue-500 bg-blue-500/10 scale-[0.99]'
                                    : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 bg-white/50 dark:bg-slate-900/40 hover:bg-blue-50/30'
                                }`}
                              >
                                <div className="p-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mb-1 group-hover:scale-110 transition-transform">
                                  <Upload className="w-3.5 h-3.5" />
                                </div>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                  Upload photo for <span className="text-blue-600 dark:text-blue-400">{card.assetName}</span>
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  Tag: {card.assetNumber} • 1 photo for this asset (JPG, PNG, WEBP, PDF)
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Option 2: Google Drive File Link */}
                          <div className="space-y-1.5 flex flex-col justify-between">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                  <Link2 className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>2. Google Drive File Link</span>
                                </label>
                                {card.googleDriveLink && (
                                  <a
                                    href={card.googleDriveLink.startsWith('http') ? card.googleDriveLink : `https://${card.googleDriveLink}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                  >
                                    <span>Test Link</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>

                              <input
                                type="url"
                                value={card.googleDriveLink || ''}
                                onChange={e => handleUpdateDriveLink(card.id, e.target.value)}
                                placeholder={`https://drive.google.com/file/... (${card.assetType} link)`}
                                className="w-full text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                              />
                            </div>

                            {/* Storage Indicator */}
                            {card.googleDriveLink ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-800/40 text-[10px] text-indigo-800 dark:text-indigo-300">
                                <FolderOpen className="w-3 h-3 text-indigo-600 shrink-0" />
                                <span className="truncate">Storage: <strong>Google Drive Cloud</strong></span>
                              </div>
                            ) : (
                              <p className="text-[10px] text-slate-400 italic">
                                Paste a Google Drive link or share URL if hosted externally.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Condition and Notes Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                          {/* Condition Selection */}
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                              Inspected Condition
                            </label>
                            <div className="grid grid-cols-4 gap-1.5">
                              {(['New', 'Good', 'Fair', 'Damaged'] as AssetCondition[]).map(cond => {
                                const isSelected = card.condition === cond;
                                let activeClass = '';
                                if (cond === 'New') activeClass = 'bg-emerald-500 text-white border-emerald-600';
                                else if (cond === 'Good') activeClass = 'bg-blue-600 text-white border-blue-700';
                                else if (cond === 'Fair') activeClass = 'bg-amber-500 text-white border-amber-600';
                                else activeClass = 'bg-rose-600 text-white border-rose-700';

                                return (
                                  <button
                                    key={cond}
                                    type="button"
                                    onClick={() => handleUpdateCondition(card.id, cond)}
                                    className={`py-1 text-[11px] font-bold rounded border transition-all cursor-pointer ${
                                      isSelected
                                        ? activeClass
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                                    }`}
                                  >
                                    {cond}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Notes */}
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                              Verification Notes
                            </label>
                            <input
                              type="text"
                              value={card.notes}
                              onChange={e => handleUpdateNotes(card.id, e.target.value)}
                              placeholder={`Notes for ${card.assetNumber} (e.g. Serial tag verified, clean condition)...`}
                              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Overall Audit Remarks */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Overall Audit Remarks & Custody Notes
              </label>
              <textarea
                value={overallRemarks}
                onChange={e => setOverallRemarks(e.target.value)}
                rows={2}
                placeholder="Overall summary of the weekly inspection, physical integrity, custody verification..."
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={assetCards.length === 0}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingRecord ? 'Update Audit Record' : 'Save Weekly Asset Upload'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Lightbox for inspecting photo fullscreen */}
      {lightboxPhoto && (
        <PhotoLightboxModal
          isOpen={!!lightboxPhoto}
          onClose={() => setLightboxPhoto(null)}
          photoItem={lightboxPhoto}
          employeeName={selectedEmployee?.name}
          weekLabel={weekInfo.weekLabel}
        />
      )}
    </>
  );
};
