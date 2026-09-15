import React, { useState, useEffect } from 'react';
import { X, CreditCard, IndianRupee, Calculator, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SimCard } from '../../types';
import { calculateRechargeGst, formatINR } from '../../utils/simUtils';

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

  const [selectedSimId, setSelectedSimId] = useState('');
  const [project, setProject] = useState('');
  const [rechargeDate, setRechargeDate] = useState(new Date().toISOString().split('T')[0]);
  const [planDescription, setPlanDescription] = useState('');
  const [rechargeAmount, setRechargeAmount] = useState<number | string>(839);
  const [gstPercentage, setGstPercentage] = useState<number | string>(18);
  const [paymentMode, setPaymentMode] = useState('Company UPI');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let targetSim: SimCard | undefined;
    if (preselectedSim) {
      targetSim = preselectedSim;
      setSelectedSimId(preselectedSim.id);
    } else if (preselectedSimId) {
      targetSim = simCards.find(s => s.id === preselectedSimId);
      setSelectedSimId(preselectedSimId);
    } else if (simCards.length > 0) {
      targetSim = simCards[0];
      setSelectedSimId(simCards[0].id);
    }
    if (targetSim?.project) {
      setProject(targetSim.project);
    }
  }, [preselectedSim, preselectedSimId, simCards, isOpen]);

  if (!isOpen) return null;

  const currentSim = simCards.find(s => s.id === selectedSimId);
  const calc = calculateRechargeGst(rechargeAmount, gstPercentage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedSimId || !currentSim) {
      setError('Please select a valid SIM card.');
      return;
    }

    if (!planDescription.trim()) {
      setError('Please provide a recharge plan description or pack detail.');
      return;
    }

    if (calc.rechargeAmount <= 0) {
      setError('Recharge amount must be greater than zero.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Log SIM Card Recharge</h2>
              <p className="text-xs text-zinc-400">
                Track telecom recurring costs, automatic GST calculations, and invoices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SIM Card Selector */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Select SIM / Contact Number <span className="text-orange-500">*</span>
            </label>
            <select
              value={selectedSimId}
              onChange={e => setSelectedSimId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
            >
              {simCards.map(sim => (
                <option key={sim.id} value={sim.id}>
                  {sim.contactNumber} — {sim.assignedEmployeeName ? `${sim.assignedEmployeeName} (${sim.purpose})` : `In Stock (${sim.purpose})`} [{sim.carrier || 'Telecom'}]
                </option>
              ))}
            </select>
          </div>

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

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium shadow-lg shadow-emerald-600/20 transition-all flex items-center space-x-2"
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
