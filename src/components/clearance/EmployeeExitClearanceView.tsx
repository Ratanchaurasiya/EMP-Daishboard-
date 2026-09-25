import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ExitClearanceRecord,
  ExitClearanceAssetItem,
  ExitClearanceStatus,
} from '../../types';
import { formatDateDisplay, formatCurrency } from '../../utils/formatters';
import {
  UserX,
  Search,
  Filter,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Laptop,
  Smartphone,
  Headphones,
  Wrench,
  Trash2,
  Printer,
  History,
  Info,
  Building2,
  ExternalLink,
  Eye,
  Camera,
  Check,
  ArrowRight,
  ShieldAlert,
  FileText,
  X,
} from 'lucide-react';
import { EmployeeAvatar } from '../common/EmployeeAvatar';
import { InitiateExitClearanceModal } from './InitiateExitClearanceModal';
import { AssetInspectionModal } from './AssetInspectionModal';
import { ClearanceCertificateModal } from './ClearanceCertificateModal';
import { SubmitExitRequestModal } from './SubmitExitRequestModal';
import { ReviewExitRequestModal } from './ReviewExitRequestModal';
import { EmployeeExitStatusCard } from './EmployeeExitStatusCard';
import { ExitRequestsAdminView } from './ExitRequestsAdminView';
import { ExitHistoryView } from './ExitHistoryView';

interface EmployeeExitClearanceViewProps {
  onSelectEmployee?: (empId: string) => void;
}

