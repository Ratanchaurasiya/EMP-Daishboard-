import React from 'react';
import { ExitClearanceRecord } from '../../types';
import { formatDateDisplay } from '../../utils/formatters';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plus,
  Paperclip,
  Download,
  AlertTriangle,
  Award,
  Calendar,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface EmployeeExitStatusCardProps {
  clearance: ExitClearanceRecord | null;
  onRaiseRequest: () => void;
  onViewCertificate: (record: ExitClearanceRecord) => void;
}

export const EmployeeExitStatusCard: React.FC<EmployeeExitStatusCardProps> = ({
  clearance,
  onRaiseRequest,
  onViewCertificate,
}) => {
  // If no clearance or request exists yet
  if (!clearance) {
    return (
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0 border border-amber-500/30">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Initiate Separation / Exit Request
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl leading-relaxed">
              Planning to separate or transition out from EASH? Raise your formal exit request here with your proposed last working day and separation reason. Administration will review, confirm your exit date, and guide your asset clearance.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRaiseRequest}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Raise Exit Request</span>
        </button>
      </div>
    );
  }

  const req = clearance.exitRequest;
  const isApproved = req?.status === 'Approved' || clearance.status === 'Full & Final Approved';
  const isRejected = req?.status === 'Rejected';
  const isChangesRequested = req?.status === 'Changes Requested';
  const isPending = !isApproved && !isRejected && !isChangesRequested;

  return (
    <div className="space-y-4">
      {/* 1. Status Banner */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          isApproved
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
            : isRejected
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-200'
            : isChangesRequested
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200'
            : 'bg-blue-500/10 border-blue-500/30 text-blue-950 dark:text-blue-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            {isApproved ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : isRejected ? (
              <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            ) : isChangesRequested ? (
              <RefreshCw className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            ) : (
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 animate-pulse" />
            )}

            <div>
              <div className="text-xs uppercase font-extrabold tracking-wider opacity-75">
                Exit Request Status
              </div>
              <div className="text-base font-bold">
                {isApproved
                  ? 'Exit Request Approved'
                  : isRejected
                  ? 'Exit Request Rejected'
                  : isChangesRequested
                  ? 'Changes Requested by Admin'
                  : 'Pending Under Review'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-900/80 shadow-2xs">
              ID: {clearance.id}
            </span>
            {clearance.status === 'Full & Final Approved' && (
              <button
                type="button"
                onClick={() => onViewCertificate(clearance)}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                <span>View No-Dues Certificate</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Key Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-xs">
          <div>
            <span className="opacity-75 block text-[10px] uppercase font-bold">
              {isApproved ? 'Confirmed Final Exit Date' : 'Proposed Exit Date'}
            </span>
            <span className="font-bold text-sm font-mono">
              {formatDateDisplay(req?.finalExitDate || req?.proposedExitDate || clearance.exitDate)}
            </span>
          </div>

          <div>
            <span className="opacity-75 block text-[10px] uppercase font-bold">Separation Reason</span>
            <span className="font-bold">{req?.reason || clearance.exitType}</span>
          </div>

          <div>
            <span className="opacity-75 block text-[10px] uppercase font-bold">Asset Handover Deadline</span>
            <span className="font-bold font-mono">
              {formatDateDisplay(clearance.returnDeadline)} ({clearance.clearanceWindowDays || 3} days window)
            </span>
          </div>
        </div>

        {/* 3. Feedback / Remarks */}
        {req?.remarks && (
          <div className="mt-3 pt-2 border-t border-black/10 dark:border-white/10 text-xs">
            <span className="opacity-75 block text-[10px] uppercase font-bold">Your Submitted Remarks</span>
            <p className="italic mt-0.5">"{req.remarks}"</p>
          </div>
        )}

        {isApproved && req?.adminRemarks && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs">
            <span className="font-bold block text-emerald-800 dark:text-emerald-300">
              Admin Approval Remarks:
            </span>
            <p className="mt-0.5 text-emerald-900 dark:text-emerald-100">{req.adminRemarks}</p>
          </div>
        )}

        {isRejected && req?.rejectionReason && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs">
            <span className="font-bold block text-rose-800 dark:text-rose-300">
              Rejection Reason from Administration:
            </span>
            <p className="mt-0.5 text-rose-900 dark:text-rose-100">{req.rejectionReason}</p>
          </div>
        )}

        {isChangesRequested && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-bold block text-amber-800 dark:text-amber-300">
                Action Required – Changes Requested:
              </span>
              <p className="mt-0.5 text-amber-900 dark:text-amber-100">{req?.changesRequestedNotes}</p>
            </div>
            <button
              type="button"
              onClick={onRaiseRequest}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-xs shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Update Exit Request</span>
            </button>
          </div>
        )}

        {/* Supporting Document preview */}
        {req?.supportingDocumentUrl && (
          <div className="mt-3 pt-2 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Paperclip className="w-3.5 h-3.5" />
              <span className="font-semibold">{req.supportingDocumentName || 'Resignation_Letter.pdf'}</span>
            </div>
            <a
              href={req.supportingDocumentUrl}
              download={req.supportingDocumentName || 'exit-document'}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] underline font-bold"
            >
              <Download className="w-3 h-3" />
              <span>Download Attachment</span>
            </a>
          </div>
        )}
      </div>

      {/* Re-raise button if rejected */}
      {isRejected && (
        <div className="text-right">
          <button
            type="button"
            onClick={onRaiseRequest}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Revised Exit Request</span>
          </button>
        </div>
      )}
    </div>
  );
};
