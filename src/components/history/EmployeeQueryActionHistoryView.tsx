import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDateDisplay, formatCurrency } from '../../utils/formatters';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  UserX,
  Shield,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  Layers,
  Smartphone,
  Wrench,
  HelpCircle,
  AlertTriangle,
  Info,
  Building,
} from 'lucide-react';

export const EmployeeQueryActionHistoryView: React.FC<{
  onSelectEmployee?: (id: string) => void;
}> = ({ onSelectEmployee }) => {
  const {
    employees,
    assetRequests,
    simRequests,
    assetQueries = [],
    serviceRecords,
    removedEmployees = [],
    userRole,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'removed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Unified Query & Action History Item structure
  const unifiedHistoryItems = useMemo(() => {
    const items: Array<{
      id: string;
      employeeId: string;
      employeeName: string;
      companyEmployeeNumber?: string;
      queryType: string;
      categoryLabel: string;
      categoryColor: string;
      queryDetails: string;
      itemsSummary?: string;
      actionTaken: string;
      status: string;
      statusVariant: 'approved' | 'rejected' | 'pending' | 'in_progress' | 'removed';
      adminName: string;
      reasonRemark: string;
      date: string;
      rawDate: number;
      isEmployeeRemoved: boolean;
      timeline: Array<{
        title: string;
        description?: string;
        timestamp?: string;
        actor?: string;
        isDone: boolean;
        isCurrent: boolean;
        isRejected?: boolean;
      }>;
    }> = [];

    // Helper map of removed employee IDs
    const removedEmpIds = new Set(removedEmployees.map(r => r.employeeId.toLowerCase()));
    const removedEmpNameMap = new Map(removedEmployees.map(r => [r.employeeId.toLowerCase(), r.name]));

    // 1. Equipment Requisitions (assetRequests)
    (assetRequests || []).forEach(req => {
      const isRemoved = removedEmpIds.has((req.employeeId || '').toLowerCase());
      const isQueryRemoved = req.status === 'Removed';
      const rawTime = new Date(req.createdAt || req.requestDate).getTime() || Date.now();
      let variant: 'approved' | 'rejected' | 'pending' | 'in_progress' | 'removed' = 'pending';
      if (isQueryRemoved) variant = 'removed';
      else if (req.status === 'Approved' || req.status === 'Fulfilled') variant = 'approved';
      else if (req.status === 'Rejected') variant = 'rejected';
      else if (req.status === 'In Progress') variant = 'in_progress';

      const itemsText = req.items?.map(i => `${i.quantity}x ${i.assetType}${i.specifications ? ` (${i.specifications})` : ''}`).join(', ') || 'Equipment Item';

      const timeline = [
        {
          title: 'Request Submitted',
          description: `Submitted by ${req.employeeName} (${req.department})`,
          timestamp: req.requestDate || formatDateDisplay(req.createdAt),
          actor: req.employeeName,
          isDone: true,
          isCurrent: req.status === 'Pending',
        },
        {
          title: req.status === 'In Progress' ? 'Under Review' : 'Admin Assessment',
          description: req.status === 'Pending' ? 'Awaiting IT Administrator review' : 'Reviewed by IT Administrator',
          timestamp: req.updatedAt ? formatDateDisplay(req.updatedAt) : undefined,
          actor: 'IT Administrator',
          isDone: req.status !== 'Pending',
          isCurrent: req.status === 'In Progress',
        },
        {
          title: isQueryRemoved ? 'Request Removed' : req.status === 'Approved' ? 'Approved' : req.status === 'Fulfilled' ? 'Fulfilled & Issued' : req.status === 'Rejected' ? 'Rejected' : 'Action Decision',
          description: isQueryRemoved ? (req.removalReason ? `Removal Reason: ${req.removalReason}` : 'Removed by Admin') : req.adminNotes || (req.status === 'Rejected' ? 'Request rejected by Admin' : req.status === 'Approved' || req.status === 'Fulfilled' ? 'Request approved by Admin' : 'Awaiting decision'),
          timestamp: req.removedAt ? formatDateDisplay(req.removedAt) : req.fulfilledDate ? formatDateDisplay(req.fulfilledDate) : req.updatedAt ? formatDateDisplay(req.updatedAt) : undefined,
          actor: req.removedBy || 'IT Administrator',
          isDone: req.status === 'Approved' || req.status === 'Fulfilled' || req.status === 'Rejected' || isQueryRemoved,
          isCurrent: req.status === 'Approved' || req.status === 'Fulfilled' || req.status === 'Rejected' || isQueryRemoved,
          isRejected: req.status === 'Rejected' || isQueryRemoved,
        },
      ];

      items.push({
        id: req.id,
        employeeId: req.employeeId,
        employeeName: req.employeeName,
        companyEmployeeNumber: req.companyEmployeeNumber,
        queryType: `Equipment Requisition (${req.items?.[0]?.assetType || 'Asset'})`,
        categoryLabel: 'Hardware Requisition',
        categoryColor: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        queryDetails: req.reason,
        itemsSummary: itemsText,
        actionTaken: req.status,
        status: isRemoved ? `${req.status} (Employee Removed)` : req.status,
        statusVariant: isRemoved ? 'removed' : variant,
        adminName: req.removedBy || 'IT Admin',
        reasonRemark: isQueryRemoved ? (req.removalReason ? `Removal Reason: ${req.removalReason}` : 'Removed by Admin') : (req.adminNotes || (req.status === 'Rejected' ? 'Request was rejected by Admin' : req.status === 'Approved' ? 'Requirements verified & approved' : 'Pending Admin evaluation')),
        date: req.requestDate || req.createdAt,
        rawDate: rawTime,
        isEmployeeRemoved: isRemoved,
        timeline,
      });
    });

    // 2. SIM Requests (simRequests)
    (simRequests || []).forEach(req => {
      const isRemoved = removedEmpIds.has((req.employeeId || '').toLowerCase());
      const isQueryRemoved = req.status === 'Removed';
      const rawTime = new Date(req.createdAt).getTime() || Date.now();
      let variant: 'approved' | 'rejected' | 'pending' | 'in_progress' | 'removed' = 'pending';
      if (isQueryRemoved) variant = 'removed';
      else if (req.status === 'Approved' || req.status === 'Resolved') variant = 'approved';
      else if (req.status === 'Rejected') variant = 'rejected';
      else if (req.status === 'In Progress') variant = 'in_progress';

      const remarks = req.adminRemarks || req.resolutionRemarks;

      const timeline = [
        {
          title: `${req.requestType} Requested`,
          description: req.reason,
          timestamp: formatDateDisplay(req.createdAt),
          actor: req.employeeName,
          isDone: true,
          isCurrent: req.status === 'Pending',
        },
        {
          title: 'Telecom Review',
          description: req.status === 'Pending' ? 'Awaiting Telecom Manager review' : `Processed by ${req.resolvedBy || req.removedBy || 'IT Admin'}`,
          timestamp: req.resolvedAt ? formatDateDisplay(req.resolvedAt) : req.updatedAt ? formatDateDisplay(req.updatedAt) : undefined,
          actor: req.resolvedBy || req.removedBy || 'IT Admin',
          isDone: req.status !== 'Pending',
          isCurrent: req.status === 'In Progress',
        },
        {
          title: isQueryRemoved ? 'Request Removed' : req.status === 'Approved' ? 'Approved' : req.status === 'Resolved' ? 'Resolved & Issued' : req.status === 'Rejected' ? 'Rejected' : 'Action Decision',
          description: isQueryRemoved ? (req.removalReason ? `Removal Reason: ${req.removalReason}` : 'Removed by Admin') : remarks || (req.status === 'Rejected' ? 'SIM request rejected by Admin' : 'Action decision recorded'),
          timestamp: req.removedAt ? formatDateDisplay(req.removedAt) : req.resolvedAt ? formatDateDisplay(req.resolvedAt) : undefined,
          actor: req.removedBy || req.resolvedBy || 'IT Admin',
          isDone: req.status === 'Approved' || req.status === 'Resolved' || req.status === 'Rejected' || isQueryRemoved,
          isCurrent: req.status === 'Approved' || req.status === 'Resolved' || req.status === 'Rejected' || isQueryRemoved,
          isRejected: req.status === 'Rejected' || isQueryRemoved,
        },
      ];

      items.push({
        id: req.id,
        employeeId: req.employeeId,
        employeeName: req.employeeName,
        companyEmployeeNumber: req.companyEmployeeNumber,
        queryType: `SIM Request (${req.requestType}${req.issueType ? `: ${req.issueType}` : ''})`,
        categoryLabel: 'SIM & Telecom',
        categoryColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        queryDetails: req.reason,
        itemsSummary: req.contactNumber ? `Target SIM: ${req.contactNumber}` : req.purpose ? `Purpose: ${req.purpose}` : undefined,
        actionTaken: req.status,
        status: isRemoved ? `${req.status} (Employee Removed)` : req.status,
        statusVariant: isRemoved ? 'removed' : variant,
        adminName: req.removedBy || req.resolvedBy || 'IT Admin',
        reasonRemark: isQueryRemoved ? (req.removalReason ? `Removal Reason: ${req.removalReason}` : 'Removed by Admin') : remarks || (req.status === 'Rejected' ? 'Rejected due to duplicate request' : req.status === 'Approved' ? 'SIM allocated & activated' : 'Awaiting Telecom decision'),
        date: req.createdAt,
        rawDate: rawTime,
        isEmployeeRemoved: isRemoved,
        timeline,
      });
    });

    // 3. Staff Asset Queries (assetQueries)
    (assetQueries || []).forEach(q => {
      const isRemoved = removedEmpIds.has((q.employeeId || '').toLowerCase());
      const isQueryRemoved = q.status === 'Removed';
      const rawTime = new Date(q.createdAt).getTime() || Date.now();
      let variant: 'approved' | 'rejected' | 'pending' | 'in_progress' | 'removed' = 'pending';
      if (isQueryRemoved) variant = 'removed';
      else if (q.status === 'Resolved' || q.status === 'Closed' || q.status === 'Handover Completed') variant = 'approved';
      else if (q.status === 'Still Unresolved') variant = 'rejected';
      else if (q.status === 'Acknowledged' || q.status === 'In Progress') variant = 'in_progress';

      const remarks = q.resolutionNotes || q.stillUnresolvedNotes;

      const timeline = (q.history && q.history.length > 0)
        ? q.history.map((h, idx) => ({
            title: h.status,
            description: h.notes || `Status updated to ${h.status}`,
            timestamp: formatDateDisplay(h.timestamp),
            actor: h.updatedBy,
            isDone: true,
            isCurrent: idx === q.history.length - 1,
            isRejected: h.status === 'Still Unresolved' || h.status === 'Removed',
          }))
        : [
            {
              title: 'Query Logged',
              description: `${q.queryType}: ${q.subject}`,
              timestamp: formatDateDisplay(q.createdAt),
              actor: q.employeeName,
              isDone: true,
              isCurrent: q.status === 'Pending Acknowledgement',
            },
            {
              title: 'Acknowledgement',
              description: q.acknowledgedBy ? `Acknowledged by ${q.acknowledgedBy}` : 'Awaiting Admin Acknowledgement',
              timestamp: q.acknowledgedAt ? formatDateDisplay(q.acknowledgedAt) : undefined,
              actor: q.acknowledgedBy || 'IT Admin',
              isDone: Boolean(q.acknowledgedAt || q.status !== 'Pending Acknowledgement'),
              isCurrent: q.status === 'Acknowledged' || q.status === 'In Progress',
            },
            {
              title: isQueryRemoved ? 'Query Removed' : q.status,
              description: isQueryRemoved ? (q.removalReason ? `Removal Reason: ${q.removalReason}` : 'Removed by Admin') : remarks || 'Resolution in progress',
              timestamp: q.removedAt ? formatDateDisplay(q.removedAt) : q.resolvedAt ? formatDateDisplay(q.resolvedAt) : q.stillUnresolvedDate ? formatDateDisplay(q.stillUnresolvedDate) : undefined,
              actor: q.removedBy || q.resolvedBy || q.acknowledgedBy || 'IT Admin',
              isDone: q.status === 'Resolved' || q.status === 'Closed' || q.status === 'Handover Completed' || isQueryRemoved,
              isCurrent: q.status === 'Resolved' || q.status === 'Closed' || q.status === 'Handover Completed' || q.status === 'Still Unresolved' || isQueryRemoved,
              isRejected: q.status === 'Still Unresolved' || isQueryRemoved,
            },
          ];

      items.push({
        id: q.id,
        employeeId: q.employeeId,
        employeeName: q.employeeName,
        companyEmployeeNumber: q.companyEmployeeNumber,
        queryType: `Staff Asset Query (${q.queryType})`,
        categoryLabel: 'Staff Asset Query',
        categoryColor: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        queryDetails: `${q.subject}: ${q.description}`,
        itemsSummary: `Asset: ${q.assetName} [${q.assetNumber}]`,
        actionTaken: q.status,
        status: isRemoved ? `${q.status} (Employee Removed)` : q.status,
        statusVariant: isRemoved ? 'removed' : variant,
        adminName: q.removedBy || q.resolvedBy || q.acknowledgedBy || 'IT Admin',
        reasonRemark: isQueryRemoved ? (q.removalReason ? `Removal Reason: ${q.removalReason}` : 'Removed by Admin') : remarks || (q.acknowledgedBy ? `Acknowledged by ${q.acknowledgedBy}` : 'Query registered in ticket queue'),
        date: q.createdAt,
        rawDate: rawTime,
        isEmployeeRemoved: isRemoved,
        timeline,
      });
    });

    // 4. Service & Maintenance Incidents (serviceRecords)
    (serviceRecords || []).forEach(s => {
      const isRemoved = removedEmpIds.has((s.employeeId || '').toLowerCase());
      const rawTime = new Date(s.serviceDate).getTime() || Date.now();
      let variant: 'approved' | 'rejected' | 'pending' | 'in_progress' = 'in_progress';
      if (s.serviceStatus === 'Completed') variant = 'approved';

      const remarks = s.resolution || s.workPerformed || s.remarks;

      const timeline = [
        {
          title: 'Service Incident Logged',
          description: `${s.problemCategory}: ${s.problem || s.deviceName}`,
          timestamp: formatDateDisplay(s.serviceDate),
          actor: s.employeeName,
          isDone: true,
          isCurrent: false,
        },
        {
          title: 'Technician Assigned',
          description: `Assigned to ${s.technician || 'Technician'}${s.serviceProviderShopName ? ` (${s.serviceProviderShopName})` : ''}`,
          timestamp: formatDateDisplay(s.serviceDate),
          actor: s.technician || 'Technician',
          isDone: true,
          isCurrent: s.serviceStatus !== 'Completed',
        },
        {
          title: s.serviceStatus === 'Completed' ? 'Service Completed' : 'Service Progress',
          description: remarks || `Status: ${s.serviceStatus}`,
          timestamp: formatDateDisplay(s.serviceDate),
          actor: s.technician || 'Technician',
          isDone: s.serviceStatus === 'Completed',
          isCurrent: s.serviceStatus === 'Completed',
        },
      ];

      items.push({
        id: s.id,
        employeeId: s.employeeId,
        employeeName: s.employeeName,
        companyEmployeeNumber: undefined,
        queryType: `Hardware Maintenance (${s.problemCategory})`,
        categoryLabel: 'Hardware Repair',
        categoryColor: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        queryDetails: s.problem,
        itemsSummary: `Device: ${s.deviceName || s.assetNumber} • Cost: ${formatCurrency(Number(s.serviceCost) || 0)}`,
        actionTaken: s.serviceStatus,
        status: isRemoved ? `${s.serviceStatus} (Employee Removed)` : s.serviceStatus,
        statusVariant: isRemoved ? 'removed' : variant,
        adminName: s.technician || 'IT Technician',
        reasonRemark: remarks || `Repair cost ₹${s.serviceCost} approved`,
        date: s.serviceDate,
        rawDate: rawTime,
        isEmployeeRemoved: isRemoved,
        timeline,
      });
    });

    // 5. Employee Removals (removedEmployees)
    (removedEmployees || []).forEach(rem => {
      const rawTime = new Date(rem.removedAt).getTime() || Date.now();

      const timeline = [
        {
          title: 'Employee Removal Initiated',
          description: `Removal requested for ${rem.name} (${rem.employeeId})`,
          timestamp: formatDateDisplay(rem.removedAt),
          actor: rem.removedBy,
          isDone: true,
          isCurrent: false,
        },
        {
          title: 'Fleet & Records Audit Completed',
          description: `Hardware & SIM cards returned to buffer stock. Audit history snapshot saved.`,
          timestamp: formatDateDisplay(rem.removedAt),
          actor: rem.removedBy,
          isDone: true,
          isCurrent: false,
        },
        {
          title: 'Employee Removed & Archived',
          description: `Mandatory Reason: "${rem.removalReason}"`,
          timestamp: formatDateDisplay(rem.removedAt),
          actor: rem.removedBy,
          isDone: true,
          isCurrent: true,
          isRejected: true,
        },
      ];

      items.push({
        id: rem.id,
        employeeId: rem.employeeId,
        employeeName: rem.name,
        companyEmployeeNumber: rem.companyEmployeeNumber,
        queryType: 'Employee Removal Action',
        categoryLabel: 'Employee Exit / Purge',
        categoryColor: 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 font-bold',
        queryDetails: `Employee ${rem.name} (${rem.department || 'Staff'}) permanently removed from active directory.`,
        itemsSummary: `Prev Assets: ${rem.snapshot?.assignedComputersCount || 0} PCs, ${rem.snapshot?.assignedAssetsCount || 0} Peripherals, ${rem.snapshot?.assignedSimsCount || 0} SIMs`,
        actionTaken: 'Removed',
        status: 'Removed',
        statusVariant: 'removed',
        adminName: rem.removedBy,
        reasonRemark: rem.removalReason,
        date: rem.removedAt,
        rawDate: rawTime,
        isEmployeeRemoved: true,
        timeline,
      });
    });

    return items.sort((a, b) => b.rawDate - a.rawDate);
  }, [assetRequests, simRequests, assetQueries, serviceRecords, removedEmployees]);

  // Filtered List based on Search & Status / Category Filters
  const filteredHistoryItems = useMemo(() => {
    return unifiedHistoryItems.filter(item => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = item.employeeName.toLowerCase().includes(q);
        const matchEmpId = item.employeeId.toLowerCase().includes(q);
        const matchBadge = (item.companyEmployeeNumber || '').toLowerCase().includes(q);
        const matchType = item.queryType.toLowerCase().includes(q);
        const matchDetails = item.queryDetails.toLowerCase().includes(q);
        const matchAdmin = item.adminName.toLowerCase().includes(q);
        const matchReason = item.reasonRemark.toLowerCase().includes(q);
        if (!matchName && !matchEmpId && !matchBadge && !matchType && !matchDetails && !matchAdmin && !matchReason) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter !== 'All') {
        const s = item.status.toLowerCase();
        if (statusFilter === 'Approved') {
          if (!s.includes('approved') && !s.includes('resolved') && !s.includes('fulfilled') && !s.includes('completed')) return false;
        } else if (statusFilter === 'Rejected') {
          if (!s.includes('rejected') && !s.includes('unresolved')) return false;
        } else if (statusFilter === 'Pending') {
          if (!s.includes('pending')) return false;
        } else if (statusFilter === 'In Progress') {
          if (!s.includes('progress') && !s.includes('acknowledged')) return false;
        } else if (statusFilter === 'Removed') {
          if (!s.includes('removed')) return false;
        }
      }

      // 3. Category Filter
      if (categoryFilter !== 'All') {
        if (categoryFilter === 'Requisitions' && !item.categoryLabel.includes('Requisition')) return false;
        if (categoryFilter === 'SIM' && !item.categoryLabel.includes('SIM')) return false;
        if (categoryFilter === 'Queries' && !item.categoryLabel.includes('Query')) return false;
        if (categoryFilter === 'Services' && !item.categoryLabel.includes('Repair')) return false;
        if (categoryFilter === 'Removals' && !item.categoryLabel.includes('Exit')) return false;
      }

      return true;
    });
  }, [unifiedHistoryItems, searchQuery, statusFilter, categoryFilter]);

  // Dynamic Dashboard Summary Statistics
  const dashboardStats = useMemo(() => {
    const totalQueries = unifiedHistoryItems.length;
    const approvedQueries = unifiedHistoryItems.filter(i => {
      const s = i.status.toLowerCase();
      return s.includes('approved') || s.includes('resolved') || s.includes('fulfilled') || s.includes('completed');
    }).length;
    const rejectedQueries = unifiedHistoryItems.filter(i => {
      const s = i.status.toLowerCase();
      return s.includes('rejected') || s.includes('unresolved');
    }).length;
    const pendingQueries = unifiedHistoryItems.filter(i => {
      const s = i.status.toLowerCase();
      return s.includes('pending');
    }).length;
    const removedQueries = unifiedHistoryItems.filter(i => i.isEmployeeRemoved).length;
    const totalEmployeesRemoved = removedEmployees.length;

    return {
      totalQueries,
      approvedQueries,
      rejectedQueries,
      pendingQueries,
      removedQueries,
      totalEmployeesRemoved,
    };
  }, [unifiedHistoryItems, removedEmployees]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* HEADER SECTION */}
      <div className="bg-white dark:bg-[#101726] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Employee Query & Action History
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Admin Audit Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Complete historical log of employee requests, Admin approvals, rejections, remarks, and employee removals.
            </p>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Queries & Action Log ({unifiedHistoryItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('removed')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'removed'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-rose-600 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-300'
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            <span>Removed Employees ({removedEmployees.length})</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD SUMMARY KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Queries */}
        <div
          onClick={() => {
            setActiveTab('all');
            setStatusFilter('All');
          }}
          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-2xs ${
            statusFilter === 'All' && activeTab === 'all'
              ? 'bg-blue-50/90 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/30'
              : 'bg-white dark:bg-[#101726] border-slate-200 dark:border-slate-800 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Queries</span>
            <Activity className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {dashboardStats.totalQueries}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            Database record events
          </div>
        </div>

        {/* Approved Queries */}
        <div
          onClick={() => {
            setActiveTab('all');
            setStatusFilter('Approved');
          }}
          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-2xs ${
            statusFilter === 'Approved' && activeTab === 'all'
              ? 'bg-emerald-50/90 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/30'
              : 'bg-white dark:bg-[#101726] border-slate-200 dark:border-slate-800 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Approved</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {dashboardStats.approvedQueries}
          </div>
          <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
            Fulfilled by Admin
          </div>
        </div>

        {/* Rejected Queries */}
        <div
          onClick={() => {
            setActiveTab('all');
            setStatusFilter('Rejected');
          }}
          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-2xs ${
            statusFilter === 'Rejected' && activeTab === 'all'
              ? 'bg-rose-50/90 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 ring-2 ring-rose-500/30'
              : 'bg-white dark:bg-[#101726] border-slate-200 dark:border-slate-800 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Rejected</span>
            <XCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {dashboardStats.rejectedQueries}
          </div>
          <div className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">
            Remarks provided
          </div>
        </div>

        {/* Pending Queries */}
        <div
          onClick={() => {
            setActiveTab('all');
            setStatusFilter('Pending');
          }}
          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-2xs ${
            statusFilter === 'Pending' && activeTab === 'all'
              ? 'bg-amber-50/90 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 ring-2 ring-amber-500/30'
              : 'bg-white dark:bg-[#101726] border-slate-200 dark:border-slate-800 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {dashboardStats.pendingQueries}
          </div>
          <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">
            Awaiting Admin review
          </div>
        </div>

        {/* Removed Queries */}
        <div
          onClick={() => {
            setActiveTab('all');
            setStatusFilter('Removed');
          }}
          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-2xs ${
            statusFilter === 'Removed' && activeTab === 'all'
              ? 'bg-purple-50/90 dark:bg-purple-950/60 border-purple-300 dark:border-purple-700 ring-2 ring-purple-500/30'
              : 'bg-white dark:bg-[#101726] border-slate-200 dark:border-slate-800 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Removed Staff</span>
            <UserX className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
            {dashboardStats.removedQueries}
          </div>
          <div className="text-[10px] text-purple-600/80 dark:text-purple-400/80 mt-0.5">
            Queries by exit staff
          </div>
        </div>

        {/* Total Employees Removed */}
        <div
          onClick={() => setActiveTab('removed')}
          className={`p-4 rounded-xl border transition-all cursor-pointer shadow-2xs ${
            activeTab === 'removed'
              ? 'bg-red-500/15 border-red-500/40 ring-2 ring-red-500/30'
              : 'bg-white dark:bg-[#101726] border-slate-200 dark:border-slate-800 hover:border-red-400'
          }`}
        >
          <div className="flex items-center justify-between text-red-600 dark:text-red-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Staff Removed</span>
            <UserX className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
            {dashboardStats.totalEmployeesRemoved}
          </div>
          <div className="text-[10px] text-red-600/80 dark:text-red-400/80 mt-0.5">
            Permanent exit log
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="bg-white dark:bg-[#101726] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by Employee Name, Employee ID, Badge, Query Type, Admin Name, or Reason..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="Requisitions">Hardware Requisitions</option>
            <option value="SIM">SIM & Telecom</option>
            <option value="Queries">Staff Asset Queries</option>
            <option value="Services">Hardware Repairs</option>
            <option value="Removals">Employee Exit Logs</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Approved">Approved / Resolved</option>
            <option value="Rejected">Rejected / Unresolved</option>
            <option value="Pending">Pending Review</option>
            <option value="In Progress">In Progress</option>
            <option value="Removed">Removed Staff</option>
          </select>
        </div>
      </div>

      {/* TAB 1: ALL QUERY & ACTION HISTORY TABLE */}
      {activeTab === 'all' && (
        <div className="bg-white dark:bg-[#101726] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Employee Queries & Admin Action Audit Log ({filteredHistoryItems.length})
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Displaying {filteredHistoryItems.length} of {unifiedHistoryItems.length} records
            </span>
          </div>

          {filteredHistoryItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Query / Request Type</th>
                    <th className="py-3 px-4">Action Taken</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Reason / Remark</th>
                    <th className="py-3 px-4">Admin Name</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4 text-right">Action History</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredHistoryItems.map(item => {
                    const isExpanded = expandedId === item.id;
                    return (
                      <React.Fragment key={item.id}>
                        <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors">
                          {/* Employee */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center shrink-0">
                                {item.employeeName.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span>{item.employeeName}</span>
                                  {item.isEmployeeRemoved && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                                      Removed
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                  ID: {item.employeeId} {item.companyEmployeeNumber ? `• Badge: ${item.companyEmployeeNumber}` : ''}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Query / Request Type */}
                          <td className="py-3.5 px-4 max-w-xs">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-block mb-1 ${item.categoryColor}`}>
                              {item.categoryLabel}
                            </span>
                            <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                              {item.queryType}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                              {item.queryDetails}
                            </div>
                          </td>

                          {/* Action Taken */}
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                            {item.actionTaken}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              item.statusVariant === 'approved'
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                                : item.statusVariant === 'rejected'
                                ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                                : item.statusVariant === 'pending'
                                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                                : item.statusVariant === 'removed'
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                : 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                            }`}>
                              {item.statusVariant === 'approved' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                              {item.statusVariant === 'rejected' && <XCircle className="w-3 h-3 text-rose-600" />}
                              {item.statusVariant === 'pending' && <Clock className="w-3 h-3 text-amber-600" />}
                              {item.statusVariant === 'removed' && <UserX className="w-3 h-3 text-rose-600" />}
                              <span>{item.status}</span>
                            </span>
                          </td>

                          {/* Reason / Remark */}
                          <td className="py-3.5 px-4 max-w-sm">
                            <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 line-clamp-2">
                              <span className="font-bold text-slate-900 dark:text-white">Remark: </span>
                              {item.reasonRemark}
                            </div>
                          </td>

                          {/* Admin Name */}
                          <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                            <div className="flex items-center gap-1">
                              <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span>{item.adminName}</span>
                            </div>
                          </td>

                          {/* Date & Time */}
                          <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600 dark:text-slate-400">
                            {formatDateDisplay(item.date)}
                          </td>

                          {/* Action History Button */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : item.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                            >
                              <span>History</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        </tr>

                        {/* Expandable Lifecycle Stepper */}
                        {isExpanded && (
                          <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
                            <td colSpan={8} className="p-4 sm:p-5">
                              <div className="space-y-3 max-w-4xl">
                                <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2">
                                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                                    <span>Lifecycle Progress & Action History Timeline ({item.id})</span>
                                  </h4>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    {item.categoryLabel} &bull; {item.employeeName}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  {item.timeline.map((step, idx) => (
                                    <div
                                      key={idx}
                                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                                        step.isRejected
                                          ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                                          : step.isDone
                                          ? 'bg-white dark:bg-[#101726] border-emerald-200 dark:border-emerald-800/80'
                                          : 'bg-white dark:bg-[#101726] border-slate-200 dark:border-slate-800 opacity-60'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-1 font-bold">
                                        <span className="flex items-center gap-1.5">
                                          <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono ${
                                            step.isRejected ? 'bg-rose-600 text-white' : step.isDone ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                                          }`}>
                                            {idx + 1}
                                          </span>
                                          <span>{step.title}</span>
                                        </span>
                                        {step.timestamp && (
                                          <span className="text-[10px] font-mono text-slate-400">
                                            {step.timestamp}
                                          </span>
                                        )}
                                      </div>
                                      {step.description && (
                                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                          {step.description}
                                        </p>
                                      )}
                                      {step.actor && (
                                        <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold pt-0.5">
                                          Actor: {step.actor}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50/50 dark:bg-slate-900/30">
              <Activity className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No query or action history records match your search filters
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Try clearing the search query or resetting category/status filter options.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REMOVED EMPLOYEES & REMOVAL HISTORY */}
      {activeTab === 'removed' && (
        <div className="bg-white dark:bg-[#101726] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Removed Employees & Permanent Exit History ({removedEmployees.length})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Audit record of removed workforce members, mandatory removal reasons, Admin actors, and prior request history snapshots.
                </p>
              </div>
            </div>
          </div>

          {removedEmployees.length > 0 ? (
            <div className="space-y-4">
              {removedEmployees.map(rem => {
                const isExpanded = expandedId === rem.id;
                const snapshot = rem.snapshot || { assetRequests: [], simRequests: [], assetQueries: [], serviceRecords: [] };
                const totalReqs = (snapshot.assetRequests?.length || 0) + (snapshot.simRequests?.length || 0) + (snapshot.assetQueries?.length || 0) + (snapshot.serviceRecords?.length || 0);

                return (
                  <div
                    key={rem.id}
                    className="p-4 sm:p-5 rounded-2xl border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10 space-y-4 shadow-2xs"
                  >
                    {/* Header bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-200/60 dark:border-rose-900/40">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold flex items-center justify-center shrink-0 border border-rose-500/20">
                          {rem.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                              {rem.name}
                            </h3>
                            <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                              {rem.employeeId}
                            </span>
                            {rem.companyEmployeeNumber && (
                              <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                Badge: {rem.companyEmployeeNumber}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {rem.designation || 'Staff'} &bull; {rem.department || 'Department'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-start sm:self-center">
                        <div className="text-right text-xs">
                          <div className="text-[10px] font-semibold text-slate-400 uppercase">Removed By</div>
                          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 justify-end">
                            <Shield className="w-3 h-3 text-blue-500" />
                            <span>{rem.removedBy}</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {formatDateDisplay(rem.removedAt)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* MANDATORY REMOVAL REASON CALLOUT BOX */}
                    <div className="p-3.5 rounded-xl bg-rose-100/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-950 dark:text-rose-200 flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-rose-600 text-white shrink-0 mt-0.5">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold uppercase tracking-wider block text-rose-700 dark:text-rose-300">
                          Mandatory Removal Reason:
                        </span>
                        <p className="text-xs font-semibold leading-relaxed">
                          "{rem.removalReason}"
                        </p>
                      </div>
                    </div>

                    {/* Snapshot Summary Footer */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span>
                          <strong>Prior History Snapshot:</strong> {totalReqs} total request record{totalReqs !== 1 ? 's' : ''} preserved
                        </span>
                        <span>&bull;</span>
                        <span>
                          {snapshot.assignedComputersCount || 0} Workstation(s) unassigned
                        </span>
                        <span>&bull;</span>
                        <span>
                          {snapshot.assignedAssetsCount || 0} Peripheral(s) returned to stock
                        </span>
                        <span>&bull;</span>
                        <span>
                          {snapshot.assignedSimsCount || 0} SIM(s) released
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : rem.id)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide History Snapshot' : 'View Full Historical Requests'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Expandable Prior Requests Snapshot Details */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-rose-200/60 dark:border-rose-900/40 space-y-3">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-blue-500" />
                          <span>Historical Requests & Approvals Before Removal</span>
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {/* Hardware Requisitions */}
                          <div className="p-3 bg-white dark:bg-[#101726] rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                            <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 text-[11px]">
                              <Layers className="w-3.5 h-3.5" />
                              <span>Equipment Requisitions ({snapshot.assetRequests?.length || 0})</span>
                            </span>
                            {snapshot.assetRequests && snapshot.assetRequests.length > 0 ? (
                              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                {snapshot.assetRequests.map(r => (
                                  <div key={r.id} className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-[11px] space-y-0.5">
                                    <div className="flex items-center justify-between font-bold">
                                      <span>#{r.id} ({r.items?.[0]?.assetType})</span>
                                      <span className="font-mono text-[10px] text-blue-500">{r.status}</span>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-400">{r.reason}</p>
                                    {r.adminNotes && (
                                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                        <strong>Admin Remark:</strong> {r.adminNotes}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400 italic">No equipment requisitions logged.</div>
                            )}
                          </div>

                          {/* SIM Requests */}
                          <div className="p-3 bg-white dark:bg-[#101726] rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-[11px]">
                              <Smartphone className="w-3.5 h-3.5" />
                              <span>SIM Requests ({snapshot.simRequests?.length || 0})</span>
                            </span>
                            {snapshot.simRequests && snapshot.simRequests.length > 0 ? (
                              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                {snapshot.simRequests.map(r => (
                                  <div key={r.id} className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-[11px] space-y-0.5">
                                    <div className="flex items-center justify-between font-bold">
                                      <span>#{r.id} ({r.requestType})</span>
                                      <span className="font-mono text-[10px] text-emerald-500">{r.status}</span>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-400">{r.reason}</p>
                                    {(r.adminRemarks || r.resolutionRemarks) && (
                                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                        <strong>Admin Remark:</strong> {r.adminRemarks || r.resolutionRemarks}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400 italic">No SIM requests logged.</div>
                            )}
                          </div>

                          {/* Staff Asset Queries */}
                          <div className="p-3 bg-white dark:bg-[#101726] rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                            <span className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 text-[11px]">
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>Staff Asset Queries ({snapshot.assetQueries?.length || 0})</span>
                            </span>
                            {snapshot.assetQueries && snapshot.assetQueries.length > 0 ? (
                              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                {snapshot.assetQueries.map(q => (
                                  <div key={q.id} className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-[11px] space-y-0.5">
                                    <div className="flex items-center justify-between font-bold">
                                      <span>#{q.id} ({q.queryType})</span>
                                      <span className="font-mono text-[10px] text-purple-500">{q.status}</span>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-400">{q.subject}</p>
                                    {(q.resolutionNotes || q.stillUnresolvedNotes) && (
                                      <div className="text-[10px] text-purple-600 dark:text-purple-400">
                                        <strong>Admin Remark:</strong> {q.resolutionNotes || q.stillUnresolvedNotes}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400 italic">No asset queries logged.</div>
                            )}
                          </div>

                          {/* Hardware Service Records */}
                          <div className="p-3 bg-white dark:bg-[#101726] rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                            <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 text-[11px]">
                              <Wrench className="w-3.5 h-3.5" />
                              <span>Hardware Maintenance ({snapshot.serviceRecords?.length || 0})</span>
                            </span>
                            {snapshot.serviceRecords && snapshot.serviceRecords.length > 0 ? (
                              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                {snapshot.serviceRecords.map(s => (
                                  <div key={s.id} className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-[11px] space-y-0.5">
                                    <div className="flex items-center justify-between font-bold">
                                      <span>#{s.id} ({s.problemCategory})</span>
                                      <span className="font-mono text-[10px] text-amber-500">{s.serviceStatus}</span>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-400">{s.problem}</p>
                                    {s.resolution && (
                                      <div className="text-[10px] text-amber-600 dark:text-amber-400">
                                        <strong>Resolution:</strong> {s.resolution}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400 italic">No hardware repairs logged.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <UserX className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No removed employees logged in the database yet
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                When an employee is removed from the active workforce, their exit timestamp, mandatory removal reason, and historical requests snapshot will be archived here.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
