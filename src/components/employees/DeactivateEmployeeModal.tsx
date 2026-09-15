import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  UserX,
  X,
  CheckCircle,
} from 'lucide-react';

interface DeactivateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
}

export const DeactivateEmployeeModal: React.FC<DeactivateEmployeeModalProps> = ({
  isOpen,
  onClose,
  employeeId,
}) => {
  const { employees, computers, assets, deactivateEmployee, userRole } = useApp();
  const [reason, setReason] = useState<string>('');

  const employee = employees.find(e => e.id === employeeId || e.employeeId === employeeId);

  if (!isOpen || !employee) return null;

  const isAdmin = userRole === 'admin';
  const assignedComputer = computers.find(
    c => c.assignedEmployeeId === employee.id || c.assignedEmployeeId === employee.employeeId
  );
  const assignedAssets = assets.filter(
    a => a.assignedEmployeeId === employee.id || a.assignedEmployeeId === employee.employeeId
  );

  const handleConfirm = () => {
    if (!isAdmin) return;
    deactivateEmployee(employee.id, reason.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#101726] rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-[#1e293b] animate-fade-in my-auto text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-[#1e293b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <UserX className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Deactivate Employee Account
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Safe & reversible • Preserves all assets & logs
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-3.5 pt-3">
          <div className="p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40">
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              Are you sure you want to deactivate{' '}
              <strong className="text-slate-900 dark:text-white font-bold">
                {employee.name}
              </strong>{' '}
              ({employee.employeeId})?
            </p>
          </div>

          {/* Retention Guarantees */}
          <div className="space-y-2 p-3 rounded-lg bg-slate-50 dark:bg-[#090d16] border border-slate-200/80 dark:border-[#1e293b]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Data Retention Guarantees
            </span>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Assigned Workstation ({assignedComputer ? assignedComputer.assetNumber : 'None'}) remains assigned.</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{assignedAssets.length} Company Peripherals and serial records remain intact.</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Historic service tickets & allocation logs are preserved.</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Can be restored/reactivated at any time with 1 click.</span>
            </div>
          </div>

          {/* Optional Reason Input */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Deactivation Reason (Optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Resignation, extended sabbatical, temporary contract end..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1e293b]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Confirm Deactivation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
