import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AssetCondition } from '../../types';
import { X, Laptop, Check, ShieldCheck, Calendar, RotateCcw } from 'lucide-react';

interface ComputerAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
}

export const ComputerAssignModal: React.FC<ComputerAssignModalProps> = ({
  isOpen,
  onClose,
  employeeId,
}) => {
  const {
    computers,
    employees,
    assignComputerToEmployee,
    userRole,
  } = useApp();

  const employee = employees.find(e => e.id === employeeId || e.employeeId === employeeId);
  const currentAssignedComputer = computers.find(
    c => c.assignedEmployeeId === employee?.id || (employee && c.assignedEmployeeId === employee.employeeId)
  );

  const [selectedComputerId, setSelectedComputerId] = useState<string>('');
  const [assignedDate, setAssignedDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [condition, setCondition] = useState<AssetCondition>('Good');
  const [remarks, setRemarks] = useState<string>('');

  const [securityFunctionAdded, setSecurityFunctionAdded] = useState<'Yes' | 'No'>('Yes');
  const [securityFunctionAddedDate, setSecurityFunctionAddedDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );

  useEffect(() => {
    if (currentAssignedComputer) {
      setSelectedComputerId(currentAssignedComputer.id);
      setAssignedDate(currentAssignedComputer.assignedDate || new Date().toISOString().substring(0, 10));
      setCondition(currentAssignedComputer.condition);
      setRemarks(currentAssignedComputer.remarks || '');
      setSecurityFunctionAdded(currentAssignedComputer.securityFunctionAdded || 'Yes');
      setSecurityFunctionAddedDate(currentAssignedComputer.securityFunctionAddedDate || currentAssignedComputer.assignedDate || new Date().toISOString().substring(0, 10));
    } else {
      setSelectedComputerId('');
      setAssignedDate(new Date().toISOString().substring(0, 10));
      setCondition('Good');
      setRemarks('Workstation laptop allocation');
      setSecurityFunctionAdded('Yes');
      setSecurityFunctionAddedDate(new Date().toISOString().substring(0, 10));
    }
  }, [currentAssignedComputer, isOpen]);

  if (!isOpen || !employee) return null;

  const isAdmin = userRole === 'admin';

  // Available computers or currently assigned computer
  const candidateComputers = computers.filter(
    c =>
      c.status === 'Available' ||
      c.assignedEmployeeId === employee.id ||
      c.assignedEmployeeId === employee.employeeId
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!selectedComputerId) return;

    // If changing from an existing computer to a new computer, unassign the previous one first
    if (currentAssignedComputer && currentAssignedComputer.id !== selectedComputerId) {
      assignComputerToEmployee(currentAssignedComputer.id, null, assignedDate);
    }

    const res = assignComputerToEmployee(
      selectedComputerId,
      employee.id,
      assignedDate,
      condition,
      remarks.trim() || `Assigned to ${employee.name}`,
      securityFunctionAdded,
      securityFunctionAddedDate
    );

    if (res.success) {
      onClose();
    }
  };

  const handleUnassign = () => {
    if (!isAdmin || !currentAssignedComputer) return;
    const res = assignComputerToEmployee(currentAssignedComputer.id, null, assignedDate);
    if (res.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#101726] rounded-xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 dark:border-[#1e293b] animate-fade-in my-auto text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-[#1e293b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {currentAssignedComputer ? 'Change Assigned Computer' : 'Assign Computer Workstation'}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Admin Action</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Target: <strong>{employee.name}</strong> ({employee.employeeId} • {employee.department})
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

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-3">
          {/* Computer Selection */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Select Computer Unit *
            </label>
            {candidateComputers.length === 0 ? (
              <div className="p-3 text-center rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-amber-800 dark:text-amber-300">
                No available computers in warehouse inventory pool. Please register a computer first.
              </div>
            ) : (
              <select
                required
                value={selectedComputerId}
                onChange={e => setSelectedComputerId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              >
                <option value="">-- Choose Computer from Fleet --</option>
                {candidateComputers.map(c => (
                  <option key={c.id} value={c.id}>
                    [{c.assetNumber}] {c.manufacturer} {c.model} ({c.deviceName}) • {c.memory?.installedRAM || '8 GB'} RAM ({c.status})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Assigned Date & Condition */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3 text-blue-500" />
                <span>Assignment Date *</span>
              </label>
              <input
                type="date"
                required
                value={assignedDate}
                onChange={e => setAssignedDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Hardware Condition *
              </label>
              <select
                value={condition}
                onChange={e => setCondition(e.target.value as AssetCondition)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              >
                <option value="New">New (Brand new unit)</option>
                <option value="Good">Good (Working fine)</option>
                <option value="Fair">Fair (Operational with wear)</option>
              </select>
            </div>
          </div>

          {/* Security Function Added & Date */}
          <div className="grid grid-cols-2 gap-3 p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Security Feature Added? *
              </label>
              <select
                value={securityFunctionAdded}
                onChange={e => setSecurityFunctionAdded(e.target.value as 'Yes' | 'No')}
                className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-blue-500 transition-colors"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Security Function Added Date
              </label>
              <input
                type="date"
                value={securityFunctionAddedDate}
                onChange={e => setSecurityFunctionAddedDate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Remarks */}

          {/* Remarks */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Assignment Remarks
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Primary developer laptop issued with Windows 11 Enterprise..."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#1e293b]">
            {currentAssignedComputer ? (
              <button
                type="button"
                onClick={handleUnassign}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                title="Unassign current computer and return to stock"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Unassign Unit</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedComputerId}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Assignment (Admin)</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
