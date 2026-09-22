import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDateDisplay } from '../../utils/formatters';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Search,
  Filter,
  Layers,
  Smartphone,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  User,
  AlertTriangle,
  Info,
  Calendar,
  ShieldCheck,
  Building,
} from 'lucide-react';

interface EmployeeQueryHistorySectionProps {
  targetEmployeeId?: string;
  isAdminView?: boolean;
}

export const EmployeeQueryHistorySection: React.FC<EmployeeQueryHistorySectionProps> = ({
  targetEmployeeId,
  isAdminView = false,
}) => {
  const {
    currentUser,
    userRole,
    employees,
    assetRequests = [],
    simRequests = [],
    assetQueries = [],
  } = useApp();

  const [activeTabFilter, setActiveTabFilter] = useState<'All' | 'Approved' | 'Rejected' | 'Pending' | 'Removed'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedQueryId, setExpandedQueryId] = useState<string | null>(null);

  // Identify target employee
  const effectiveEmployee = useMemo(() => {
    if (targetEmployeeId) {
      return (
        employees.find(
          e => e.id === targetEmployeeId || e.employeeId === targetEmployeeId
        ) || null
      );
    }
    if (currentUser?.role === 'employee') {
      return (
        employees.find(
          e =>
            e.id === currentUser.id ||
            e.employeeId === currentUser.employeeId ||
            e.email.toLowerCase() === currentUser.email.toLowerCase()
        ) || null
      );
    }
    return employees[0] || null;
  }, [targetEmployeeId, currentUser, employees]);

  // Aggregate queries & requests for the target employee
  const employeeQueries = useMemo(() => {
    if (!effectiveEmployee && !isAdminView) return [];

    const isMatch = (empId?: string, empEmail?: string) => {
      if (isAdminView && !targetEmployeeId) return true; // Show all for Admin global view
      if (!effectiveEmployee) return false;
      if (empId && (empId === effectiveEmployee.id || empId === effectiveEmployee.employeeId)) return true;
      if (empEmail && empEmail.toLowerCase() === effectiveEmployee.email.toLowerCase()) return true;
      return false;
    };

    const items: Array<{
      id: string;
      rawId: string;
      employeeId: string;
      employeeName: string;
      companyEmployeeNumber?: string;
      department?: string;
      typeCategory: 'Equipment Requisition' | 'SIM Request' | 'Asset Query';
      queryTypeLabel: string;
      badgeColor: string;
      details: string;
      itemsSummary?: string;
      status: string;
      normalizedStatus: 'Approved' | 'Rejected' | 'Pending' | 'Removed';
      date: string;
      rawTimestamp: number;
      adminNotes?: string;
      removedBy?: string;
      removedAt?: string;
      removalReason?: string;
      timeline: Array<{
        title: string;
        description?: string;
        timestamp?: string;
        actor?: string;
        isDone: boolean;
        isCurrent: boolean;
        isRejected?: boolean;
        isRemoved?: boolean;
      }>;
    }> = [];

    // 1. Equipment Requisitions (Asset Requests)
    assetRequests.forEach(req => {
      if (!isMatch(req.employeeId, req.employeeEmail)) return;

      const rawTime = new Date(req.createdAt || req.requestDate).getTime() || Date.now();
      let normStatus: 'Approved' | 'Rejected' | 'Pending' | 'Removed' = 'Pending';
      if (req.status === 'Removed') normStatus = 'Removed';
      else if (req.status === 'Approved' || req.status === 'Fulfilled') normStatus = 'Approved';
      else if (req.status === 'Rejected') normStatus = 'Rejected';

      const itemsText = req.items?.map(i => `${i.quantity}x ${i.assetType}${i.specifications ? ` (${i.specifications})` : ''}`).join(', ') || 'Equipment';

      const timeline = [
        {
          title: 'Request Submitted',
          description: `Submitted for approval by ${req.employeeName}`,
          timestamp: req.requestDate || formatDateDisplay(req.createdAt),
          actor: req.employeeName,
          isDone: true,
          isCurrent: req.status === 'Pending',
        },
        {
          title: req.status === 'In Progress' ? 'Under IT Review' : 'IT Assessment',
          description: req.status === 'Pending' ? 'Awaiting IT Administrator review' : 'Reviewed by IT Administrator',
          timestamp: req.updatedAt ? formatDateDisplay(req.updatedAt) : undefined,
          actor: 'IT Admin',
          isDone: req.status !== 'Pending',
          isCurrent: req.status === 'In Progress',
        },
        {
          title: req.status === 'Removed' ? 'Request Removed' : req.status === 'Approved' || req.status === 'Fulfilled' ? 'Approved & Fulfilled' : req.status === 'Rejected' ? 'Request Rejected' : 'Action Decision',
          description: req.status === 'Removed' ? (req.removalReason ? `Removal Reason: ${req.removalReason}` : 'Removed by Admin') : req.adminNotes || (req.status === 'Rejected' ? 'Requisition rejected by Admin' : req.status === 'Approved' || req.status === 'Fulfilled' ? 'Requisition approved by Admin' : 'Awaiting decision'),
          timestamp: req.removedAt ? formatDateDisplay(req.removedAt) : req.fulfilledDate ? formatDateDisplay(req.fulfilledDate) : req.updatedAt ? formatDateDisplay(req.updatedAt) : undefined,
          actor: req.removedBy || 'IT Admin',
          isDone: req.status === 'Approved' || req.status === 'Fulfilled' || req.status === 'Rejected' || req.status === 'Removed',
          isCurrent: true,
          isRejected: req.status === 'Rejected',
          isRemoved: req.status === 'Removed',
        },
      ];

      items.push({
        id: `REQ-${req.id}`,
        rawId: req.id,
        employeeId: req.employeeId,
        employeeName: req.employeeName,
        companyEmployeeNumber: req.companyEmployeeNumber,
        department: req.department,
        typeCategory: 'Equipment Requisition',
        queryTypeLabel: `Equipment Requisition (${req.items?.[0]?.assetType || 'Asset'})`,
        badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        details: req.reason,
        itemsSummary: itemsText,
        status: req.status,
        normalizedStatus: normStatus,
        date: req.requestDate || req.createdAt,
        rawTimestamp: rawTime,
        adminNotes: req.adminNotes,
        removedBy: req.removedBy,
        removedAt: req.removedAt,
        removalReason: req.removalReason,
        timeline,
      });
    });

    // 2. SIM Requests
    simRequests.forEach(req => {
      if (!isMatch(req.employeeId, req.employeeEmail)) return;

      const rawTime = new Date(req.createdAt).getTime() || Date.now();
      let normStatus: 'Approved' | 'Rejected' | 'Pending' | 'Removed' = 'Pending';
      if (req.status === 'Removed') normStatus = 'Removed';
      else if (req.status === 'Approved' || req.status === 'Resolved') normStatus = 'Approved';
      else if (req.status === 'Rejected') normStatus = 'Rejected';

      const timeline = [
        {
          title: 'SIM Request Filed',
          description: `${req.requestType} for ${req.purpose || req.issueType || 'Telecom support'}`,
          timestamp: formatDateDisplay(req.createdAt),
          actor: req.employeeName,
          isDone: true,
          isCurrent: req.status === 'Pending',
        },
        {
          title: req.status === 'Removed' ? 'Request Removed' : req.status === 'Approved' || req.status === 'Resolved' ? 'Approved & Resolved' : req.status === 'Rejected' ? 'Request Rejected' : 'IT Processing',
          description: req.status === 'Removed' ? (req.removalReason ? `Removal Reason: ${req.removalReason}` : 'Removed by Admin') : req.adminRemarks || req.resolutionRemarks || (req.status === 'Rejected' ? 'SIM request rejected' : req.status === 'Approved' ? 'SIM request approved' : 'Processing request'),
          timestamp: req.removedAt ? formatDateDisplay(req.removedAt) : req.resolvedAt ? formatDateDisplay(req.resolvedAt) : req.updatedAt ? formatDateDisplay(req.updatedAt) : undefined,
          actor: req.removedBy || req.resolvedBy || 'IT Admin',
          isDone: req.status === 'Approved' || req.status === 'Resolved' || req.status === 'Rejected' || req.status === 'Removed',
          isCurrent: true,
          isRejected: req.status === 'Rejected',
          isRemoved: req.status === 'Removed',
        },
      ];

      items.push({
        id: `SIMREQ-${req.id}`,
        rawId: req.id,
        employeeId: req.employeeId,
        employeeName: req.employeeName,
        companyEmployeeNumber: req.companyEmployeeNumber,
        typeCategory: 'SIM Request',
        queryTypeLabel: `SIM Request (${req.requestType})`,
        badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        details: req.reason,
        itemsSummary: `${req.requestType} • Purpose: ${req.purpose || req.issueType || 'Telecom'}`,
        status: req.status,
        normalizedStatus: normStatus,
        date: req.createdAt,
        rawTimestamp: rawTime,
        adminNotes: req.adminRemarks || req.resolutionRemarks,
        removedBy: req.removedBy,
        removedAt: req.removedAt,
        removalReason: req.removalReason,
        timeline,
      });
    });

    // 3. Staff Asset Queries
    assetQueries.forEach(q => {
      if (!isMatch(q.employeeId, q.employeeEmail)) return;

      const rawTime = new Date(q.createdAt).getTime() || Date.now();
      let normStatus: 'Approved' | 'Rejected' | 'Pending' | 'Removed' = 'Pending';
      if (q.status === 'Removed') normStatus = 'Removed';
      else if (q.status === 'Resolved' || q.status === 'Closed' || q.status === 'Handover Completed') normStatus = 'Approved';
      else if (q.status === 'Still Unresolved') normStatus = 'Pending';

      const timeline: Array<{
        title: string;
        description?: string;
        timestamp?: string;
        actor?: string;
        isDone: boolean;
        isCurrent: boolean;
        isRemoved?: boolean;
      }> = (q.history || []).map((h, index) => ({
        title: h.status,
        description: h.notes,
        timestamp: formatDateDisplay(h.timestamp),
        actor: h.updatedBy,
        isDone: true,
        isCurrent: index === 0,
        isRemoved: h.status === 'Removed',
      }));

      if (timeline.length === 0) {
        timeline.push({
          title: 'Query Submitted',
          description: q.description,
          timestamp: formatDateDisplay(q.createdAt),
          actor: q.employeeName,
          isDone: true,
          isCurrent: true,
          isRemoved: q.status === 'Removed',
        });
      }

      items.push({
        id: `QRY-${q.id}`,
        rawId: q.id,
        employeeId: q.employeeId,
        employeeName: q.employeeName,
        companyEmployeeNumber: q.companyEmployeeNumber,
        department: q.department,
        typeCategory: 'Asset Query',
        queryTypeLabel: `Asset Query (${q.queryType})`,
        badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        details: `${q.subject}: ${q.description}`,
        itemsSummary: `Asset: ${q.assetName} [${q.assetNumber}]`,
        status: q.status,
        normalizedStatus: normStatus,
        date: q.createdAt,
        rawTimestamp: rawTime,
        adminNotes: q.resolutionNotes || q.stillUnresolvedNotes,
        removedBy: q.removedBy,
        removedAt: q.removedAt,
        removalReason: q.removalReason,
        timeline,
      });
    });

    // Sort newest first
    return items.sort((a, b) => b.rawTimestamp - a.rawTimestamp);
  }, [assetRequests, simRequests, assetQueries, effectiveEmployee, isAdminView, targetEmployeeId]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = employeeQueries.length;
    const approved = employeeQueries.filter(q => q.normalizedStatus === 'Approved').length;
    const rejected = employeeQueries.filter(q => q.normalizedStatus === 'Rejected').length;
    const removed = employeeQueries.filter(q => q.normalizedStatus === 'Removed').length;
    const pending = employeeQueries.filter(q => q.normalizedStatus === 'Pending').length;

    return { total, approved, rejected, removed, pending };
  }, [employeeQueries]);

  // Filtered queries based on selected tab and search term
  const filteredQueries = useMemo(() => {
    return employeeQueries.filter(q => {
      const matchesTab =
        activeTabFilter === 'All' ? true : q.normalizedStatus === activeTabFilter;
      const term = searchQuery.toLowerCase();
      const matchesSearch =
        !term ||
        q.queryTypeLabel.toLowerCase().includes(term) ||
        q.details.toLowerCase().includes(term) ||
        (q.itemsSummary && q.itemsSummary.toLowerCase().includes(term)) ||
        (q.removalReason && q.removalReason.toLowerCase().includes(term)) ||
        q.rawId.toLowerCase().includes(term);

      return matchesTab && matchesSearch;
    });
  }, [employeeQueries, activeTabFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Query & Request History
              {effectiveEmployee && !isAdminView && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {effectiveEmployee.name} ({effectiveEmployee.employeeId})
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Complete lifetime history of submitted requisitions, SIM requests, and queries with full removal audit trail.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Total Submitted</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Lifetime records</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-950/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-xs font-medium">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.approved}</span>
            <p className="text-[11px] text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">Fulfilled & resolved</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-rose-200/80 dark:border-rose-950/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
            <span className="text-xs font-medium">Rejected</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{stats.rejected}</span>
            <p className="text-[11px] text-rose-600/70 dark:text-rose-400/70 mt-0.5">Declined by Admin</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200/80 dark:border-amber-950/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-xs font-medium">Pending</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.pending}</span>
            <p className="text-[11px] text-amber-600/70 dark:text-amber-400/70 mt-0.5">In review / active</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-rose-300 dark:border-rose-900/60 shadow-sm flex flex-col justify-between bg-gradient-to-br from-rose-50/50 to-orange-50/30 dark:from-rose-950/20 dark:to-orange-950/10">
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-300">
            <span className="text-xs font-bold">Removed Queries</span>
            <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-rose-700 dark:text-rose-300">{stats.removed}</span>
            <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-0.5 font-medium">Archived with reason</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {(['All', 'Approved', 'Rejected', 'Pending', 'Removed'] as const).map(tab => {
              const isActive = activeTabFilter === tab;
              let badgeColor = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
              if (isActive) {
                if (tab === 'Removed') badgeColor = 'bg-rose-600 text-white font-bold shadow-md shadow-rose-600/20';
                else if (tab === 'Approved') badgeColor = 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20';
                else if (tab === 'Rejected') badgeColor = 'bg-rose-600 text-white font-bold shadow-md shadow-rose-600/20';
                else if (tab === 'Pending') badgeColor = 'bg-amber-600 text-white font-bold shadow-md shadow-amber-600/20';
                else badgeColor = 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20';
              }

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTabFilter(tab)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                    isActive
                      ? badgeColor
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab === 'Removed' && <Trash2 className="w-3.5 h-3.5" />}
                  {tab === 'All' ? 'All Queries' : tab === 'Removed' ? 'Removed Queries' : tab}
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                    {tab === 'All' ? stats.total : tab === 'Approved' ? stats.approved : tab === 'Rejected' ? stats.rejected : tab === 'Pending' ? stats.pending : stats.removed}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search query history..."
              className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Query History Records List */}
      <div className="space-y-3">
        {filteredQueries.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
              {activeTabFilter === 'Removed' ? <Trash2 className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Query Records Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {activeTabFilter === 'Removed'
                ? 'No removed queries match your current filter. Any queries removed by Admin will appear here with full removal details.'
                : 'No submitted queries or requisitions match your criteria.'}
            </p>
          </div>
        ) : (
          filteredQueries.map(item => {
            const isExpanded = expandedQueryId === item.id;
            const isRemoved = item.normalizedStatus === 'Removed';

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all overflow-hidden ${
                  isRemoved
                    ? 'border-rose-200 dark:border-rose-900/60 bg-gradient-to-r from-rose-50/30 to-transparent dark:from-rose-950/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Record Main Summary Row */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${item.badgeColor}`}>
                        {item.typeCategory}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                        #{item.rawId}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDateDisplay(item.date)}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {item.queryTypeLabel}
                    </h4>

                    {item.itemsSummary && (
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {item.itemsSummary}
                      </p>
                    )}

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {item.details}
                    </p>
                  </div>

                  {/* Status Badge & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    {/* Status Pill */}
                    {isRemoved ? (
                      <div className="px-3 py-1 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center gap-1.5">
                        <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        Status: Removed
                      </div>
                    ) : item.normalizedStatus === 'Approved' ? (
                      <div className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-bold text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {item.status}
                      </div>
                    ) : item.normalizedStatus === 'Rejected' ? (
                      <div className="px-3 py-1 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 font-bold text-xs flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5" />
                        Rejected
                      </div>
                    ) : (
                      <div className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-bold text-xs flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {item.status}
                      </div>
                    )}

                    {/* Expand Action History */}
                    <button
                      onClick={() => setExpandedQueryId(isExpanded ? null : item.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition flex items-center gap-1"
                    >
                      {isExpanded ? 'Hide Details' : 'Action History'}
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Removed Query Box Banner */}
                {isRemoved && (
                  <div className="mx-4 mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-bold text-rose-800 dark:text-rose-300">
                      <span className="flex items-center gap-1.5">
                        <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        Query Removal Details:
                      </span>
                      <span className="text-[11px] font-normal text-rose-600/80 dark:text-rose-400/80">
                        {item.removedAt ? formatDateDisplay(item.removedAt) : 'Date recorded'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-slate-700 dark:text-slate-300">
                      <div>
                        <span className="text-slate-400 font-medium">Removal Reason:</span>{' '}
                        <strong className="text-rose-900 dark:text-rose-200">{item.removalReason || 'Removed by Administrator'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Removed By (Admin):</span>{' '}
                        <strong className="text-slate-900 dark:text-white">{item.removedBy || 'IT Administrator'}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Expanded Action History Timeline */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 space-y-4">
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-500" />
                      Lifecycle & Audit Action History Timeline
                    </h5>

                    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                      {item.timeline.map((step, idx) => (
                        <div key={idx} className="relative flex items-start gap-3">
                          {/* Dot */}
                          <div
                            className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 bg-white dark:bg-slate-900 ${
                              step.isRemoved
                                ? 'border-rose-600 bg-rose-600'
                                : step.isRejected
                                ? 'border-rose-500 bg-rose-500'
                                : step.isDone
                                ? 'border-emerald-500 bg-emerald-500'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          />

                          <div className="flex-1 text-xs">
                            <div className="flex items-center justify-between">
                              <strong className={`font-bold ${step.isRemoved ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                                {step.title}
                              </strong>
                              {step.timestamp && (
                                <span className="text-[11px] text-slate-400">{step.timestamp}</span>
                              )}
                            </div>
                            {step.description && (
                              <p className="text-slate-600 dark:text-slate-400 mt-0.5">{step.description}</p>
                            )}
                            {step.actor && (
                              <span className="inline-block mt-1 text-[10px] text-slate-400 font-medium">
                                By: {step.actor}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