export const EmployeeExitClearanceView: React.FC<EmployeeExitClearanceViewProps> = ({
  onSelectEmployee,
}) => {
  const {
    exitClearances,
    updateExitClearanceAsset,
    approveFinalExitClearance,
    deleteExitClearance,
    userRole,
    currentUser,
    setSelectedEmployeeId,
    setActiveTab,
  } = useApp();

  const isAdmin = userRole === 'admin' && currentUser?.role !== 'employee';
  const isEmployee = currentUser?.role === 'employee' || userRole === 'employee';

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [exitTypeFilter, setExitTypeFilter] = useState<string>('All');
  const [expandedClearanceIds, setExpandedClearanceIds] = useState<Set<string>>(new Set());
  const [expandedAuditIds, setExpandedAuditIds] = useState<Set<string>>(new Set());
  // Top Section Tabs (for Admin)
  const [mainTab, setMainTab] = useState<'requests' | 'active_clearances' | 'history'>('requests');
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [reviewingClearance, setReviewingClearance] = useState<ExitClearanceRecord | null>(null);

  // Modal States
  const [showInitiateModal, setShowInitiateModal] = useState<boolean>(false);
  const [inspectingItem, setInspectingItem] = useState<{
    item: ExitClearanceAssetItem;
    clearanceId: string;
  } | null>(null);
  const [certificateRecord, setCertificateRecord] = useState<ExitClearanceRecord | null>(null);
  const [activePhotoPreview, setActivePhotoPreview] = useState<string | null>(null);

  // Employee's active clearance
  const myClearance = useMemo(() => {
    if (!isEmployee) return null;
    const empId = (currentUser?.id || '').toLowerCase();
    const empCode = (currentUser?.employeeId || '').toLowerCase();
    const empEmail = (currentUser?.email || '').toLowerCase();
    return (
      exitClearances.find(
        c =>
          c.employeeId.toLowerCase() === empId ||
          c.employeeId.toLowerCase() === empCode ||
          (c.employeeEmail && c.employeeEmail.toLowerCase() === empEmail)
      ) || null
    );
  }, [exitClearances, isEmployee, currentUser]);

  const pendingRequestsCount = useMemo(() => {
    return exitClearances.filter(
      c => c.exitRequest && (c.exitRequest.status === 'Pending' || c.exitRequest.status === 'Under Review')
    ).length;
  }, [exitClearances]);

  // Toggle card expansion
  const toggleExpand = (id: string) => {
    setExpandedClearanceIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAudit = (id: string) => {
    setExpandedAuditIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filtered clearances
  const filteredClearances = useMemo(() => {
    return exitClearances.filter(clr => {
      // Role scope: Employee sees ONLY their own record
      if (isEmployee) {
        const empId = (currentUser?.id || '').toLowerCase();
        const empCode = (currentUser?.employeeId || '').toLowerCase();
        const empEmail = (currentUser?.email || '').toLowerCase();
        const matchEmp =
          clr.employeeId.toLowerCase() === empId ||
          clr.employeeId.toLowerCase() === empCode ||
          (clr.employeeEmail && clr.employeeEmail.toLowerCase() === empEmail);
        if (!matchEmp) return false;
      }

      if (statusFilter !== 'All' && clr.status !== statusFilter) return false;
      if (exitTypeFilter !== 'All' && clr.exitType !== exitTypeFilter) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        clr.employeeName.toLowerCase().includes(q) ||
        clr.employeeId.toLowerCase().includes(q) ||
        (clr.companyEmployeeNumber && clr.companyEmployeeNumber.toLowerCase().includes(q)) ||
        clr.department.toLowerCase().includes(q) ||
        clr.items.some(
          i =>
            i.assetNumber.toLowerCase().includes(q) ||
            i.deviceName.toLowerCase().includes(q)
        )
      );
    });
  }, [exitClearances, searchQuery, statusFilter, exitTypeFilter, isEmployee, currentUser]);

  // Executive KPI Metrics
  const stats = useMemo(() => {
    const totalActive = exitClearances.filter(c => c.status !== 'Full & Final Approved').length;
    let pendingItems = 0;
    let damagedOrMissing = 0;
    let totalLateFines = 0;
    let totalRecoverable = 0;
    let totalApproved = exitClearances.filter(c => c.status === 'Full & Final Approved').length;

    exitClearances.forEach(c => {
      pendingItems += c.items.filter(i => i.returnStatus === 'Pending').length;
      damagedOrMissing += c.items.filter(
        i => i.returnStatus === 'Damaged' || i.returnStatus === 'Missing'
      ).length;
      totalLateFines += c.summary.totalLateFines || 0;
      totalRecoverable += c.summary.totalEmployeeLiableAmount || 0;
    });

    return { totalActive, pendingItems, damagedOrMissing, totalLateFines, totalRecoverable, totalApproved };
  }, [exitClearances]);

  return (
    <div className="space-y-6">
      {/* 1. SECTION TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-2xs">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Employee Exit & Asset Clearance
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-mono">
                Offboarding & No-Dues
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 max-w-2xl leading-relaxed">
              Track separation cycles, enforce 2–5 day asset return deadlines, calculate ₹500/day late fines, inspect condition, and issue official No-Dues Certificates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isEmployee && (
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 dark:font-bold transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Raise Exit Request</span>
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowInitiateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 dark:font-bold transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Initiate Exit Clearance</span>
            </button>
          )}
        </div>
      </div>

      {/* EMPLOYEE PORTAL EXIT STATUS BANNER */}
      {isEmployee && (
        <EmployeeExitStatusCard
          clearance={myClearance}
          onRaiseRequest={() => setShowSubmitModal(true)}
          onViewCertificate={record => setCertificateRecord(record)}
        />
      )}

      {/* ADMIN PORTAL TABS */}
      {isAdmin && (
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap">
          <button
            type="button"
            onClick={() => setMainTab('requests')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              mainTab === 'requests'
                ? 'bg-blue-600 text-white shadow-xs dark:bg-amber-500 dark:text-slate-950 dark:font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Exit Requests & Approvals</span>
            {pendingRequestsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-rose-600 text-white animate-pulse">
                {pendingRequestsCount} Pending
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMainTab('active_clearances')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              mainTab === 'active_clearances'
                ? 'bg-blue-600 text-white shadow-xs dark:bg-amber-500 dark:text-slate-950 dark:font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Active Asset Clearances</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {stats.totalActive}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab('history')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              mainTab === 'history'
                ? 'bg-blue-600 text-white shadow-xs dark:bg-amber-500 dark:text-slate-950 dark:font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Exit History & Archived Records</span>
          </button>
        </div>
      )}

      {/* VIEW 1: EXIT REQUESTS (ADMIN) */}
      {isAdmin && mainTab === 'requests' && (
        <ExitRequestsAdminView
          clearances={exitClearances}
          onReviewRequest={clr => setReviewingClearance(clr)}
          onInitiateClearance={() => setShowInitiateModal(true)}
        />
      )}

      {/* VIEW 2: EXIT HISTORY (ADMIN) */}
      {isAdmin && mainTab === 'history' && (
        <ExitHistoryView
          clearances={exitClearances}
          onViewCertificate={record => setCertificateRecord(record)}
          onSelectEmployee={onSelectEmployee}
        />
      )}

      {/* VIEW 3: ACTIVE ASSET CLEARANCES (ADMIN OR EMPLOYEE ACTIVE ITEMS) */}
      {(!isAdmin || mainTab === 'active_clearances') && (
        <>
      {/* 1.5 WORKFLOW PIPELINE PROGRESSION CARD */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-2xs hidden lg:block">
        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
          <span>Offboarding Clearance Protocol (2–5 Days Window)</span>
          <span className="text-slate-400 dark:text-slate-500 font-normal">Automated Offboarding & Asset Surrender Pipeline</span>
        </div>
        <div className="grid grid-cols-6 gap-2 text-center text-[10px]">
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-lg p-2.5 border border-slate-200/80 dark:border-slate-800">
            <span className="text-amber-600 dark:text-amber-400 font-bold block mb-0.5">Step 1</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">Resignation / Exit Notice</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-lg p-2.5 border border-slate-200/80 dark:border-slate-800">
            <span className="text-amber-600 dark:text-amber-400 font-bold block mb-0.5">Step 2</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">Clearance Window (2–5 Days)</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-lg p-2.5 border border-slate-200/80 dark:border-slate-800">
            <span className="text-amber-600 dark:text-amber-400 font-bold block mb-0.5">Step 3</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">Assigned Assets Surrender</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-lg p-2.5 border border-slate-200/80 dark:border-slate-800">
            <span className="text-amber-600 dark:text-amber-400 font-bold block mb-0.5">Step 4</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">Physical Inspection</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-lg p-2.5 border border-slate-200/80 dark:border-slate-800">
            <span className="text-amber-600 dark:text-amber-400 font-bold block mb-0.5">Step 5</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">Late Fines & Policy Dues</span>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-lg p-2.5 border border-emerald-200 dark:border-emerald-800">
            <span className="text-emerald-700 dark:text-emerald-300 font-bold block mb-0.5">Final Step</span>
            <span className="font-bold text-emerald-900 dark:text-white">Full & Final Certificate</span>
          </div>
        </div>
      </div>

      {/* 2. STATS SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Active Clearances</span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {stats.totalActive}
          </div>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">In Process</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Pending Returns</span>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {stats.pendingItems}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Unsubmitted Devices</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Damage / Missing</span>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {stats.damagedOrMissing}
          </div>
          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">Flagged Items</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Late Return Fines</span>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
            {formatCurrency(stats.totalLateFines)}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">₹500/day accrued</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Total Recoverable</span>
          <div className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1">
            {formatCurrency(stats.totalRecoverable)}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Employee Liabilities</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Certified & Cleared</span>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.totalApproved}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">No-Dues Issued</span>
        </div>
      </div>

      {/* 3. SEARCH & FILTERS BAR */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by employee name, employee ID, asset tag, serial number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="All">All Statuses</option>
              <option value="Pending Asset Return">Pending Asset Return</option>
              <option value="Under Inspection">Under Inspection</option>
              <option value="Action Required / Liability Pending">Action Required / Damage Pending</option>
              <option value="Cleared">Cleared (Ready for Sign-Off)</option>
              <option value="Full & Final Approved">Full & Final Approved</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 font-medium">Exit Type:</span>
            <select
              value={exitTypeFilter}
              onChange={e => setExitTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="All">All Types</option>
              <option value="Resignation">Resignation</option>
              <option value="Termination">Termination</option>
              <option value="Mutual Separation">Mutual Separation</option>
              <option value="End of Contract">End of Contract</option>
              <option value="Retirement">Retirement</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. CLEARANCE RECORDS LIST */}
      <div className="space-y-4">
        {filteredClearances.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No Exit Clearance Records Found
            </h3>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'All'
                ? 'Try adjusting your search criteria or clearing filters.'
                : 'No employees are currently in the exit clearance process.'}
            </p>
            {isAdmin && !searchQuery && (
              <button
                type="button"
                onClick={() => setShowInitiateModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 dark:font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Initiate Exit Clearance</span>
              </button>
            )}
          </div>
        ) : (
          filteredClearances.map(clr => {
            const isExpanded = expandedClearanceIds.has(clr.id);
            const isAuditExpanded = expandedAuditIds.has(clr.id);
            const isApproved = clr.status === 'Full & Final Approved';
            const allItemsVerified =
              clr.items.length > 0 && clr.items.every(i => i.returnStatus === 'Verified');
            const canApprove =
              isAdmin &&
              !isApproved &&
              (clr.status === 'Cleared' || allItemsVerified || clr.summary.totalReturned === clr.summary.totalAssigned);

            // Deadline countdown calculations
            const today = new Date();
            const deadline = new Date(clr.returnDeadline);
            deadline.setHours(23, 59, 59, 999);
            const isOverdue = today > deadline && !isApproved;
            const diffDays = Math.ceil(Math.abs(today.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));

            return (
              <div
                key={clr.id}
                className="bg-white dark:bg-[#101726] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden transition-all"
              >
                {/* Main Card Header */}
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80">
                  {/* Left: Employee Particulars */}
                  <div className="flex items-start gap-3.5">
                    <EmployeeAvatar name={clr.employeeName} size="lg" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                          {clr.employeeName}
                        </h2>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {clr.companyEmployeeNumber || clr.employeeId}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {clr.exitType}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {clr.designation || 'Staff'} • {clr.department}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500 flex-wrap">
                        <span>Exit Date: <strong className="text-slate-700 dark:text-slate-300">{formatDateDisplay(clr.exitDate)}</strong></span>
                        <span>•</span>
                        <span>Window: <strong className="text-slate-700 dark:text-slate-300">{clr.clearanceWindowDays} Days</strong></span>
                        <span>•</span>
                        <span>Return Deadline: <strong className="text-slate-700 dark:text-slate-300">{formatDateDisplay(clr.returnDeadline)}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Middle / Right: Deadline Status Badge & Liabilities */}
                  <div className="flex items-center gap-3 flex-wrap lg:justify-end">
                    {/* Return Deadline Badge */}
                    {isApproved ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>CLEARED & APPROVED</span>
                      </span>
                    ) : isOverdue ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>OVERDUE BY {diffDays} DAYS • ₹{clr.summary.totalLateFines.toLocaleString('en-IN')} FINE</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{diffDays} DAYS REMAINING IN WINDOW</span>
                      </span>
                    )}

                    {/* Liability Total Pill */}
                    {clr.summary.totalEmployeeLiableAmount > 0 && (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
                        Dues: {formatCurrency(clr.summary.totalEmployeeLiableAmount)}
                      </span>
                    )}

                    {/* Quick Expand Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(clr.id)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Sub-Header: Progress Metrics Pill Bar */}
                <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">
                      Assigned Assets: <strong className="text-slate-800 dark:text-slate-200">{clr.summary.totalAssigned}</strong>
                    </span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Returned: {clr.summary.totalReturned} / {clr.summary.totalAssigned}
                    </span>
                    {clr.summary.totalDamaged > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                          Damaged: {clr.summary.totalDamaged}
                        </span>
                      </>
                    )}
                    {clr.summary.totalMissing > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-rose-600 dark:text-rose-400 font-semibold">
                          Missing: {clr.summary.totalMissing}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Certificate Button */}
                    {(isApproved || clr.status === 'Cleared') && (
                      <button
                        type="button"
                        onClick={() => setCertificateRecord(clr)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px] shadow-2xs transition-colors cursor-pointer"
                      >
                        <FileCheck className="w-3 h-3" />
                        <span>View No-Dues Certificate</span>
                      </button>
                    )}

                    {/* Admin Approve Final Clearance Button */}
                    {canApprove && (
                      <button
                        type="button"
                        onClick={() => approveFinalExitClearance(clr.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] shadow-2xs transition-colors cursor-pointer"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span>Approve Final Clearance</span>
                      </button>
                    )}

                    {/* Toggle Audit History */}
                    <button
                      type="button"
                      onClick={() => toggleAudit(clr.id)}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 text-[10px] cursor-pointer"
                    >
                      <History className="w-3 h-3" />
                      <span>{isAuditExpanded ? 'Hide History' : `Audit (${clr.auditTrail.length})`}</span>
                    </button>
                  </div>
                </div>

                {/* 5. EXPANDED ASSET CHECKLIST ITEMS */}
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Enrolled Hardware & Peripherals Checklist ({clr.items.length} Assets)
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {clr.items.map(item => {
                      const isItemVerified = item.returnStatus === 'Verified';
                      const isItemDamaged = item.returnStatus === 'Damaged';
                      const isItemMissing = item.returnStatus === 'Missing';
                      const isItemPending = item.returnStatus === 'Pending';

                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 rounded-xl border transition-all ${
                            isItemVerified
                              ? 'bg-emerald-50/60 dark:bg-emerald-950/15 border-emerald-200/90 dark:border-emerald-900/40'
                              : isItemDamaged
                              ? 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-200/90 dark:border-amber-900/50'
                              : isItemMissing
                              ? 'bg-rose-50/70 dark:bg-rose-950/25 border-rose-200/90 dark:border-rose-900/50'
                              : 'bg-slate-50/80 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  isItemVerified
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : isItemDamaged
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                    : isItemMissing
                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                    : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {item.assetType === 'Laptop' || item.assetType === 'Desktop' ? (
                                  <Laptop className="w-4 h-4" />
                                ) : item.assetType === 'Mobile Phone' || item.assetType === 'SIM Card' ? (
                                  <Smartphone className="w-4 h-4" />
                                ) : (
                                  <Headphones className="w-4 h-4" />
                                )}
                              </div>

                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono font-bold text-[11px] text-slate-900 dark:text-white">
                                    {item.assetNumber}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    ({item.assetType})
                                  </span>
                                </div>
                                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                                  {item.deviceName}
                                </div>
                                {item.serialNumber && (
                                  <div className="font-mono text-[9px] text-slate-400 mt-0.5">
                                    SN: {item.serialNumber}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Return Status Badge */}
                            <div>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isItemVerified
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-500/30'
                                    : isItemDamaged
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-500/30'
                                    : isItemMissing
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-500/30'
                                    : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                }`}
                              >
                                {item.returnStatus}
                              </span>
                            </div>
                          </div>

                          {/* Inspection & Late Details Body */}
                          <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1.5 text-[11px]">
                            {/* Submission Date & Late Fine */}
                            <div className="flex items-center justify-between text-slate-500">
                              <span>Submitted: <strong>{formatDateDisplay(item.submissionDate) || 'Pending Return'}</strong></span>
                              {item.lateDays > 0 && (
                                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                  {item.lateDays}d Late {item.fineWaived ? '(Fine Waived)' : `(Fine: ${formatCurrency(item.lateFineAmount)})`}
                                </span>
                              )}
                            </div>

                            {/* Damage / Missing Assessment */}
                            {isItemDamaged && (
                              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300">
                                <span className="font-bold block">Issue: {item.damageReason || 'Hardware Damage'}</span>
                                <div className="flex items-center justify-between mt-1 text-[10px]">
                                  <span>Repair Cost: <strong>{formatCurrency(item.repairCost)}</strong></span>
                                  <span className="font-semibold px-1.5 py-0.5 rounded bg-amber-500/20">
                                    {item.liabilityPolicy}
                                  </span>
                                </div>
                                {item.liabilityAmount > 0 && (
                                  <div className="text-[10px] text-amber-900 dark:text-amber-200 font-bold mt-1">
                                    Employee Liable Dues: {formatCurrency(item.liabilityAmount)}
                                  </div>
                                )}
                              </div>
                            )}

                            {isItemMissing && (
                              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300">
                                <span className="font-bold block">Asset Lost / Missing</span>
                                <div className="flex items-center justify-between mt-1 text-[10px]">
                                  <span>Recovery Cost: <strong>{formatCurrency(item.missingReplacementCost)}</strong></span>
                                  <span className="font-semibold px-1.5 py-0.5 rounded bg-rose-500/20">
                                    {item.liabilityPolicy}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Evidence Photos & Receipt Thumbnails */}
                            {(item.inspectionPhotos && item.inspectionPhotos.length > 0 || item.repairReceiptUrl) && (
                              <div className="flex items-center gap-2 pt-1 flex-wrap">
                                {item.inspectionPhotos?.map((photo, pIdx) => (
                                  <button
                                    key={pIdx}
                                    type="button"
                                    onClick={() => setActivePhotoPreview(photo)}
                                    className="cursor-pointer group relative"
                                  >
                                    <img
                                      src={photo}
                                      alt="Evidence thumbnail"
                                      className="w-8 h-8 rounded object-cover border border-slate-200 dark:border-slate-700 group-hover:opacity-80"
                                    />
                                    <Eye className="w-2.5 h-2.5 absolute inset-0 m-auto text-white opacity-0 group-hover:opacity-100" />
                                  </button>
                                ))}

                                {item.repairReceiptUrl && (
                                  <a
                                    href={item.repairReceiptUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 text-[10px] hover:underline"
                                  >
                                    <FileText className="w-3 h-3" />
                                    <span>Receipt</span>
                                  </a>
                                )}
                              </div>
                            )}

                            {/* Admin Action Button */}
                            {isAdmin && !isApproved && (
                              <div className="pt-2 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => setInspectingItem({ item, clearanceId: clr.id })}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[10px] transition-colors cursor-pointer shadow-2xs"
                                >
                                  <Wrench className="w-3 h-3 text-white" />
                                  <span>{isItemPending ? 'Receive & Inspect Asset' : 'Re-Inspect / Update'}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 6. EXPANDABLE AUDIT TRAIL ACCORDION */}
                {isAuditExpanded && (
                  <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800 space-y-2.5 animate-fade-in">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <History className="w-3.5 h-3.5 text-blue-500" />
                      <span>Complete Administrative Clearance Audit Trail ({clr.auditTrail.length} Records)</span>
                    </div>

                    <div className="space-y-2">
                      {clr.auditTrail.map(entry => (
                        <div
                          key={entry.id}
                          className="p-2.5 rounded-lg bg-white dark:bg-[#101726] border border-slate-200/60 dark:border-slate-800/80 text-[11px] flex items-start justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <strong className="text-slate-900 dark:text-white font-semibold">
                                {entry.action}
                              </strong>
                              <span className="text-[10px] text-slate-400">
                                by <span className="text-blue-600 dark:text-blue-400 font-medium">{entry.actor}</span>
                              </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-[10px] mt-0.5 leading-relaxed">
                              {entry.details}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {formatDateDisplay(entry.timestamp)} {entry.timestamp.substring(11, 16)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 7. CARD FOOTER CONTROLS */}
                {isAdmin && (
                  <div className="px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">
                      Clearance Record ID: <strong className="font-mono text-slate-600 dark:text-slate-300">{clr.id}</strong>
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to remove exit clearance record for ${clr.employeeName}?`)) {
                          deleteExitClearance(clr.id);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 dark:hover:text-red-400 flex items-center gap-1 font-semibold text-[10px] cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove Record</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      </>
      )}

      {/* MODAL 5: SUBMIT EXIT REQUEST MODAL (EMPLOYEE) */}
      {showSubmitModal && (
        <SubmitExitRequestModal
          isOpen={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
        />
      )}

      {/* MODAL 6: REVIEW EXIT REQUEST MODAL (ADMIN) */}
      {reviewingClearance && (
        <ReviewExitRequestModal
          clearance={reviewingClearance}
          isOpen={Boolean(reviewingClearance)}
          onClose={() => setReviewingClearance(null)}
        />
      )}

      {/* MODAL 1: INITIATE EXIT CLEARANCE */}
      {showInitiateModal && (
        <InitiateExitClearanceModal
          isOpen={showInitiateModal}
          onClose={() => setShowInitiateModal(false)}
        />
      )}

      {/* MODAL 2: ASSET INSPECTION & DAMAGE ASSESSMENT */}
      {inspectingItem && (
        <AssetInspectionModal
          isOpen={Boolean(inspectingItem)}
          onClose={() => setInspectingItem(null)}
          item={inspectingItem.item}
          clearanceId={inspectingItem.clearanceId}
          onSave={updateExitClearanceAsset}
        />
      )}

      {/* MODAL 3: NO-DUES CLEARANCE CERTIFICATE */}
      {certificateRecord && (
        <ClearanceCertificateModal
          isOpen={Boolean(certificateRecord)}
          onClose={() => setCertificateRecord(null)}
          record={certificateRecord}
        />
      )}

      {/* MODAL 4: FULL RES PHOTO PREVIEW LIGHTBOX */}
      {activePhotoPreview && (
        <div
          onClick={() => setActivePhotoPreview(null)}
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[85vh]">
            <img
              src={activePhotoPreview}
              alt="Full size evidence"
              className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl border border-white/20"
            />
            <button
              type="button"
              onClick={() => setActivePhotoPreview(null)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
