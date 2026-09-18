import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AssetCondition, AssetStatus, AssetType } from '../../types';
import { X, Pencil, Check, ShieldCheck, Calendar, Info, Trash2 } from 'lucide-react';

interface AssetEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: string;
}

export const AssetEditModal: React.FC<AssetEditModalProps> = ({
  isOpen,
  onClose,
  assetId,
}) => {
  const { assets, employees, updateCompanyAsset, removeCompanyAsset, userRole } = useApp();
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  const asset = assets.find(a => a.id === assetId);

  const [assetType, setAssetType] = useState<AssetType>('Monitor');
  const [assetNumber, setAssetNumber] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [serialNumber, setSerialNumber] = useState<string>('');
  const [deviceName, setDeviceName] = useState<string>('');
  const [imeiNumber, setImeiNumber] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [assignedDate, setAssignedDate] = useState<string>('');
  const [returnDate, setReturnDate] = useState<string>('');
  const [condition, setCondition] = useState<AssetCondition>('Good');
  const [status, setStatus] = useState<AssetStatus>('Assigned');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [securityFunctionAdded, setSecurityFunctionAdded] = useState<'Yes' | 'No'>('Yes');
  const [securityFunctionAddedDate, setSecurityFunctionAddedDate] = useState<string>('');

  useEffect(() => {
    if (asset) {
      setAssetType(asset.assetType);
      setAssetNumber(asset.assetNumber);
      setBrand(asset.brand);
      setModel(asset.model);
      setSerialNumber(asset.serialNumber);
      setDeviceName(asset.deviceName || '');
      setImeiNumber(asset.imeiNumber || '');
      setPhoneNumber(asset.phoneNumber || '');
      setAssignedDate(asset.assignedDate || '');
      setReturnDate(asset.returnDate || '');
      setCondition(asset.condition);
      setStatus(asset.status);
      setAssignedEmployeeId(asset.assignedEmployeeId || '');
      setRemarks(asset.remarks || '');
      setSecurityFunctionAdded(asset.securityFunctionAdded || 'Yes');
      setSecurityFunctionAddedDate(asset.securityFunctionAddedDate || asset.assignedDate || new Date().toISOString().substring(0, 10));
    }
  }, [asset, isOpen]);

  if (!isOpen || !asset) return null;

  const isAdmin = userRole === 'admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!assetNumber.trim() || !brand.trim() || !model.trim()) return;

    const res = updateCompanyAsset(asset.id, {
      assetType,
      assetNumber: assetNumber.trim().toUpperCase(),
      brand: brand.trim(),
      model: model.trim(),
      serialNumber: assetType === 'Mobile Phone' && imeiNumber.trim() ? imeiNumber.trim() : serialNumber.trim(),
      deviceName: assetType === 'Mobile Phone' ? deviceName.trim() : undefined,
      imeiNumber: assetType === 'Mobile Phone' ? imeiNumber.trim() : undefined,
      phoneNumber: assetType === 'Mobile Phone' ? phoneNumber.trim() : undefined,
      assignedDate: assignedDate || null,
      returnDate: returnDate || null,
      condition,
      status,
      assignedEmployeeId: assignedEmployeeId || null,
      remarks: remarks.trim(),
      securityFunctionAdded,
      securityFunctionAddedDate,
    });

    if (res.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#101726] rounded-t-2xl sm:rounded-xl max-w-lg w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col p-5 shadow-2xl border border-slate-200 dark:border-[#1e293b] animate-fade-in my-0 sm:my-auto text-xs overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-[#1e293b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Change Company Asset
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Admin Only</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Modify hardware details, assignment date, condition & status
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
          {/* Asset Type & Tag */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Asset Type *
              </label>
              <select
                value={assetType}
                onChange={e => setAssetType(e.target.value as AssetType)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              >
                <option value="Monitor">🖥️ Monitor</option>
                <option value="Mobile Phone">📱 Mobile Phone</option>
                <option value="Docking Station">🔌 Docking Station</option>
                <option value="Laptop">💻 Laptop / PC</option>
                <option value="Mouse">🖱️ Mouse</option>
                <option value="Keyboard">⌨️ Keyboard</option>
                <option value="Headset">🎧 Headset</option>
                <option value="Other">📦 Other Equipment</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Asset Tag / Number *
              </label>
              <input
                type="text"
                required
                value={assetNumber}
                onChange={e => setAssetNumber(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 font-mono font-bold uppercase bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              />
            </div>
          </div>

          {/* Brand & Model */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Brand / Make *
              </label>
              <input
                type="text"
                required
                value={brand}
                onChange={e => setBrand(e.target.value)}
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
                value={model}
                onChange={e => setModel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              />
            </div>
          </div>

          {/* Company Phone Information */}
          {assetType === 'Mobile Phone' && (
            <div className="p-3 bg-pink-50/50 dark:bg-pink-950/20 rounded-lg border border-pink-100 dark:border-pink-900/30 space-y-2.5">
              <div className="text-[11px] font-bold text-pink-700 dark:text-pink-300 flex items-center gap-1.5">
                <span>📱</span>
                <span>Company Phone Details</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                    Device Name
                  </label>
                  <input
                    type="text"
                    value={deviceName}
                    onChange={e => setDeviceName(e.target.value)}
                    placeholder="e.g. Samsung Galaxy S23"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                    IMEI Number
                  </label>
                  <input
                    type="text"
                    value={imeiNumber}
                    onChange={e => {
                      setImeiNumber(e.target.value);
                      setSerialNumber(e.target.value);
                    }}
                    placeholder="15-digit IMEI"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md font-mono text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md font-mono text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Security Function Section (For Laptop & Mobile Phone) */}
          {(assetType === 'Mobile Phone' || assetType === 'Laptop') && (
            <div className="p-3 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-lg border border-emerald-500/20 space-y-2">
              <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                <span>🛡️ Security Feature Setup</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                    Security Feature Added? *
                  </label>
                  <select
                    value={securityFunctionAdded}
                    onChange={e => setSecurityFunctionAdded(e.target.value as 'Yes' | 'No')}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md text-xs focus:outline-hidden focus:border-blue-500 font-semibold cursor-pointer"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                    Security Function Added Date
                  </label>
                  <input
                    type="date"
                    value={securityFunctionAddedDate}
                    onChange={e => setSecurityFunctionAddedDate(e.target.value)}
                    disabled={securityFunctionAdded === 'No'}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-md text-xs focus:outline-hidden focus:border-blue-500 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Serial Number & Assigned Employee */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Serial Number *
              </label>
              <input
                type="text"
                required
                value={serialNumber}
                onChange={e => setSerialNumber(e.target.value)}
                className="w-full px-3 py-2 font-mono text-xs bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Assigned Employee
              </label>
              <select
                value={assignedEmployeeId}
                onChange={e => {
                  setAssignedEmployeeId(e.target.value);
                  if (e.target.value && status === 'Available') {
                    setStatus('Assigned');
                  } else if (!e.target.value && status === 'Assigned') {
                    setStatus('Available');
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              >
                <option value="">-- Unassigned (Fleet Pool) --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employeeId}) • {emp.department}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assigned Date & Return Date */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3 text-blue-500" />
                <span>Assigned Date</span>
              </label>
              <input
                type="date"
                value={assignedDate}
                onChange={e => setAssignedDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3 text-amber-500" />
                <span>Return Date</span>
              </label>
              <input
                type="date"
                value={returnDate}
                onChange={e => setReturnDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              />
            </div>
          </div>

          {/* Condition & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Hardware Condition *
              </label>
              <select
                value={condition}
                onChange={e => setCondition(e.target.value as AssetCondition)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              >
                <option value="New">New (Factory fresh)</option>
                <option value="Good">Good (Operational)</option>
                <option value="Fair">Fair (Wear visible)</option>
                <option value="Damaged">Damaged (Faulty)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Fleet Lifecycle Status *
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as AssetStatus)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              >
                <option value="Assigned">Assigned (In Field)</option>
                <option value="Available">Available (In Stock)</option>
                <option value="Under Service">Under Service (In Lab)</option>
                <option value="Returned">Returned (Checked-In)</option>
                <option value="Damaged">Damaged (Offline)</option>
                <option value="Retired">Retired (Scrapped)</option>
              </select>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Assignment Notes & Administrative Remarks
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Assigned on probation, upgraded monitor to 4K..."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#1e293b] gap-2 flex-wrap">
            {isAdmin && !confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-rose-500 hover:bg-rose-500/10 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                title="Decommission and remove asset record"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Decommission</span>
              </button>
            ) : isAdmin && confirmDelete ? (
              <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 p-1 rounded-lg">
                <span className="text-[10px] text-rose-500 font-semibold px-1">Delete asset?</span>
                <button
                  type="button"
                  onClick={() => {
                    removeCompanyAsset(asset.id);
                    onClose();
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
                >
                  Yes, Remove
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Info className="w-3 h-3 text-blue-500" />
                <span>Only Admin can edit</span>
              </span>
            )}

            <div className="flex items-center gap-2 ml-auto">
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
                <Check className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
