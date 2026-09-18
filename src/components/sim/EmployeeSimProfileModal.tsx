import React, { useState, useMemo } from 'react';
import {
  X,
  User,
  Smartphone,
  Phone,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Building2,
  CreditCard,
  Plus,
  RotateCcw,
  Pause,
  ArrowRightLeft,
  Edit2,
  MessageCircle,
  Mail,
  Sparkles,
  Info,
  Radio,
  Wifi,
  Printer,
  CheckCircle2,
  SlidersHorizontal,
  LayoutGrid,
  Table as TableIcon,
  Tag,
  Briefcase,
  Layers,
  Hash,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SimCard, Employee } from '../../types';
import {
  getEmployeeSimCards,
  getSimUsageBadgeStyle,
  getSimStatusStyle,
  getSimPurposeStyle,
  getSimTypeBadgeStyle,
  calculateSimMonthlyExpense,
  getEmployeeActiveSimCards,
  formatINR,
  generateDirectWhatsAppUrl,
} from '../../utils/simUtils';

interface EmployeeSimProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string | null;
  onAssignSim?: (employeeId: string) => void;
  onRechargeSim?: (sim: SimCard) => void;
  onSuspendSim?: (sim: SimCard) => void;
  onReassignSim?: (simId: string) => void;
  onEditSim?: (sim: SimCard) => void;
  onOpenFullProfile?: (employeeId: string) => void;
}

