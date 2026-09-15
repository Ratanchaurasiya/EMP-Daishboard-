import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AssetCondition, AssetStatus } from '../../types';
import { X, Laptop, Check, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';

interface AddComputerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddComputerModal: React.FC<AddComputerModalProps> = ({ isOpen, onClose }) => {
  const { addComputer, employees, computers, resetGlobalFilters } = useApp();

  // Auto-calculate next available asset number (e.g. LAP-011)
  const nextSuggestedAsset = useMemo(() => {
    const numbers = computers
      .map(c => {
        const match = c.assetNumber.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter(n => !isNaN(n));
    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNum = maxNum + 1;
    return `LAP-${String(nextNum).padStart(3, '0')}`;
  }, [computers]);

  const [assetNumber, setAssetNumber] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [manufacturer, setManufacturer] = useState('Dell');
  const [model, setModel] = useState('Latitude 5430');
  const [deviceType, setDeviceType] = useState<'Laptop' | 'Desktop'>('Laptop');
  const [serialNumber, setSerialNumber] = useState('');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState<string>('');

  // Pre-fill smart defaults whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const suggested = nextSuggestedAsset;
      setAssetNumber(suggested);
      setDeviceName(`WS-${suggested}`);
      setSerialNumber(`SN-${suggested}-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  }, [isOpen, nextSuggestedAsset]);

  // Real-time check for duplicate asset number
  const isDuplicateAsset = useMemo(() => {
    const trimmed = assetNumber.trim();
    if (!trimmed) return false;
    return computers.some(
      c => c.assetNumber.trim().toLowerCase() === trimmed.toLowerCase()
    );
  }, [assetNumber, computers]);
  
  // Specs
  const [processorName, setProcessorName] = useState('12th Gen Intel(R) Core(TM) i5-1245U');
  const processorGen = '12th Gen';
  const processorSpeed = '1.60 GHz';

  const [installedRAM, setInstalledRAM] = useState('16.00 GB');
  const usableRAM = '15.75 GB';

  const graphicsCard = 'Intel(R) Iris(R) Xe Graphics';
  const graphicsMemory = '512 MB';

  const [storageTotal, setStorageTotal] = useState('512 GB');
  const storageUsed = '40 GB';
  const storageFree = '472 GB';
  const storageType = 'NVMe SSD';

  const [os, setOs] = useState('Windows 11 Pro 64-bit');
  const systemType = '64-bit operating system, x64-based processor';
  const processorArchitecture = 'x64';
  const deviceId = '9A810234-BC11-4821-A901-817263548192';
  const productId = '00330-80000-00018-AAOEM';
  const penAndTouch = 'No pen or touch input is available for this display';

  const condition: AssetCondition = 'New';
  const status: AssetStatus = 'Available';

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isDuplicateAsset) return;

    const finalAsset = assetNumber.trim() || nextSuggestedAsset;
    const finalDeviceName = deviceName.trim() || `DEV_${finalAsset.replace('-', '_')}`;
    const finalSerial = serialNumber.trim() || `SN-${finalAsset}-${Math.floor(1000 + Math.random() * 9000)}`;

    const res = addComputer({
      assetNumber: finalAsset,
      deviceName: finalDeviceName,
      manufacturer,
      model,
      deviceType,
      serialNumber: finalSerial,
      assignedEmployeeId: assignedEmployeeId || null,
      processor: {
        name: processorName,
        generation: processorGen,
        speed: processorSpeed,
      },
      memory: {
        installedRAM,
        usableRAM,
      },
      graphics: {
        card: graphicsCard,
        memory: graphicsMemory,
      },
      storage: {
        total: storageTotal,
        used: storageUsed,
        free: storageFree,
        type: storageType,
      },
      system: {
        os,
        systemType,
        processorArchitecture,
        deviceId,
        productId,
        penAndTouch,
      },
      condition,
      status: assignedEmployeeId ? 'Assigned' : status,
      assignedDate: assignedEmployeeId ? new Date().toISOString().substring(0, 10) : null,
    });

    if (res.success) {
      resetGlobalFilters();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#101726] rounded-t-2xl sm:rounded-xl max-w-2xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-[#1e293b] animate-fade-in my-0 sm:my-auto text-xs">
        <div className="p-4 border-b border-slate-100 dark:border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Add Computer to Inventory
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Register a new desktop or laptop with hardware parameters
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                  Asset Number *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setAssetNumber(nextSuggestedAsset);
                    setDeviceName(`WS-${nextSuggestedAsset}`);
                    setSerialNumber(`SN-${nextSuggestedAsset}-${Math.floor(1000 + Math.random() * 9000)}`);
                  }}
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-mono font-semibold cursor-pointer"
                  title="Auto-fill with next available sequential asset number"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Next: {nextSuggestedAsset}</span>
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="e.g. LAP-015"
                value={assetNumber}
                onChange={e => setAssetNumber(e.target.value)}
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border rounded-lg text-xs font-mono font-semibold focus:outline-hidden transition-colors ${
                  isDuplicateAsset
                    ? 'border-rose-500 text-rose-500 focus:ring-1 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
                }`}
              />
              {isDuplicateAsset ? (
                <div className="flex items-center gap-1 text-[11px] text-rose-500 font-semibold mt-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>Asset number "{assetNumber}" already exists in fleet!</span>
                </div>
              ) : assetNumber.trim() ? (
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>Asset number is available for registration</span>
                </div>
              ) : null}
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Device Name
              </label>
              <input
                type="text"
                placeholder="e.g. IT_Pool_Laptop"
                value={deviceName}
                onChange={e => setDeviceName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs font-mono focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Manufacturer
              </label>
              <input
                type="text"
                value={manufacturer}
                onChange={e => setManufacturer(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Model
              </label>
              <input
                type="text"
                value={model}
                onChange={e => setModel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Device Type
              </label>
              <select
                value={deviceType}
                onChange={e => setDeviceType(e.target.value as 'Laptop' | 'Desktop')}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              >
                <option value="Laptop">Laptop</option>
                <option value="Desktop">Desktop</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Serial Number
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={e => setSerialNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs font-mono focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Assign to Employee (Optional)
              </label>
              <select
                value={assignedEmployeeId}
                onChange={e => setAssignedEmployeeId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              >
                <option value="">Keep in IT Inventory Pool (Unassigned)</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employeeId}) - {emp.department}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Processor & Memory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Processor
              </label>
              <input
                type="text"
                value={processorName}
                onChange={e => setProcessorName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Installed RAM
              </label>
              <input
                type="text"
                value={installedRAM}
                onChange={e => setInstalledRAM(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs font-mono focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              />
            </div>
          </div>

          {/* Storage & OS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Storage Total
              </label>
              <input
                type="text"
                value={storageTotal}
                onChange={e => setStorageTotal(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs font-mono focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Operating System
              </label>
              <input
                type="text"
                value={os}
                onChange={e => setOs(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-[#1e293b]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDuplicateAsset || !assetNumber.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Register Computer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
