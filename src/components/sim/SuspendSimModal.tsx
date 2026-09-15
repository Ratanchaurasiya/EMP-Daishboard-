import React, { useState } from 'react';
import { X, AlertTriangle, MessageSquare, ShieldAlert, Send } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SimCard } from '../../types';
import { generateSimSuspensionWhatsAppUrl } from '../../utils/simUtils';

interface SuspendSimModalProps {
  isOpen: boolean;
  onClose: () => void;
  sim: SimCard | null;
}

export const SuspendSimModal: React.FC<SuspendSimModalProps> = ({
  isOpen,
  onClose,
  sim,
}) => {
  const { suspendSimCard, currentUser } = useApp();
  const [reason, setReason] = useState('');
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !sim) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanReason = reason.trim();
    if (!cleanReason) {
      setError('Mandatory Reason/Remarks are required before suspending a SIM card.');
      return;
    }

    const res = suspendSimCard(sim.id, cleanReason);
    if (res && !res.success) {
      setError(res.error || 'Failed to suspend SIM card.');
      return;
    }

    // Open WhatsApp link if checked
    if (sendWhatsApp) {
      const waUrl = generateSimSuspensionWhatsAppUrl(
        sim,
        cleanReason,
        currentUser?.name || 'IT Administrator'
      );
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }

    setReason('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-rose-500/30 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-rose-500/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Suspend SIM Card</h2>
              <p className="text-xs text-zinc-400">
                Number: <span className="text-rose-400 font-mono font-medium">{sim.contactNumber}</span>
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-300 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-zinc-500">Assigned To:</span>
              <span className="text-white font-medium">{sim.assignedEmployeeName || 'Unassigned / Buffer'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Current Purpose:</span>
              <span className="text-white font-medium">{sim.purpose === 'Other' ? sim.customPurpose || 'Other' : sim.purpose}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Carrier:</span>
              <span className="text-white font-medium">{sim.carrier || 'N/A'}</span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-200 mb-1.5">
              Reason for Suspension <span className="text-rose-400">* (Mandatory)</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Employee offboarded, device lost/stolen, temporary company holding, billing hold..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors resize-none"
            />
          </div>

          <label className="flex items-center space-x-2.5 cursor-pointer select-none text-xs text-zinc-300 pt-1">
            <input
              type="checkbox"
              checked={sendWhatsApp}
              onChange={e => setSendWhatsApp(e.target.checked)}
              className="rounded border-zinc-700 text-rose-500 focus:ring-rose-500 w-4 h-4 bg-zinc-950"
            />
            <span className="flex items-center space-x-1.5 text-emerald-400">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Generate WhatsApp Alert Link for Telecom Admin / Manager</span>
            </span>
          </label>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium shadow-lg shadow-rose-600/20 transition-all flex items-center space-x-2"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Confirm Suspension</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
