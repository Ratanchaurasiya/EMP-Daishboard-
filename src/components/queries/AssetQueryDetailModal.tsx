import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AssetQuery, AssetQueryStatus } from '../../types';
import { formatDateDisplay } from '../../utils/formatters';
import {
  X,
  Star,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Laptop,
  Check,
  Send,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface AssetQueryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: AssetQuery | null;
}

export const AssetQueryDetailModal: React.FC<AssetQueryDetailModalProps> = ({
  isOpen,
  onClose,
  query,
}) => {
  const {
    userRole,
    currentUser,
    acknowledgeAssetQuery,
    updateAssetQueryStatus,
    reportQueryStillUnresolved,
    toggleStarAssetQuery,
    showToast,
  } = useApp();

  const [stillUnresolvedNotes, setStillUnresolvedNotes] = useState<string>('');
  const [showUnresolvedForm, setShowUnresolvedForm] = useState<boolean>(false);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [selectedNextStatus, setSelectedNextStatus] = useState<AssetQueryStatus>('In Progress');

  if (!isOpen || !query) return null;

  const isAdmin = userRole === 'admin';
  const isOwner = Boolean(
    currentUser &&
      (currentUser.id === query.employeeId ||
        currentUser.employeeId === query.companyEmployeeNumber ||
        (currentUser.email && query.employeeEmail && currentUser.email.toLowerCase() === query.employeeEmail.toLowerCase()))
  );

  const getStatusBadgeStyle = (status: AssetQueryStatus) => {
    switch (status) {
      case 'Pending Acknowledgement':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse';
      case 'Acknowledged':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'In Progress':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30';
      case 'Handover Completed':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30';
      case 'Still Unresolved':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse';
      case 'Resolved':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'Closed':
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const handleAdminAcknowledge = () => {
    acknowledgeAssetQuery(query.id, currentUser?.name || 'IT Admin');
  };

  const handleAdminStatusUpdate = (status: AssetQueryStatus) => {
    updateAssetQueryStatus(query.id, status, adminNotes.trim(), currentUser?.name || 'IT Admin');
    setAdminNotes('');
  };

  const handleReportStillUnresolved = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stillUnresolvedNotes.trim()) {
      showToast('Please provide details on why the asset issue is still unresolved.', 'error');
      return;
    }
    reportQueryStillUnresolved(query.id, stillUnresolvedNotes.trim());
    setStillUnresolvedNotes('');
    setShowUnresolvedForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#101726] rounded-t-2xl sm:rounded-xl max-w-2xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-[#1e293b] animate-fade-in my-0 sm:my-auto text-xs overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-[#1e293b] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => toggleStarAssetQuery(query.id)}
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={query.isStarred ? 'Unstar query' : 'Star / Mark as Important'}
            >
              <Star className={`w-5 h-5 ${query.isStarred ? 'fill-amber-400 text-amber-500' : 'text-slate-300 dark:text-slate-600'}`} />
            </button>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                  {query.id}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeStyle(query.status)}`}>
                  {query.status}
                </span>
                {query.isStarred && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>Starred / Important</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Asset: <span className="font-semibold text-slate-800 dark:text-slate-200">{query.assetName} [{query.assetNumber}]</span> &bull; {query.department}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Query Header Info Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#090d16] border border-slate-200/80 dark:border-[#1e293b] space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-500" />
                <strong className="text-slate-800 dark:text-slate-200">{query.employeeName}</strong> ({query.companyEmployeeNumber})
              </span>
              <span className="font-mono">{formatDateDisplay(query.createdAt)}</span>
            </div>

            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {query.subject}
            </h2>

            <div className="p-2.5 rounded-lg bg-white dark:bg-[#101726] border border-slate-200/60 dark:border-[#1e293b] text-slate-700 dark:text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">
              {query.description}
            </div>
          </div>

          {/* ADMIN ACKNOWLEDGEMENT MANDATORY ACTION */}
          {isAdmin && query.status === 'Pending Acknowledgement' && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Mandatory Action Required: Admin Acknowledgement</span>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                This query is currently marked as <strong>Pending Acknowledgement</strong>. The staff member is waiting for your explicit confirmation.
              </p>
              <button
                type="button"
                onClick={handleAdminAcknowledge}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Acknowledge Query Now</span>
              </button>
            </div>
          )}

          {/* STILL UNRESOLVED ALERT BANNER (IF FLAGGED) */}
          {query.status === 'Still Unresolved' && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 dark:bg-rose-950/30 border border-rose-500/30 space-y-1.5 animate-pulse">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Urgent: Staff Reported Issue "Still Unresolved" Post-Handover</span>
              </div>
              {query.stillUnresolvedNotes && (
                <p className="text-[11px] text-rose-800 dark:text-rose-300 font-medium italic">
                  "{query.stillUnresolvedNotes}"
                </p>
              )}
              {query.stillUnresolvedDate && (
                <span className="text-[10px] text-rose-500 font-mono block">
                  Reported on: {formatDateDisplay(query.stillUnresolvedDate)}
                </span>
              )}
            </div>
          )}

          {/* EMPLOYEE ACTION: "STILL UNRESOLVED" BUTTON */}
          {(isOwner || !isAdmin) &&
            query.status !== 'Closed' &&
            query.status !== 'Resolved' &&
            query.status !== 'Pending Acknowledgement' && (
              <div className="p-3.5 rounded-xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block text-xs">
                      Issue Still Pending After Laptop Handover?
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      If your laptop was returned or worked on but the problem persists, report it immediately to Admin.
                    </span>
                  </div>
                  {!showUnresolvedForm && (
                    <button
                      type="button"
                      onClick={() => setShowUnresolvedForm(true)}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer transition-colors shrink-0"
                    >
                      ⚠️ Still Unresolved
                    </button>
                  )}
                </div>

                {showUnresolvedForm && (
                  <form onSubmit={handleReportStillUnresolved} className="space-y-2 pt-2 border-t border-blue-500/20">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                      Describe what is still not resolved:
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={stillUnresolvedNotes}
                      onChange={e => setStillUnresolvedNotes(e.target.value)}
                      placeholder="e.g. Laptop handed over yesterday, but Bluetooth driver error code 43 persists..."
                      className="w-full px-3 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowUnresolvedForm(false)}
                        className="px-3 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer"
                      >
                        Submit Still Unresolved Report
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

          {/* ADMIN STATUS UPDATE CONTROL PANEL */}
          {isAdmin && query.status !== 'Closed' && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#090d16] border border-slate-200/80 dark:border-[#1e293b] space-y-3">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
                Admin Lifecycle Controls & Status Update
              </span>

              <div className="flex items-center gap-1.5 flex-wrap">
                {query.status !== 'Acknowledged' && (
                  <button
                    type="button"
                    onClick={() => handleAdminStatusUpdate('Acknowledged')}
                    className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20 hover:bg-blue-500/20 cursor-pointer"
                  >
                    Set Acknowledged
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleAdminStatusUpdate('In Progress')}
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/20 hover:bg-indigo-500/20 cursor-pointer"
                >
                  Set In Progress
                </button>
                <button
                  type="button"
                  onClick={() => handleAdminStatusUpdate('Handover Completed')}
                  className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold border border-purple-500/20 hover:bg-purple-500/20 cursor-pointer"
                >
                  Mark Handover Completed
                </button>
                <button
                  type="button"
                  onClick={() => handleAdminStatusUpdate('Resolved')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer"
                >
                  Mark Resolved
                </button>
                <button
                  type="button"
                  onClick={() => handleAdminStatusUpdate('Closed')}
                  className="px-2.5 py-1 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400 font-semibold border border-slate-500/20 hover:bg-slate-500/20 cursor-pointer"
                >
                  Close Query
                </button>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Optional Resolution / Update Notes for Staff:
                </label>
                <input
                  type="text"
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="e.g. Technician replaced battery unit. Handover scheduled."
                  className="w-full px-3 py-1.5 bg-white dark:bg-[#101726] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* COMPLETE HISTORY TIMELINE */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#1e293b]">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>Complete Query History & Audit Trail</span>
            </h3>

            <div className="relative pl-4 space-y-3 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {query.history.map((hist, idx) => (
                <div key={hist.id || idx} className="relative flex items-start gap-2.5">
                  <div className="absolute -left-4 top-0.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white dark:border-[#101726] shrink-0" />
                  <div className="flex-1 bg-slate-50/70 dark:bg-[#090d16] p-2.5 rounded-lg border border-slate-200/60 dark:border-[#1e293b]">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeStyle(hist.status)}`}>
                        {hist.status}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {formatDateDisplay(hist.timestamp)}
                      </span>
                    </div>
                    <div className="text-[11px] font-medium text-slate-800 dark:text-slate-200 mt-1">
                      Updated by: <span className="font-bold">{hist.updatedBy}</span>
                    </div>
                    {hist.notes && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 italic">
                        "{hist.notes}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
