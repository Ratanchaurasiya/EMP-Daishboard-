import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  Send,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Folder,
  Tag,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SimCard, SimIssueType, RequestUrgency } from '../../types';
import { generateSimIssueWhatsAppUrl } from '../../utils/simUtils';

interface ReportSimIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSim: SimCard | null;
}

const ISSUE_TYPES: SimIssueType[] = [
  'SIM Blocked',
  'SIM Not Working',
  'Incoming Calls Not Working',
  'Outgoing Calls Not Working',
  'Internet/Data Not Working',
  'WhatsApp Issue',
  'Network Issue',
  'SIM Lost',
  'SIM Damaged',
  'Other',
];

export const ReportSimIssueModal: React.FC<ReportSimIssueModalProps> = ({
  isOpen,
  onClose,
  targetSim,
}) => {
  const { currentUser, employees, submitSimRequest, showToast } = useApp();

  const currentEmp = currentUser?.role === 'employee'
    ? employees.find(
        e =>
          e.id === currentUser.id ||
          e.employeeId === currentUser.employeeId ||
          e.email.toLowerCase() === currentUser.email.toLowerCase()
      )
    : null;

  const [issueType, setIssueType] = useState<SimIssueType>('SIM Blocked');
  const [urgency, setUrgency] = useState<RequestUrgency>('Urgent');
  const [reason, setReason] = useState<string>('');
  const [sendWhatsApp, setSendWhatsApp] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !targetSim) return null;

  const empName = currentEmp?.name || targetSim.assignedEmployeeName || currentUser?.name || 'Employee';
  const empId = currentEmp?.employeeId || currentEmp?.id || targetSim.assignedEmployeeId || 'EMP001';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a description of the issue you are experiencing with this SIM.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload = {
      employeeId: empId,
      employeeName: empName,
      companyEmployeeNumber: currentEmp?.companyEmployeeNumber,
      employeeEmail: currentEmp?.email || currentUser?.email,
      employeePhone: currentEmp?.phone,
      requestType: 'Report Issue' as const,
      issueType,
      simId: targetSim.id,
      contactNumber: targetSim.contactNumber,
      project: targetSim.project || 'General Operations',
      purpose: targetSim.purpose,
      urgency,
      reason: reason.trim(),
      status: 'Pending' as const,
      targetWhatsAppNumber: '9328594724',
      whatsAppStatus: sendWhatsApp ? ('Sent' as const) : ('Pending' as const),
    };

    const res = submitSimRequest(payload);
    setIsSubmitting(false);

    if (res && !res.success) {
      setError(res.error || 'Failed to record SIM issue request.');
      return;
    }

    if (sendWhatsApp && res.requestId) {
      const fullReq = {
        ...payload,
        id: res.requestId,
        createdAt: new Date().toISOString(),
      };
      const waUrl = generateSimIssueWhatsAppUrl(fullReq, '9328594724', 'employee');
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }

    setReason('');
    setIssueType('SIM Blocked');
    setUrgency('Urgent');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-4 bg-black/70 backdrop-blur-xs flex items-center justify-center animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[88vh] my-auto">
        {/* Header */}
        <div className="shrink-0 px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-rose-500/5 dark:bg-rose-950/20 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Report SIM Card Issue</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 uppercase">
                  IT Incident
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Notify IT Administrator immediately about SIM blockage, data failure, or damage
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Auto-filled Target SIM Card Details Strip */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                <span>Selected Corporate SIM Card (Auto-Filled)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 block">Contact Number</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                    📱 {targetSim.contactNumber}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">Assigned Staff</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {empName} ({empId})
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">Assigned Project</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    📁 {targetSim.project || 'General Operations'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">Primary Purpose</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    🏷️ {targetSim.purpose}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">Current Status</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    🟢 {targetSim.status}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">Date &amp; Time</span>
                  <span className="font-mono text-slate-500">
                    {new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Issue Type */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                  <span>Issue Category / Problem</span>
                </label>
                <select
                  value={issueType}
                  onChange={e => setIssueType(e.target.value as SimIssueType)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                >
                  {ISSUE_TYPES.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Urgency Priority */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Priority Level</span>
                </label>
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  {(['Normal', 'Urgent'] as RequestUrgency[]).map(u => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUrgency(u)}
                      className={`py-1.5 px-3 rounded-xl font-bold transition-all text-center cursor-pointer border ${
                        urgency === u
                          ? u === 'Urgent'
                            ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                            : 'bg-blue-600 text-white border-blue-700 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {u === 'Urgent' ? '🔥 Urgent' : ' Normal'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Issue Description */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Detailed Issue Description</span>
                <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Describe what happened e.g. SIM card displays 'No Service' after phone reboot, calls dropping, or WhatsApp verification code not received..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                required
              />
            </div>

            {/* WhatsApp Direct Option */}
            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Send className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-xs block">
                    Send WhatsApp Alert to IT Admin
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Pre-fills structured ticket report to Admin (9328594724)
                  </span>
                </div>
              </div>

              <input
                type="checkbox"
                checked={sendWhatsApp}
                onChange={e => setSendWhatsApp(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 cursor-pointer"
              />
            </div>
          </div>

          {/* Fixed Form Actions */}
          <div className="shrink-0 p-4 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-[#101726]/95 backdrop-blur-sm flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md shadow-rose-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Dispatching...' : 'Submit Request to Admin'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
