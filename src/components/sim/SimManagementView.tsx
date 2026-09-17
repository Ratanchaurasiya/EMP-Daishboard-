import React, { useState, useMemo } from 'react';
import {
  Smartphone,
  CreditCard,
  Send,
  History,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  User,
  Building,
  RotateCcw,
  Edit2,
  Trash2,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  Tag,
  Calendar,
  Sparkles,
  ShieldCheck,
  Zap,
  Users,
  ChevronDown,
  ChevronUp,
  Layers,
  ExternalLink,
  Laptop,
  Monitor,
  Copy,
  Check,
  Eye,
  Pencil,
  X,
  UserMinus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SimCard, SimPurpose, SimStatus, SimType, SIM_PURPOSES, SIM_TYPES } from '../../types';
import {
  getSimPurposeStyle,
  getSimStatusStyle,
  getSimTypeBadgeStyle,
  formatINR,
  generateSimRequestWhatsAppUrl,
  generateSimSuspensionWhatsAppUrl,
  generateSimIssueWhatsAppUrl,
  getEmployeeSimCards,
  getEmployeeSimCount,
  getSimUsageCategory,
  getSimUsageBadgeStyle,
  SimUsageFilterType,
  calculateSimMonthlyExpense,
  isActiveAssignedSim,
  getActiveAssignedSimCards,
  getEmployeeActiveSimCards,
} from '../../utils/simUtils';
import { EmployeeAvatar } from '../common/EmployeeAvatar';
import { AddEditSimModal } from './AddEditSimModal';
import { SuspendSimModal } from './SuspendSimModal';
import { AddRechargeModal } from './AddRechargeModal';
import { RequestSimModal } from './RequestSimModal';
import { AssignSimModal } from './AssignSimModal';
import { EmployeeSimProfileModal } from './EmployeeSimProfileModal';

interface SimManagementViewProps {
  onSelectEmployee?: (employeeId: string) => void;
}

