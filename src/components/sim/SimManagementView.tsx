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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SimCard, SimPurpose, SimStatus, SIM_PURPOSES } from '../../types';
import { getSimPurposeStyle, getSimStatusStyle, formatINR, generateSimRequestWhatsAppUrl, generateSimSuspensionWhatsAppUrl } from '../../utils/simUtils';
import { AddEditSimModal } from './AddEditSimModal';
import { SuspendSimModal } from './SuspendSimModal';
import { AddRechargeModal } from './AddRechargeModal';
import { RequestSimModal } from './RequestSimModal';

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
    userRole,
    currentUser,
    reactivateSimCard,
    removeSimCard,
    removeSimRecharge,
    updateSimRequestStatus,
    removeSimRequest,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'inventory' | 'recharges' | 'requests' | 'history'>('inventory');

  // Inventory Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPurpose, setSelectedPurpose] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');

  // Recharge Filters
  const [rechargeSearch, setRechargeSearch] = useState('');
  const [rechargeMonth, setRechargeMonth] = useState<string>('all');
  const [rechargeYear, setRechargeYear] = useState<string>('all');

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingSim, setEditingSim] = useState<SimCard | null>(null);

  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [suspendingSim, setSuspendingSim] = useState<SimCard | null>(null);

  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [rechargeTargetSim, setRechargeTargetSim] = useState<SimCard | null>(null);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestType, setRequestType] = useState<'Additional SIM' | 'Suspend SIM'>('Additional SIM');

  // Metrics calculation
  const totalSims = simCards.length;
  const activeSims = simCards.filter(s => s.status === 'Active').length;
  const assignedSims = simCards.filter(s => s.status === 'Assigned').length;
  const suspendedSims = simCards.filter(s => s.status === 'Suspended').length;
  const availableSims = simCards.filter(s => s.status === 'Available').length;
  const pendingRequests = simRequests.filter(r => r.status === 'Pending').length;
  const pendingSuspensions = simRequests.filter(r => r.status === 'Pending' && r.requestType === 'Suspend SIM').length;

  const totalRechargeSpend = useMemo(() => {
    return simRecharges.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
  }, [simRecharges]);

  const totalGstClaimed = useMemo(() => {
    return simRecharges.reduce((sum, r) => sum + (Number(r.gstAmount) || 0), 0);
  }, [simRecharges]);

  // Unique projects list
  const allProjects = useMemo(() => {
    const set = new Set<string>();
    simCards.forEach(s => {
      if (s.project && s.project.trim()) set.add(s.project.trim());
    });
    return Array.from(set).sort();
  }, [simCards]);

  // Project-wise SIM summary breakdown (Requirement 5)
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
      if (s.status === 'Active') item.active += 1;
      if (s.status === 'Suspended') item.suspended += 1;
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [simCards]);

  // Filtered Inventory SIM list
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
        (sim.remarks && sim.remarks.toLowerCase().includes(q));

      const matchStatus = selectedStatus === 'all' || sim.status === selectedStatus;
      const matchPurpose = selectedPurpose === 'all' || sim.purpose === selectedPurpose;
      const matchProject = selectedProject === 'all' || (sim.project && sim.project.trim().toLowerCase() === selectedProject.trim().toLowerCase());
      const matchEmployee = selectedEmployee === 'all' || sim.assignedEmployeeId === selectedEmployee;

      return matchSearch && matchStatus && matchPurpose && matchProject && matchEmployee;
    });
  }, [simCards, searchQuery, selectedStatus, selectedPurpose, selectedProject, selectedEmployee]);

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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-orange-950/40 border border-zinc-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Telecom & SIM Card Master
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Live Unified Sync
                </span>
              </h1>
              <p className="text-sm text-zinc-400">
                Centralized management of corporate mobile numbers, employee allocations, business purposes, and recharge expenditure
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setRequestType('Additional SIM');
              setIsRequestModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 text-sm font-medium transition-colors flex items-center space-x-2"
          >
            <Send className="w-4 h-4 text-orange-400" />
            <span>Request SIM</span>
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => {
                  setRechargeTargetSim(null);
                  setIsRechargeModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium transition-colors flex items-center space-x-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Log Recharge</span>
              </button>

              <button
                onClick={() => {
                  setEditingSim(null);
                  setIsAddEditModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium shadow-lg shadow-orange-600/25 transition-all flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add New SIM</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-sm space-y-1">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Total SIMs</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white font-mono">{totalSims}</span>
            <Smartphone className="w-4 h-4 text-zinc-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-sm space-y-1">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Active Lines</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-400 font-mono">{activeSims}</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-sm space-y-1">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Suspended</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-rose-400 font-mono">{suspendedSims}</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-sm space-y-1">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Available / Buffer</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-blue-400 font-mono">{availableSims}</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-sm space-y-1">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Pending Requests</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-400 font-mono">{pendingRequests}</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-sm space-y-1">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Total Recharges</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-emerald-400 font-mono">{formatINR(totalRechargeSpend)}</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Persistent Pending Action Banner if there are pending actions */}
      {(suspendedSims > 0 || pendingRequests > 0) && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-amber-200">
                ⚠️ Pending Telecom Actions Require Attention
              </p>
              <p className="text-xs text-amber-300/80">
                {suspendedSims > 0 && `• ${suspendedSims} SIM Card(s) currently suspended. `}
                {pendingRequests > 0 && `• ${pendingRequests} Requisition(s) pending approval.`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {pendingRequests > 0 && (
              <button
                onClick={() => setActiveTab('requests')}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-semibold transition-colors"
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
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold transition-colors"
              >
                View Suspended SIMs ({suspendedSims})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="border-b border-zinc-800 flex items-center justify-between overflow-x-auto">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'border-orange-500 text-orange-400 bg-orange-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>SIM Inventory & Allocation</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-zinc-800 text-zinc-300">
              {simCards.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('recharges')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'recharges'
                ? 'border-orange-500 text-orange-400 bg-orange-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Recharge Master & Expenditure</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-zinc-800 text-zinc-300">
              {simRecharges.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'requests'
                ? 'border-orange-500 text-orange-400 bg-orange-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Requests & Approvals</span>
            {pendingRequests > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {pendingRequests}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-orange-500 text-orange-400 bg-orange-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Trail & History</span>
          </button>
        </div>
      </div>

      {/* ==================== TAB 1: INVENTORY & ALLOCATION ==================== */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Project-wise SIM Usage Overview Cards (Requirement 5) */}
          {projectWiseSummary.length > 0 && (
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-orange-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Project-Wise SIM Allocation & Breakdown
                  </h3>
                </div>
                <span className="text-[11px] text-zinc-500">
                  {projectWiseSummary.length} Project{projectWiseSummary.length > 1 ? 's' : ''} active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {projectWiseSummary.map(p => (
                  <div
                    key={p.project}
                    onClick={() => setSelectedProject(selectedProject === p.project ? 'all' : p.project)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedProject === p.project
                        ? 'bg-orange-500/10 border-orange-500/50 shadow-md ring-1 ring-orange-500/50'
                        : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white truncate max-w-[180px]">
                        📁 {p.project}
                      </span>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-300 border border-orange-500/30">
                        {p.total} SIM{p.total > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 text-[10px]">
                      {Object.entries(p.purposes).map(([purp, cnt]) => (
                        <span
                          key={purp}
                          className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium"
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

          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search number, employee, project..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div>
              <select
                value={selectedProject}
                onChange={e => setSelectedProject(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
              >
                <option value="all">All Projects ({allProjects.length})</option>
                {allProjects.map(proj => (
                  <option key={proj} value={proj}>
                    {proj}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Assigned">Assigned Only</option>
                <option value="Available">Available (In Stock)</option>
                <option value="Suspended">Suspended Only</option>
                <option value="Deactivated">Deactivated Only</option>
              </select>
            </div>

            <div>
              <select
                value={selectedPurpose}
                onChange={e => setSelectedPurpose(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
              >
                <option value="all">All Purposes</option>
                {SIM_PURPOSES.map(p => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedEmployee}
                onChange={e => setSelectedEmployee(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
              >
                <option value="all">All Employees</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employeeId || emp.companyEmployeeNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SIM Cards Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-300">
                <thead className="bg-zinc-950/70 text-xs uppercase font-semibold text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="px-5 py-3.5">Contact / SIM Number</th>
                    <th className="px-5 py-3.5">Assigned Employee</th>
                    <th className="px-5 py-3.5">Project</th>
                    <th className="px-5 py-3.5">Purpose</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Carrier / Issue Date</th>
                    <th className="px-5 py-3.5">Remarks / Reason</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-medium">
                  {filteredSims.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-zinc-500">
                        <Smartphone className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">No SIM cards found matching the criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredSims.map(sim => {
                      const statusStyle = getSimStatusStyle(sim.status);
                      const purposeStyle = getSimPurposeStyle(sim.purpose);
                      const displayPurpose = sim.purpose === 'Other' && sim.customPurpose ? `Other: ${sim.customPurpose}` : sim.purpose;

                      return (
                        <tr key={sim.id} className="hover:bg-zinc-800/40 transition-colors">
                          {/* Number */}
                          <td className="px-5 py-4">
                            <div className="flex items-center space-x-2.5">
                              <div className="p-2 rounded-lg bg-zinc-800 text-orange-400 shrink-0">
                                <Phone className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-white font-mono font-bold tracking-wide">
                                  {sim.contactNumber}
                                </span>
                                {sim.simNumber && (
                                  <p className="text-[11px] text-zinc-500 font-mono">
                                    ICCID: {sim.simNumber}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Employee */}
                          <td className="px-5 py-4">
                            {sim.assignedEmployeeName ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (onSelectEmployee && sim.assignedEmployeeId) {
                                    onSelectEmployee(sim.assignedEmployeeId);
                                  }
                                }}
                                className="flex items-center space-x-2 text-left group cursor-pointer"
                                title="View Employee Profile"
                              >
                                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-orange-400 font-bold shrink-0 group-hover:scale-105 transition-transform">
                                  {sim.assignedEmployeeName.charAt(0)}
                                </div>
                                <div>
                                  <span className="text-white font-medium block group-hover:text-orange-400 transition-colors">
                                    {sim.assignedEmployeeName}
                                  </span>
                                </div>
                              </button>
                            ) : (
                              <span className="text-zinc-500 text-xs italic">Unassigned (In Reserve)</span>
                            )}
                          </td>

                          {/* Project */}
                          <td className="px-5 py-4 text-xs font-medium text-zinc-200">
                            {sim.project ? (
                              <span className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-200">
                                📁 {sim.project}
                              </span>
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${purposeStyle.bg} ${purposeStyle.text} ${purposeStyle.border}`}
                            >
                              {displayPurpose}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current" />
                              {statusStyle.label}
                            </span>
                            {sim.status === 'Suspended' && sim.suspensionReason && (
                              <p className="text-[10px] text-rose-400/80 mt-1 truncate max-w-[180px]" title={sim.suspensionReason}>
                                Reason: {sim.suspensionReason}
                              </p>
                            )}
                          </td>

                          {/* Carrier & Date */}
                          <td className="px-5 py-4 text-xs text-zinc-400">
                            <span className="text-zinc-300 font-medium">{sim.carrier || 'N/A'}</span>
                            {sim.issueDate && (
                              <span className="block text-zinc-500 text-[11px]">
                                Issued: {sim.issueDate}
                              </span>
                            )}
                          </td>

                          {/* Remarks */}
                          <td className="px-5 py-4 text-xs text-zinc-400 max-w-[200px]">
                            {sim.remarks ? (
                              <span className="line-clamp-2" title={sim.remarks}>
                                {sim.remarks}
                              </span>
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* Quick Recharge */}
                              {isAdmin && (
                                <button
                                  onClick={() => {
                                    setRechargeTargetSim(sim);
                                    setIsRechargeModalOpen(true);
                                  }}
                                  title="Log Recharge"
                                  className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-400 transition-colors"
                                >
                                  <CreditCard className="w-4 h-4" />
                                </button>
                              )}

                              {/* Suspend / Reactivate */}
                              {isAdmin && sim.status !== 'Suspended' ? (
                                <button
                                  onClick={() => {
                                    setSuspendingSim(sim);
                                    setIsSuspendModalOpen(true);
                                  }}
                                  title="Suspend SIM (Requires Mandatory Reason)"
                                  className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-colors"
                                >
                                  <AlertTriangle className="w-4 h-4" />
                                </button>
                              ) : isAdmin && sim.status === 'Suspended' ? (
                                <button
                                  onClick={() => reactivateSimCard(sim.id)}
                                  title="Reactivate SIM"
                                  className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-400 transition-colors"
                                >
                                  <RotateCcw className="w-4 h-4" />
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
                                title="Share via WhatsApp"
                                className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-green-500/20 text-zinc-400 hover:text-green-400 transition-colors"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>

                              {/* Edit SIM */}
                              {isAdmin && (
                                <button
                                  onClick={() => {
                                    setEditingSim(sim);
                                    setIsAddEditModalOpen(true);
                                  }}
                                  title="Edit Details"
                                  className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-orange-500/20 text-zinc-400 hover:text-orange-400 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
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
                                  title="Delete Record"
                                  className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
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
      )}

      {/* ==================== TAB 2: RECHARGE MASTER & EXPENDITURE ==================== */}
      {activeTab === 'recharges' && (
        <div className="space-y-5">
          {/* Expenditure Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-md">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Gross Recharge Expenditure</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-bold text-emerald-400 font-mono">
                  {formatINR(totalRechargeSpend)}
                </span>
                <CreditCard className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-xs text-zinc-500 mt-1">Total across all {simRecharges.length} logged invoices</p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-md">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total GST Input Claimed</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-bold text-blue-400 font-mono">
                  {formatINR(totalGstClaimed)}
                </span>
                <Tag className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-xs text-zinc-500 mt-1">18% standard corporate tax credit</p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-md">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active SIM Subscriptions</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-bold text-orange-400 font-mono">
                  {activeSims} Active Lines
                </span>
                <Smartphone className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-xs text-zinc-500 mt-1">Recurring monthly telecom fleet</p>
            </div>
          </div>

          {/* Recharge Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search contact no, employee, plan, invoice ref..."
                value={rechargeSearch}
                onChange={e => setRechargeSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div>
              <select
                value={rechargeMonth}
                onChange={e => setRechargeMonth(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
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
            </div>

            <div>
              <select
                value={rechargeYear}
                onChange={e => setRechargeYear(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
              >
                <option value="all">All Years</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>
          </div>

          {/* Recharges Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-300">
                <thead className="bg-zinc-950/70 text-xs uppercase font-semibold text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="px-5 py-3.5">Recharge Date</th>
                    <th className="px-5 py-3.5">Contact / SIM Number</th>
                    <th className="px-5 py-3.5">Employee</th>
                    <th className="px-5 py-3.5">Project</th>
                    <th className="px-5 py-3.5">Plan / Description</th>
                    <th className="px-5 py-3.5">Base Amount</th>
                    <th className="px-5 py-3.5">GST (% & ₹)</th>
                    <th className="px-5 py-3.5">Total Amount</th>
                    <th className="px-5 py-3.5">Payment / Ref</th>
                    {isAdmin && <th className="px-5 py-3.5 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-medium">
                  {filteredRecharges.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 10 : 9} className="text-center py-12 text-zinc-500">
                        <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">No recharge records found.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredRecharges.map(rec => (
                      <tr key={rec.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="px-5 py-4 text-xs font-mono text-zinc-400">
                          {rec.rechargeDate}
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-white font-mono font-bold">
                            {rec.contactNumber}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-xs text-zinc-300">
                          {rec.employeeName || <span className="text-zinc-500 italic">Company Reserve</span>}
                        </td>

                        <td className="px-5 py-4 text-xs font-medium text-zinc-300">
                          {rec.project ? (
                            <span className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300">
                              📁 {rec.project}
                            </span>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-xs text-zinc-200 font-medium max-w-[220px]">
                          {rec.planDescription}
                        </td>

                        <td className="px-5 py-4 text-xs font-mono text-zinc-300">
                          {formatINR(rec.rechargeAmount)}
                        </td>

                        <td className="px-5 py-4 text-xs font-mono text-blue-400">
                          +{formatINR(rec.gstAmount)} ({rec.gstPercentage}%)
                        </td>

                        <td className="px-5 py-4 text-sm font-mono font-bold text-emerald-400">
                          {formatINR(rec.totalAmount)}
                        </td>

                        <td className="px-5 py-4 text-xs text-zinc-400">
                          <span className="block text-zinc-300">{rec.paymentMode || 'UPI'}</span>
                          {rec.referenceNumber && (
                            <span className="text-[11px] font-mono text-zinc-500">
                              Ref: {rec.referenceNumber}
                            </span>
                          )}
                        </td>

                        {isAdmin && (
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => {
                                if (window.confirm('Delete this recharge record?')) {
                                  removeSimRecharge(rec.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-colors"
                              title="Delete Recharge"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: REQUESTS & APPROVAL CENTER ==================== */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">Employee SIM Requisitions & Suspension Requests</h3>
            <button
              onClick={() => {
                setRequestType('Additional SIM');
                setIsRequestModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium shadow-md transition-colors flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit Requisition</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {simRequests.length === 0 ? (
              <div className="p-12 text-center bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500">
                <Send className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No SIM requests submitted yet.</p>
              </div>
            ) : (
              simRequests.map(req => {
                const isPending = req.status === 'Pending';
                const isApproved = req.status === 'Approved';
                const isRejected = req.status === 'Rejected';

                return (
                  <div
                    key={req.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isPending
                        ? 'bg-zinc-900/90 border-amber-500/30 shadow-lg'
                        : isApproved
                        ? 'bg-zinc-900/70 border-emerald-500/20'
                        : 'bg-zinc-900/70 border-zinc-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-2.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              req.requestType === 'Suspend SIM'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                : 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                            }`}
                          >
                            {req.requestType}
                          </span>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              isPending
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                                : isApproved
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {req.status}
                          </span>

                          <span className="text-xs text-zinc-500 font-mono">#{req.id}</span>
                        </div>

                        <h4 className="text-base font-bold text-white">
                          {req.employeeName} ({req.companyEmployeeNumber || req.employeeId})
                        </h4>

                        <p className="text-xs text-zinc-300">
                          <span className="text-zinc-500">Reason / Justification: </span>
                          {req.reason}
                        </p>

                        {req.purpose && (
                          <p className="text-xs text-zinc-400">
                            <span className="text-zinc-500">Intended Purpose: </span>
                            <span className="text-orange-400 font-medium">
                              {req.purpose === 'Other' && req.customPurpose ? `Other (${req.customPurpose})` : req.purpose}
                            </span>
                          </p>
                        )}

                        {req.contactNumber && (
                          <p className="text-xs text-zinc-400">
                            <span className="text-zinc-500">Target Line: </span>
                            <span className="text-rose-400 font-mono font-medium">{req.contactNumber}</span>
                          </p>
                        )}
                      </div>

                      {/* Request Action Buttons for Admin */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
                        {/* WhatsApp Notify */}
                        <button
                          onClick={() => {
                            const waUrl = generateSimRequestWhatsAppUrl(req);
                            window.open(waUrl, '_blank', 'noopener,noreferrer');
                          }}
                          className="px-3 py-1.5 rounded-lg border border-green-500/30 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-medium transition-colors flex items-center space-x-1.5"
                          title="Open WhatsApp Notification"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>

                        {isAdmin && isPending && (
                          <>
                            <button
                              onClick={() => updateSimRequestStatus(req.id, 'Approved', 'Approved by IT Administrator')}
                              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors flex items-center space-x-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>

                            <button
                              onClick={() => {
                                const remarks = prompt('Enter rejection reason:') || 'Rejected by Admin';
                                updateSimRequestStatus(req.id, 'Rejected', remarks);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold transition-colors flex items-center space-x-1.5"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => {
                              if (window.confirm('Delete request record?')) {
                                removeSimRequest(req.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 4: AUDIT TRAIL & HISTORY ==================== */}
      {activeTab === 'history' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden p-6 shadow-lg space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-zinc-800">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Telecom Audit Trail</h3>
              <p className="text-xs text-zinc-400">Immutable chronological log of all SIM allocations, suspensions, purpose edits, and recharges</p>
            </div>
          </div>

          <div className="space-y-3">
            {simAuditLogs.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8">No SIM management events logged yet.</p>
            ) : (
              simAuditLogs.map(log => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400 font-semibold border border-orange-500/20">
                        {log.action}
                      </span>
                      <span className="text-zinc-500 font-mono">By: {log.actor}</span>
                    </div>
                    <p className="text-zinc-200 font-medium">{log.details}</p>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500 shrink-0">
                    {new Date(log.timestamp).toLocaleString('en-IN')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* All Modal Triggers */}
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
    </div>
  );
};
