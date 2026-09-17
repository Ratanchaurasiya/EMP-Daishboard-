import React, { useState, useEffect } from 'react';
import { X, Smartphone, User, Tag, Calendar, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SimCard, SimPurpose, SimStatus, SimType, SIM_PURPOSES, SIM_TYPES } from '../../types';

interface AddEditSimModalProps {
  isOpen: boolean;
  onClose: () => void;
  editSim?: SimCard | null;
  preselectedEmployeeId?: string;
}

export const AddEditSimModal: React.FC<AddEditSimModalProps> = ({
  isOpen,
  onClose,
  editSim,
  preselectedEmployeeId,
}) => {
  const { employees, addSimCard, updateSimCard } = useApp();

  const [contactNumber, setContactNumber] = useState('');
  const [simNumber, setSimNumber] = useState('');
  const [carrier, setCarrier] = useState('Airtel');
  const [simType, setSimType] = useState<SimType>('Prepaid');
  const [project, setProject] = useState('');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState('');
  const [status, setStatus] = useState<SimStatus>('Active');
  const [purpose, setPurpose] = useState<SimPurpose>('WhatsApp');
  const [customPurpose, setCustomPurpose] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editSim) {
      setContactNumber(editSim.contactNumber || '');
      setSimNumber(editSim.simNumber || '');
      setCarrier(editSim.carrier || 'Airtel');
      setSimType(editSim.simType || 'Prepaid');
      setProject(editSim.project || '');
      setAssignedEmployeeId(editSim.assignedEmployeeId || '');
      setStatus(editSim.status || 'Active');
      setPurpose(editSim.purpose || 'WhatsApp');
      setCustomPurpose(editSim.customPurpose || '');
      setIssueDate(editSim.issueDate || '');
      setRemarks(editSim.remarks || '');
    } else {
      setContactNumber('');
      setSimNumber('');
      setCarrier('Airtel');
      setSimType('Prepaid');
      setProject('');
      setAssignedEmployeeId(preselectedEmployeeId || '');
      setStatus('Active');
      setPurpose('WhatsApp');
      setCustomPurpose('');
      setIssueDate(new Date().toISOString().split('T')[0]);
      setRemarks('');
    }
    setError(null);
  }, [editSim, preselectedEmployeeId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanContact = contactNumber.trim();
    if (!cleanContact) {
      setError('Please provide a valid Mobile / Contact Number.');
      return;
    }

    if (purpose === 'Other' && !customPurpose.trim()) {
      setError('Please specify the exact custom purpose since "Other" was selected.');
      return;
    }

    const payload = {
      contactNumber: cleanContact,
      simNumber: simNumber.trim() || undefined,
      carrier: carrier.trim() || undefined,
      simType,
      project: project.trim() || undefined,
      assignedEmployeeId: assignedEmployeeId || null,
      status: assignedEmployeeId ? status : (status === 'Suspended' || status === 'Deactivated' ? status : 'Available'),
      purpose,
      customPurpose: purpose === 'Other' ? customPurpose.trim() : undefined,
      issueDate: assignedEmployeeId ? (issueDate || new Date().toISOString().split('T')[0]) : null,
      remarks: remarks.trim() || undefined,
    };

    if (editSim) {
      const res = updateSimCard(editSim.id, payload);
      if (res && !res.success) {
        setError(res.error || 'Failed to update SIM card.');
        return;
      }
    } else {
      const res = addSimCard(payload);
      if (res && !res.success) {
        setError(res.error || 'Failed to register new SIM card.');
        return;
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-4 bg-black/70 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 max-h-[calc(100vh-2rem)] sm:max-h-[88vh] flex flex-col my-auto">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-sm z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white leading-tight">
                {editSim ? 'Edit SIM Card / Number' : 'Register New SIM Card'}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Manage corporate telecom lines, employee allocation, and business purposes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 sm:space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Contact Number */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Contact / Mobile Number <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9876543210"
                  value={contactNumber}
                  onChange={e => setContactNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                />
              </div>

              {/* SIM Card / ICCID Number */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  SIM ICCID / Serial Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 8991000987654321001"
                  value={simNumber}
                  onChange={e => setSimNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                />
              </div>

              {/* Carrier */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Telecom Carrier
                </label>
                <select
                  value={carrier}
                  onChange={e => setCarrier(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                >
                  <option value="Airtel">Airtel</option>
                  <option value="Jio">Jio</option>
                  <option value="Vodafone Idea">Vodafone Idea (Vi)</option>
                  <option value="BSNL">BSNL</option>
                  <option value="Other">Other Carrier</option>
                </select>
              </div>

              {/* SIM Type */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  SIM Type <span className="text-orange-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimType('Prepaid')}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      simType === 'Prepaid'
                        ? 'border-emerald-500/80 bg-emerald-500/10 text-emerald-400 font-semibold'
                        : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-white'
                    }`}
                  >
                    ⚡ Prepaid
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimType('Postpaid')}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      simType === 'Postpaid'
                        ? 'border-indigo-500/80 bg-indigo-500/10 text-indigo-400 font-semibold'
                        : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-white'
                    }`}
                  >
                    📜 Postpaid
                  </button>
                </div>
              </div>

              {/* Project */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. ABC Project, Field Operations, General"
                  value={project}
                  onChange={e => setProject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                />
              </div>

              {/* Assigned Employee */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Assigned Employee
                </label>
                <select
                  value={assignedEmployeeId}
                  onChange={e => {
                    const val = e.target.value;
                    setAssignedEmployeeId(val);
                    if (val && status === 'Available') {
                      setStatus('Active');
                    } else if (!val && (status === 'Active' || status === 'Assigned')) {
                      setStatus('Available');
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                >
                  <option value="">Unassigned / Available in Stock</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeId || emp.companyEmployeeNumber}) - {emp.department}
                    </option>
                  ))}
                </select>
              </div>

              {/* SIM Status */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  SIM Status <span className="text-orange-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as SimStatus)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                >
                  <option value="Active">Active</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Available">Available (In Reserve)</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Deactivated">Deactivated</option>
                </select>
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Usage Purpose <span className="text-orange-500">*</span>
                </label>
                <select
                  value={purpose}
                  onChange={e => setPurpose(e.target.value as SimPurpose)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                >
                  {SIM_PURPOSES.map(p => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* If 'Other' purpose selected, show mandatory custom purpose text */}
            {purpose === 'Other' && (
              <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 animate-in fade-in duration-200">
                <label className="block text-xs font-medium text-orange-400 mb-1.5">
                  Specify Exact Purpose <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Field Operations, Client Demo Line, IoT Gateway"
                  value={customPurpose}
                  onChange={e => setCustomPurpose(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-orange-500/30 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            )}

            {/* Allocation Date */}
            {assignedEmployeeId && (
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Issue / Allocation Date
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={e => setIssueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                />
              </div>
            )}

            {/* Remarks */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Remarks & Allocation Notes
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Provided for regional sales calling and client lead management..."
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Fixed Footer Actions */}
          <div className="shrink-0 flex items-center justify-end space-x-3 px-6 py-4 border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-sm">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium shadow-lg shadow-orange-600/20 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editSim ? 'Save Changes' : 'Register SIM Card'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
