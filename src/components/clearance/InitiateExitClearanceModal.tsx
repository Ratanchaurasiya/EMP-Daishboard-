import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ExitType } from '../../types';
import { formatDateDisplay } from '../../utils/formatters';
import {
  X,
  UserX,
  Calendar,
  Clock,
  Laptop,
  Smartphone,
  Headphones,
  CheckCircle2,
  AlertTriangle,
  Search,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { EmployeeAvatar } from '../common/EmployeeAvatar';

interface InitiateExitClearanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedEmployeeId?: string | null;
}

export const InitiateExitClearanceModal: React.FC<InitiateExitClearanceModalProps> = ({
  isOpen,
  onClose,
  preSelectedEmployeeId,
}) => {
  const { employees, computers, assets, simCards, initiateExitClearance, showToast } = useApp();

  const [selectedEmpId, setSelectedEmpId] = useState<string>(preSelectedEmployeeId || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [exitType, setExitType] = useState<ExitType>('Resignation');
  const [resignationDate, setResignationDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [exitDate, setExitDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [clearanceWindowDays, setClearanceWindowDays] = useState<number>(3);
  const [notes, setNotes] = useState<string>('');

  React.useEffect(() => {
    if (preSelectedEmployeeId) {
      setSelectedEmpId(preSelectedEmployeeId);
    }
  }, [preSelectedEmployeeId, isOpen]);

  // Filtered employees for dropdown
  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      if (e.status === 'Inactive') return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        e.name.toLowerCase().includes(q) ||
        e.employeeId.toLowerCase().includes(q) ||
        (e.companyEmployeeNumber && e.companyEmployeeNumber.toLowerCase().includes(q)) ||
        e.department.toLowerCase().includes(q)
      );
    });
  }, [employees, searchQuery]);

  const targetEmployee = useMemo(() => {
    if (!selectedEmpId) return null;
    return employees.find(e => e.id === selectedEmpId || e.employeeId === selectedEmpId) || null;
  }, [selectedEmpId, employees]);

  // Assigned items preview for target employee
  const assignedComputers = useMemo(() => {
    if (!targetEmployee) return [];
    return computers.filter(
      c => c.assignedEmployeeId === targetEmployee.id || c.assignedEmployeeId === targetEmployee.employeeId
    );
  }, [targetEmployee, computers]);

  const assignedAssets = useMemo(() => {
    if (!targetEmployee) return [];
    return assets.filter(
      a => a.assignedEmployeeId === targetEmployee.id || a.assignedEmployeeId === targetEmployee.employeeId
    );
  }, [targetEmployee, assets]);

  const assignedSims = useMemo(() => {
    if (!targetEmployee) return [];
    return simCards.filter(
      s => s.assignedEmployeeId === targetEmployee.id || s.assignedEmployeeId === targetEmployee.employeeId
    );
  }, [targetEmployee, simCards]);

  const totalAssignedCount = assignedComputers.length + assignedAssets.length + assignedSims.length;

  // Deadline calculation
  const computedDeadline = useMemo(() => {
    if (!exitDate) return '';
    const d = new Date(exitDate);
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + Number(clearanceWindowDays));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [exitDate, clearanceWindowDays]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmployee) {
      showToast('Please select an employee for exit clearance.', 'error');
      return;
    }

    if (!exitDate) {
      showToast('Please select final working date.', 'error');
      return;
    }

    const res = initiateExitClearance(targetEmployee.id, {
      exitType,
      resignationDate,
      exitDate,
      clearanceWindowDays,
      notes: notes.trim() || undefined,
    });

    if (res.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#101726] rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in my-auto text-xs max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <UserX className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Initiate Employee Exit & Asset Clearance
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Enroll assigned company assets into the mandatory return window
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pt-3.5 pr-1">
          {/* Employee Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block mb-1">
              Select Separating Employee <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search staff by name, EMP ID, or department..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <select
                value={selectedEmpId}
                onChange={e => setSelectedEmpId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
              >
                <option value="">-- Choose Employee --</option>
                {filteredEmployees.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.companyEmployeeNumber || e.employeeId}) • {e.department}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Target Employee Active Assets Snapshot */}
          {targetEmployee && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <EmployeeAvatar name={targetEmployee.name} size="sm" photoUrl={targetEmployee.photoUrl} />
                  <div>
                    <strong className="text-slate-900 dark:text-white font-bold block">
                      {targetEmployee.name}
                    </strong>
                    <span className="text-[10px] text-slate-400">
                      {targetEmployee.designation} • {targetEmployee.department}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {totalAssignedCount} Assigned Device{totalAssignedCount !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Asset Snapshot Pills */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-1.5">
                {assignedComputers.map(c => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-700 dark:text-slate-300"
                  >
                    <Laptop className="w-3 h-3 text-blue-500" />
                    <span>{c.assetNumber} ({c.model || c.manufacturer})</span>
                  </span>
                ))}
                {assignedAssets.map(a => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-700 dark:text-slate-300"
                  >
                    {a.assetType === 'Mobile Phone' ? (
                      <Smartphone className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Headphones className="w-3 h-3 text-purple-500" />
                    )}
                    <span>{a.assetNumber} ({a.assetType})</span>
                  </span>
                ))}
                {assignedSims.map(s => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-700 dark:text-slate-300"
                  >
                    <Smartphone className="w-3 h-3 text-amber-500" />
                    <span>SIM {s.contactNumber}</span>
                  </span>
                ))}
                {totalAssignedCount === 0 && (
                  <span className="text-[11px] text-slate-400 italic">
                    No active company hardware currently assigned to this employee.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Exit Type & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Separation Type <span className="text-red-500">*</span>
              </label>
              <select
                value={exitType}
                onChange={e => setExitType(e.target.value as ExitType)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
              >
                <option value="Resignation">Resignation</option>
                <option value="Termination">Termination</option>
                <option value="Mutual Separation">Mutual Separation</option>
                <option value="End of Contract">End of Contract</option>
                <option value="Retirement">Retirement</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Resignation / Notice Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={resignationDate}
                onChange={e => setResignationDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Final Working Date (Exit Date) <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={exitDate}
                onChange={e => setExitDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          {/* Clearance Return Window (2 - 5 Days) */}
          <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-blue-900 dark:text-blue-200 block">
                  Asset Clearance Window Period (2–5 Days)
                </span>
                <p className="text-[10px] text-blue-700/80 dark:text-blue-300/80">
                  Late return penalty of ₹500/day per asset applies after deadline.
                </p>
              </div>

              {/* Day selection pill buttons */}
              <div className="flex items-center gap-1">
                {[2, 3, 4, 5].map(days => (
                  <button
                    type="button"
                    key={days}
                    onClick={() => setClearanceWindowDays(days)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      clearanceWindowDays === days
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {days} Days
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">
                Exit Date: <strong>{formatDateDisplay(exitDate)}</strong> + {clearanceWindowDays} Days Window
              </span>
              <span className="font-bold text-blue-700 dark:text-blue-300">
                Deadline: {formatDateDisplay(computedDeadline)}
              </span>
            </div>
          </div>

          {/* Notes / Remarks */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Clearance Remarks / Internal Exit Reference
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Standard 30-day notice served. IT clearance required for Full & Final payroll release."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!targetEmployee}
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <UserX className="w-4 h-4" />
              <span>Initiate Asset Clearance Process</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
