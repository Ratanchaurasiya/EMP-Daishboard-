import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { EmployeeStatusBadge, ConditionBadge, ServiceStatusBadge } from '../common/Badge';
import { EmployeeAvatar } from '../common/EmployeeAvatar';
import {
  Users,
  Laptop,
  Smartphone,
  ArrowRight,
  Calendar,
  Pencil,
  UserCheck,
  UserX,
  Trash2,
  RotateCcw,
  UserPlus,
  Layers,
  Wrench,
  Mail,
  Phone,
  Copy,
  Check,
  HardDrive,
  Cpu,
  LayoutGrid,
  Table as TableIcon,
  ShieldCheck,
  Monitor,
  Mouse,
  Keyboard,
  Headphones,
  Eye,
  Search,
  Filter,
  CheckCircle2,
  Share2,
  Signal,
  PhoneCall,
  Plus,
} from 'lucide-react';
import { formatDateDisplay } from '../../utils/formatters';
import { calculateSimMonthlyExpense, formatINR, getEmployeeSimCards, getEmployeeActiveSimCards, getSimUsageBadgeStyle } from '../../utils/simUtils';
import { Employee } from '../../types';
import { EditEmployeeModal } from './EditEmployeeModal';
import { RemoveEmployeeModal } from './RemoveEmployeeModal';
import { DeactivateEmployeeModal } from './DeactivateEmployeeModal';
import { AddEmployeeOnlyModal } from './AddEmployeeOnlyModal';
import { ShareEmployeeModal } from './ShareEmployeeModal';
import { AssignSimModal } from '../sim/AssignSimModal';