export const SimManagementView: React.FC<SimManagementViewProps> = ({ onSelectEmployee }) => {
  const {
    simCards,
    simRecharges,
    simRequests,
    auditLogs,
    employees,
    computers,
    assets,
    userRole,
    currentUser,
    setSelectedEmployeeId,
    reactivateSimCard,
    removeSimCard,
    assignSimCard,
    unassignSimCard,
    removeSimRecharge,
    updateSimRequestStatus,
    removeSimRequest,
    simManagementSubTab,
    setSimManagementSubTab,
    highlightedSimRequestId,
    setHighlightedSimRequestId,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'inventory' | 'recharges' | 'requests' | 'history'>(simManagementSubTab || 'inventory');

  // Sync with global subtab state if set from notifications or dashboard
  React.useEffect(() => {
    if (simManagementSubTab && simManagementSubTab !== activeTab) {
      setActiveTab(simManagementSubTab);
    }
  }, [simManagementSubTab]);

  const handleTabChange = (tab: 'inventory' | 'recharges' | 'requests' | 'history') => {
    setActiveTab(tab);
    setSimManagementSubTab(tab);
  };

  // Inventory & Fleet Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPurpose, setSelectedPurpose] = useState<string>('all');
  const [selectedSimType, setSelectedSimType] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [simUsageFilter, setSimUsageFilter] = useState<SimUsageFilterType>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');
  const [inventoryViewMode, setInventoryViewMode] = useState<'all-sims' | 'by-employee'>('all-sims');
  const [expandedEmployeeIds, setExpandedEmployeeIds] = useState<Set<string>>(() => new Set());
  const [expandAll, setExpandAll] = useState<boolean>(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, label: string, key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Copied ${label} to clipboard`, 'info');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenProfile = (empId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!empId) return;
    if (onSelectEmployee) {
      onSelectEmployee(empId);
    } else {
      setSelectedEmployeeId(empId);
    }
  };

  const isDateInRange = (dateStr?: string | null) => {
    if (selectedDateRange === 'all') return true;
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;
    const now = new Date();
    const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);

    switch (selectedDateRange) {
      case '30days':
        return diffDays >= 0 && diffDays <= 30;
      case '90days':
        return diffDays >= 0 && diffDays <= 90;
      case '180days':
        return diffDays >= 0 && diffDays <= 180;
      case 'this_year':
        return d.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedPurpose('all');
    setSelectedSimType('all');
    setSelectedProject('all');
    setSelectedEmployee('all');
    setSimUsageFilter('all');
    setSelectedDateRange('all');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedStatus !== 'all' ||
    selectedPurpose !== 'all' ||
    selectedSimType !== 'all' ||
    selectedProject !== 'all' ||
    selectedEmployee !== 'all' ||
    simUsageFilter !== 'all' ||
    selectedDateRange !== 'all';

  const activeFilterCount = [
    searchQuery !== '',
    selectedStatus !== 'all',
    selectedPurpose !== 'all',
    selectedSimType !== 'all',
    selectedProject !== 'all',
    selectedEmployee !== 'all',
    simUsageFilter !== 'all',
    selectedDateRange !== 'all',
  ].filter(Boolean).length;

  // Recharge Filters
  const [rechargeSearch, setRechargeSearch] = useState('');
  const [rechargeMonth, setRechargeMonth] = useState<string>('all');
  const [rechargeYear, setRechargeYear] = useState<string>('all');

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingSim, setEditingSim] = useState<SimCard | null>(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignModalSimId, setAssignModalSimId] = useState<string | null>(null);
  const [assignModalEmployeeId, setAssignModalEmployeeId] = useState<string | null>(null);

  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [suspendingSim, setSuspendingSim] = useState<SimCard | null>(null);

  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [rechargeTargetSim, setRechargeTargetSim] = useState<SimCard | null>(null);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestType, setRequestType] = useState<'Additional SIM' | 'Suspend SIM'>('Additional SIM');

  // Employee Telecom & SIM Profile Modal state
  const [profileModalEmployeeId, setProfileModalEmployeeId] = useState<string | null>(null);

  // Metrics calculation
  const totalSims = simCards.length;
  const activeSims = simCards.filter(s => s.status === 'Active' || s.status === 'Assigned').length;
  const suspendedSims = simCards.filter(s => s.status === 'Suspended').length;
  const availableSims = simCards.filter(s => s.status === 'Available').length;
  const pendingRequests = simRequests.filter(r => r.status === 'Pending').length;
  const utilizationRate = totalSims > 0 ? Math.round((activeSims / totalSims) * 100) : 0;

  const activeAssignedSimCards = useMemo(() => getActiveAssignedSimCards(simCards), [simCards]);
  const activeSimIds = useMemo(() => new Set(activeAssignedSimCards.map(s => s.id)), [activeAssignedSimCards]);

  const totalRechargeSpend = useMemo(() => {
    return simRecharges
      .filter(r => activeSimIds.has(r.simId))
      .reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
  }, [simRecharges, activeSimIds]);

  const totalGstClaimed = useMemo(() => {
    return simRecharges
      .filter(r => activeSimIds.has(r.simId))
      .reduce((sum, r) => sum + (Number(r.gstAmount) || 0), 0);
  }, [simRecharges, activeSimIds]);

  // Unique projects list
  const allProjects = useMemo(() => {
    const set = new Set<string>();
    simCards.forEach(s => {
      if (s.project && s.project.trim()) set.add(s.project.trim());
    });
    return Array.from(set).sort();
  }, [simCards]);

  // Project-wise SIM summary breakdown
  const projectWiseSummary = useMemo(() => {
    const map = new Map<string, {
      project: string;
      total: number;
      purposes: { [p: string]: number };
      active: number;
      suspended: number;
    }>();

    simCards.forEach(s => {
      const proj = (s.project || 'General / Unassigned').trim();
      let item = map.get(proj);
      if (!item) {
        item = { project: proj, total: 0, purposes: {}, active: 0, suspended: 0 };
        map.set(proj, item);
      }
      item.total += 1;
      item.purposes[s.purpose] = (item.purposes[s.purpose] || 0) + 1;
      if (s.status === 'Active' || s.status === 'Assigned') item.active += 1;
      if (s.status === 'Suspended') item.suspended += 1;
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [simCards]);

  // Pre-index assigned SIM cards per employee for fast lookup
  const employeeSimMap = useMemo(() => {
    const map = new Map<string, SimCard[]>();
    employees.forEach(emp => {
      map.set(emp.id, getEmployeeSimCards(emp, simCards));
    });
    return map;
  }, [employees, simCards]);

  // Helper to retrieve assigned Phone Device & Other Company Hardware for an Employee
  const getEmployeePhoneDevice = (empId?: string | null) => {
    if (!empId) return null;
    const empObj = employees.find(e => e.id === empId || e.employeeId === empId);
    if (!empObj) return null;
    return assets.find(
      a =>
        a.assetType === 'Mobile Phone' &&
        (a.assignedEmployeeId === empObj.id || a.assignedEmployeeId === empObj.employeeId)
    );
  };

  const getEmployeeHardwareAssets = (empId?: string | null) => {
    if (!empId) return { computer: null, otherAssetsCount: 0 };
    const empObj = employees.find(e => e.id === empId || e.employeeId === empId);
    if (!empObj) return { computer: null, otherAssetsCount: 0 };

    const computer = computers.find(
      c => c.assignedEmployeeId === empObj.id || c.assignedEmployeeId === empObj.employeeId
    );
    const otherAssets = assets.filter(
      a =>
        (a.assignedEmployeeId === empObj.id || a.assignedEmployeeId === empObj.employeeId) &&
        a.assetType !== 'Mobile Phone'
    );
    return { computer, otherAssetsCount: otherAssets.length };
  };

  // Bucket counts for SIM Usage Filter Bar
  const usageStats = useMemo(() => {
    let countAll = employees.length;
    let count1 = 0;
    let count2 = 0;
    let count3 = 0;
    let count4Plus = 0;
    let count0 = 0;

    employees.forEach(emp => {
      const sims = employeeSimMap.get(emp.id) || [];
      const count = sims.length;
      if (count === 0) count0++;
      else if (count === 1) count1++;
      else if (count === 2) count2++;
      else if (count === 3) count3++;
      else count4Plus++;
    });

    return {
      countAll,
      count1,
      count2,
      count3,
      count4Plus,
      count0,
    };
  }, [employees, employeeSimMap]);

  // Expand / collapse helper for employee cards
  const isEmployeeExpanded = (empId: string) => {
    if (expandAll) {
      return !expandedEmployeeIds.has(empId);
    }
    return expandedEmployeeIds.has(empId);
  };

  const toggleEmployeeExpand = (empId: string) => {
    setExpandedEmployeeIds(prev => {
      const next = new Set(prev);
      if (next.has(empId)) {
        next.delete(empId);
      } else {
        next.add(empId);
      }
      return next;
    });
  };

  const handleToggleExpandAll = () => {
    setExpandedEmployeeIds(new Set());
    setExpandAll(prev => !prev);
  };

  // Filtered employees list for "Group by Employee" view
  const filteredEmployeesWithSims = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return employees.filter(emp => {
      const sims = employeeSimMap.get(emp.id) || [];
      const count = sims.length;
      const category = getSimUsageCategory(count);

      // Usage Category Filter
      if (simUsageFilter !== 'all') {
        if (simUsageFilter === '3+') {
          if (count < 3) return false;
        } else if (category !== simUsageFilter) {
          return false;
        }
      }

      // Selected Employee Dropdown Filter
      if (selectedEmployee !== 'all' && emp.id !== selectedEmployee) {
        return false;
      }

      // Project Dropdown Filter
      if (selectedProject !== 'all') {
        const matchesProject = sims.some(
          s => s.project && s.project.trim().toLowerCase() === selectedProject.trim().toLowerCase()
        );
        if (!matchesProject) return false;
      }

      // Status Dropdown Filter
      if (selectedStatus !== 'all') {
        const matchesStatus = sims.some(s => s.status === selectedStatus);
        if (!matchesStatus) return false;
      }

      // Purpose Dropdown Filter
      if (selectedPurpose !== 'all') {
        const matchesPurpose = sims.some(s => s.purpose === selectedPurpose);
        if (!matchesPurpose) return false;
      }

      // SIM Type Dropdown Filter
      if (selectedSimType !== 'all') {
        const matchesType = sims.some(s => (s.simType || 'Prepaid') === selectedSimType);
        if (!matchesType) return false;
      }

      // Allocation Date Period Filter
      if (selectedDateRange !== 'all') {
        const matchesDate = sims.some(s => isDateInRange(s.assignedDate || s.issueDate || s.createdAt));
        if (!matchesDate && sims.length > 0) return false;
      }

      // Search Query Filter
      if (q) {
        const empMatch =
          emp.name.toLowerCase().includes(q) ||
          emp.employeeId.toLowerCase().includes(q) ||
          (emp.companyEmployeeNumber && emp.companyEmployeeNumber.toLowerCase().includes(q)) ||
          emp.department.toLowerCase().includes(q) ||
          emp.designation.toLowerCase().includes(q) ||
          emp.email.toLowerCase().includes(q) ||
          emp.phone.toLowerCase().includes(q);

        const simMatch = sims.some(
          s =>
            s.contactNumber.toLowerCase().includes(q) ||
            (s.simNumber && s.simNumber.toLowerCase().includes(q)) ||
            (s.carrier && s.carrier.toLowerCase().includes(q)) ||
            (s.project && s.project.toLowerCase().includes(q)) ||
            (s.purpose && s.purpose.toLowerCase().includes(q)) ||
            (s.simType && s.simType.toLowerCase().includes(q)) ||
            (s.remarks && s.remarks.toLowerCase().includes(q))
        );

        if (!empMatch && !simMatch) return false;
      }

      return true;
    });
  }, [
    employees,
    employeeSimMap,
    simUsageFilter,
    selectedEmployee,
    selectedProject,
    selectedStatus,
    selectedPurpose,
    selectedSimType,
    selectedDateRange,
    searchQuery,
  ]);

  // Filtered Inventory SIM list (for "All SIM Lines" table matrix view)
  const filteredSims = useMemo(() => {
    return simCards.filter(sim => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        sim.contactNumber.toLowerCase().includes(q) ||
        (sim.simNumber && sim.simNumber.toLowerCase().includes(q)) ||
        (sim.assignedEmployeeName && sim.assignedEmployeeName.toLowerCase().includes(q)) ||
        (sim.carrier && sim.carrier.toLowerCase().includes(q)) ||
        (sim.project && sim.project.toLowerCase().includes(q)) ||
        (sim.customPurpose && sim.customPurpose.toLowerCase().includes(q)) ||
        (sim.simType && sim.simType.toLowerCase().includes(q)) ||
        (sim.remarks && sim.remarks.toLowerCase().includes(q));

      const matchStatus = selectedStatus === 'all' || sim.status === selectedStatus;
      const matchPurpose = selectedPurpose === 'all' || sim.purpose === selectedPurpose;
      const matchSimType = selectedSimType === 'all' || (sim.simType || 'Prepaid') === selectedSimType;
      const matchProject = selectedProject === 'all' || (sim.project && sim.project.trim().toLowerCase() === selectedProject.trim().toLowerCase());
      const matchEmployee = selectedEmployee === 'all' || sim.assignedEmployeeId === selectedEmployee;
      const matchDate = isDateInRange(sim.assignedDate || sim.issueDate || sim.createdAt);

      if (!matchSearch || !matchStatus || !matchPurpose || !matchSimType || !matchProject || !matchEmployee || !matchDate) {
        return false;
      }

      // Apply SIM Usage Filter to table lines as well
      if (simUsageFilter !== 'all') {
        if (simUsageFilter === '0') {
          return false; // Employees with 0 SIMs don't have SIM lines
        }
        const emp = employees.find(
          e =>
            e.id === sim.assignedEmployeeId ||
            e.employeeId === sim.assignedEmployeeId ||
            (sim.assignedEmployeeName && e.name.toLowerCase() === sim.assignedEmployeeName.toLowerCase())
        );
        if (!emp) return false;
        const count = getEmployeeSimCount(emp, simCards);
        if (simUsageFilter === '3+') {
          if (count < 3) return false;
        } else {
          const cat = getSimUsageCategory(count);
          if (cat !== simUsageFilter) return false;
        }
      }

      return true;
    });
  }, [simCards, employees, searchQuery, selectedStatus, selectedPurpose, selectedProject, selectedEmployee, simUsageFilter, selectedDateRange]);

  // Filtered Recharge list
  const filteredRecharges = useMemo(() => {
    return simRecharges.filter(rec => {
      const q = rechargeSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        rec.contactNumber.toLowerCase().includes(q) ||
        (rec.employeeName && rec.employeeName.toLowerCase().includes(q)) ||
        (rec.project && rec.project.toLowerCase().includes(q)) ||
        (rec.planDescription && rec.planDescription.toLowerCase().includes(q)) ||
        (rec.referenceNumber && rec.referenceNumber.toLowerCase().includes(q));

      let matchDate = true;
      if (rec.rechargeDate) {
        const d = new Date(rec.rechargeDate);
        if (rechargeMonth !== 'all' && (d.getMonth() + 1).toString() !== rechargeMonth) {
          matchDate = false;
        }
        if (rechargeYear !== 'all' && d.getFullYear().toString() !== rechargeYear) {
          matchDate = false;
        }
      }

      return matchSearch && matchDate;
    });
  }, [simRecharges, rechargeSearch, rechargeMonth, rechargeYear]);

  // Filtered SIM Audit Logs
  const simAuditLogs = useMemo(() => {
    return auditLogs.filter(log => log.action.startsWith('SIM'));
  }, [auditLogs]);

  const isAdmin = userRole === 'admin';

  return (
    <div className="space-y-4 animate-fade-in">
      {/* 1. Header (Matching Workstation Fleet Matrix Layout) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-orange-500" />
            <span>SIM & Mobile Fleet Matrix</span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
              {filteredSims.length} Registered Lines
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Corporate mobile numbers, employee allocations, business purposes, mobile devices, and SIM telemetry
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setRequestType('Additional SIM');
              setIsRequestModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-orange-400" />
            <span>Request SIM</span>
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => {
                  setAssignModalSimId(null);
                  setIsAssignModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Assign SIM</span>
              </button>

              <button
                onClick={() => {
                  setRechargeTargetSim(null);
                  setIsRechargeModalOpen(true);
                }}
                title="Recharge Active Assigned SIMs (Excludes Buffer/Suspended/Inactive)"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Recharge All Assigned SIMs</span>
              </button>

              <button
                onClick={() => {
                  setEditingSim(null);
                  setIsAddEditModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add New SIM</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Fleet Telemetry Stat Cards (Matching Workstation Fleet Matrix Layout) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Total SIM Fleet</span>
            <Smartphone className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
            {totalSims}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            Corporate mobile SIM lines
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Active in Custody</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            {activeSims}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            {utilizationRate}% fleet deployment
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Available in Buffer</span>
            <Sparkles className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400 font-mono">
            {availableSims}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            Ready stock to assign
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Suspended / Pending</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 font-mono">
            {suspendedSims}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            {pendingRequests} pending requests
          </div>
        </div>
      </div>

      {/* Persistent Pending Action Banner */}
      {(suspendedSims > 0 || pendingRequests > 0) && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <span className="font-bold">Pending Telecom Actions Require Attention:</span>
              <span className="ml-1 text-[11px] text-slate-600 dark:text-amber-300/80">
                {suspendedSims > 0 && `${suspendedSims} SIM Card(s) suspended. `}
                {pendingRequests > 0 && `${pendingRequests} Requisition(s) pending approval.`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {pendingRequests > 0 && (
              <button
                onClick={() => setActiveTab('requests')}
                className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Review Requests ({pendingRequests})
              </button>
            )}
            {suspendedSims > 0 && (
              <button
                onClick={() => {
                  setActiveTab('inventory');
                  setSelectedStatus('Suspended');
                }}
                className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-800 dark:text-rose-200 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                View Suspended ({suspendedSims})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Subtab Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center justify-between overflow-x-auto text-xs">
        <div className="flex space-x-1">
          <button
            onClick={() => handleTabChange('inventory')}
            className={`px-3.5 py-2.5 font-semibold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'inventory'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-500/5'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>SIM Inventory & Allocation</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {simCards.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('recharges')}
            className={`px-3.5 py-2.5 font-semibold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'recharges'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-500/5'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Recharge Master & Expenditure</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {simRecharges.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('requests')}
            className={`px-3.5 py-2.5 font-semibold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'requests'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-500/5'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Requests & Approvals</span>
            {pendingRequests > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                {pendingRequests}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('history')}
            className={`px-3.5 py-2.5 font-semibold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-500/5'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Trail & History</span>
          </button>
        </div>
      </div>

      {/* ==================== TAB 1: INVENTORY & ALLOCATION ==================== */}
      {activeTab === 'inventory' && (
        <div className="space-y-3">
          {/* Project-wise SIM Usage Overview Cards */}
          {projectWiseSummary.length > 0 && (
            <div className="p-3 bg-white dark:bg-[#101726] rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-orange-500" />
                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                    Project-Wise SIM Allocation & Breakdown
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {projectWiseSummary.length} Project{projectWiseSummary.length > 1 ? 's' : ''} active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {projectWiseSummary.map(p => (
                  <div
                    key={p.project}
                    onClick={() => setSelectedProject(selectedProject === p.project ? 'all' : p.project)}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer text-xs ${
                      selectedProject === p.project
                        ? 'bg-orange-500/10 border-orange-500/50 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 dark:text-white truncate max-w-[170px]">
                        📁 {p.project}
                      </span>
                      <span className="font-mono font-bold px-1.5 py-0.5 rounded text-[10px] bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                        {p.total} SIM{p.total > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 text-[10px]">
                      {Object.entries(p.purposes).map(([purp, cnt]) => (
                        <span
                          key={purp}
                          className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                        >
                          {cnt} {purp}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. SIM Fleet Toolbar (Matching Workstation Fleet Matrix Toolbar) */}
          <div className="p-3 bg-white dark:bg-[#101726] rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* Quick Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search mobile, SIM no, employee, project, purpose..."
                  className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg pl-8 pr-7 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500 w-52 sm:w-72"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Employee / User Filter */}
              <select
                value={selectedEmployee}
                onChange={e => setSelectedEmployee(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-orange-500 max-w-[160px]"
              >
                <option value="all">All Employees & Users ({employees.length})</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employeeId || emp.companyEmployeeNumber})
                  </option>
                ))}
              </select>

              {/* SIM Status Filter */}
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-orange-500"
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Assigned">Assigned Only</option>
                <option value="Available">Available (Buffer Stock)</option>
                <option value="Suspended">Suspended / Blocked</option>
                <option value="Deactivated">Deactivated Only</option>
              </select>

              {/* SIM Purpose Filter */}
              <select
                value={selectedPurpose}
                onChange={e => setSelectedPurpose(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-orange-500"
              >
                <option value="all">All Purposes</option>
                {SIM_PURPOSES.map(p => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              {/* SIM Type Filter (Prepaid / Postpaid) */}
              <select
                value={selectedSimType}
                onChange={e => setSelectedSimType(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-orange-500"
              >
                <option value="all">All SIM Types</option>
                <option value="Prepaid">⚡ Prepaid Only</option>
                <option value="Postpaid">📜 Postpaid Only</option>
              </select>

              {/* Project Filter */}
              <select
                value={selectedProject}
                onChange={e => setSelectedProject(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-orange-500"
              >
                <option value="all">All Projects ({allProjects.length})</option>
                {allProjects.map(proj => (
                  <option key={proj} value={proj}>
                    {proj}
                  </option>
                ))}
              </select>

              {/* Number of SIMs Used Filter */}
              <select
                value={simUsageFilter}
                onChange={e => setSimUsageFilter(e.target.value as SimUsageFilterType)}
                className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-orange-500"
              >
                <option value="all">All SIM Counts ({usageStats.countAll})</option>
                <option value="1">1 SIM ({usageStats.count1})</option>
                <option value="2">2 SIMs ({usageStats.count2})</option>
                <option value="3">3 SIMs ({usageStats.count3})</option>
                <option value="3+">3+ SIMs ({usageStats.count3 + usageStats.count4Plus})</option>
                <option value="0">No SIM / 0 SIMs ({usageStats.count0})</option>
              </select>

              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="text-[11px] text-orange-600 dark:text-orange-400 hover:underline font-semibold px-2 py-1 cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Matrix View Toggle & Record Count */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-900 p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setInventoryViewMode('all-sims')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    inventoryViewMode === 'all-sims'
                      ? 'bg-orange-600 text-white shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="View clean matrix of all individual SIM lines"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>SIM Line Matrix</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInventoryViewMode('by-employee')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    inventoryViewMode === 'by-employee'
                      ? 'bg-orange-600 text-white shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Group SIM cards by employee"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>By Employee</span>
                </button>
              </div>

              <span className="text-[11px] text-slate-400 font-mono">
                Showing {filteredSims.length} of {simCards.length} lines
              </span>
            </div>
          </div>

          {/* DUAL VIEW RENDER: 'all-sims' (Clean Fleet Matrix Table) OR 'by-employee' */}
          {inventoryViewMode === 'all-sims' ? (
            /* ==================== VIEW 1: CLEAN SIM FLEET MATRIX TABLE ==================== */
            <div className="space-y-3">
              {/* Mobile Card Layout (Hidden on Desktop) */}
              <div className="md:hidden space-y-3">
                {filteredSims.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-[#101726] rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <Smartphone className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
                    <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">No SIM cards found</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  filteredSims.map(sim => {
                    const assignedEmp = employees.find(
                      e => e.id === sim.assignedEmployeeId || e.employeeId === sim.assignedEmployeeId || (sim.assignedEmployeeName && e.name.toLowerCase() === sim.assignedEmployeeName.toLowerCase())
                    );
                    const statusStyle = getSimStatusStyle(sim.status);
                    const purposeStyle = getSimPurposeStyle(sim.purpose);
                    const displayPurpose = sim.purpose === 'Other' && sim.customPurpose ? `Other: ${sim.customPurpose}` : sim.purpose;
                    const empPhoneAsset = getEmployeePhoneDevice(assignedEmp?.id);
                    const empSimCount = assignedEmp ? (employeeSimMap.get(assignedEmp.id)?.length || 0) : 0;

                    return (
                      <div
                        key={sim.id}
                        className="p-3.5 bg-white dark:bg-[#101726] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
                      >
                        {/* Header: SIM Number, ICCID, Badges */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center text-sm font-bold shrink-0">
                              <Phone className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                                  {sim.contactNumber}
                                </span>
                                <button
                                  type="button"
                                  onClick={e => handleCopy(sim.contactNumber, 'Phone Number', `mob-${sim.id}`, e)}
                                  className="p-0.5 rounded text-slate-400 hover:text-orange-500 cursor-pointer"
                                  title="Copy phone number"
                                >
                                  {copiedKey === `mob-${sim.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                              {sim.simNumber && (
                                <span className="text-[10px] font-mono text-slate-400 block">
                                  ICCID: {sim.simNumber}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${getSimTypeBadgeStyle(sim.simType).bg} ${getSimTypeBadgeStyle(sim.simType).text} ${getSimTypeBadgeStyle(sim.simType).border}`}>
                              {getSimTypeBadgeStyle(sim.simType).label}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${purposeStyle.bg} ${purposeStyle.text} ${purposeStyle.border}`}>
                              {displayPurpose}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                              {statusStyle.label}
                            </span>
                          </div>
                        </div>

                        {/* Custodian / Assigned User Box */}
                        <div
                          onClick={e => assignedEmp && handleOpenProfile(assignedEmp.id, e)}
                          className={`p-2 rounded-lg bg-slate-50 dark:bg-[#090d16] border border-slate-100 dark:border-slate-800/60 flex items-center justify-between ${
                            assignedEmp
                              ? 'cursor-pointer hover:border-orange-400 hover:bg-orange-50/20 transition-all'
                              : ''
                          }`}
                          title={
                            assignedEmp
                              ? `Click to open complete profile & assigned assets for ${assignedEmp.name}`
                              : undefined
                          }
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {assignedEmp ? (
                              <>
                                <EmployeeAvatar name={assignedEmp.name} photoUrl={assignedEmp.photoUrl} size="xs" />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white hover:text-orange-500 truncate block">
                                      {assignedEmp.name}
                                    </span>
                                    {empSimCount > 1 && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 shrink-0">
                                        {empSimCount} SIMs
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono block">
                                    {assignedEmp.employeeId} • {assignedEmp.department}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Available in IT Ready Stock Buffer</span>
                            )}
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </div>

                        {/* Details Box: Project, Mobile Device, Remarks */}
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#090d16] border border-slate-100 dark:border-slate-800/60 space-y-1 text-[10px]">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-medium">Assigned Project:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                              {sim.project ? `📁 ${sim.project}` : 'General / Unassigned'}
                            </span>
                          </div>
                          {empPhoneAsset && (
                            <div className="flex items-center justify-between pt-0.5 border-t border-slate-200/40 dark:border-slate-800">
                              <span className="text-slate-400 font-medium">Assigned Phone Hardware:</span>
                              <span className="font-semibold text-blue-600 dark:text-blue-400 font-mono">
                                📱 {empPhoneAsset.model || empPhoneAsset.deviceName || empPhoneAsset.brand || empPhoneAsset.assetNumber}
                              </span>
                            </div>
                          )}
                          {sim.carrier && (
                            <div className="flex items-center justify-between pt-0.5 border-t border-slate-200/40 dark:border-slate-800">
                              <span className="text-slate-400 font-medium">Telecom Carrier:</span>
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                {sim.carrier}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Touch Actions */}
                        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/60 flex-wrap">
                          {assignedEmp && (
                            <button
                              onClick={() => handleOpenProfile(assignedEmp.id)}
                              className="flex-1 py-1.5 px-2 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            >
                              <User className="w-3.5 h-3.5" />
                              <span>View Profile</span>
                            </button>
                          )}

                          {isAdmin && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingSim(sim);
                                  setIsAddEditModalOpen(true);
                                }}
                                className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>

                              <button
                                onClick={() => {
                                  setRechargeTargetSim(sim);
                                  setIsRechargeModalOpen(true);
                                }}
                                className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              >
                                <CreditCard className="w-3 h-3" />
                                <span>Recharge</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Desktop Matrix Table (Matching Workstation Fleet Matrix Table Styling) */}
              <div className="hidden md:block bg-white dark:bg-[#101726] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/70 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800 text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">SIM Number & ICCID</th>
                        <th className="py-2.5 px-4 font-semibold">Assigned User / Custodian</th>
                        <th className="py-2.5 px-4 font-semibold">Purpose & Use Case</th>
                        <th className="py-2.5 px-4 font-semibold">Assigned Project</th>
                        <th className="py-2.5 px-4 font-semibold">Assigned Mobile Device</th>
                        <th className="py-2.5 px-4 font-semibold">Other Hardware Assets</th>
                        <th className="py-2.5 px-4 font-semibold">Monthly Expense</th>
                        <th className="py-2.5 px-4 font-semibold">Status</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                      {filteredSims.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-slate-400">
                            <Smartphone className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p className="font-semibold text-xs">No SIM cards found matching filter criteria</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">Try resetting search or filters</p>
                          </td>
                        </tr>
                      ) : (
                        filteredSims.map(sim => {
                          const assignedEmp = employees.find(
                            e =>
                              e.id === sim.assignedEmployeeId ||
                              e.employeeId === sim.assignedEmployeeId ||
                              (sim.assignedEmployeeName && e.name.toLowerCase() === sim.assignedEmployeeName.toLowerCase())
                          );
                          const statusStyle = getSimStatusStyle(sim.status);
                          const purposeStyle = getSimPurposeStyle(sim.purpose);
                          const displayPurpose =
                            sim.purpose === 'Other' && sim.customPurpose
                              ? `Other: ${sim.customPurpose}`
                              : sim.purpose;
                          const empPhoneAsset = getEmployeePhoneDevice(assignedEmp?.id);
                          const empHardware = getEmployeeHardwareAssets(assignedEmp?.id);
                          const empSimCount = assignedEmp ? (employeeSimMap.get(assignedEmp.id)?.length || 0) : 0;
                          const monthlyCost = assignedEmp ? calculateSimMonthlyExpense(1) : null;

                          return (
                            <tr key={sim.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                              {/* 1. SIM Number & ICCID */}
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs shrink-0">
                                    <Phone className="w-3.5 h-3.5" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                                        {sim.contactNumber}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={e => handleCopy(sim.contactNumber, 'Phone Number', `mob-${sim.id}`, e)}
                                        className="p-0.5 rounded text-slate-400 hover:text-orange-500 cursor-pointer"
                                        title="Copy phone number"
                                      >
                                        {copiedKey === `mob-${sim.id}` ? (
                                          <Check className="w-3 h-3 text-emerald-500" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </button>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      {sim.simNumber && (
                                        <span className="text-[10px] font-mono text-slate-400">
                                          ICCID: {sim.simNumber}
                                        </span>
                                      )}
                                      {sim.carrier && (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                          {sim.carrier}
                                        </span>
                                      )}
                                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${getSimTypeBadgeStyle(sim.simType).bg} ${getSimTypeBadgeStyle(sim.simType).text} ${getSimTypeBadgeStyle(sim.simType).border}`}>
                                        {getSimTypeBadgeStyle(sim.simType).label}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* 2. Assigned User / Custodian */}
                              <td className="py-3 px-4">
                                {assignedEmp ? (
                                  <div
                                    onClick={e => handleOpenProfile(assignedEmp.id, e)}
                                    className="flex items-center gap-2 cursor-pointer group"
                                    title={`Click to open complete profile for ${assignedEmp.name}`}
                                  >
                                    <EmployeeAvatar name={assignedEmp.name} photoUrl={assignedEmp.photoUrl} size="xs" />
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-orange-500 transition-colors truncate">
                                          {assignedEmp.name}
                                        </span>
                                        {empSimCount > 1 && (
                                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 shrink-0">
                                            {empSimCount} SIMs
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1 mt-0.5">
                                        <span className="text-[10px] font-mono font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-1 py-0.2 rounded">
                                          {assignedEmp.employeeId}
                                        </span>
                                        <span className="text-[10px] text-slate-400 truncate">
                                          • {assignedEmp.department}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">Available Buffer Stock</span>
                                )}
                              </td>

                              {/* 3. Purpose & Use Case */}
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${purposeStyle.bg} ${purposeStyle.text} ${purposeStyle.border}`}>
                                  {displayPurpose}
                                </span>
                              </td>

                              {/* 4. Assigned Project */}
                              <td className="py-3 px-4">
                                {sim.project ? (
                                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px] border border-slate-200/60 dark:border-slate-700/60">
                                    📁 {sim.project}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-xs">—</span>
                                )}
                              </td>

                              {/* 5. Assigned Mobile Device */}
                              <td className="py-3 px-4">
                                {empPhoneAsset ? (
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <Smartphone className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                    <div>
                                      <span className="font-semibold text-slate-900 dark:text-white block leading-tight">
                                        {empPhoneAsset.model || empPhoneAsset.deviceName || empPhoneAsset.brand || 'Smartphone'}
                                      </span>
                                      <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 block">
                                        {empPhoneAsset.assetNumber}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-slate-400 italic">No Device Assigned</span>
                                )}
                              </td>

                              {/* 6. Other Hardware Assets */}
                              <td className="py-3 px-4">
                                {empHardware.computer ? (
                                  <div className="flex items-center gap-1.5 text-[11px]">
                                    <Laptop className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                      {empHardware.computer.assetNumber}
                                    </span>
                                    {empHardware.otherAssetsCount > 0 && (
                                      <span className="text-[10px] text-slate-400 font-medium">
                                        +{empHardware.otherAssetsCount} items
                                      </span>
                                    )}
                                  </div>
                                ) : empHardware.otherAssetsCount > 0 ? (
                                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                                    {empHardware.otherAssetsCount} Peripheral Asset(s)
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-400">—</span>
                                )}
                              </td>

                              {/* 7. Monthly Expense */}
                              <td className="py-3 px-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                                {monthlyCost ? (
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                    {formatINR(monthlyCost.totalExpense)}/mo
                                  </span>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>

                              {/* 8. Status */}
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                  <span className="w-1.5 h-1.5 rounded-full mr-1 bg-current" />
                                  {statusStyle.label}
                                </span>
                              </td>

                              {/* 9. Actions */}
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {/* View Profile */}
                                  {assignedEmp && (
                                    <button
                                      onClick={() => handleOpenProfile(assignedEmp.id)}
                                      className="p-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 transition-colors cursor-pointer"
                                      title={`View full profile & assets for ${assignedEmp.name}`}
                                    >
                                      <User className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {/* Reassign / Assign */}
                                  {isAdmin && (
                                    <button
                                      onClick={() => {
                                        setAssignModalSimId(sim.id);
                                        setAssignModalEmployeeId(null);
                                        setIsAssignModalOpen(true);
                                      }}
                                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                                      title="Reassign or Assign SIM"
                                    >
                                      <UserMinus className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {/* Log Recharge */}
                                  {isAdmin && (
                                    <button
                                      onClick={() => {
                                        setRechargeTargetSim(sim);
                                        setIsRechargeModalOpen(true);
                                      }}
                                      className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                                      title="Log SIM Recharge"
                                    >
                                      <CreditCard className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {/* Suspend / Reactivate */}
                                  {isAdmin && sim.status !== 'Suspended' ? (
                                    <button
                                      onClick={() => {
                                        setSuspendingSim(sim);
                                        setIsSuspendModalOpen(true);
                                      }}
                                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                                      title="Suspend SIM line"
                                    >
                                      <AlertTriangle className="w-3.5 h-3.5" />
                                    </button>
                                  ) : isAdmin && sim.status === 'Suspended' ? (
                                    <button
                                      onClick={() => reactivateSimCard(sim.id)}
                                      className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                                      title="Reactivate SIM line"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                  ) : null}

                                  {/* WhatsApp Share */}
                                  <button
                                    onClick={() => {
                                      const waUrl = sim.status === 'Suspended'
                                        ? generateSimSuspensionWhatsAppUrl(sim, sim.suspensionReason || 'Suspended')
                                        : `https://wa.me/?text=${encodeURIComponent(`📱 *AssetCore SIM Allocation*\nNumber: ${sim.contactNumber}\nAssigned: ${sim.assignedEmployeeName || 'Fleet'}\nPurpose: ${sim.purpose}`)}`;
                                      window.open(waUrl, '_blank', 'noopener,noreferrer');
                                    }}
                                    className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                                    title="Share allocation details via WhatsApp"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Edit SIM */}
                                  {isAdmin && (
                                    <button
                                      onClick={() => {
                                        setEditingSim(sim);
                                        setIsAddEditModalOpen(true);
                                      }}
                                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                                      title="Edit SIM specs"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {/* Delete SIM */}
                                  {isAdmin && (
                                    <button
                                      onClick={() => {
                                        if (window.confirm(`Are you sure you want to permanently delete SIM ${sim.contactNumber}?`)) {
                                          removeSimCard(sim.id);
                                        }
                                      }}
                                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                                      title="Delete SIM record"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
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
            </div>
          ) : (
            /* ==================== VIEW 2: GROUP BY EMPLOYEE ==================== */
            <div className="space-y-3">
              {filteredEmployeesWithSims.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-[#101726] rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <Users className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
                  <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">No employees found matching filter</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Try adjusting your search or filters</p>
                </div>
              ) : (
                filteredEmployeesWithSims.map(emp => {
                  const empSims = employeeSimMap.get(emp.id) || [];
                  const activeEmpSims = getEmployeeActiveSimCards(emp, simCards);
                  const simCount = empSims.length;
                  const usageStyle = getSimUsageBadgeStyle(simCount);
                  const isExpanded = isEmployeeExpanded(emp.id);
                  const monthlyExpense = calculateSimMonthlyExpense(activeEmpSims.length);
                  const empPhoneAsset = getEmployeePhoneDevice(emp.id);
                  const empHardware = getEmployeeHardwareAssets(emp.id);

                  return (
                    <div
                      key={emp.id}
                      className="rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs transition-all"
                    >
                      {/* Employee Card Header */}
                      <div
                        onClick={() => toggleEmployeeExpand(emp.id)}
                        className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-100/60 dark:hover:bg-slate-900/60 transition-colors"
                      >
                        {/* Identity */}
                        <div className="flex items-center gap-3 min-w-0">
                          <EmployeeAvatar name={emp.name} photoUrl={emp.photoUrl} size="sm" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4
                                onClick={e => handleOpenProfile(emp.id, e)}
                                className="text-sm font-bold text-slate-900 dark:text-white hover:text-orange-500 transition-colors truncate cursor-pointer"
                                title={`Click to open complete profile for ${emp.name}`}
                              >
                                {emp.name}
                              </h4>
                              <span className="font-mono text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-1.5 py-0.2 rounded border border-orange-500/20">
                                {emp.employeeId}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-bold border ${usageStyle.bg} ${usageStyle.text} ${usageStyle.border}`}>
                                {usageStyle.label}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                              <span>{emp.designation || 'Staff'}</span>
                              <span className="mx-1">•</span>
                              <span>{emp.department}</span>
                              {empPhoneAsset && (
                                <>
                                  <span className="mx-1">•</span>
                                  <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                                    📱 {empPhoneAsset.model || empPhoneAsset.deviceName || empPhoneAsset.brand || empPhoneAsset.assetNumber}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between md:justify-end gap-2 shrink-0">
                          {simCount > 0 && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              {formatINR(monthlyExpense.totalExpense)}/mo
                            </span>
                          )}

                          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleOpenProfile(emp.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                              title={`Open complete profile for ${emp.name}`}
                            >
                              <User className="w-3.5 h-3.5" />
                              <span>View Profile</span>
                            </button>

                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => {
                                  setAssignModalSimId(null);
                                  setAssignModalEmployeeId(emp.id);
                                  setIsAssignModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                title={`Assign SIM to ${emp.name}`}
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Assign SIM</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => toggleEmployeeExpand(emp.id)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-orange-500" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Section: All Assigned SIMs */}
                      {isExpanded && (
                        <div className="border-t border-slate-200/80 dark:border-slate-800/80 p-3.5 bg-slate-50/30 dark:bg-slate-900/20">
                          {simCount === 0 ? (
                            <div className="py-4 px-3 rounded-lg bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 text-center space-y-1 text-xs">
                              <p className="font-semibold text-slate-600 dark:text-slate-400">
                                No corporate SIM cards currently assigned to {emp.name}
                              </p>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAssignModalSimId(null);
                                    setAssignModalEmployeeId(emp.id);
                                    setIsAssignModalOpen(true);
                                  }}
                                  className="mt-1 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Assign SIM to {emp.name}</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="overflow-x-auto rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#101726]">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-slate-50/70 dark:bg-slate-900/50 text-[11px] uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                                    <tr>
                                      <th className="px-3 py-2 font-semibold">Mobile Number</th>
                                      <th className="px-3 py-2 font-semibold">Carrier</th>
                                      <th className="px-3 py-2 font-semibold">Purpose</th>
                                      <th className="px-3 py-2 font-semibold">Project</th>
                                      <th className="px-3 py-2 font-semibold">Status</th>
                                      <th className="px-3 py-2 font-semibold">Allocation Date</th>
                                      <th className="px-3 py-2 font-semibold text-right">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                                    {empSims.map(sim => {
                                      const statusStyle = getSimStatusStyle(sim.status);
                                      const purposeStyle = getSimPurposeStyle(sim.purpose);
                                      const displayPurpose =
                                        sim.purpose === 'Other' && sim.customPurpose
                                          ? `Other: ${sim.customPurpose}`
                                          : sim.purpose;

                                      return (
                                        <tr key={sim.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                                          <td className="px-3 py-2.5">
                                            <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                                              {sim.contactNumber}
                                            </span>
                                          </td>
                                          <td className="px-3 py-2.5 font-semibold text-slate-700 dark:text-slate-300">
                                            {sim.carrier || 'Standard'}
                                          </td>
                                          <td className="px-3 py-2.5">
                                            <span className={`inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-semibold border ${purposeStyle.bg} ${purposeStyle.text} ${purposeStyle.border}`}>
                                              {displayPurpose}
                                            </span>
                                          </td>
                                          <td className="px-3 py-2.5">
                                            {sim.project ? (
                                              <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold">
                                                📁 {sim.project}
                                              </span>
                                            ) : (
                                              <span className="text-slate-400">—</span>
                                            )}
                                          </td>
                                          <td className="px-3 py-2.5">
                                            <span className={`inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                              {statusStyle.label}
                                            </span>
                                          </td>
                                          <td className="px-3 py-2.5 font-mono text-slate-500 text-[11px]">
                                            {sim.issueDate || sim.assignedDate || 'N/A'}
                                          </td>
                                          <td className="px-3 py-2.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                              {isAdmin && (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setRechargeTargetSim(sim);
                                                    setIsRechargeModalOpen(true);
                                                  }}
                                                  className="p-1 rounded text-slate-400 hover:text-emerald-500 cursor-pointer"
                                                  title="Log Recharge"
                                                >
                                                  <CreditCard className="w-3.5 h-3.5" />
                                                </button>
                                              )}

                                              {isAdmin && (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    if (
                                                      window.confirm(
                                                        `Release SIM ${sim.contactNumber} from ${emp.name} back to Available buffer stock?`
                                                      )
                                                    ) {
                                                      unassignSimCard(
                                                        sim.id,
                                                        `Released from ${emp.name} via SIM Master`
                                                      );
                                                    }
                                                  }}
                                                  className="p-1 rounded text-slate-400 hover:text-amber-500 cursor-pointer"
                                                  title="Release SIM"
                                                >
                                                  <RotateCcw className="w-3.5 h-3.5" />
                                                </button>
                                              )}

                                              {isAdmin && (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setEditingSim(sim);
                                                    setIsAddEditModalOpen(true);
                                                  }}
                                                  className="p-1 rounded text-slate-400 hover:text-orange-500 cursor-pointer"
                                                  title="Edit SIM"
                                                >
                                                  <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 2: RECHARGE MASTER & EXPENDITURE ==================== */}
      {activeTab === 'recharges' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Gross Recharge Expenditure</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatINR(totalRechargeSpend)}
                </span>
                <CreditCard className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Total across all {simRecharges.length} logged invoices</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total GST Input Claimed</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                  {formatINR(totalGstClaimed)}
                </span>
                <Tag className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">18% standard corporate tax credit</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active Fleet Subscriptions</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xl font-bold text-orange-600 dark:text-orange-400 font-mono">
                  {activeSims} Active Lines
                </span>
                <Smartphone className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Recurring monthly mobile fleet</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="p-3 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search recharge by phone, employee, project..."
                  value={rechargeSearch}
                  onChange={e => setRechargeSearch(e.target.value)}
                  className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg pl-8 pr-7 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500 w-52 sm:w-72"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={rechargeMonth}
                  onChange={e => setRechargeMonth(e.target.value)}
                  className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300"
                >
                  <option value="all">All Months</option>
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>

                <select
                  value={rechargeYear}
                  onChange={e => setRechargeYear(e.target.value)}
                  className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300"
                >
                  <option value="all">All Years</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Date</th>
                    <th className="py-2.5 px-4 font-semibold">Contact Number</th>
                    <th className="py-2.5 px-4 font-semibold">Employee / Project</th>
                    <th className="py-2.5 px-4 font-semibold">Plan Description</th>
                    <th className="py-2.5 px-4 font-semibold">Base Cost</th>
                    <th className="py-2.5 px-4 font-semibold">GST (18%)</th>
                    <th className="py-2.5 px-4 font-semibold">Total Amount</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                  {filteredRecharges.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No recharge records found.
                      </td>
                    </tr>
                  ) : (
                    filteredRecharges.map(rec => (
                      <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <td className="py-2.5 px-4 font-mono text-slate-500 text-[11px]">
                          {rec.rechargeDate}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {rec.contactNumber}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            {rec.employeeName || 'Corporate Fleet'}
                          </span>
                          {rec.project && (
                            <span className="text-[10px] text-slate-400">📁 {rec.project}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 max-w-[180px] truncate" title={rec.planDescription || ''}>
                          {rec.planDescription || 'Monthly Unlimited Plan'}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                          {formatINR(rec.rechargeAmount || 0)}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-blue-600 dark:text-blue-400">
                          {formatINR(rec.gstAmount || 0)}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatINR(rec.totalAmount)}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {isAdmin && (
                            <button
                              onClick={() => {
                                if (window.confirm('Delete this recharge invoice log?')) {
                                  removeSimRecharge(rec.id);
                                }
                              }}
                              className="p-1 rounded text-slate-400 hover:text-rose-500 cursor-pointer"
                              title="Delete recharge record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: REQUESTS & APPROVALS ==================== */}
      {activeTab === 'requests' && (
        <div className="bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">SIM Requisitions & Approvals</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Track and authorize employee requests for additional SIM cards or line suspensions</p>
            </div>
            <button
              onClick={() => {
                setRequestType('Additional SIM');
                setIsRequestModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold cursor-pointer"
            >
              + Submit New Request
            </button>
          </div>

          <div className="space-y-2">
            {simRequests.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No SIM requests logged.</p>
            ) : (
              simRequests.map(reqItem => (
                <div
                  key={reqItem.id}
                  className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    highlightedSimRequestId === reqItem.id
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500/50'
                      : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {reqItem.employeeName} ({reqItem.employeeId})
                      </span>
                      <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                        {reqItem.requestType}
                      </span>
                      {reqItem.simType && (
                        <span className={`px-2 py-0.2 rounded text-[10px] font-bold border ${getSimTypeBadgeStyle(reqItem.simType).bg} ${getSimTypeBadgeStyle(reqItem.simType).text} ${getSimTypeBadgeStyle(reqItem.simType).border}`}>
                          {getSimTypeBadgeStyle(reqItem.simType).label}
                        </span>
                      )}
                      <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Status: {reqItem.status}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                      Project: {reqItem.project || 'General'} • Purpose: {reqItem.purpose || 'Official Use'} • Reason: {reqItem.reason}
                    </p>
                    <span className="text-[10px] font-mono text-slate-400">
                      Requested on: {reqItem.createdAt}
                    </span>
                  </div>

                  {isAdmin && reqItem.status === 'Pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          updateSimRequestStatus(reqItem.id, 'Approved', 'Approved by IT Admin');
                          if (reqItem.requestType === 'Additional SIM') {
                            setAssignModalEmployeeId(reqItem.employeeId);
                            setIsAssignModalOpen(true);
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                      >
                        Approve & Allocate SIM
                      </button>
                      <button
                        onClick={() => updateSimRequestStatus(reqItem.id, 'Rejected', 'Rejected by IT Admin')}
                        className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 4: AUDIT TRAIL & HISTORY ==================== */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs p-4 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-800">
            <History className="w-4 h-4 text-orange-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Telecom Audit Log</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Chronological history of SIM assignments, suspensions, and modifications</p>
            </div>
          </div>

          <div className="space-y-2">
            {simAuditLogs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No SIM audit logs recorded.</p>
            ) : (
              simAuditLogs.map(log => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-lg bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-orange-600 dark:text-orange-400">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">By: {log.actor}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">{log.details}</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {new Date(log.timestamp).toLocaleString('en-IN')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* All Modal Components */}
      <AddEditSimModal
        isOpen={isAddEditModalOpen}
        onClose={() => {
          setIsAddEditModalOpen(false);
          setEditingSim(null);
        }}
        editSim={editingSim}
      />

      <SuspendSimModal
        isOpen={isSuspendModalOpen}
        onClose={() => {
          setIsSuspendModalOpen(false);
          setSuspendingSim(null);
        }}
        sim={suspendingSim}
      />

      <AddRechargeModal
        isOpen={isRechargeModalOpen}
        onClose={() => {
          setIsRechargeModalOpen(false);
          setRechargeTargetSim(null);
        }}
        preselectedSim={rechargeTargetSim}
      />

      <RequestSimModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        defaultType={requestType}
      />

      <AssignSimModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setAssignModalSimId(null);
          setAssignModalEmployeeId(null);
        }}
        preselectedSimId={assignModalSimId || undefined}
        preselectedEmployeeId={assignModalEmployeeId || undefined}
      />

      <EmployeeSimProfileModal
        isOpen={!!profileModalEmployeeId}
        onClose={() => setProfileModalEmployeeId(null)}
        employeeId={profileModalEmployeeId}
        onAssignSim={empId => {
          setAssignModalSimId(null);
          setAssignModalEmployeeId(empId);
          setIsAssignModalOpen(true);
        }}
        onRechargeSim={sim => {
          setRechargeTargetSim(sim);
          setIsRechargeModalOpen(true);
        }}
        onSuspendSim={sim => {
          setSuspendingSim(sim);
          setIsSuspendModalOpen(true);
        }}
        onReassignSim={simId => {
          setAssignModalSimId(simId);
          setAssignModalEmployeeId(null);
          setIsAssignModalOpen(true);
        }}
        onEditSim={sim => {
          setEditingSim(sim);
          setIsAddEditModalOpen(true);
        }}
        onOpenFullProfile={empId => {
          handleOpenProfile(empId);
        }}
      />
    </div>
  );
};
