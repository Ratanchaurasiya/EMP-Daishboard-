import React, { useState, useEffect, useMemo } from 'react';
import { X, CreditCard, IndianRupee, Calculator, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SimCard } from '../../types';
import { calculateRechargeGst, formatINR, isActiveAssignedSim, getActiveAssignedSimCards } from '../../utils/simUtils';

interface AddRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedSim?: SimCard | null;
  preselectedSimId?: string;
}

export const AddRechargeModal: React.FC<AddRechargeModalProps> = ({
  isOpen,
  onClose,
  preselectedSim,
  preselectedSimId,
}) => {
  const { simCards, addSimRecharge } = useApp();

  const [rechargeScope, setRechargeScope] = useState<'ALL_ACTIVE' | 'SINGLE_SIM'>('ALL_ACTIVE');
  const [selectedSimId, setSelectedSimId] = useState('');
  const [project, setProject] = useState('');
  const [rechargeDate, setRechargeDate] = useState(new Date().toISOString().split('T')[0]);
  const [planDescription, setPlanDescription] = useState('Monthly Corporate Unlimited');
  const [rechargeAmount, setRechargeAmount] = useState<number | string>(399);
  const [gstPercentage, setGstPercentage] = useState<number | string>(18);
  const [paymentMode, setPaymentMode] = useState('Company UPI');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);

  // STRICT RULE: Only include currently Active assigned SIM Cards
  // Excludes Buffer SIMs, unassigned stock, blocked/suspended SIMs, inactive, and deactivated SIMs
  const activeAssignedSims = useMemo(() => {
    return getActiveAssignedSimCards(simCards);
  }, [simCards]);

  const eligibleSims = useMemo(() => {
    if (preselectedSim && isActiveAssignedSim(preselectedSim)) {
      if (!activeAssignedSims.some(s => s.id === preselectedSim.id)) {
        return [preselectedSim, ...activeAssignedSims];
      }
    }
    return activeAssignedSims;
  }, [preselectedSim, activeAssignedSims]);

  useEffect(() => {
    if (isOpen) {
      if (preselectedSim && isActiveAssignedSim(preselectedSim)) {
        setRechargeScope('SINGLE_SIM');
        setSelectedSimId(preselectedSim.id);
        if (preselectedSim.project) setProject(preselectedSim.project);
      } else if (preselectedSimId) {
        setRechargeScope('SINGLE_SIM');
        const found = eligibleSims.find(s => s.id === preselectedSimId);
        if (found) {
          setSelectedSimId(found.id);
          if (found.project) setProject(found.project);
        }
      } else {
        setRechargeScope('ALL_ACTIVE');
        if (eligibleSims.length > 0) {
          setSelectedSimId(eligibleSims[0].id);
        }
      }
    }
  }, [preselectedSim, preselectedSimId, eligibleSims, isOpen]);

  if (!isOpen) return null;

  const currentSim = simCards.find(s => s.id === selectedSimId);
  const calc = calculateRechargeGst(rechargeAmount, gstPercentage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!planDescription.trim()) {
      setError('Please provide a recharge plan description or pack detail.');
      return;
    }

    if (calc.rechargeAmount <= 0) {
      setError('Recharge amount must be greater than zero.');
      return;
    }

    if (rechargeScope === 'ALL_ACTIVE') {
      if (activeAssignedSims.length === 0) {
        setError('No active assigned SIM cards available for batch recharge.');
        return;
      }

      let errCount = 0;
      activeAssignedSims.forEach((sim, idx) => {
        const payload = {
          simId: sim.id,
          contactNumber: sim.contactNumber,
          employeeId: sim.assignedEmployeeId || null,
          employeeName: sim.assignedEmployeeName || null,
          project: project.trim() || sim.project || undefined,
          rechargeDate,
          planDescription: planDescription.trim(),
          rechargeAmount: calc.rechargeAmount,
          gstPercentage: calc.gstPercentage,
          paymentMode,
          referenceNumber: referenceNumber.trim() ? `${referenceNumber.trim()}-${idx + 1}` : undefined,
          remarks: remarks.trim() || 'Batch recharge for all active assigned corporate lines',
        };

        const res = addSimRecharge(payload);
        if (res && !res.success) errCount++;
      });

      if (errCount > 0) {
        setError(`Batch recharge completed with ${errCount} errors.`);
        return;
      }

      onClose();
      return;
    }

    // Single SIM Recharge
    if (!selectedSimId || !currentSim) {
      setError('Please select an active assigned SIM card for recharge.');
      return;
    }

    if (!isActiveAssignedSim(currentSim)) {
      setError('Recharge can only be recorded for active assigned SIM cards. Buffer, unassigned, or suspended SIMs are excluded.');
      return;
    }

    const payload = {
      simId: currentSim.id,
      contactNumber: currentSim.contactNumber,
      employeeId: currentSim.assignedEmployeeId || null,
      employeeName: currentSim.assignedEmployeeName || null,
      project: project.trim() || currentSim.project || undefined,
      rechargeDate,
      planDescription: planDescription.trim(),
      rechargeAmount: calc.rechargeAmount,
      gstPercentage: calc.gstPercentage,
      paymentMode,
      referenceNumber: referenceNumber.trim() || undefined,
      remarks: remarks.trim() || undefined,
    };

    const res = addSimRecharge(payload);
    if (res && !res.success) {
      setError(res.error || 'Failed to record SIM recharge.');
      return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-4 bg-black/70 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 max-h-[calc(100vh-2rem)] sm:max-h-[88vh] flex flex-col my-auto">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-sm z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white leading-tight">Recharge Active Assigned SIMs</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Log recurring telecom expense for active employee corporate lines ({eligibleSims.length} active SIMs eligible)
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
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Recharge Mode Scope Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950/80 border border-zinc-800 rounded-xl">
              <button
                type="button"
                onClick={() => setRechargeScope('ALL_ACTIVE')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  rechargeScope === 'ALL_ACTIVE'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Recharge All Assigned SIMs ({activeAssignedSims.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setRechargeScope('SINGLE_SIM')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  rechargeScope === 'SINGLE_SIM'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Single Active SIM Line</span>
              </button>
            </div>

            {rechargeScope === 'ALL_ACTIVE' ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-white">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Batch Recharging All {activeAssignedSims.length} Active Assigned SIM Cards</span>
                </div>
                <p className="text-[11px] text-emerald-300/90 leading-relaxed">
                  Every employee with an active assigned SIM will automatically receive a dashboard notification and updated SIM status. Buffer, unassigned, suspended, or deactivated SIMs are excluded.
                </p>
              </div>
            ) : (
              /* SIM Card Selector */
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span>Select Active Assigned SIM Number <span className="text-orange-500">*</span></span>
                  <span className="text-[10px] text-emerald-400 font-mono">({eligibleSims.length} Active SIMs)</span>
                </label>
                <select
                  value={selectedSimId}
                  onChange={e => {
                    setSelectedSimId(e.target.value);
                    const sim = simCards.find(s => s.id === e.target.value);
                    if (sim?.project) setProject(sim.project);
                  }}
                  className="w-full px-3.5 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                >
                  {eligibleSims.length === 0 ? (
                    <option value="">No Active Assigned SIM Cards Available for Recharge</option>
                  ) : (
                    eligibleSims.map(sim => (
                      <option key={sim.id} value={sim.id}>
                        {sim.contactNumber} — {sim.assignedEmployeeName || 'Assigned User'} ({sim.purpose}) [{sim.carrier || 'Telecom'}]
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            {/* Project Name */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Project Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. ABC Project, Field Ops, Marketing"
                value={project}
                onChange={e => setProject(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Recharge Date */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Recharge Date <span className="text-orange-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={rechargeDate}
                  onChange={e => setRechargeDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                />
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={e => setPaymentMode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                >
                  <option value="Company UPI">Company UPI</option>
                  <option value="Corporate Card">Corporate Credit Card</option>
                  <option value="Net Banking">Net Banking / Direct Debit</option>
                  <option value="Cash / Expense Claim">Cash / Employee Expense Claim</option>
                </select>
              </div>
            </div>

            {/* Plan Description */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Recharge Plan / Pack Description <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Airtel 84 Days Unlimited 5G (2GB/Day) or Monthly Unlimited ₹399"
                value={planDescription}
                onChange={e => setPlanDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
              />
            </div>

            {/* Amount & GST Calculation Section */}
            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-300">
                <Calculator className="w-4 h-4 text-orange-500" />
                <span>Tax & Expenditure Breakdown</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Base Recharge Amount (₹) <span className="text-orange-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={rechargeAmount}
                      onChange={e => setRechargeAmount(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white font-medium focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    GST % (Tax Rate)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={gstPercentage}
                      onChange={e => setGstPercentage(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white font-medium focus:outline-none focus:border-orange-500 transition-colors"
                    />
                    <span className="absolute right-3 top-2 text-zinc-500 text-sm">%</span>
                  </div>
                </div>
              </div>

              {/* Auto Calculated Summary Display */}
              <div className="pt-2 border-t border-zinc-800/80 grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between py-1 px-2.5 rounded-lg bg-zinc-900/50">
                  <span className="text-zinc-400">Calculated GST ({calc.gstPercentage}%):</span>
                  <span className="text-zinc-200 font-mono font-medium">{formatINR(calc.gstAmount)}</span>
                </div>
                <div className="flex justify-between py-1 px-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-emerald-400 font-semibold">Total with GST:</span>
                  <span className="text-emerald-300 font-mono font-bold">{formatINR(calc.totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Reference Number */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Transaction / Invoice Ref
                </label>
                <input
                  type="text"
                  placeholder="e.g. TXN-AIR-9921 / INV-2026-08"
                  value={referenceNumber}
                  onChange={e => setReferenceNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Remarks / Expense Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Approved monthly recurring calling allowance"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                />
              </div>
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
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium shadow-lg shadow-emerald-600/20 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record Recharge ({formatINR(calc.totalAmount)})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
