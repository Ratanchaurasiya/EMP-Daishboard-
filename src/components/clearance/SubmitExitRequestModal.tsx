import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Calendar,
  FileText,
  Upload,
  AlertCircle,
  CheckCircle2,
  Paperclip,
  Trash2,
  Send,
  HelpCircle,
} from 'lucide-react';

interface SubmitExitRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EXIT_REASONS = [
  'Better Career Opportunity',
  'Relocation / Family Move',
  'Higher Education / Advanced Studies',
  'Personal / Family Reasons',
  'Health / Medical Reasons',
  'Career Break / Sabbatical',
  'Contract Completion',
  'Other',
];

export const SubmitExitRequestModal: React.FC<SubmitExitRequestModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { submitExitRequest, currentUser, showToast } = useApp();

  // Tomorrow by default for proposed exit date
  const tomorrowStr = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [proposedExitDate, setProposedExitDate] = useState<string>(tomorrowStr);
  const [reason, setReason] = useState<string>('Better Career Opportunity');
  const [customReason, setCustomReason] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [fileData, setFileData] = useState<{
    url: string;
    name: string;
    size: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be under 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFileData({
        url: reader.result as string,
        name: file.name,
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!proposedExitDate) {
      setErrorMsg('Proposed exit date is required.');
      return;
    }

    const finalReason = reason === 'Other' ? customReason.trim() : reason;
    if (!finalReason) {
      setErrorMsg('Please specify the reason for your exit.');
      return;
    }

    setIsSubmitting(true);
    const result = submitExitRequest({
      proposedExitDate,
      reason: finalReason,
      remarks: remarks.trim(),
      supportingDocumentUrl: fileData?.url,
      supportingDocumentName: fileData?.name,
      supportingDocumentSize: fileData?.size,
    });

    setIsSubmitting(false);
    if (result.success) {
      onClose();
    } else {
      setErrorMsg(result.error || 'Failed to submit exit request.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Submit Exit / Resignation Request
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Formal notification to Management & IT Administration
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current Employee Info Banner */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Submitting Employee
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                {currentUser?.name || 'Logged-in Employee'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                {currentUser?.employeeId} &bull; {currentUser?.department}
              </span>
            </div>
            <div className="text-right text-[11px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              Notice Status: Active
            </div>
          </div>

          {/* Proposed Exit Date */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 text-[11px]">
              Proposed Last Working Day <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                required
                min={tomorrowStr}
                value={proposedExitDate}
                onChange={e => setProposedExitDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-amber-500"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Admin will review and confirm this date upon formal approval.
            </p>
          </div>

          {/* Reason for Exit */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 text-[11px]">
              Reason for Separation / Exit <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-amber-500"
            >
              {EXIT_REASONS.map(r => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Reason if 'Other' */}
          {reason === 'Other' && (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 text-[11px]">
                Specify Reason <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Please state specific reason..."
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 text-[11px]">
              Employee Remarks / Notes for Management
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Grateful for the opportunities at EASH. I will assist in handing over all active tasks and company hardware."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Supporting Document (Optional) */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 text-[11px]">
              Optional Supporting Document (Resignation Letter / Proof)
            </label>
            {fileData ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60">
                <div className="flex items-center gap-2.5 truncate">
                  <Paperclip className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div className="truncate">
                    <span className="font-semibold text-slate-900 dark:text-white block truncate">
                      {fileData.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {(fileData.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFileData(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-amber-500 cursor-pointer bg-slate-50/50 dark:bg-slate-950/30 transition-colors">
                <Upload className="w-5 h-5 text-slate-400 mb-1" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Upload PDF or Document
                </span>
                <span className="text-[10px] text-slate-400">PDF, PNG, JPG up to 5MB</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Workflow Info notice */}
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 text-[11px] flex items-start gap-2">
            <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong>Next Steps:</strong> Once submitted, your request will show as{' '}
              <span className="font-semibold underline">Pending Under Review</span> in your portal.
              Admin will review, confirm your final exit date, and initiate your 2–5 day asset
              handover checklist.
            </div>
          </div>

          {/* Footer Actions */}
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
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Exit Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
