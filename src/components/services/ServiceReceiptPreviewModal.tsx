import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ServiceRecord } from '../../types';
import {
  X,
  Download,
  Printer,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  FileText,
  Calendar,
  IndianRupee,
  Wrench,
  User,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency, formatDateDisplay } from '../../utils/formatters';

interface ServiceReceiptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ServiceRecord | null;
  onOpenUpload?: (recordId: string) => void;
}

export const ServiceReceiptPreviewModal: React.FC<ServiceReceiptPreviewModalProps> = ({
  isOpen,
  onClose,
  record,
  onOpenUpload,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  if (!isOpen || !record) return null;
  if (typeof document === 'undefined') return null;

  const receiptUrl = record.receiptFileUrl;
  const fileName = record.receiptFileName || `ServiceReceipt-${record.id}`;
  const isImage = Boolean(
    receiptUrl?.startsWith('data:image/') ||
    fileName.match(/\.(jpeg|jpg|png|webp|gif|svg)$/i)
  );
  const isPdf = Boolean(
    receiptUrl?.startsWith('data:application/pdf') ||
    fileName.endsWith('.pdf')
  );

  const handleDownload = () => {
    if (!receiptUrl) return;
    const a = document.createElement('a');
    a.href = receiptUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    if (isImage && receiptUrl) {
      const win = window.open('');
      if (win) {
        win.document.write(`
          <html>
            <head><title>Service Receipt - ${record.id}</title></head>
            <body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh;">
              <img src="${receiptUrl}" style="max-width:100%; max-height:100vh;" onload="window.print();window.close()" />
            </body>
          </html>
        `);
        win.document.close();
      }
    } else if (receiptUrl) {
      const win = window.open(receiptUrl, '_blank');
      if (win) {
        win.focus();
      }
    }
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Repair Receipt &amp; Service Invoice
                </h2>
                <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
                  {record.id}
                </span>
                {record.receiptNumber && (
                  <span className="font-mono text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    Bill #: {record.receiptNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {record.assetNumber} &bull; {record.deviceName} &bull; Technician: {record.technician || 'IT Support'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenUpload && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenUpload(record.id);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-blue-200 dark:border-blue-900/50 transition-colors cursor-pointer"
              >
                <span>Replace Receipt</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metadata Details Bar */}
        <div className="px-6 py-3 bg-blue-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <IndianRupee className="w-3 h-3 text-emerald-500" />
              Repair Cost / Amount
            </span>
            <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              {formatCurrency(record.serviceCost || 0)}
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-blue-500" />
              Service / Bill Date
            </span>
            <div className="font-medium text-slate-800 dark:text-slate-200">
              {formatDateDisplay(record.receiptDate || record.serviceDate)}
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <User className="w-3 h-3 text-indigo-500" />
              Employee / Custodian
            </span>
            <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
              {record.employeeName} ({record.employeeId})
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Wrench className="w-3 h-3 text-amber-500" />
              Work &amp; Category
            </span>
            <div className="font-medium text-slate-800 dark:text-slate-200 truncate" title={record.workPerformed || record.problemCategory}>
              {record.workPerformed || record.problemCategory}
            </div>
          </div>
        </div>

        {/* Dedicated Service Provider & Electronic Shop Info Bar */}
        {(record.serviceProviderShopName || record.technician || record.serviceProviderPhone) && (
          <div className="px-6 py-2.5 bg-amber-500/10 dark:bg-amber-950/20 border-b border-amber-200/50 dark:border-amber-900/30 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white flex items-center gap-1">
                <span>🏬 Service Provider / Shop</span>
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {record.serviceProviderShopName || 'Local Tech Repair Center'}
              </span>
              {record.technician && (
                <span className="text-slate-600 dark:text-slate-300">
                  &bull; Technician: <strong className="font-semibold text-slate-800 dark:text-slate-200">{record.technician}</strong>
                </span>
              )}
            </div>

            {record.serviceProviderPhone && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                  {record.serviceProviderPhone}
                </span>
                <a
                  href={`https://wa.me/${record.serviceProviderPhone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-2xs transition-colors"
                >
                  <span>WhatsApp</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Document Viewer Canvas */}
        <div className="flex-1 bg-slate-900/90 dark:bg-black/90 p-4 overflow-auto flex items-center justify-center min-h-[360px] max-h-[520px] relative">
          {receiptUrl ? (
            isPdf ? (
              <div className="w-full h-[480px] flex flex-col items-center justify-center text-white bg-slate-950/60 rounded-xl p-4 border border-slate-800">
                <iframe
                  src={receiptUrl}
                  title={`Receipt Document ${record.id}`}
                  className="w-full h-full rounded-lg border border-slate-700 bg-white"
                />
              </div>
            ) : isImage ? (
              <div
                className="flex items-center justify-center transition-transform duration-150 ease-out"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <img
                  src={receiptUrl}
                  alt={`Service receipt for ${record.id}`}
                  className="max-w-full max-h-[460px] object-contain rounded-lg shadow-2xl border border-slate-700"
                />
              </div>
            ) : (
              <div className="text-center p-8 text-white space-y-3">
                <FileText className="w-16 h-16 text-slate-400 mx-auto opacity-70" />
                <div>
                  <h4 className="font-bold text-sm text-slate-200">{fileName}</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Uploaded receipt document is ready for download or offline viewing.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Receipt File</span>
                </button>
              </div>
            )
          ) : (
            <div className="text-center p-8 text-slate-400 space-y-3">
              <FileText className="w-16 h-16 mx-auto opacity-30 text-slate-500" />
              <div>
                <h4 className="font-bold text-sm text-slate-300">No Receipt Document Attached</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  A receipt or invoice document has not been uploaded for this service record yet.
                </p>
              </div>
              {onOpenUpload && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenUpload(record.id);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md cursor-pointer transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span>Upload Receipt Now</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Action Controls Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Zoom controls for images */}
          {receiptUrl && isImage && (
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 text-xs">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
                className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer"
                title="Reset Zoom"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {receiptUrl && (
              <>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
