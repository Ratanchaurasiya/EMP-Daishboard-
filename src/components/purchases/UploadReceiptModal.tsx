import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { PurchaseRecord } from '../../types';
import {
  X,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Check,
  Calendar,
  AlertCircle,
  Trash2,
  Eye,
  FileCheck,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface UploadReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseId?: string | null;
}

export const UploadReceiptModal: React.FC<UploadReceiptModalProps> = ({
  isOpen,
  onClose,
  purchaseId,
}) => {
  const { purchases, updatePurchaseRecord } = useApp();

  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string>('');
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [receiptDate, setReceiptDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [receiptFileUrl, setReceiptFileUrl] = useState<string>('');
  const [fileSizeStr, setFileSizeStr] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize or update selection when modal opens or purchaseId changes
  useEffect(() => {
    if (!isOpen) {
      setSaveSuccess(false);
      setPreviewError('');
      return;
    }

    const targetId = purchaseId || (purchases.length > 0 ? purchases[0].id : '');
    setSelectedPurchaseId(targetId);

    const record = purchases.find(p => p.id === targetId);
    if (record) {
      setReceiptNumber(record.invoiceNumber || '');
      setReceiptDate(record.invoiceDate || record.purchaseDate || new Date().toISOString().split('T')[0]);
      setReceiptFileName(record.invoiceFileName || '');
      setReceiptFileUrl(record.invoiceFileUrl || '');
      setFileSizeStr('');
    } else {
      setReceiptNumber('');
      setReceiptDate(new Date().toISOString().split('T')[0]);
      setReceiptFileName('');
      setReceiptFileUrl('');
      setFileSizeStr('');
    }
  }, [isOpen, purchaseId, purchases]);

  // Handle dropdown selection change
  const handlePurchaseSelect = (id: string) => {
    setSelectedPurchaseId(id);
    const record = purchases.find(p => p.id === id);
    if (record) {
      setReceiptNumber(record.invoiceNumber || '');
      setReceiptDate(record.invoiceDate || record.purchaseDate || new Date().toISOString().split('T')[0]);
      setReceiptFileName(record.invoiceFileName || '');
      setReceiptFileUrl(record.invoiceFileUrl || '');
      setFileSizeStr('');
    }
  };

  const processFile = (file: File) => {
    setPreviewError('');

    // Check size (under 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setPreviewError('File size is too large. Please select a receipt under 10MB.');
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
    if (!selectedPurchaseId) {
      setPreviewError('Please select a purchase order.');
      return;
    }

    if (!receiptFileUrl && !receiptNumber.trim()) {
      setPreviewError('Please attach a receipt file or enter a receipt number.');
      return;
    }

    updatePurchaseRecord(selectedPurchaseId, {
      invoiceNumber: receiptNumber.trim() || undefined,
      invoiceDate: receiptDate || undefined,
      invoiceFileName: receiptFileName || undefined,
      invoiceFileUrl: receiptFileUrl || undefined,
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 900);
  };

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const currentPurchase = purchases.find(p => p.id === selectedPurchaseId);
  const isImage = receiptFileUrl.startsWith('data:image/') || receiptFileName.match(/\.(jpeg|jpg|png|webp|gif)$/i);
  const isPdf = receiptFileUrl.startsWith('data:application/pdf') || receiptFileName.endsWith('.pdf');

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden flex flex-col max-h-[88vh] my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/20 dark:via-transparent border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Add Purchase Receipt / Bill
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                रसीद / बिल अपलोड करें (Attach proof of purchase & billing receipt)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
          {previewError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{previewError}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span className="font-semibold">Receipt successfully saved and attached!</span>
            </div>
          )}

          {/* Purchase Order Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Purchase Order / Device
            </label>
            {purchaseId ? (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
                <span className="font-bold font-mono text-slate-900 dark:text-white">
                  {currentPurchase?.purchaseNumber}
                </span>{' '}
                —{' '}
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {currentPurchase?.brand} {currentPurchase?.modelName}
                </span>{' '}
                ({currentPurchase?.deviceType}) •{' '}
                <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                  {formatCurrency(currentPurchase?.grandTotalCost || 0)}
                </span>
              </div>
            ) : (
              <select
                value={selectedPurchaseId}
                onChange={e => handlePurchaseSelect(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
              >
                {purchases.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.purchaseNumber} — {p.brand} {p.modelName} ({p.deviceType}) [
                    {formatCurrency(p.grandTotalCost)}]
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Receipt Info: Number & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Receipt / Invoice / Bill No.
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={e => setReceiptNumber(e.target.value)}
                  placeholder="e.g. REC-9821 or INV-2026-01"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Receipt / Bill Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={receiptDate}
                  onChange={e => setReceiptDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Upload Receipt File (रसीद की फ़ोटो या PDF)
            </label>

            {!receiptFileUrl ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-slate-300 dark:border-slate-700 hover:border-amber-500/50 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto mb-2">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Click to select or drag & drop receipt file
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports Images (PNG, JPG, WEBP) or PDF documents (Max: 10MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {isImage ? (
                      <ImageIcon className="w-5 h-5 text-amber-500 shrink-0" />
                    ) : (
                      <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                    )}
                    <div className="truncate text-xs">
                      <span className="font-semibold text-slate-900 dark:text-white block truncate">
                        {receiptFileName || 'receipt_document'}
                      </span>
                      {fileSizeStr && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {fileSizeStr}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Preview Thumbnail for Image */}
                {isImage && (
                  <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900/5 max-h-48 flex items-center justify-center">
                    <img
                      src={receiptFileUrl}
                      alt="Receipt Preview"
                      className="max-h-48 object-contain w-auto rounded"
                    />
                  </div>
                )}

                {/* Badge for PDF */}
                {isPdf && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2.5 text-xs text-red-600 dark:text-red-400">
                    <FileText className="w-5 h-5" />
                    <div>
                      <span className="font-bold block">PDF Document Attached</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {receiptFileName}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Save & Attach Receipt
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
