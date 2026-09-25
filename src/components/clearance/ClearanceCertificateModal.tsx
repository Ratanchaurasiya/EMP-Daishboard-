import React from 'react';
import { ExitClearanceRecord } from '../../types';
import { formatDateDisplay, formatCurrency } from '../../utils/formatters';
import {
  X,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  FileCheck,
  User,
  Clock,
  Sparkles,
} from 'lucide-react';

interface ClearanceCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ExitClearanceRecord | null;
}

export const ClearanceCertificateModal: React.FC<ClearanceCertificateModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  if (!isOpen || !record) return null;

  const handlePrint = () => {
    window.print();
  };

  const isCleared = record.status === 'Full & Final Approved' || record.status === 'Cleared';
  const totalSettledLiability = record.summary.totalEmployeeLiableAmount;
  const hasLiabilities = totalSettledLiability > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in my-auto text-xs overflow-hidden print:border-none print:shadow-none print:rounded-none">
        {/* Modal Controls - Hidden when Printing */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 print:hidden">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
            <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Official Asset Clearance Certificate</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Export PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Body */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-800 dark:text-slate-200 print:text-black print:p-8">
          {/* Certificate Header / Seal */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-200 dark:border-slate-700 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-bold text-xl shadow-md">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white print:text-black">
                  EASH ASSET MANAGEMENT
                </h1>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 print:text-slate-600 uppercase tracking-widest">
                  Hardware & IT Infrastructure Custody Division
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right bg-slate-50 dark:bg-slate-900/60 print:bg-slate-100 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                Certificate Identifier
              </span>
              <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 print:text-emerald-700">
                {record.clearanceCertificateNumber || `EASH-CERT-CLR-${record.id}`}
              </span>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Issue Date: {formatDateDisplay(record.clearedAt || record.updatedAt)}
              </div>
            </div>
          </div>

          {/* Title Banner */}
          <div className="text-center py-2">
            <h2 className="text-base font-extrabold uppercase tracking-wide text-slate-900 dark:text-white print:text-black">
              Full & Final Asset No-Dues Clearance Certificate
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              This official document certifies that the following employee has submitted, cleared, and reconciled all company-issued IT equipment and peripherals upon separation.
            </p>
          </div>

          {/* Employee & Separation Particulars */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 print:border-slate-300">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Employee Name</span>
              <strong className="text-xs font-bold text-slate-900 dark:text-white print:text-black">
                {record.employeeName}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Employee ID</span>
              <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 print:text-blue-800">
                {record.companyEmployeeNumber || record.employeeId}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Department / Role</span>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {record.department} • {record.designation || 'Staff'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Separation / Exit Date</span>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {formatDateDisplay(record.exitDate)} ({record.exitType})
              </span>
            </div>
          </div>

          {/* Itemized Asset Surrender Record */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Surrendered & Reconciled Asset Inventory ({record.items.length} Items)
              </h3>
              <span className="text-[10px] font-semibold text-slate-500">
                Return Deadline: {formatDateDisplay(record.returnDeadline)} ({record.clearanceWindowDays}-Day Window)
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden print:border-slate-300">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2 px-3">Asset Number</th>
                    <th className="py-2 px-3">Device / Model</th>
                    <th className="py-2 px-3">Asset Type</th>
                    <th className="py-2 px-3">Return Status</th>
                    <th className="py-2 px-3">Inspection Condition</th>
                    <th className="py-2 px-3 text-right">Settled Dues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 print:divide-slate-200">
                  {record.items.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                      <td className="py-2 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {item.assetNumber}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-900 dark:text-white">
                        {item.deviceName}
                        {item.serialNumber && (
                          <span className="block text-[10px] text-slate-400 font-mono">
                            SN: {item.serialNumber}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                        {item.assetType}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.returnStatus === 'Verified'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : item.returnStatus === 'Damaged'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : item.returnStatus === 'Missing'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.returnStatus}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                        {item.inspectionCondition || 'Verified Operational'}
                        {item.damageReason && (
                          <span className="block text-[10px] text-amber-600 dark:text-amber-400">
                            Issue: {item.damageReason}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold">
                        {item.liabilityAmount > 0 ? (
                          <span className="text-amber-600 dark:text-amber-400">
                            {formatCurrency(item.liabilityAmount)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">₹0 (Zero Dues)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dues / Settlement Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Full & Final Dues Settlement Statement
              </span>
              <div className="flex items-center gap-2 mt-1">
                {hasLiabilities ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Total Employee Liabilities Reconciled / Deducted from F&F:
                    </span>
                    <strong className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono">
                      {formatCurrency(totalSettledLiability)}
                    </strong>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      ZERO OUTSTANDING HARDWARE DUES • ALL ASSETS RETURNED IN GOOD FAITH
                    </span>
                  </>
                )}
              </div>
              {record.summary.totalCompanyCoveredAmount > 0 && (
                <p className="text-[10px] text-slate-500 mt-1">
                  * Company Policy Absorbed {formatCurrency(record.summary.totalCompanyCoveredAmount)} under standard fair wear & tear.
                </p>
              )}
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                Asset Clearance Status
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isCleared ? 'CLEARED & SETTLED' : record.status.toUpperCase()}</span>
              </span>
            </div>
          </div>

          {/* Admin Verification Sign-off & Seal */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>Digitally Authenticated by EASH IT Operations & Custody Desk</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed max-w-sm">
                This document is electronically generated and holds full authority under EASH Corporate Asset Governance. No physical signature required.
              </p>
            </div>

            <div className="text-left sm:text-right min-w-[200px]">
              <div className="h-10 border-b border-slate-300 dark:border-slate-700 flex items-end justify-end pb-1 font-serif italic text-slate-700 dark:text-slate-300 font-bold">
                {record.approvedByAdmin || 'IT Asset Administrator'}
              </div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mt-1">
                Authorized Admin Sign-Off
              </span>
              <span className="text-[10px] text-slate-500">
                Approved: {formatDateDisplay(record.clearedAt || record.updatedAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
