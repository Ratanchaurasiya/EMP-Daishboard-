import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import {
  AlertTriangle,
  ShieldAlert,
  X,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Laptop,
  Layers,
  Wrench,
  User,
  Mail,
  Phone,
  Calendar,
  Building,
  CheckCircle2,
  Smartphone,
} from 'lucide-react';
import { formatDateDisplay } from '../../utils/formatters';

interface RemoveEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  onRemoved?: () => void;
}

export const RemoveEmployeeModal: React.FC<RemoveEmployeeModalProps> = ({
  isOpen,
  onClose,
  employeeId,
  onRemoved,
}) => {
  const {
    employees,
    computers,
    assets,
    serviceRecords,
    simCards,
    simRecharges,
    simRequests,
    removeEmployeePermanently,
    userRole,
  } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [acknowledged, setAcknowledged] = useState<boolean>(false);
  const [removalReason, setRemovalReason] = useState<string>('');

  // Lock body scroll and listen for Escape key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  // Reset step whenever modal opens or target changes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setAcknowledged(false);
      setRemovalReason('');
    }
  }, [isOpen, employeeId]);

  const employee = employees.find(
    e => e.id === employeeId || e.employeeId === employeeId
  );

  if (!isOpen || !employee) return null;

  const isAdmin = userRole === 'admin';
  const assignedComputer = computers.find(
    c =>
      c.assignedEmployeeId === employee.id ||
      c.assignedEmployeeId === employee.employeeId
  );
  const assignedAssets = assets.filter(
    a =>
      a.assignedEmployeeId === employee.id ||
      a.assignedEmployeeId === employee.employeeId
  );
  const assignedSims = simCards.filter(
    s =>
      s.assignedEmployeeId === employee.id ||
      s.assignedEmployeeId === employee.employeeId
  );
  const assignedServices = serviceRecords.filter(
    s =>
      s.employeeId === employee.id ||
      s.employeeId === employee.employeeId ||
      (assignedComputer && s.computerId === assignedComputer.id) ||
      (assignedComputer && s.assetNumber === assignedComputer.assetNumber)
  );

  // Final permanent removal execution
  const handleConfirmPermanentRemoval = () => {
    if (!isAdmin || step !== 3 || !acknowledged || !removalReason.trim()) return;
    removeEmployeePermanently(employee.id, removalReason.trim());
    onClose();
    if (onRemoved) {
      onRemoved();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/75 backdrop-blur-xs"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="remove-employee-title"
    >
      <div
        className="bg-white dark:bg-[#101726] rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-[#1e293b] animate-fade-in text-xs overflow-y-auto my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with Step Progress */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1e293b]">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                step === 3
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                  : step === 2
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
              }`}
            >
              {step === 3 ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="remove-employee-title"
                  className="text-base font-bold text-slate-900 dark:text-white"
                >
                  Permanent Employee Removal
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-mono">
                  Step {step} of 3
                </span>
              </div>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">
                {step === 1 && 'Step 1: Identity & Target Verification'}
                {step === 2 && 'Step 2: Hardware Fleet & Records Audit'}
                {step === 3 && 'Step 3: Final Irrevocable Authorization'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3-Step Progress Indicators */}
        <div className="grid grid-cols-3 gap-2 py-3.5 border-b border-slate-100 dark:border-[#1e293b]">
          <div className="flex flex-col gap-1">
            <div
              className={`h-1.5 rounded-full transition-all ${
                step >= 1 ? 'bg-red-500' : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
            <span
              className={`text-[10px] font-semibold ${
                step === 1
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              1. Identity
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <div
              className={`h-1.5 rounded-full transition-all ${
                step >= 2 ? 'bg-red-500' : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
            <span
              className={`text-[10px] font-semibold ${
                step === 2
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              2. Records Audit
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <div
              className={`h-1.5 rounded-full transition-all ${
                step === 3 ? 'bg-red-600' : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
            <span
              className={`text-[10px] font-semibold ${
                step === 3
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              3. Purge Database
            </span>
          </div>
        </div>

        {/* STEP 1: IDENTITY & TARGET VERIFICATION */}
        {step === 1 && (
          <div className="space-y-4 py-4 animate-fade-in">
            <div className="p-3.5 rounded-xl bg-red-50/70 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/40">
              <span className="text-[10px] uppercase font-bold text-red-700 dark:text-red-400 tracking-wider block mb-1">
                Step 1: Verify Employee Identity
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Are you sure you want to permanently remove this employee?
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                You have requested permanent removal for the employee profile below. Complete the 3-step verification to permanently purge the employee and all associated records from the database.
              </p>
            </div>

            {/* Target Employee Identity Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0c121e] border border-slate-200/80 dark:border-[#1e293b] space-y-3">
              <div className="flex items-center gap-3">
                {employee.photoUrl ? (
                  <img
                    src={employee.photoUrl}
                    alt={employee.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-300 dark:border-slate-700 shadow-xs shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-base flex items-center justify-center border border-slate-300 dark:border-slate-700 shrink-0">
                    {employee.name
                      .split(' ')
                      .map(n => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {employee.name}
                    </h5>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                      {employee.employeeId}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                    {employee.designation} • {employee.department}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{employee.email || 'No email provided'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 truncate">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{employee.phone || 'No phone provided'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{employee.team || employee.department}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    {employee.joiningDate
                      ? `Joined ${formatDateDisplay(employee.joiningDate)}`
                      : 'Joining date not specified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Step 1 Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#1e293b]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Continue to Step 2 (Impact Audit)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: HARDWARE FLEET & RECORDS AUDIT */}
        {step === 2 && (
          <div className="space-y-4 py-4 animate-fade-in">
            <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40">
              <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 tracking-wider block mb-1">
                Step 2: Fleet & Records Impact Audit
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Review hardware and database records to be updated
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Confirm how hardware fleet assets and associated database records linked to{' '}
                <strong className="text-slate-900 dark:text-white font-semibold">
                  {employee.name}
                </strong>{' '}
                will be processed.
              </p>
            </div>

            {/* Impact Breakdown Cards */}
            <div className="space-y-2.5">
              {/* Workstation Computer */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0c121e] border border-slate-200/80 dark:border-[#1e293b] flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 mt-0.5">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block text-xs">
                      Workstation Computer / Laptop
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      {assignedComputer
                        ? `${assignedComputer.deviceName} (${assignedComputer.assetNumber || assignedComputer.serialNumber}) — ${assignedComputer.manufacturer} ${assignedComputer.model}`
                        : 'No workstation computer currently assigned'}
                    </span>
                    {assignedComputer && (
                      <span className="inline-block mt-1 text-[10px] font-semibold text-red-600 dark:text-red-400">
                        ✗ Will be permanently deleted from database and Hardware Fleet
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    assignedComputer
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {assignedComputer ? 'Permanently Deleted' : 'None'}
                </span>
              </div>

              {/* Assigned Peripherals & Phone */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0c121e] border border-slate-200/80 dark:border-[#1e293b] flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 mt-0.5">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block text-xs">
                      Corporate Phone & Peripherals ({assignedAssets.length})
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      {assignedAssets.length > 0
                        ? assignedAssets
                            .map(a => `${a.assetType} [${a.assetNumber || a.serialNumber}]`)
                            .join(', ')
                        : 'No corporate phone or peripheral equipment assigned'}
                    </span>
                    {assignedAssets.length > 0 && (
                      <span className="inline-block mt-1 text-[10px] font-semibold text-red-600 dark:text-red-400">
                        ✗ All {assignedAssets.length} device(s) will be permanently deleted from database
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    assignedAssets.length > 0
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {assignedAssets.length > 0 ? `${assignedAssets.length} Permanently Deleted` : 'None'}
                </span>
              </div>

              {/* Corporate SIM Cards */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0c121e] border border-slate-200/80 dark:border-[#1e293b] flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-0.5">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block text-xs">
                      Corporate SIM Cards & Mobile Fleet ({assignedSims.length})
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      {assignedSims.length > 0
                        ? assignedSims
                            .map(s => `${s.carrier} ${s.contactNumber} [${s.purpose}]`)
                            .join(', ')
                        : 'No corporate SIM cards assigned to this employee'}
                    </span>
                    {assignedSims.length > 0 && (
                      <span className="inline-block mt-1 text-[10px] font-semibold text-red-600 dark:text-red-400">
                        ✗ All {assignedSims.length} SIM card(s), recharge records, and requests will be permanently deleted from database
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    assignedSims.length > 0
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {assignedSims.length > 0 ? `${assignedSims.length} Permanently Deleted` : 'None'}
                </span>
              </div>

              {/* Service & Maintenance Tickets */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0c121e] border border-slate-200/80 dark:border-[#1e293b] flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 mt-0.5">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block text-xs">
                      Maintenance & Service Logs ({assignedServices.length})
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      {assignedServices.length > 0
                        ? `${assignedServices.length} ticket(s) and maintenance logs linked to this employee`
                        : 'No maintenance records logged for this employee'}
                    </span>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-red-600 dark:text-red-400">
                      ✗ Linked records will be permanently purged from database
                    </span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    assignedServices.length > 0
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {assignedServices.length > 0 ? `${assignedServices.length} Purged` : 'None'}
                </span>
              </div>
            </div>

            {/* Step 2 Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#1e293b]">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Step 1</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Continue to Step 3 (Final Verification)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: FINAL IRREVOCABLE AUTHORIZATION */}
        {step === 3 && (
          <div className="space-y-4 py-4 animate-fade-in">
            <div className="p-4 rounded-xl bg-red-500/15 border-2 border-red-500/40 space-y-2">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span className="text-[11px] uppercase tracking-wider">
                  Step 3: Final Irrevocable Authorization
                </span>
              </div>
              <h4 className="text-sm font-bold text-red-700 dark:text-red-300 leading-snug">
                Permanent deletion cannot be undone. Are you absolutely sure?
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Confirming will permanently delete{' '}
                <strong className="text-slate-900 dark:text-white font-semibold">
                  {employee.name}
                </strong>{' '}
                ({employee.employeeId}) and all associated records from the database, including personal details, professional information, assigned SIM cards & telecom records, laptop/computer details, phone information, assigned assets, peripherals, and service/maintenance records.
              </p>
            </div>

            {/* Target Summary Recap */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0c121e] border border-slate-200 dark:border-[#1e293b] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Target for Permanent Removal
                </span>
                <span className="font-bold text-sm text-slate-900 dark:text-white mt-0.5 block">
                  {employee.name}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  ID: {employee.employeeId} • {employee.department} • {employee.designation}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                Slated for Purge
              </span>
            </div>

            {/* Mandatory Removal Reason Input */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span>Mandatory Removal Reason / Remark <span className="text-red-500">*</span></span>
                <span className="text-[10px] text-red-500 font-medium">Required for Audit Log</span>
              </label>
              <textarea
                value={removalReason}
                onChange={e => setRemovalReason(e.target.value)}
                placeholder="Specify the official reason for removing this employee (e.g. Employee Resigned, Service Contract Ended, Department Restructuring)..."
                rows={3}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-red-500 font-medium"
              />
            </div>

            {/* Acknowledgment Checkbox */}
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/40 cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={e => setAcknowledged(e.target.checked)}
                className="mt-0.5 rounded text-red-600 focus:ring-red-500 focus:ring-1 cursor-pointer w-4 h-4"
              />
              <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                I understand that this employee will be removed from active directories. Hardware will be returned to stock while all historical query and request audit trails will be preserved in Removal History.
              </span>
            </label>

            {/* Step 3 Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#1e293b]">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Step 2</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!acknowledged || !removalReason.trim()}
                  onClick={handleConfirmPermanentRemoval}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Confirm Removal & Archive Records</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
