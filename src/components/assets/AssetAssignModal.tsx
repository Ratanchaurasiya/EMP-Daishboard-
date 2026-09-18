import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AssetCondition, AssetType } from '../../types';
import {
  X,
  UserCheck,
  Check,
  Plus,
  Layers,
  Sparkles,
} from 'lucide-react';

interface AssetAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedAssetId?: string;
  preSelectedEmployeeId?: string;
  preSelectedType?: AssetType;
}

const ASSET_TYPE_OPTIONS: Array<{
  type: AssetType;
  label: string;
  prefix: string;
  icon: string;
  placeholderBrand: string;
  placeholderModel: string;
}> = [
  {
    type: 'Monitor',
    label: 'Monitor',
    prefix: 'MON-',
    icon: '🖥️',
    placeholderBrand: 'Dell',
    placeholderModel: 'UltraSharp 27" 4K (U2723QE)',
  },
  {
    type: 'Mobile Phone',
    label: 'Mobile Phone',
    prefix: 'PHN-',
    icon: '📱',
    placeholderBrand: 'Samsung',
    placeholderModel: 'Galaxy S23 Enterprise Edition',
  },
  {
    type: 'Docking Station',
    label: 'Docking Station',
    prefix: 'DOC-',
    icon: '🔌',
    placeholderBrand: 'Dell',
    placeholderModel: 'WD19S 130W USB-C Dock',
  },
  {
    type: 'Mouse',
    label: 'Mouse',
    prefix: 'MOU-',
    icon: '🖱️',
    placeholderBrand: 'Logitech',
    placeholderModel: 'MX Master 3S / M90',
  },
  {
    type: 'Keyboard',
    label: 'Keyboard',
    prefix: 'KEY-',
    icon: '⌨️',
    placeholderBrand: 'Dell',
    placeholderModel: 'KB216 Multimedia Wired',
  },
  {
    type: 'Headset',
    label: 'Headset',
    prefix: 'HED-',
    icon: '🎧',
    placeholderBrand: 'Jabra',
    placeholderModel: 'Evolve 20 Stereo USB',
  },
  {
    type: 'Laptop',
    label: 'Laptop / PC',
    prefix: 'LAP-',
    icon: '💻',
    placeholderBrand: 'Dell',
    placeholderModel: 'Latitude 5430',
  },
  {
    type: 'Other',
    label: 'Other Equipment',
    prefix: 'AST-',
    icon: '📦',
    placeholderBrand: 'Logitech',
    placeholderModel: 'Brio 4K Web Camera / UPS',
  },
];

