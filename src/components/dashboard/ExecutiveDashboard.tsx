import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { calculateSimMonthlyExpense, calculateActiveSimActualRechargeExpense, formatINR, getActiveAssignedSimCards, isActiveAssignedSim } from '../../utils/simUtils';
import { EmployeeAvatar } from '../common/EmployeeAvatar';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Calendar,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  DollarSign,
  Headphones,
  Keyboard,
  Laptop,
  Mouse,
  PackageCheck,
  Search,
  Smartphone,
  TrendingUp,
  Wrench,
  X,
  Zap,
  FileSpreadsheet,
  IndianRupee,
  Clock,
  Filter,
  Sparkles,
  Cpu,
  Users,
  Heart,
  ChevronRight,
  Layers,
  ShoppingBag,
  Phone,
  Inbox,
  CheckCheck,
  Check,
  XCircle,
  ExternalLink,
  ShieldAlert,
  Bell,
  LogOut,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { ServiceRecord } from '../../types';
import { DateWiseServiceExpenseGraph } from '../analytics/DateWiseServiceExpenseGraph';

interface ExecutiveDashboardProps {
  onSelectEmployee: (employeeId: string) => void;
  onSelectComputer: (computerId: string) => void;
  onOpenAddService: (computerId?: string) => void;
  onOpenAssignAsset?: (employeeId?: string, assetId?: string, assetType?: any) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  onSelectEmployee,
  onSelectComputer,
  onOpenAddService,
  onOpenAssignAsset,
}) => {
  const {
    employees,
    computers,
    assets,
    serviceRecords,
    purchases,
    assetRequests,
    simCards,
    simRequests,
    simRecharges,
    globalFilters,
    setGlobalFilters,
    setActiveTab,
    setHighlightedRequestId,
    setSimManagementSubTab,
    setHighlightedSimRequestId,
    setActiveSystemSupportTicket,
    updateAssetRequestStatus,
    updateSimRequestStatus,
    showToast,
    exportFleetCSV,
    logout,
  } = useApp();

  const [requestPanelFilter, setRequestPanelFilter] = useState<'all' | 'sim' | 'hardware' | 'service'>('all');

  // Spend Trend Timeframe, Stream & Contact Number Controls
  type SpendGranularity = 'weekly' | 'monthly' | 'yearly';
  type SpendTimeScope = string;
  type SpendChartType = 'area' | 'bar';
  type SpendExpenseStream = 'all' | 'hardware' | 'telecom';

  const [granularity, setGranularity] = useState<SpendGranularity>('monthly');
  const [timeScope, setTimeScope] = useState<SpendTimeScope>('all');
  const [chartType, setChartType] = useState<SpendChartType>('area');
  const [spendStream, setSpendStream] = useState<SpendExpenseStream>('all');
  const [contactNumberFilter, setContactNumberFilter] = useState<string>('all');
  const [pinnedSpendPoint, setPinnedSpendPoint] = useState<any | null>(null);

  // Close pinned SIM details modal on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && pinnedSpendPoint) {
        setPinnedSpendPoint(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pinnedSpendPoint]);

  // Workstation Matrix Filters
  const [matrixSearch, setMatrixSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'equipped' | 'pending' | 'service'>('all');

  // Fleet Asset Repair & Maintenance Analytics State
  const [repairMetricMode, setRepairMetricMode] = useState<'both' | 'repairs' | 'cost'>('both');
  const [repairCategoryFilter, setRepairCategoryFilter] = useState<string>('All');
  const [selectedRepairAssetNumber, setSelectedRepairAssetNumber] = useState<string | null>(null);
  const [repairSortBy, setRepairSortBy] = useState<'cost' | 'repairs' | 'recent' | 'name'>('cost');
  const [repairSearch, setRepairSearch] = useState<string>('');

  // 1. Telemetry Calculations
  const totalEmployees = employees.length;
  const equippedEmployees = employees.filter(emp =>
    computers.some(c => c.assignedEmployeeId === emp.id || c.assignedEmployeeId === emp.employeeId)
  ).length;
  const readinessRate = totalEmployees > 0 ? Math.round((equippedEmployees / totalEmployees) * 100) : 0;

  const totalComputers = computers.length;
  const goodOrNewComputers = computers.filter(c => c.condition === 'Good' || c.condition === 'New').length;
  const fleetHealthScore = totalComputers > 0 ? Math.round((goodOrNewComputers / totalComputers) * 100) : 100;
  const underServiceComputers = computers.filter(c => c.status === 'Under Service');

  // Peripherals calculation (Laptop, Mouse, Keyboard, Headset ONLY)
  const totalAssets = assets.length;
  const assignedAssets = assets.filter(a => a.status === 'Assigned').length;
  const availableAssets = assets.filter(a => a.status === 'Available').length;
  const peripheralUtilization = totalAssets > 0 ? Math.round((assignedAssets / totalAssets) * 100) : 0;

  // Spend Calculations
  const totalLifetimeSpend = useMemo(() => {
    return serviceRecords.reduce((acc, s) => acc + (Number(s.serviceCost) || 0), 0);
  }, [serviceRecords]);

  const maxSingleExpense = useMemo(() => {
    if (serviceRecords.length === 0) return { cost: 0, problem: 'None', asset: 'N/A' };
    const sorted = [...serviceRecords].sort((a, b) => (b.serviceCost || 0) - (a.serviceCost || 0));
    return {
      cost: sorted[0].serviceCost || 0,
      problem: sorted[0].problem || sorted[0].problemCategory,
      asset: sorted[0].assetNumber,
    };
  }, [serviceRecords]);

  const avgTicketCost = useMemo(() => {
    return serviceRecords.length > 0 ? Math.round(totalLifetimeSpend / serviceRecords.length) : 0;
  }, [totalLifetimeSpend, serviceRecords]);

  // Purchases Fleet & Capital Calculations
  const totalPurchasesCost = useMemo(() => {
    return purchases.reduce((acc, p) => acc + (Number(p.grandTotalCost) || 0), 0);
  }, [purchases]);

  const inStockPurchasesCount = useMemo(() => {
    return purchases.filter(p => p.status === 'In Stock').length;
  }, [purchases]);

  const assignedPurchasesCount = useMemo(() => {
    return purchases.filter(p => p.status === 'Assigned').length;
  }, [purchases]);

  // SIM Fleet & Expense Telemetry
  const totalSims = simCards.length;
  const activeSims = simCards.filter(s => s.status === 'Active').length;
  const suspendedSims = simCards.filter(s => s.status === 'Suspended').length;
  const availableSims = simCards.filter(s => s.status === 'Available').length;
  
  const pendingAssetRequests = useMemo(() => assetRequests.filter(r => r.status === 'Pending'), [assetRequests]);
  const pendingSimRequests = useMemo(() => simRequests.filter(r => r.status === 'Pending' || r.status === 'In Progress'), [simRequests]);
  const pendingSuspensionRequests = useMemo(() => simRequests.filter(r => r.status === 'Pending' && r.requestType === 'Suspend SIM').length, [simRequests]);
  const pendingAdditionalSimRequests = useMemo(() => simRequests.filter(r => r.status === 'Pending' && r.requestType === 'Additional SIM').length, [simRequests]);
  const totalPendingActionableRequests = pendingAssetRequests.length + pendingSimRequests.length + underServiceComputers.length;

  const simIssueRequests = useMemo(() => simRequests.filter(r => r.requestType === 'Report Issue'), [simRequests]);
  const openSimIssues = useMemo(() => simIssueRequests.filter(r => r.status === 'Pending' || r.status === 'In Progress').length, [simIssueRequests]);
  const urgentSimIssues = useMemo(() => simIssueRequests.filter(r => r.urgency === 'Urgent' && r.status !== 'Resolved' && r.status !== 'Rejected').length, [simIssueRequests]);
  const inProgressSimIssues = useMemo(() => simIssueRequests.filter(r => r.status === 'In Progress').length, [simIssueRequests]);
  const resolvedSimIssues = useMemo(() => simIssueRequests.filter(r => r.status === 'Resolved').length, [simIssueRequests]);

  const assignedSimCards = useMemo(() => {
    return getActiveAssignedSimCards(simCards);
  }, [simCards]);

  const adminSimExpense = useMemo(() => {
    return calculateActiveSimActualRechargeExpense(simCards, simRecharges);
  }, [simCards, simRecharges]);

  const totalSimRechargeSpend = useMemo(() => {
    return adminSimExpense.totalExpense;
  }, [adminSimExpense]);

  // Fleet Asset Repair & Maintenance Analytics Aggregation
  const fleetAssetRepairStatsData = useMemo(() => {
    const assetMap = new Map<string, {
      assetNumber: string;
      assetName: string;
      assetType: string;
      brand: string;
      model: string;
      assignedEmployeeId?: string | null;
      assignedEmployeeName?: string;
      assignedEmployeeDept?: string;
      repairCount: number;
      totalCost: number;
      records: ServiceRecord[];
      lastRepairedDate?: string;
      status: string;
    }>();

    // ID lookup map to match service records saved with computerId/assetId
    const idToAssetKey = new Map<string, string>();

    // 1. Seed with computers
    computers.forEach(c => {
      const key = (c.assetNumber || '').trim().toLowerCase();
      if (!key) return;
      idToAssetKey.set(c.id.toLowerCase(), key);
      const emp = employees.find(e => e.id === c.assignedEmployeeId || e.employeeId === c.assignedEmployeeId);
      const rawType = c.deviceType || (c.assetNumber.toUpperCase().startsWith('DSK') ? 'Desktop' : 'Laptop');
      const normalizedType = rawType.toLowerCase().includes('desk') ? 'Desktop' : 'Laptop';

      assetMap.set(key, {
        assetNumber: c.assetNumber,
        assetName: c.deviceName || `${c.manufacturer || ''} ${c.model || ''}`.trim() || c.assetNumber,
        assetType: normalizedType,
        brand: c.manufacturer || '',
        model: c.model || '',
        assignedEmployeeId: c.assignedEmployeeId,
        assignedEmployeeName: emp ? emp.name : 'Unassigned',
        assignedEmployeeDept: emp ? emp.department : 'Inventory',
        repairCount: 0,
        totalCost: 0,
        records: [],
        status: c.status,
      });
    });

    // 2. Seed with peripheral assets
    assets.forEach(a => {
      const key = (a.assetNumber || '').trim().toLowerCase();
      if (!key) return;
      idToAssetKey.set(a.id.toLowerCase(), key);
      const emp = employees.find(e => e.id === a.assignedEmployeeId || e.employeeId === a.assignedEmployeeId);
      if (!assetMap.has(key)) {
        assetMap.set(key, {
          assetNumber: a.assetNumber,
          assetName: a.deviceName || `${a.brand || ''} ${a.model || ''}`.trim() || a.assetNumber,
          assetType: a.assetType || 'Peripheral',
          brand: a.brand || '',
          model: a.model || '',
          assignedEmployeeId: a.assignedEmployeeId,
          assignedEmployeeName: emp ? emp.name : 'Unassigned',
          assignedEmployeeDept: emp ? emp.department : 'Inventory',
          repairCount: 0,
          totalCost: 0,
          records: [],
          status: a.status,
        });
      }
    });

    // 3. Tally actual service records
    serviceRecords.forEach(rec => {
      const recAssetNum = (rec.assetNumber || '').trim();
      const recCompId = (rec.computerId || '').trim().toLowerCase();

      // Resolve key by assetNumber or by computerId
      let key = recAssetNum ? recAssetNum.toLowerCase() : '';
      if (!key && recCompId && idToAssetKey.has(recCompId)) {
        key = idToAssetKey.get(recCompId)!;
      }
      if (!key && recCompId && assetMap.has(recCompId)) {
        key = recCompId;
      }
      if (!key) return;

      let existing = assetMap.get(key);
      const cost = Number(rec.serviceCost) || 0;

      if (!existing) {
        // Intelligently deduce assetType from assetNumber prefix or deviceName
        const up = key.toUpperCase();
        const devName = (rec.deviceName || '').toLowerCase();
        let resolvedType = 'Laptop';

        if (up.startsWith('LAP') || devName.includes('laptop')) resolvedType = 'Laptop';
        else if (up.startsWith('DSK') || up.startsWith('DESK') || devName.includes('desktop') || devName.includes('tower') || devName.includes('precision')) resolvedType = 'Desktop';
        else if (up.startsWith('MOU') || devName.includes('mouse')) resolvedType = 'Mouse';
        else if (up.startsWith('KEY') || devName.includes('keyboard')) resolvedType = 'Keyboard';
        else if (up.startsWith('HED') || devName.includes('headset') || devName.includes('evolve') || devName.includes('headphone')) resolvedType = 'Headset';
        else if (up.startsWith('MON') || devName.includes('monitor') || devName.includes('ultrasharp') || devName.includes('display')) resolvedType = 'Monitor';
        else if (up.startsWith('PHN') || up.startsWith('MOB') || devName.includes('phone') || devName.includes('galaxy') || devName.includes('iphone')) resolvedType = 'Mobile Phone';

        const emp = employees.find(e => e.id === rec.employeeId || e.employeeId === rec.employeeId || e.name === rec.employeeName);
        existing = {
          assetNumber: rec.assetNumber || key.toUpperCase(),
          assetName: rec.deviceName || rec.assetNumber || key.toUpperCase(),
          assetType: resolvedType,
          brand: '',
          model: '',
          assignedEmployeeId: rec.employeeId,
          assignedEmployeeName: emp ? emp.name : rec.employeeName || 'Unassigned',
          assignedEmployeeDept: emp ? emp.department : 'General',
          repairCount: 0,
          totalCost: 0,
          records: [],
          status: 'Recorded',
        };
        assetMap.set(key, existing);
      }

      existing.repairCount += 1;
      existing.totalCost += cost;
      existing.records.push(rec);
      if (!existing.lastRepairedDate || new Date(rec.serviceDate) > new Date(existing.lastRepairedDate)) {
        existing.lastRepairedDate = rec.serviceDate;
      }
      if ((!existing.assignedEmployeeName || existing.assignedEmployeeName === 'Unassigned') && rec.employeeName) {
        existing.assignedEmployeeName = rec.employeeName;
      }
    });

    const assetTypeColors: { [type: string]: string } = {
      Laptop: '#3b82f6',
      Desktop: '#f59e0b',
      Mouse: '#10b981',
      Keyboard: '#8b5cf6',
      Headset: '#ec4899',
      Monitor: '#06b6d4',
      'Mobile Phone': '#f97316',
      Hardware: '#64748b',
      Peripheral: '#a855f7',
    };

    return Array.from(assetMap.values()).map(item => ({
      ...item,
      color: assetTypeColors[item.assetType] || '#f97316',
      displayName: `${item.assetType} (${item.assetNumber})`,
    }));
  }, [computers, assets, serviceRecords, employees]);

  // Pre-calculate serviced & total counts per category for the filter buttons
  const categoryServicedCounts = useMemo(() => {
    const counts: { [cat: string]: { total: number; serviced: number; cost: number } } = {
      All: { total: 0, serviced: 0, cost: 0 },
      Computers: { total: 0, serviced: 0, cost: 0 },
      Laptop: { total: 0, serviced: 0, cost: 0 },
      Desktop: { total: 0, serviced: 0, cost: 0 },
      Mouse: { total: 0, serviced: 0, cost: 0 },
      Keyboard: { total: 0, serviced: 0, cost: 0 },
      Headset: { total: 0, serviced: 0, cost: 0 },
      Monitor: { total: 0, serviced: 0, cost: 0 },
      'Mobile Phone': { total: 0, serviced: 0, cost: 0 },
    };

    fleetAssetRepairStatsData.forEach(item => {
      const isServiced = item.repairCount > 0;
      const cost = item.totalCost;
      const t = item.assetType.toLowerCase();

      counts.All.total += 1;
      if (isServiced) {
        counts.All.serviced += 1;
        counts.All.cost += cost;
      }

      if (t === 'laptop' || t === 'desktop' || t === 'computer' || t === 'workstation') {
        counts.Computers.total += 1;
        if (isServiced) {
          counts.Computers.serviced += 1;
          counts.Computers.cost += cost;
        }
      }
      if (t === 'laptop') {
        counts.Laptop.total += 1;
        if (isServiced) {
          counts.Laptop.serviced += 1;
          counts.Laptop.cost += cost;
        }
      }
      if (t === 'desktop') {
        counts.Desktop.total += 1;
        if (isServiced) {
          counts.Desktop.serviced += 1;
          counts.Desktop.cost += cost;
        }
      }
      if (t === 'mouse' || t === 'mice') {
        counts.Mouse.total += 1;
        if (isServiced) {
          counts.Mouse.serviced += 1;
          counts.Mouse.cost += cost;
        }
      }
      if (t === 'keyboard') {
        counts.Keyboard.total += 1;
        if (isServiced) {
          counts.Keyboard.serviced += 1;
          counts.Keyboard.cost += cost;
        }
      }
      if (t === 'headset' || t === 'headphones') {
        counts.Headset.total += 1;
        if (isServiced) {
          counts.Headset.serviced += 1;
          counts.Headset.cost += cost;
        }
      }
      if (t === 'monitor' || t === 'display') {
        counts.Monitor.total += 1;
        if (isServiced) {
          counts.Monitor.serviced += 1;
          counts.Monitor.cost += cost;
        }
      }
      if (t.includes('phone') || t.includes('mobile')) {
        counts['Mobile Phone'].total += 1;
        if (isServiced) {
          counts['Mobile Phone'].serviced += 1;
          counts['Mobile Phone'].cost += cost;
        }
      }
    });

    return counts;
  }, [fleetAssetRepairStatsData]);

  // Filter & sort for the Fleet Asset Repair & Maintenance Chart & Cards
  const filteredAssetRepairStats = useMemo(() => {
    let list = fleetAssetRepairStatsData;

    // Category Filter
    if (repairCategoryFilter !== 'All') {
      const target = repairCategoryFilter.toLowerCase().trim();
      if (target === 'computers' || target === 'computer') {
        list = list.filter(a => {
          const t = a.assetType.toLowerCase();
          return t === 'laptop' || t === 'desktop' || t === 'computer' || t === 'workstation';
        });
      } else if (target === 'laptop') {
        list = list.filter(a => a.assetType.toLowerCase() === 'laptop');
      } else if (target === 'desktop') {
        list = list.filter(a => a.assetType.toLowerCase() === 'desktop');
      } else if (target === 'mouse') {
        list = list.filter(a => a.assetType.toLowerCase() === 'mouse' || a.assetType.toLowerCase() === 'mice');
      } else if (target === 'keyboard') {
        list = list.filter(a => a.assetType.toLowerCase() === 'keyboard');
      } else if (target === 'headset') {
        list = list.filter(a => a.assetType.toLowerCase() === 'headset' || a.assetType.toLowerCase() === 'headphones');
      } else if (target === 'monitor') {
        list = list.filter(a => a.assetType.toLowerCase() === 'monitor' || a.assetType.toLowerCase() === 'display');
      } else if (target === 'mobile phone' || target === 'phone' || target === 'mobile') {
        list = list.filter(a => a.assetType.toLowerCase().includes('phone') || a.assetType.toLowerCase().includes('mobile'));
      } else {
        list = list.filter(a => a.assetType.toLowerCase() === target);
      }
    }

    // Search query filter
    if (repairSearch.trim()) {
      const q = repairSearch.toLowerCase();
      list = list.filter(
        a =>
          a.assetNumber.toLowerCase().includes(q) ||
          a.assetName.toLowerCase().includes(q) ||
          a.assetType.toLowerCase().includes(q) ||
          (a.assignedEmployeeName && a.assignedEmployeeName.toLowerCase().includes(q)) ||
          a.records.some(r => r.problem?.toLowerCase().includes(q) || r.workPerformed?.toLowerCase().includes(q))
      );
    }

    // Sorting
    return [...list].sort((a, b) => {
      if (repairSortBy === 'cost') return b.totalCost - a.totalCost;
      if (repairSortBy === 'repairs') return b.repairCount - a.repairCount;
      if (repairSortBy === 'recent') {
        const da = a.lastRepairedDate ? new Date(a.lastRepairedDate).getTime() : 0;
        const db = b.lastRepairedDate ? new Date(b.lastRepairedDate).getTime() : 0;
        return db - da;
      }
      return a.assetNumber.localeCompare(b.assetNumber);
    });
  }, [fleetAssetRepairStatsData, repairCategoryFilter, repairSearch, repairSortBy]);

  // Chart-ready list (shows serviced assets with repairs > 0, or searched items)
  const chartDisplayStats = useMemo(() => {
    if (repairSearch.trim()) {
      return filteredAssetRepairStats.slice(0, 15);
    }
    const serviced = filteredAssetRepairStats.filter(a => a.repairCount > 0);
    if (serviced.length > 0) {
      return serviced.slice(0, 20);
    }
    // Return empty array if zero items in this category have repairs, so clean empty state renders
    return [];
  }, [filteredAssetRepairStats, repairSearch]);

  // Selected Asset Details for Modal/Panel
  const selectedRepairAsset = useMemo(() => {
    if (!selectedRepairAssetNumber) return null;
    return fleetAssetRepairStatsData.find(
      a => a.assetNumber.toLowerCase() === selectedRepairAssetNumber.toLowerCase()
    ) || null;
  }, [fleetAssetRepairStatsData, selectedRepairAssetNumber]);

  // Dynamic Live Ticket for active diagnostic banner
  const liveActiveTicket = useMemo(() => {
    return serviceRecords.find(s => s.serviceStatus === 'In Progress') || null;
  }, [serviceRecords]);

  const latestCompletedTicket = useMemo(() => {
    return serviceRecords.find(s => s.serviceStatus === 'Completed') || null;
  }, [serviceRecords]);

  // Helper: Date parsing supporting YYYY-MM-DD and DD-MM-YYYY
  const parseServiceDate = (dateStr?: string): Date | null => {
    if (!dateStr) return null;
    const s = dateStr.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    }
    if (/^\d{2}-\d{2}-\d{4}/.test(s)) {
      const parts = s.split('-');
      const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };

  // Helper: ISO Calendar Week Metadata
  const getWeekMetadata = (d: Date) => {
    const day = d.getDay();
    const dayOffset = (day + 6) % 7; // Monday = 0, Sunday = 6

    const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dayOffset);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);

    const target = new Date(d.valueOf());
    target.setDate(target.getDate() - dayOffset + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    const weekNum = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
    const targetYear = target.getFullYear();
    const weekKey = `${targetYear}-W${String(weekNum).padStart(2, '0')}`;
    const shortYear = String(targetYear).slice(-2);
    const monStr = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const sunStr = sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return {
      weekKey,
      weekNum,
      year: targetYear,
      label: `W${weekNum} '${shortYear}`,
      subLabel: `${monStr} – ${sunStr}`,
      fullTitle: `Week ${weekNum}, ${targetYear} (${monStr} – ${sunStr})`,
    };
  };

  interface SpendTicketItem {
    id: string;
    type: 'hardware' | 'telecom';
    assetNumber?: string;
    contactNumber?: string;
    project?: string;
    deviceName: string;
    employeeName: string;
    problem: string;
    category: string;
    cost: number;
    baseCost?: number;
    gstAmount?: number;
    date: string;
    technician?: string;
  }

  interface SpendAggregatedPoint {
    key: string;
    label: string;
    subLabel: string;
    fullTitle: string;
    cost: number;
    hardwareCost: number;
    telecomCost: number;
    count: number;
    tickets: SpendTicketItem[];
    year: number;
    yoyGrowth?: number | null;
  }

  // List of unique contact numbers available in system for filtering
  const availableContactNumbers = useMemo(() => {
    const list: { contactNumber: string; employeeName: string; project?: string; carrier?: string }[] = [];
    const seen = new Set<string>();

    simCards.forEach(s => {
      if (s.contactNumber && !seen.has(s.contactNumber)) {
        seen.add(s.contactNumber);
        list.push({
          contactNumber: s.contactNumber,
          employeeName: s.assignedEmployeeName || 'Unassigned',
          project: s.project,
          carrier: s.carrier,
        });
      }
    });

    simRecharges.forEach(r => {
      if (r.contactNumber && !seen.has(r.contactNumber)) {
        seen.add(r.contactNumber);
        list.push({
          contactNumber: r.contactNumber,
          employeeName: r.employeeName || 'Staff Member',
          project: r.project,
        });
      }
    });

    return list.sort((a, b) => a.contactNumber.localeCompare(b.contactNumber));
  }, [simCards, simRecharges]);

  // Unified Raw Spend Items combining Hardware Maintenance & Contact Number Recharges
  const rawSpendItems = useMemo(() => {
    const items: SpendTicketItem[] = [];

    // 1. Hardware Service Records
    if (spendStream === 'all' || spendStream === 'hardware') {
      if (contactNumberFilter === 'all') {
        serviceRecords.forEach(s => {
          const cost = Number(s.serviceCost) || 0;
          items.push({
            id: s.id,
            type: 'hardware',
            assetNumber: s.assetNumber,
            deviceName: s.deviceName || 'Hardware',
            employeeName: s.employeeName || 'Staff Member',
            problem: s.problem || s.problemCategory || 'Hardware Maintenance',
            category: s.problemCategory || 'Hardware Repair',
            cost,
            date: s.serviceDate,
            technician: s.technician,
          });
        });
      }
    }

    // 2. Telecom / SIM Contact Number Recharges (GST Included)
    if (spendStream === 'all' || spendStream === 'telecom') {
      simRecharges.forEach(r => {
        if (contactNumberFilter !== 'all' && r.contactNumber !== contactNumberFilter && r.simId !== contactNumberFilter) {
          return;
        }
        const cost = Number(r.totalAmount) || Number(r.rechargeAmount) || 0;
        const baseCost = Number(r.rechargeAmount) || 0;
        const gstAmount = Number(r.gstAmount) || 0;
        items.push({
          id: r.id,
          type: 'telecom',
          contactNumber: r.contactNumber,
          project: r.project,
          deviceName: `Contact No: ${r.contactNumber}`,
          employeeName: r.employeeName || 'Staff Member',
          problem: `${r.planDescription || 'Telecom Plan'} (${r.project ? r.project + ' • ' : ''}₹${baseCost} + ₹${gstAmount} GST)`,
          category: 'SIM Recharge',
          cost,
          baseCost,
          gstAmount,
          date: r.rechargeDate,
          technician: r.paymentMode || 'UPI',
        });
      });
    }

    return items;
  }, [serviceRecords, simRecharges, spendStream, contactNumberFilter]);

  // 2. Spend Datasets (Weekly, Monthly, Yearly)
  // Weekly Dataset
  const weeklySpendData = useMemo(() => {
    const map: Record<string, SpendAggregatedPoint> = {};

    // Collect all anchor dates (service dates + recharge dates + current date)
    const anchorDates: Date[] = [new Date()];
    rawSpendItems.forEach(item => {
      const d = parseServiceDate(item.date);
      if (d) anchorDates.push(d);
    });

    // Populate surrounding baseline weeks
    anchorDates.forEach(anchor => {
      for (let offset = -4; offset <= 4; offset++) {
        const offsetDate = new Date(anchor);
        offsetDate.setDate(offsetDate.getDate() + offset * 7);
        const meta = getWeekMetadata(offsetDate);
        if (!map[meta.weekKey]) {
          map[meta.weekKey] = {
            key: meta.weekKey,
            label: meta.label,
            subLabel: meta.subLabel,
            fullTitle: meta.fullTitle,
            cost: 0,
            hardwareCost: 0,
            telecomCost: 0,
            count: 0,
            tickets: [],
            year: meta.year,
          };
        }
      }
    });

    rawSpendItems.forEach(ticket => {
      const d = parseServiceDate(ticket.date);
      if (!d) return;
      const meta = getWeekMetadata(d);
      const cost = ticket.cost;

      if (!map[meta.weekKey]) {
        map[meta.weekKey] = {
          key: meta.weekKey,
          label: meta.label,
          subLabel: meta.subLabel,
          fullTitle: meta.fullTitle,
          cost,
          hardwareCost: ticket.type === 'hardware' ? cost : 0,
          telecomCost: ticket.type === 'telecom' ? cost : 0,
          count: 1,
          tickets: [ticket],
          year: meta.year,
        };
      } else {
        map[meta.weekKey].cost += cost;
        if (ticket.type === 'hardware') map[meta.weekKey].hardwareCost += cost;
        if (ticket.type === 'telecom') map[meta.weekKey].telecomCost += cost;
        map[meta.weekKey].count += 1;
        map[meta.weekKey].tickets.push(ticket);
      }
    });

    return Object.values(map).sort((a, b) => a.key.localeCompare(b.key));
  }, [rawSpendItems]);

  // Monthly Dataset starting from August 2024 with clean chronological progression
  const monthlySpendData = useMemo(() => {
    const map: Record<string, SpendAggregatedPoint> = {};

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const activeYears = new Set<number>([currentYear]);
    rawSpendItems.forEach(item => {
      const d = parseServiceDate(item.date);
      if (d) activeYears.add(d.getFullYear());
    });

    const sortedYears = Array.from(activeYears).sort((a, b) => a - b);
    const minYear = sortedYears[0];

    sortedYears.forEach(year => {
      const startM = year === minYear && year === 2024 ? 8 : 1;
      let endM = 12;
      if (year === currentYear) {
        let maxRecordMonthInYear = currentMonth;
        rawSpendItems.forEach(item => {
          const d = parseServiceDate(item.date);
          if (d && d.getFullYear() === currentYear) {
            maxRecordMonthInYear = Math.max(maxRecordMonthInYear, d.getMonth() + 1);
          }
        });
        endM = Math.min(12, maxRecordMonthInYear);
      }

      for (let m = startM; m <= endM; m++) {
        const monthKey = `${year}-${String(m).padStart(2, '0')}`;
        const d = new Date(year, m - 1, 1);
        const monthShort = d.toLocaleString('en-US', { month: 'short' });
        const monthFull = d.toLocaleString('en-US', { month: 'long' });
        const shortYear = String(year).slice(-2);
        map[monthKey] = {
          key: monthKey,
          label: `${monthShort} '${shortYear}`,
          subLabel: `${monthFull} ${year}`,
          fullTitle: `${monthFull} ${year}`,
          cost: 0,
          hardwareCost: 0,
          telecomCost: 0,
          count: 0,
          tickets: [],
          year,
        };
      }
    });

    rawSpendItems.forEach(ticket => {
      const d = parseServiceDate(ticket.date);
      if (!d) return;
      const year = d.getFullYear();
      const monthNum = d.getMonth() + 1;
      const monthKey = `${year}-${String(monthNum).padStart(2, '0')}`;
      const monthShort = d.toLocaleString('en-US', { month: 'short' });
      const monthFull = d.toLocaleString('en-US', { month: 'long' });
      const shortYear = String(year).slice(-2);
      const cost = ticket.cost;

      if (!map[monthKey]) {
        map[monthKey] = {
          key: monthKey,
          label: `${monthShort} '${shortYear}`,
          subLabel: `${monthFull} ${year}`,
          fullTitle: `${monthFull} ${year}`,
          cost,
          hardwareCost: ticket.type === 'hardware' ? cost : 0,
          telecomCost: ticket.type === 'telecom' ? cost : 0,
          count: 1,
          tickets: [ticket],
          year,
        };
      } else {
        map[monthKey].cost += cost;
        if (ticket.type === 'hardware') map[monthKey].hardwareCost += cost;
        if (ticket.type === 'telecom') map[monthKey].telecomCost += cost;
        map[monthKey].count += 1;
        map[monthKey].tickets.push(ticket);
      }
    });

    return Object.values(map).sort((a, b) => a.key.localeCompare(b.key));
  }, [rawSpendItems]);

  // Yearly Dataset
  const yearlySpendData = useMemo(() => {
    const map: Record<string, SpendAggregatedPoint> = {};

    rawSpendItems.forEach(ticket => {
      const d = parseServiceDate(ticket.date);
      if (!d) return;
      const year = d.getFullYear();
      const yearKey = `${year}`;
      const cost = ticket.cost;

      if (!map[yearKey]) {
        map[yearKey] = {
          key: yearKey,
          label: `${year}`,
          subLabel: `Fiscal Year ${year}`,
          fullTitle: `Calendar Year ${year}`,
          cost,
          hardwareCost: ticket.type === 'hardware' ? cost : 0,
          telecomCost: ticket.type === 'telecom' ? cost : 0,
          count: 1,
          tickets: [ticket],
          year,
        };
      } else {
        map[yearKey].cost += cost;
        if (ticket.type === 'hardware') map[yearKey].hardwareCost += cost;
        if (ticket.type === 'telecom') map[yearKey].telecomCost += cost;
        map[yearKey].count += 1;
        map[yearKey].tickets.push(ticket);
      }
    });

    const sortedYears = Object.values(map).sort((a, b) => a.year - b.year);
    return sortedYears.map((item, idx) => {
      if (idx === 0) {
        return { ...item, yoyGrowth: null };
      }
      const prevCost = sortedYears[idx - 1].cost;
      const yoyGrowth = prevCost > 0 ? ((item.cost - prevCost) / prevCost) * 100 : 0;
      return { ...item, yoyGrowth };
    });
  }, [rawSpendItems]);

  // Dynamic available years list
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearsSet = new Set<string>([String(currentYear)]);
    rawSpendItems.forEach(item => {
      const d = parseServiceDate(item.date);
      if (d) yearsSet.add(String(d.getFullYear()));
    });
    return Array.from(yearsSet).sort().reverse();
  }, [rawSpendItems]);

  // Filtered Dataset based on Selected Granularity & Time Scope
  const currentSpendData = useMemo(() => {
    let dataset: SpendAggregatedPoint[] = [];
    if (granularity === 'weekly') {
      dataset = weeklySpendData;
    } else if (granularity === 'monthly') {
      dataset = monthlySpendData;
    } else {
      dataset = yearlySpendData;
    }

    if (granularity === 'yearly' || timeScope === 'all') {
      return dataset;
    }

    return dataset.filter(item => String(item.year) === timeScope);
  }, [granularity, timeScope, weeklySpendData, monthlySpendData, yearlySpendData]);

  // Dynamic Telemetry Metrics for Selected View
  const filteredSpendTotal = useMemo(() => {
    return currentSpendData.reduce((acc, item) => acc + item.cost, 0);
  }, [currentSpendData]);

  const filteredHardwareSpendTotal = useMemo(() => {
    return currentSpendData.reduce((acc, item) => acc + (item.hardwareCost || 0), 0);
  }, [currentSpendData]);

  const filteredTelecomSpendTotal = useMemo(() => {
    return currentSpendData.reduce((acc, item) => acc + (item.telecomCost || 0), 0);
  }, [currentSpendData]);

  const currentTicketsInView = useMemo(() => {
    return currentSpendData.flatMap(item => item.tickets);
  }, [currentSpendData]);

  const currentPeakTicket = useMemo(() => {
    if (currentTicketsInView.length === 0) return null;
    return [...currentTicketsInView].sort((a, b) => b.cost - a.cost)[0];
  }, [currentTicketsInView]);

  const currentAvgTicket = useMemo(() => {
    return currentTicketsInView.length > 0
      ? Math.round(filteredSpendTotal / currentTicketsInView.length)
      : 0;
  }, [filteredSpendTotal, currentTicketsInView]);

  // Dynamically aggregate top serviced asset, contact number, or personnel in current view
  const topServicedAssetInView = useMemo(() => {
    if (currentTicketsInView.length === 0) return null;
    const spendByEntity: Record<
      string,
      { label: string; sub: string; cost: number; count: number; type: 'hardware' | 'telecom'; assetNumber?: string; contactNumber?: string }
    > = {};

    currentTicketsInView.forEach(t => {
      const key = t.type === 'telecom' ? `TEL-${t.contactNumber}` : `HW-${t.assetNumber || t.deviceName || 'General'}`;
      if (!spendByEntity[key]) {
        spendByEntity[key] = {
          label: t.type === 'telecom' ? `${t.contactNumber}` : (t.assetNumber || t.deviceName || 'Hardware'),
          sub: t.employeeName || 'Staff Member',
          cost: 0,
          count: 0,
          type: t.type,
          assetNumber: t.assetNumber,
          contactNumber: t.contactNumber,
        };
      }
      spendByEntity[key].cost += t.cost;
      spendByEntity[key].count += 1;
    });
    const sorted = Object.values(spendByEntity).sort((a, b) => b.cost - a.cost);
    return sorted[0] || null;
  }, [currentTicketsInView]);

  // 3. Peripherals & Mobile Stock Metrics
  const peripheralCards = useMemo(() => {
    const types = [
      { type: 'Laptop', label: 'Laptops', icon: Laptop, color: 'text-blue-500', bg: 'bg-blue-500/10' },
      { type: 'Mobile Phone', label: 'Phones', icon: Smartphone, color: 'text-pink-500', bg: 'bg-pink-500/10' },
      { type: 'Mouse', label: 'Mice', icon: Mouse, color: 'text-purple-500', bg: 'bg-purple-500/10' },
      { type: 'Keyboard', label: 'Keyboards', icon: Keyboard, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
      { type: 'Headset', label: 'Headsets', icon: Headphones, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    ];

    return types.map(t => {
      const typeAssets = assets.filter(a => a.assetType === t.type);
      const total = typeAssets.length;
      const assigned = typeAssets.filter(a => a.status === 'Assigned').length;
      const available = typeAssets.filter(a => a.status === 'Available').length;
      const assignedPct = total > 0 ? Math.round((assigned / total) * 100) : 0;
      const availablePct = total > 0 ? Math.round((available / total) * 100) : 0;

      return {
        ...t,
        total,
        assigned,
        available,
        assignedPct,
        availablePct,
        isLowBuffer: available < 2,
      };
    });
  }, [assets]);

  // 4. Problem Category Diagnostic Data with Financial Repair Impact
  const diagnosticData = useMemo(() => {
    const categoryStats: Record<string, { count: number; cost: number; topDevice: string; tickets: any[] }> = {};
    serviceRecords.forEach(s => {
      const cat = s.problemCategory || 'Other';
      if (!categoryStats[cat]) {
        categoryStats[cat] = { count: 0, cost: 0, topDevice: s.assetNumber, tickets: [] };
      }
      categoryStats[cat].count += 1;
      categoryStats[cat].cost += Number(s.serviceCost) || 0;
      categoryStats[cat].tickets.push(s);
    });

    const totalTickets = serviceRecords.length || 1;
    const totalSpend = serviceRecords.reduce((sum, s) => sum + (Number(s.serviceCost) || 0), 0) || 1;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#64748b'];

    return Object.entries(categoryStats)
      .map(([name, stat], index) => ({
        name,
        count: stat.count,
        cost: stat.cost,
        topDevice: stat.topDevice,
        pct: Math.round((stat.count / totalTickets) * 100),
        costPct: Math.round((stat.cost / totalSpend) * 100),
        color: colors[index % colors.length],
        tickets: stat.tickets,
      }))
      .sort((a, b) => b.cost - a.cost);
  }, [serviceRecords]);

  // 5. Workstation Fleet Intelligence Matrix Rows
  const workstationRows = useMemo(() => {
    return employees.map(emp => {
      const computer = computers.find(
        c => c.assignedEmployeeId === emp.id || c.assignedEmployeeId === emp.employeeId
      );
      const empAssets = assets.filter(
        a => a.assignedEmployeeId === emp.id || a.assignedEmployeeId === emp.employeeId
      );

      const hasLaptop = empAssets.some(a => a.assetType === 'Laptop') || !!computer;
      const hasMouse = empAssets.some(a => a.assetType === 'Mouse');
      const hasKeyboard = empAssets.some(a => a.assetType === 'Keyboard');
      const hasHeadset = empAssets.some(a => a.assetType === 'Headset');
      const kitCount = [hasLaptop, hasMouse, hasKeyboard, hasHeadset].filter(Boolean).length;

      const compServices = serviceRecords.filter(
        s =>
          (computer && s.computerId === computer.id) ||
          s.employeeId === emp.id ||
          s.employeeId === emp.employeeId ||
          (emp.name && s.employeeName && s.employeeName.trim().toLowerCase() === emp.name.trim().toLowerCase()) ||
          empAssets.some(a => a.assetNumber && s.assetNumber && a.assetNumber.trim().toLowerCase() === s.assetNumber.trim().toLowerCase())
      );
      const totalCompSpend = compServices.reduce((sum, s) => sum + (Number(s.serviceCost) || 0), 0);

      return {
        emp,
        computer,
        empAssets,
        kit: { hasLaptop, hasMouse, hasKeyboard, hasHeadset, kitCount },
        serviceCount: compServices.length,
        totalCompSpend,
      };
    });
  }, [employees, computers, assets, serviceRecords]);

  // Filtered Workstation Matrix
  const effectiveMatrixSearch = (matrixSearch || globalFilters.search || '').trim().toLowerCase();
  const filteredWorkstations = useMemo(() => {
    return workstationRows.filter(row => {
      if (departmentFilter !== 'All' && row.emp.department !== departmentFilter) {
        return false;
      }
      if (statusFilter === 'equipped' && !row.computer) return false;
      if (statusFilter === 'pending' && row.computer) return false;
      if (statusFilter === 'service' && row.computer?.status !== 'Under Service') return false;

      if (effectiveMatrixSearch) {
        const q = effectiveMatrixSearch;
        const matchName = row.emp.name.toLowerCase().includes(q);
        const matchId = row.emp.employeeId.toLowerCase().includes(q);
        const matchCorpId = (row.emp.companyEmployeeNumber || '').toLowerCase().includes(q);
        const matchDept = row.emp.department.toLowerCase().includes(q);
        const matchRole = (row.emp.designation || '').toLowerCase().includes(q);
        const matchComp = row.computer
          ? row.computer.assetNumber.toLowerCase().includes(q) ||
            row.computer.deviceName.toLowerCase().includes(q) ||
            row.computer.manufacturer.toLowerCase().includes(q) ||
            row.computer.model.toLowerCase().includes(q) ||
            (row.computer.serialNumber && row.computer.serialNumber.toLowerCase().includes(q))
          : false;
        const matchAssets = row.empAssets.some(
          a =>
            a.assetNumber.toLowerCase().includes(q) ||
            a.assetType.toLowerCase().includes(q) ||
            (a.imeiNumber && a.imeiNumber.toLowerCase().includes(q))
        );
        if (!matchName && !matchId && !matchCorpId && !matchDept && !matchRole && !matchComp && !matchAssets) {
          return false;
        }
      }

      return true;
    });
  }, [workstationRows, departmentFilter, statusFilter, effectiveMatrixSearch]);

  const departments = useMemo(() => {
    return ['All', ...new Set(employees.map(e => e.department))];
  }, [employees]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. EXECUTIVE COMMAND HEADER & TELEMETRY PULSE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-[#1e293b]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Fleet Command & Workstation Intelligence
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Operational
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time telemetry across {totalEmployees} workforce members, {totalComputers} workstations, and financial maintenance trends
              </p>
            </div>
          </div>
        </div>

        {/* Quick Command Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => exportFleetCSV()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg shadow-md shadow-orange-500/25 transition-all cursor-pointer"
            title="Download complete company fleet audit spreadsheet (.csv)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Fleet CSV</span>
          </button>
          <button
            onClick={() => onOpenAddService()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#131d2e] hover:bg-[#1a273e] text-blue-300 border border-blue-500/30 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5 text-blue-400" />
            <span>Log Service Ticket</span>
          </button>
          <button
            onClick={() => setActiveTab('lifecycle')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-[#101726] dark:hover:bg-slate-800 border border-slate-200 dark:border-[#1e293b] text-slate-700 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-blue-500" />
            <span>Hardware Health →</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1.5 LIVE NOTIFICATION COMMAND MODULE: PENDING EMPLOYEE REQUESTS TO ADMIN  */}
      {/* ========================================================================= */}
      {totalPendingActionableRequests > 0 ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-rose-500/10 border-2 border-amber-500/30 dark:border-amber-500/25 shadow-xl space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Inbox className="w-5 h-5" />
                </div>
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white dark:border-[#0b101b] animate-ping" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white dark:border-[#0b101b]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Action Required: Pending Requests to Admin</span>
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white shadow-xs">
                    {totalPendingActionableRequests} Pending Requisition{totalPendingActionableRequests > 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Employees have submitted telecom, hardware, and service requisitions awaiting IT Admin review &amp; fulfillment.
                </p>
              </div>
            </div>

            {/* Quick Category Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setRequestPanelFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  requestPanelFilter === 'all'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                }`}
              >
                All ({totalPendingActionableRequests})
              </button>
              {pendingSimRequests.length > 0 && (
                <button
                  onClick={() => setRequestPanelFilter('sim')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    requestPanelFilter === 'sim'
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  📱 SIM Requests ({pendingSimRequests.length})
                </button>
              )}
              {pendingAssetRequests.length > 0 && (
                <button
                  onClick={() => setRequestPanelFilter('hardware')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    requestPanelFilter === 'hardware'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  💻 Equipment Requests ({pendingAssetRequests.length})
                </button>
              )}
              {underServiceComputers.length > 0 && (
                <button
                  onClick={() => setRequestPanelFilter('service')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    requestPanelFilter === 'service'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  🔧 Maintenance ({underServiceComputers.length})
                </button>
              )}
            </div>
          </div>

          {/* Pending Request Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* 1. SIM Requests & Issues */}
            {(requestPanelFilter === 'all' || requestPanelFilter === 'sim') &&
              pendingSimRequests.map(req => {
                const isIssue = req.requestType === 'Report Issue';
                const isSuspension = req.requestType === 'Suspend SIM';
                const emp = employees.find(e => e.id === req.employeeId || e.employeeId === req.employeeId);

                return (
                  <div
                    key={`dash-sim-${req.id}`}
                    className="p-4 rounded-xl bg-white dark:bg-[#0c121e] border border-amber-500/30 dark:border-amber-500/20 shadow-sm flex flex-col justify-between hover:border-amber-500/60 transition-all group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                              isIssue
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                : isSuspension
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {isIssue ? `🔴 SIM Issue: ${req.issueType || 'Incident'}` : isSuspension ? '⚠️ SIM Suspension' : '📱 Additional SIM Requisition'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">#{req.id}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            req.urgency === 'Critical' || req.urgency === 'Urgent'
                              ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {req.urgency || 'Normal'}
                        </span>
                      </div>

                      {/* Employee Info Strip */}
                      <div className="flex items-center gap-2.5 pt-0.5">
                        <EmployeeAvatar name={req.employeeName} photoUrl={emp?.photoUrl} size="sm" />
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white text-xs block">
                            {req.employeeName}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {emp?.department || 'Staff'} • {req.companyEmployeeNumber || req.employeeId}
                          </span>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                        {!isIssue && !isSuspension && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">Qty &amp; Purpose:</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {req.quantity || 1}x SIM ({req.purpose || 'Calling'})
                            </span>
                          </div>
                        )}
                        {(isIssue || isSuspension) && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">Target Contact Number:</span>
                            <span className="font-mono font-bold text-orange-500">
                              📱 {req.contactNumber || 'N/A'}
                            </span>
                          </div>
                        )}
                        {req.project && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">Project Name:</span>
                            <span className="font-semibold text-slate-900 dark:text-slate-200">
                              📁 {req.project}
                            </span>
                          </div>
                        )}
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 italic pt-0.5 line-clamp-2">
                          "{req.reason}"
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            updateSimRequestStatus(req.id, 'Approved', 'Approved by Admin');
                            showToast(`SIM Request #${req.id} approved.`, 'success');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/10 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-500/20 text-[11px] font-bold transition-all cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('sim-management');
                            setSimManagementSubTab('requests');
                            setHighlightedSimRequestId(req.id);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          <span>Review Request</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

            {/* 2. Hardware / Equipment Requisitions */}
            {(requestPanelFilter === 'all' || requestPanelFilter === 'hardware') &&
              pendingAssetRequests.map(req => {
                const totalItems = req.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
                const itemsSummary = req.items.map(i => `${i.quantity || 1}x ${i.assetType}`).join(', ');
                const emp = employees.find(e => e.id === req.employeeId || e.employeeId === req.employeeId);

                return (
                  <div
                    key={`dash-req-${req.id}`}
                    className="p-4 rounded-xl bg-white dark:bg-[#0c121e] border border-blue-500/30 dark:border-blue-500/20 shadow-sm flex flex-col justify-between hover:border-blue-500/60 transition-all group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                            💻 Equipment Requisition ({totalItems} Units)
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">#{req.id}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            req.urgency === 'Critical'
                              ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              : req.urgency === 'High'
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {req.urgency || 'Normal'}
                        </span>
                      </div>

                      {/* Employee Info Strip */}
                      <div className="flex items-center gap-2.5 pt-0.5">
                        <EmployeeAvatar name={req.employeeName} photoUrl={emp?.photoUrl} size="sm" />
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white text-xs block">
                            {req.employeeName}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {req.department} • {req.companyEmployeeNumber || req.employeeId}
                          </span>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Requested Gear:</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {itemsSummary}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 italic pt-0.5 line-clamp-2">
                          "{req.reason}"
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : req.requestDate}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            const isSystemRelated =
                              req.items?.some(i =>
                                ['Laptop', 'Desktop', 'Computer', 'Monitor'].includes(i.assetType)
                              ) ||
                              (req.reason &&
                                (req.reason.toLowerCase().includes('pc') ||
                                  req.reason.toLowerCase().includes('laptop') ||
                                  req.reason.toLowerCase().includes('computer') ||
                                  req.reason.toLowerCase().includes('screen') ||
                                  req.reason.toLowerCase().includes('workstation') ||
                                  req.reason.toLowerCase().includes('system') ||
                                  req.reason.toLowerCase().includes('repair')));

                            updateAssetRequestStatus(req.id, 'Approved', 'Approved by Admin');

                            if (isSystemRelated) {
                              setActiveSystemSupportTicket({
                                requestId: req.id,
                                employeeId: req.employeeId,
                                employeeName: req.employeeName,
                                assetType: req.items?.map(i => i.assetType).join(', ') || 'Computer/Laptop',
                                assetNumber: 'Requisition',
                                problemDescription: req.reason || 'Hardware / System Setup Requisition',
                                urgency: req.urgency,
                                status: 'Approved',
                                createdAt: req.createdAt || req.requestDate,
                              });
                              setActiveTab('system-support');
                              showToast(`Equipment Requisition #${req.id} approved. Dedicated System/PC Support page opened.`, 'success');
                            } else {
                              showToast(`Equipment Requisition #${req.id} approved.`, 'success');
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/10 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-500/20 text-[11px] font-bold transition-all cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setActiveSystemSupportTicket({
                              requestId: req.id,
                              employeeId: req.employeeId,
                              employeeName: req.employeeName,
                              assetType: req.items?.map(i => i.assetType).join(', ') || 'Computer/Laptop',
                              assetNumber: 'Requisition',
                              problemDescription: req.reason || 'Hardware / System Setup Requisition',
                              urgency: req.urgency,
                              status: 'Pending',
                              createdAt: req.createdAt || req.requestDate,
                            });
                            setActiveTab('system-support');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white border border-indigo-500/20 text-[11px] font-bold transition-all cursor-pointer"
                          title="Open in System / PC Support Hub"
                        >
                          PC Support
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('requests');
                            setHighlightedRequestId(req.id);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

            {/* 3. Under Service Computers */}
            {(requestPanelFilter === 'all' || requestPanelFilter === 'service') &&
              underServiceComputers.map(comp => {
                const emp = employees.find(e => e.id === comp.assignedEmployeeId || e.employeeId === comp.assignedEmployeeId);

                return (
                  <div
                    key={`dash-srv-${comp.id}`}
                    className="p-4 rounded-xl bg-white dark:bg-[#0c121e] border border-rose-500/30 dark:border-rose-500/20 shadow-sm flex flex-col justify-between hover:border-rose-500/60 transition-all group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                          🔧 Workstation In Repair ({comp.assetNumber})
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                          Under Service
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 pt-0.5">
                        <EmployeeAvatar name={emp?.name || comp.deviceName || 'Stock'} photoUrl={emp?.photoUrl} size="sm" />
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white text-xs block">
                            {comp.deviceName || comp.model}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Assigned to: {emp?.name || 'Unassigned Stock'} ({emp?.department || 'Inventory'})
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300">
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          Unit is currently undergoing diagnostic servicing or parts replacement at the IT desk.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-mono">Status: In Progress</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setActiveSystemSupportTicket({
                              requestId: `SRV-${comp.assetNumber}`,
                              employeeId: comp.assignedEmployeeId || 'Stock',
                              employeeName: emp?.name || 'Stock / IT Desk',
                              deviceName: comp.deviceName || `${comp.manufacturer || ''} ${comp.model || ''}`.trim(),
                              assetType: comp.deviceType || 'Laptop/PC',
                              assetNumber: comp.assetNumber,
                              problemDescription: `Workstation ${comp.deviceName || comp.assetNumber} is undergoing maintenance. Needs service provider repair dispatch.`,
                              urgency: 'High',
                              status: 'Under Service',
                              createdAt: new Date().toISOString(),
                            });
                            setActiveTab('system-support');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          <span>PC Support Vendors</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setActiveTab('services')}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          <span>Service Desk</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ) : null}

      {/* 2. HERO EXECUTIVE TELEMETRY RIBBON (5 Precision KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Fleet Allocation Readiness */}
        <div
          onClick={() => setActiveTab('employees')}
          className="p-4 rounded-xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-[#1e293b] shadow-xs hover:border-emerald-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500 dark:text-slate-400">
              Workstation Allocation
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
              {readinessRate}%
            </span>
            <span className="text-[11px] font-semibold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-md font-mono">
              {equippedEmployees} / {totalEmployees} Equipped
            </span>
          </div>
          <div className="mt-3 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span>{totalEmployees - equippedEmployees} unassigned personnel</span>
            <span className="text-amber-500 dark:text-amber-400 group-hover:underline">Directory →</span>
          </div>
        </div>

        {/* KPI 2: Hardware Health Index */}
        <div
          onClick={() => setActiveTab('lifecycle')}
          className="p-4 rounded-xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-[#1e293b] shadow-xs hover:border-teal-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-teal-500/15 text-teal-400 border border-teal-500/25 flex items-center justify-center shrink-0">
              <Heart className="w-4 h-4" />
            </div>
            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500 dark:text-slate-400">
              Fleet Health Index
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
              {fleetHealthScore}%
            </span>
            <span className="text-[11px] font-semibold text-teal-300 bg-teal-500/20 border border-teal-500/30 px-2 py-0.5 rounded-md font-mono">
              {goodOrNewComputers} / {totalComputers} Healthy
            </span>
          </div>
          <div className="mt-3 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span>{underServiceComputers.length} active service tickets</span>
            <span className="text-teal-500 dark:text-teal-400 group-hover:underline">Health Center →</span>
          </div>
        </div>

        {/* KPI 3: Hardware & Mobile Deployment */}
        <div
          onClick={() => setActiveTab('assets')}
          className="p-4 rounded-xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-[#1e293b] shadow-xs hover:border-blue-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25 flex items-center justify-center shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500 dark:text-slate-400">
              Hardware & Mobile Fleet
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
              {peripheralUtilization}%
            </span>
            <span className="text-[11px] font-semibold text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 rounded-md font-mono">
              {assignedAssets} / {totalAssets} Deployed
            </span>
          </div>
          <div className="mt-3 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span>{availableAssets} buffer/spares in stock</span>
            <span className="text-amber-500 dark:text-amber-400 group-hover:underline">Assets →</span>
          </div>
        </div>

        {/* KPI 4: Total Maintenance Spend (Spend Trend Overview) */}
        <div
          onClick={() => setActiveTab('services')}
          className="p-4 rounded-xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-[#1e293b] shadow-xs hover:border-orange-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/25 flex items-center justify-center shrink-0">
              <IndianRupee className="w-4 h-4" />
            </div>
            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500 dark:text-slate-400">
              Total Fleet Maintenance
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(totalLifetimeSpend)}
            </span>
            <span className="text-[11px] font-semibold text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md font-mono border border-slate-200 dark:border-[#1e293b]">
              {serviceRecords.length} {serviceRecords.length === 1 ? 'invoice' : 'invoices'}
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Avg {formatCurrency(avgTicketCost)} / ticket</span>
            <span className="text-orange-500 dark:text-orange-400 font-semibold group-hover:underline">Service Log →</span>
          </div>
        </div>

        {/* KPI 5: PC/Laptop Purchases & Capital Outlay */}
        <div
          onClick={() => setActiveTab('purchases')}
          className="p-4 rounded-xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-[#1e293b] shadow-xs hover:border-amber-500/50 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/25 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500 dark:text-slate-400">
              PC/Laptop Purchases
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
              {purchases.length} Units
            </span>
            <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md font-mono">
              ₹{totalPurchasesCost.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-3 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span>{inStockPurchasesCount} in stock • {assignedPurchasesCount} assigned</span>
            <span className="text-amber-500 dark:text-amber-400 font-semibold group-hover:underline">Purchases →</span>
          </div>
        </div>
      </div>

      {/* 2.5 SIM CARD FLEET & TELEMETRY MODULE (Requirement 6) */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-[#1e293b] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-[#1e293b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  SIM Card Fleet & Recharge Intelligence
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                  {totalSims} Numbers
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Centralized monitoring of employee mobile allocations, SIM purposes, suspensions, and GST recharge costs
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('sim-management')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <span>Manage SIM Fleet →</span>
          </button>
        </div>

        {/* Overall SIM Recharge Expense Breakdown Card (Requirement 3) */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-transparent border border-emerald-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
              <span>Overall Monthly SIM Recharge Expense (Assigned SIMs Only)</span>
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
              Actual Completed Recharges (Active SIMs Only)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-lg bg-white/70 dark:bg-[#0b101b]/80 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Total Assigned SIMs</span>
              <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {adminSimExpense.simCount} SIMs
              </span>
              <span className="text-[10px] text-slate-400">Excludes unassigned stock</span>
            </div>

            <div className="p-3 rounded-lg bg-white/70 dark:bg-[#0b101b]/80 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Base Recharge Expense</span>
              <span className="text-xl font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
                {formatINR(adminSimExpense.baseRecharge)}
              </span>
              <span className="text-[10px] text-slate-400">{adminSimExpense.rechargeCount} completed recharges</span>
            </div>

            <div className="p-3 rounded-lg bg-white/70 dark:bg-[#0b101b]/80 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Total GST (18%)</span>
              <span className="text-xl font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5 block">
                {formatINR(adminSimExpense.gstAmount)}
              </span>
              <span className="text-[10px] text-slate-400">Actual GST logged</span>
            </div>

            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 tracking-wider block">Total Monthly Expense</span>
              <span className="text-xl font-black font-mono text-blue-600 dark:text-blue-400 mt-0.5 block">
                {formatINR(adminSimExpense.totalExpense)}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Matches Recharge Spend</span>
            </div>
          </div>

          {/* SIM Issues Incident Telemetry Strip */}
          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              onClick={() => setActiveTab('sim-management')}
              className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 cursor-pointer hover:border-amber-500/40 transition-colors"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">Open SIM Issues</span>
              <span className="text-lg font-mono font-bold text-amber-600 dark:text-amber-400">{openSimIssues}</span>
            </div>
            <div
              onClick={() => setActiveTab('sim-management')}
              className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 cursor-pointer hover:border-rose-500/40 transition-colors"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">Urgent SIM Issues</span>
              <span className="text-lg font-mono font-bold text-rose-600 dark:text-rose-400">{urgentSimIssues}</span>
            </div>
            <div
              onClick={() => setActiveTab('sim-management')}
              className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 cursor-pointer hover:border-blue-500/40 transition-colors"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">In Progress</span>
              <span className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">{inProgressSimIssues}</span>
            </div>
            <div
              onClick={() => setActiveTab('sim-management')}
              className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 cursor-pointer hover:border-emerald-500/40 transition-colors"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">Resolved</span>
              <span className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">{resolvedSimIssues}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 pt-4">
          {/* Card 1: Total SIMs */}
          <div
            onClick={() => setActiveTab('sim-management')}
            className="p-3.5 rounded-lg bg-slate-50/70 dark:bg-[#0b101b] border border-slate-200/70 dark:border-slate-800/80 hover:border-emerald-500/40 transition-all cursor-pointer group"
          >
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Total SIMs</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                {totalSims}
              </span>
              <span className="text-[10px] text-emerald-500 font-medium">100%</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">In company fleet</span>
          </div>

          {/* Card 2: Active SIMs */}
          <div
            onClick={() => setActiveTab('sim-management')}
            className="p-3.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 hover:border-emerald-500/60 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">Active</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black font-mono text-emerald-900 dark:text-emerald-200">
                {activeSims}
              </span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                {totalSims > 0 ? Math.round((activeSims / totalSims) * 100) : 0}%
              </span>
            </div>
            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/70 mt-1 block">Operational numbers</span>
          </div>

          {/* Card 3: Suspended SIMs */}
          <div
            onClick={() => setActiveTab('sim-management')}
            className={`p-3.5 rounded-lg border transition-all cursor-pointer group ${
              suspendedSims > 0
                ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/50 hover:border-rose-500/60'
                : 'bg-slate-50/70 dark:bg-[#0b101b] border-slate-200/70 dark:border-slate-800/80 hover:border-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${suspendedSims > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-400'}`}>
                Suspended
              </span>
              {suspendedSims > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className={`text-2xl font-black font-mono ${suspendedSims > 0 ? 'text-rose-900 dark:text-rose-200' : 'text-slate-900 dark:text-white'}`}>
                {suspendedSims}
              </span>
              {pendingSuspensionRequests > 0 && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold font-mono">
                  {pendingSuspensionRequests} req
                </span>
              )}
            </div>
            <span className={`text-[10px] mt-1 block ${suspendedSims > 0 ? 'text-rose-600/80 dark:text-rose-400/70 font-medium' : 'text-slate-400'}`}>
              {suspendedSims > 0 ? 'Action / reason recorded' : 'Zero suspensions'}
            </span>
          </div>

          {/* Card 4: Available Spares */}
          <div
            onClick={() => setActiveTab('sim-management')}
            className="p-3.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 hover:border-blue-500/60 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400 tracking-wider">Available Buffer</span>
              <span className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black font-mono text-blue-900 dark:text-blue-200">
                {availableSims}
              </span>
              <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400">
                {totalSims > 0 ? Math.round((availableSims / totalSims) * 100) : 0}%
              </span>
            </div>
            <span className="text-[10px] text-blue-600/80 dark:text-blue-400/70 mt-1 block">Ready for issuance</span>
          </div>

          {/* Card 5: Total Recharge Spend */}
          <div
            onClick={() => setActiveTab('sim-management')}
            className="p-3.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 hover:border-amber-500/60 transition-all cursor-pointer group col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 tracking-wider">Recharge Spend</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono font-semibold">
                GST Incl.
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-amber-900 dark:text-amber-200">
                ₹{totalSimRechargeSpend.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-1 block">
              {simRecharges.length} {simRecharges.length === 1 ? 'recharge event' : 'recharge events'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. CENTERPIECE: SEAMLESSLY INTEGRATED "SPEND TREND" ANALYTICS ENGINE */}
      <div className="p-5 rounded-xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-[#1e293b] shadow-xs">
        {/* Spend Trend Header & Timeframe / Stream / Granularity Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-[#1e293b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/25">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Maintenance & Telecom Expenditure Trend (₹)
                </h2>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/35 shadow-xs">
                  {formatCurrency(filteredSpendTotal)} Total
                </span>
                {spendStream === 'all' && (
                  <div className="flex items-center gap-1.5 text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      🔧 HW: {formatCurrency(filteredHardwareSpendTotal)}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      📱 SIM: {formatCurrency(filteredTelecomSpendTotal)}
                    </span>
                  </div>
                )}
                <span className="text-[11px] font-mono text-slate-400">
                  • {currentTicketsInView.length} Events Logged
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {spendStream === 'all' && 'Combined timeline of hardware maintenance, spare replacements, and contact number / SIM telecom recharges'}
                {spendStream === 'hardware' && 'Hardware repair invoices, preventive servicing, and replacement components only'}
                {spendStream === 'telecom' && 'Contact number telecom recharges, monthly voice/data plans, and GST expenditures'}
              </p>
            </div>
          </div>

          {/* Stream, Contact Number Filter, Granularity, Time Scope, and Chart Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Stream Switcher: All | Hardware 🔧 | Contact No. / SIM 📱 */}
            <div className="inline-flex p-0.5 bg-slate-100 dark:bg-[#0b101b] rounded-lg border border-slate-200/80 dark:border-[#1e293b] text-xs">
              <button
                type="button"
                onClick={() => setSpendStream('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  spendStream === 'all'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All (HW + SIM)
              </button>
              <button
                type="button"
                onClick={() => setSpendStream('hardware')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  spendStream === 'hardware'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wrench className="w-3 h-3" />
                Hardware
              </button>
              <button
                type="button"
                onClick={() => setSpendStream('telecom')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  spendStream === 'telecom'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Phone className="w-3 h-3" />
                Contact Numbers
              </button>
            </div>

            {/* Contact Number Filter Dropdown (When All or Telecom is active) */}
            {spendStream !== 'hardware' && availableContactNumbers.length > 0 && (
              <div className="flex items-center gap-1">
                <select
                  value={contactNumberFilter}
                  onChange={e => setContactNumberFilter(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#0b101b] border border-slate-200/80 dark:border-[#1e293b] text-[11px] font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer max-w-[170px] truncate"
                >
                  <option value="all">📱 All Contact Nos ({availableContactNumbers.length})</option>
                  {availableContactNumbers.map(sim => (
                    <option key={sim.contactNumber} value={sim.contactNumber}>
                      {sim.contactNumber} — {sim.employeeName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Granularity Switcher: Weekly | Monthly | Yearly */}
            <div className="inline-flex p-0.5 bg-slate-100 dark:bg-[#0b101b] rounded-lg border border-slate-200/80 dark:border-[#1e293b] text-xs">
              <button
                onClick={() => setGranularity('weekly')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  granularity === 'weekly'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/30 font-bold'
                    : 'text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Calendar className="w-3 h-3" />
                Weekly
              </button>
              <button
                onClick={() => setGranularity('monthly')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  granularity === 'monthly'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/30 font-bold'
                    : 'text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <CalendarDays className="w-3 h-3" />
                Monthly
              </button>
              <button
                onClick={() => setGranularity('yearly')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  granularity === 'yearly'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/30 font-bold'
                    : 'text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <CalendarRange className="w-3 h-3" />
                Yearly
              </button>
            </div>

            {/* Time Scope Filter */}
            {granularity !== 'yearly' && (
              <div className="inline-flex p-0.5 bg-slate-100 dark:bg-[#0b101b] rounded-lg border border-slate-200/80 dark:border-[#1e293b] text-xs">
                <button
                  onClick={() => setTimeScope('all')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    timeScope === 'all'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Time
                </button>
                {availableYears.map(yr => (
                  <button
                    key={yr}
                    onClick={() => setTimeScope(yr)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                      timeScope === yr
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {yr === String(new Date().getFullYear()) ? `${yr} (YTD)` : yr}
                  </button>
                ))}
              </div>
            )}

            {/* Chart Style Switcher: Area Trendline vs Column Bars */}
            <div className="inline-flex p-0.5 bg-slate-100 dark:bg-[#0b101b] rounded-lg border border-slate-200/80 dark:border-[#1e293b] text-xs">
              <button
                onClick={() => setChartType('area')}
                title="Spline Area Trendline"
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  chartType === 'area'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setChartType('bar')}
                title="Discrete Column Bars"
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  chartType === 'bar'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Spend Chart + Companion Telemetry Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
          {/* Main Visualizer (8 Columns) */}
          <div className="lg:col-span-8">
            <div className="h-64 w-full">
              {currentSpendData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 p-4 text-center">
                  <AlertTriangle className="w-8 h-8 text-amber-500/70 mb-2" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No expenditure records found for the selected filter ({timeScope === 'all' ? 'All Time' : timeScope}).
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                    {rawSpendItems.length === 0
                      ? 'No maintenance tickets or telecom recharges logged yet. Click below to add an entry.'
                      : 'Records exist in other timeframes or filters. Reset filters to view all entries.'}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    {timeScope !== 'all' && (
                      <button
                        onClick={() => {
                          setTimeScope('all');
                          setContactNumberFilter('all');
                          setSpendStream('all');
                        }}
                        className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    )}
                    <button
                      onClick={() => onOpenAddService()}
                      className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Log Service Ticket</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('sim-management')}
                      className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Manage Contact Numbers</span>
                    </button>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'area' ? (
                    <AreaChart
                      data={currentSpendData}
                      margin={{ top: 15, right: 15, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="spendGradientExecutive" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={spendStream === 'telecom' ? '#10b981' : '#f97316'} stopOpacity={0.65} />
                          <stop offset="95%" stopColor={spendStream === 'telecom' ? '#059669' : '#ea580c'} stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.6} />
                      <XAxis
                        dataKey="label"
                        stroke="#64748b"
                        fontSize={10}
                        tickLine={false}
                        interval={currentSpendData.length > 20 ? 2 : currentSpendData.length > 12 ? 1 : 0}
                        minTickGap={24}
                        dy={6}
                      />
                      <YAxis
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={val => `₹${val}`}
                      />
                      <Tooltip
                        cursor={{ stroke: spendStream === 'telecom' ? '#10b981' : '#f97316', strokeWidth: 1.5, strokeDasharray: '3 3' }}
                        wrapperStyle={{ pointerEvents: 'auto', zIndex: 1000 }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const item = payload[0].payload as SpendAggregatedPoint;
                            return (
                              <div
                                className="bg-[#0d131f]/95 backdrop-blur-md border border-[#1e293b] p-3.5 rounded-xl text-xs text-white shadow-2xl space-y-2 min-w-[260px] max-w-[360px] max-h-[85vh] flex flex-col pointer-events-auto select-text cursor-default"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPinnedSpendPoint(item);
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                onMouseUp={(e) => e.stopPropagation()}
                                onWheel={(e) => e.stopPropagation()}
                                onTouchMove={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-between border-b border-[#1e293b] pb-1.5 text-[11px] text-slate-400 shrink-0">
                                  <span className="font-semibold text-slate-200">{item.fullTitle}</span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded text-[10px] border border-amber-500/20">
                                      {item.count} Event{item.count > 1 ? 's' : ''}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPinnedSpendPoint(item);
                                      }}
                                      className="p-0.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                                      title="Open persistent view"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                <div className="flex items-baseline justify-between shrink-0">
                                  <div className="text-xl font-bold font-mono text-amber-400">
                                    {formatCurrency(item.cost)}
                                  </div>
                                  {item.yoyGrowth !== undefined && item.yoyGrowth !== null && (
                                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                      item.yoyGrowth >= 0
                                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    }`}>
                                      {item.yoyGrowth >= 0 ? '+' : ''}{item.yoyGrowth.toFixed(1)}% YoY
                                    </span>
                                  )}
                                </div>

                                {spendStream === 'all' && (
                                  <div className="flex items-center gap-2 text-[10px] font-mono pt-1 shrink-0">
                                    <span className="text-blue-400">🔧 HW: {formatCurrency(item.hardwareCost || 0)}</span>
                                    <span className="text-slate-600">•</span>
                                    <span className="text-emerald-400">📱 SIM: {formatCurrency(item.telecomCost || 0)}</span>
                                  </div>
                                )}

                                {item.tickets && item.tickets.length > 0 && (
                                  <div className="space-y-1 pt-1.5 border-t border-[#1e293b]/70 flex-1 min-h-0 flex flex-col">
                                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mb-0.5">
                                      <span>Expenditure Breakdown ({item.tickets.length})</span>
                                      {item.tickets.length > 3 && (
                                        <span className="text-[9px] font-mono text-emerald-400/90 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 lowercase">
                                          ↕ scroll (2-3 per view)
                                        </span>
                                      )}
                                    </div>
                                    <div
                                      className="space-y-1 max-h-[140px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-emerald-500/60 hover:scrollbar-thumb-emerald-400 scrollbar-track-slate-900/90"
                                      onWheel={(e) => e.stopPropagation()}
                                      onTouchMove={(e) => e.stopPropagation()}
                                    >
                                      {item.tickets.map(t => (
                                        <div key={t.id} className="text-[10px] bg-slate-900/80 p-1.5 rounded border border-slate-800 flex items-start justify-between gap-1.5 hover:bg-slate-800/90 transition-colors">
                                          <div className="truncate">
                                            <div className="flex items-center gap-1">
                                              <span className={`px-1 py-0.2 rounded text-[9px] font-mono font-bold ${
                                                t.type === 'telecom'
                                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                              }`}>
                                                {t.type === 'telecom' ? '📱 SIM' : '🔧 HW'}
                                              </span>
                                              <span className="font-mono font-bold text-slate-200">
                                                {t.type === 'telecom' ? t.contactNumber : t.assetNumber}
                                              </span>
                                              <span className="text-slate-400 ml-0.5">({t.employeeName})</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 truncate mt-0.5">{t.problem}</p>
                                          </div>
                                          <span className="font-mono font-semibold text-amber-400 shrink-0">
                                            {formatCurrency(t.cost)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="cost"
                        stroke={spendStream === 'telecom' ? '#10b981' : '#f59e0b'}
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#spendGradientExecutive)"
                        dot={(props: any) => {
                          const { cx, cy, payload } = props;
                          if (!payload || !payload.cost || payload.cost <= 0) return null;
                          return (
                            <g key={`spend-dot-${payload.key}`} className="cursor-pointer" onClick={() => setPinnedSpendPoint(payload)}>
                              <circle cx={cx} cy={cy} r={6} fill={spendStream === 'telecom' ? '#10b981' : '#f97316'} fillOpacity={0.3} />
                              <circle cx={cx} cy={cy} r={4} fill={spendStream === 'telecom' ? '#10b981' : '#f97316'} stroke="#ffffff" strokeWidth={2} />
                            </g>
                          );
                        }}
                        activeDot={{
                          r: 7,
                          fill: spendStream === 'telecom' ? '#059669' : '#ea580c',
                          stroke: '#ffffff',
                          strokeWidth: 2.5,
                          cursor: 'pointer',
                          onClick: (e: any, payload: any) => {
                            if (payload && payload.payload) setPinnedSpendPoint(payload.payload);
                          },
                        }}
                      />
                    </AreaChart>
                  ) : (
                    <BarChart
                      data={currentSpendData}
                      margin={{ top: 15, right: 15, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="spendBarGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={spendStream === 'telecom' ? '#10b981' : '#f97316'} stopOpacity={1} />
                          <stop offset="100%" stopColor={spendStream === 'telecom' ? '#059669' : '#ea580c'} stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.6} />
                      <XAxis
                        dataKey="label"
                        stroke="#64748b"
                        fontSize={10}
                        tickLine={false}
                        interval={currentSpendData.length > 20 ? 2 : currentSpendData.length > 12 ? 1 : 0}
                        minTickGap={24}
                        dy={6}
                      />
                      <YAxis
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={val => `₹${val}`}
                      />
                      <Tooltip
                        cursor={{ fill: '#1e293b', opacity: 0.3 }}
                        wrapperStyle={{ pointerEvents: 'auto', zIndex: 1000 }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const item = payload[0].payload as SpendAggregatedPoint;
                            return (
                              <div
                                className="bg-[#0d131f]/95 backdrop-blur-md border border-[#1e293b] p-3.5 rounded-xl text-xs text-white shadow-2xl space-y-2 min-w-[260px] max-w-[360px] max-h-[85vh] flex flex-col pointer-events-auto select-text cursor-default"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPinnedSpendPoint(item);
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                onMouseUp={(e) => e.stopPropagation()}
                                onWheel={(e) => e.stopPropagation()}
                                onTouchMove={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-between border-b border-[#1e293b] pb-1.5 text-[11px] text-slate-400 shrink-0">
                                  <span className="font-semibold text-slate-200">{item.fullTitle}</span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded text-[10px] border border-amber-500/20">
                                      {item.count} Event{item.count > 1 ? 's' : ''}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPinnedSpendPoint(item);
                                      }}
                                      className="p-0.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                                      title="Open persistent view"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                <div className="flex items-baseline justify-between shrink-0">
                                  <div className="text-xl font-bold font-mono text-amber-400">
                                    {formatCurrency(item.cost)}
                                  </div>
                                  {item.yoyGrowth !== undefined && item.yoyGrowth !== null && (
                                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                      item.yoyGrowth >= 0
                                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    }`}>
                                      {item.yoyGrowth >= 0 ? '+' : ''}{item.yoyGrowth.toFixed(1)}% YoY
                                    </span>
                                  )}
                                </div>

                                {spendStream === 'all' && (
                                  <div className="flex items-center gap-2 text-[10px] font-mono pt-1 shrink-0">
                                    <span className="text-blue-400">🔧 HW: {formatCurrency(item.hardwareCost || 0)}</span>
                                    <span className="text-slate-600">•</span>
                                    <span className="text-emerald-400">📱 SIM: {formatCurrency(item.telecomCost || 0)}</span>
                                  </div>
                                )}

                                {item.tickets && item.tickets.length > 0 && (
                                  <div className="space-y-1 pt-1.5 border-t border-[#1e293b]/70 flex-1 min-h-0 flex flex-col">
                                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mb-0.5">
                                      <span>Expenditure Breakdown ({item.tickets.length})</span>
                                      {item.tickets.length > 3 && (
                                        <span className="text-[9px] font-mono text-emerald-400/90 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 lowercase">
                                          ↕ scroll (2-3 per view)
                                        </span>
                                      )}
                                    </div>
                                    <div
                                      className="space-y-1 max-h-[140px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-emerald-500/60 hover:scrollbar-thumb-emerald-400 scrollbar-track-slate-900/90"
                                      onWheel={(e) => e.stopPropagation()}
                                      onTouchMove={(e) => e.stopPropagation()}
                                    >
                                      {item.tickets.map(t => (
                                        <div key={t.id} className="text-[10px] bg-slate-900/80 p-1.5 rounded border border-slate-800 flex items-start justify-between gap-1.5 hover:bg-slate-800/90 transition-colors">
                                          <div className="truncate">
                                            <div className="flex items-center gap-1">
                                              <span className={`px-1 py-0.2 rounded text-[9px] font-mono font-bold ${
                                                t.type === 'telecom'
                                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                              }`}>
                                                {t.type === 'telecom' ? '📱 SIM' : '🔧 HW'}
                                              </span>
                                              <span className="font-mono font-bold text-slate-200">
                                                {t.type === 'telecom' ? t.contactNumber : t.assetNumber}
                                              </span>
                                              <span className="text-slate-400 ml-0.5">({t.employeeName})</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 truncate mt-0.5">{t.problem}</p>
                                          </div>
                                          <span className="font-mono font-semibold text-amber-400 shrink-0">
                                            {formatCurrency(t.cost)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="cost"
                        fill="url(#spendBarGradient)"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={52}
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>

            <div className="pt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 dark:border-[#1e293b] flex-wrap gap-2">
              <span>
                Tracking {currentTicketsInView.length} event{currentTicketsInView.length !== 1 ? 's' : ''} across {currentSpendData.length} {granularity} interval{currentSpendData.length !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-blue-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                  Hardware: {formatCurrency(filteredHardwareSpendTotal)}
                </span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Contact Nos: {formatCurrency(filteredTelecomSpendTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Persistent Interactive SIM & Hardware Expenditure Details Modal */}
          {pinnedSpendPoint && (
            <div
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
              onClick={() => setPinnedSpendPoint(null)}
            >
              <div
                className="relative w-full max-w-lg bg-[#0d131f] border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden text-white p-5 space-y-4 my-auto max-h-[90vh] flex flex-col ring-1 ring-white/10"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-[#1e293b] pb-3 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 text-sm leading-tight">{pinnedSpendPoint.fullTitle}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Corporate Telecom & Hardware Logged Events</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded text-xs border border-amber-500/20 font-semibold">
                      {pinnedSpendPoint.count} Event{pinnedSpendPoint.count > 1 ? 's' : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPinnedSpendPoint(null)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Close (Esc)"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Spend Totals */}
                <div className="flex items-baseline justify-between shrink-0 py-1">
                  <div className="text-2xl font-bold font-mono text-amber-400">
                    {formatCurrency(pinnedSpendPoint.cost)}
                  </div>
                  {pinnedSpendPoint.yoyGrowth !== undefined && pinnedSpendPoint.yoyGrowth !== null && (
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      pinnedSpendPoint.yoyGrowth >= 0
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {pinnedSpendPoint.yoyGrowth >= 0 ? '+' : ''}{pinnedSpendPoint.yoyGrowth.toFixed(1)}% YoY
                    </span>
                  )}
                </div>

                {spendStream === 'all' && (
                  <div className="flex items-center gap-3 text-xs font-mono py-2 px-3 shrink-0 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-blue-400 font-semibold">🔧 Hardware: {formatCurrency(pinnedSpendPoint.hardwareCost || 0)}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-emerald-400 font-semibold">📱 SIM / Contact: {formatCurrency(pinnedSpendPoint.telecomCost || 0)}</span>
                  </div>
                )}

                {/* SIM Breakdown List with 2-3 SIM Cards per view height & slider scrollbar */}
                {pinnedSpendPoint.tickets && pinnedSpendPoint.tickets.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#1e293b]/70 flex-1 min-h-0 flex flex-col">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                      <span>Expenditure Breakdown ({pinnedSpendPoint.tickets.length})</span>
                      {pinnedSpendPoint.tickets.length > 3 && (
                        <span className="text-[10px] font-mono text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 lowercase">
                          ↕ scroll slider (2-3 per view)
                        </span>
                      )}
                    </div>
                    <div
                      className="space-y-1.5 max-h-[160px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-emerald-500/60 hover:scrollbar-thumb-emerald-400 scrollbar-track-slate-900/90"
                      onWheel={(e) => e.stopPropagation()}
                      onTouchMove={(e) => e.stopPropagation()}
                    >
                      {pinnedSpendPoint.tickets.map((t: any) => (
                        <div key={t.id} className="text-xs bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex items-start justify-between gap-2 hover:bg-slate-800/90 transition-colors">
                          <div className="truncate">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                t.type === 'telecom'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              }`}>
                                {t.type === 'telecom' ? '📱 SIM' : '🔧 HW'}
                              </span>
                              <span className="font-mono font-bold text-slate-200">
                                {t.type === 'telecom' ? t.contactNumber : t.assetNumber}
                              </span>
                              <span className="text-slate-400 text-[11px]">({t.employeeName})</span>
                            </div>
                            <p className="text-xs text-slate-400 truncate mt-1">{t.problem}</p>
                          </div>
                          <span className="font-mono font-bold text-amber-400 shrink-0 text-xs">
                            {formatCurrency(t.cost)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Companion Financial Highlights (4 Columns) */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-3">
            {/* Highlight 1: Highest Single Expense */}
            <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-[#0d131f] border border-slate-200/80 dark:border-[#1e293b] flex items-center gap-3.5 shadow-2xs hover:border-orange-500/40 transition-all cursor-pointer group">
              <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${
                currentPeakTicket?.type === 'telecom'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
              }`}>
                {currentPeakTicket?.type === 'telecom' ? <Phone className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <span>{currentPeakTicket?.type === 'telecom' ? 'Peak SIM Recharge' : 'Peak Single Repair'}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-orange-400 transition-colors" />
                </div>
                <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
                  {formatCurrency(currentPeakTicket ? currentPeakTicket.cost : 0)}
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {currentPeakTicket
                    ? `${currentPeakTicket.problem} (${currentPeakTicket.type === 'telecom' ? currentPeakTicket.contactNumber : currentPeakTicket.assetNumber})`
                    : 'None in view'}
                </p>
              </div>
            </div>

            {/* Highlight 2: Avg Ticket / Recharge Benchmark */}
            <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-[#0d131f] border border-slate-200/80 dark:border-[#1e293b] flex items-center gap-3.5 shadow-2xs hover:border-blue-500/40 transition-all cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                <IndianRupee className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <span>Average Event Cost</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                </div>
                <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
                  {formatCurrency(currentAvgTicket)}
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  Across {currentTicketsInView.length} events ({spendStream === 'all' ? 'Hardware & Telecom' : spendStream})
                </p>
              </div>
            </div>

            {/* Highlight 3: Contact Number & SIM Telecom Subtotal */}
            <div
              onClick={() => setActiveTab('sim-management')}
              className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-[#0d131f] border border-slate-200/80 dark:border-[#1e293b] flex items-center gap-3.5 shadow-2xs hover:border-emerald-500/40 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <span>Contact Number Spend</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </div>
                <div className="text-xl font-black font-mono text-emerald-500 dark:text-emerald-400 mt-0.5">
                  {formatCurrency(filteredTelecomSpendTotal)}
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {simCards.length} Active SIMs • {simRecharges.length} Recharges (18% GST Incl.)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3.5. ASSET REPAIR & MAINTENANCE ANALYTICS (FLEET-WIDE DYNAMIC HARDWARE SERVICE ANALYTICS) */}
      <div className="relative overflow-hidden bg-white dark:bg-[#0e1626] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-xl space-y-5 transition-all duration-300">
        {/* Subtle Decorative Background Glow (Dark Mode Only) */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/5 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Card Header & Dynamic Toggles */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/20 via-indigo-500/15 to-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/30 shadow-md shadow-blue-500/10 shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white uppercase tracking-wider bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-200 dark:to-slate-300 bg-clip-text text-transparent">
                  Asset Repair & Maintenance Analytics
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Database
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-200/50 dark:border-slate-700/50">
                  • {fleetAssetRepairStatsData.filter(a => a.repairCount > 0).length} Serviced Assets
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Fleet-wide repair frequencies, hardware failure categories, and maintenance expenditure across all company assets
              </p>
            </div>
          </div>

          {/* Metric Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-[#080d1a] p-1 rounded-xl border border-slate-200/80 dark:border-slate-800/80 self-start lg:self-auto shadow-inner">
            <button
              type="button"
              onClick={() => setRepairMetricMode('both')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                repairMetricMode === 'both'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              Repairs & Cost
            </button>
            <button
              type="button"
              onClick={() => setRepairMetricMode('repairs')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                repairMetricMode === 'repairs'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              Repair Count Only
            </button>
            <button
              type="button"
              onClick={() => setRepairMetricMode('cost')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                repairMetricMode === 'cost'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              Repair Cost Only (₹)
            </button>
          </div>
        </div>

        {/* Quick Metrics KPI Banner (Fleet Level) */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-3.5 bg-gradient-to-br from-blue-50/80 via-blue-50/30 to-white dark:from-blue-950/30 dark:via-blue-900/15 dark:to-[#0e1626] rounded-xl border border-blue-200/70 dark:border-blue-900/50 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Total Fleet Repairs</span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wrench className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {fleetAssetRepairStatsData.reduce((acc, curr) => acc + curr.repairCount, 0)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Incidents</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              Across {fleetAssetRepairStatsData.filter(a => a.repairCount > 0).length} serviced devices
            </div>
          </div>

          <div className="p-3.5 bg-gradient-to-br from-emerald-50/80 via-emerald-50/30 to-white dark:from-emerald-950/30 dark:via-emerald-900/15 dark:to-[#0e1626] rounded-xl border border-emerald-200/70 dark:border-emerald-900/50 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Total Repair Outlay</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <IndianRupee className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {formatCurrency(fleetAssetRepairStatsData.reduce((acc, curr) => acc + curr.totalCost, 0))}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              Lifetime fleet maintenance cost
            </div>
          </div>

          <div className="p-3.5 bg-gradient-to-br from-purple-50/80 via-purple-50/30 to-white dark:from-purple-950/30 dark:via-purple-900/15 dark:to-[#0e1626] rounded-xl border border-purple-200/70 dark:border-purple-900/50 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">Most Serviced Asset</span>
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Laptop className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-sm font-bold text-slate-900 dark:text-white truncate">
              {(() => {
                const sorted = [...fleetAssetRepairStatsData].sort((a, b) => b.repairCount - a.repairCount);
                return sorted[0] && sorted[0].repairCount > 0
                  ? `${sorted[0].assetNumber} (${sorted[0].repairCount}x)`
                  : 'None (Healthy)';
              })()}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              Highest repair frequency
            </div>
          </div>

          <div className="p-3.5 bg-gradient-to-br from-amber-50/80 via-amber-50/30 to-white dark:from-amber-950/30 dark:via-amber-900/15 dark:to-[#0e1626] rounded-xl border border-amber-200/70 dark:border-amber-900/50 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Active Repair Tickets</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {serviceRecords.filter(s => s.serviceStatus === 'In Progress').length} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Active</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {serviceRecords.filter(s => s.serviceStatus === 'In Progress').length > 0
                ? 'Under technician diagnosis'
                : 'All workstations active'}
            </div>
          </div>
        </div>

        {/* Filter, Sort & Search Toolbar */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs scrollbar-none">
            {['All', 'Computers', 'Laptop', 'Desktop', 'Mouse', 'Keyboard', 'Headset', 'Monitor', 'Mobile Phone'].map(cat => {
              const stat = categoryServicedCounts[cat] || { serviced: 0, total: 0 };
              const isActive = repairCategoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setRepairCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-md shadow-orange-500/25 border border-orange-400/30'
                      : 'bg-slate-100/90 dark:bg-[#080d1a] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span>{cat === 'All' ? 'All Assets' : cat}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive
                        ? 'bg-orange-700/80 text-white font-bold'
                        : stat.serviced > 0
                        ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 font-semibold'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {stat.serviced}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sort & Search Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search asset or employee..."
                value={repairSearch}
                onChange={e => setRepairSearch(e.target.value)}
                className="pl-8 pr-7 py-1.5 text-xs bg-slate-100/90 dark:bg-[#080d1a] border border-slate-200/80 dark:border-slate-800/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 w-44 sm:w-56 transition-all"
              />
              {repairSearch && (
                <button
                  type="button"
                  onClick={() => setRepairSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <select
              value={repairSortBy}
              onChange={e => setRepairSortBy(e.target.value as any)}
              className="text-xs bg-slate-100/90 dark:bg-[#080d1a] border border-slate-200/80 dark:border-slate-800/80 rounded-xl px-3 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 cursor-pointer font-medium transition-all"
            >
              <option value="cost">Sort: Highest Cost (₹)</option>
              <option value="repairs">Sort: Most Repairs</option>
              <option value="recent">Sort: Recently Serviced</option>
              <option value="name">Sort: Asset ID</option>
            </select>
          </div>
        </div>

        {/* Interactive Recharts Graph */}
        <div className="relative z-10 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-3 text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {repairMetricMode === 'both' && 'Comparison of Repair Counts & Maintenance Expenditure (₹) per Asset'}
              {repairMetricMode === 'repairs' && 'Number of Times Each Asset Has Been Repaired'}
              {repairMetricMode === 'cost' && 'Total Repair & Replacement Cost per Asset (₹ INR)'}
            </span>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
              Tip: Click any bar to inspect repair history & ticket details
            </span>
          </div>

          <div className="h-72 w-full p-2 bg-slate-50/50 dark:bg-[#080d1a]/50 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
            {chartDisplayStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartDisplayStats}
                  margin={{ top: 10, right: 20, left: 0, bottom: 35 }}
                  onClick={(e: any) => {
                    if (e && e.activePayload && e.activePayload.length > 0) {
                      const clicked = e.activePayload[0].payload;
                      setSelectedRepairAssetNumber(clicked.assetNumber);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.12} stroke="#94a3b8" />
                  <XAxis
                    dataKey="displayName"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    interval={0}
                    angle={-18}
                    textAnchor="end"
                  />
                  {repairMetricMode === 'both' ? (
                    <>
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        allowDecimals={false}
                        name="Repairs"
                        label={{ value: 'Repairs (Count)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: '10px' } }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        name="Cost"
                        label={{ value: 'Cost (₹)', angle: 90, position: 'insideRight', style: { fill: '#94a3b8', fontSize: '10px' } }}
                      />
                    </>
                  ) : repairMetricMode === 'repairs' ? (
                    <YAxis
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      allowDecimals={false}
                      name="Repairs"
                      label={{ value: 'Repairs (Times)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: '10px' } }}
                    />
                  ) : (
                    <YAxis
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      name="Cost"
                      label={{ value: 'Repair Cost (₹)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: '10px' } }}
                    />
                  )}
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#fff',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                    }}
                    formatter={(value: any, name: any) => {
                      if (name === 'repairCount' || name === 'Times Repaired') {
                        return [`${value} times`, 'Repairs Logged'];
                      }
                      if (name === 'totalCost' || name === 'Total Repair Cost') {
                        return [formatCurrency(value), 'Total Repair Cost'];
                      }
                      return [value, name];
                    }}
                    labelFormatter={(label: any) => `Asset: ${label}`}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  {(repairMetricMode === 'both' || repairMetricMode === 'repairs') && (
                    <Bar
                      yAxisId={repairMetricMode === 'both' ? 'left' : undefined}
                      dataKey="repairCount"
                      name="Times Repaired"
                      fill="#3b82f6"
                      radius={[6, 6, 0, 0]}
                      cursor="pointer"
                    >
                      {chartDisplayStats.map((entry, index) => (
                        <Cell
                          key={`cell-rep-${index}`}
                          fill={entry.color}
                          opacity={selectedRepairAssetNumber === entry.assetNumber ? 1 : 0.85}
                          stroke={selectedRepairAssetNumber === entry.assetNumber ? '#ffffff' : undefined}
                          strokeWidth={selectedRepairAssetNumber === entry.assetNumber ? 2 : 0}
                        />
                      ))}
                    </Bar>
                  )}
                  {(repairMetricMode === 'both' || repairMetricMode === 'cost') && (
                    <Bar
                      yAxisId={repairMetricMode === 'both' ? 'right' : undefined}
                      dataKey="totalCost"
                      name="Total Repair Cost"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                      cursor="pointer"
                    >
                      {chartDisplayStats.map((entry, index) => (
                        <Cell
                          key={`cell-cost-${index}`}
                          fill={repairMetricMode === 'both' ? '#10b981' : entry.color}
                          opacity={selectedRepairAssetNumber === entry.assetNumber ? 1 : 0.85}
                          stroke={selectedRepairAssetNumber === entry.assetNumber ? '#ffffff' : undefined}
                          strokeWidth={selectedRepairAssetNumber === entry.assetNumber ? 2 : 0}
                        />
                      ))}
                    </Bar>
                  )}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center rounded-xl bg-slate-50/50 dark:bg-[#070b14]/50 border border-dashed border-slate-200 dark:border-slate-800/80">
                {repairSearch.trim() ? (
                  <>
                    <Search className="w-8 h-8 mb-2 opacity-40 text-orange-500" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      No assets found matching "{repairSearch}"
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Try searching by asset ID (e.g. LAP-001, MOU-001) or employee name
                    </p>
                    <button
                      type="button"
                      onClick={() => setRepairSearch('')}
                      className="mt-3 px-3 py-1.5 text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-all cursor-pointer font-medium"
                    >
                      Clear Search
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Zero Repairs Logged for {repairCategoryFilter === 'All' ? 'Fleet' : repairCategoryFilter}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                      All {filteredAssetRepairStats.length} {repairCategoryFilter === 'All' ? 'assets' : repairCategoryFilter} units in fleet are operating normally with ₹0 maintenance spend.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenAddService()}
                        className="px-3 py-1.5 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs shadow-orange-500/20"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Log Service Ticket</span>
                      </button>
                      {repairCategoryFilter !== 'All' && (
                        <button
                          type="button"
                          onClick={() => setRepairCategoryFilter('All')}
                          className="px-3 py-1.5 text-xs bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-all font-medium cursor-pointer"
                        >
                          View All Assets
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Asset Selector Chips */}
        <div className="relative z-10 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Fleet Asset Selector ({filteredAssetRepairStats.length} Devices in scope)
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Click an asset below to inspect tickets & service details
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
            {filteredAssetRepairStats.slice(0, 20).map(item => {
              const isSelected = selectedRepairAssetNumber === item.assetNumber;
              return (
                <button
                  key={item.assetNumber}
                  type="button"
                  onClick={() =>
                    setSelectedRepairAssetNumber(isSelected ? null : item.assetNumber)
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all duration-200 flex items-center gap-2 border cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-md shadow-blue-500/30'
                      : 'bg-slate-50/90 dark:bg-[#080d1a] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800/80 hover:border-blue-400/60 dark:hover:border-blue-500/50 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.assetNumber}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                    isSelected ? 'bg-blue-700/80 text-blue-100 font-bold' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {item.repairCount}x
                  </span>
                  {item.totalCost > 0 && (
                    <span className={`text-[10px] font-mono font-bold ${
                      isSelected ? 'text-emerald-200' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {formatCurrency(item.totalCost)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Asset Detailed Repair History Drawer / Panel */}
        {selectedRepairAsset && (
          <div className="relative z-10 mt-4 p-4.5 rounded-2xl bg-gradient-to-b from-slate-50/90 to-slate-100/50 dark:from-[#0b101b] dark:to-[#080d1a] border border-blue-200 dark:border-blue-900/50 space-y-3.5 shadow-lg animate-fade-in">
            {/* Header of Drawer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md"
                  style={{ backgroundColor: selectedRepairAsset.color }}
                >
                  {selectedRepairAsset.assetType.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedRepairAsset.assetNumber} — {selectedRepairAsset.assetName}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {selectedRepairAsset.assetType}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Assigned to: <strong className="text-slate-800 dark:text-slate-200">{selectedRepairAsset.assignedEmployeeName}</strong> ({selectedRepairAsset.assignedEmployeeDept})
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                    <span>Lifetime Repairs: <strong className="text-slate-900 dark:text-white">{selectedRepairAsset.repairCount}</strong></span>
                    <span>•</span>
                    <span>Total Cost: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(selectedRepairAsset.totalCost)}</strong></span>
                    {selectedRepairAsset.lastRepairedDate && (
                      <>
                        <span>•</span>
                        <span>Last Serviced: <strong>{selectedRepairAsset.lastRepairedDate}</strong></span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('services')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                >
                  <span>Open Service Desk</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRepairAssetNumber(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Close inspection panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Itemized Tickets List */}
            {selectedRepairAsset.records.length > 0 ? (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {selectedRepairAsset.records.map((ticket, idx) => (
                  <div
                    key={ticket.id || idx}
                    className="p-3.5 bg-white dark:bg-[#101726] rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-2.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {ticket.id}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          ticket.serviceStatus === 'Completed'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}>
                          {ticket.serviceStatus}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500 dark:text-slate-400 font-mono">
                          {ticket.serviceDate}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-[11px] text-slate-400">Amount Spent:</span>
                        <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(ticket.serviceCost || 0)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Service / Repair Performed
                        </span>
                        <p className="text-slate-800 dark:text-slate-200 font-medium mt-0.5">
                          {ticket.workPerformed || ticket.problem || 'Diagnostic and hardware servicing.'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Parts Replaced / Installed
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 font-mono mt-0.5">
                          {ticket.partsReplaced || 'None / In-House Maintenance'}
                        </p>
                      </div>
                    </div>

                    {(ticket.resolution || ticket.remarks) && (
                      <div className="text-xs pt-1.5 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                          Service Notes & Resolution Details
                        </span>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                          {ticket.resolution || ticket.remarks}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>Technician: <strong className="text-slate-600 dark:text-slate-300">{ticket.technician || 'Admin / IT Staff'}</strong></span>
                      <span>Category: <strong className="text-slate-600 dark:text-slate-300">{ticket.problemCategory}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800/80 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
                <p className="font-semibold text-slate-800 dark:text-slate-200">Zero Repairs Recorded</p>
                <p className="text-[11px] text-slate-400">This asset is healthy with ₹0 spent on maintenance.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3.6. DATE-WISE SERVICE & MAINTENANCE EXPENSE TELEMETRY */}
      <DateWiseServiceExpenseGraph
        title="Date-Wise Fleet Maintenance & Repair Expense Telemetry"
        onSelectComputer={onSelectComputer}
        onSelectEmployee={onSelectEmployee}
      />

      {/* 4. PERIPHERALS BUFFER & DEPLOYMENT MATRIX (Laptop, Mouse, Keyboard, Headset ONLY) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Hardware Fleet Stock & Buffer Readiness
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Assigned equipment vs immediate buffer capacity across company hardware and mobile categories
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {assignedAssets} in use • {availableAssets} in buffer
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {peripheralCards.map(item => {
            const Icon = item.icon;
            return (
              <div
                key={item.type}
                className="p-4 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-[#1e293b] shadow-xs hover:border-blue-500/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${item.bg} ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white block">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {item.total} Total in Pool
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    !item.isLowBuffer
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  }`}>
                    {!item.isLowBuffer ? 'Healthy Buffer' : 'Low Buffer'}
                  </span>
                </div>

                {/* Dual-Color Segmented Progress Track */}
                <div className="w-full bg-slate-100 dark:bg-[#090d16] h-2 rounded-full overflow-hidden flex">
                  <div
                    className="bg-blue-600 h-full rounded-l-full transition-all duration-500"
                    style={{ width: `${item.assignedPct}%` }}
                    title={`Assigned: ${item.assigned} (${item.assignedPct}%)`}
                  />
                  <div
                    className="bg-emerald-500 h-full rounded-r-full transition-all duration-500"
                    style={{ width: `${item.availablePct}%` }}
                    title={`Available: ${item.available} (${item.availablePct}%)`}
                  />
                </div>

                <div className="flex items-center justify-between mt-2.5 text-[11px] font-mono">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    {item.assigned} Assigned ({item.assignedPct}%)
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {item.available} Spares ({item.availablePct}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. WORKSTATION KIT ALLOCATION MATRIX & DIAGNOSTIC STREAM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side (8 cols): Workstation Kit Allocation Matrix */}
        <div className="lg:col-span-8 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-[#1e293b] shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            {/* Table Header & Interactive Filters */}
            <div className="p-4 border-b border-slate-100 dark:border-[#1e293b] flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Workstation Fleet Matrix & Kit Status
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {filteredWorkstations.length} Staff
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Links each employee with their assigned workstation computer, specifications, and 4-asset kit status
                  </p>
                </div>

                {/* Search & Department Selector */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search personnel or asset..."
                      value={matrixSearch || globalFilters.search}
                      onChange={e => {
                        setMatrixSearch(e.target.value);
                        setGlobalFilters({ search: e.target.value });
                      }}
                      className="pl-8 pr-7 py-1 text-xs bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg focus:outline-hidden focus:border-blue-500 w-48"
                    />
                    {(matrixSearch || globalFilters.search) && (
                      <button
                        onClick={() => {
                          setMatrixSearch('');
                          setGlobalFilters({ search: '' });
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        title="Clear matrix filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <select
                    value={departmentFilter}
                    onChange={e => setDepartmentFilter(e.target.value)}
                    className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg focus:outline-hidden focus:border-blue-500"
                  >
                    {departments.map(d => (
                      <option key={d} value={d}>
                        {d} Dept
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Filter Segmented Controls */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                  Status:
                </span>
                <div className="inline-flex p-0.5 bg-slate-100 dark:bg-[#090d16] rounded-lg border border-slate-200/80 dark:border-[#1e293b]">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                      statusFilter === 'all'
                        ? 'bg-blue-600 text-white shadow-xs font-semibold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    All ({employees.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('equipped')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                      statusFilter === 'equipped'
                        ? 'bg-blue-600 text-white shadow-xs font-semibold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Equipped ({equippedEmployees})
                  </button>
                  <button
                    onClick={() => setStatusFilter('pending')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                      statusFilter === 'pending'
                        ? 'bg-blue-600 text-white shadow-xs font-semibold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Unassigned ({totalEmployees - equippedEmployees})
                  </button>
                  <button
                    onClick={() => setStatusFilter('service')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                      statusFilter === 'service'
                        ? 'bg-amber-600 text-white shadow-xs font-semibold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Under Service ({underServiceComputers.length})
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop / Tablet Matrix Table */}
            <div className="hidden sm:block overflow-x-auto max-h-[460px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-50/95 dark:bg-[#090d16]/95 backdrop-blur-xs z-10">
                  <tr className="border-b border-slate-200 dark:border-[#1e293b] text-slate-500 dark:text-slate-400 font-semibold text-[11px]">
                    <th className="py-2.5 px-4">Employee</th>
                    <th className="py-2.5 px-3">Assigned Computer</th>
                    <th className="py-2.5 px-3">Specs (RAM • Storage)</th>
                    <th className="py-2.5 px-3 text-center">4-Asset Kit</th>
                    <th className="py-2.5 px-3 text-center">Services</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1e293b]">
                  {filteredWorkstations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No workstations found matching the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredWorkstations.map(row => {
                      const isUnderService = row.computer?.status === 'Under Service';
                      return (
                        <tr
                          key={row.emp.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          {/* Employee Name */}
                          <td className="py-3 px-4">
                            <button
                              onClick={() => onSelectEmployee(row.emp.id)}
                              className="flex items-center gap-2.5 text-left group cursor-pointer"
                            >
                              <EmployeeAvatar
                                name={row.emp.name}
                                photoUrl={row.emp.photoUrl}
                                size="sm"
                                status={row.emp.status}
                                showStatusDot={true}
                              />
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">
                                  {row.emp.name}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  {row.emp.employeeId} • {row.emp.department}
                                </div>
                              </div>
                            </button>
                          </td>

                          {/* Assigned Computer */}
                          <td className="py-3 px-3">
                            {row.computer ? (
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                    {row.computer.assetNumber}
                                  </span>
                                  {isUnderService && (
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Under active service" />
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                                  {row.computer.manufacturer} {row.computer.model}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400 italic text-[11px]">
                                  No Computer Assigned
                                </span>
                                {onOpenAssignAsset && (
                                  <button
                                    onClick={() => onOpenAssignAsset(row.emp.id, undefined, 'Laptop')}
                                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors cursor-pointer"
                                    title={`Assign workstation to ${row.emp.name}`}
                                  >
                                    + Assign
                                  </button>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Hardware Specs */}
                          <td className="py-3 px-3">
                            {row.computer ? (
                              <div className="space-y-0.5 font-mono text-[11px]">
                                <div className="text-slate-800 dark:text-slate-200">
                                  {row.computer.memory?.installedRAM || '8 GB RAM'}
                                </div>
                                <div className="text-slate-500 text-[10px]">
                                  {row.computer.storage?.total || '256 GB'} {row.computer.storage?.type || 'SSD'}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* 4-Asset Peripheral Kit Indicators */}
                          <td className="py-3 px-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <span
                                className={`p-1 rounded text-xs ${
                                  row.kit.hasLaptop
                                    ? 'bg-blue-500/10 text-blue-500'
                                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                                }`}
                                title={row.kit.hasLaptop ? 'Laptop Assigned' : 'No Laptop'}
                              >
                                💻
                              </span>
                              <span
                                className={`p-1 rounded text-xs ${
                                  row.kit.hasMouse
                                    ? 'bg-purple-500/10 text-purple-500'
                                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                                }`}
                                title={row.kit.hasMouse ? 'Company Mouse Assigned' : 'No Mouse'}
                              >
                                🖱️
                              </span>
                              <span
                                className={`p-1 rounded text-xs ${
                                  row.kit.hasKeyboard
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                                }`}
                                title={row.kit.hasKeyboard ? 'Company Keyboard Assigned' : 'No Keyboard'}
                              >
                                ⌨️
                              </span>
                              <span
                                className={`p-1 rounded text-xs ${
                                  row.kit.hasHeadset
                                    ? 'bg-amber-500/10 text-amber-500'
                                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                                }`}
                                title={row.kit.hasHeadset ? 'Company Headset Assigned' : 'No Headset'}
                              >
                                🎧
                              </span>
                            </div>
                          </td>

                          {/* Services Count */}
                          <td className="py-3 px-3 text-center">
                            {row.computer ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-semibold ${
                                row.serviceCount >= 3
                                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                              }`}>
                                {row.serviceCount} fix{row.serviceCount !== 1 ? 'es' : ''}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {row.computer && (
                                <button
                                  onClick={() => onSelectComputer(row.computer!.id)}
                                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                                >
                                  Specs
                                </button>
                              )}
                              <button
                                onClick={() => onSelectEmployee(row.emp.id)}
                                className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                              >
                                Profile
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card-List View (Screen width < 640px) */}
            <div className="sm:hidden max-h-[460px] overflow-y-auto p-2 space-y-2.5">
              {filteredWorkstations.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No workstations found matching the selected filter criteria.
                </div>
              ) : (
                filteredWorkstations.map(row => (
                  <div
                    key={row.emp.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => onSelectEmployee(row.emp.id)}
                        className="flex items-center gap-2 text-left min-w-0 cursor-pointer"
                      >
                        <EmployeeAvatar
                          name={row.emp.name}
                          photoUrl={row.emp.photoUrl}
                          size="sm"
                          status={row.emp.status}
                          showStatusDot={true}
                        />
                        <div className="truncate">
                          <div className="font-bold text-slate-900 dark:text-white truncate">
                            {row.emp.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">
                            {row.emp.employeeId} • {row.emp.department}
                          </div>
                        </div>
                      </button>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        row.computer
                          ? row.computer.status === 'Under Service'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {row.computer ? (row.computer.status === 'Under Service' ? 'In Repair' : 'Equipped') : 'Unassigned'}
                      </span>
                    </div>

                    {row.computer ? (
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 space-y-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                            {row.computer.assetNumber}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400">
                            {row.computer.manufacturer} {row.computer.model}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          RAM: {row.computer.memory?.installedRAM || '8 GB'} • SSD: {row.computer.storage?.total || '256 GB'}
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-slate-100/70 dark:bg-slate-800/40 text-[11px] text-slate-400 italic">
                        No workstation computer allocated
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-800 text-[11px]">
                      <div className="flex items-center gap-1 text-xs">
                        <span title={row.kit.hasLaptop ? 'Laptop' : 'No Laptop'}>{row.kit.hasLaptop ? '💻' : '⚪'}</span>
                        <span title={row.kit.hasMouse ? 'Mouse' : 'No Mouse'}>{row.kit.hasMouse ? '🖱️' : '⚪'}</span>
                        <span title={row.kit.hasKeyboard ? 'Keyboard' : 'No Keyboard'}>{row.kit.hasKeyboard ? '⌨️' : '⚪'}</span>
                        <span title={row.kit.hasHeadset ? 'Headset' : 'No Headset'}>{row.kit.hasHeadset ? '🎧' : '⚪'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {row.computer && (
                          <button
                            onClick={() => onSelectComputer(row.computer!.id)}
                            className="px-2 py-1 rounded bg-slate-200/70 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                          >
                            Specs
                          </button>
                        )}
                        <button
                          onClick={() => onSelectEmployee(row.emp.id)}
                          className="px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 font-semibold text-blue-600 dark:text-blue-400 cursor-pointer"
                        >
                          Profile
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-3 border-t border-slate-100 dark:border-[#1e293b] flex items-center justify-between text-[11px] text-slate-500">
            <span>Showing {filteredWorkstations.length} of {employees.length} personnel workstations</span>
            <span>Kit standards: 1 Laptop • 1 Mouse • 1 Keyboard • 1 Headset</span>
          </div>
        </div>

        {/* Right Side (4 cols): Executive Diagnostic & Health Reliability Suite (2 Dense Cards) */}
        <div className="lg:col-span-4 flex flex-col gap-4 justify-between">
          {/* Card 1: Failure Diagnostics & Root Causes with Budget Impact */}
          <div className="rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-[#1e293b] shadow-xs p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-[#1e293b]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Failure Root Causes
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Category frequency & budget impact
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#090d16] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1e293b]">
                {serviceRecords.length} Tickets
              </span>
            </div>

            {/* Donut Chart + Executive Summary KPI */}
            <div className="grid grid-cols-12 gap-3 items-center py-1">
              {/* Donut Chart */}
              <div className="col-span-5 relative h-28 flex items-center justify-center">
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-lg font-black font-mono text-slate-900 dark:text-white leading-none">
                    {serviceRecords.length}
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                    Fixes
                  </span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={diagnosticData}
                      dataKey="cost"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={36}
                      outerRadius={50}
                      paddingAngle={3}
                      stroke="#101726"
                      strokeWidth={2}
                    >
                      {diagnosticData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data: any = payload[0];
                          return (
                            <div className="bg-[#0d131f] border border-[#1e293b] p-2.5 rounded-lg text-xs text-white shadow-xl space-y-1 min-w-[140px]">
                              <span className="font-bold block text-slate-200">{data.name}</span>
                              <div className="font-mono text-blue-400 font-bold">
                                {formatCurrency(data.value)} ({data.payload?.costPct}% spend)
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {data.payload?.count} Ticket{data.payload?.count > 1 ? 's' : ''}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Financial Summary */}
              <div className="col-span-7 space-y-2 border-l border-slate-100 dark:border-[#1e293b] pl-3">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Top Cost Driver
                  </span>
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {diagnosticData[0]?.name || 'N/A'}
                  </div>
                  <span className="text-[10px] font-mono text-amber-500 font-semibold">
                    {formatCurrency(diagnosticData[0]?.cost || 0)} ({diagnosticData[0]?.costPct}% of budget)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Avg Expense / Ticket
                  </span>
                  <span className="text-xs font-mono font-bold text-blue-500 dark:text-blue-400">
                    {formatCurrency(avgTicketCost)}
                  </span>
                </div>
              </div>
            </div>

            {/* Category Breakdown List with Dual Metrics */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-[#1e293b] max-h-40 overflow-y-auto pr-1">
              {diagnosticData.map(item => (
                <div key={item.name} className="p-1 rounded-md hover:bg-slate-50 dark:hover:bg-[#0d131f] transition-colors">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-800 dark:text-slate-200 font-medium truncate">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                      <span className="text-slate-500 text-[10px]">
                        {item.count} fix{item.count > 1 ? 'es' : ''}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.cost)}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-[#090d16] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(item.costPct, 6)}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Active Service Bench & Hardware Reliability Pulse */}
          <div className="rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-[#1e293b] shadow-xs p-4 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#1e293b]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 border border-blue-500/20">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Active Bench & Reliability
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Live maintenance queue & health indices
                  </p>
                </div>
              </div>
              {underServiceComputers.length > 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {underServiceComputers.length} In Progress
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  All Healthy
                </span>
              )}
            </div>

            {/* Active Ticket Banner */}
            {liveActiveTicket ? (
              <div className="p-2.5 rounded-lg bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-bold text-slate-900 dark:text-amber-300">
                      {liveActiveTicket.assetNumber} • {liveActiveTicket.deviceName}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    Active Service
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                  {liveActiveTicket.problem || 'Hardware diagnostic in progress.'}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-amber-500/10">
                  <span>Tech: {liveActiveTicket.technician || 'Assigned Specialist'}</span>
                  <span className="font-mono text-amber-400 font-semibold">{formatCurrency(liveActiveTicket.serviceCost || 0)}</span>
                </div>
              </div>
            ) : latestCompletedTicket ? (
              <div className="p-2.5 rounded-lg bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Latest Done: {latestCompletedTicket.assetNumber}</span>
                  </div>
                  <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    {formatCurrency(latestCompletedTicket.serviceCost || 0)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                  {latestCompletedTicket.workPerformed || latestCompletedTicket.problem}
                </p>
                {latestCompletedTicket.serviceDate && (
                  <div className="text-[10px] text-slate-400 font-mono">
                    Date: {latestCompletedTicket.serviceDate} • By: {latestCompletedTicket.employeeName || 'Staff'}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 flex items-center gap-2.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-slate-600 dark:text-emerald-300">
                  All {totalComputers} workstations are operating normally.
                </span>
              </div>
            )}

            {/* Fleet Reliability Telemetry */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#090d16] border border-slate-100 dark:border-[#1e293b] text-center">
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Fleet Uptime
                </span>
                <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                  99.1%
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#090d16] border border-slate-100 dark:border-[#1e293b] text-center">
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Health Index
                </span>
                <span className="text-sm font-black font-mono text-emerald-500">
                  {fleetHealthScore}%
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#090d16] border border-slate-100 dark:border-[#1e293b] text-center">
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">
                  First-Fix
                </span>
                <span className="text-sm font-black font-mono text-blue-500">
                  100%
                </span>
              </div>
            </div>

            {/* Navigation Button to Service Desk */}
            <button
              onClick={() => setActiveTab('services')}
              className="w-full py-1.5 px-3 text-xs font-semibold rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Open IT Service Desk ({serviceRecords.length} Invoices)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