interface EmployeeListProps {
  onSelectEmployee: (id: string) => void;
  onOpenAddEmployee: () => void;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({
  onSelectEmployee,
  onOpenAddEmployee,
}) => {
  const {
    employees,
    computers,
    assets,
    serviceRecords,
    simCards,
    userRole,
    globalFilters,
    reactivateEmployee,
    removeAllEmployees,
    showToast,
  } = useApp();

  const [activeDirectoryTab, setActiveDirectoryTab] = useState<'active' | 'inactive' | 'all'>('active');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [hardwareFilter, setHardwareFilter] = useState<'all' | 'with-computer' | 'without-computer' | 'with-phone' | 'with-services'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [localSearch, setLocalSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [showAddOnlyModal, setShowAddOnlyModal] = useState<boolean>(false);
  const [showRemoveAllModal, setShowRemoveAllModal] = useState<boolean>(false);
  const [removeAllStep, setRemoveAllStep] = useState<1 | 2>(1);
  const [returnAssetsOption, setReturnAssetsOption] = useState<boolean>(true);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [deactivatingEmployeeId, setDeactivatingEmployeeId] = useState<string | null>(null);
  const [removingEmployeeId, setRemovingEmployeeId] = useState<string | null>(null);
  const [sharingEmployee, setSharingEmployee] = useState<Employee | null>(null);
  const [assigningSimEmployeeId, setAssigningSimEmployeeId] = useState<string | null>(null);

  const handleCopy = (text: string, label: string, key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Copied ${label} to clipboard`, 'info');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Telemetry computations
  const totalEmployees = employees.length;
  const activeCount = useMemo(() => employees.filter(e => e.status === 'Active').length, [employees]);
  const inactiveCount = useMemo(
    () => employees.filter(e => e.status === 'Inactive' || e.status === 'Resigned' || e.status === 'Exited').length,
    [employees]
  );
  const activePercentage = totalEmployees > 0 ? Math.round((activeCount / totalEmployees) * 100) : 0;

  const employeesWithComputer = useMemo(() => {
    const assignedIds = new Set(
      computers.filter(c => c.assignedEmployeeId).map(c => c.assignedEmployeeId!)
    );
    return employees.filter(e => assignedIds.has(e.id) || assignedIds.has(e.employeeId)).length;
  }, [employees, computers]);

  const employeesWithPhone = useMemo(() => {
    const assignedIds = new Set(
      assets
        .filter(a => a.assetType === 'Mobile Phone' && a.assignedEmployeeId)
        .map(a => a.assignedEmployeeId!)
    );
    return employees.filter(e => assignedIds.has(e.id) || assignedIds.has(e.employeeId)).length;
  }, [employees, assets]);

  const totalServiceRecordsCount = useMemo(() => {
    return serviceRecords.length;
  }, [serviceRecords]);

  const departments = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.department))).filter(Boolean);
  }, [employees]);

  // Comprehensive multi-dimensional filtering
  const filteredEmployees = useMemo(() => {
    const activeSearch = (localSearch || globalFilters.search || '').trim().toLowerCase();

    return employees.filter(emp => {
      // 1. Directory Tab Filter (Active vs Inactive vs All) - enforce when no active search
      if (!activeSearch) {
        if (activeDirectoryTab === 'active' && emp.status !== 'Active') return false;
        if (activeDirectoryTab === 'inactive' && emp.status === 'Active') return false;
      }

      // Department and Status filters
      if (deptFilter && emp.department !== deptFilter) return false;
      if (statusFilter && emp.status !== statusFilter) return false;

      // Computer and Asset associations
      const comp = computers.find(
        c => c.assignedEmployeeId === emp.id || c.assignedEmployeeId === emp.employeeId
      );
      const empAssets = assets.filter(
        a => a.assignedEmployeeId === emp.id || a.assignedEmployeeId === emp.employeeId
      );
      const empPhones = empAssets.filter(a => a.assetType === 'Mobile Phone');
      const empServices = serviceRecords.filter(
        s =>
          s.employeeId === emp.employeeId ||
          s.employeeId === emp.id ||
          (comp && s.computerId === comp.id)
      );

      // Hardware filter
      if (hardwareFilter === 'with-computer' && !comp) return false;
      if (hardwareFilter === 'without-computer' && comp) return false;
      if (hardwareFilter === 'with-phone' && empPhones.length === 0) return false;
      if (hardwareFilter === 'with-services' && empServices.length === 0) return false;

      // Global or local multi-field search across personal, professional, computer, phone, assets & services
      if (activeSearch) {
        // Personal & Professional
        const personalMatch =
          emp.name.toLowerCase().includes(activeSearch) ||
          emp.employeeId.toLowerCase().includes(activeSearch) ||
          (emp.companyEmployeeNumber && emp.companyEmployeeNumber.toLowerCase().includes(activeSearch)) ||
          emp.department.toLowerCase().includes(activeSearch) ||
          (emp.designation && emp.designation.toLowerCase().includes(activeSearch)) ||
          (emp.team && emp.team.toLowerCase().includes(activeSearch)) ||
          emp.email.toLowerCase().includes(activeSearch) ||
          (emp.phone && emp.phone.toLowerCase().includes(activeSearch)) ||
          (emp.remarks && emp.remarks.toLowerCase().includes(activeSearch));

        if (personalMatch) return true;

        // Computer specifications
        if (comp) {
          const compMatch =
            comp.deviceName.toLowerCase().includes(activeSearch) ||
            comp.assetNumber.toLowerCase().includes(activeSearch) ||
            comp.manufacturer.toLowerCase().includes(activeSearch) ||
            comp.model.toLowerCase().includes(activeSearch) ||
            comp.serialNumber.toLowerCase().includes(activeSearch) ||
            (comp.processor?.name && comp.processor.name.toLowerCase().includes(activeSearch)) ||
            (comp.memory?.installedRAM && comp.memory.installedRAM.toLowerCase().includes(activeSearch)) ||
            (comp.storage?.total && comp.storage.total.toLowerCase().includes(activeSearch)) ||
            (comp.system?.os && comp.system.os.toLowerCase().includes(activeSearch));

          if (compMatch) return true;
        }

        // Mobile Phones & Cellular
        const phoneMatch = empPhones.some(
          p =>
            p.assetNumber.toLowerCase().includes(activeSearch) ||
            p.brand.toLowerCase().includes(activeSearch) ||
            p.model.toLowerCase().includes(activeSearch) ||
            (p.phoneNumber && p.phoneNumber.toLowerCase().includes(activeSearch)) ||
            (p.imeiNumber && p.imeiNumber.toLowerCase().includes(activeSearch)) ||
            p.serialNumber.toLowerCase().includes(activeSearch)
        );
        if (phoneMatch) return true;

        // Other Assets & Peripherals
        const assetMatch = empAssets.some(
          a =>
            a.assetNumber.toLowerCase().includes(activeSearch) ||
            a.assetType.toLowerCase().includes(activeSearch) ||
            a.brand.toLowerCase().includes(activeSearch) ||
            a.model.toLowerCase().includes(activeSearch) ||
            a.serialNumber.toLowerCase().includes(activeSearch)
        );
        if (assetMatch) return true;

        // Service & Maintenance History
        const serviceMatch = empServices.some(
          s =>
            s.id.toLowerCase().includes(activeSearch) ||
            s.problem.toLowerCase().includes(activeSearch) ||
            s.problemCategory.toLowerCase().includes(activeSearch) ||
            (s.workPerformed && s.workPerformed.toLowerCase().includes(activeSearch)) ||
            (s.resolution && s.resolution.toLowerCase().includes(activeSearch))
        );
        if (serviceMatch) return true;

        return false;
      }

      return true;
    });
  }, [
    employees,
    computers,
    assets,
    serviceRecords,
    activeDirectoryTab,
    deptFilter,
    statusFilter,
    hardwareFilter,
    localSearch,
    globalFilters.search,
  ]);

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      {/* Header & Title Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span>Personnel Directory & Complete Profile Center</span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
              {filteredEmployees.length} Enrolled
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Centralized directory linking personal info, professional credentials, workstation specs, mobile phones, company gear & maintenance history
          </p>
        </div>

        {userRole === 'admin' && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowAddOnlyModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Add a new employee profile without hardware"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Employee (Profile Only)</span>
            </button>

            <button
              type="button"
              onClick={onOpenAddEmployee}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/60 dark:border-blue-800/60 rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Full onboarding: register employee with computer and peripherals"
            >
              <Laptop className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Onboard with Hardware</span>
            </button>

            {employees.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setRemoveAllStep(1);
                  setShowRemoveAllModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/60 dark:border-rose-800/60 rounded-lg shadow-xs transition-colors cursor-pointer"
                title="Remove all employee records from the directory"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove All Employees</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4 TELEMETRY STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Stat 1: Total Registered */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-500" />
              Total Personnel
            </span>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              {activePercentage}% Active
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {totalEmployees}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ({activeCount} Active • {inactiveCount} Inactive)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>Role-Based Access Protected</span>
          </div>
        </div>

        {/* Stat 2: Workstations Assigned */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-indigo-500" />
              Workstation Fleet
            </span>
            <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
              {computers.length} Units
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {employeesWithComputer}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Staff Equipped ({totalEmployees - employeesWithComputer} Unassigned)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-indigo-500" />
            <span>Laptops & Desktop Workstations</span>
          </div>
        </div>

        {/* Stat 3: Mobile Phones Issued */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-pink-500" />
              Cellular Phones
            </span>
            <span className="text-[11px] font-mono text-pink-600 dark:text-pink-400 font-bold">
              {assets.filter(a => a.assetType === 'Mobile Phone').length} Devices
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {employeesWithPhone}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Active Cellular Users
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <Phone className="w-3 h-3 text-pink-500" />
            <span>Assigned SIMs & 15-Digit IMEIs</span>
          </div>
        </div>

        {/* Stat 4: Service & Maintenance Tickets */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-amber-500" />
              Service & Repairs
            </span>
            <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold">
              {serviceRecords.filter(s => s.serviceStatus === 'In Progress').length} In Progress
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {totalServiceRecordsCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Historical Service Logs
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Complete Hardware Audit Trail</span>
          </div>
        </div>
      </div>

      {/* Directory Status Tabs: Active, Inactive / Deactivated, All */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveDirectoryTab('active')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeDirectoryTab === 'active'
                ? 'bg-white dark:bg-[#101726] text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/60 dark:border-slate-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Active Employees</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400">
              {activeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDirectoryTab('inactive')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeDirectoryTab === 'inactive'
                ? 'bg-white dark:bg-[#101726] text-amber-600 dark:text-amber-400 shadow-xs border border-slate-200/60 dark:border-slate-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <UserX className="w-3.5 h-3.5 text-amber-500" />
            <span>Inactive / Exited</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400">
              {inactiveCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDirectoryTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeDirectoryTab === 'all'
                ? 'bg-white dark:bg-[#101726] text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-slate-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>All Enrolled</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {totalEmployees}
            </span>
          </button>
        </div>

        {/* View Mode Toggle: Cards Grid vs Dense Table */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-white dark:bg-[#101726] text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Card Grid View (Touch & Mobile Friendly)"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cards View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white dark:bg-[#101726] text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="High-Density Desktop Table View"
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Table View</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-white dark:bg-[#101726] rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Quick Unified Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              placeholder="Search employee, ID, workstation tag, phone SIM, IMEI, specs..."
              className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => setLocalSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Resigned">Resigned</option>
          </select>

          {/* Hardware Allocation Filter */}
          <select
            value={hardwareFilter}
            onChange={e => setHardwareFilter(e.target.value as any)}
            className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Hardware States</option>
            <option value="with-computer">With Workstation (Laptop/PC)</option>
            <option value="without-computer">Without Workstation</option>
            <option value="with-phone">With Company Phone</option>
            <option value="with-services">With Service Records</option>
          </select>

          {(deptFilter || statusFilter || hardwareFilter !== 'all' || localSearch) && (
            <button
              type="button"
              onClick={() => {
                setDeptFilter('');
                setStatusFilter('');
                setHardwareFilter('all');
                setLocalSearch('');
              }}
              className="text-[11px] text-blue-600 hover:text-blue-500 font-semibold px-2 py-1 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        <span className="text-[11px] text-slate-400 font-mono shrink-0">
          Showing {filteredEmployees.length} of {employees.length} employees
        </span>
      </div>

      {/* VIEW 1: ENTERPRISE CARDS GRID */}
      {viewMode === 'cards' && (
        filteredEmployees.length === 0 ? (
          <div className="bg-white dark:bg-[#101726] rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              {employees.length === 0 ? 'No Employees in Directory' : 'No Employees Matching Filter'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
              {employees.length === 0
                ? 'Your personnel directory is currently empty. Click the button below to manually register and onboard your first employee.'
                : 'No employees match the current filter or search criteria. Try resetting your search filters.'}
            </p>
            {employees.length === 0 && userRole === 'admin' && (
              <button
                type="button"
                onClick={onOpenAddEmployee}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add First Employee</span>
              </button>
            )}
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredEmployees.map(emp => {
            const comp = computers.find(
              c => c.assignedEmployeeId === emp.id || c.assignedEmployeeId === emp.employeeId
            );
            const empAssets = assets.filter(
              a => a.assignedEmployeeId === emp.id || a.assignedEmployeeId === emp.employeeId
            );
            const empPhones = empAssets.filter(a => a.assetType === 'Mobile Phone');
            const empPeripherals = empAssets.filter(a => a.assetType !== 'Mobile Phone');
            const empSims = getEmployeeSimCards(emp, simCards);
            const empServices = serviceRecords.filter(
              s =>
                s.employeeId === emp.employeeId ||
                s.employeeId === emp.id ||
                (comp && s.computerId === comp.id)
            );
            const latestService = empServices.length > 0 ? empServices[0] : null;

            return (
              <div
                key={emp.id}
                onClick={() => onSelectEmployee(emp.id)}
                className="p-4 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 hover:border-blue-400/60 dark:hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Avatar, Name, Role & Status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <EmployeeAvatar
                        name={emp.name}
                        photoUrl={emp.photoUrl}
                        size="md"
                        status={emp.status}
                        showStatusDot={true}
                      />
                      <div className="min-w-0">
                        <h3 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {emp.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 truncate">
                          {emp.designation}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <EmployeeStatusBadge status={emp.status} size="sm" />
                      {userRole === 'admin' && (
                        <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setEditingEmployeeId(emp.id)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit employee details"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {emp.status === 'Active' ? (
                            <button
                              type="button"
                              onClick={() => setDeactivatingEmployeeId(emp.id)}
                              className="p-1 rounded text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                              title="Deactivate employee (safe, preserves all assets)"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => reactivateEmployee(emp.id)}
                              className="p-1 rounded text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                              title="Restore / Reactivate employee"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setRemovingEmployeeId(emp.id)}
                            className="p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            title="Remove employee (3-step confirmation)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Deactivated Notice if applicable */}
                  {(emp.status === 'Inactive' || emp.status === 'Resigned') && (
                    <div className="mb-2.5 p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-700 dark:text-amber-400 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <UserX className="w-3 h-3 shrink-0" />
                        <span>Deactivated (Historical Records Preserved)</span>
                      </span>
                      {userRole === 'admin' && (
                        <div className="flex items-center gap-2 ml-1">
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              reactivateEmployee(emp.id);
                            }}
                            className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                            title="Restore / Reactivate this employee"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>Restore</span>
                          </button>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              setRemovingEmployeeId(emp.id);
                            }}
                            className="font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                            title="Permanently remove and purge this employee"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                            <span>Delete Permanently</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Professional Badges: Emp ID, Corporate Badge, Dept, Team, Joining Date */}
                  <div className="flex items-center gap-1.5 mb-2.5 text-[11px] flex-wrap">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onSelectEmployee(emp.id);
                      }}
                      className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/20 hover:border-blue-500/40 transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                      title={`Click to view complete profile for ${emp.name} (${emp.employeeId})`}
                    >
                      <span>{emp.employeeId}</span>
                    </button>

                    {emp.companyEmployeeNumber && (
                      <span
                        onClick={e => handleCopy(emp.companyEmployeeNumber, 'Company Number', `${emp.id}-badge`, e)}
                        className="font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1 hover:border-slate-400 transition-colors"
                        title="Company Badge Number (Click to copy)"
                      >
                        <span>{emp.companyEmployeeNumber}</span>
                        {copiedKey === `${emp.id}-badge` ? (
                          <Check className="w-2.5 h-2.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-2.5 h-2.5 text-slate-400 opacity-60" />
                        )}
                      </span>
                    )}

                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {emp.department}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-slate-400 truncate max-w-[100px]">
                      {emp.team}
                    </span>

                    {emp.joiningDate && (
                      <>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-slate-500 dark:text-slate-400 inline-flex items-center gap-1 text-[10px]">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{formatDateDisplay(emp.joiningDate)}</span>
                        </span>
                      </>
                    )}
                  </div>

                  {/* Contact Strip: Email & Phone with 1-click Copy */}
                  <div className="grid grid-cols-2 gap-1.5 mb-2.5 text-[10px]">
                    <div
                      onClick={e => handleCopy(emp.email, 'Email', `${emp.id}-email`, e)}
                      className="p-1.5 rounded-md bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                      title="Click to copy email address"
                    >
                      <div className="flex items-center gap-1 min-w-0">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{emp.email}</span>
                      </div>
                      {copiedKey === `${emp.id}-email` ? (
                        <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                      ) : (
                        <Copy className="w-2.5 h-2.5 text-slate-400 shrink-0 opacity-50" />
                      )}
                    </div>

                    <div
                      onClick={e => handleCopy(emp.phone, 'Phone', `${emp.id}-phone`, e)}
                      className="p-1.5 rounded-md bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 transition-colors font-mono"
                      title="Click to copy phone number"
                    >
                      <div className="flex items-center gap-1 min-w-0">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{emp.phone}</span>
                      </div>
                      {copiedKey === `${emp.id}-phone` ? (
                        <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                      ) : (
                        <Copy className="w-2.5 h-2.5 text-slate-400 shrink-0 opacity-50" />
                      )}
                    </div>
                  </div>

                  {/* SECTION: ASSIGNED WORKSTATION / LAPTOP */}
                  <div className="p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-1.5 mb-2 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <Laptop className="w-3.5 h-3.5 text-indigo-500" />
                        Workstation
                      </span>
                      {comp ? (
                        <div className="flex items-center gap-1">
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.2 rounded border border-indigo-200/60 dark:border-indigo-800/60 text-[10px]">
                            {comp.assetNumber}
                          </span>
                          <ConditionBadge condition={comp.condition} size="sm" />
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Unassigned</span>
                      )}
                    </div>

                    {comp ? (
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white text-xs truncate">
                          {comp.deviceName} • {comp.manufacturer} {comp.model}
                        </div>
                        {/* Hardware Telemetry Chips (CPU, RAM, SSD, OS) */}
                        <div className="flex items-center gap-1 flex-wrap mt-1 text-[10px] font-mono">
                          {comp.processor?.name && (
                            <span className="px-1.5 py-0.5 rounded bg-white dark:bg-[#101726] border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <Cpu className="w-2.5 h-2.5 text-blue-500" />
                              <span className="truncate max-w-[90px]">{comp.processor.name}</span>
                            </span>
                          )}
                          {comp.memory?.installedRAM && (
                            <span className="px-1.5 py-0.5 rounded bg-white dark:bg-[#101726] border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                              {comp.memory.installedRAM} RAM
                            </span>
                          )}
                          {comp.storage?.total && (
                            <span className="px-1.5 py-0.5 rounded bg-white dark:bg-[#101726] border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <HardDrive className="w-2.5 h-2.5 text-amber-500" />
                              <span>{comp.storage.total}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic">
                        No workstation currently linked to this profile
                      </div>
                    )}
                  </div>

                  {/* SECTION: ASSIGNED MOBILE PHONE */}
                  {empPhones.length > 0 ? (
                    <div className="p-2 rounded-lg bg-pink-50/50 dark:bg-pink-950/20 border border-pink-200/50 dark:border-pink-900/40 space-y-1 mb-2 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1 font-semibold text-pink-700 dark:text-pink-300">
                          <Smartphone className="w-3.5 h-3.5 text-pink-500" />
                          <span>Mobile Device ({empPhones[0].assetNumber})</span>
                        </span>
                        <span className="font-mono text-[10px] text-pink-600 dark:text-pink-400 font-bold">
                          {empPhones[0].phoneNumber || 'No SIM'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400">
                        <span className="truncate font-medium">
                          {empPhones[0].brand} {empPhones[0].model}
                        </span>
                        {empPhones[0].imeiNumber && (
                          <span
                            onClick={e =>
                              handleCopy(empPhones[0].imeiNumber!, 'IMEI', `${emp.id}-imei`, e)
                            }
                            className="font-mono text-[10px] text-slate-500 dark:text-slate-400 hover:text-pink-600 flex items-center gap-1 cursor-pointer"
                            title="Click to copy IMEI"
                          >
                            <span>IMEI: {empPhones[0].imeiNumber.substring(0, 8)}...</span>
                            {copiedKey === `${emp.id}-imei` ? (
                              <Check className="w-2.5 h-2.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-2.5 h-2.5 opacity-50" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between mb-2">
                      <span className="flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-slate-400" />
                        <span>Mobile Phone: None Issued</span>
                      </span>
                    </div>
                  )}

                  {/* SECTION: COMPANY PERIPHERALS */}
                  <div className="flex items-center gap-1 flex-wrap text-[10px] text-slate-500 dark:text-slate-400 mb-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-blue-500" />
                      Peripherals ({empPeripherals.length}):
                    </span>
                    {empPeripherals.length === 0 ? (
                      <span className="text-slate-400 italic">None provisioned</span>
                    ) : (
                      empPeripherals.map(a => (
                        <span
                          key={a.id}
                          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[10px] border border-slate-200/60 dark:border-slate-700/60"
                        >
                          {a.assetType === 'Mouse' && '🖱️ '}
                          {a.assetType === 'Keyboard' && '⌨️ '}
                          {a.assetType === 'Headset' && '🎧 '}
                          {a.assetType === 'Monitor' && '🖥️ '}
                          {a.assetType}
                        </span>
                      ))
                    )}
                  </div>

                  {(() => {
                    const activeEmpSims = getEmployeeActiveSimCards(emp, simCards);
                    const cardSimExpense = calculateSimMonthlyExpense(activeEmpSims.length);
                    const usageBadge = getSimUsageBadgeStyle(empSims.length);
                    return (
                      <div className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 space-y-1.5 mb-2 text-xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1 font-semibold text-emerald-800 dark:text-emerald-300 flex-wrap">
                            <Signal className="w-3.5 h-3.5 text-emerald-500" />
                            <span className={`inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold border ${usageBadge.bg} ${usageBadge.text} ${usageBadge.border}`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-1 ${usageBadge.dotColor}`} />
                              {usageBadge.shortLabel}
                            </span>
                            {empSims.length > 0 && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300/40">
                                {formatINR(cardSimExpense.totalExpense)}/mo
                              </span>
                            )}
                          </span>

                          {userRole === 'admin' && (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setAssigningSimEmployeeId(emp.id);
                              }}
                              className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white dark:bg-[#101726] border border-emerald-300/60 dark:border-emerald-700/60 shadow-2xs hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="Assign SIM card to this employee"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>Assign SIM</span>
                            </button>
                          )}
                        </div>

