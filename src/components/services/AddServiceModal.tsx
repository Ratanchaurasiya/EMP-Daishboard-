import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ProblemCategory, ServiceStatus } from '../../types';
import { X, Wrench, Check, Mail } from 'lucide-react';
import { IT_SUPPORT_EMAIL, dispatchServiceTicketEmail } from '../../utils/emailService';

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedComputerId?: string;
}

export const AddServiceModal: React.FC<AddServiceModalProps> = ({
  isOpen,
  onClose,
  preSelectedComputerId,
}) => {
  const { computers, assets, employees, userRole, addServiceRecord } = useApp();

  const allServiceableItems = useMemo(() => {
    const list: Array<{
      id: string;
      assetNumber: string;
      name: string;
      category: 'Computer' | 'Peripheral';
      type: string;
      assignedEmployeeId: string | null;
      assignedEmployeeName: string;
      originalComputer?: typeof computers[0];
      originalAsset?: typeof assets[0];
    }> = [];

    computers.forEach(c => {
      const emp = employees.find(e => e.id === c.assignedEmployeeId || e.employeeId === c.assignedEmployeeId);
      list.push({
        id: c.id,
        assetNumber: c.assetNumber,
        name: `${c.deviceName} (${c.manufacturer} ${c.model})`,
        category: 'Computer',
        type: c.deviceType || 'Computer',
        assignedEmployeeId: c.assignedEmployeeId,
        assignedEmployeeName: emp ? emp.name : 'Unassigned (Pool)',
        originalComputer: c,
      });
    });

    assets.forEach(a => {
      const emp = employees.find(e => e.id === a.assignedEmployeeId || e.employeeId === a.assignedEmployeeId);
      list.push({
        id: a.id,
        assetNumber: a.assetNumber,
        name: `${a.assetType}: ${a.brand} ${a.model}${a.deviceName ? ` - ${a.deviceName}` : ''}`,
        category: 'Peripheral',
        type: a.assetType,
        assignedEmployeeId: a.assignedEmployeeId,
        assignedEmployeeName: emp ? emp.name : 'Unassigned (Pool)',
        originalAsset: a,
      });
    });

    return list;
  }, [computers, assets, employees]);

  const [selectedAssetId, setSelectedAssetId] = useState<string>(() => {
    if (preSelectedComputerId) return preSelectedComputerId;
    if (computers.length > 0) return computers[0].id;
    if (assets.length > 0) return assets[0].id;
    return '';
  });

  useEffect(() => {
    if (preSelectedComputerId) {
      setSelectedAssetId(preSelectedComputerId);
    }
  }, [preSelectedComputerId]);

  const [serviceDate, setServiceDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );

  const [problemCategory, setProblemCategory] = useState<ProblemCategory>('Slow Performance');
  const [problem, setProblem] = useState<string>('');
  const [workPerformed, setWorkPerformed] = useState<string>('');
  const [partsReplaced, setPartsReplaced] = useState<string>('None');
  const [technician, setTechnician] = useState<string>('Rajesh Sharma');
  const [serviceCost, setServiceCost] = useState<number>(1200);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>('Completed');
  const [resolution, setResolution] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [notifyEmail, setNotifyEmail] = useState<boolean>(true);

  if (!isOpen || userRole !== 'admin') return null;

  const selectedItem = allServiceableItems.find(i => i.id === selectedAssetId) || allServiceableItems[0];
  const assignedEmp = selectedItem?.assignedEmployeeId
    ? employees.find(e => e.id === selectedItem.assignedEmployeeId || e.employeeId === selectedItem.assignedEmployeeId)
    : null;

  const categories: ProblemCategory[] = [
    'Windows Problem',
    'Slow Performance',
    'RAM Problem',
    'SSD/HDD Problem',
    'Keyboard Problem',
    'Mouse Problem',
    'Display Problem',
    'Network Problem',
    'Software Installation',
    'Driver Problem',
    'Hardware Failure',
    'Formatting',
    'Other',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const res = addServiceRecord({
      computerId: selectedItem.id,
      assetNumber: selectedItem.assetNumber,
      deviceName: selectedItem.name,
      employeeId: assignedEmp ? assignedEmp.employeeId : 'UNASSIGNED',
      employeeName: assignedEmp ? assignedEmp.name : 'Unassigned (Pool)',
      serviceDate,
      problem: problem.trim(),
      problemCategory,
      workPerformed: workPerformed.trim(),
      partsReplaced: partsReplaced.trim() || 'None',
      technician: technician.trim() || 'IT Technician',
      serviceCost: Number(serviceCost) || 0,
      serviceStatus,
      resolution: resolution.trim(),
      remarks: remarks.trim()
        ? `${remarks.trim()} • Dispatched to ${IT_SUPPORT_EMAIL}`
        : `Dispatched to ${IT_SUPPORT_EMAIL}`,
    });

    if (notifyEmail) {
      dispatchServiceTicketEmail({
        employeeName: assignedEmp ? assignedEmp.name : 'Unassigned (Pool)',
        employeeId: assignedEmp ? assignedEmp.employeeId : 'UNASSIGNED',
        companyEmployeeNumber: assignedEmp?.companyEmployeeNumber,
        employeeEmail: assignedEmp?.email,
        employeePhone: assignedEmp?.phone,
        department: assignedEmp?.department,
        designation: assignedEmp?.designation,
        assetNumber: selectedItem.assetNumber,
        deviceName: selectedItem.name,
        deviceType: selectedItem.type,
        manufacturer: selectedItem.originalComputer?.manufacturer || selectedItem.originalAsset?.brand || 'Standard',
        model: selectedItem.originalComputer?.model || selectedItem.originalAsset?.model || 'General',
        serialNumber: selectedItem.originalComputer?.serialNumber || selectedItem.originalAsset?.serialNumber || 'N/A',
        problemCategory,
        urgency: 'Normal',
        issueDescription: `[Problem / Issue]: ${problem.trim()}\n[Work Performed]: ${workPerformed.trim() || 'Diagnostics in progress'}\n[Parts Replaced]: ${partsReplaced.trim() || 'None'}\n[Technician]: ${technician.trim() || 'IT Technician'}\n[Status]: ${serviceStatus}\n[Resolution]: ${resolution.trim() || 'Pending'}\n[Cost]: ₹${serviceCost}\n[Remarks]: ${remarks.trim() || 'None'}`,
        serviceDate,
        os: selectedItem.originalComputer?.system?.os,
        processor: selectedItem.originalComputer?.processor?.name,
        installedRAM: selectedItem.originalComputer?.memory?.installedRAM,
        storage: selectedItem.originalComputer?.storage?.total,
      });
    }

    if (res.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#101726] rounded-t-2xl sm:rounded-xl max-w-xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-[#1e293b] animate-fade-in my-0 sm:my-auto text-xs">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Log Asset Service & Repair Record
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Record diagnostic findings, labor, parts, cost, and auto-sync asset status
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {/* Select Hardware or Peripheral Asset */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Select Hardware / Peripheral Asset *
            </label>
            <select
              required
              value={selectedAssetId}
              onChange={e => setSelectedAssetId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs font-mono font-medium focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
            >
              {computers.length > 0 && (
                <optgroup label="Workstations & Laptops">
                  {computers.map(c => {
                    const emp = employees.find(e => e.id === c.assignedEmployeeId);
                    return (
                      <option key={c.id} value={c.id}>
                        {c.assetNumber} - {c.deviceName} ({c.manufacturer} {c.model}) {emp ? `[${emp.name}]` : '[Pool]'}
                      </option>
                    );
                  })}
                </optgroup>
              )}
              {assets.length > 0 && (
                <optgroup label="Peripherals & Accessories (Mice, Keyboards, Headsets, Phones, etc.)">
                  {assets.map(a => {
                    const emp = employees.find(e => e.id === a.assignedEmployeeId);
                    return (
                      <option key={a.id} value={a.id}>
                        {a.assetNumber} - {a.assetType}: {a.brand} {a.model} {emp ? `[${emp.name}]` : '[Pool]'}
                      </option>
                    );
                  })}
                </optgroup>
              )}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Service Date *
              </label>
              <input
                type="date"
                required
                value={serviceDate}
                onChange={e => setServiceDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Problem Category *
              </label>
              <select
                value={problemCategory}
                onChange={e => setProblemCategory(e.target.value as ProblemCategory)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Problem Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. System crashing on boot with memory error..."
              value={problem}
              onChange={e => setProblem(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Service / Work Performed *
            </label>
            <textarea
              rows={2}
              required
              placeholder="Detailed description of diagnostic tests and repairs performed..."
              value={workPerformed}
              onChange={e => setWorkPerformed(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Parts Replaced
              </label>
              <input
                type="text"
                placeholder="e.g. 512GB NVMe SSD or None"
                value={partsReplaced}
                onChange={e => setPartsReplaced(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Technician Name
              </label>
              <input
                type="text"
                value={technician}
                onChange={e => setTechnician(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Service Cost (INR ₹)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={serviceCost}
                onChange={e => setServiceCost(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs font-mono font-bold focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Service Ticket Status *
              </label>
              <select
                value={serviceStatus}
                onChange={e => setServiceStatus(e.target.value as ServiceStatus)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              >
                <option value="Completed">Completed (Auto-returns asset to Assigned)</option>
                <option value="In Progress">In Progress (Auto-marks asset Under Service)</option>
                <option value="Pending Parts">Pending Parts (Auto-marks asset Under Service)</option>
                <option value="Cannot Repair">Cannot Repair (Damaged)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Final Resolution Summary
            </label>
            <input
              type="text"
              placeholder="e.g. Replaced faulty module; verified 100% stable."
              value={resolution}
              onChange={e => setResolution(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Technician Remarks
            </label>
            <textarea
              rows={2}
              placeholder="Additional service remarks or advice to employee..."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
            />
          </div>

          {/* Email Notification Option */}
          <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Email Dispatch to IT Support
                </span>
                <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 block">
                  {IT_SUPPORT_EMAIL}
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifyEmail}
                onChange={e => setNotifyEmail(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
            </label>
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
              <span>Record Service Ticket</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
