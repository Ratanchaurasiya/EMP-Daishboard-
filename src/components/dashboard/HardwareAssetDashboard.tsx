import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Laptop,
  Smartphone,
  Headphones,
  Wrench,
  PackageCheck,
  CheckCircle2,
  Clock,
  Search,
  ArrowRight,
  Plus,
  FileSpreadsheet,
  Layers,
  Mouse,
  Keyboard,
  Shield,
  User,
  Activity,
  Zap,
  Tag,
  ChevronRight,
  TrendingUp,
  BarChart3,
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
  Cell,
} from 'recharts';
import { EmployeeAvatar } from '../common/EmployeeAvatar';
import { formatCurrency, formatDateDisplay } from '../../utils/formatters';
import { Computer, CompanyAsset, AssetCondition, AssetStatus } from '../../types';

interface HardwareAssetDashboardProps {
  onSelectEmployee: (empId: string) => void;
  onSelectComputer: (compId: string) => void;
  onOpenAddComputer: () => void;
  onOpenAssignAsset: (empId?: string, assetId?: string, assetType?: any) => void;
  onOpenAddService: (compId?: string) => void;
  onOpenAddToBuffer?: () => void;
}

export const HardwareAssetDashboard: React.FC<HardwareAssetDashboardProps> = ({
  onSelectEmployee,
  onSelectComputer,
  onOpenAddComputer,
  onOpenAssignAsset,
  onOpenAddService,
  onOpenAddToBuffer,
}) => {
  const {
    employees,
    computers,
    assets,
    serviceRecords,
    setActiveTab,
    exportFleetCSV,
  } = useApp();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSectionTab, setActiveSectionTab] = useState<'all' | 'analytics' | 'computers' | 'phones' | 'accessories' | 'assignments' | 'available' | 'maintenance'>('all');
  const [selectedConditionFilter, setSelectedConditionFilter] = useState<'all' | AssetCondition>('all');
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [availableCategoryFilter, setAvailableCategoryFilter] = useState<'all' | 'computer' | 'phone' | 'accessory'>('all');

  // Interactive Fleet Analytics & Trends Switcher state (Matches user's exact toggle)
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [analyticsMetric, setAnalyticsMetric] = useState<'distribution' | 'spend' | 'status'>('distribution');

  // 1. Core Hardware Computations
  const laptopUnits = useMemo(() => computers.filter(c => c.deviceType === 'Laptop'), [computers]);
  const desktopUnits = useMemo(() => computers.filter(c => c.deviceType === 'Desktop'), [computers]);
  const totalComputers = computers.length;
  const assignedComputers = useMemo(() => computers.filter(c => c.status === 'Assigned'), [computers]);
  const availableComputers = useMemo(() => computers.filter(c => c.status === 'Available' || !c.assignedEmployeeId), [computers]);
  const inRepairComputers = useMemo(() => computers.filter(c => c.status === 'Under Service'), [computers]);

  // 2. Mobile Phones Computations
  const phones = useMemo(() => assets.filter(a => a.assetType === 'Mobile Phone'), [assets]);
  const totalPhones = phones.length;
  const assignedPhones = useMemo(() => phones.filter(p => p.status === 'Assigned' && p.assignedEmployeeId), [phones]);
  const availablePhones = useMemo(() => phones.filter(p => p.status === 'Available' || !p.assignedEmployeeId), [phones]);
  const inRepairPhones = useMemo(() => phones.filter(p => p.status === 'Under Service'), [phones]);

  // 3. Accessories / Peripherals Computations
  const accessories = useMemo(() => assets.filter(a => a.assetType !== 'Mobile Phone' && a.assetType !== 'Laptop'), [assets]);
  const totalAccessories = accessories.length;
  const assignedAccessories = useMemo(() => accessories.filter(a => a.status === 'Assigned' && a.assignedEmployeeId), [accessories]);
  const availableAccessories = useMemo(() => accessories.filter(a => a.status === 'Available' || !a.assignedEmployeeId), [accessories]);

  const mice = useMemo(() => accessories.filter(a => a.assetType === 'Mouse'), [accessories]);
  const keyboards = useMemo(() => accessories.filter(a => a.assetType === 'Keyboard'), [accessories]);
  const headsets = useMemo(() => accessories.filter(a => a.assetType === 'Headset'), [accessories]);
  const otherAccessories = useMemo(() => accessories.filter(a => a.assetType !== 'Mouse' && a.assetType !== 'Keyboard' && a.assetType !== 'Headset'), [accessories]);

  // Total Fleet Aggregation
  const totalFleetItems = totalComputers + totalPhones + totalAccessories;
  const totalAssignedFleet = assignedComputers.length + assignedPhones.length + assignedAccessories.length;
  const totalAvailableFleet = availableComputers.length + availablePhones.length + availableAccessories.length;
  const totalInRepairFleet = inRepairComputers.length + inRepairPhones.length;
  const fleetUtilizationRate = totalFleetItems > 0 ? Math.round((totalAssignedFleet / totalFleetItems) * 100) : 0;

  // 4. Unified Asset Assignment Matrix (Who has what)
  const assignmentRows = useMemo(() => {
    return employees.map(emp => {
      const assignedComp = computers.find(
        c => c.assignedEmployeeId === emp.id || c.assignedEmployeeId === emp.employeeId
      );
      const empAssets = assets.filter(
        a => a.assignedEmployeeId === emp.id || a.assignedEmployeeId === emp.employeeId
      );
      const empPhone = empAssets.find(a => a.assetType === 'Mobile Phone');
      const empPeripherals = empAssets.filter(a => a.assetType !== 'Mobile Phone' && a.assetType !== 'Laptop');
      const totalUnits = (assignedComp ? 1 : 0) + (empPhone ? 1 : 0) + empPeripherals.length;

      return {
        emp,
        assignedComp,
        empPhone,
        empPeripherals,
        totalUnits,
      };
    });
  }, [employees, computers, assets]);

  const filteredAssignmentRows = useMemo(() => {
    if (!assignmentSearch.trim()) return assignmentRows;
    const q = assignmentSearch.toLowerCase().trim();
    return assignmentRows.filter(r => {
      const matchName = r.emp.name.toLowerCase().includes(q);
      const matchId = r.emp.employeeId.toLowerCase().includes(q);
      const matchDept = r.emp.department.toLowerCase().includes(q);
      const matchComp = r.assignedComp
        ? r.assignedComp.assetNumber.toLowerCase().includes(q) ||
          r.assignedComp.deviceName.toLowerCase().includes(q) ||
          r.assignedComp.model.toLowerCase().includes(q)
        : false;
      const matchPhone = r.empPhone
        ? r.empPhone.assetNumber.toLowerCase().includes(q) ||
          r.empPhone.model.toLowerCase().includes(q) ||
          (r.empPhone.phoneNumber && r.empPhone.phoneNumber.toLowerCase().includes(q))
        : false;
      const matchPeripherals = r.empPeripherals.some(
        p => p.assetNumber.toLowerCase().includes(q) || p.assetType.toLowerCase().includes(q)
      );
      return matchName || matchId || matchDept || matchComp || matchPhone || matchPeripherals;
    });
  }, [assignmentRows, assignmentSearch]);

  // 5. Available Assets Buffer (Ready to deploy)
  const allAvailableUnits = useMemo(() => {
    const list: Array<{
      id: string;
      category: 'computer' | 'phone' | 'accessory';
      type: string;
      assetNumber: string;
      title: string;
      model: string;
      serialNumber: string;
      condition: AssetCondition;
      status: string;
      rawObject: Computer | CompanyAsset;
    }> = [];

    availableComputers.forEach(c => {
      list.push({
        id: c.id,
        category: 'computer',
        type: c.deviceType,
        assetNumber: c.assetNumber,
        title: `${c.manufacturer} ${c.model}`,
        model: c.model,
        serialNumber: c.serialNumber,
        condition: c.condition,
        status: c.status,
        rawObject: c,
      });
    });

    availablePhones.forEach(p => {
      list.push({
        id: p.id,
        category: 'phone',
        type: 'Mobile Phone',
        assetNumber: p.assetNumber,
        title: `${p.brand} ${p.model}`,
        model: p.model,
        serialNumber: p.imeiNumber || p.serialNumber,
        condition: p.condition,
        status: p.status,
        rawObject: p,
      });
    });

    availableAccessories.forEach(a => {
      list.push({
        id: a.id,
        category: 'accessory',
        type: a.assetType,
        assetNumber: a.assetNumber,
        title: `${a.brand} ${a.model}`,
        model: a.model,
        serialNumber: a.serialNumber,
        condition: a.condition,
        status: a.status,
        rawObject: a,
      });
    });

    return list;
  }, [availableComputers, availablePhones, availableAccessories]);

  const filteredAvailableUnits = useMemo(() => {
    return allAvailableUnits.filter(item => {
      if (availableCategoryFilter !== 'all' && item.category !== availableCategoryFilter) {
        return false;
      }
      if (selectedConditionFilter !== 'all' && item.condition !== selectedConditionFilter) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchTag = item.assetNumber.toLowerCase().includes(q);
        const matchSerial = item.serialNumber.toLowerCase().includes(q);
        const matchType = item.type.toLowerCase().includes(q);
        if (!matchTitle && !matchTag && !matchSerial && !matchType) return false;
      }
      return true;
    });
  }, [allAvailableUnits, availableCategoryFilter, selectedConditionFilter, searchQuery]);

  // 6. Service & Maintenance Tracker
  const maintenanceTickets = useMemo(() => {
    return [...serviceRecords].sort(
      (a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime()
    );
  }, [serviceRecords]);

  const totalServiceSpend = useMemo(() => {
    return serviceRecords.reduce((sum, s) => sum + (s.serviceCost || 0), 0);
  }, [serviceRecords]);

  // 7. Recently Added / Updated Assets
  const recentlyAddedAssets = useMemo(() => {
    const list: Array<{
      id: string;
      assetNumber: string;
      name: string;
      category: string;
      condition: AssetCondition;
      status: AssetStatus;
      assignedTo?: string;
      date?: string | null;
      type: 'computer' | 'asset';
      raw: Computer | CompanyAsset;
    }> = [];

    computers.forEach(c => {
      const emp = employees.find(e => e.id === c.assignedEmployeeId || e.employeeId === c.assignedEmployeeId);
      list.push({
        id: c.id,
        assetNumber: c.assetNumber,
        name: `${c.manufacturer} ${c.model}`,
        category: c.deviceType,
        condition: c.condition,
        status: c.status,
        assignedTo: emp ? emp.name : undefined,
        date: c.assignedDate,
        type: 'computer',
        raw: c,
      });
    });

    assets.forEach(a => {
      const emp = employees.find(e => e.id === a.assignedEmployeeId || e.employeeId === a.assignedEmployeeId);
      list.push({
        id: a.id,
        assetNumber: a.assetNumber,
        name: `${a.brand} ${a.model}`,
        category: a.assetType,
        condition: a.condition,
        status: a.status,
        assignedTo: emp ? emp.name : undefined,
        date: a.assignedDate,
        type: 'asset',
        raw: a,
      });
    });

    // Return the latest 8 units
    return list.slice(0, 8);
  }, [computers, assets, employees]);

  // Condition Stats Breakdown
  const conditionStats = useMemo(() => {
    const counts: Record<AssetCondition, number> = { New: 0, Good: 0, Fair: 0, Damaged: 0 };
    computers.forEach(c => {
      if (counts[c.condition] !== undefined) counts[c.condition] += 1;
    });
    assets.forEach(a => {
      if (counts[a.condition] !== undefined) counts[a.condition] += 1;
    });
    return counts;
  }, [computers, assets]);

  const retiredCount = useMemo(() => {
    return (
      computers.filter(c => c.status === 'Retired').length +
      assets.filter(a => a.status === 'Retired').length
    );
  }, [computers, assets]);

  // Distribution Data for Bar & Area Visualizations
  const categoryDistributionData = useMemo(() => {
    return [
      {
        name: 'Laptops & PCs',
        shortName: 'Computers',
        count: computers.length,
        fill: '#3b82f6',
        assigned: computers.filter(c => c.status === 'Assigned').length,
        available: computers.filter(c => c.status === 'Available' || !c.assignedEmployeeId).length,
        repair: computers.filter(c => c.status === 'Under Service').length,
      },
      {
        name: 'Mobile Phones',
        shortName: 'Phones',
        count: assets.filter(a => a.assetType === 'Mobile Phone').length,
        fill: '#06b6d4',
        assigned: assets.filter(a => a.assetType === 'Mobile Phone' && a.status === 'Assigned').length,
        available: assets.filter(a => a.assetType === 'Mobile Phone' && (a.status === 'Available' || !a.assignedEmployeeId)).length,
        repair: assets.filter(a => a.assetType === 'Mobile Phone' && a.status === 'Under Service').length,
      },
      {
        name: 'Optical Mice',
        shortName: 'Mice',
        count: assets.filter(a => a.assetType === 'Mouse').length,
        fill: '#8b5cf6',
        assigned: assets.filter(a => a.assetType === 'Mouse' && a.status === 'Assigned').length,
        available: assets.filter(a => a.assetType === 'Mouse' && (a.status === 'Available' || !a.assignedEmployeeId)).length,
        repair: 0,
      },
      {
        name: 'Keyboards',
        shortName: 'Keyboards',
        count: assets.filter(a => a.assetType === 'Keyboard').length,
        fill: '#10b981',
        assigned: assets.filter(a => a.assetType === 'Keyboard' && a.status === 'Assigned').length,
        available: assets.filter(a => a.assetType === 'Keyboard' && (a.status === 'Available' || !a.assignedEmployeeId)).length,
        repair: 0,
      },
      {
        name: 'Audio Headsets',
        shortName: 'Headsets',
        count: assets.filter(a => a.assetType === 'Headset').length,
        fill: '#f59e0b',
        assigned: assets.filter(a => a.assetType === 'Headset' && a.status === 'Assigned').length,
        available: assets.filter(a => a.assetType === 'Headset' && (a.status === 'Available' || !a.assignedEmployeeId)).length,
        repair: 0,
      },
      {
        name: 'Other Gear',
        shortName: 'Other',
        count: assets.filter(a => !['Mobile Phone', 'Mouse', 'Keyboard', 'Headset'].includes(a.assetType)).length,
        fill: '#ec4899',
        assigned: assets.filter(a => !['Mobile Phone', 'Mouse', 'Keyboard', 'Headset'].includes(a.assetType) && a.status === 'Assigned').length,
        available: assets.filter(a => !['Mobile Phone', 'Mouse', 'Keyboard', 'Headset'].includes(a.assetType) && (a.status === 'Available' || !a.assignedEmployeeId)).length,
        repair: 0,
      },
    ];
  }, [computers, assets]);

  // Spend Trend Data for Monthly Maintenance Timeline
  const spendTrendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const yr = d.getFullYear();
      const label = `${months[mIdx]} '${String(yr).slice(2)}`;

      const records = serviceRecords.filter(s => {
        if (!s.serviceDate) return false;
        const sDate = new Date(s.serviceDate);
        return sDate.getMonth() === mIdx && sDate.getFullYear() === yr;
      });

      const cost = records.reduce((sum, r) => sum + (r.serviceCost || 0), 0);
      result.push({
        label,
        name: label,
        cost,
        count: records.length,
        fill: '#3b82f6',
      });
    }
    return result;
  }, [serviceRecords]);

  // Status Breakdown Data
  const statusBreakdownData = useMemo(() => {
    return [
      { name: 'Assigned', shortName: 'Assigned', count: totalAssignedFleet, fill: '#3b82f6' },
      { name: 'Buffer Spares', shortName: 'Available', count: totalAvailableFleet, fill: '#10b981' },
      { name: 'In Repair', shortName: 'Repair', count: totalInRepairFleet, fill: '#f59e0b' },
      { name: 'Decommissioned', shortName: 'Retired', count: retiredCount, fill: '#64748b' },
    ];
  }, [totalAssignedFleet, totalAvailableFleet, totalInRepairFleet, retiredCount]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. TOP COMMAND HEADER & FLEET VALUATION BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-[#1e293b]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Hardware & Asset Intelligence Hub
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Centralized monitoring across {totalFleetItems} devices: {totalComputers} workstations, {totalPhones} phones, and {totalAccessories} accessories
              </p>
            </div>
          </div>
        </div>

        {/* Global Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportFleetCSV()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-[#101726] dark:hover:bg-slate-800 border border-slate-200 dark:border-[#1e293b] text-slate-700 dark:text-slate-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Download full fleet audit CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenAddComputer}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Workstation</span>
          </button>

          <button
            onClick={() => onOpenAssignAsset()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>Assign Equipment</span>
          </button>
        </div>
      </div>

      {/* 2. FLEET HEALTH & SUMMARY TELEMETRY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Overall Fleet Deployment */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-[#1e293b] shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Total Devices Tracked</span>
            <Tag className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {totalFleetItems}
            </span>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md font-mono">
              {fleetUtilizationRate}% Deployed
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${fleetUtilizationRate}%` }}
            />
          </div>
          <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between font-mono">
            <span>{totalAssignedFleet} in active custody</span>
            <span>{totalAvailableFleet} spares in stock</span>
          </div>
        </div>

        {/* KPI 2: Available Spares Ready for Deployment */}
        <div
          onClick={() => setActiveSectionTab('available')}
          className="p-4 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-[#1e293b] shadow-xs hover:border-emerald-500/40 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Available Buffer Stock</span>
            <PackageCheck className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {totalAvailableFleet}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-mono">
              Ready to Issue
            </span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#1e293b]">
            <span>{availableComputers.length} PC • {availablePhones.length} Phones • {availableAccessories.length} Gear</span>
            <span className="text-emerald-500 group-hover:underline">View Buffer →</span>
          </div>
        </div>

        {/* KPI 3: In Repair & Maintenance Tickets */}
        <div
          onClick={() => setActiveSectionTab('maintenance')}
          className="p-4 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-[#1e293b] shadow-xs hover:border-amber-500/40 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Under Service / In Repair</span>
            <Wrench className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
              {totalInRepairFleet}
            </span>
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md font-mono">
              {serviceRecords.length} Invoices
            </span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#1e293b]">
            <span>Spend: {formatCurrency(totalServiceSpend)}</span>
            <span className="text-amber-500 group-hover:underline">Service Desk →</span>
          </div>
        </div>

        {/* KPI 4: Workforce Equipment Custodians */}
        <div
          onClick={() => setActiveSectionTab('assignments')}
          className="p-4 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-[#1e293b] shadow-xs hover:border-indigo-500/40 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Staff Equipment Custody</span>
            <User className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {assignedComputers.length} / {employees.length}
            </span>
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md font-mono">
              Staff Equipped
            </span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#1e293b]">
            <span>{employees.length - assignedComputers.length} unequipped staff</span>
            <span className="text-indigo-500 group-hover:underline">Assignments →</span>
          </div>
        </div>
      </div>

      {/* 3. SECTION NAVIGATION SWITCHER (Tabbed Filter Ribbon) */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-[#1e293b] pb-2 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <button
            onClick={() => setActiveSectionTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeSectionTab === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Sections
          </button>
          <button
            onClick={() => setActiveSectionTab('analytics')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSectionTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Fleet Analytics & Trends</span>
          </button>
          <button
            onClick={() => setActiveSectionTab('computers')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSectionTab === 'computers'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Laptops & PCs ({totalComputers})</span>
          </button>
          <button
            onClick={() => setActiveSectionTab('phones')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSectionTab === 'phones'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile Phones ({totalPhones})</span>
          </button>
          <button
            onClick={() => setActiveSectionTab('accessories')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSectionTab === 'accessories'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Accessories ({totalAccessories})</span>
          </button>
          <button
            onClick={() => setActiveSectionTab('assignments')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSectionTab === 'assignments'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Asset Assignments ({assignmentRows.length})</span>
          </button>
          <button
            onClick={() => setActiveSectionTab('available')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSectionTab === 'available'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Available Spares ({totalAvailableFleet})</span>
          </button>
          <button
            onClick={() => setActiveSectionTab('maintenance')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSectionTab === 'maintenance'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
            <span>Maintenance ({serviceRecords.length})</span>
          </button>
        </div>
      </div>

      {/* INTERACTIVE FLEET & HARDWARE ANALYTICS ENGINE WITH EXACT USER TOGGLE SWITCH */}
      {(activeSectionTab === 'all' || activeSectionTab === 'analytics') && (
        <div className="bg-white dark:bg-[#101726] rounded-2xl p-5 border border-slate-200/80 dark:border-[#1e293b] shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#1e293b]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Fleet Asset & Expenditure Analytics
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20">
                    {chartType === 'area' ? 'Spline Area Trend' : 'Discrete Column Bars'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Interactive visual telemetry tracking category density, monthly maintenance spend trajectories, and inventory lifecycle states
                </p>
              </div>
            </div>

            {/* Controls: Metric Selector & The Exact Chart Switcher */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Metric Selector */}
              <div className="inline-flex p-0.5 bg-slate-100 dark:bg-[#090d16] rounded-lg border border-slate-200/80 dark:border-[#1e293b] text-xs">
                <button
                  type="button"
                  onClick={() => setAnalyticsMetric('distribution')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    analyticsMetric === 'distribution'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Categories
                </button>
                <button
                  type="button"
                  onClick={() => setAnalyticsMetric('spend')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    analyticsMetric === 'spend'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Maintenance Spend (₹)
                </button>
                <button
                  type="button"
                  onClick={() => setAnalyticsMetric('status')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    analyticsMetric === 'status'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Status Distribution
                </button>
              </div>

              {/* Exact Switcher from user's screenshot */}
              <div className="inline-flex p-1 bg-[#090d16] dark:bg-[#070b14] rounded-xl border border-slate-800 shadow-inner">
                <button
                  type="button"
                  onClick={() => setChartType('area')}
                  title="Spline Area Trendline View"
                  className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                    chartType === 'area'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setChartType('bar')}
                  title="Discrete Column Bars View"
                  className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                    chartType === 'bar'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Visualizer + Telemetry Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            {/* Visualizer Canvas (8 Cols) */}
            <div className="lg:col-span-8">
              <div className="h-64 w-full">
                {analyticsMetric === 'distribution' && (
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'area' ? (
                      <AreaChart data={categoryDistributionData} margin={{ top: 15, right: 15, left: -15, bottom: 0 }}>
                        <defs>
                          <linearGradient id="catGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.45} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.6} />
                        <XAxis dataKey="shortName" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-[#0d131f]/95 backdrop-blur-md border border-[#1e293b] p-3 rounded-xl text-xs text-white shadow-2xl space-y-1.5 min-w-[190px]">
                                  <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1 flex justify-between items-center">
                                    <span>{d.name}</span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                                      {d.count} Total
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 space-y-1 pt-0.5 font-mono">
                                    <div className="flex justify-between">
                                      <span>Assigned Staff:</span>
                                      <span className="text-slate-200 font-bold">{d.assigned}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Buffer Spares:</span>
                                      <span className="text-emerald-400 font-bold">{d.available}</span>
                                    </div>
                                    {d.repair > 0 && (
                                      <div className="flex justify-between">
                                        <span>Under Service:</span>
                                        <span className="text-amber-400 font-bold">{d.repair}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2.5} fill="url(#catGradient)" dot={{ r: 4, fill: '#3b82f6', stroke: '#1d4ed8' }} activeDot={{ r: 6 }} />
                      </AreaChart>
                    ) : (
                      <BarChart data={categoryDistributionData} margin={{ top: 15, right: 15, left: -15, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.6} />
                        <XAxis dataKey="shortName" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-[#0d131f]/95 backdrop-blur-md border border-[#1e293b] p-3 rounded-xl text-xs text-white shadow-2xl space-y-1.5 min-w-[190px]">
                                  <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1 flex justify-between items-center">
                                    <span>{d.name}</span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                                      {d.count} Total
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 space-y-1 pt-0.5 font-mono">
                                    <div className="flex justify-between">
                                      <span>Assigned Staff:</span>
                                      <span className="text-slate-200 font-bold">{d.assigned}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Buffer Spares:</span>
                                      <span className="text-emerald-400 font-bold">{d.available}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                          {categoryDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                )}

                {analyticsMetric === 'spend' && (
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'area' ? (
                      <AreaChart data={spendTrendData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="spendGradientFleet" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.45} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.6} />
                        <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={val => `₹${val}`} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-[#0d131f]/95 backdrop-blur-md border border-[#1e293b] p-3 rounded-xl text-xs text-white shadow-2xl space-y-1 min-w-[180px]">
                                  <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1 flex justify-between">
                                    <span>{d.label}</span>
                                    <span className="font-mono text-blue-400 text-[10px]">{d.count} Tickets</span>
                                  </div>
                                  <div className="text-lg font-black font-mono text-blue-400">{formatCurrency(d.cost)}</div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area type="monotone" dataKey="cost" stroke="#3b82f6" strokeWidth={2.5} fill="url(#spendGradientFleet)" dot={{ r: 4, fill: '#3b82f6', stroke: '#1d4ed8' }} activeDot={{ r: 6 }} />
                      </AreaChart>
                    ) : (
                      <BarChart data={spendTrendData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.6} />
                        <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={val => `₹${val}`} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-[#0d131f]/95 backdrop-blur-md border border-[#1e293b] p-3 rounded-xl text-xs text-white shadow-2xl space-y-1 min-w-[180px]">
                                  <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1 flex justify-between">
                                    <span>{d.label}</span>
                                    <span className="font-mono text-blue-400 text-[10px]">{d.count} Tickets</span>
                                  </div>
                                  <div className="text-lg font-black font-mono text-blue-400">{formatCurrency(d.cost)}</div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="cost" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                )}

                {analyticsMetric === 'status' && (
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'area' ? (
                      <AreaChart data={statusBreakdownData} margin={{ top: 15, right: 15, left: -15, bottom: 0 }}>
                        <defs>
                          <linearGradient id="statusGradientFleet" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.6} />
                        <XAxis dataKey="shortName" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-[#0d131f]/95 backdrop-blur-md border border-[#1e293b] p-3 rounded-xl text-xs text-white shadow-2xl space-y-1 min-w-[170px]">
                                  <div className="font-semibold text-slate-200">{d.name}</div>
                                  <div className="text-lg font-black font-mono text-emerald-400">{d.count} Units</div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2.5} fill="url(#statusGradientFleet)" dot={{ r: 4, fill: '#10b981' }} />
                      </AreaChart>
                    ) : (
                      <BarChart data={statusBreakdownData} margin={{ top: 15, right: 15, left: -15, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.6} />
                        <XAxis dataKey="shortName" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-[#0d131f]/95 backdrop-blur-md border border-[#1e293b] p-3 rounded-xl text-xs text-white shadow-2xl space-y-1 min-w-[170px]">
                                  <div className="font-semibold text-slate-200">{d.name}</div>
                                  <div className="text-lg font-black font-mono text-emerald-400">{d.count} Units</div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                          {statusBreakdownData.map((entry, index) => (
                            <Cell key={`cell-status-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Telemetry Summary Cards (4 Cols) */}
            <div className="lg:col-span-4 flex flex-col justify-between space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0c121e] border border-slate-200/70 dark:border-[#1e293b] space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <span>Fleet Utilization</span>
                  <span className="font-mono text-blue-500">{fleetUtilizationRate}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${fleetUtilizationRate}%` }} />
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between font-mono pt-1">
                  <span>{totalAssignedFleet} Assigned</span>
                  <span className="text-emerald-500">{totalAvailableFleet} Buffer Spares</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0c121e] border border-slate-200/70 dark:border-[#1e293b] space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Maintenance Outlay
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                    {formatCurrency(totalServiceSpend)}
                  </span>
                  <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    {serviceRecords.length} Invoices
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  {serviceRecords.length > 0 ? `Avg ${formatCurrency(totalServiceSpend / serviceRecords.length)} per repair invoice` : 'No active repairs logged'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0c121e] border border-slate-200/70 dark:border-[#1e293b] flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Total Tracked Devices
                  </div>
                  <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {totalFleetItems} Units
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {totalComputers} PC • {totalPhones} Phones • {totalAccessories} Gear
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: LAPTOPS / DESKTOPS FLEET MATRIX */}
      {(activeSectionTab === 'all' || activeSectionTab === 'computers') && (
        <div className="bg-white dark:bg-[#101726] rounded-2xl p-5 border border-slate-200/80 dark:border-[#1e293b] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#1e293b]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Laptop className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Laptops & Desktops Workstation Fleet
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Total compute units, active employee allocations, buffer capacity, and maintenance status
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('computers')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              <span>Manage All Computers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 4 Cards: Total, Assigned, Available, In Repair */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-slate-200/80 dark:border-[#1e293b]">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Workstations</span>
              <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
                {totalComputers}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {laptopUnits.length} Laptops • {desktopUnits.length} Desktops
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
              <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">Assigned to Staff</span>
              <div className="text-xl font-black font-mono text-blue-700 dark:text-blue-300 mt-1">
                {assignedComputers.length}
              </div>
              <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80 mt-0.5">
                {totalComputers > 0 ? Math.round((assignedComputers.length / totalComputers) * 100) : 0}% fleet in use
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">Available in Buffer</span>
              <div className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-300 mt-1">
                {availableComputers.length}
              </div>
              <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                Immediate deployment stock
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
              <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">Under Service / Repair</span>
              <div className="text-xl font-black font-mono text-amber-700 dark:text-amber-300 mt-1">
                {inRepairComputers.length}
              </div>
              <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                Active IT desk diagnostic
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: MOBILE PHONES FLEET MATRIX */}
      {(activeSectionTab === 'all' || activeSectionTab === 'phones') && (
        <div className="bg-white dark:bg-[#101726] rounded-2xl p-5 border border-slate-200/80 dark:border-[#1e293b] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#1e293b]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Company Mobile Phones Fleet
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Cellular handheld units, IMEI tracking compliance, and active employee phone numbers
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('phones')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-pink-600 dark:text-pink-400 hover:underline cursor-pointer"
            >
              <span>Manage Mobile Phones</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 4 Cards: Total, Assigned, Available, In Repair */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-slate-200/80 dark:border-[#1e293b]">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Mobile Phones</span>
              <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
                {totalPhones}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                All IMEI registered units
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-pink-50/50 dark:bg-pink-950/20 border border-pink-200/60 dark:border-pink-900/40">
              <span className="text-[10px] uppercase font-bold text-pink-600 dark:text-pink-400 tracking-wider">Assigned to Staff</span>
              <div className="text-xl font-black font-mono text-pink-700 dark:text-pink-300 mt-1">
                {assignedPhones.length}
              </div>
              <p className="text-[11px] text-pink-600/80 dark:text-pink-400/80 mt-0.5">
                In field or on-call custody
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">Available in Buffer</span>
              <div className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-300 mt-1">
                {availablePhones.length}
              </div>
              <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                Ready for new employee issue
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
              <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">Under Service</span>
              <div className="text-xl font-black font-mono text-amber-700 dark:text-amber-300 mt-1">
                {inRepairPhones.length}
              </div>
              <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                Battery/Screen maintenance
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: ACCESSORIES & PERIPHERALS BUFFER */}
      {(activeSectionTab === 'all' || activeSectionTab === 'accessories') && (
        <div className="bg-white dark:bg-[#101726] rounded-2xl p-5 border border-slate-200/80 dark:border-[#1e293b] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#1e293b]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Accessories & Peripherals Buffer
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Mice, keyboards, headsets, and hardware gear readiness across company stock
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('assets')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
            >
              <span>Manage All Peripherals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Mice */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-slate-200/80 dark:border-[#1e293b] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Mouse className="w-3.5 h-3.5 text-blue-500" />
                  <span>Optical Mice</span>
                </span>
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  {mice.length} Total
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-blue-600 dark:text-blue-400">
                  {mice.filter(m => m.status === 'Assigned').length} Assigned
                </span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {mice.filter(m => m.status === 'Available' || !m.assignedEmployeeId).length} Available
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-blue-600 h-full"
                  style={{ width: `${mice.length > 0 ? (mice.filter(m => m.status === 'Assigned').length / mice.length) * 100 : 0}%` }}
                />
                <div
                  className="bg-emerald-500 h-full"
                  style={{ width: `${mice.length > 0 ? (mice.filter(m => m.status === 'Available' || !m.assignedEmployeeId).length / mice.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Keyboards */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-slate-200/80 dark:border-[#1e293b] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Keyboard className="w-3.5 h-3.5 text-purple-500" />
                  <span>Keyboards</span>
                </span>
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  {keyboards.length} Total
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-blue-600 dark:text-blue-400">
                  {keyboards.filter(k => k.status === 'Assigned').length} Assigned
                </span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {keyboards.filter(k => k.status === 'Available' || !k.assignedEmployeeId).length} Available
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-purple-600 h-full"
                  style={{ width: `${keyboards.length > 0 ? (keyboards.filter(k => k.status === 'Assigned').length / keyboards.length) * 100 : 0}%` }}
                />
                <div
                  className="bg-emerald-500 h-full"
                  style={{ width: `${keyboards.length > 0 ? (keyboards.filter(k => k.status === 'Available' || !k.assignedEmployeeId).length / keyboards.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Headsets */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-slate-200/80 dark:border-[#1e293b] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5 text-amber-500" />
                  <span>VoIP Headsets</span>
                </span>
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  {headsets.length} Total
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-blue-600 dark:text-blue-400">
                  {headsets.filter(h => h.status === 'Assigned').length} Assigned
                </span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {headsets.filter(h => h.status === 'Available' || !h.assignedEmployeeId).length} Available
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-amber-500 h-full"
                  style={{ width: `${headsets.length > 0 ? (headsets.filter(h => h.status === 'Assigned').length / headsets.length) * 100 : 0}%` }}
                />
                <div
                  className="bg-emerald-500 h-full"
                  style={{ width: `${headsets.length > 0 ? (headsets.filter(h => h.status === 'Available' || !h.assignedEmployeeId).length / headsets.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Other Peripherals */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-slate-200/80 dark:border-[#1e293b] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Other Hardware Gear</span>
                </span>
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  {otherAccessories.length} Total
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-blue-600 dark:text-blue-400">
                  {otherAccessories.filter(o => o.status === 'Assigned').length} Assigned
                </span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {otherAccessories.filter(o => o.status === 'Available' || !o.assignedEmployeeId).length} Available
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-blue-500 h-full"
                  style={{ width: `${otherAccessories.length > 0 ? (otherAccessories.filter(o => o.status === 'Assigned').length / otherAccessories.length) * 100 : 0}%` }}
                />
                <div
                  className="bg-emerald-500 h-full"
                  style={{ width: `${otherAccessories.length > 0 ? (otherAccessories.filter(o => o.status === 'Available' || !o.assignedEmployeeId).length / otherAccessories.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: UNIFIED ASSET ASSIGNMENT MATRIX (Who has What) */}
      {(activeSectionTab === 'all' || activeSectionTab === 'assignments') && (
        <div className="bg-white dark:bg-[#101726] rounded-2xl p-5 border border-slate-200/80 dark:border-[#1e293b] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#1e293b]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <PackageCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Asset Assignment Matrix (Staff Custody Ledger)
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Live mapping of each employee with their assigned computer, phone, and accessories
                </p>
              </div>
            </div>

            {/* Assignment Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={assignmentSearch}
                onChange={e => setAssignmentSearch(e.target.value)}
                placeholder="Search staff or asset tag..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#1e293b] rounded-lg w-56 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          {filteredAssignmentRows.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-50 dark:bg-[#0d131f] rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <User className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold">No employee assignments match your search.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-[#1e293b] text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="py-2.5 px-3">Employee</th>
                    <th className="py-2.5 px-3">Primary Workstation</th>
                    <th className="py-2.5 px-3">Mobile Phone</th>
                    <th className="py-2.5 px-3">Peripherals Kit</th>
                    <th className="py-2.5 px-3 text-center">Total Units</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1e293b]">
                  {filteredAssignmentRows.map(row => (
                    <tr
                      key={row.emp.id}
                      onClick={() => onSelectEmployee(row.emp.id)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      {/* Employee Info */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <EmployeeAvatar
                            name={row.emp.name}
                            photoUrl={row.emp.photoUrl}
                            size="sm"
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block group-hover:text-blue-500 transition-colors">
                              {row.emp.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {row.emp.employeeId} • {row.emp.department}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Computer Workstation */}
                      <td className="py-3 px-3">
                        {row.assignedComp ? (
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs block">
                              {row.assignedComp.assetNumber}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate max-w-xs">
                              {row.assignedComp.manufacturer} {row.assignedComp.model}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No PC Assigned</span>
                        )}
                      </td>

                      {/* Mobile Phone */}
                      <td className="py-3 px-3">
                        {row.empPhone ? (
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-pink-600 dark:text-pink-400 text-xs block">
                              {row.empPhone.assetNumber}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate max-w-xs">
                              {row.empPhone.brand} {row.empPhone.model}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No Phone Issued</span>
                        )}
                      </td>

                      {/* Peripherals */}
                      <td className="py-3 px-3">
                        {row.empPeripherals.length > 0 ? (
                          <div className="flex items-center gap-1 flex-wrap">
                            {row.empPeripherals.map(p => (
                              <span
                                key={p.id}
                                className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                              >
                                {p.assetType}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">None</span>
                        )}
                      </td>

                      {/* Total Assigned Units */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono font-bold px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {row.totalUnits}
                        </span>
                      </td>

                      {/* View Profile Action */}
                      <td className="py-3 px-3 text-right">
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold group-hover:underline inline-flex items-center gap-1">
                          <span>View Profile</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION 5: ASSET STATUS & CONDITION INSPECTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Physical Condition Breakdown */}
        <div className="bg-white dark:bg-[#101726] rounded-2xl p-5 border border-slate-200/80 dark:border-[#1e293b] shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e293b] pb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-blue-500" />
              <span>Fleet Physical Condition Inspector</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">{totalFleetItems} items</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">New / Sealed</span>
              <div className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-300 mt-1">
                {conditionStats.New}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Good / Optimal</span>
              <div className="text-xl font-black font-mono text-blue-700 dark:text-blue-300 mt-1">
                {conditionStats.Good}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Fair / Aged</span>
              <div className="text-xl font-black font-mono text-amber-700 dark:text-amber-300 mt-1">
                {conditionStats.Fair}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40">
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Damaged / Fix</span>
              <div className="text-xl font-black font-mono text-red-700 dark:text-red-300 mt-1">
                {conditionStats.Damaged}
              </div>
            </div>
          </div>
        </div>

        {/* Operational Lifecycle Status Breakdown */}
        <div className="bg-white dark:bg-[#101726] rounded-2xl p-5 border border-slate-200/80 dark:border-[#1e293b] shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e293b] pb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-indigo-500" />
              <span>Operational Status Distribution</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">100% Audited</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Assigned</span>
              <div className="text-xl font-black font-mono text-indigo-700 dark:text-indigo-300 mt-1">
                {totalAssignedFleet}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Available</span>
              <div className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-300 mt-1">
                {totalAvailableFleet}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">In Repair</span>
              <div className="text-xl font-black font-mono text-amber-700 dark:text-amber-300 mt-1">
                {totalInRepairFleet}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Decommissioned</span>
              <div className="text-xl font-black font-mono text-slate-700 dark:text-slate-300 mt-1">
                {retiredCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 6: SERVICE & MAINTENANCE TRACKER */}
      {(activeSectionTab === 'all' || activeSectionTab === 'maintenance') && (
        <div className="bg-white dark:bg-[#101726] rounded-2xl p-5 border border-slate-200/80 dark:border-[#1e293b] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#1e293b]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Hardware Service & Maintenance Intelligence
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Total spend: {formatCurrency(totalServiceSpend)} across {serviceRecords.length} recorded maintenance events
                </p>
              </div>
            </div>

            <button
              onClick={() => onOpenAddService()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Maintenance Ticket</span>
            </button>
          </div>

          {maintenanceTickets.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-50 dark:bg-[#0d131f] rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mx-auto mb-2" />
              <p className="text-xs font-semibold">Zero maintenance incidents recorded.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">All devices are operating in healthy status.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
              {maintenanceTickets.slice(0, 6).map(ticket => (
                <div
                  key={ticket.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-slate-200/80 dark:border-[#1e293b] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {ticket.assetNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      {ticket.serviceStatus}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block truncate">
                      {ticket.problem}
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                      {ticket.workPerformed}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-[#1e293b] text-[10px] text-slate-400 font-mono">
                    <span>{ticket.employeeName}</span>
                    <span>{formatDateDisplay(ticket.serviceDate)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 7: AVAILABLE ASSETS BUFFER (Ready for Assignment) */}
      {(activeSectionTab === 'all' || activeSectionTab === 'available') && (
        <div className="bg-white dark:bg-[#101726] rounded-2xl p-5 border border-slate-200/80 dark:border-[#1e293b] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#1e293b]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <PackageCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Available Buffer Stock ({filteredAvailableUnits.length} Ready to Assign)
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Unassigned equipment in active inventory, inspected and ready for immediate deployment
                </p>
              </div>
            </div>

            {/* Search, Condition & Category Filter for Available Units */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {onOpenAddToBuffer && (
                <button
                  type="button"
                  onClick={onOpenAddToBuffer}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add to Buffer Stock</span>
                </button>
              )}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search available spares..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-44"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ×
                  </button>
                )}
              </div>

              <select
                value={selectedConditionFilter}
                onChange={e => setSelectedConditionFilter(e.target.value as any)}
                aria-label="Filter available spares by condition"
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">All Conditions</option>
                <option value="New">New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Damaged">Damaged</option>
              </select>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setAvailableCategoryFilter('all')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    availableCategoryFilter === 'all'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  All ({totalAvailableFleet})
                </button>
                <button
                  onClick={() => setAvailableCategoryFilter('computer')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    availableCategoryFilter === 'computer'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  PCs ({availableComputers.length})
                </button>
                <button
                  onClick={() => setAvailableCategoryFilter('phone')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    availableCategoryFilter === 'phone'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Phones ({availablePhones.length})
                </button>
                <button
                  onClick={() => setAvailableCategoryFilter('accessory')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    availableCategoryFilter === 'accessory'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Gear ({availableAccessories.length})
                </button>
              </div>
            </div>
          </div>

          {filteredAvailableUnits.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-50 dark:bg-[#0d131f] rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <PackageCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">No equipment currently in available buffer.</p>
              <p className="text-[11px] text-slate-400 mt-0.5 mb-3.5">All devices are currently allocated to staff or under service.</p>
              <button
                type="button"
                onClick={onOpenAddComputer}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Workstation to Buffer Stock</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
              {filteredAvailableUnits.map(item => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-slate-200/80 dark:border-[#1e293b] flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {item.assetNumber}
                      </span>
                      <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {item.condition}
                      </span>
                    </div>

                    <span className="font-bold text-slate-900 dark:text-white block truncate">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {item.type} • SN: {item.serialNumber}
                    </span>
                  </div>

                  <button
                    onClick={() => onOpenAssignAsset(undefined, item.id, item.type as any)}
                    className="w-full py-1.5 px-2.5 text-[11px] font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Assign to Employee</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 8: RECENTLY ADDED & UPDATED ASSETS STREAM */}
      <div className="bg-white dark:bg-[#101726] rounded-2xl p-5 border border-slate-200/80 dark:border-[#1e293b] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e293b] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Recently Added & Active Assets
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Latest enterprise equipment registered in the database
              </p>
            </div>
          </div>
        </div>

        {recentlyAddedAssets.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-slate-50 dark:bg-[#0d131f] rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <Tag className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold">No assets currently registered in the database.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {recentlyAddedAssets.map(item => (
              <div
                key={item.id}
                onClick={() => {
                  if (item.type === 'computer') onSelectComputer(item.id);
                  else setActiveTab('assets');
                }}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-slate-200/80 dark:border-[#1e293b] hover:border-blue-400/50 transition-colors cursor-pointer group space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                    {item.assetNumber}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {item.category}
                  </span>
                </div>

                <span className="font-bold text-slate-900 dark:text-white block truncate group-hover:text-blue-500 transition-colors">
                  {item.name}
                </span>

                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-[#1e293b]">
                  <span>{item.assignedTo ? `Assigned: ${item.assignedTo}` : 'In Buffer (Available)'}</span>
                  <span className="text-emerald-500">{item.condition}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
