import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { EmployeeStatus, CORPORATE_DEPARTMENTS } from '../../types';
import {
  X,
  User,
  Check,
  Sparkles,
  BadgeAlert,
  Info,
} from 'lucide-react';
import { EmployeeAvatar } from '../common/EmployeeAvatar';
import { DualDateInput } from '../common/DualDateInput';

interface AddEmployeeOnlyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddEmployeeOnlyModal: React.FC<AddEmployeeOnlyModalProps> = ({ isOpen, onClose }) => {
  const { employees, addEmployee, showToast } = useApp();

  // Scroll lock and Escape listener
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  // Auto-calculate next sequential Employee ID (e.g. EMP009)
  const nextSuggestedId = useMemo(() => {
    const nums = employees
      .map(e => {
        const match = e.employeeId.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter(n => !isNaN(n));
    const maxNum = nums.length > 0 ? Math.max(...nums) : 0;
    return `EMP${String(maxNum + 1).padStart(3, '0')}`;
  }, [employees]);

  // Form State - ONLY Employee Data
  const [employeeId, setEmployeeId] = useState('');
  const [companyEmployeeNumber, setCompanyEmployeeNumber] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [designation, setDesignation] = useState('');
  const [team, setTeam] = useState('');
  const [joiningDate, setJoiningDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [status, setStatus] = useState<EmployeeStatus>('Active');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [remarks, setRemarks] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Pre-fill smart defaults when opened
  useEffect(() => {
    if (isOpen) {
      const nextId = nextSuggestedId;
      setEmployeeId(nextId);
      setCompanyEmployeeNumber(`CORP-${8820 + employees.length}`);
      setJoiningDate(new Date().toISOString().substring(0, 10));
    }
  }, [isOpen, nextSuggestedId, employees.length]);

  if (!isOpen) return null;

  // Real-time duplicate employeeId check
  const isDuplicateId = employees.some(
    e => e.employeeId.trim().toLowerCase() === employeeId.trim().toLowerCase()
  );

  const handleQuickAutoFill = () => {
    const sampleNames = [
      'Aarav Deshmukh',
      'Ishaan Malhotra',
      'Tanvi Sen',
      'Aditya Varma',
      'Meera Iyer',
      'Siddharth Kapoor',
      'Roshni Roy',
    ];
    const pickedName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const cleanFirstName = pickedName.split(' ')[0].toLowerCase();

    setName(pickedName);
    setEmail(`${cleanFirstName}.${pickedName.split(' ')[1].toLowerCase()}@company.com`);
    setDesignation('Software Development Engineer');
    setTeam('Cloud Infrastructure');
    setPhone(`+91 98${Math.floor(10000000 + Math.random() * 90000000)}`);
    setRemarks('Direct hire onboarding. IT assets to be allocated post-induction.');
    showToast('Filled sample employee data', 'info');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('Employee name is required', 'error');
      return;
    }
    if (!employeeId.trim()) {
      showToast('Employee ID is required', 'error');
      return;
    }
    if (isDuplicateId) {
      showToast(`Employee ID "${employeeId}" is already taken!`, 'error');
      return;
    }

    // Call addEmployee with NULL for computer, assets, and service records
    // This adds strictly ONLY the employee record to the directory!
    const res = addEmployee(
      {
        employeeId: employeeId.trim(),
        companyEmployeeNumber: companyEmployeeNumber.trim() || `CORP-${employeeId.trim()}`,
        name: name.trim(),
        department,
        designation: designation.trim() || 'Team Member',
        team: team.trim() || department,
        joiningDate,
        status,
        email: email.trim(),
        phone: phone.trim() || '+91 98000 00000',
        remarks: remarks.trim(),
        photoUrl: photoUrl.trim() || undefined,
      },
      null, // No computer
      null, // No assets
      null  // No service records
    );

    if (res.success) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-[#101726] rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-[#1e293b] animate-fade-in my-auto text-xs overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-[#1e293b] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Add New Employee (Profile Only)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Register employee details without assigning hardware
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleQuickAutoFill}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
              title="Auto-fill sample data"
            >
              <Sparkles className="w-3 h-3" />
              <span>Auto-Fill</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notice: Employee Only */}
        <div className="px-5 py-2.5 bg-blue-50/60 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/30 flex items-center gap-2 text-[11px] text-blue-700 dark:text-blue-300">
          <Info className="w-3.5 h-3.5 shrink-0 text-blue-500" />
          <span>
            Only employee credentials will be registered. Workstations, phones, and peripherals can be assigned anytime later.
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Avatar / Photo Section */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] flex items-center gap-4">
            <EmployeeAvatar
              name={name || 'New Employee'}
              photoUrl={photoUrl}
              size="lg"
              editable={true}
              onPhotoChange={url => setPhotoUrl(url)}
              onPhotoRemove={() => setPhotoUrl('')}
            />
            <div className="min-w-0">
              <span className="font-bold text-slate-900 dark:text-white block text-xs">
                Profile Photo / Avatar
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Click photo to select a preset avatar or paste image URL
              </p>
            </div>
          </div>

          {/* Identification Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                  Employee ID *
                </label>
                <button
                  type="button"
                  onClick={() => setEmployeeId(nextSuggestedId)}
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-mono cursor-pointer"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  Next: {nextSuggestedId}
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="e.g. EMP009"
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                className={`w-full px-3 py-1.5 bg-slate-50 dark:bg-[#090d16] border ${
                  isDuplicateId ? 'border-rose-500' : 'border-slate-200 dark:border-[#1e293b]'
                } text-slate-900 dark:text-slate-100 rounded-lg text-xs font-mono font-bold focus:outline-hidden focus:border-blue-500`}
              />
              {isDuplicateId && (
                <span className="text-[10px] text-rose-500 mt-0.5 flex items-center gap-1">
                  <BadgeAlert className="w-3 h-3" />
                  Employee ID already in use!
                </span>
              )}
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Company Payroll / Badge #
              </label>
              <input
                type="text"
                placeholder="e.g. CORP-8828"
                value={companyEmployeeNumber}
                onChange={e => setCompanyEmployeeNumber(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs font-mono focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          {/* Name & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rohan Verma"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Department *
              </label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 cursor-pointer"
              >
                {CORPORATE_DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Designation & Team */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Designation
              </label>
              <input
                type="text"
                placeholder="e.g. Senior Backend Engineer"
                value={designation}
                onChange={e => setDesignation(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Team / Squad
              </label>
              <input
                type="text"
                placeholder="e.g. Core Infrastructure"
                value={team}
                onChange={e => setTeam(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Company Email *
              </label>
              <input
                type="email"
                required
                placeholder="rohan.verma@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs font-mono focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          {/* Joining Date & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <DualDateInput
                label="Joining Date *"
                value={joiningDate}
                onChange={val => setJoiningDate(val)}
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Employment Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as EmployeeStatus)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="On Probation">On Probation</option>
                <option value="On Leave">On Leave</option>
                <option value="Contractual">Contractual</option>
                <option value="Inactive">Inactive</option>
                <option value="Resigned">Resigned</option>
              </select>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Remarks / Notes
            </label>
            <textarea
              rows={2}
              placeholder="Onboarding notes, induction notes, department remarks..."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
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
              disabled={isDuplicateId}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Employee Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