export const AssetAssignModal: React.FC<AssetAssignModalProps> = ({
  isOpen,
  onClose,
  preSelectedAssetId,
  preSelectedEmployeeId,
  preSelectedType,
}) => {
  const { assets, computers, employees, assignAsset, assignComputerToEmployee, addCompanyAsset, currentUser } = useApp();

  // Mode: 'issue' (Create brand-new asset directly to employee) vs 'pool' (Assign existing available stock)
  const [modalMode, setModalMode] = useState<'issue' | 'pool'>(
    preSelectedAssetId ? 'pool' : 'issue'
  );

  const availableAssets = useMemo(() => {
    return assets.filter(a => a.status === 'Available');
  }, [assets]);

  // Common fields
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(preSelectedEmployeeId || '');
  const [assignedDate, setAssignedDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [condition, setCondition] = useState<AssetCondition>('Good');
  const [issuedBy, setIssuedBy] = useState<string>(currentUser?.name || 'IT Administrator');
  const [remarks, setRemarks] = useState<string>('');

  // Pool mode fields
  const [selectedAssetId, setSelectedAssetId] = useState<string>(preSelectedAssetId || '');

  // Issue New Asset fields
  const [selectedType, setSelectedType] = useState<AssetType>(preSelectedType || 'Monitor');
  const [newAssetNumber, setNewAssetNumber] = useState<string>('');
  const [newBrand, setNewBrand] = useState<string>('');
  const [newModel, setNewModel] = useState<string>('');
  const [newSerialNumber, setNewSerialNumber] = useState<string>('');

  // Phone-specific fields when selectedType === 'Mobile Phone'
  const [newDeviceName, setNewDeviceName] = useState<string>('Samsung Galaxy S23');
  const [newImei, setNewImei] = useState<string>('');
  const [newPhoneNumber, setNewPhoneNumber] = useState<string>('');

  // Security Function fields for Laptop & Mobile
  const [securityFunctionAdded, setSecurityFunctionAdded] = useState<'Yes' | 'No'>('Yes');
  const [securityFunctionAddedDate, setSecurityFunctionAddedDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );

  // Update employee/asset if props change
  useEffect(() => {
    if (preSelectedEmployeeId) {
      setSelectedEmployeeId(preSelectedEmployeeId);
    }
    if (preSelectedAssetId) {
      setSelectedAssetId(preSelectedAssetId);
      setModalMode('pool');
    }
    if (preSelectedType) {
      setSelectedType(preSelectedType);
    }
  }, [preSelectedEmployeeId, preSelectedAssetId, preSelectedType]);

  // Helper to generate next unique asset tag for a type
  const generateTag = (type: AssetType): string => {
    const option = ASSET_TYPE_OPTIONS.find(o => o.type === type) || ASSET_TYPE_OPTIONS[0];
    const prefix = option.prefix;

    const existingNums = assets
      .map(a => a.assetNumber.toUpperCase())
      .filter(num => num.startsWith(prefix))
      .map(num => {
        const digits = num.replace(prefix, '').replace(/\D/g, '');
        return parseInt(digits, 10);
      })
      .filter(n => !isNaN(n));

    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
    return `${prefix}${String(nextNum).padStart(3, '0')}`;
  };

  // Generate tag whenever type changes or modal opens in issue mode
  useEffect(() => {
    if (isOpen && modalMode === 'issue') {
      const tag = generateTag(selectedType);
      setNewAssetNumber(tag);
      if (!newSerialNumber) {
        setNewSerialNumber(`SN-${tag}-${Math.floor(1000 + Math.random() * 9000)}`);
      }
      const option = ASSET_TYPE_OPTIONS.find(o => o.type === selectedType);
      if (option) {
        setNewBrand(option.placeholderBrand);
        setNewModel(option.placeholderModel);
        if (selectedType === 'Mobile Phone') {
          const rand = Math.floor(100 + Math.random() * 900);
          setNewDeviceName('Samsung Galaxy S23');
          setNewImei(`358921098234${rand}`);
          setNewPhoneNumber(`+91 98765 00${rand}`);
          setNewSerialNumber(`358921098234${rand}`);
        }
      }
    }
  }, [isOpen, selectedType, modalMode]);

  if (!isOpen) return null;

  // Available unassigned assets & computers from fleet pool
  const availablePool = React.useMemo(() => {
    const list: Array<{
      id: string;
      itemType: 'computer' | 'asset';
      assetType: string;
      assetNumber: string;
      brand: string;
      model: string;
      condition: AssetCondition;
    }> = [];

    // 1. Available computers
    computers.forEach(c => {
      if (c.status === 'Available' || !c.assignedEmployeeId || c.id === selectedAssetId) {
        list.push({
          id: c.id,
          itemType: 'computer',
          assetType: c.deviceType || 'Laptop',
          assetNumber: c.assetNumber,
          brand: c.manufacturer,
          model: c.model,
          condition: c.condition,
        });
      }
    });

    // 2. Available peripheral assets
    assets.forEach(a => {
      // Avoid duplicate laptop listing if already in computers
      if (a.assetType === 'Laptop' && computers.some(c => c.assetNumber.toLowerCase() === a.assetNumber.toLowerCase())) {
        return;
      }
      if (a.status === 'Available' || !a.assignedEmployeeId || a.id === selectedAssetId) {
        list.push({
          id: a.id,
          itemType: 'asset',
          assetType: a.assetType,
          assetNumber: a.assetNumber,
          brand: a.brand,
          model: a.model,
          condition: a.condition,
        });
      }
    });

    return list;
  }, [computers, assets, selectedAssetId]);

  const handleRegenerateTag = () => {
    const tag = generateTag(selectedType);
    setNewAssetNumber(tag);
    if (selectedType === 'Mobile Phone') {
      const rand = Math.floor(100 + Math.random() * 900);
      setNewImei(`358921098234${rand}`);
      setNewSerialNumber(`358921098234${rand}`);
    } else {
      setNewSerialNumber(`SN-${tag}-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) return;

    const targetEmp = employees.find(e => e.id === selectedEmployeeId || e.employeeId === selectedEmployeeId);
    const resolvedEmployeeId = targetEmp ? targetEmp.id : selectedEmployeeId;

    if (modalMode === 'pool') {
      if (!selectedAssetId) return;

      const targetPoolItem = availablePool.find(p => p.id === selectedAssetId);
      const isComputer = targetPoolItem?.itemType === 'computer' || computers.some(c => c.id === selectedAssetId);

      if (isComputer) {
        const res = assignComputerToEmployee(
          selectedAssetId,
          resolvedEmployeeId,
          assignedDate,
          condition,
          remarks,
          securityFunctionAdded,
          securityFunctionAddedDate
        );
        if (res.success) {
          onClose();
        }
      } else {
        const res = assignAsset(
          selectedAssetId,
          resolvedEmployeeId,
          assignedDate,
          condition,
          issuedBy,
          remarks,
          securityFunctionAdded,
          securityFunctionAddedDate
        );
        if (res.success) {
          onClose();
        }
      }
    } else {
      // Direct Issue & Add Asset Mode
      if (!newAssetNumber.trim() || !newBrand.trim() || !newModel.trim()) return;

      const isPhone = selectedType === 'Mobile Phone';
      const res = addCompanyAsset({
        assetType: selectedType,
        assetNumber: newAssetNumber.trim().toUpperCase(),
        brand: newBrand.trim(),
        model: newModel.trim(),
        serialNumber: isPhone ? (newImei.trim() || newSerialNumber.trim()) : (newSerialNumber.trim() || `SN-${newAssetNumber.trim()}`),
        deviceName: isPhone ? newDeviceName.trim() : undefined,
        imeiNumber: isPhone ? newImei.trim() : undefined,
        phoneNumber: isPhone ? newPhoneNumber.trim() : undefined,
        assignedEmployeeId: resolvedEmployeeId,
        assignedDate: assignedDate,
        returnDate: null,
        condition: condition,
        status: 'Assigned',
        remarks: remarks.trim() || (isPhone ? `Company Phone: ${newPhoneNumber.trim() || 'N/A'} (IMEI: ${newImei.trim() || 'N/A'})` : `Issued directly to ${targetEmp?.name || 'employee'} on ${assignedDate}`),
        securityFunctionAdded,
        securityFunctionAddedDate,
      });

      if (res.success) {
        onClose();
      }
    }
  };

  const selectedTypeConfig = ASSET_TYPE_OPTIONS.find(o => o.type === selectedType);
  const targetEmployee = employees.find(e => e.id === selectedEmployeeId || e.employeeId === selectedEmployeeId);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#101726] rounded-t-2xl sm:rounded-xl max-w-lg w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col p-5 shadow-2xl border border-slate-200 dark:border-[#1e293b] animate-fade-in my-0 sm:my-auto text-xs overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-[#1e293b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {targetEmployee
                  ? `Provision Asset to ${targetEmployee.name}`
                  : 'Assign & Provision Company Asset'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {targetEmployee
                  ? `${targetEmployee.designation} • ${targetEmployee.department} (${targetEmployee.employeeId})`
                  : 'Issue hardware or allocate from inventory pool'}
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

        {/* Mode Switcher Tabs */}
        <div className="pt-3 pb-1">
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setModalMode('issue')}
              className={`py-1.5 px-3 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                modalMode === 'issue'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Issue New Equipment</span>
            </button>
            <button
              type="button"
              onClick={() => setModalMode('pool')}
              className={`py-1.5 px-3 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                modalMode === 'pool'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Assign from Stock ({availableAssets.length})</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          {/* Target Employee Selection */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Assign to Employee *
            </label>
            <select
              required
              value={selectedEmployeeId}
              onChange={e => setSelectedEmployeeId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
            >
              <option value="">-- Choose Target Employee --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employeeId}) • {emp.department}
                </option>
              ))}
            </select>
          </div>

          {/* TAB 1: ISSUE NEW EQUIPMENT */}
          {modalMode === 'issue' && (
            <>
              {/* Asset Type Selector Grid */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Select Equipment Type *
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {ASSET_TYPE_OPTIONS.map(opt => {
                    const isSelected = selectedType === opt.type;
                    return (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => setSelectedType(opt.type)}
                        className={`p-2 rounded-lg border text-left transition-all flex flex-col items-center text-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold shadow-2xs'
                            : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <span className="text-base leading-none">{opt.icon}</span>
                        <span className="text-[10px] leading-tight font-medium truncate w-full">
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Asset Tag & Serial */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Asset Tag / Number *
                    </label>
                    <button
                      type="button"
                      onClick={handleRegenerateTag}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Suggest</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={newAssetNumber}
                    onChange={e => setNewAssetNumber(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 font-mono font-bold uppercase bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Serial Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSerialNumber}
                    onChange={e => setNewSerialNumber(e.target.value)}
                    className="w-full px-3 py-2 font-mono text-xs bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                  />
                </div>
              </div>

              {/* Brand & Model */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Brand / Manufacturer *
                  </label>
                  <input
                    type="text"
                    required
                    value={newBrand}
                    onChange={e => setNewBrand(e.target.value)}
                    placeholder={selectedTypeConfig?.placeholderBrand || 'e.g. Samsung'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Model / Specification *
                  </label>
                  <input
                    type="text"
                    required
                    value={newModel}
                    onChange={e => setNewModel(e.target.value)}
                    placeholder={selectedTypeConfig?.placeholderModel || 'e.g. Galaxy S23'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                  />
                </div>
              </div>

              {/* Phone-Specific Specifications */}
              {selectedType === 'Mobile Phone' && (
                <div className="p-3 bg-pink-50/50 dark:bg-pink-950/20 rounded-lg border border-pink-100 dark:border-pink-900/30 space-y-2.5">
                  <div className="text-[11px] font-bold text-pink-700 dark:text-pink-300 flex items-center gap-1.5">
                    <span>📱</span>
                    <span>Company Phone Information</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                        Device Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Samsung Galaxy S23"
                        value={newDeviceName}
                        onChange={e => setNewDeviceName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md text-xs focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                        IMEI Number
                      </label>
                      <input
                        type="text"
                        placeholder="15-digit IMEI"
                        value={newImei}
                        onChange={e => {
                          setNewImei(e.target.value);
                          setNewSerialNumber(e.target.value);
                        }}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md font-mono text-xs focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                        Mobile Number
                      </label>
                      <input
                        type="text"
                        placeholder="+91 98765 00000"
                        value={newPhoneNumber}
                        onChange={e => setNewPhoneNumber(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md font-mono text-xs focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: ASSIGN FROM INVENTORY POOL */}
          {modalMode === 'pool' && (
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Choose Available Asset or Workstation from Stock Pool *
              </label>
              {availablePool.length === 0 ? (
                <div className="p-4 text-center rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-amber-800 dark:text-amber-300">
                  <p className="font-semibold text-xs mb-1">No unassigned assets or computers available in stock.</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 mb-2">
                    Switch to "Issue New Equipment" above to register and provision brand new hardware.
                  </p>
                  <button
                    type="button"
                    onClick={() => setModalMode('issue')}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-md text-xs font-semibold cursor-pointer"
                  >
                    Switch to Issue New Equipment
                  </button>
                </div>
              ) : (
                <select
                  required
                  value={selectedAssetId}
                  onChange={e => setSelectedAssetId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                >
                  <option value="">-- Select from Stock ({availablePool.length} Available) --</option>
                  
                  {/* Group 1: Computers */}
                  {availablePool.some(p => p.itemType === 'computer') && (
                    <optgroup label="💻 Workstations & Laptops (Stock / Buffer)">
                      {availablePool
                        .filter(p => p.itemType === 'computer')
                        .map(p => (
                          <option key={p.id} value={p.id}>
                            [{p.assetType}] {p.assetNumber} - {p.brand} {p.model} ({p.condition})
                          </option>
                        ))}
                    </optgroup>
                  )}

                  {/* Group 2: Peripherals */}
                  {availablePool.some(p => p.itemType === 'asset') && (
                    <optgroup label="📱 Peripherals, Phones & Accessories (Stock / Buffer)">
                      {availablePool
                        .filter(p => p.itemType === 'asset')
                        .map(p => (
                          <option key={p.id} value={p.id}>
                            [{p.assetType}] {p.assetNumber} - {p.brand} {p.model} ({p.condition})
                          </option>
                        ))}
                    </optgroup>
                  )}
                </select>
              )}
            </div>
          )}

          {/* Assignment Date & Condition */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Assigned Date *
              </label>
              <input
                type="date"
                required
                value={assignedDate}
                onChange={e => setAssignedDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Condition at Issue
              </label>
              <select
                value={condition}
                onChange={e => setCondition(e.target.value as AssetCondition)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              >
                <option value="New">New (Brand new unit)</option>
                <option value="Good">Good (Operational)</option>
                <option value="Fair">Fair (Operational with wear)</option>
              </select>
            </div>
          </div>

          {/* Security Function Added & Date (ONLY for PC/Laptop & Mobile Phone) */}
          {((modalMode === 'issue' && (selectedType === 'Laptop' || selectedType === 'Mobile Phone')) ||
            (modalMode === 'pool' && (() => {
              const selectedItem = availablePool.find(p => p.id === selectedAssetId);
              return selectedItem?.itemType === 'computer' || selectedItem?.assetType === 'Laptop' || selectedItem?.assetType === 'Desktop' || selectedItem?.assetType === 'Mobile Phone';
            })())) && (
            <div className="grid grid-cols-2 gap-3 p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Security Feature Added? *
                </label>
                <select
                  value={securityFunctionAdded}
                  onChange={e => setSecurityFunctionAdded(e.target.value as 'Yes' | 'No')}
                  className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-blue-500 transition-colors"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Security Function Added Date
                </label>
                <input
                  type="date"
                  value={securityFunctionAddedDate}
                  onChange={e => setSecurityFunctionAddedDate(e.target.value)}
                  disabled={securityFunctionAdded === 'No'}
                  className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 transition-colors disabled:opacity-50"
                />
              </div>
            </div>
          )}

          {/* Issued By */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Issued By
            </label>
            <input
              type="text"
              value={issuedBy}
              onChange={e => setIssuedBy(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Assignment Notes / Remarks
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Issued for dual-display workstation setup or company mobile access..."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
            />
          </div>

          {/* Modal Actions */}
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
              disabled={modalMode === 'pool' && !selectedAssetId}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>
                {modalMode === 'issue' ? 'Issue & Assign Asset' : 'Confirm Allocation'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
