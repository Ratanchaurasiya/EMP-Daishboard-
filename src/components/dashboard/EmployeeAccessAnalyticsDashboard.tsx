import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Laptop,
  Smartphone,
  Headphones,
  Keyboard,
  Mouse,
  PackageCheck,
  Wrench,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
  Plus,
  ShieldCheck,
  Building,
  Briefcase,
  Layers,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Zap,
  Tag,
  ArrowUpDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { EmployeeAvatar } from '../common/EmployeeAvatar';
import { formatCurrency, formatDateDisplay } from '../../utils/formatters';
import { Computer, CompanyAsset, Employee, AssetCondition, AssetStatus } from '../../types';

interface EmployeeAccessAnalyticsDashboardProps {
  onSelectEmployee: (empId: string) => void;
  onSelectComputer?: (compId: string) => void;
  onOpenAssignAsset?: (empId?: string, assetId?: string, assetType?: any) => void;
  onOpenAddService?: (compId?: string) => void;
}

export const EmployeeAccessAnalyticsDashboard: React.FC<EmployeeAccessAnalyticsDashboardProps> = ({
  onSelectEmployee,
  onSelectComputer,
  onOpenAssignAsset,
  onOpenAddService,
}) => {
  const {
    employees,
    computers,
    assets,
    serviceRecords,
    setActiveTab,
    showToast,
  } = useApp();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCoverage, setFilterCoverage] = useState<'all' | 'laptop' | 'phone' | 'accessories' | 'fully-equipped' | 'unequipped'>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
  const [chartMetric, setChartMetric] = useState<'resources' | 'departments' | 'status'>('resources');
  const [donutMode, setDonutMode] = useState<'mix' | 'coverage'>('mix');
  const [sortBy, setSortBy] = useState<'name' | 'department' | 'units'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Deduplicated Non-Computer Company Assets (Phones, Peripherals, Gear)
  // Strictly excludes duplicate mirror laptop records to ensure 100% database accuracy
  const nonComputerAssets = useMemo(() => {
    const compAssetNumbers = new Set(computers.map(c => c.assetNumber.trim().toLowerCase()));
    const compSerials = new Set(computers.map(c => (c.serialNumber || '').trim().toLowerCase()).filter(Boolean));
    return assets.filter(a => {
      if (a.assetType === 'Laptop') return false;
      if (compAssetNumbers.has(a.assetNumber.trim().toLowerCase())) return false;
      if (a.serialNumber && compSerials.has(a.serialNumber.trim().toLowerCase())) return false;
      return true;
    });
  }, [assets, computers]);

  // 1. Employee-wise Resource Mapping Ledger
  const employeeLedger = useMemo(() => {
    return employees.map(emp => {
      // Find computer
      const assignedComp = computers.find(
        c => c.assignedEmployeeId === emp.id || c.assignedEmployeeId === emp.employeeId
      );

      // Find non-computer assets for employee
      const empAssets = nonComputerAssets.filter(
        a => a.assignedEmployeeId === emp.id || a.assignedEmployeeId === emp.employeeId
      );

      const assignedPhone = empAssets.find(a => a.assetType === 'Mobile Phone');
      const assignedKeyboards = empAssets.filter(a => a.assetType === 'Keyboard');
      const assignedMice = empAssets.filter(a => a.assetType === 'Mouse');
      const assignedHeadsets = empAssets.filter(a => a.assetType === 'Headset');
      const otherAccessories = empAssets.filter(
        a => !['Mobile Phone', 'Keyboard', 'Mouse', 'Headset'].includes(a.assetType)
      );

      const allAccessories = empAssets.filter(a => a.assetType !== 'Mobile Phone');

      const totalAssignedUnits = (assignedComp ? 1 : 0) + (assignedPhone ? 1 : 0) + allAccessories.length;

      // Status Assessment
      const isFullyEquipped = Boolean(assignedComp && (assignedPhone || allAccessories.length >= 2));
      const hasNoHardware = totalAssignedUnits === 0;
      const isPartiallyEquipped = !isFullyEquipped && !hasNoHardware;

      return {
        emp,
        assignedComp,
        assignedPhone,
        assignedKeyboards,
        assignedMice,
        assignedHeadsets,
        otherAccessories,
        allAccessories,
        totalAssignedUnits,
        isFullyEquipped,
        isPartiallyEquipped,
        hasNoHardware,
      };
    });
  }, [employees, computers, nonComputerAssets]);

  // 2. Summary KPI Metrics (The 6 User-Required Metrics)
  const totalEmployees = employees.length;

  const employeesWithLaptopCount = useMemo(() => {
    return employeeLedger.filter(item => Boolean(item.assignedComp)).length;
  }, [employeeLedger]);

  const employeesWithPhoneCount = useMemo(() => {
    return employeeLedger.filter(item => Boolean(item.assignedPhone)).length;
  }, [employeeLedger]);

  const employeesWithAccessoriesCount = useMemo(() => {
    return employeeLedger.filter(item => item.allAccessories.length > 0).length;
  }, [employeeLedger]);

  const fullyEquippedEmployeesCount = useMemo(() => {
    return employeeLedger.filter(item => item.isFullyEquipped).length;
  }, [employeeLedger]);

  const unequippedEmployeesCount = useMemo(() => {
    return employeeLedger.filter(item => item.hasNoHardware).length;
  }, [employeeLedger]);

  // Hardware totals - calculated strictly from unique entity stores
  const totalLaptops = computers.length;
  const totalPhones = nonComputerAssets.filter(a => a.assetType === 'Mobile Phone').length;
  const totalAccessories = nonComputerAssets.filter(a => a.assetType !== 'Mobile Phone').length;
  const totalFleetItems = totalLaptops + nonComputerAssets.length;

  const assignedLaptopsCount = computers.filter(c => c.status === 'Assigned').length;
  const assignedPhonesCount = nonComputerAssets.filter(a => a.assetType === 'Mobile Phone' && a.status === 'Assigned').length;
  const assignedAccessoriesCount = nonComputerAssets.filter(a => a.assetType !== 'Mobile Phone' && a.status === 'Assigned').length;
  const totalAssignedAssets = assignedLaptopsCount + assignedPhonesCount + assignedAccessoriesCount;

  const availableLaptopsCount = computers.filter(c => c.status === 'Available' || !c.assignedEmployeeId).length;
  const availablePhonesCount = nonComputerAssets.filter(a => a.assetType === 'Mobile Phone' && (a.status === 'Available' || !a.assignedEmployeeId)).length;
  const availableAccessoriesCount = nonComputerAssets.filter(a => a.assetType !== 'Mobile Phone' && (a.status === 'Available' || !a.assignedEmployeeId)).length;
  const totalAvailableAssets = availableLaptopsCount + availablePhonesCount + availableAccessoriesCount;

  const underServiceLaptopsCount = computers.filter(c => c.status === 'Under Service').length;
  const underServiceAssetsCount = nonComputerAssets.filter(a => a.status === 'Under Service').length;
  const totalUnderServiceAssets = underServiceLaptopsCount + underServiceAssetsCount;

  const retiredAssetsCount = computers.filter(c => c.status === 'Retired').length + nonComputerAssets.filter(a => a.status === 'Retired').length;

  // Rate calculations
  const laptopEquippedRate = totalEmployees > 0 ? Math.round((employeesWithLaptopCount / totalEmployees) * 100) : 0;
  const phoneEquippedRate = totalEmployees > 0 ? Math.round((employeesWithPhoneCount / totalEmployees) * 100) : 0;
  const accessoriesEquippedRate = totalEmployees > 0 ? Math.round((employeesWithAccessoriesCount / totalEmployees) * 100) : 0;
  const overallAllocationRate = totalFleetItems > 0 ? Math.round((totalAssignedAssets / totalFleetItems) * 100) : 0;

  // Departments List
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach(e => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set).sort();
  }, [employees]);

  // 3. Visual Analytics Charts Data
  // Donut Chart 1: Available vs Assigned vs Under Repair
  const assetStatusDonutData = useMemo(() => {
    return [
      { name: 'Assigned Custody', shortName: 'Assigned', count: totalAssignedAssets, color: '#3b82f6' },
      { name: 'Available Buffer Spares', shortName: 'Available', count: totalAvailableAssets, color: '#10b981' },
      { name: 'Under Service / Repair', shortName: 'In Repair', count: totalUnderServiceAssets, color: '#f59e0b' },
      { name: 'Decommissioned', shortName: 'Retired', count: retiredAssetsCount, color: '#64748b' },
    ];
  }, [totalAssignedAssets, totalAvailableAssets, totalUnderServiceAssets, retiredAssetsCount]);

  // Donut Chart 2: Employee Provisioning Coverage
  const employeeCoverageDonutData = useMemo(() => {
    const partiallyEquipped = totalEmployees - fullyEquippedEmployeesCount - unequippedEmployeesCount;
    return [
      { name: 'Fully Equipped', count: fullyEquippedEmployeesCount, color: '#10b981' },
      { name: 'Partially Equipped', count: Math.max(0, partiallyEquipped), color: '#3b82f6' },
      { name: 'Unequipped (No Assets)', count: unequippedEmployeesCount, color: '#f59e0b' },
    ];
  }, [totalEmployees, fullyEquippedEmployeesCount, unequippedEmployeesCount]);

  // Donut Chart 2: Assigned Resources Breakdown Mix
  const resourceMixDonutData = useMemo(() => {
    const keyboards = nonComputerAssets.filter(a => a.assetType === 'Keyboard' && a.status === 'Assigned').length;
    const mice = nonComputerAssets.filter(a => a.assetType === 'Mouse' && a.status === 'Assigned').length;
    const headsets = nonComputerAssets.filter(a => a.assetType === 'Headset' && a.status === 'Assigned').length;
    const other = nonComputerAssets.filter(
      a => !['Mobile Phone', 'Keyboard', 'Mouse', 'Headset'].includes(a.assetType) && a.status === 'Assigned'
    ).length;

    return [
      { name: 'Laptops / PCs', shortName: 'Laptops', count: assignedLaptopsCount, color: '#6366f1' },
      { name: 'Mobile Phones', shortName: 'Phones', count: assignedPhonesCount, color: '#06b6d4' },
      { name: 'Keyboards', shortName: 'Keyboards', count: keyboards, color: '#10b981' },
      { name: 'Mice', shortName: 'Mice', count: mice, color: '#8b5cf6' },
      { name: 'Headsets', shortName: 'Headsets', count: headsets, color: '#f59e0b' },
      { name: 'Other Assets', shortName: 'Other', count: other, color: '#ec4899' },
    ].filter(d => d.count > 0);
  }, [assignedLaptopsCount, assignedPhonesCount, nonComputerAssets]);

  // Bar Chart: Company Resources Breakdown (Assigned vs Available vs Repair)
  const resourceAllocationData = useMemo(() => {
    const keyboards = nonComputerAssets.filter(a => a.assetType === 'Keyboard');
    const mice = nonComputerAssets.filter(a => a.assetType === 'Mouse');
    const headsets = nonComputerAssets.filter(a => a.assetType === 'Headset');
    const other = nonComputerAssets.filter(a => !['Mobile Phone', 'Keyboard', 'Mouse', 'Headset'].includes(a.assetType));

    return [
      {
        category: 'Laptops/PCs',
        assigned: assignedLaptopsCount,
        available: availableLaptopsCount,
        repair: underServiceLaptopsCount,
        total: totalLaptops,
      },
      {
        category: 'Mobile Phones',
        assigned: assignedPhonesCount,
        available: availablePhonesCount,
        repair: nonComputerAssets.filter(a => a.assetType === 'Mobile Phone' && a.status === 'Under Service').length,
        total: totalPhones,
      },
      {
        category: 'Keyboards',
        assigned: keyboards.filter(k => k.status === 'Assigned').length,
        available: keyboards.filter(k => k.status === 'Available' || !k.assignedEmployeeId).length,
        repair: keyboards.filter(k => k.status === 'Under Service').length,
        total: keyboards.length,
      },
      {
        category: 'Mice',
        assigned: mice.filter(m => m.status === 'Assigned').length,
        available: mice.filter(m => m.status === 'Available' || !m.assignedEmployeeId).length,
        repair: mice.filter(m => m.status === 'Under Service').length,
        total: mice.length,
      },
      {
        category: 'Headsets',
        assigned: headsets.filter(h => h.status === 'Assigned').length,
        available: headsets.filter(h => h.status === 'Available' || !h.assignedEmployeeId).length,
        repair: headsets.filter(h => h.status === 'Under Service').length,
        total: headsets.length,
      },
      {
        category: 'Other Assets',
        assigned: other.filter(o => o.status === 'Assigned').length,
        available: other.filter(o => o.status === 'Available' || !o.assignedEmployeeId).length,
        repair: other.filter(o => o.status === 'Under Service').length,
        total: other.length,
      },
    ];
  }, [computers, nonComputerAssets, assignedLaptopsCount, availableLaptopsCount, underServiceLaptopsCount, assignedPhonesCount, availablePhonesCount, totalLaptops, totalPhones]);

  // Department Resource Distribution
  const departmentAllocationData = useMemo(() => {
    const map = new Map<string, { dept: string; employees: number; computers: number; phones: number; accessories: number }>();
    
    employees.forEach(emp => {
      const dept = emp.department || 'General';
      if (!map.has(dept)) {
        map.set(dept, { dept, employees: 0, computers: 0, phones: 0, accessories: 0 });
      }
      const item = map.get(dept)!;
      item.employees += 1;
    });

    employeeLedger.forEach(row => {
      const dept = row.emp.department || 'General';
      if (map.has(dept)) {
        const item = map.get(dept)!;
        if (row.assignedComp) item.computers += 1;
        if (row.assignedPhone) item.phones += 1;
        item.accessories += row.allAccessories.length;
      }
    });

    return Array.from(map.values()).slice(0, 8);
  }, [employees, employeeLedger]);

  // 4. Filtered Employee Ledger for Table
  const filteredLedger = useMemo(() => {
    let list = employeeLedger;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => {
        const matchName = item.emp.name.toLowerCase().includes(q);
        const matchId = item.emp.employeeId.toLowerCase().includes(q);
        const matchDept = (item.emp.department || '').toLowerCase().includes(q);
        const matchRole = (item.emp.designation || '').toLowerCase().includes(q);
        const matchComp = item.assignedComp
          ? item.assignedComp.assetNumber.toLowerCase().includes(q) ||
            item.assignedComp.deviceName.toLowerCase().includes(q) ||
            item.assignedComp.model.toLowerCase().includes(q)
          : false;
        const matchPhone = item.assignedPhone
          ? item.assignedPhone.assetNumber.toLowerCase().includes(q) ||
            item.assignedPhone.model.toLowerCase().includes(q) ||
            (item.assignedPhone.phoneNumber && item.assignedPhone.phoneNumber.toLowerCase().includes(q))
          : false;
        const matchAcc = item.allAccessories.some(
          a => a.assetNumber.toLowerCase().includes(q) || a.model.toLowerCase().includes(q) || a.assetType.toLowerCase().includes(q)
        );
        return matchName || matchId || matchDept || matchRole || matchComp || matchPhone || matchAcc;
      });
    }

    // Department Filter
    if (selectedDepartment !== 'all') {
      list = list.filter(item => item.emp.department === selectedDepartment);
    }

    // Coverage Filter
    if (filterCoverage === 'laptop') {
      list = list.filter(item => Boolean(item.assignedComp));
    } else if (filterCoverage === 'phone') {
      list = list.filter(item => Boolean(item.assignedPhone));
    } else if (filterCoverage === 'accessories') {
      list = list.filter(item => item.allAccessories.length > 0);
    } else if (filterCoverage === 'fully-equipped') {
      list = list.filter(item => item.isFullyEquipped);
    } else if (filterCoverage === 'unequipped') {
      list = list.filter(item => item.hasNoHardware);
    }

    // Sort
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') {
        cmp = a.emp.name.localeCompare(b.emp.name);
      } else if (sortBy === 'department') {
        cmp = (a.emp.department || '').localeCompare(b.emp.department || '');
      } else if (sortBy === 'units') {
        cmp = a.totalAssignedUnits - b.totalAssignedUnits;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [employeeLedger, searchQuery, selectedDepartment, filterCoverage, sortBy, sortOrder]);

  // Export CSV Audit Report
  const handleExportCSV = () => {
    const headers = [
      'Employee ID',
      'Name',
      'Department',
      'Designation',
      'Assigned Laptop/Desktop',
      'Laptop Model',
      'Laptop Serial',
      'Assigned Mobile Phone',
      'Phone Number',
      'Assigned Keyboards',
      'Assigned Mice',
      'Assigned Headsets',
      'Other Peripherals',
      'Total Resources Count',
      'Provisioning Status',
    ];

    const rows = employeeLedger.map(item => [
      item.emp.employeeId,
      item.emp.name,
      item.emp.department || 'N/A',
      item.emp.designation || 'Staff',
      item.assignedComp ? `${item.assignedComp.assetNumber} (${item.assignedComp.model})` : 'None',
      item.assignedComp?.model || 'N/A',
      item.assignedComp?.serialNumber || 'N/A',
      item.assignedPhone ? `${item.assignedPhone.assetNumber} (${item.assignedPhone.model})` : 'None',
      item.assignedPhone?.phoneNumber || 'N/A',
      item.assignedKeyboards.map(k => k.assetNumber).join('; ') || 'None',
      item.assignedMice.map(m => m.assetNumber).join('; ') || 'None',
      item.assignedHeadsets.map(h => h.assetNumber).join('; ') || 'None',
      item.otherAccessories.map(o => `${o.assetNumber} (${o.assetType})`).join('; ') || 'None',
      item.totalAssignedUnits,
      item.isFullyEquipped ? 'Fully Equipped' : item.hasNoHardware ? 'Unequipped' : 'Partially Equipped',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Employee_Access_Asset_Analytics_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Employee Access & Asset Allocation Audit CSV downloaded', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. TOP COMMAND HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-[#1e293b]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Employee Access & Asset Analytics
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Workforce hardware custody: {totalAssignedAssets} of {totalFleetItems} devices provisioned across {totalEmployees} active employees
              </p>
            </div>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-[#101726] dark:hover:bg-slate-800 border border-slate-200 dark:border-[#1e293b] text-slate-700 dark:text-slate-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Download employee access & asset allocation audit report"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Export CSV</span>
          </button>

          {onOpenAssignAsset && (
            <button
              onClick={() => onOpenAssignAsset()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>Assign Asset</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. THE 6 EXECUTIVE SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* KPI 1: Total Employees */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-[#1e293b] shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Total Employees</span>
            <Users className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {totalEmployees}
            </span>
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-md font-mono">
              Directory
            </span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 truncate">
            {departments.length} departments active
          </div>
        </div>

        {/* KPI 2: Employees with Assigned Laptop/Desktop */}
        <div
          onClick={() => setFilterCoverage('laptop')}
          className="p-4 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-[#1e293b] shadow-xs hover:border-indigo-500/40 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Assigned Laptop/Desktop</span>
            <Laptop className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
              {employeesWithLaptopCount}
            </span>
            <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-md font-mono">
              {laptopEquippedRate}%
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-900 h-1 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${laptopEquippedRate}%` }} />
          </div>
          <div className="mt-1.5 text-[10px] text-slate-400 flex justify-between font-mono">
            <span>{totalEmployees - employeesWithLaptopCount} without PC</span>
          </div>
        </div>

        {/* KPI 3: Employees with Assigned Mobile Phone */}
        <div
          onClick={() => setFilterCoverage('phone')}
          className="p-4 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-[#1e293b] shadow-xs hover:border-cyan-500/40 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Assigned Mobile Phone</span>
            <Smartphone className="w-3.5 h-3.5 text-cyan-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-cyan-600 dark:text-cyan-400">
              {employeesWithPhoneCount}
            </span>
            <span className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded-md font-mono">
              {phoneEquippedRate}%
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-900 h-1 rounded-full overflow-hidden">
            <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${phoneEquippedRate}%` }} />
          </div>
          <div className="mt-1.5 text-[10px] text-slate-400 flex justify-between font-mono">
            <span>{availablePhonesCount} spare phones</span>
          </div>
        </div>

        {/* KPI 4: Employees with Assigned Accessories */}
        <div
          onClick={() => setFilterCoverage('accessories')}
          className="p-4 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-[#1e293b] shadow-xs hover:border-emerald-500/40 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Assigned Accessories</span>
            <Headphones className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {employeesWithAccessoriesCount}
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md font-mono">
              {accessoriesEquippedRate}%
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-900 h-1 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${accessoriesEquippedRate}%` }} />
          </div>
          <div className="mt-1.5 text-[10px] text-slate-400 flex justify-between font-mono">
            <span>{assignedAccessoriesCount} total gear items</span>
          </div>
        </div>

        {/* KPI 5: Available vs Assigned Assets */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-[#1e293b] shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Available vs. Assigned</span>
            <PackageCheck className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
              {totalAssignedAssets} <span className="text-xs text-slate-400 font-normal">/ {totalAvailableAssets}</span>
            </span>
            <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-md font-mono">
              {overallAllocationRate}%
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-900 h-1 rounded-full overflow-hidden">
            <div className="bg-purple-600 h-full rounded-full" style={{ width: `${overallAllocationRate}%` }} />
          </div>
          <div className="mt-1.5 text-[10px] text-slate-400 flex justify-between font-mono">
            <span>{totalFleetItems} total assets</span>
          </div>
        </div>

        {/* KPI 6: Assets Under Repair */}
        <div
          onClick={() => setActiveTab('services')}
          className="p-4 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-[#1e293b] shadow-xs hover:border-amber-500/40 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Assets Under Repair</span>
            <Wrench className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
              {totalUnderServiceAssets}
            </span>
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md font-mono">
              {serviceRecords.length} Invoices
            </span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-[#1e293b]">
            <span>{underServiceLaptopsCount} PC • {underServiceAssetsCount} Asset</span>
            <span className="text-amber-500 group-hover:underline">Service →</span>
          </div>
        </div>
      </div>

      {/* 3. VISUAL ANALYTICS ENGINE: BAR CHARTS, DONUTS & RESOURCE TELEMETRY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT (4 COLS): DUAL DONUT VISUALIZERS */}
        <div className="lg:col-span-4 space-y-5">
          {/* Donut 1: Available vs Assigned Assets */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-[#1e293b] shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#1e293b]">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Fleet Status Distribution
                </h3>
                <p className="text-[10px] text-slate-400">Available vs. Assigned vs. In Repair</p>
              </div>
              <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded">
                {totalFleetItems} Total
              </span>
            </div>

            {/* Donut Chart */}
            <div className="relative h-44 w-full my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetStatusDonutData.filter(d => d.count > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {assetStatusDonutData
                      .filter(d => d.count > 0)
                      .map(entry => (
                        <Cell key={entry.name} fill={entry.color} stroke="#101726" strokeWidth={1.5} />
                      ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        const pct = totalFleetItems > 0 ? Math.round((d.count / totalFleetItems) * 100) : 0;
                        return (
                          <div className="bg-[#101726] border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs text-white shadow-xl space-y-0.5">
                            <div className="flex items-center gap-1.5 font-bold">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                              {d.name}
                            </div>
                            <div className="text-slate-300 font-mono text-[11px]">
                              {d.count} Units ({pct}%)
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Counter */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                  {totalFleetItems}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                  Total Assets
                </span>
              </div>
            </div>

            {/* Status Legend */}
            <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100 dark:border-[#1e293b] text-[11px]">
              {assetStatusDonutData.map(item => (
                <div
                  key={item.name}
                  className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-[#1e293b] flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 truncate font-medium text-[11px]">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    {item.shortName}
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Donut 2: Interactive Resource Mix & Coverage Visualizer */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-[#1e293b] shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#1e293b]">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  {donutMode === 'mix' ? 'Assigned Resources Mix' : 'Staff Hardware Coverage'}
                </h3>
                <p className="text-[10px] text-slate-400">
                  {donutMode === 'mix' ? 'Laptops, Phones, & Gear Share' : 'Equipped vs. Partially vs. Unequipped'}
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-[#1e293b] p-0.5 bg-slate-50 dark:bg-[#090d16] text-[10px]">
                <button
                  type="button"
                  onClick={() => setDonutMode('mix')}
                  className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                    donutMode === 'mix'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Gear Mix
                </button>
                <button
                  type="button"
                  onClick={() => setDonutMode('coverage')}
                  className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                    donutMode === 'coverage'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Coverage
                </button>
              </div>
            </div>

            {/* Donut Chart Canvas */}
            <div className="relative h-44 w-full my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutMode === 'mix' ? resourceMixDonutData : employeeCoverageDonutData.filter(d => d.count > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {(donutMode === 'mix' ? resourceMixDonutData : employeeCoverageDonutData.filter(d => d.count > 0)).map(
                      entry => (
                        <Cell key={entry.name} fill={entry.color} stroke="#101726" strokeWidth={1.5} />
                      )
                    )}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        const baseTotal = donutMode === 'mix' ? totalAssignedAssets : totalEmployees;
                        const pct = baseTotal > 0 ? Math.round((d.count / baseTotal) * 100) : 0;
                        return (
                          <div className="bg-[#101726] border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs text-white shadow-xl space-y-0.5">
                            <div className="flex items-center gap-1.5 font-bold">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                              {d.name}
                            </div>
                            <div className="text-slate-300 font-mono text-[11px]">
                              {d.count} {donutMode === 'mix' ? 'Units' : 'Staff'} ({pct}%)
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Counter */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                  {donutMode === 'mix' ? totalAssignedAssets : totalEmployees}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                  {donutMode === 'mix' ? 'Assigned' : 'Staff'}
                </span>
              </div>
            </div>

            {/* Bottom Content Depending on Mode */}
            {donutMode === 'mix' ? (
              <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100 dark:border-[#1e293b] text-[11px]">
                {resourceMixDonutData.map(item => (
                  <div
                    key={item.name}
                    className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-[#1e293b] flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 truncate font-medium text-[11px]">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      {item.shortName}
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#1e293b]">
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Fully Equipped
                    </span>
                    <span className="font-mono font-bold">{fullyEquippedEmployeesCount} / {totalEmployees}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${totalEmployees > 0 ? (fullyEquippedEmployeesCount / totalEmployees) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Partially Equipped
                    </span>
                    <span className="font-mono font-bold">
                      {Math.max(0, totalEmployees - fullyEquippedEmployeesCount - unequippedEmployeesCount)} / {totalEmployees}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full"
                      style={{
                        width: `${
                          totalEmployees > 0
                            ? (Math.max(0, totalEmployees - fullyEquippedEmployeesCount - unequippedEmployeesCount) / totalEmployees) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Unequipped
                    </span>
                    <span className="font-mono font-bold text-amber-500">{unequippedEmployeesCount} / {totalEmployees}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{ width: `${totalEmployees > 0 ? (unequippedEmployeesCount / totalEmployees) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT (8 COLS): INTERACTIVE RESOURCE ALLOCATION BAR & AREA ANALYTICS */}
        <div className="lg:col-span-8 p-4 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-[#1e293b] shadow-xs flex flex-col justify-between space-y-4">
          <div>
            {/* Header with Switcher & Exact User Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#1e293b]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                    Company Resource Allocation Analytics
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    {chartMetric === 'resources' ? 'Per Asset Category' : 'Per Department'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Laptops/Desktops, Mobile Phones, Keyboards, Mice, Headsets, and Peripherals assigned vs available buffer
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Metric Selector */}
                <div className="inline-flex rounded-lg border border-slate-200 dark:border-[#1e293b] p-0.5 bg-slate-50 dark:bg-[#090d16] text-xs">
                  <button
                    type="button"
                    onClick={() => setChartMetric('resources')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      chartMetric === 'resources'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Resources
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMetric('departments')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      chartMetric === 'departments'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Departments
                  </button>
                </div>

                {/* Exact Toggle Switch from User Reference Image */}
                <div className="inline-flex p-0.5 bg-[#090d16] dark:bg-[#070b14] rounded-xl border border-slate-800 shadow-inner">
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

            {/* Visualizer Canvas */}
            <div className="h-60 w-full pt-2">
              {chartMetric === 'resources' && (
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'bar' ? (
                    <BarChart data={resourceAllocationData} margin={{ top: 15, right: 15, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.6} />
                      <XAxis dataKey="category" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-[#0d131f]/95 backdrop-blur-md border border-[#1e293b] p-3 rounded-xl text-xs text-white shadow-2xl space-y-1.5 min-w-[200px]">
                                <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1 flex justify-between items-center">
                                  <span>{d.category}</span>
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                                    {d.total} Total
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 space-y-1 pt-0.5 font-mono">
                                  <div className="flex justify-between">
                                    <span className="flex items-center gap-1">
                                      <span className="w-2 h-2 rounded-xs bg-blue-500" />
                                      Assigned Custody:
                                    </span>
                                    <span className="text-slate-100 font-bold">{d.assigned}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="flex items-center gap-1">
                                      <span className="w-2 h-2 rounded-xs bg-emerald-500" />
                                      Available Buffer:
                                    </span>
                                    <span className="text-emerald-400 font-bold">{d.available}</span>
                                  </div>
                                  {d.repair > 0 && (
                                    <div className="flex justify-between">
                                      <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-xs bg-amber-500" />
                                        In Repair:
                                      </span>
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
                      <Legend
                        wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                        formatter={(value) => <span className="text-slate-400">{value}</span>}
                      />
                      <Bar dataKey="assigned" name="Assigned to Staff" fill="#3b82f6" stackId="stack" />
                      <Bar dataKey="available" name="Available Buffer" fill="#10b981" stackId="stack" />
                      <Bar dataKey="repair" name="Under Service / Repair" fill="#f59e0b" stackId="stack" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : (
                    <AreaChart data={resourceAllocationData} margin={{ top: 15, right: 15, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="assignedGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="availableGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.6} />
                      <XAxis dataKey="category" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-[#0d131f]/95 backdrop-blur-md border border-[#1e293b] p-3 rounded-xl text-xs text-white shadow-2xl space-y-1.5 min-w-[190px]">
                                <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1">
                                  {d.category}
                                </div>
                                <div className="text-[11px] font-mono flex justify-between text-blue-400">
                                  <span>Assigned:</span> <b>{d.assigned} Units</b>
                                </div>
                                <div className="text-[11px] font-mono flex justify-between text-emerald-400">
                                  <span>Available:</span> <b>{d.available} Units</b>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Area type="monotone" dataKey="assigned" name="Assigned to Staff" stroke="#3b82f6" strokeWidth={2.5} fill="url(#assignedGradient)" dot={{ r: 4, fill: '#3b82f6' }} />
                      <Area type="monotone" dataKey="available" name="Available Buffer" stroke="#10b981" strokeWidth={2} fill="url(#availableGradient)" dot={{ r: 4, fill: '#10b981' }} />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              )}

              {chartMetric === 'departments' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentAllocationData} margin={{ top: 15, right: 15, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.6} />
                    <XAxis dataKey="dept" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-[#0d131f]/95 backdrop-blur-md border border-[#1e293b] p-3 rounded-xl text-xs text-white shadow-2xl space-y-1.5 min-w-[200px]">
                              <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1 flex justify-between">
                                <span>{d.dept}</span>
                                <span className="font-mono text-blue-400">{d.employees} Staff</span>
                              </div>
                              <div className="text-[10px] text-slate-400 space-y-0.5 font-mono">
                                <div className="flex justify-between text-indigo-300">
                                  <span>Laptops/PCs:</span> <b>{d.computers}</b>
                                </div>
                                <div className="flex justify-between text-cyan-300">
                                  <span>Phones:</span> <b>{d.phones}</b>
                                </div>
                                <div className="flex justify-between text-emerald-300">
                                  <span>Accessories:</span> <b>{d.accessories}</b>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="computers" name="PCs / Laptops" fill="#6366f1" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="phones" name="Mobile Phones" fill="#06b6d4" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="accessories" name="Accessories" fill="#10b981" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Quick Stats Footer */}
          <div className="pt-2.5 border-t border-slate-100 dark:border-[#1e293b] grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">Workforce Size</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">{totalEmployees} Employees</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">PC Provisioning</span>
              <span className="font-mono font-bold text-indigo-500 text-xs">{assignedLaptopsCount} of {totalEmployees} ({laptopEquippedRate}%)</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Mobile Provisioning</span>
              <span className="font-mono font-bold text-cyan-500 text-xs">{assignedPhonesCount} of {totalEmployees} ({phoneEquippedRate}%)</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Available Spares</span>
              <span className="font-mono font-bold text-emerald-500 text-xs">{totalAvailableAssets} in Buffer Stock</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. EMPLOYEE-WISE ASSET ALLOCATION MATRIX */}
      <div className="bg-white dark:bg-[#101726] rounded-2xl p-5 border border-slate-200/80 dark:border-[#1e293b] shadow-xs space-y-4">
        {/* Table Header & Search Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#1e293b]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-500" />
                Employee-wise Asset Allocation Ledger
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                {filteredLedger.length} of {totalEmployees} Staff
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Detailed breakdown of company laptops, mobile devices, keyboards, mice, and headsets assigned to each staff member
            </p>
          </div>

          {/* Search + Filter Inputs */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Box */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search staff, ID, PC, or model..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#1e293b] bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Department Dropdown */}
            {departments.length > 0 && (
              <select
                value={selectedDepartment}
                onChange={e => setSelectedDepartment(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#1e293b] bg-slate-50 dark:bg-[#090d16] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Filter Chips Ribbon */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold scrollbar-none">
          <button
            onClick={() => setFilterCoverage('all')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              filterCoverage === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Staff ({totalEmployees})
          </button>
          <button
            onClick={() => setFilterCoverage('laptop')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filterCoverage === 'laptop'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Laptop className="w-3.5 h-3.5 text-indigo-400" />
            <span>With Laptop / PC ({employeesWithLaptopCount})</span>
          </button>
          <button
            onClick={() => setFilterCoverage('phone')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filterCoverage === 'phone'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>With Mobile Phone ({employeesWithPhoneCount})</span>
          </button>
          <button
            onClick={() => setFilterCoverage('accessories')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filterCoverage === 'accessories'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Headphones className="w-3.5 h-3.5 text-emerald-400" />
            <span>With Accessories ({employeesWithAccessoriesCount})</span>
          </button>
          <button
            onClick={() => setFilterCoverage('fully-equipped')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filterCoverage === 'fully-equipped'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fully Equipped ({fullyEquippedEmployeesCount})</span>
          </button>
          <button
            onClick={() => setFilterCoverage('unequipped')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filterCoverage === 'unequipped'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Unequipped ({unequippedEmployeesCount})</span>
          </button>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-[#1e293b]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#0c121e] border-b border-slate-200/80 dark:border-[#1e293b] text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                <th className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (sortBy === 'name') {
                        setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
                      } else {
                        setSortBy('name');
                        setSortOrder('asc');
                      }
                    }}
                    className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-500 cursor-pointer"
                  >
                    <span>Employee</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (sortBy === 'department') {
                        setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
                      } else {
                        setSortBy('department');
                        setSortOrder('asc');
                      }
                    }}
                    className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-500 cursor-pointer"
                  >
                    <span>Department</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3">Assigned Computer</th>
                <th className="py-3 px-3">Assigned Phone</th>
                <th className="py-3 px-3">Peripherals & Accessories</th>
                <th className="py-3 px-3 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (sortBy === 'units') {
                        setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
                      } else {
                        setSortBy('units');
                        setSortOrder('desc');
                      }
                    }}
                    className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-500 cursor-pointer mx-auto"
                  >
                    <span>Total Custody</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3 text-center">Coverage Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1e293b]">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    <Users className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-xs">No employees found matching filter</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Try clearing search query or selecting a different filter chip.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLedger.map(item => (
                  <tr
                    key={item.emp.id || item.emp.employeeId}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#151e30]/50 transition-colors"
                  >
                    {/* Employee info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <EmployeeAvatar
                          name={item.emp.name}
                          photoUrl={item.emp.photoUrl}
                          size="md"
                        />
                        <div className="truncate max-w-[170px]">
                          <button
                            onClick={() => onSelectEmployee(item.emp.id || item.emp.employeeId)}
                            className="font-bold text-slate-900 dark:text-white hover:text-blue-500 truncate block text-left cursor-pointer"
                          >
                            {item.emp.name}
                          </button>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {item.emp.employeeId} • {item.emp.designation || 'Staff'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <Building className="w-3 h-3 text-slate-400" />
                        {item.emp.department || 'General'}
                      </span>
                    </td>

                    {/* Assigned Computer */}
                    <td className="py-3 px-3">
                      {item.assignedComp ? (
                        <div className="flex items-start gap-1.5">
                          <Laptop className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                          <div>
                            {onSelectComputer ? (
                              <button
                                type="button"
                                onClick={() => onSelectComputer(item.assignedComp!.id)}
                                className="font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline block text-xs cursor-pointer text-left"
                                title="View Computer Specifications & History"
                              >
                                {item.assignedComp.assetNumber}
                              </button>
                            ) : (
                              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 block text-xs">
                                {item.assignedComp.assetNumber}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                              {item.assignedComp.model} ({item.assignedComp.deviceType})
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 italic">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Not Issued
                        </span>
                      )}
                    </td>

                    {/* Assigned Phone */}
                    <td className="py-3 px-3">
                      {item.assignedPhone ? (
                        <div className="flex items-start gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 block text-xs">
                              {item.assignedPhone.assetNumber}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">
                              {item.assignedPhone.model}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 italic">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Not Issued
                        </span>
                      )}
                    </td>

                    {/* Accessories & Peripherals */}
                    <td className="py-3 px-3">
                      {item.allAccessories.length > 0 ? (
                        <div className="flex items-center gap-1 flex-wrap max-w-[220px]">
                          {item.assignedMice.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                              <Mouse className="w-2.5 h-2.5" />
                              {item.assignedMice.length} Mouse
                            </span>
                          )}
                          {item.assignedKeyboards.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <Keyboard className="w-2.5 h-2.5" />
                              {item.assignedKeyboards.length} Keybd
                            </span>
                          )}
                          {item.assignedHeadsets.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              <Headphones className="w-2.5 h-2.5" />
                              {item.assignedHeadsets.length} Headset
                            </span>
                          )}
                          {item.otherAccessories.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20">
                              +{item.otherAccessories.length} Gear
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No Peripherals</span>
                      )}
                    </td>

                    {/* Total Custody Count */}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e293b]">
                        {item.totalAssignedUnits}
                      </span>
                    </td>

                    {/* Coverage Status */}
                    <td className="py-3 px-3 text-center">
                      {item.isFullyEquipped ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Fully Equipped
                        </span>
                      ) : item.hasNoHardware ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <AlertCircle className="w-3 h-3" />
                          Unequipped
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          <Layers className="w-3 h-3" />
                          Partially Equipped
                        </span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectEmployee(item.emp.id || item.emp.employeeId)}
                          className="px-2 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors cursor-pointer"
                          title="View Full Profile"
                        >
                          Profile →
                        </button>
                        {onOpenAssignAsset && (
                          <button
                            onClick={() => onOpenAssignAsset(item.emp.id || item.emp.employeeId)}
                            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                            title="Assign Equipment"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
