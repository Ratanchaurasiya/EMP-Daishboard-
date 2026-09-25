import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExitClearanceRecord } from '../../types';
import { formatDateDisplay } from '../../utils/formatters';
import {
  X,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Calendar,
  User,
  Building,
  Clock,
  Paperclip,
  Download,
  AlertTriangle,
  Laptop,
  Smartphone,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { EmployeeAvatar } from '../common/EmployeeAvatar';

interface ReviewExitRequestModalProps {
  clearance: ExitClearanceRecord;
  isOpen: boolean;
  onClose: () => void;
}

export const ReviewExitRequestModal: React.FC<ReviewExitRequestModalProps> = ({
  clearance,
  isOpen,
  onClose,
}) => {
  const { reviewExitRequest, employees, computers, assets, simCards } = useApp();

  const [activeTab, setActiveTab] = useState<'approve' | 'reject' | 'request_changes'>('approve');
  const [finalExitDate, setFinalExitDate] = useState<string>(
    clearance.exitRequest?.finalExitDate || clearance.exitRequest?.proposedExitDate || clearance.exitDate
  );
  const [adminRemarks, setAdminRemarks] = useState<string>(
    clearance.exitRequest?.adminRemarks || 'Exit request approved by administration. Proceed with asset handover.'
  );
  const [rejectionReason, setRejectionReason] = useState<string>(
    clearance.exitRequest?.rejectionReason || ''
  );
  const [changesNotes, setChangesNotes] = useState<string>(
    clearance.exitRequest?.changesRequestedNotes || ''
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const employee = employees.find(
    e => e.id === clearance.employeeId || e.employeeId === clearance.employeeId
  );

  const empComputers = computers.filter(
    c => c.assignedEmployeeId === clearance.employeeId || (employee && c.assignedEmployeeId === employee.id)
  );
  const empAssets = assets.filter(
    a => a.assignedEmployeeId === clearance.employeeId || (employee && a.assignedEmployeeId === employee.id)
  );
  const empSims = simCards.filter(
    s => s.assignedEmployeeId === clearance.employeeId || (employee && s.assignedEmployeeId === employee.id)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (activeTab === 'approve') {
      if (!finalExitDate) {
        setErrorMsg('Please specify the confirmed final exit date.');
        return;
      }
    } else if (activeTab === 'reject') {
      if (!rejectionReason.trim()) {
        setErrorMsg('Rejection reason is mandatory.');
        return;
      }
    } else if (activeTab === 'request_changes') {
      if (!changesNotes.trim()) {
        setErrorMsg('Remarks explaining requested changes are mandatory.');
        return;
      }
    }

    setIsSubmitting(true);
    const res = reviewExitRequest(clearance.id, activeTab, {
      finalExitDate,
      adminRemarks: adminRemarks.trim(),
      rejectionReason: rejectionReason.trim(),
      changesRequestedNotes: changesNotes.trim(),
    });
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to submit review action.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 animate-scale-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <EmployeeAvatar
              name={clearance.employeeName}
              photoUrl={employee?.photoUrl}
              size="md"
              status={employee?.status || 'Active'}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Review Exit Request: {clearance.employeeName}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  {clearance.companyEmployeeNumber || clearance.employeeId}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {clearance.department} &bull; {clearance.designation || 'Staff'} &bull; Joined:{' '}
                {clearance.joiningDate || employee?.joiningDate || 'N/A'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Request Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Employee Exit Request Details
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 block">Proposed Exit Date</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                  {formatDateDisplay(clearance.exitRequest?.proposedExitDate || clearance.exitDate)}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">Reason for Separation</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {clearance.exitRequest?.reason || clearance.exitType}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">Submitted At</span>
                <span className="text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                  {clearance.exitRequest?.requestedAt
                    ? new Date(clearance.exitRequest.requestedAt).toLocaleDateString('en-GB')
                    : formatDateDisplay(clearance.createdAt)}
                </span>
              </div>
            </div>

            {clearance.exitRequest?.remarks && (
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5">Employee Remarks</span>
                <p className="text-slate-700 dark:text-slate-300 italic text-[11px] bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
                  "{clearance.exitRequest.remarks}"
                </p>
              </div>
            )}

            {clearance.exitRequest?.supportingDocumentUrl && (
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {clearance.exitRequest.supportingDocumentName || 'Supporting_Document.pdf'}
                  </span>
                  {clearance.exitRequest.supportingDocumentSize && (
                    <span className="text-[10px] text-slate-400">
                      ({(clearance.exitRequest.supportingDocumentSize / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>
                <a
                  href={clearance.exitRequest.supportingDocumentUrl}
                  download={clearance.exitRequest.supportingDocumentName || 'exit-document'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-semibold text-[11px] transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download / View</span>
                </a>
              </div>
            )}
          </div>

          {/* 2. Assigned Assets Snapshot */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Assigned Assets Pending Clearance ({clearance.items.length} items)
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                Will enter 2–5 days offboarding window
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <Laptop className="w-4 h-4 mx-auto text-blue-500 mb-0.5" />
                <span className="text-slate-500 text-[10px] block">Laptops/PCs</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {empComputers.length}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <Layers className="w-4 h-4 mx-auto text-indigo-500 mb-0.5" />
                <span className="text-slate-500 text-[10px] block">Peripherals & Phones</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {empAssets.length}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <Smartphone className="w-4 h-4 mx-auto text-emerald-500 mb-0.5" />
                <span className="text-slate-500 text-[10px] block">SIM Fleet</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {empSims.length}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Decision Tabs */}
          <div className="pt-2">
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 text-[11px]">
              Admin Action
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('approve')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'approve'
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/40'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Exit</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reject')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'reject'
                    ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-500/40'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>Reject Exit</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('request_changes')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'request_changes'
                    ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-500/40'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Request Changes</span>
              </button>
            </div>
          </div>

          {/* Form Action Specific Fields */}
          <form onSubmit={handleSubmit} className="space-y-3 pt-2">
            {activeTab === 'approve' && (
              <>
                <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-[11px] space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Exit Approval Protocol</span>
                  </div>
                  <p>
                    Approving will change employee status to <strong>Exited</strong> and move them to
                    the <strong>Exit History</strong> archive. All asset assignments, SIM details,
                    and documentation will remain 100% preserved.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 text-[11px]">
                    Confirmed Final Exit Date <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      required
                      value={finalExitDate}
                      onChange={e => setFinalExitDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 text-[11px]">
                    Admin Approval Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={adminRemarks}
                    onChange={e => setAdminRemarks(e.target.value)}
                    placeholder="e.g. Exit approved. Employee has provided 30 days notice. Assets to be surrendered by exit date."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </>
            )}

            {activeTab === 'reject' && (
              <div>
                <label className="block font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1 text-[11px]">
                  Reason for Rejection <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="e.g. Incomplete handover of critical project milestone or unserved mandatory bond period. Please consult HR."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-rose-300 dark:border-rose-800/80 rounded-xl p-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
                />
              </div>
            )}

            {activeTab === 'request_changes' && (
              <div>
                <label className="block font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1 text-[11px]">
                  Specify Changes Requested <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={changesNotes}
                  onChange={e => setChangesNotes(e.target.value)}
                  placeholder="e.g. Please revise proposed exit date to accommodate 30-day contractual notice period (earliest: 2026-10-25), or attach signed resignation PDF."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-amber-300 dark:border-amber-800/80 rounded-xl p-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-white font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 ${
                  activeTab === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                    : activeTab === 'reject'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                    : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                }`}
              >
                {activeTab === 'approve' && <CheckCircle2 className="w-4 h-4" />}
                {activeTab === 'reject' && <XCircle className="w-4 h-4" />}
                {activeTab === 'request_changes' && <RefreshCw className="w-4 h-4" />}
                <span>
                  {isSubmitting
                    ? 'Processing...'
                    : activeTab === 'approve'
                    ? 'Confirm & Approve Exit'
                    : activeTab === 'reject'
                    ? 'Confirm Rejection'
                    : 'Send Change Request'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
