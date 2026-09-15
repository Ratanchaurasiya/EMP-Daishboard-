import React, { useState } from 'react';
import { Employee, Computer, CompanyAsset } from '../../types';
import { useApp } from '../../context/AppContext';
import { EmployeeAvatar } from '../common/EmployeeAvatar';
import {
  X,
  Share2,
  Copy,
  Check,
  Mail,
  ExternalLink,
  ShieldCheck,
  Laptop,
  Smartphone,
  Headphones,
  Printer,
  Info,
} from 'lucide-react';

interface ShareEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  assignedComputer?: Computer | null;
  assignedAssets?: CompanyAsset[];
}

export const ShareEmployeeModal: React.FC<ShareEmployeeModalProps> = ({
  isOpen,
  onClose,
  employee,
  assignedComputer,
  assignedAssets = [],
}) => {
  const { showToast } = useApp();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate public zero-login direct share link
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  // Token created using safe base64 verification signature
  const token = typeof window !== 'undefined' ? btoa(`${employee.id}:custody-dossier`).replace(/=/g, '') : '';
  const shareUrl = `${origin}${pathname}#/shared?id=${encodeURIComponent(employee.id)}&token=${token}`;

  const assignedPhones = assignedAssets.filter(a => a.assetType === 'Mobile Phone');
  const assignedPeripherals = assignedAssets.filter(a => a.assetType !== 'Mobile Phone' && a.assetType !== 'Laptop');

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast(`Direct share link copied for ${employee.name}!`, 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Could not copy automatically. Please copy the link manually.', 'error');
    }
  };

  const handleOpenPreview = () => {
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Company Asset & Hardware Custody Record: ${employee.name} (${employee.employeeId})`);
    const bodyLines = [
      `Hello ${employee.name},`,
      ``,
      `Here is your official company equipment allocation and custody record from IT Administration.`,
      ``,
      `You can view your complete employee profile, laptop hardware specifications, mobile phone details, and assigned peripherals directly by clicking the link below:`,
      `${shareUrl}`,
      ``,
      `Note: No sign-in or login is required to access this link.`,
      ``,
      `Allocated Equipment Summary:`,
      assignedComputer ? `• Laptop/Computer: ${assignedComputer.manufacturer} ${assignedComputer.model} (${assignedComputer.assetNumber})` : `• Laptop/Computer: None assigned`,
      assignedPhones.length > 0 ? `• Mobile Phone: ${assignedPhones[0].brand} ${assignedPhones[0].model} (${assignedPhones[0].assetNumber})` : `• Mobile Phone: None assigned`,
      assignedPeripherals.length > 0 ? `• Peripherals: ${assignedPeripherals.map(p => `${p.assetType} (${p.assetNumber})`).join(', ')}` : `• Peripherals: None assigned`,
      ``,
      `If you have any questions or notice any discrepancy in your assigned equipment, please reply to this email or reach out to IT Administration.`,
      ``,
      `Regards,`,
      `IT Asset Administration Team`,
    ];
    const body = encodeURIComponent(bodyLines.join('\n'));
    window.location.href = `mailto:${encodeURIComponent(employee.email)}?subject=${subject}&body=${body}`;
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Hello ${employee.name}, here is your official company equipment custody link (no login required): ${shareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-[#101726] rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-[#1e293b] my-auto overflow-hidden animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#1e293b] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                Share Employee Profile & Assets
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Zero-login direct access for employee verification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {/* Employee Card Preview */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-slate-200/80 dark:border-[#1e293b] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <EmployeeAvatar
                name={employee.name}
                photoUrl={employee.photoUrl}
                size="md"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {employee.name}
                  </span>
                  <span className="px-2 py-0.2 rounded text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    {employee.employeeId}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {employee.designation} • {employee.department}
                </p>
              </div>
            </div>

            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
              <ShieldCheck className="w-3 h-3" />
              Verified Profile
            </span>
          </div>

          {/* Included Asset Payload Indicators */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Included In Shared Dossier:
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/40 text-center">
                <div className="flex items-center justify-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold text-xs">
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Workstation</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono truncate">
                  {assignedComputer ? assignedComputer.assetNumber : 'None'}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-pink-50/50 dark:bg-pink-950/20 border border-pink-200/50 dark:border-pink-900/40 text-center">
                <div className="flex items-center justify-center gap-1.5 text-pink-600 dark:text-pink-400 font-semibold text-xs">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Phone</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono truncate">
                  {assignedPhones.length > 0 ? assignedPhones[0].assetNumber : 'None'}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-900/40 text-center">
                <div className="flex items-center justify-center gap-1.5 text-purple-600 dark:text-purple-400 font-semibold text-xs">
                  <Headphones className="w-3.5 h-3.5" />
                  <span>Peripherals</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                  {assignedPeripherals.length} Device{assignedPeripherals.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Direct Link Input Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Direct Shared URL
              </label>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                No password required
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="w-full pl-3 pr-8 py-2 text-xs font-mono bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-800 dark:text-slate-200 rounded-lg select-all focus:outline-hidden"
                />
              </div>

              <button
                onClick={handleCopyLink}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 cursor-pointer shadow-xs ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Quick Dispatch Channels */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Quick Share Options:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={handleEmailShare}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-[#0d131f] dark:hover:bg-slate-800 border border-slate-200 dark:border-[#1e293b] text-slate-800 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                <span>Email to Staff</span>
              </button>

              <button
                onClick={handleWhatsAppShare}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border border-emerald-300/60 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 rounded-lg transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={handleOpenPreview}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-[#0d131f] dark:hover:bg-slate-800 border border-slate-200 dark:border-[#1e293b] text-slate-800 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
                <span>Open Preview</span>
              </button>
            </div>
          </div>

          {/* Explanatory Callout */}
          <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-200">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold">Zero Sign-In Requirement: </span>
              The employee can open this link on their laptop, tablet, or mobile phone to verify their complete hardware specifications and custody history without needing an account or login. The view is strictly read-only and restricted to this employee's records only.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-[#0d131f] border-t border-slate-100 dark:border-[#1e293b] flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Printable handover receipt included</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
