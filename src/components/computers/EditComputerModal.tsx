import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AssetCondition, AssetStatus } from '../../types';
import { X, Laptop, Check, User } from 'lucide-react';

interface EditComputerModalProps {
  isOpen: boolean;
  onClose: () => void;
  computerId: string;
}

export const EditComputerModal: React.FC<EditComputerModalProps> = ({
  isOpen,
  onClose,
  computerId,
}) => {
  const { computers, employees, updateComputer, assignComputerToEmployee } = useApp();

  const computer = computers.find(c => c.id === computerId);

  // Form states
  const [assetNumber, setAssetNumber] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [deviceType, setDeviceType] = useState<'Laptop' | 'Desktop'>('Laptop');
  const [serialNumber, setSerialNumber] = useState('');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState<string>('');
  const [condition, setCondition] = useState<AssetCondition>('Good');
  const [status, setStatus] = useState<AssetStatus>('Available');
  const [remarks, setRemarks] = useState('');

  // Specs
  const [processorName, setProcessorName] = useState('');
  const [processorGen, setProcessorGen] = useState('');
  const [processorSpeed, setProcessorSpeed] = useState('');

  const [installedRAM, setInstalledRAM] = useState('');
  const [usableRAM, setUsableRAM] = useState('');

  const [graphicsCard, setGraphicsCard] = useState('');
  const [graphicsMemory, setGraphicsMemory] = useState('');

  const [storageTotal, setStorageTotal] = useState('');
  const [storageUsed, setStorageUsed] = useState('');
  const [storageFree, setStorageFree] = useState('');
  const [storageType, setStorageType] = useState('NVMe SSD');

  const [os, setOs] = useState('');
  const [systemType, setSystemType] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [productId, setProductId] = useState('');

  const [securityFunctionAdded, setSecurityFunctionAdded] = useState<'Yes' | 'No'>('Yes');
  const [securityFunctionAddedDate, setSecurityFunctionAddedDate] = useState<string>('');

  useEffect(() => {
    if (computer) {
      setAssetNumber(computer.assetNumber || '');
      setDeviceName(computer.deviceName || '');
      setManufacturer(computer.manufacturer || '');
      setModel(computer.model || '');
      setDeviceType(computer.deviceType || 'Laptop');
      setSerialNumber(computer.serialNumber || '');
      setAssignedEmployeeId(computer.assignedEmployeeId || '');
      setCondition(computer.condition || 'Good');
      setStatus(computer.status || 'Available');
      setRemarks(computer.remarks || '');
      setSecurityFunctionAdded(computer.securityFunctionAdded || 'Yes');
      setSecurityFunctionAddedDate(computer.securityFunctionAddedDate || computer.assignedDate || new Date().toISOString().substring(0, 10));

      setProcessorName(computer.processor?.name || '');
      setProcessorGen(computer.processor?.generation || '');
      setProcessorSpeed(computer.processor?.speed || '');

      setInstalledRAM(computer.memory?.installedRAM || '16.00 GB');
      setUsableRAM(computer.memory?.usableRAM || '15.80 GB');

      setGraphicsCard(computer.graphics?.card || 'Intel(R) Iris(R) Xe Graphics');
      setGraphicsMemory(computer.graphics?.memory || '512 MB');

      setStorageTotal(computer.storage?.total || '512 GB');
      setStorageUsed(computer.storage?.used || '60 GB');
      setStorageFree(computer.storage?.free || '452 GB');
      setStorageType(computer.storage?.type || 'NVMe SSD');

      setOs(computer.system?.os || 'Windows 11 Pro 64-bit');
      setSystemType(computer.system?.systemType || '64-bit operating system, x64-based processor');
      setDeviceId(computer.system?.deviceId || '');
      setProductId(computer.system?.productId || '');
    }
  }, [computer, isOpen]);

  if (!isOpen || !computer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const oldAssignedId = computer.assignedEmployeeId || '';
    const newAssignedId = assignedEmployeeId || '';

    // 1. Update computer specs & parameters
    updateComputer(computer.id, {
      assetNumber: assetNumber.trim() || computer.assetNumber,
      deviceName: deviceName.trim() || computer.deviceName,
      manufacturer: manufacturer.trim() || computer.manufacturer,
      model: model.trim() || computer.model,
      deviceType,
      serialNumber: serialNumber.trim() || computer.serialNumber,
      condition,
      status,
      remarks: remarks.trim(),
      securityFunctionAdded,
      securityFunctionAddedDate,
      processor: {
        name: processorName.trim() || computer.processor?.name || 'Intel Core i5-1135G7',
        generation: processorGen.trim() || computer.processor?.generation || '11th Gen',
        speed: processorSpeed.trim() || computer.processor?.speed || '2.40 GHz',
      },
      memory: {
        installedRAM: installedRAM.trim() || computer.memory?.installedRAM || '16 GB',
        usableRAM: usableRAM.trim() || computer.memory?.usableRAM || '15.8 GB',
      },
      graphics: {
        card: graphicsCard.trim() || computer.graphics?.card || 'Intel Iris Xe Graphics',
        memory: graphicsMemory.trim() || computer.graphics?.memory || 'Integrated',
      },
      storage: {
        total: storageTotal.trim() || computer.storage?.total || '512 GB',
        used: storageUsed.trim() || computer.storage?.used || '120 GB',
        free: storageFree.trim() || computer.storage?.free || '392 GB',
        type: storageType.trim() || computer.storage?.type || 'SSD NVMe',
      },
      system: {
        os: os.trim() || computer.system?.os || 'Windows 11 Pro',
        systemType: systemType.trim() || computer.system?.systemType || '64-bit operating system, x64-based processor',
        processorArchitecture: computer.system?.processorArchitecture || 'x64-based processor',
        penAndTouch: computer.system?.penAndTouch || 'No pen or touch input is available for this display',
        deviceId: deviceId.trim() || computer.system?.deviceId || 'DEV-XXXXXXXX',
        productId: productId.trim() || computer.system?.productId || 'PRD-XXXXXXXX',
      },
    });

    // 2. Handle employee assignment change if needed
    if (oldAssignedId !== newAssignedId) {
      assignComputerToEmployee(
        computer.id,
        newAssignedId || null,
        new Date().toISOString().substring(0, 10),
        condition,
        remarks
      );
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#101726] rounded-t-2xl sm:rounded-xl max-w-2xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-[#1e293b] animate-fade-in my-0 sm:my-auto text-xs">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Edit Workstation: {computer.assetNumber}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Update hardware specifications, operational status, and custodian
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Top Row: Basic Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Asset Number *
              </label>
              <input
                type="text"
                required
                value={assetNumber}
                onChange={e => setAssetNumber(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs font-mono focus:outline-hidden focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Device Name *
              </label>
              <input
                type="text"
                required
                value={deviceName}
                onChange={e => setDeviceName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs font-mono focus:outline-hidden focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Form Factor
              </label>
              <select
                value={deviceType}
                onChange={e => setDeviceType(e.target.value as 'Laptop' | 'Desktop')}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 cursor-pointer"
              >
                <option value="Laptop">Laptop</option>
                <option value="Desktop">Desktop</option>
              </select>
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
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
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
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Serial Number
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={e => setSerialNumber(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs font-mono focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          {/* Custodian & Lifecycle Status */}
          <div className="p-3 bg-slate-50 dark:bg-[#090d16] rounded-xl border border-slate-200/80 dark:border-[#1e293b] space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-500" />
              <span>Assignment & Operational Status</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Assigned Employee
                </label>
                <select
                  value={assignedEmployeeId}
                  onChange={e => {
                    const empId = e.target.value;
                    setAssignedEmployeeId(empId);
                    if (empId) {
                      setStatus('Assigned');
                    } else if (status === 'Assigned') {
                      setStatus('Available');
                    }
                  }}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-[#101726] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 cursor-pointer"
                >
                  <option value="">Unassigned (In IT Pool)</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeId} - {emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as AssetStatus)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-[#101726] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 cursor-pointer"
                >
                  <option value="Assigned">Assigned</option>
                  <option value="Available">Available</option>
                  <option value="Under Service">Under Service</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Returned">Returned</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Physical Condition
                </label>
                <select
                  value={condition}
                  onChange={e => setCondition(e.target.value as AssetCondition)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-[#101726] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 cursor-pointer"
                >
                  <option value="New">New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>
            </div>
          </div>

          {/* Security Function Section */}
          <div className="p-3 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-xl border border-emerald-500/20 space-y-3">
            <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>Security Function Setup</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Security Function Added *
                </label>
                <select
                  value={securityFunctionAdded}
                  onChange={e => setSecurityFunctionAdded(e.target.value as 'Yes' | 'No')}
                  className="w-full px-3 py-1.5 bg-white dark:bg-[#101726] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 cursor-pointer font-semibold"
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
                  className="w-full px-3 py-1.5 bg-white dark:bg-[#101726] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Hardware Specs: Processor & Memory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Processor Name
              </label>
              <input
                type="text"
                value={processorName}
                onChange={e => setProcessorName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Processor Speed
              </label>
              <input
                type="text"
                value={processorSpeed}
                onChange={e => setProcessorSpeed(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Installed RAM
              </label>
              <input
                type="text"
                value={installedRAM}
                onChange={e => setInstalledRAM(e.target.value)}
                placeholder="e.g. 16.00 GB"
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs font-mono focus:outline-hidden focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Storage (Capacity & Type)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={storageTotal}
                  onChange={e => setStorageTotal(e.target.value)}
                  placeholder="e.g. 512 GB"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs font-mono focus:outline-hidden focus:border-blue-500"
                />
                <select
                  value={storageType}
                  onChange={e => setStorageType(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
                >
                  <option value="NVMe SSD">NVMe SSD</option>
                  <option value="PCIe 4.0 NVMe SSD">PCIe 4.0 NVMe SSD</option>
                  <option value="SATA SSD">SATA SSD</option>
                  <option value="SATA SSD + HDD">SATA SSD + HDD</option>
                </select>
              </div>
            </div>
          </div>

          {/* Operating System */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Operating System
            </label>
            <input
              type="text"
              value={os}
              onChange={e => setOs(e.target.value)}
              placeholder="e.g. Windows 11 Pro 64-bit"
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Graphics Card & Video Memory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Graphics Card / GPU Model
              </label>
              <input
                type="text"
                value={graphicsCard}
                onChange={e => setGraphicsCard(e.target.value)}
                placeholder="e.g. Intel(R) Iris(R) Xe Graphics or NVIDIA RTX 4060"
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Graphics / Video Memory (VRAM)
              </label>
              <input
                type="text"
                value={graphicsMemory}
                onChange={e => setGraphicsMemory(e.target.value)}
                placeholder="e.g. 512 MB or 8 GB Dedicated"
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs font-mono focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              IT Administration Remarks
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Maintenance notes, hardware condition, warranty details..."
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-[#1e293b] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#1e293b] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Workstation Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
