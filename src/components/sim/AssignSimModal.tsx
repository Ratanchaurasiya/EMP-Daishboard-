import React, { useState, useEffect } from 'react';
import { X, Smartphone, User, Check, AlertCircle, Plus, FolderKanban, Calendar, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SimPurpose, SIM_PURPOSES } from '../../types';

interface AssignSimModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedEmployeeId?: string;
  preselectedSimId?: string;
}

export const AssignSimModal: React.FC<AssignSimModalProps> = ({
  isOpen,
  onClose,
  preselectedEmployeeId,
  preselectedSimId,
}) => {
  const { employees, simCards, assignSimCard, addSimCard, showToast } = useApp();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(preselectedEmployeeId || '');
  const [allocationMode, setAllocationMode] = useState<'existing' | 'new'>('existing');
  
  // Existing SIM selection
  const [selectedSimId, setSelectedSimId] = useState<string>(preselectedSimId || '');

  // New SIM creation fields
  const [newContactNumber, setNewContactNumber] = useState<string>('');
  const [newSimNumber, setNewSimNumber] = useState<string>('');
  const [newCarrier, setNewCarrier] = useState<string>('Airtel');

  // Common Assignment Fields
  const [purpose, setPurpose] = useState<SimPurpose>('WhatsApp');
  const [customPurpose, setCustomPurpose] = useState<string>('');
  const [project, setProject] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>(() => new Date().toISOString().substring(0, 10));
  const [remarks, setRemarks] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Available SIMs that are not currently assigned to anyone
  const availableSims = simCards.filter(
    s => s.status === 'Available' || !s.assignedEmployeeId || s.id === preselectedSimId
  );

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (preselectedEmployeeId) {
        setSelectedEmployeeId(preselectedEmployeeId);
      } else if (employees.length > 0 && !selectedEmployeeId) {
        setSelectedEmployeeId(employees[0].id);
      }

      if (preselectedSimId) {
        setSelectedSimId(preselectedSimId);
        const sim = simCards.find(s => s.id === preselectedSimId);
        if (sim) {
          setPurpose(sim.purpose || 'WhatsApp');
          setCustomPurpose(sim.customPurpose || '');
          setProject(sim.project || '');
          setAllocationMode('existing');
        }
      } else if (availableSims.length > 0) {
        setSelectedSimId(availableSims[0].id);
        setAllocationMode('existing');
      } else {
        setAllocationMode('new');
      }
    }
  }, [isOpen, preselectedEmployeeId, preselectedSimId, employees, simCards]);

  if (!isOpen) return null;

  const targetEmp = employees.find(
    e => e.id === selectedEmployeeId || e.employeeId === selectedEmployeeId
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedEmployeeId || !targetEmp) {
      setError('Please select an active employee to assign the SIM card to.');
      return;
    }

    if (purpose === 'Other' && !customPurpose.trim()) {
      setError('Please specify the exact purpose for selecting "Other".');
      return;
    }

    if (allocationMode === 'existing') {
      if (!selectedSimId) {
        setError('Please select an available SIM card from inventory or choose "Enter New Contact Number".');
        return;
      }

      const res = assignSimCard(
        selectedSimId,
        targetEmp.id,
        purpose,
        purpose === 'Other' ? customPurpose.trim() : undefined,
        project.trim() || undefined,
        remarks.trim() || undefined
      );

      if (!res.success) {
        setError(res.error || 'Failed to assign SIM card.');
        return;
      }
    } else {
      // Create new SIM card and assign directly
      const cleanContact = newContactNumber.trim().replace(/\s+/g, '');
      if (!cleanContact) {
        setError('Please enter a valid 10-digit Contact / Mobile Number.');
        return;
      }

      // Check duplicate contact number
      const duplicate = simCards.find(
        s => s.contactNumber.replace(/\s+/g, '') === cleanContact
      );
      if (duplicate) {
        setError(`Contact Number "${cleanContact}" is already registered in the system (Status: ${duplicate.status}).`);
        return;
      }

      const createRes = addSimCard({
        contactNumber: cleanContact,
        simNumber: newSimNumber.trim() || `8991${Date.now().toString().slice(-15)}`,
        carrier: newCarrier,
        status: 'Assigned',
        assignedEmployeeId: targetEmp.id,
        assignedEmployeeName: targetEmp.name,
        purpose,
        customPurpose: purpose === 'Other' ? customPurpose.trim() : undefined,
        project: project.trim() || undefined,
        issueDate: issueDate || new Date().toISOString().substring(0, 10),
        remarks: remarks.trim() || `Assigned to ${targetEmp.name}`,
      });

      if (!createRes.success) {
        setError(createRes.error || 'Failed to create and assign SIM card.');
        return;
      }
    }

    showToast(`SIM card successfully allocated to ${targetEmp.name}!`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-4 bg-black/70 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 max-h-[calc(100vh-2rem)] sm:max-h-[88vh] flex flex-col my-auto">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-[#0d131f]/95 backdrop-blur-sm z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Allocate SIM / Contact Number
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Assign a dedicated telecom asset to an employee with project tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Target Employee Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Employee <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedEmployeeId}
                onChange={e => setSelectedEmployeeId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employeeId}) — {emp.department} [{emp.status}]
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Allocation Mode Toggle */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                SIM Source
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAllocationMode('existing')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    allocationMode === 'existing'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <span>📦 Available Stock ({availableSims.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAllocationMode('new')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    allocationMode === 'new'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register New SIM</span>
                </button>
              </div>
            </div>

            {/* 3. SIM Selection / Creation Fields */}
            {allocationMode === 'existing' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Available SIM / Contact Number <span className="text-rose-500">*</span>
                </label>
                {availableSims.length === 0 ? (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between">
                    <span>No unassigned SIMs available in buffer stock.</span>
                    <button
                      type="button"
                      onClick={() => setAllocationMode('new')}
                      className="font-bold underline text-emerald-600 dark:text-emerald-400 ml-2"
                    >
                      + Add New Number
                    </button>
                  </div>
                ) : (
                  <select
                    value={selectedSimId}
                    onChange={e => {
                      setSelectedSimId(e.target.value);
                      const sim = simCards.find(s => s.id === e.target.value);
                      if (sim?.project) setProject(sim.project);
                      if (sim?.purpose) setPurpose(sim.purpose);
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {availableSims.map(sim => (
                      <option key={sim.id} value={sim.id}>
                        {sim.contactNumber} — {sim.carrier || 'Standard'} ({sim.purpose}) [{sim.status}]
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Contact / Mobile No <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9876543210"
                      value={newContactNumber}
                      onChange={e => setNewContactNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Carrier / Telecom Operator
                    </label>
                    <select
                      value={newCarrier}
                      onChange={e => setNewCarrier(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="Airtel">Airtel</option>
                      <option value="Jio">Jio</option>
                      <option value="Vodafone Idea (Vi)">Vodafone Idea (Vi)</option>
                      <option value="BSNL">BSNL</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    SIM Card / ICCID Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 8991001234567890123"
                    value={newSimNumber}
                    onChange={e => setNewSimNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* 4. Purpose & Project Assignment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Purpose / Reason <span className="text-rose-500">*</span>
                </label>
                <select
                  value={purpose}
                  onChange={e => setPurpose(e.target.value as SimPurpose)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {SIM_PURPOSES.map(p => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. ABC Project, Growth Marketing"
                  value={project}
                  onChange={e => setProject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Custom Purpose If Other */}
            {purpose === 'Other' && (
              <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <label className="block text-xs font-semibold text-orange-600 dark:text-orange-400 mb-1.5">
                  Please specify purpose <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter exact purpose of this SIM allocation..."
                  value={customPurpose}
                  onChange={e => setCustomPurpose(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-orange-500/40 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                />
              </div>
            )}

            {/* Allocation Date & Remarks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Allocation Date
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={e => setIssueDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Remarks (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Allocation notes / instructions..."
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Fixed Action Buttons */}
          <div className="shrink-0 flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-[#0d131f]/95 backdrop-blur-sm">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Allocate SIM to Employee</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
