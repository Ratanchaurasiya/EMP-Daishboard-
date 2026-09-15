import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AssetCondition } from '../../types';
import {
  X,
  UserMinus,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  RotateCcw,
  Check,
} from 'lucide-react';

interface UnassignCustodianModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType?: 'Computer' | 'Mobile Phone' | 'Peripheral Asset' | string;
  assetNumber: string;
  deviceName: string;
  employeeName: string;
  employeeId: string;
  onConfirm: (condition: AssetCondition, remarks: string) => void;
}

export const UnassignCustodianModal: React.FC<UnassignCustodianModalProps> = ({
  isOpen,
  onClose,
  entityType = 'Asset',
  assetNumber,
  deviceName,
  employeeName,
  employeeId,
  onConfirm,
}) => {
  // 2-Step Confirmation State (1: First Confirmation, 2: Second Confirmation)
  const [step, setStep] = useState<1 | 2>(1);

  const [condition, setCondition] = useState<AssetCondition>('Good');
  const [remarks, setRemarks] = useState<string>('Removed from employee & returned to available inventory stock');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reset to step 1 and default states whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setCondition('Good');
      setRemarks('Removed from employee & returned to available inventory stock');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Lock background scroll and listen for Escape key while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  // Step 1: Proceed to Second Confirmation
  const handleProceedToStep2 = (e: React.MouseEvent) => {
    e.preventDefault();
    setStep(2);
  };

  // Step 2: Final Confirmation & Removal
  const handleFinalConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      onConfirm(condition, remarks.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-[#101726] rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in my-auto text-xs space-y-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with Step indicator */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                step === 1
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              }`}
            >
              {step === 1 ? <AlertTriangle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Remove Asset
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    step === 1
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                  }`}
                >
                  Confirmation {step} of 2
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {step === 1
                  ? 'Step 1: Verify asset and employee information'
                  : 'Step 2: Final authorization to unassign asset'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: First Confirmation Prompt */}
        {step === 1 ? (
          <div className="space-y-4">
            {/* Primary Question Box */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>First Confirmation</span>
              </div>
              <p className="text-xs font-semibold leading-relaxed">
                Are you sure you want to remove this asset from this employee?
              </p>
            </div>

            {/* Target Asset & Employee Details */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Asset Number:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  {assetNumber}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Device / Brand:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-right truncate max-w-[200px]">
                  {deviceName}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Currently Assigned To:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 dark:text-white">{employeeName}</span>
                  <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                    {employeeId}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
              Click <strong>Continue</strong> to proceed to the final confirmation before the asset is officially unassigned.
            </p>

            {/* Step 1 Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceedToStep2}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* STEP 2: Second & Final Confirmation Prompt */
          <form onSubmit={handleFinalConfirm} className="space-y-4">
            {/* Second Confirmation Warning Box */}
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs text-rose-700 dark:text-rose-300">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>Second Confirmation (Final Step)</span>
              </div>
              <p className="text-xs font-bold leading-relaxed text-rose-800 dark:text-rose-100">
                This asset will be removed from the employee’s assigned assets. Do you want to continue?
              </p>
            </div>

            {/* Key Action Summary Points */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2 text-[11px]">
              <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  Asset <strong>{assetNumber}</strong> will be removed from <strong>{employeeName}</strong>'s Assigned Company Assets.
                </span>
              </div>
              <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                <RotateCcw className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  Status will change to <strong>Available</strong>, ready to be reassigned to another employee.
                </span>
              </div>
              <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  Previous assignment history and return date will be <strong>permanently preserved</strong>.
                </span>
              </div>
            </div>

            {/* Return Hardware Condition */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Asset Condition Upon Return
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['New', 'Good', 'Fair', 'Damaged'] as AssetCondition[]).map(cond => (
                  <button
                    type="button"
                    key={cond}
                    onClick={() => setCondition(cond)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center border transition-all cursor-pointer ${
                      condition === cond
                        ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Return Remarks / Notes
              </label>
              <input
                type="text"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="e.g. Returned from employee in good working condition"
                className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            {/* Step 2 Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                  <span>Confirm &amp; Remove Asset</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