export const EmployeeSimProfileModal: React.FC<EmployeeSimProfileModalProps> = ({
  isOpen,
  onClose,
  employeeId,
  onAssignSim,
  onRechargeSim,
  onSuspendSim,
  onReassignSim,
  onEditSim,
  onOpenFullProfile,
}) => {
  const {
    employees,
    simCards,
    simRecharges,
    userRole,
    reactivateSimCard,
    unassignSimCard,
  } = useApp();

  const isAdmin = userRole === 'admin';
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [displayMode, setDisplayMode] = useState<'cards' | 'table'>('cards');

  // Locate the target employee from live database state
  const employee: Employee | null = useMemo(() => {
    if (!employeeId) return null;
    return employees.find(e => e.id === employeeId || e.employeeId === employeeId) || null;
  }, [employees, employeeId]);

  // Always resolve latest assigned SIM cards from live database
  const assignedSims: SimCard[] = useMemo(() => {
    if (!employee) return [];
    return getEmployeeSimCards(employee, simCards);
  }, [employee, simCards]);

  // Associated recharges for these SIM cards
  const employeeRecharges = useMemo(() => {
    if (!employee || assignedSims.length === 0) return [];
    const simIdSet = new Set(assignedSims.map(s => s.id));
    const phoneSet = new Set(assignedSims.map(s => s.contactNumber.replace(/\D/g, '')));
    return simRecharges
      .filter(r => simIdSet.has(r.simId) || (r.contactNumber && phoneSet.has(r.contactNumber.replace(/\D/g, ''))))
      .sort((a, b) => new Date(b.rechargeDate).getTime() - new Date(a.rechargeDate).getTime());
  }, [assignedSims, simRecharges, employee]);

  const simCount = assignedSims.length;
  const activeCount = assignedSims.filter(s => s.status === 'Active' || s.status === 'Assigned').length;
  const suspendedCount = assignedSims.filter(s => s.status === 'Suspended').length;
  const usageStyle = getSimUsageBadgeStyle(simCount);
  const monthlyExpense = calculateSimMonthlyExpense(activeCount);

  // Filtered SIMs according to status filter
  const displayedSims = useMemo(() => {
    if (statusFilter === 'active') {
      return assignedSims.filter(s => s.status === 'Active' || s.status === 'Assigned');
    }
    if (statusFilter === 'suspended') {
      return assignedSims.filter(s => s.status === 'Suspended');
    }
    return assignedSims;
  }, [assignedSims, statusFilter]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleReactivate = (sim: SimCard) => {
    if (window.confirm(`Reactivate SIM line ${sim.contactNumber} for ${employee?.name}?`)) {
      reactivateSimCard(sim.id);
    }
  };

  const handleRelease = (sim: SimCard) => {
    if (
      window.confirm(
        `Are you sure you want to release SIM ${sim.contactNumber}? It will be returned to company inventory.`
      )
    ) {
      unassignSimCard(sim.id);
    }
  };

  // Helper for carrier specific styling
  const getCarrierTheme = (carrier?: string) => {
    const c = (carrier || '').toLowerCase();
    if (c.includes('jio')) {
      return {
        brand: 'Jio True 5G',
        gradient: 'from-blue-900/90 via-blue-950 to-zinc-950',
        border: 'border-blue-500/40',
        chipBg: 'from-blue-400 to-indigo-500',
        accent: 'text-blue-400',
        badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        cardGlow: 'shadow-blue-500/10',
      };
    }
    if (c.includes('airtel')) {
      return {
        brand: 'Airtel 5G Plus',
        gradient: 'from-red-950/90 via-zinc-900 to-zinc-950',
        border: 'border-red-500/40',
        chipBg: 'from-red-400 to-rose-500',
        accent: 'text-red-400',
        badge: 'bg-red-500/20 text-red-300 border-red-500/40',
        cardGlow: 'shadow-red-500/10',
      };
    }
    if (c.includes('vi') || c.includes('vodafone') || c.includes('idea')) {
      return {
        brand: 'Vi™ Business',
        gradient: 'from-amber-950/80 via-zinc-900 to-zinc-950',
        border: 'border-amber-500/40',
        chipBg: 'from-amber-400 to-yellow-500',
        accent: 'text-amber-400',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        cardGlow: 'shadow-amber-500/10',
      };
    }
    return {
      brand: `${carrier || 'Corporate'} Enterprise`,
      gradient: 'from-zinc-900 via-zinc-900 to-zinc-950',
      border: 'border-zinc-700',
      chipBg: 'from-zinc-400 to-zinc-600',
      accent: 'text-zinc-300',
      badge: 'bg-zinc-800 text-zinc-300 border-zinc-700',
      cardGlow: 'shadow-zinc-500/10',
    };
  };

  const handlePrintProfile = () => {
    window.print();
  };

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#0e131f] border border-zinc-700/80 rounded-3xl shadow-2xl overflow-hidden text-zinc-100 max-h-[94vh] flex flex-col my-auto ring-1 ring-white/10">
        
        {/* ================= TOP EXECUTIVE APP BAR ================= */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-gradient-to-r from-zinc-950 via-[#111827] to-zinc-950">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 p-0.5 shadow-md shadow-orange-500/25 flex items-center justify-center">
              <div className="w-full h-full rounded-[10px] bg-zinc-950 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-orange-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Telecom & SIM Management Profile</span>
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                  Live Fleet Central
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Official custodian telecom dossier & verified corporate lines
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrintProfile}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-700/80 transition-colors cursor-pointer"
              title="Print official telecom handover summary"
            >
              <Printer className="w-3.5 h-3.5 text-zinc-400" />
              <span>Print Dossier</span>
            </button>

            {onOpenFullProfile && (
              <button
                type="button"
                onClick={() => {
                  onOpenFullProfile(employee.id);
                  onClose();
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
                title="View full IT equipment (laptops, monitors, assets)"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                <span>Personnel Directory</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= SCROLLABLE CONTENT BODY ================= */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-7 space-y-6">

          {/* 1. EMPLOYEE HERO DOSSIER CARD */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#131b2e] via-[#0f172a] to-[#090d16] border border-zinc-700/80 shadow-xl relative overflow-hidden">
            {/* Background ambient lighting */}
            <div className="absolute -top-16 -right-16 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              {/* Profile Identity Info */}
              <div className="flex items-start sm:items-center space-x-5">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-600 p-0.5 shadow-xl shadow-orange-500/20">
                    {employee.photoUrl ? (
                      <img
                        src={employee.photoUrl}
                        alt={employee.name}
                        className="w-full h-full rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-2xl bg-[#0e1526] flex items-center justify-center text-2xl font-black text-orange-400">
                        {employee.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-zinc-900 ${
                      employee.status === 'Active' ? 'bg-emerald-500 ring-2 ring-emerald-500/30' : 'bg-zinc-500'
                    }`}
                    title={`Status: ${employee.status}`}
                  />
                </div>

                <div className="min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-2xl font-black text-white tracking-tight">
                      {employee.name}
                    </h2>

                    <span className="font-mono text-xs font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/30">
                      ID: {employee.employeeId}
                    </span>

                    {employee.companyEmployeeNumber && (
                      <span className="font-mono text-xs text-zinc-300 bg-zinc-800/90 px-2.5 py-1 rounded-lg border border-zinc-700">
                        {employee.companyEmployeeNumber}
                      </span>
                    )}

                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        employee.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {employee.status} Staff
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-sm text-zinc-300">
                    <span className="text-white font-semibold flex items-center space-x-1.5">
                      <Briefcase className="w-4 h-4 text-orange-400" />
                      <span>{employee.designation || 'Staff'}</span>
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span className="flex items-center space-x-1.5 text-zinc-300 font-medium">
                      <Building2 className="w-4 h-4 text-zinc-400" />
                      <span>{employee.department}</span>
                    </span>
                    {employee.team && (
                      <>
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-400">Team: {employee.team}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-4 flex-wrap text-xs text-zinc-400 pt-1">
                    {employee.email && (
                      <a
                        href={`mailto:${employee.email}`}
                        className="flex items-center space-x-1.5 text-zinc-300 hover:text-orange-400 transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{employee.email}</span>
                      </a>
                    )}
                    {employee.phone && (
                      <span className="flex items-center space-x-1.5 font-mono text-zinc-300">
                        <Phone className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Official Contact: {employee.phone}</span>
                      </span>
                    )}
                    {employee.joiningDate && (
                      <span className="flex items-center space-x-1.5 text-zinc-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Tenure since {employee.joiningDate}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons in Hero */}
              {isAdmin && (
                <div className="shrink-0 flex items-center gap-2.5 sm:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (onAssignSim) onAssignSim(employee.id);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-orange-600/30 transition-all flex items-center space-x-2 cursor-pointer active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Assign Additional SIM</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 2. TELECOM RUN-RATE & FLEET METRICS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Total Lines Assigned */}
            <div className="p-4 rounded-2xl bg-[#111728] border border-zinc-800 shadow-sm relative overflow-hidden group hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <span>Assigned SIM Cards</span>
                <Smartphone className="w-4 h-4 text-orange-400" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-black font-mono text-white">{simCount}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${usageStyle.bg} ${usageStyle.text} ${usageStyle.border}`}
                >
                  {usageStyle.label}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Calculated from live assigned lines</p>
            </div>

            {/* Active Lines */}
            <div className="p-4 rounded-2xl bg-[#111728] border border-zinc-800 shadow-sm relative overflow-hidden group hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <span>Active Voice & 5G</span>
                <Radio className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-black font-mono text-emerald-400">{activeCount}</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-ping" />
                  Operational
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Active telecommunication lines</p>
            </div>

            {/* Suspended Lines */}
            <div className="p-4 rounded-2xl bg-[#111728] border border-zinc-800 shadow-sm relative overflow-hidden group hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <span>Suspended / Paused</span>
                <Pause className="w-4 h-4 text-rose-400" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className={`text-3xl font-black font-mono ${suspendedCount > 0 ? 'text-rose-400' : 'text-zinc-500'}`}>
                  {suspendedCount}
                </span>
                {suspendedCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    Needs Action
                  </span>
                ) : (
                  <span className="text-[11px] text-zinc-500">None</span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Temporarily blocked or on hold</p>
            </div>

            {/* Monthly Telecom Budget */}
            <div className="p-4 rounded-2xl bg-[#111728] border border-zinc-800 shadow-sm relative overflow-hidden group hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <span>Monthly Telecom Spend</span>
                <CreditCard className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black font-mono text-emerald-400">
                  {formatINR(monthlyExpense.totalExpense)}
                </span>
                <span className="text-xs font-mono text-zinc-500">/mo</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Base {formatINR(monthlyExpense.baseRecharge)} + 18% GST {formatINR(monthlyExpense.gstAmount)}
              </p>
            </div>
          </div>

          {/* 3. ASSIGNED SIM CARDS: DETAILED SMART CARDS & LIST */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <h4 className="text-base font-bold text-white flex items-center space-x-2">
                  <span>Assigned Corporate SIM Cards</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    {simCount} {simCount === 1 ? 'SIM' : 'SIMs'}
                  </span>
                </h4>
              </div>

              {simCount > 0 && (
                <div className="flex items-center gap-2">
                  {/* Status Filter */}
                  <div className="inline-flex rounded-xl bg-zinc-950 p-1 border border-zinc-800 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setStatusFilter('all')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        statusFilter === 'all'
                          ? 'bg-orange-500 text-white shadow-sm font-bold'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      All ({assignedSims.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('active')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        statusFilter === 'active'
                          ? 'bg-orange-500 text-white shadow-sm font-bold'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Active ({activeCount})
                    </button>
                    {suspendedCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setStatusFilter('suspended')}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          statusFilter === 'suspended'
                            ? 'bg-orange-500 text-white shadow-sm font-bold'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Suspended ({suspendedCount})
                      </button>
                    )}
                  </div>

                  {/* Display Mode: Card vs Table */}
                  <div className="inline-flex rounded-xl bg-zinc-950 p-1 border border-zinc-800 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setDisplayMode('cards')}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        displayMode === 'cards'
                          ? 'bg-zinc-800 text-white'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                      title="Card Layout (Visual Smart Cards)"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDisplayMode('table')}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        displayMode === 'table'
                          ? 'bg-zinc-800 text-white'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                      title="Table Matrix Layout"
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Empty State: No SIMs Assigned */}
            {simCount === 0 ? (
              <div className="py-14 px-6 rounded-3xl bg-[#111728]/80 border border-dashed border-zinc-700 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-zinc-800/90 border border-zinc-700 flex items-center justify-center text-zinc-500 mx-auto">
                  <Smartphone className="w-7 h-7 opacity-50" />
                </div>
                <h5 className="text-base font-bold text-zinc-200">
                  No Corporate SIM Cards Assigned
                </h5>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  {employee.name} ({employee.employeeId}) currently has zero corporate mobile lines in custody.
                  Click below to allocate a SIM card from the company inventory reserve.
                </p>
                {isAdmin && onAssignSim && (
                  <button
                    type="button"
                    onClick={() => onAssignSim(employee.id)}
                    className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-600/25 transition-all cursor-pointer mt-3"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Assign Corporate SIM to {employee.name}</span>
                  </button>
                )}
              </div>
            ) : displayedSims.length === 0 ? (
              <div className="py-8 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center text-xs text-zinc-400">
                No SIM cards match the '{statusFilter}' status filter.
              </div>
            ) : displayMode === 'cards' ? (
              /* ==================== CARD VIEW: VISUAL SIM SMART CARDS ==================== */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedSims.map((sim, index) => {
                  const theme = getCarrierTheme(sim.carrier);
                  const statusStyle = getSimStatusStyle(sim.status);
                  const purposeStyle = getSimPurposeStyle(sim.purpose);
                  const waUrl = generateDirectWhatsAppUrl(
                    sim.contactNumber,
                    `Hello ${employee.name}, contacting you regarding your assigned corporate line (${sim.contactNumber}).`
                  );

                  return (
                    <div
                      key={sim.id}
                      className={`relative rounded-3xl p-5 border bg-gradient-to-br ${theme.gradient} ${
                        sim.status === 'Suspended' ? 'border-rose-500/40' : theme.border
                      } shadow-lg ${theme.cardGlow} transition-all hover:scale-[1.01]`}
                    >
                      {/* Top Row: Metallic SIM Chip & Carrier Brand */}
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
                        <div className="flex items-center space-x-3">
                          {/* Realistic Metallic Golden SIM Chip Graphic */}
                          <div className="w-12 h-10 rounded-lg bg-gradient-to-br from-amber-200 via-amber-400 to-yellow-600 p-0.5 shadow-md shrink-0 relative overflow-hidden border border-amber-300/60">
                            <div className="w-full h-full rounded-[6px] bg-gradient-to-tr from-amber-300 to-yellow-500 flex flex-col justify-between p-1 border border-amber-600/40">
                              <div className="flex justify-between border-b border-amber-700/40 pb-0.5">
                                <span className="w-2.5 h-1 border-r border-amber-700/40" />
                                <span className="w-2.5 h-1 border-l border-amber-700/40" />
                              </div>
                              <div className="h-1.5 rounded border-y border-amber-700/40 bg-amber-400/60" />
                              <div className="flex justify-between border-t border-amber-700/40 pt-0.5">
                                <span className="w-2.5 h-1 border-r border-amber-700/40" />
                                <span className="w-2.5 h-1 border-l border-amber-700/40" />
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-white tracking-wide uppercase">
                                {theme.brand}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-white/20 text-white border border-white/20">
                                5G
                              </span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${getSimTypeBadgeStyle(sim.simType).bg} ${getSimTypeBadgeStyle(sim.simType).text} ${getSimTypeBadgeStyle(sim.simType).border}`}>
                                {getSimTypeBadgeStyle(sim.simType).label}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">
                              Line #{index + 1} • {sim.id}
                            </span>
                          </div>
                        </div>

                        {/* Status Beacon */}
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current animate-pulse" />
                            <span>{statusStyle.label}</span>
                          </span>
                        </div>
                      </div>

                      {/* Primary Mobile Number (Embossed Monospace) */}
                      <div className="py-3">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 block">
                          Official Mobile Number
                        </span>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="font-mono text-xl sm:text-2xl font-black text-white tracking-wider">
                            {sim.contactNumber}
                          </span>

                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleCopy(sim.contactNumber, `num-${sim.id}`)}
                              className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                              title="Copy Phone Number"
                            >
                              {copiedText === `num-${sim.id}` ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>

                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition-colors cursor-pointer"
                              title="Open Direct WhatsApp Web Chat"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Specifications Grid */}
                      <div className="grid grid-cols-2 gap-2.5 py-3 border-y border-white/10 text-xs">
                        <div>
                          <span className="text-zinc-500 block text-[11px]">ICCID (SIM No):</span>
                          <div className="flex items-center space-x-1 font-mono text-zinc-200 font-semibold truncate">
                            <span className="truncate">{sim.simNumber || '8991000...'}</span>
                            {sim.simNumber && (
                              <button
                                type="button"
                                onClick={() => handleCopy(sim.simNumber || '', `iccid-${sim.id}`)}
                                className="text-zinc-400 hover:text-white"
                                title="Copy ICCID"
                              >
                                {copiedText === `iccid-${sim.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <span className="text-zinc-500 block text-[11px]">Purpose:</span>
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${purposeStyle.bg} ${purposeStyle.text} ${purposeStyle.border}`}
                          >
                            {sim.purpose === 'Other' && sim.customPurpose
                              ? `Other: ${sim.customPurpose}`
                              : sim.purpose}
                          </span>
                        </div>

                        <div>
                          <span className="text-zinc-500 block text-[11px]">Project / Allocation:</span>
                          <span className="text-zinc-200 font-semibold truncate block">
                            📁 {sim.project || 'General Fleet'}
                          </span>
                        </div>

                        <div>
                          <span className="text-zinc-500 block text-[11px]">Issued / Allocation Date:</span>
                          <span className="text-zinc-300 flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-zinc-400" />
                            <span>{sim.issueDate || 'Pre-configured'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Remarks & Suspension Reason */}
                      {(sim.remarks || (sim.status === 'Suspended' && sim.suspensionReason)) && (
                        <div className="my-2.5 p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] space-y-1">
                          {sim.remarks && (
                            <p className="text-zinc-300">
                              <strong className="text-zinc-400">Remarks: </strong>
                              {sim.remarks}
                            </p>
                          )}
                          {sim.status === 'Suspended' && sim.suspensionReason && (
                            <p className="text-rose-400 flex items-start space-x-1">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span>
                                <strong>Suspension Reason: </strong>
                                {sim.suspensionReason}
                                {sim.suspendedBy && ` (by ${sim.suspendedBy})`}
                              </span>
                            </p>
                          )}
                        </div>
                      )}

                      {/* Card Actions Toolbar */}
                      {isAdmin && (
                        <div className="pt-3 flex items-center justify-between flex-wrap gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            Management:
                          </span>

                          <div className="flex items-center space-x-1.5 flex-wrap">
                            {/* Log Recharge */}
                            <button
                              type="button"
                              onClick={() => {
                                if (onRechargeSim) onRechargeSim(sim);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                              title="Log Recharge for this line"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>Recharge</span>
                            </button>

                            {/* Suspend / Reactivate */}
                            {sim.status === 'Suspended' ? (
                              <button
                                type="button"
                                onClick={() => handleReactivate(sim)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                                title="Reactivate this SIM"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Reactivate</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if (onSuspendSim) onSuspendSim(sim);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                                title="Suspend this SIM line"
                              >
                                <Pause className="w-3 h-3" />
                                <span>Suspend</span>
                              </button>
                            )}

                            {/* Reassign */}
                            <button
                              type="button"
                              onClick={() => {
                                if (onReassignSim) onReassignSim(sim.id);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                              title="Reassign to another employee"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              <span>Reassign</span>
                            </button>

                            {/* Release to Inventory */}
                            <button
                              type="button"
                              onClick={() => handleRelease(sim)}
                              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs font-semibold transition-colors cursor-pointer"
                              title="Unassign and return to stock"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Release</span>
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => {
                                if (onEditSim) onEditSim(sim);
                              }}
                              className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                              title="Edit SIM Details"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ==================== TABLE VIEW: COMPACT ENTERPRISE MATRIX ==================== */
              <div className="bg-[#111728] border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-zinc-300">
                    <thead className="bg-zinc-950 text-zinc-400 uppercase font-semibold border-b border-zinc-800">
                      <tr>
                        <th className="px-4 py-3">Line #</th>
                        <th className="px-4 py-3">Mobile Number</th>
                        <th className="px-4 py-3">Carrier / Network</th>
                        <th className="px-4 py-3">ICCID (SIM No)</th>
                        <th className="px-4 py-3">Purpose</th>
                        <th className="px-4 py-3">Project</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Allocation Date</th>
                        {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-medium">
                      {displayedSims.map((sim, idx) => {
                        const statusStyle = getSimStatusStyle(sim.status);
                        const purposeStyle = getSimPurposeStyle(sim.purpose);

                        return (
                          <tr key={sim.id} className="hover:bg-zinc-800/30 transition-colors">
                            <td className="px-4 py-3 font-mono text-zinc-500">#{idx + 1}</td>
                            <td className="px-4 py-3 font-mono font-bold text-white text-sm">
                              {sim.contactNumber}
                            </td>
                            <td className="px-4 py-3 font-medium text-zinc-200">{sim.carrier}</td>
                            <td className="px-4 py-3 font-mono text-zinc-400 text-[11px]">{sim.simNumber || '—'}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${purposeStyle.bg} ${purposeStyle.text} ${purposeStyle.border}`}>
                                  {sim.purpose}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getSimTypeBadgeStyle(sim.simType).bg} ${getSimTypeBadgeStyle(sim.simType).text} ${getSimTypeBadgeStyle(sim.simType).border}`}>
                                  {getSimTypeBadgeStyle(sim.simType).label}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-zinc-300">📁 {sim.project}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                <span className="w-1.5 h-1.5 rounded-full mr-1 bg-current" />
                                {statusStyle.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-zinc-400">{sim.issueDate || '—'}</td>
                            {isAdmin && (
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => onRechargeSim && onRechargeSim(sim)}
                                    className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded"
                                    title="Log Recharge"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onReassignSim && onReassignSim(sim.id)}
                                    className="p-1 text-blue-400 hover:bg-blue-500/20 rounded"
                                    title="Reassign"
                                  >
                                    <ArrowRightLeft className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onEditSim && onEditSim(sim)}
                                    className="p-1 text-zinc-400 hover:text-white rounded"
                                    title="Edit"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* 4. HISTORICAL RECHARGES AUDIT TRAIL */}
          {employeeRecharges.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Recharge History for {employee.name}'s Corporate Lines</span>
              </h4>

              <div className="rounded-2xl bg-[#111728] border border-zinc-800 overflow-hidden shadow-md">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase font-semibold border-b border-zinc-800">
                    <tr>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Line / Mobile No</th>
                      <th className="px-4 py-2.5">Plan / Commercial Pack</th>
                      <th className="px-4 py-2.5">Base</th>
                      <th className="px-4 py-2.5">GST (18%)</th>
                      <th className="px-4 py-2.5 text-right">Total Paid</th>
                      <th className="px-4 py-2.5">Mode & Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono">
                    {employeeRecharges.slice(0, 5).map(r => (
                      <tr key={r.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-2.5 text-zinc-400">{r.rechargeDate}</td>
                        <td className="px-4 py-2.5 font-bold text-white">{r.contactNumber}</td>
                        <td className="px-4 py-2.5 font-sans text-zinc-200">{r.planDescription}</td>
                        <td className="px-4 py-2.5 text-zinc-400">{formatINR(r.rechargeAmount)}</td>
                        <td className="px-4 py-2.5 text-blue-400">+{formatINR(r.gstAmount)}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-emerald-400">
                          {formatINR(r.totalAmount || r.rechargeAmount)}
                        </td>
                        <td className="px-4 py-2.5 text-zinc-400 font-sans text-[11px]">
                          {r.paymentMode} {r.referenceNumber ? `(${r.referenceNumber})` : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div className="shrink-0 px-6 py-4 border-t border-zinc-800/80 bg-gradient-to-r from-zinc-950 via-[#111827] to-zinc-950 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Verified Custody Record • {employee.name} ({employee.employeeId}) • Real-time SQLite Sync
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {isAdmin && onAssignSim && (
              <button
                type="button"
                onClick={() => {
                  onAssignSim(employee.id);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold transition-all cursor-pointer shadow-md shadow-orange-600/20"
              >
                + Assign SIM
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
