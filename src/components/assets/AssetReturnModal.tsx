import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AssetCondition } from '../../types';
import { X, RotateCcw, Check } from 'lucide-react';

interface AssetReturnModalProps {
  assetId: string;
  onClose: () => void;
}

export const AssetReturnModal: React.FC<AssetReturnModalProps> = ({
  assetId,
  onClose,
}) => {
  const { assets, employees, returnAsset } = useApp();

  const asset = assets.find(a => a.id === assetId);
  const previousEmp = employees.find(
    e => e.id === asset?.assignedEmployeeId || e.employeeId === asset?.assignedEmployeeId
  );

  const [returnDate, setReturnDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [returnCondition, setReturnCondition] = useState<AssetCondition>('Good');
  const [receivedBy, setReceivedBy] = useState<string>('IT Administrator');
  const [statusOption, setStatusOption] = useState<'Available' | 'Returned'>('Available');
  const [remarks, setRemarks] = useState<string>('Inspected and tested. Returned in working order.');

  if (!asset) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = returnAsset(
      asset.id,
      returnDate,
      returnCondition,
      receivedBy,
      statusOption,
      remarks
    );

    if (res.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#101726] rounded-t-2xl sm:rounded-xl max-w-md w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col p-5 shadow-2xl border border-slate-200 dark:border-[#1e293b] animate-fade-in my-0 sm:my-auto text-xs overflow-y-auto">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-[#1e293b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Process Asset Return
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Log hardware check-in, inspect condition, and update stock state
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Asset Info Banner */}
        <div className="p-3 my-3.5 rounded-lg bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] space-y-1">
          <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>
              [{asset.assetType}] {asset.brand} {asset.model}
            </span>
            <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
              {asset.assetNumber}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Returned from:{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {previousEmp ? `${previousEmp.name} (${previousEmp.employeeId})` : 'Assigned Employee'}
            </strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Return Date *
              </label>
              <input
                type="date"
                required
                value={returnDate}
                onChange={e => setReturnDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Return Condition *
              </label>
              <select
                value={returnCondition}
                onChange={e => setReturnCondition(e.target.value as AssetCondition)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              >
                <option value="Good">Good (Working)</option>
                <option value="Fair">Fair (Minor wear)</option>
                <option value="Damaged">Damaged (Needs repair)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              New Inventory Status
            </label>
            <select
              value={statusOption}
              onChange={e => setStatusOption(e.target.value as 'Available' | 'Returned')}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
            >
              <option value="Available">Available (Ready to re-assign immediately)</option>
              <option value="Returned">Returned (Held in quarantine / de-provisioned)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Received By Technician / Admin
            </label>
            <input
              type="text"
              value={receivedBy}
              onChange={e => setReceivedBy(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Inspection Remarks
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#1e293b]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow-xs transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Complete Return</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
