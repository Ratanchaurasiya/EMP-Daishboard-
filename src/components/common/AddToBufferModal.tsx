import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AssetCondition, AssetType, Computer, CompanyAsset } from '../../types';
import {
  X,
  Box,
  RotateCcw,
  Plus,
  Search,
  Laptop,
  Smartphone,
  Headphones,
  CheckCircle2,
  AlertCircle,
  Shield,
  Layers,
  ArrowRight,
  User,
  Calendar,
  Sparkles,
  Info,
} from 'lucide-react';
import { EmployeeAvatar } from './EmployeeAvatar';

interface AddToBufferModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedAssetId?: string;
  preSelectedType?: 'computer' | 'asset';
}

export const AddToBufferModal: React.FC<AddToBufferModalProps> = ({
  isOpen,
  onClose,
  preSelectedAssetId,
  preSelectedType = 'computer',
}) => {
  const {
    computers,
    assets,
    employees,
    moveToBufferStock,
    addComputer,
    addCompanyAsset,
    currentUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'move' | 'register'>('move');

  // ----- TAB 1: Move Assigned / Existing to Buffer Stock -----
  const [selectedItemKey, setSelectedItemKey] = useState<string>(
    preSelectedAssetId ? `${preSelectedType}:${preSelectedAssetId}` : ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().substring(0, 10));
  const [returnCondition, setReturnCondition] = useState<AssetCondition>('Good');
  const [receivedBy, setReceivedBy] = useState(currentUser?.name || 'IT Administrator');
  const [remarks, setRemarks] = useState(
    'Returned from custody, inspected, sanitized, and moved to Available Buffer Stock for future reassignment.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ----- TAB 2: Register Brand-New Spare to Buffer -----
  const [newCategory, setNewCategory] = useState<'computer' | 'asset'>('computer');
  const [newDeviceType, setNewDeviceType] = useState<'Laptop' | 'Desktop'>('Laptop');
  const [newAssetType, setNewAssetType] = useState<AssetType>('Mouse');
  const [newAssetNumber, setNewAssetNumber] = useState(
    `BUF-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [newBrand, setNewBrand] = useState('Dell');
  const [newModel, setNewModel] = useState('Latitude 7430');
  const [newSerialNumber, setNewSerialNumber] = useState(
    `SN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
  );
  const [newCondition, setNewCondition] = useState<AssetCondition>('New');
  const [newDeviceName, setNewDeviceName] = useState('CORP-BUF-01');
  const [newGraphicsCard, setNewGraphicsCard] = useState('Intel Iris Xe Graphics');
  const [newGraphicsMemory, setNewGraphicsMemory] = useState('512 MB');
  const [newSecurityFunctionAdded, setNewSecurityFunctionAdded] = useState<'Yes' | 'No'>('Yes');

  // Aggregate all assigned or in-service items that can be returned / moved to Buffer Stock
  const assignedItems = useMemo(() => {
    const list: Array<{
      key: string;
      itemType: 'computer' | 'asset';
      id: string;
      assetNumber: string;
      brand: string;
      model: string;
      serialNumber: string;
      category: 'computer' | 'phone' | 'accessory';
      displayType: string;
      currentCondition: AssetCondition;
      currentStatus: string;
      assignedEmployee?: (typeof employees)[0];
      assignedDate?: string | null;
      rawObject: Computer | CompanyAsset;
    }> = [];

    // 1. Computers currently in system
    computers.forEach(c => {
      const emp = employees.find(
        e => e.id === c.assignedEmployeeId || e.employeeId === c.assignedEmployeeId
      );

      list.push({
        key: `computer:${c.id}`,
        itemType: 'computer',
        id: c.id,
        assetNumber: c.assetNumber,
        brand: c.manufacturer,
        model: c.model,
        serialNumber: c.serialNumber,
        category: 'computer',
        displayType: c.deviceType || 'Laptop',
        currentCondition: c.condition,
        currentStatus: c.status,
        assignedEmployee: emp,
        assignedDate: c.assignedDate,
        rawObject: c,
      });
    });

    // 2. Company assets (Phones, Accessories, Peripherals)
    assets.forEach(a => {
      // Avoid duplicate listing if asset is a Laptop that has the exact same assetNumber as a computer
      if (a.assetType === 'Laptop' && computers.some(c => c.assetNumber.toLowerCase() === a.assetNumber.toLowerCase())) {
        return;
      }

      const emp = employees.find(
        e => e.id === a.assignedEmployeeId || e.employeeId === a.assignedEmployeeId
      );

      let cat: 'computer' | 'phone' | 'accessory' = 'accessory';
      if (a.assetType === 'Mobile Phone') cat = 'phone';
      else if (a.assetType === 'Laptop' || a.assetType === 'Desktop') cat = 'computer';

      list.push({
        key: `asset:${a.id}`,
        itemType: 'asset',
        id: a.id,
        assetNumber: a.assetNumber,
        brand: a.brand,
        model: a.model,
        serialNumber: a.serialNumber,
        category: cat,
        displayType: a.assetType,
        currentCondition: a.condition,
        currentStatus: a.status,
        assignedEmployee: emp,
        assignedDate: a.assignedDate,
        rawObject: a,
      });
    });

    return list;
  }, [computers, assets, employees]);

  // Filter items based on search query
  const filteredAssignedItems = useMemo(() => {
    if (!searchQuery.trim()) return assignedItems;
    const q = searchQuery.toLowerCase().trim();
    return assignedItems.filter(item => {
      const matchTag = item.assetNumber.toLowerCase().includes(q);
      const matchBrand = item.brand.toLowerCase().includes(q);
      const matchModel = item.model.toLowerCase().includes(q);
      const matchSerial = item.serialNumber.toLowerCase().includes(q);
      const matchType = item.displayType.toLowerCase().includes(q);
      const matchEmpName = item.assignedEmployee?.name.toLowerCase().includes(q) || false;
      const matchEmpId = item.assignedEmployee?.employeeId.toLowerCase().includes(q) || false;
      const matchDept = item.assignedEmployee?.department.toLowerCase().includes(q) || false;

      return (
        matchTag ||
        matchBrand ||
        matchModel ||
        matchSerial ||
        matchType ||
        matchEmpName ||
        matchEmpId ||
        matchDept
      );
    });
  }, [assignedItems, searchQuery]);

  // Currently selected item object
  const selectedItem = useMemo(() => {
    return assignedItems.find(item => item.key === selectedItemKey);
  }, [assignedItems, selectedItemKey]);

  if (!isOpen) return null;

  const handleMoveToBuffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setIsSubmitting(true);
    try {
      const res = moveToBufferStock(selectedItem.itemType, selectedItem.id, {
        returnCondition,
        returnDate,
        receivedBy,
        remarks,
      });

      if (res.success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterNewSpare = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const todayDate = new Date().toISOString().substring(0, 10);
      if (newCategory === 'computer') {
        const res = addComputer({
          assetNumber: newAssetNumber.trim(),
          deviceName: newDeviceName.trim() || `${newBrand}_${newModel}`,
          manufacturer: newBrand.trim(),
          model: newModel.trim(),
          deviceType: newDeviceType,
          serialNumber: newSerialNumber.trim(),
          assignedEmployeeId: null,
          assignedDate: null,
          condition: newCondition,
          status: 'Available',
          securityFunctionAdded: newSecurityFunctionAdded,
          securityFunctionAddedDate: newSecurityFunctionAdded === 'Yes' ? todayDate : undefined,
          remarks: 'Registered directly into Available Buffer Stock pool.',
          processor: {
            name: '13th Gen Intel Core i7-13700H',
            generation: '13th Gen',
            speed: '2.40 GHz - 5.00 GHz',
          },
          memory: {
            installedRAM: '32.00 GB',
            usableRAM: '31.80 GB',
          },
          graphics: {
            card: newGraphicsCard.trim() || 'Intel Iris Xe Graphics',
            memory: newGraphicsMemory.trim() || '512 MB',
          },
          storage: {
            total: '1 TB',
            used: '0 GB',
            free: '1000 GB',
            type: 'NVMe Gen4 SSD',
          },
          system: {
            os: 'Windows 11 Pro 64-bit',
            systemType: '64-bit operating system, x64-based processor',
            processorArchitecture: 'x64',
            deviceId: 'DEV-BUF-' + Math.floor(100000 + Math.random() * 900000),
            productId: 'PROD-BUF-' + Math.floor(100000 + Math.random() * 900000),
            penAndTouch: 'No pen or touch input is available for this display',
          },
        });
        if (res.success) onClose();
      } else {
        const res = addCompanyAsset({
          assetType: newAssetType,
          assetNumber: newAssetNumber.trim(),
          brand: newBrand.trim(),
          model: newModel.trim(),
          serialNumber: newSerialNumber.trim(),
          assignedEmployeeId: null,
          assignedDate: null,
          returnDate: null,
          condition: newCondition,
          status: 'Available',
          securityFunctionAdded: newSecurityFunctionAdded,
          securityFunctionAddedDate: newSecurityFunctionAdded === 'Yes' ? todayDate : undefined,
          remarks: 'Registered directly into Available Buffer Stock pool.',
        });
        if (res.success) onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div
        className="bg-white dark:bg-[#0d131f] border border-slate-200 dark:border-slate-800/80 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Add Asset to Buffer Stock
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Ready for Reassignment
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Move returned hardware into the unassigned Available Spares pool for future deployment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 pt-3 bg-slate-50/50 dark:bg-slate-900/40 gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('move')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'move'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Return / Move Assigned Asset to Buffer</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Register Brand-New Spares into Buffer</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {activeTab === 'move' ? (
            <form onSubmit={handleMoveToBuffer} className="space-y-4">
              {/* Asset Selection Section */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>1. Select Assigned Asset to Return to Buffer *</span>
                  <span className="text-[11px] font-normal text-slate-400">
                    {assignedItems.length} units in fleet
                  </span>
                </label>

                {/* Search / Filter bar for assets */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by asset tag, model, serial #, or employee name..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
                  />
                </div>

                {/* Dropdown / Selector List */}
                <select
                  value={selectedItemKey}
                  onChange={e => setSelectedItemKey(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
                >
                  <option value="">-- Choose an assigned computer, phone, or accessory --</option>
                  
                  {/* Group 1: Computers */}
                  <optgroup label="💻 Workstations, Laptops & Desktops">
                    {filteredAssignedItems
                      .filter(i => i.category === 'computer')
                      .map(i => (
                        <option key={i.key} value={i.key}>
                          [{i.assetNumber}] {i.brand} {i.model} — {i.assignedEmployee ? `Custody: ${i.assignedEmployee.name} (${i.assignedEmployee.employeeId})` : `Status: ${i.currentStatus}`}
                        </option>
                      ))}
                  </optgroup>

                  {/* Group 2: Phones */}
                  <optgroup label="📱 Mobile Phones & Handsets">
                    {filteredAssignedItems
                      .filter(i => i.category === 'phone')
                      .map(i => (
                        <option key={i.key} value={i.key}>
                          [{i.assetNumber}] {i.brand} {i.model} — {i.assignedEmployee ? `Custody: ${i.assignedEmployee.name} (${i.assignedEmployee.employeeId})` : `Status: ${i.currentStatus}`}
                        </option>
                      ))}
                  </optgroup>

                  {/* Group 3: Accessories & Peripherals */}
                  <optgroup label="🎧 Peripherals & Gear (Mice, Keyboards, Monitors, Headsets)">
                    {filteredAssignedItems
                      .filter(i => i.category === 'accessory')
                      .map(i => (
                        <option key={i.key} value={i.key}>
                          [{i.assetNumber}] [{i.displayType}] {i.brand} {i.model} — {i.assignedEmployee ? `Custody: ${i.assignedEmployee.name}` : `Status: ${i.currentStatus}`}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              {/* Selected Asset Information Card */}
              {selectedItem && (
                <div className="p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-3 animate-fade-in">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                        {selectedItem.category === 'computer' ? (
                          <Laptop className="w-5 h-5" />
                        ) : selectedItem.category === 'phone' ? (
                          <Smartphone className="w-5 h-5" />
                        ) : (
                          <Headphones className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {selectedItem.brand} {selectedItem.model}
                          </span>
                          <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                            {selectedItem.assetNumber}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          S/N: {selectedItem.serialNumber} • Type: {selectedItem.displayType}
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-1 rounded-md text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      Current Status: {selectedItem.currentStatus}
                    </span>
                  </div>

                  {/* Custodian Snapshot */}
                  {selectedItem.assignedEmployee ? (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-[11px]">
                      <div className="flex items-center gap-2.5">
                        <EmployeeAvatar
                          name={selectedItem.assignedEmployee.name}
                          photoUrl={selectedItem.assignedEmployee.photoUrl}
                          size="sm"
                        />
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            {selectedItem.assignedEmployee.name}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 text-[10px]">
                            {selectedItem.assignedEmployee.designation} • {selectedItem.assignedEmployee.department} ({selectedItem.assignedEmployee.employeeId})
                          </span>
                        </div>
                      </div>
                      {selectedItem.assignedDate && (
                        <div className="text-right text-[10px] text-slate-400">
                          <span>Assigned on</span>
                          <div className="font-semibold text-slate-700 dark:text-slate-300">
                            {selectedItem.assignedDate}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-2 text-[11px] text-slate-500 italic bg-white/50 dark:bg-slate-900/50 rounded-lg">
                      Currently unassigned or held in quarantine.
                    </div>
                  )}
                </div>
              )}

              {/* Return & Buffer Configuration Fields */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>2. Return & Buffer Inspection Details</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Return / Check-In Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={returnDate}
                      onChange={e => setReturnDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Received & Inspected By *
                    </label>
                    <input
                      type="text"
                      required
                      value={receivedBy}
                      onChange={e => setReceivedBy(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
                    />
                  </div>
                </div>

                {/* Return Condition Pill Selectors */}
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Physical Return Condition *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['New', 'Good', 'Fair', 'Damaged'] as AssetCondition[]).map(cond => (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => setReturnCondition(cond)}
                        className={`p-2 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          returnCondition === cond
                            ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300 font-bold ring-1 ring-amber-500/30'
                            : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs">{cond}</span>
                          {returnCondition === cond && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                          )}
                        </div>
                        <span className="text-[10px] opacity-75 font-normal">
                          {cond === 'New'
                            ? 'Pristine / Unused'
                            : cond === 'Good'
                            ? 'Optimal & tested'
                            : cond === 'Fair'
                            ? 'Minor wear'
                            : 'Needs service'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Remarks & Buffer Notes */}
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Inspection Remarks & Buffer Placement Note
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    placeholder="e.g. Returned in good working condition, wiped, placed in IT Storage Cabinet #2."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
                  />
                </div>

                {/* Notice banner */}
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 flex items-start gap-2.5 text-[11px] leading-relaxed">
                  <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span>
                      Upon confirmation, this asset will be unlinked from its previous custodian, its custody record will be closed, and its status will change to{' '}
                      <strong className="text-emerald-600 dark:text-emerald-400">Available</strong> in the Buffer Stock matrix ready for immediate reissue.
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Action Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedItem || isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Box className="w-4 h-4" />
                  <span>{isSubmitting ? 'Moving to Buffer...' : 'Move to Available Buffer Stock'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* TAB 2: REGISTER BRAND NEW SPARE DIRECT TO BUFFER */
            <form onSubmit={handleRegisterNewSpare} className="space-y-4">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-[11px] flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 shrink-0 text-blue-500" />
                <span>
                  Register brand new equipment directly into the unassigned Available Spares Buffer Stock.
                </span>
              </div>

              {/* Category selector */}
              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Hardware Category *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setNewCategory('computer');
                      setNewBrand('Dell');
                      setNewModel('Latitude 7430');
                      setNewAssetNumber(`LAP-BUF-${Math.floor(1000 + Math.random() * 9000)}`);
                    }}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                      newCategory === 'computer'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300 font-bold'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Laptop className="w-4 h-4 text-amber-500" />
                    <span>Laptops, Desktops & Workstations</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewCategory('asset');
                      setNewBrand('Logitech');
                      setNewModel('MX Master 3S');
                      setNewAssetNumber(`MOU-BUF-${Math.floor(1000 + Math.random() * 9000)}`);
                    }}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                      newCategory === 'asset'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300 font-bold'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Headphones className="w-4 h-4 text-amber-500" />
                    <span>Peripherals, Phones & Accessories</span>
                  </button>
                </div>
              </div>

              {newCategory === 'computer' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Device Form Factor
                    </label>
                    <select
                      value={newDeviceType}
                      onChange={e => setNewDeviceType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                    >
                      <option value="Laptop">Laptop</option>
                      <option value="Desktop">Desktop PC</option>
                      <option value="Workstation">Tower Workstation</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Asset Tag / ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAssetNumber}
                      onChange={e => setNewAssetNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Device Hostname
                    </label>
                    <input
                      type="text"
                      value={newDeviceName}
                      onChange={e => setNewDeviceName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Asset Type *
                    </label>
                    <select
                      value={newAssetType}
                      onChange={e => setNewAssetType(e.target.value as AssetType)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                    >
                      <option value="Mouse">Mouse</option>
                      <option value="Keyboard">Keyboard</option>
                      <option value="Headset">Headset</option>
                      <option value="Monitor">Monitor</option>
                      <option value="Mobile Phone">Mobile Phone</option>
                      <option value="Docking Station">Docking Station</option>
                      <option value="Other">Other Equipment</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Asset Tag / ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAssetNumber}
                      onChange={e => setNewAssetNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Manufacturer / Brand *
                  </label>
                  <input
                    type="text"
                    required
                    value={newBrand}
                    onChange={e => setNewBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Model Name / Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={newModel}
                    onChange={e => setNewModel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Serial Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSerialNumber}
                    onChange={e => setNewSerialNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              {newCategory === 'computer' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Graphics Card (GPU)
                    </label>
                    <input
                      type="text"
                      value={newGraphicsCard}
                      onChange={e => setNewGraphicsCard(e.target.value)}
                      placeholder="e.g. NVIDIA GeForce RTX 4070"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Dedicated VRAM
                    </label>
                    <input
                      type="text"
                      value={newGraphicsMemory}
                      onChange={e => setNewGraphicsMemory(e.target.value)}
                      placeholder="e.g. 8 GB GDDR6"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              )}

              {(newCategory === 'computer' || newAssetType === 'Mobile Phone' || newAssetType === 'Laptop') && (
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Security Feature Added? *
                  </label>
                  <select
                    value={newSecurityFunctionAdded}
                    onChange={e => setNewSecurityFunctionAdded(e.target.value as 'Yes' | 'No')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-semibold cursor-pointer"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Initial Condition
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['New', 'Good', 'Fair', 'Damaged'] as AssetCondition[]).map(cond => (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => setNewCondition(cond)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        newCondition === cond
                          ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300 font-bold'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {cond}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit action */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Registering...' : 'Register to Buffer Stock'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
