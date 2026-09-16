import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { ServiceRecord } from '../../types';
import {
  X,
  UploadCloud,
  FileText,
  Check,
  Calendar,
  AlertCircle,
  Trash2,
  Eye,
  IndianRupee,
  Wrench,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface UploadServiceReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordId?: string | null;
  onReceiptSaved?: (record: ServiceRecord) => void;
}

export const UploadServiceReceiptModal: React.FC<UploadServiceReceiptModalProps> = ({
  isOpen,
  onClose,
  recordId,
  onReceiptSaved,
}) => {
  const { serviceRecords, serviceProviders, updateServiceRecord, showToast } = useApp();

  const [selectedRecordId, setSelectedRecordId] = useState<string>('');
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [receiptDate, setReceiptDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [receiptFileUrl, setReceiptFileUrl] = useState<string>('');
  const [repairCost, setRepairCost] = useState<number>(0);
  const [shopName, setShopName] = useState<string>('');
  const [technicianName, setTechnicianName] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [workPerformed, setWorkPerformed] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [fileSizeStr, setFileSizeStr] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setSaveSuccess(false);
      setPreviewError('');
      return;
    }

    const targetId = recordId || (serviceRecords.length > 0 ? serviceRecords[0].id : '');
    setSelectedRecordId(targetId);

    const record = serviceRecords.find(s => s.id === targetId);
    if (record) {
      setReceiptNumber(record.receiptNumber || '');
      setReceiptDate(record.receiptDate || record.serviceDate || new Date().toISOString().split('T')[0]);
      setReceiptFileName(record.receiptFileName || '');
      setReceiptFileUrl(record.receiptFileUrl || '');
      setRepairCost(Number(record.serviceCost) || 0);
      setShopName(record.serviceProviderShopName || '');
      setTechnicianName(record.technician || '');
      setContactPhone(record.serviceProviderPhone || '');
      setWorkPerformed(record.workPerformed || '');
      setNotes(record.resolution || record.remarks || '');
      setFileSizeStr(record.receiptFileSize ? `${Math.round(record.receiptFileSize / 1024)} KB` : '');
    } else {
      setReceiptNumber('');
      setReceiptDate(new Date().toISOString().split('T')[0]);
      setReceiptFileName('');
      setReceiptFileUrl('');
      setRepairCost(0);
      setShopName('');
      setTechnicianName('');
      setContactPhone('');
      setWorkPerformed('');
      setNotes('');
      setFileSizeStr('');
    }
  }, [isOpen, recordId, serviceRecords]);

  const handleRecordSelect = (id: string) => {
    setSelectedRecordId(id);
    const record = serviceRecords.find(s => s.id === id);
    if (record) {
      setReceiptNumber(record.receiptNumber || '');
      setReceiptDate(record.receiptDate || record.serviceDate || new Date().toISOString().split('T')[0]);
      setReceiptFileName(record.receiptFileName || '');
      setReceiptFileUrl(record.receiptFileUrl || '');
      setRepairCost(Number(record.serviceCost) || 0);
      setShopName(record.serviceProviderShopName || '');
      setTechnicianName(record.technician || '');
      setContactPhone(record.serviceProviderPhone || '');
      setWorkPerformed(record.workPerformed || '');
      setNotes(record.resolution || record.remarks || '');
      setFileSizeStr(record.receiptFileSize ? `${Math.round(record.receiptFileSize / 1024)} KB` : '');
    }
  };

  const handleProviderSelect = (providerId: string) => {
    if (!providerId) return;
    const p = serviceProviders.find(sp => sp.id === providerId);
    if (p) {
      setShopName(p.shopName);
      setTechnicianName(p.technicianName);
      setContactPhone(p.whatsappNumber || p.phoneNumber);
    }
  };

  const processFile = (file: File) => {
    setPreviewError('');

    // Check size limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      setPreviewError('File size is too large. Please select a receipt under 10MB.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|gif|pdf)$/i)) {
      setPreviewError('Unsupported file format. Please upload JPG, PNG, or PDF.');
      return;
    }

    const kb = Math.round(file.size / 1024);
    setFileSizeStr(kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);
    setReceiptFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptFileUrl(reader.result as string);
    };
    reader.onerror = () => {
      setPreviewError('Failed to read file. Please try another image or PDF.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveFile = () => {
    setReceiptFileName('');
    setReceiptFileUrl('');
    setFileSizeStr('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordId) {
      setPreviewError('Please select a service record.');
      return;
    }

    const currentRecord = serviceRecords.find(s => s.id === selectedRecordId);
    if (!currentRecord) {
      setPreviewError('Service record not found.');
      return;
    }

    const fileType = receiptFileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
    const fileSize = receiptFileUrl ? Math.round((receiptFileUrl.length * 3) / 4) : undefined;

    updateServiceRecord(selectedRecordId, {
      receiptNumber: receiptNumber.trim() || undefined,
      receiptDate: receiptDate || undefined,
      receiptFileName: receiptFileName || undefined,
      receiptFileUrl: receiptFileUrl || undefined,
      receiptFileType: receiptFileUrl ? fileType : undefined,
      receiptFileSize: fileSize,
      serviceCost: Number(repairCost) || 0,
      serviceProviderShopName: shopName.trim() || undefined,
      technician: technicianName.trim() || undefined,
      serviceProviderPhone: contactPhone.trim() || undefined,
      workPerformed: workPerformed.trim() || undefined,
      resolution: notes.trim() || undefined,
    });

    setSaveSuccess(true);
    showToast(`Receipt, service provider and repair details updated for ticket ${selectedRecordId}`, 'success');

    if (onReceiptSaved) {
      onReceiptSaved({
        ...currentRecord,
        receiptNumber: receiptNumber.trim() || undefined,
        receiptDate: receiptDate || undefined,
        receiptFileName: receiptFileName || undefined,
        receiptFileUrl: receiptFileUrl || undefined,
        receiptFileType: receiptFileUrl ? fileType : undefined,
        receiptFileSize: fileSize,
        serviceCost: Number(repairCost) || 0,
        serviceProviderShopName: shopName.trim() || undefined,
        technician: technicianName.trim() || currentRecord?.technician || 'Technician',
        serviceProviderPhone: contactPhone.trim() || undefined,
        workPerformed: workPerformed.trim() || currentRecord?.workPerformed || 'Maintenance & Repair',
        resolution: notes.trim() || currentRecord?.resolution || '',
      });
    }

    setTimeout(() => {
      onClose();
    }, 600);
  };

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const currentRecord = serviceRecords.find(s => s.id === selectedRecordId);
  const isImage = receiptFileUrl?.startsWith('data:image/') || receiptFileName.match(/\.(jpeg|jpg|png|webp|gif)$/i);
  const isPdf = receiptFileUrl?.startsWith('data:application/pdf') || receiptFileName.endsWith('.pdf');

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Upload Service Receipt / Repair Invoice
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Attach proof of repair expense &amp; electric shop vendor bill
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {saveSuccess && (
          <div className="m-5 mb-0 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">Receipt &amp; repair details successfully saved to database!</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
          {/* Service Record Selector (if opened without specific record or to switch) */}
          {serviceRecords.length > 1 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Service Ticket *
              </label>
              <select
                value={selectedRecordId}
                onChange={e => handleRecordSelect(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {serviceRecords.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.id} — {s.assetNumber} ({s.deviceName}) • {s.employeeName} • {formatCurrency(s.serviceCost || 0)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Current Ticket Details Banner */}
          {currentRecord && (
            <div className="p-3 bg-blue-50/50 dark:bg-slate-900/50 border border-blue-100 dark:border-blue-900/40 rounded-xl text-xs flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-white">
                  {currentRecord.deviceName} ({currentRecord.assetNumber})
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Assigned: {currentRecord.employeeName} &bull; Category: {currentRecord.problemCategory}
                </p>
              </div>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                {formatCurrency(currentRecord.serviceCost || 0)}
              </span>
            </div>
          )}

          {/* SERVICE PROVIDER & ELECTRIC SHOP SECTION */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Service Provider / Electric Shop Details
              </span>
              {serviceProviders.length > 0 && (
                <select
                  onChange={e => handleProviderSelect(e.target.value)}
                  className="text-[11px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1 text-slate-700 dark:text-slate-300"
                >
                  <option value="">Quick Pick Vendor...</option>
                  {serviceProviders.map(p => (
                    <option key={p.id} value={p.id}>{p.shopName} ({p.technicianName})</option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                  Shop / Service Provider Name
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={e => setShopName(e.target.value)}
                  placeholder="e.g. QuickFix Chip & Board Lab"
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                  Technician / Person Name
                </label>
                <input
                  type="text"
                  value={technicianName}
                  onChange={e => setTechnicianName(e.target.value)}
                  placeholder="e.g. Suresh Kumar"
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                  Contact / WhatsApp Number
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  placeholder="e.g. +91 98765-11223"
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                  Work Performed Summary
                </label>
                <input
                  type="text"
                  value={workPerformed}
                  onChange={e => setWorkPerformed(e.target.value)}
                  placeholder="e.g. Motherboard chip replacement"
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Repair Cost Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Repair / Service Cost (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-xl shadow-2xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <IndianRupee className="w-4 h-4" />
              </div>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={repairCost}
                onChange={e => setRepairCost(Number(e.target.value))}
                placeholder="Enter total repair amount in INR (₹)"
                className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Receipt Info: Number & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Receipt / Bill / Invoice No.
              </label>
              <input
                type="text"
                value={receiptNumber}
                onChange={e => setReceiptNumber(e.target.value)}
                placeholder="e.g. REC-2026-9901"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Receipt Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={receiptDate}
                  onChange={e => setReceiptDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* File Upload Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Upload Receipt File (JPG, PNG, PDF &lt; 10MB)
            </label>

            {!receiptFileUrl ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-300 dark:border-slate-700 hover:border-emerald-400 bg-slate-50/50 dark:bg-slate-900/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Click to select or drag &amp; drop receipt file
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supported: JPEG, PNG, WEBP, and PDF documents (Max 10MB)
                </p>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                      {receiptFileName || 'receipt_document'}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span>{isPdf ? 'PDF Document' : isImage ? 'Image File' : 'Attachment'}</span>
                      {fileSizeStr && (
                        <>
                          <span>&bull;</span>
                          <span>{fileSizeStr}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {previewError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 mt-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{previewError}</span>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Receipt &amp; Cost</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