                    {empSims.length > 0 ? (
                      <div className="space-y-1 mt-1">
                        {empSims.map(sim => (
                          <div
                            key={sim.id}
                            className="p-1.5 rounded-md bg-white dark:bg-[#101726] border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between text-[10px]"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-100 truncate">
                                {sim.contactNumber}
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold text-[9px]">
                                {sim.purpose}
                              </span>
                              {sim.project && (
                                <span className="text-slate-400 truncate max-w-[90px]">
                                  • {sim.project}
                                </span>
                              )}
                            </div>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                sim.status === 'Suspended'
                                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              }`}
                            >
                              {sim.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
                  })()}

                  {/* SECTION: SERVICE / MAINTENANCE HISTORY BADGE */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px]">
                    <span className="flex items-center gap-1 font-medium text-slate-500 dark:text-slate-400">
                      <Wrench className="w-3 h-3 text-amber-500" />
                      <span>Maintenance History:</span>
                    </span>
                    {empServices.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                          {empServices.length} {empServices.length === 1 ? 'ticket' : 'tickets'}
                        </span>
                        {latestService && (
                          <ServiceStatusBadge status={latestService.serviceStatus} size="sm" />
                        )}
                      </div>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ 0 Tickets (Healthy)
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer Action: View Full Profile & Quick Share */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold group-hover:text-blue-700 dark:group-hover:text-blue-300">
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Profile</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>

                  {userRole === 'admin' && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setSharingEmployee(emp);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/80 transition-colors cursor-pointer"
                      title="Share Employee Data (no login required)"
                    >
                      <Share2 className="w-3 h-3 text-indigo-500" />
                      <span>Share</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )
      )}

      {/* VIEW 2: HIGH-DENSITY ENTERPRISE TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-[#101726] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Employee</th>
                  <th className="py-2.5 px-3 font-semibold">Identifiers</th>
                  <th className="py-2.5 px-3 font-semibold">Role & Dept</th>
                  <th className="py-2.5 px-3 font-semibold">Workstation (Laptop/PC)</th>
                  <th className="py-2.5 px-3 font-semibold">SIM & Telecom Fleet</th>
                  <th className="py-2.5 px-3 font-semibold">Mobile Phone</th>
                  <th className="py-2.5 px-3 font-semibold">Peripherals</th>
                  <th className="py-2.5 px-3 font-semibold">Service History</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        <p className="font-semibold text-slate-700 dark:text-slate-300">
                          No employees matching current filter criteria
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Try adjusting search terms, department filters, or hardware status.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map(emp => {
                    const comp = computers.find(
                      c => c.assignedEmployeeId === emp.id || c.assignedEmployeeId === emp.employeeId
                    );
                    const empAssets = assets.filter(
                      a => a.assignedEmployeeId === emp.id || a.assignedEmployeeId === emp.employeeId
                    );
                    const empPhones = empAssets.filter(a => a.assetType === 'Mobile Phone');
                    const empPeripherals = empAssets.filter(a => a.assetType !== 'Mobile Phone');
                    const empSims = getEmployeeSimCards(emp, simCards);
                    const empServices = serviceRecords.filter(
                      s =>
                        s.employeeId === emp.employeeId ||
                        s.employeeId === emp.id ||
                        (comp && s.computerId === comp.id)
                    );
                    const latestService = empServices.length > 0 ? empServices[0] : null;

                    return (
                      <tr
                        key={emp.id}
                        onClick={() => onSelectEmployee(emp.id)}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      >
                        {/* 1. Employee Name, Avatar & Status */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <EmployeeAvatar
                              name={emp.name}
                              photoUrl={emp.photoUrl}
                              size="sm"
                              status={emp.status}
                              showStatusDot={true}
                            />
                            <div>
                              <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {emp.name}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Mail className="w-3 h-3 shrink-0" />
                                <span className="truncate max-w-[150px]">{emp.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Identifiers */}
                        <td className="py-2.5 px-3">
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20 inline-block">
                              {emp.employeeId}
                            </span>
                            {emp.companyEmployeeNumber && (
                              <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                                {emp.companyEmployeeNumber}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 3. Role & Dept */}
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                            {emp.designation}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {emp.department} • {emp.team}
                          </div>
                        </td>

                        {/* 4. Workstation (Laptop/PC) */}
                        <td className="py-2.5 px-3">
                          {comp ? (
                            <div>
                              <div className="flex items-center gap-1.5">
                                <Laptop className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                                  {comp.assetNumber}
                                </span>
                                <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                  {comp.deviceName}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                {comp.processor?.name ? `${comp.processor.name} • ` : ''}
                                {comp.memory?.installedRAM}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No workstation</span>
                          )}
                        </td>

                        {/* 4b. SIM & Telecom Fleet */}
                        <td className="py-2.5 px-3">
                          {empSims.length > 0 ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 text-xs">
                                <Signal className="w-3.5 h-3.5 shrink-0" />
                                <span className={`inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold border ${getSimUsageBadgeStyle(empSims.length).bg} ${getSimUsageBadgeStyle(empSims.length).text} ${getSimUsageBadgeStyle(empSims.length).border}`}>
                                  {getSimUsageBadgeStyle(empSims.length).shortLabel}
                                </span>
                              </div>
                              {empSims.slice(0, 2).map(s => (
                                <div key={s.id} className="text-[10px] font-mono flex items-center gap-1 text-slate-700 dark:text-slate-300">
                                  <span className="font-bold">{s.contactNumber}</span>
                                  <span className="px-1 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[9px] font-sans">
                                    {s.purpose}
                                  </span>
                                </div>
                              ))}
                              {empSims.length > 2 && (
                                <div className="text-[9px] text-slate-400 font-medium">
                                  +{empSims.length - 2} more SIM(s)
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] text-slate-400 italic">No SIMs</span>
                              {userRole === 'admin' && (
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setAssigningSimEmployeeId(emp.id);
                                  }}
                                  className="text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer hover:underline ml-1"
                                >
                                  + Assign
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                        {/* 5. Mobile Phone */}
                        <td className="py-2.5 px-3">
                          {empPhones.length > 0 ? (
                            <div>
                              <div className="flex items-center gap-1 font-semibold text-pink-600 dark:text-pink-400 text-xs">
                                <Smartphone className="w-3 h-3 shrink-0" />
                                <span>{empPhones[0].phoneNumber || empPhones[0].assetNumber}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                                {empPhones[0].brand} {empPhones[0].model}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No phone</span>
                          )}
                        </td>

                        {/* 6. Peripherals */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                              {empPeripherals.length}
                            </span>
                            <span className="text-[11px] text-slate-400">items</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                            {empPeripherals.map(p => p.assetType).join(', ') || 'None'}
                          </div>
                        </td>

                        {/* 7. Service History */}
                        <td className="py-2.5 px-3">
                          {empServices.length > 0 ? (
                            <div>
                              <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                                <Wrench className="w-3 h-3 text-amber-500 shrink-0" />
                                <span>{empServices.length} {empServices.length === 1 ? 'ticket' : 'tickets'}</span>
                              </div>
                              {latestService && (
                                <div className="mt-0.5">
                                  <ServiceStatusBadge status={latestService.serviceStatus} size="sm" />
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                              ✓ 0 Tickets
                            </span>
                          )}
                        </td>

                        {/* 8. Actions */}
                        <td className="py-2.5 px-3 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onSelectEmployee(emp.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors cursor-pointer"
                              title="View complete profile and full telemetry"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">Profile</span>
                            </button>

                            {userRole === 'admin' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setSharingEmployee(emp)}
                                  className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                                  title="Share employee data without login"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setEditingEmployeeId(emp.id)}
                                  className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="Edit employee"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>

                                {emp.status === 'Active' ? (
                                  <button
                                    type="button"
                                    onClick={() => setDeactivatingEmployeeId(emp.id)}
                                    className="p-1 rounded text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                                    title="Deactivate employee"
                                  >
                                    <UserX className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => reactivateEmployee(emp.id)}
                                    className="p-1 rounded text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                                    title="Restore employee"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setRemovingEmployeeId(emp.id)}
                                  className="p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                                  title="Remove employee"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Modals */}
      {editingEmployeeId && (
        <EditEmployeeModal
          isOpen={!!editingEmployeeId}
          onClose={() => setEditingEmployeeId(null)}
          employeeId={editingEmployeeId}
        />
      )}

      {deactivatingEmployeeId && (
        <DeactivateEmployeeModal
          isOpen={!!deactivatingEmployeeId}
          onClose={() => setDeactivatingEmployeeId(null)}
          employeeId={deactivatingEmployeeId}
        />
      )}

      {removingEmployeeId && (
        <RemoveEmployeeModal
          isOpen={!!removingEmployeeId}
          onClose={() => setRemovingEmployeeId(null)}
          employeeId={removingEmployeeId}
        />
      )}

      {showAddOnlyModal && (
        <AddEmployeeOnlyModal
          isOpen={showAddOnlyModal}
          onClose={() => setShowAddOnlyModal(false)}
        />
      )}

      {sharingEmployee && (
        <ShareEmployeeModal
          isOpen={!!sharingEmployee}
          onClose={() => setSharingEmployee(null)}
          employee={sharingEmployee}
          assignedComputer={computers.find(
            c => c.assignedEmployeeId === sharingEmployee.id || c.assignedEmployeeId === sharingEmployee.employeeId
          )}
          assignedAssets={assets.filter(
            a => a.assignedEmployeeId === sharingEmployee.id || a.assignedEmployeeId === sharingEmployee.employeeId
          )}
        />
      )}

      {/* Assign SIM Card Modal */}
      {assigningSimEmployeeId && (
        <AssignSimModal
          isOpen={!!assigningSimEmployeeId}
          onClose={() => setAssigningSimEmployeeId(null)}
          preselectedEmployeeId={assigningSimEmployeeId}
        />
      )}

      {/* Remove All Employees Confirmation Modal */}
      {showRemoveAllModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {removeAllStep === 1
                    ? 'Remove All Employee Data'
                    : 'Final Confirmation: Purge All Personnel'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {removeAllStep === 1
                    ? 'Step 1 of 2: Review personnel removal'
                    : 'Step 2 of 2: Hardware asset handling'}
                </p>
              </div>
            </div>

            {removeAllStep === 1 ? (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-800/40 text-amber-800 dark:text-amber-300">
                  <p className="font-semibold text-xs">
                    You are about to remove all {employees.length} employee record{employees.length > 1 ? 's' : ''}.
                  </p>
                  <p className="text-[11px] mt-1 text-amber-700/90 dark:text-amber-400/90">
                    This action will purge all registered personnel profiles from the system directory.
                  </p>
                </div>

                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Are you sure you want to remove all employee data? Click "Continue to Step 2" to configure hardware asset handling.
                </p>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRemoveAllModal(false);
                      setRemoveAllStep(1);
                    }}
                    className="px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setRemoveAllStep(2)}
                    className="px-3.5 py-1.5 font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Continue to Step 2</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-slate-600 dark:text-slate-300">
                  How should hardware currently assigned to these employees be handled?
                </p>

                <div className="space-y-2">
                  <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    returnAssetsOption
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}>
                    <input
                      type="radio"
                      name="assetOption"
                      checked={returnAssetsOption}
                      onChange={() => setReturnAssetsOption(true)}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-xs block text-emerald-700 dark:text-emerald-400">
                        Return Assigned Assets to Inventory (Recommended)
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        Workstations, laptops, phones & peripherals will be preserved with status set to "In Stock" (Available).
                      </span>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    !returnAssetsOption
                      ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}>
                    <input
                      type="radio"
                      name="assetOption"
                      checked={!returnAssetsOption}
                      onChange={() => setReturnAssetsOption(false)}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-xs block text-rose-600 dark:text-rose-400">
                        Permanently Delete Assigned Assets Too
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        Will delete all hardware units assigned to employees from the fleet database.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRemoveAllStep(1)}
                    className="px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      removeAllEmployees({ returnAssetsToInventory: returnAssetsOption });
                      setShowRemoveAllModal(false);
                      setRemoveAllStep(1);
                    }}
                    className="px-3.5 py-1.5 font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm & Remove All Employees</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
