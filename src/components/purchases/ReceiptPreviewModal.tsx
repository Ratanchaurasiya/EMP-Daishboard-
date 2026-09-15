import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { PurchaseRecord } from '../../types';
import {
  X,
  Download,
  Printer,
  ExternalLink,
  Edit,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  Calendar,
  IndianRupee,
  ShoppingBag,
  Building,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface ReceiptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: PurchaseRecord | null;
  onOpenUpload: (purchaseId: string) => void;
  onRemoveReceipt?: (purchaseId: string) => void;
}

export const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  isOpen,
  onClose,
  purchase,
  onOpenUpload,
  onRemoveReceipt,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  if (!isOpen || !purchase) return null;
  if (typeof document === 'undefined') return null;

  const receiptUrl = purchase.invoiceFileUrl;
  const fileName = purchase.invoiceFileName || `Receipt-${purchase.purchaseNumber}`;
  const isImage = receiptUrl?.startsWith('data:image/') || fileName.match(/\.(jpeg|jpg|png|webp|gif)$/i);
  const isPdf = receiptUrl?.startsWith('data:application/pdf') || fileName.endsWith('.pdf');

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
            <head><title>Receipt - ${purchase.purchaseNumber}</title></head>
            <body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh;">
              <img src="${receiptUrl}" style="max-width:100%; max-height:100vh;" onload="window.print();window.close()" />
            </body>
          </html>
        `);
        win.document.close();
      }
    } else {
      window.print();
    }
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden flex flex-col max-h-[88vh] my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center border border-amber-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Purchase Receipt & Bill Voucher
                </h2>
                <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/25">
                  {purchase.purchaseNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {purchase.brand} {purchase.modelName} ({purchase.deviceType}) •{' '}
                {purchase.vendor || 'Supplier'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenUpload(purchase.id);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition-colors cursor-pointer"
              title="Replace or update this receipt"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Update Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-bar with Metadata */}
        <div className="px-6 py-2.5 bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-300">
            <span>
              <strong>Receipt/Invoice:</strong>{' '}
              <span className="font-mono font-semibold text-slate-900 dark:text-white">
                {purchase.invoiceNumber || 'N/A'}
              </span>
            </span>
            <span>
              <strong>Date:</strong> {purchase.invoiceDate || purchase.purchaseDate || 'N/A'}
            </span>
            <span>
              <strong>Total Cost:</strong>{' '}
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                {formatCurrency(purchase.grandTotalCost)}
              </span>
            </span>
            {fileName && (
              <span className="text-slate-400 truncate max-w-xs" title={fileName}>
                📄 {fileName}
              </span>
            )}
          </div>

          {/* Viewer Controls */}
          {isImage && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleZoomOut}
                className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono px-1">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                title="Reset Zoom"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Viewer Canvas */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/20 dark:bg-black/40 min-h-[360px]">
          {receiptUrl ? (
            isImage ? (
              <div className="overflow-auto max-h-full max-w-full flex items-center justify-center">
                <img
                  src={receiptUrl}
                  alt={`Receipt for ${purchase.purchaseNumber}`}
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                  className="max-h-[60vh] object-contain transition-transform duration-150 rounded shadow-md border border-slate-300 dark:border-slate-700"
                />
              </div>
            ) : isPdf ? (
              <div className="w-full h-full flex flex-col items-center justify-center space-y-4 py-8">
                <div className="w-16 h-16 rounded-2xl bg-red-500/15 text-red-500 flex items-center justify-center border border-red-500/30 shadow-md">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {fileName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    PDF format purchase receipt document
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <a
                    href={receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open PDF in New Window
                  </a>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download File
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {fileName}
                </p>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow"
                >
                  <Download className="w-4 h-4" />
                  Download Receipt
                </button>
              </div>
            )
          ) : (
            <div className="text-center py-12 space-y-3">
              <FileText className="w-12 h-12 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No receipt file attached yet
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenUpload(purchase.id);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow"
              >
                + Upload Receipt Now
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            {onRemoveReceipt && receiptUrl && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this attached receipt?')) {
                    onRemoveReceipt(purchase.id);
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Receipt</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {receiptUrl && (
              <>
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
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
