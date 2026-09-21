import React, { useState, useEffect } from 'react';
import { X, Smartphone, User, Tag, Calendar, FileText, CheckCircle2, AlertCircle, CreditCard, IndianRupee } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SimCard, SimPurpose, SimStatus, SimType, SIM_PURPOSES, SIM_TYPES } from '../../types';
import { calculateRechargeGst, formatINR } from '../../utils/simUtils';

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
  const { employees, addSimCard, updateSimCard, addSimRecharge } = useApp();

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

  // Direct Recharge Option for New SIMs
  const [enableInitialRecharge, setEnableInitialRecharge] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState<number | string>(399);
  const [rechargeGst, setRechargeGst] = useState<number | string>(18);
  const [rechargeDate, setRechargeDate] = useState(new Date().toISOString().split('T')[0]);
  const [rechargePlan, setRechargePlan] = useState('Monthly Corporate Unlimited');
  const [rechargePaymentMode, setRechargePaymentMode] = useState('Company UPI');
  const [rechargeRef, setRechargeRef] = useState('');
  const [rechargeRemarks, setRechargeRemarks] = useState('');

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
      setEnableInitialRecharge(false);
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
      setEnableInitialRecharge(false);
      setRechargeAmount(399);
      setRechargeGst(18);
      setRechargeDate(new Date().toISOString().split('T')[0]);
      setRechargePlan('Monthly Corporate Unlimited');
      setRechargePaymentMode('Company UPI');
      setRechargeRef('');
      setRechargeRemarks('');
    }
    setError(null);
  }, [editSim, preselectedEmployeeId, isOpen]);

  const calcInitialRecharge = calculateRechargeGst(rechargeAmount, rechargeGst);

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

    const calc = calculateRechargeGst(rechargeAmount, rechargeGst);
    if (!editSim && enableInitialRecharge) {
      if (calc.rechargeAmount <= 0) {
        setError('Please provide a valid recharge amount greater than 0.');
        return;
      }
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
      ...(!editSim && enableInitialRecharge ? {
        lastRechargeDate: rechargeDate || new Date().toISOString().split('T')[0],
        lastRechargeAmount: calc.rechargeAmount,
        rechargeStatus: 'Recharged',
      } : {}),
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

      if (enableInitialRecharge && res?.data) {
        const assignedEmp = employees.find(e => e.id === assignedEmployeeId);
        addSimRecharge({
          simId: res.data.id,
          contactNumber: res.data.contactNumber,
          employeeId: assignedEmployeeId || null,
          employeeName: assignedEmp?.name || (assignedEmployeeId ? 'Assigned Employee' : 'Unassigned / Company Stock'),
          project: project.trim() || undefined,
          planDescription: rechargePlan.trim() || 'Direct SIM Setup Recharge',
          rechargeAmount: calc.rechargeAmount,
          gstPercentage: calc.gstPercentage,
          rechargeDate: rechargeDate || new Date().toISOString().split('T')[0],
          paymentMode: rechargePaymentMode,
          referenceNumber: rechargeRef.trim() || undefined,
          remarks: rechargeRemarks.trim() || 'Direct recharge upon SIM registration',
        });
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

            {/* Optional Recharge for New SIM */}
            {!editSim && (
              <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.03] p-4 space-y-3.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="enableInitialRecharge"
                      checked={enableInitialRecharge}
                      onChange={e => setEnableInitialRecharge(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-zinc-700 text-orange-500 focus:ring-orange-500 focus:ring-offset-zinc-900 bg-zinc-900 cursor-pointer"
                    />
                    <div>
                      <label htmlFor="enableInitialRecharge" className="text-sm font-semibold text-white cursor-pointer select-none flex items-center gap-2">
                        <span>Recharge this SIM upon registration</span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Direct Recharge</span>
                      </label>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Instantly log a manual recharge payment for this SIM card upon creation, reflecting immediately on the employee's dashboard.
                      </p>
                    </div>
                  </div>
                </div>

                {enableInitialRecharge && (
                  <div className="pt-3 border-t border-zinc-800/80 space-y-3 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">
                          Base Recharge Amount (₹) <span className="text-orange-500">*</span>
                        </label>
                        <div className="relative">
                          <IndianRupee className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
                          <input
                            type="number"
                            min="1"
                            step="0.01"
                            value={rechargeAmount}
                            onChange={e => setRechargeAmount(e.target.value)}
                            placeholder="399"
                            className="w-full pl-8 pr-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">
                          GST Tax Rate (%)
                        </label>
                        <select
                          value={rechargeGst}
                          onChange={e => setRechargeGst(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
                        >
                          <option value={18}>18% GST (Standard Telecom)</option>
                          <option value={12}>12% GST</option>
                          <option value={5}>5% GST</option>
                          <option value={0}>0% (Tax Exempt / Nil)</option>
                          <option value={28}>28% GST</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">
                          Plan Description / Validity
                        </label>
                        <input
                          type="text"
                          value={rechargePlan}
                          onChange={e => setRechargePlan(e.target.value)}
                          placeholder="e.g. Monthly Unlimited 2GB/Day + 5G"
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">
                          Recharge Date
                        </label>
                        <input
                          type="date"
                          value={rechargeDate}
                          onChange={e => setRechargeDate(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">
                          Payment Mode
                        </label>
                        <select
                          value={rechargePaymentMode}
                          onChange={e => setRechargePaymentMode(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
                        >
                          <option value="Company UPI">Company UPI</option>
                          <option value="Corporate Credit Card">Corporate Credit Card</option>
                          <option value="Net Banking">Net Banking</option>
                          <option value="Vendor Postpaid Bill">Vendor Postpaid Bill</option>
                          <option value="Employee Reimbursement">Employee Reimbursement</option>
                          <option value="Cash / Petty Cash">Cash / Petty Cash</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">
                          Payment Reference / UTR (Optional)
                        </label>
                        <input
                          type="text"
                          value={rechargeRef}
                          onChange={e => setRechargeRef(e.target.value)}
                          placeholder="e.g. UPI-992817290"
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    {/* Calculated Total Summary Pill */}
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                      <div className="text-zinc-300">
                        Base: <span className="font-semibold text-white">{formatINR(calcInitialRecharge.rechargeAmount)}</span> + GST ({calcInitialRecharge.gstPercentage}%): <span className="font-semibold text-white">{formatINR(calcInitialRecharge.gstAmount)}</span>
                      </div>
                      <div className="font-bold text-emerald-400 text-sm">
                        Total: {formatINR(calcInitialRecharge.totalAmount)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
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
              <span>
                {editSim
                  ? 'Save Changes'
                  : enableInitialRecharge
                  ? `Register & Recharge (${formatINR(calcInitialRecharge.totalAmount)})`
                  : 'Register SIM Card'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
