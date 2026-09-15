import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { EmployeeStatus, CORPORATE_DEPARTMENTS } from '../../types';
import { DualDateInput } from '../common/DualDateInput';
import { X, UserCheck, ShieldCheck } from 'lucide-react';

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
}

const DEPARTMENTS = CORPORATE_DEPARTMENTS;

export const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({
  isOpen,
  onClose,
  employeeId,
}) => {
  const { employees, updateEmployee, userRole, showToast } = useApp();

  const employee = employees.find(e => e.id === employeeId || e.employeeId === employeeId);

  const [name, setName] = useState('');
  const [companyEmployeeNumber, setCompanyEmployeeNumber] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [designation, setDesignation] = useState('');
  const [team, setTeam] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [status, setStatus] = useState<EmployeeStatus>('Active');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [remarks, setRemarks] = useState('');

  // Populate state on load or change
  useEffect(() => {
    if (employee) {
      setName(employee.name || '');
      setCompanyEmployeeNumber(employee.companyEmployeeNumber || '');
      setDepartment(employee.department || 'Engineering');
      setDesignation(employee.designation || '');
      setTeam(employee.team || '');
      setJoiningDate(employee.joiningDate || '');
      setStatus(employee.status || 'Active');
      setPhone(employee.phone || '');
      setEmail(employee.email || '');
      setRemarks(employee.remarks || '');
    }
  }, [employee, isOpen]);

  if (!isOpen || !employee) return null;

  const isAdmin = userRole === 'admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('Admin privilege required to edit employee details.', 'error');
      return;
    }

    if (!name.trim()) {
      showToast('Employee name is required.', 'error');
      return;
    }

    if (!joiningDate.trim()) {
      showToast('Joining date is required.', 'error');
      return;
    }

    updateEmployee(employee.id, {
      name: name.trim(),
      companyEmployeeNumber: companyEmployeeNumber.trim() || employee.companyEmployeeNumber,
      department: department.trim(),
      designation: designation.trim(),
      team: team.trim(),
      joiningDate: joiningDate.trim(),
      status,
      phone: phone.trim(),
      email: email.trim(),
      remarks: remarks.trim(),
    });

    showToast(`Updated profile & details for ${name.trim()}`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#101726] rounded-xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 dark:border-[#1e293b] animate-fade-in my-auto text-xs">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-[#1e293b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Edit Employee & Joining Date
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Admin Only</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Modify joining date, department, designation, and employee metadata
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-3">
          {/* Identifiers */}
          <div className="grid grid-cols-2 gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-[#090d16] border border-slate-200/80 dark:border-[#1e293b]">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-0.5">
                System Employee ID
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {employee.employeeId}
              </span>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-0.5">
                Badge / Payroll ID
              </label>
              <input
                type="text"
                value={companyEmployeeNumber}
                onChange={e => setCompanyEmployeeNumber(e.target.value)}
                placeholder="e.g. EMP-001"
                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded font-mono font-bold text-xs focus:outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Full Name & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Rajesh Sharma"
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Employee Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as EmployeeStatus)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
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

          {/* Department & Designation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              >
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Designation / Role
              </label>
              <input
                type="text"
                value={designation}
                onChange={e => setDesignation(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              />
            </div>
          </div>

          {/* Team */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Assigned Team / Division
            </label>
            <input
              type="text"
              value={team}
              onChange={e => setTeam(e.target.value)}
              placeholder="e.g. Core Platform / DevOps"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
            />
          </div>

          {/* DUAL DATE INPUT: CALENDAR PICKER & MANUAL TEXT ENTRY */}
          <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40">
            <DualDateInput
              label="Joining Date (Calendar Picker & Manual Entry)"
              value={joiningDate}
              onChange={setJoiningDate}
              required={true}
              helperText="Type DD-MM-YYYY manually or click the calendar icon to pick"
            />
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Company Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Company Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 00000"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs font-mono focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Remarks / Administrative Notes
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="e.g. Verified joining credentials, contract renewal date..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#1e293b]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Save Employee & Date</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
