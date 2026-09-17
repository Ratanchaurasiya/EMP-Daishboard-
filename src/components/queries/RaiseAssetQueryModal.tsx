import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AssetQueryType } from '../../types';
import { X, HelpCircle, Star, Send, Laptop, Smartphone, Monitor, ShieldAlert } from 'lucide-react';
import { getEmployeeAssignedCompanyAssets } from '../../utils/assetUtils';

interface RaiseAssetQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedAssetId?: string;
  preselectedAssetTag?: string;
}

const QUERY_TYPE_OPTIONS: Array<{ type: AssetQueryType; label: string; icon: string }> = [
  { type: 'Hardware Issue', label: 'Hardware Issue', icon: '💻' },
  { type: 'Software / OS', label: 'Software & Operating System', icon: '⚙️' },
  { type: 'Battery / Charger', label: 'Battery / Power / Charger', icon: '🔋' },
  { type: 'Performance / Slow', label: 'Slow Performance / Freezing', icon: '⚡' },
  { type: 'Handover Followup', label: 'Handover & Setup Followup', icon: '🔄' },
  { type: 'Physical Damage', label: 'Physical Damage / Screen', icon: '⚠️' },
  { type: 'Other', label: 'Other Asset Inquiry', icon: '❓' },
];

export const RaiseAssetQueryModal: React.FC<RaiseAssetQueryModalProps> = ({
  isOpen,
  onClose,
  preselectedAssetId,
  preselectedAssetTag,
}) => {
  const {
    currentUser,
    employees,
    computers,
    assets,
    addAssetQuery,
    showToast,
  } = useApp();

  // Find logged in employee
  const currentEmp = useMemo(() => {
    if (!currentUser) return employees[0];
    return (
      employees.find(
        e =>
          e.id === currentUser.id ||
          e.employeeId === currentUser.employeeId ||
          (currentUser.email && e.email && currentUser.email.toLowerCase() === e.email.toLowerCase())
      ) || employees[0]
    );
  }, [currentUser, employees]);

  // Assigned assets for employee
  const assignedComp = computers.find(
    c => c.assignedEmployeeId === currentEmp.id || c.assignedEmployeeId === currentEmp.employeeId
  );
  const assignedAssetsList = getEmployeeAssignedCompanyAssets(currentEmp, assignedComp, assets);

  // Form states
  const [selectedAssetKey, setSelectedAssetKey] = useState<string>('');
  const [queryType, setQueryType] = useState<AssetQueryType>('Hardware Issue');
  const [subject, setSubject] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isStarred, setIsStarred] = useState<boolean>(false);

  useEffect(() => {
    if (assignedAssetsList.length > 0) {
      if (preselectedAssetTag) {
        const found = assignedAssetsList.find(a => a.assetNumber === preselectedAssetTag);
        if (found) {
          setSelectedAssetKey(found.id);
          return;
        }
      }
      setSelectedAssetKey(assignedAssetsList[0].id);
    }
  }, [isOpen, preselectedAssetTag]);

  if (!isOpen || !currentEmp) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      showToast('Please provide a subject and detailed description for your query.', 'error');
      return;
    }

    const selectedAssetObj = assignedAssetsList.find(a => a.id === selectedAssetKey);

    const assetNumber = selectedAssetObj ? selectedAssetObj.assetNumber : preselectedAssetTag || 'LAP-GEN';
    const assetName = selectedAssetObj ? `${selectedAssetObj.brand} ${selectedAssetObj.model}` : 'Assigned Laptop / Workstation';
    const assetType = selectedAssetObj ? selectedAssetObj.assetType : 'Laptop';

    const res = addAssetQuery({
      employeeId: currentEmp.id,
      companyEmployeeNumber: currentEmp.companyEmployeeNumber || currentEmp.employeeId,
      employeeName: currentEmp.name,
      employeeEmail: currentEmp.email || 'employee@company.com',
      employeePhone: currentEmp.phone,
      department: currentEmp.department,
      assetId: selectedAssetObj ? selectedAssetObj.originalAssetId || selectedAssetObj.originalComputerId : undefined,
      assetNumber,
      assetName,
      assetType,
      queryType,
      subject: subject.trim(),
      description: description.trim(),
      isStarred,
    });

    if (res.success) {
      setSubject('');
      setDescription('');
      setIsStarred(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#101726] rounded-t-2xl sm:rounded-xl max-w-lg w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col p-5 shadow-2xl border border-slate-200 dark:border-[#1e293b] animate-fade-in my-0 sm:my-auto text-xs overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1e293b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Raise Asset Query
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Submit an issue or inquiry regarding your Laptop or assigned company asset
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
          {/* Staff Info Banner */}
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#090d16] border border-slate-200/80 dark:border-[#1e293b] flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Submitted By Staff
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {currentEmp.name} ({currentEmp.employeeId})
              </span>
              <span className="text-slate-500 text-[11px] block">
                {currentEmp.department} &bull; {currentEmp.email}
              </span>
            </div>
          </div>

          {/* Select Assigned Asset */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Select Laptop / Assigned Asset *
            </label>
            {assignedAssetsList.length === 0 ? (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px]">
                No active assigned assets found under your profile. General laptop query will be created.
              </div>
            ) : (
              <select
                value={selectedAssetKey}
                onChange={e => setSelectedAssetKey(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 font-medium cursor-pointer"
              >
                {assignedAssetsList.map(a => (
                  <option key={a.id} value={a.id}>
                    [{a.assetType}] {a.assetNumber} - {a.brand} {a.model} ({a.condition})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Query Type */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Category of Issue / Query *
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {QUERY_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setQueryType(opt.type)}
                  className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer ${
                    queryType === opt.type
                      ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                      : 'border-slate-200 dark:border-[#1e293b] bg-slate-50/50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <span className="text-base">{opt.icon}</span>
                  <span className="text-[11px] font-medium leading-tight">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Query Title / Subject *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Laptop screen flickering during video calls or battery health issue"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Detailed Description *
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the problem in detail (when it happens, error codes, hardware behavior)..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Star / Mark as Important Toggle */}
          <div className="p-3 bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/20 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block text-xs">
                  Mark / Star as Important Query
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                  Starred queries stay highlighted for immediate Admin attention
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsStarred(prev => !prev)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                isStarred
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
              }`}
            >
              {isStarred ? '⭐ Starred' : 'Star Query'}
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#1e293b]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Query to Admin</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
