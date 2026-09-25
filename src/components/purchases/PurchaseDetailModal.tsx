import React from 'react';
import { createPortal } from 'react-dom';
import { PurchaseRecord } from '../../types';
import {
  X,
  Laptop,
  Monitor,
  ShoppingBag,
  DollarSign,
  Calendar,
  Building2,
  FileText,
  User,
  Shield,
  Cpu,
  HardDrive,
  CheckCircle2,
  ExternalLink,
  Printer,
  Edit2,
  FileCheck,
  Smartphone,
  Tv,
  Keyboard,
  Mouse,
  Headphones,
  Plug,
  Package,
  Layers,
  Tag,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface PurchaseDetailModalProps {
  isOpen: boolean;
  purchase: PurchaseRecord | null;
  onClose: () => void;
  onEdit?: (purchase: PurchaseRecord) => void;
  onOpenUploadReceipt?: (purchaseId: string) => void;
  onOpenPreviewReceipt?: (purchase: PurchaseRecord) => void;
}

const getAssetIcon = (type: string) => {
  switch (type) {
    case 'Laptop':
      return Laptop;
    case 'PC':
      return Monitor;
    case 'Mobile Phone':
      return Smartphone;
    case 'Monitor':
      return Tv;
    case 'Keyboard':
      return Keyboard;
    case 'Mouse':
      return Mouse;
    case 'Headset':
      return Headphones;
    case 'Docking Station':
      return Plug;
    default:
      return Package;
  }
};

export const PurchaseDetailModal: React.FC<PurchaseDetailModalProps> = ({
  isOpen,
  purchase,
  onClose,
  onEdit,
  onOpenUploadReceipt,
  onOpenPreviewReceipt,
}) => {
  if (!isOpen || !purchase) return null;
  if (typeof document === 'undefined') return null;

  const handlePrint = () => {
    window.print();
  };

  const AssetIcon = getAssetIcon(purchase.deviceType);
  const qty = purchase.quantity || 1;
  const isComputer = purchase.deviceType === 'Laptop' || purchase.deviceType === 'PC';
  const isPhone = purchase.deviceType === 'Mobile Phone';
  const isMonitor = purchase.deviceType === 'Monitor';

  return createPortal(
    <div className="fixed inset-0 z-[9999] p-2.5 sm:p-4 md:p-5 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center print:p-0 print:bg-white animate-modal-backdrop">
      <div className="relative w-full h-full bg-white dark:bg-[#0b101b] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800/90 overflow-hidden flex flex-col animate-modal-enter print:max-h-none print:shadow-none print:border-none">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 print:border-b-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30">
              <AssetIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Purchase #{purchase.purchaseNumber}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {purchase.deviceType}
                </span>
                {qty > 1 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    × {qty} Units
                  </span>
                )}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    purchase.status === 'Assigned'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : purchase.status === 'In Stock'
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {purchase.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Purchased on {purchase.purchaseDate || 'N/A'} {purchase.vendor ? `from ${purchase.vendor}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              title="Print Voucher"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Printer className="w-5 h-5" />
            </button>
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(purchase);
                }}
                title="Edit Record"
                className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Cost Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Asset Purchase Cost
                </span>
                {qty > 1 && (
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    {qty} units
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                ₹{(purchase.deviceCost || 0).toLocaleString('en-IN')}
              </p>
              <div className="text-xs text-slate-500 mt-0.5 flex items-center justify-between">
                <span>{purchase.brand} {purchase.modelName}</span>
                {qty > 1 && purchase.unitCost && (
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    (₹{purchase.unitCost.toLocaleString('en-IN')} each)
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40">
              <span className="text-xs font-semibold uppercase text-purple-600 dark:text-purple-400">
                Bundled Items ({purchase.accessories?.length || 0})
              </span>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">
                ₹{(purchase.totalAccessoriesCost || 0).toLocaleString('en-IN')}
              </p>
              <span className="text-xs text-purple-600/80 dark:text-purple-400/80">
                Additional peripherals & accessories
              </span>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/15 via-amber-500/10 to-emerald-500/15 border border-amber-500/30">
              <span className="text-xs font-semibold uppercase text-amber-700 dark:text-amber-400">
                Grand Total Purchase Cost
              </span>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                ₹{(purchase.grandTotalCost || 0).toLocaleString('en-IN')}
              </p>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                All items & accessories included
              </span>
            </div>
          </div>

          {/* Device / Asset Specifications & Identity */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
              <AssetIcon className="w-4 h-4 text-amber-500" />
              {purchase.deviceType} Specifications & Procurement Identity
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Asset Category</span>
                <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <AssetIcon className="w-3.5 h-3.5 text-amber-500" />
                  {purchase.deviceType}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Brand & Model</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {purchase.brand} {purchase.modelName}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Model Number</span>
                <span className="font-semibold text-slate-900 dark:text-white">{purchase.modelNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Serial / Ident. #</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {purchase.serialNumber || (qty > 1 ? 'Multi-unit purchase' : 'N/A - Non-serialized')}
                </span>
              </div>

              {/* Dynamic specs based on asset category */}
              {isComputer && (
                <>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Processor / CPU</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{purchase.processor || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Memory (RAM)</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{purchase.ram || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Storage</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{purchase.storage || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Operating System</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{purchase.os || 'N/A'}</span>
                  </div>
                </>
              )}

              {isPhone && (
                <>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Phone / SIM Number</span>
                    <span className="font-semibold text-slate-900 dark:text-white font-mono">{purchase.phoneNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block mb-0.5">IMEI Number</span>
                    <span className="font-semibold text-slate-900 dark:text-white font-mono">{purchase.imeiNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Storage / RAM</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {purchase.storage || purchase.ram || 'Standard'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block mb-0.5">OS / Platform</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{purchase.os || 'Android / iOS'}</span>
                  </div>
                </>
              )}

              {isMonitor && (
                <>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Screen Size</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{purchase.screenSize || 'N/A'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Display Specifications</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{purchase.specsDetails || 'Full HD / IPS / HDMI & DP'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Quantity</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{qty} Units</span>
                  </div>
                </>
              )}

              {!isComputer && !isPhone && !isMonitor && (
                <>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Technical Specifications</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{purchase.specsDetails || 'Standard Enterprise Grade'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Quantity Purchased</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{qty} Units</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Unit Cost</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      ₹{(purchase.unitCost || purchase.deviceCost || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </>
              )}

              {/* Warranty & Invoicing details */}
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Warranty Details</span>
                <span className="font-semibold text-slate-900 dark:text-white">{purchase.warrantyPeriod || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Warranty Expiry</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {purchase.warrantyExpiryDate || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Vendor / Supplier</span>
                <span className="font-semibold text-slate-900 dark:text-white">{purchase.vendor || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Invoice / Bill #</span>
                <span className="font-semibold text-slate-900 dark:text-white">{purchase.invoiceNumber || 'N/A'}</span>
              </div>
            </div>

            {/* Generated / Assigned Asset Numbers if auto-registered */}
            {purchase.assignedAssetIds && purchase.assignedAssetIds.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
                  <Tag className="w-3.5 h-3.5 text-amber-500" />
                  Registered Fleet Asset Tag(s):
                </span>
                <div className="flex flex-wrap gap-2">
                  {purchase.assignedAssetIds.map((tagId, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    >
                      {tagId}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Accessories Breakdown Table */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-755 bg-white dark:bg-slate-800/40">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
              <ShoppingBag className="w-4 h-4 text-purple-500" />
              Bundled Accessories Breakdown ({purchase.accessories?.length || 0})
            </h3>

            {!purchase.accessories || purchase.accessories.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                No separate accessories bundled with this purchase order.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Accessory Type</th>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Row Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {purchase.accessories.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-medium text-slate-900 dark:text-white">{item.type}</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{item.name || '-'}</td>
                        <td className="py-2 px-3 text-center font-semibold text-slate-900 dark:text-white">
                          {item.quantity}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-300">
                          ₹{(item.unitCost || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-emerald-400">
                          ₹{(item.totalCost || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-200 dark:border-slate-700 font-bold">
                    <tr>
                      <td colSpan={5} className="py-3 px-3 text-right text-slate-700 dark:text-slate-300">
                        Total Accessories Cost:
                      </td>
                      <td className="py-3 px-3 text-right text-purple-600 dark:text-purple-400">
                        ₹{(purchase.totalAccessoriesCost || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Allocation / Custody & Invoices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
                <User className="w-3.5 h-3.5 text-blue-500" />
                Custody & Inventory Deployment
              </span>
              <div className="text-xs space-y-1.5">
                <p className="text-slate-600 dark:text-slate-300">
                  <strong>Assigned Employee:</strong> {purchase.assignedEmployeeName || 'Unassigned (In IT Store)'}
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  <strong>Current Status:</strong> {purchase.status}
                </p>
                {purchase.notes && (
                  <p className="text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                    <strong>Notes:</strong> {purchase.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Receipt & Invoice Attachment Card */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-500" />
                  Receipt & Bill Attachment
                </span>
                {purchase.invoiceFileUrl && onOpenUploadReceipt && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenUploadReceipt(purchase.id);
                    }}
                    className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    Change Receipt
                  </button>
                )}
              </div>
              {purchase.invoiceFileUrl ? (
                <div className="text-xs space-y-2.5">
                  <p className="text-slate-600 dark:text-slate-300 truncate">
                    <strong>File:</strong> {purchase.invoiceFileName || 'Receipt Bill Document'}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {onOpenPreviewReceipt ? (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenPreviewReceipt(purchase);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs transition-colors cursor-pointer"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        View Full Receipt
                      </button>
                    ) : (
                      <a
                        href={purchase.invoiceFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View / Download Invoice
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400">
                    No receipt or bill document uploaded for this purchase record yet.
                  </p>
                  {onOpenUploadReceipt && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenUploadReceipt(purchase.id);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      + Upload Receipt / Bill Now
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
