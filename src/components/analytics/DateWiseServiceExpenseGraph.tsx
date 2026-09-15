import React, { useState, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  Calendar,
  IndianRupee,
  Wrench,
  Filter,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  X,
  User,
  Cpu,
  TrendingUp,
  CalendarDays,
  CalendarRange,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ServiceRecord, ProblemCategory } from '../../types';
import { formatCurrency, formatDateDisplay } from '../../utils/formatters';

interface DateWiseServiceExpenseGraphProps {
  onSelectComputer?: (computerId: string) => void;
  onSelectEmployee?: (employeeId: string) => void;
  title?: string;
  defaultExpanded?: boolean;
}

export type GranularityMode = 'daily' | 'monthly' | 'yearly';

interface AggregatedPoint {
  key: string;              // unique key, e.g. "2026-09-10" or "2026-09" or "2026"
  displayLabel: string;     // e.g. "10 Sep 2026" or "Sep 2026" or "2026"
  shortLabel: string;       // X-axis label
  totalCost: number;
  serviceCount: number;
  records: (ServiceRecord & { resolvedAssetType: string })[];
}

export const DateWiseServiceExpenseGraph: React.FC<DateWiseServiceExpenseGraphProps> = ({
  title = 'Fleet Maintenance & Repair Expense Telemetry',
  defaultExpanded = true,
}) => {
  const { serviceRecords, computers, assets } = useApp();

  // Expansion toggle
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  // 1. Time Granularity: 'daily' (Date-wise) | 'monthly' (Monthly) | 'yearly' (Yearly)
  const [granularity, setGranularity] = useState<GranularityMode>('daily');

  // 2. Filter states
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all');

  // Daily Mode Filters
  const [datePreset, setDatePreset] = useState<'all' | '30days' | '90days' | 'year' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Monthly Mode Filter: 'all' or 'YYYY-MM' (e.g. '2026-09')
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Yearly Mode Filter: 'all' or 'YYYY' (e.g. '2026')
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // Metric display mode: cost, count, or both
  const [metricMode, setMetricMode] = useState<'cost' | 'count' | 'both'>('cost');

  // Clicked point on graph to inspect detailed breakdown
  const [inspectedKey, setInspectedKey] = useState<string | null>(null);

  // Helper to resolve exact asset type for any record
  const resolveAssetType = useCallback((rec: ServiceRecord): string => {
    const num = (rec.assetNumber || '').trim().toLowerCase();
    if (!num) return 'Hardware';

    // 1. Match company assets
    const matchedAsset = assets.find(a => (a.assetNumber || '').trim().toLowerCase() === num);
    if (matchedAsset && matchedAsset.assetType) {
      return matchedAsset.assetType;
    }

    // 2. Match computers
    const matchedComp = computers.find(
      c =>
        c.id === rec.computerId ||
        (c.assetNumber || '').trim().toLowerCase() === num
    );
    if (matchedComp) {
      return matchedComp.deviceType || 'Laptop';
    }

    // 3. Fallback to common asset prefix conventions
    const upper = num.toUpperCase();
    if (upper.startsWith('LAP-')) return 'Laptop';
    if (upper.startsWith('DSK-') || upper.startsWith('PC-')) return 'Desktop';
    if (upper.startsWith('KEY-')) return 'Keyboard';
    if (upper.startsWith('MOU-')) return 'Mouse';
    if (upper.startsWith('MON-')) return 'Monitor';
    if (upper.startsWith('PHN-')) return 'Mobile Phone';
    if (upper.startsWith('HED-')) return 'Headset';

    return 'Hardware';
  }, [assets, computers]);

  // Available unique asset types dynamically collected
  const availableAssetTypes = useMemo(() => {
    const types = new Set<string>();
    serviceRecords.forEach(rec => {
      types.add(resolveAssetType(rec));
    });
    return Array.from(types).sort();
  }, [serviceRecords, resolveAssetType]);

  // Available service categories
  const categories: ProblemCategory[] = [
    'Hardware Failure',
    'RAM Problem',
    'SSD/HDD Problem',
    'Software Installation',
    'Windows Problem',
    'Slow Performance',
    'Keyboard Problem',
    'Mouse Problem',
    'Display Problem',
    'Network Problem',
    'Driver Problem',
    'Formatting',
    'Other',
  ];

  // Dynamically collect all available months from records
  const availableMonths = useMemo(() => {
    const monthMap = new Map<string, string>(); // '2026-09' -> 'September 2026'

    // Always include current month
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    monthMap.set(currentKey, currentLabel);

    serviceRecords.forEach(rec => {
      if (!rec.serviceDate) return;
      const key = rec.serviceDate.substring(0, 7);
      if (!monthMap.has(key)) {
        const [y, m] = key.split('-');
        const d = new Date(Number(y), Number(m) - 1, 1);
        if (!isNaN(d.getTime())) {
          monthMap.set(key, d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
        }
      }
    });

    return Array.from(monthMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, label]) => ({ key, label }));
  }, [serviceRecords]);

  // Dynamically collect all available years from records
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    const currentYear = String(new Date().getFullYear());
    years.add(currentYear);

    serviceRecords.forEach(rec => {
      if (!rec.serviceDate) return;
      const y = rec.serviceDate.substring(0, 4);
      if (y && y.length === 4) years.add(y);
    });

    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [serviceRecords]);

  // Filtered service records based on user filter controls and selected granularity
  const filteredRecords = useMemo(() => {
    return serviceRecords.filter(rec => {
      // 1. Asset Type Filter
      if (assetTypeFilter !== 'all') {
        const type = resolveAssetType(rec);
        if (type.toLowerCase() !== assetTypeFilter.toLowerCase()) return false;
      }

      // 2. Service Type / Problem Category Filter
      if (serviceTypeFilter !== 'all') {
        if (rec.problemCategory !== serviceTypeFilter) return false;
      }

      // Valid date validation
      if (!rec.serviceDate) return false;
      const dateStr = rec.serviceDate.substring(0, 10);
      const recTime = new Date(rec.serviceDate).getTime();
      if (isNaN(recTime)) return false;

      // 3. Time Filter based on Granularity
      if (granularity === 'daily') {
        const now = new Date();
        if (datePreset === '30days') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).getTime();
          if (recTime < thirtyDaysAgo) return false;
        } else if (datePreset === '90days') {
          const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).getTime();
          if (recTime < ninetyDaysAgo) return false;
        } else if (datePreset === 'year') {
          const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).getTime();
          if (recTime < oneYearAgo) return false;
        } else if (datePreset === 'custom') {
          if (customStartDate) {
            const startTime = new Date(customStartDate).getTime();
            if (recTime < startTime) return false;
          }
          if (customEndDate) {
            const endTime = new Date(customEndDate).getTime() + 24 * 60 * 60 * 1000 - 1;
            if (recTime > endTime) return false;
          }
        }
      } else if (granularity === 'monthly') {
        if (selectedMonth !== 'all') {
          if (!dateStr.startsWith(selectedMonth)) return false;
        }
      } else if (granularity === 'yearly') {
        if (selectedYear !== 'all') {
          if (!dateStr.startsWith(selectedYear)) return false;
        }
      }

      return true;
    });
  }, [
    serviceRecords,
    assetTypeFilter,
    serviceTypeFilter,
    granularity,
    datePreset,
    customStartDate,
    customEndDate,
    selectedMonth,
    selectedYear,
    resolveAssetType,
  ]);

  // Aggregated Graph Data Points
  const graphData = useMemo<AggregatedPoint[]>(() => {
    const pointMap = new Map<string, AggregatedPoint>();

    filteredRecords.forEach(rec => {
      const dateStr = (rec.serviceDate || '').substring(0, 10);
      if (!dateStr) return;

      const cost = Number(rec.serviceCost) || 0;
      const enhancedRecord = { ...rec, resolvedAssetType: resolveAssetType(rec) };

      let groupKey = '';
      let displayLabel = '';
      let shortLabel = '';

      if (granularity === 'daily') {
        // Daily: group by exact date YYYY-MM-DD
        groupKey = dateStr;
        const [y, m, d] = dateStr.split('-');
        const parsed = new Date(Number(y), Number(m) - 1, Number(d));
        displayLabel = !isNaN(parsed.getTime())
          ? parsed.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
          : dateStr;
        shortLabel = !isNaN(parsed.getTime())
          ? parsed.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
          : dateStr;
      } else if (granularity === 'monthly') {
        if (selectedMonth !== 'all') {
          // Specific Month selected: show daily timeline within that month
          groupKey = dateStr;
          const [y, m, d] = dateStr.split('-');
          const parsed = new Date(Number(y), Number(m) - 1, Number(d));
          displayLabel = !isNaN(parsed.getTime())
            ? parsed.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
            : dateStr;
          shortLabel = !isNaN(parsed.getTime())
            ? parsed.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
            : dateStr;
        } else {
          // All Months: group by month YYYY-MM
          groupKey = dateStr.substring(0, 7);
          const [y, m] = groupKey.split('-');
          const parsed = new Date(Number(y), Number(m) - 1, 1);
          displayLabel = !isNaN(parsed.getTime())
            ? parsed.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            : groupKey;
          shortLabel = !isNaN(parsed.getTime())
            ? parsed.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            : groupKey;
        }
      } else if (granularity === 'yearly') {
        if (selectedYear !== 'all') {
          // Specific Year selected: show monthly breakdown for that year
          groupKey = dateStr.substring(0, 7);
          const [y, m] = groupKey.split('-');
          const parsed = new Date(Number(y), Number(m) - 1, 1);
          displayLabel = !isNaN(parsed.getTime())
            ? parsed.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            : groupKey;
          shortLabel = !isNaN(parsed.getTime())
            ? parsed.toLocaleDateString('en-US', { month: 'short' })
            : groupKey;
        } else {
          // All Years: group by year YYYY
          groupKey = dateStr.substring(0, 4);
          displayLabel = `Year ${groupKey}`;
          shortLabel = groupKey;
        }
      }

      let existing = pointMap.get(groupKey);
      if (!existing) {
        existing = {
          key: groupKey,
          displayLabel,
          shortLabel,
          totalCost: 0,
          serviceCount: 0,
          records: [],
        };
        pointMap.set(groupKey, existing);
      }

      existing.totalCost += cost;
      existing.serviceCount += 1;
      existing.records.push(enhancedRecord);
    });

    return Array.from(pointMap.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [filteredRecords, granularity, selectedMonth, selectedYear, resolveAssetType]);

  // Overall KPI metrics from the filtered graph data
  const totalExpense = useMemo(
    () => graphData.reduce((acc, curr) => acc + curr.totalCost, 0),
    [graphData]
  );
  const totalServices = useMemo(
    () => graphData.reduce((acc, curr) => acc + curr.serviceCount, 0),
    [graphData]
  );
  const activePeriodsCount = graphData.length;
  const avgExpensePerActivePeriod =
    activePeriodsCount > 0 ? Math.round(totalExpense / activePeriodsCount) : 0;

  const peakPoint = useMemo(() => {
    if (graphData.length === 0) return null;
    return [...graphData].sort((a, b) => b.totalCost - a.totalCost)[0];
  }, [graphData]);

  // Point selected for breakdown inspection
  const inspectedPointData = useMemo(() => {
    if (!inspectedKey) return null;
    return graphData.find(d => d.key === inspectedKey) || null;
  }, [inspectedKey, graphData]);

  // Reset filters
  const handleResetFilters = () => {
    setGranularity('daily');
    setAssetTypeFilter('all');
    setServiceTypeFilter('all');
    setDatePreset('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSelectedMonth('all');
    setSelectedYear('all');
    setInspectedKey(null);
  };

  const hasActiveFilters =
    granularity !== 'daily' ||
    assetTypeFilter !== 'all' ||
    serviceTypeFilter !== 'all' ||
    datePreset !== 'all' ||
    customStartDate !== '' ||
    customEndDate !== '' ||
    selectedMonth !== 'all' ||
    selectedYear !== 'all';

  // Y-axis tick formatter (K, M)
  const formatYAxisTick = (val: number) => {
    if (val === 0) return '0';
    if (val >= 1000000) {
      const m = val / 1000000;
      return `${m % 1 === 0 ? m : m.toFixed(1)}M`;
    }
    if (val >= 1000) {
      const k = val / 1000;
      return `${k % 1 === 0 ? k : k.toFixed(1)}K`;
    }
    return `${val}`;
  };

  // Label for selected month/year
  const selectedMonthObj = availableMonths.find(m => m.key === selectedMonth);
  const monthNameText = selectedMonthObj ? selectedMonthObj.label : selectedMonth;

  return (
    <div className="bg-white dark:bg-[#101726] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
      {/* 1. COMPONENT HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {granularity === 'daily'
                  ? 'Date-Wise Fleet Maintenance & Repair Expense Telemetry'
                  : granularity === 'monthly'
                  ? `Monthly Fleet Maintenance & Expense Telemetry ${selectedMonth !== 'all' ? `(${monthNameText})` : ''}`
                  : `Yearly Fleet Maintenance & Expense Telemetry ${selectedYear !== 'all' ? `(${selectedYear})` : ''}`}
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/35">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                {granularity === 'daily'
                  ? 'Date-Wise Telemetry'
                  : granularity === 'monthly'
                  ? 'Monthly Telemetry'
                  : 'Yearly Telemetry'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Track daily, monthly, and yearly service expenditures, repaired devices, and diagnostic tasks
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {/* 3-Way Mode Switcher: Date-wise / Monthly / Yearly */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setGranularity('daily');
                setInspectedKey(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                granularity === 'daily'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 font-bold text-white shadow-md shadow-orange-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="View daily date-wise service data"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Date-wise</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setGranularity('monthly');
                setInspectedKey(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                granularity === 'monthly'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 font-bold text-white shadow-md shadow-orange-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="View monthly aggregated service data"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Monthly</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setGranularity('yearly');
                setInspectedKey(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                granularity === 'yearly'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 font-bold text-white shadow-md shadow-orange-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="View yearly aggregated service data"
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Yearly</span>
            </button>
          </div>

          {/* Metric Selector Toggle (Amount / Count / Both) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setMetricMode('cost')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                metricMode === 'cost'
                  ? 'bg-white dark:bg-[#1e293b] text-orange-500 dark:text-orange-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Amount (₹)
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('count')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                metricMode === 'count'
                  ? 'bg-white dark:bg-[#1e293b] text-orange-500 dark:text-orange-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Count
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('both')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                metricMode === 'both'
                  ? 'bg-white dark:bg-[#1e293b] text-orange-500 dark:text-orange-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Both
            </button>
          </div>

          {/* Minimize / Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-900 cursor-pointer"
            title={isExpanded ? 'Collapse section' : 'Expand section'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* 2. ADVANCED FILTERS BAR (Asset Type, Service Type, Date/Month/Year Window) */}
          <div className="bg-slate-50/80 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Filter className="w-3.5 h-3.5 text-orange-500" />
                <span>
                  Filter Activity &amp; Expenditure ({granularity === 'daily' ? 'Date-wise' : granularity === 'monthly' ? 'Monthly' : 'Yearly'}):
                </span>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              {/* Filter 1: Asset Type */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Asset Type
                </label>
                <select
                  value={assetTypeFilter}
                  onChange={e => {
                    setAssetTypeFilter(e.target.value);
                    setInspectedKey(null);
                  }}
                  className="w-full text-xs bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                >
                  <option value="all">All Asset Types ({serviceRecords.length})</option>
                  {availableAssetTypes.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 2: Service Type / Problem Category */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Service / Problem Type
                </label>
                <select
                  value={serviceTypeFilter}
                  onChange={e => {
                    setServiceTypeFilter(e.target.value);
                    setInspectedKey(null);
                  }}
                  className="w-full text-xs bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                >
                  <option value="all">All Service Types ({serviceRecords.length})</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 3: Granularity-specific Time Selection Filter */}
              {granularity === 'daily' ? (
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Date Range Window
                  </label>
                  <select
                    value={datePreset}
                    onChange={e => {
                      setDatePreset(e.target.value as any);
                      setInspectedKey(null);
                    }}
                    className="w-full text-xs bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                  >
                    <option value="all">All Historical Dates</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="90days">Last 90 Days</option>
                    <option value="year">Past 12 Months</option>
                    <option value="custom">Custom Date Range...</option>
                  </select>
                </div>
              ) : granularity === 'monthly' ? (
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Select Month Window
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={e => {
                      setSelectedMonth(e.target.value);
                      setInspectedKey(null);
                    }}
                    className="w-full text-xs bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer font-semibold text-orange-600 dark:text-orange-400"
                  >
                    <option value="all">All Months (Timeline Overview)</option>
                    {availableMonths.map(m => (
                      <option key={m.key} value={m.key}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Select Year Window
                  </label>
                  <select
                    value={selectedYear}
                    onChange={e => {
                      setSelectedYear(e.target.value);
                      setInspectedKey(null);
                    }}
                    className="w-full text-xs bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer font-semibold text-orange-600 dark:text-orange-400"
                  >
                    <option value="all">All Years (Year-over-Year)</option>
                    {availableYears.map(y => (
                      <option key={y} value={y}>
                        Year {y}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Filter 4: Custom Date Range Inputs or Live Status */}
              {granularity === 'daily' && datePreset === 'custom' ? (
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Custom Start &amp; End
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={e => {
                        setCustomStartDate(e.target.value);
                        setInspectedKey(null);
                      }}
                      className="w-1/2 text-xs bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    <span className="text-slate-400 text-xs">-</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={e => {
                        setCustomEndDate(e.target.value);
                        setInspectedKey(null);
                      }}
                      className="w-1/2 text-xs bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between sm:justify-end gap-2 pt-5">
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Showing {filteredRecords.length} records across {activePeriodsCount}{' '}
                    {granularity === 'daily'
                      ? 'active dates'
                      : granularity === 'monthly'
                      ? (selectedMonth !== 'all' ? 'active dates' : 'months')
                      : (selectedYear !== 'all' ? 'months' : 'years')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 3. QUICK TELEMETRY KPI BANNER */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* KPI 1: Total Amount Charged */}
            <div className="p-3 bg-orange-50/50 dark:bg-orange-950/20 rounded-xl border border-orange-100 dark:border-orange-900/40">
              <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 text-xs font-medium">
                <IndianRupee className="w-3.5 h-3.5" />
                <span>
                  {granularity === 'monthly' && selectedMonth !== 'all'
                    ? `Total Charged (${monthNameText})`
                    : granularity === 'yearly' && selectedYear !== 'all'
                    ? `Total Charged (Year ${selectedYear})`
                    : 'Total Amount Charged'}
                </span>
              </div>
              <div className="mt-1 text-lg font-bold text-slate-900 dark:text-white font-mono">
                {formatCurrency(totalExpense)}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {granularity === 'monthly' && selectedMonth !== 'all'
                  ? `Maintenance spend in ${monthNameText}`
                  : granularity === 'yearly' && selectedYear !== 'all'
                  ? `Maintenance spend in year ${selectedYear}`
                  : 'Total maintenance spend in filter window'}
              </div>
            </div>

            {/* KPI 2: Total Service Incidents */}
            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40">
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-medium">
                <Wrench className="w-3.5 h-3.5" />
                <span>
                  {granularity === 'monthly' && selectedMonth !== 'all'
                    ? `Incidents (${monthNameText})`
                    : granularity === 'yearly' && selectedYear !== 'all'
                    ? `Incidents (${selectedYear})`
                    : 'Total Service Incidents'}
                </span>
              </div>
              <div className="mt-1 text-lg font-bold text-slate-900 dark:text-white font-mono">
                {totalServices} Completed
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Across {activePeriodsCount}{' '}
                {granularity === 'daily'
                  ? 'service dates'
                  : granularity === 'monthly'
                  ? (selectedMonth !== 'all' ? 'active dates' : 'months')
                  : (selectedYear !== 'all' ? 'months' : 'years')}
              </div>
            </div>

            {/* KPI 3: Average Expense */}
            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/40">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-medium">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {granularity === 'daily' || (granularity === 'monthly' && selectedMonth !== 'all')
                    ? 'Avg Daily Expense'
                    : granularity === 'yearly' && selectedYear === 'all'
                    ? 'Avg Yearly Expense'
                    : 'Avg Monthly Expense'}
                </span>
              </div>
              <div className="mt-1 text-lg font-bold text-slate-900 dark:text-white font-mono">
                {formatCurrency(avgExpensePerActivePeriod)}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {granularity === 'daily' || (granularity === 'monthly' && selectedMonth !== 'all')
                  ? 'Per active maintenance day'
                  : granularity === 'yearly' && selectedYear === 'all'
                  ? 'Per active maintenance year'
                  : 'Per active maintenance month'}
              </div>
            </div>

            {/* KPI 4: Peak Expense Period */}
            <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900/40">
              <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 text-xs font-medium">
                <Cpu className="w-3.5 h-3.5" />
                <span>
                  {granularity === 'daily' || (granularity === 'monthly' && selectedMonth !== 'all')
                    ? 'Peak Expense Date'
                    : granularity === 'yearly' && selectedYear === 'all'
                    ? 'Peak Expense Year'
                    : 'Peak Expense Month'}
                </span>
              </div>
              <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white truncate">
                {peakPoint ? peakPoint.displayLabel : 'None'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                {peakPoint ? formatCurrency(peakPoint.totalCost) : '₹0'}
              </div>
            </div>
          </div>

          {/* 4. LINE GRAPH SECTION */}
          <div className="pt-2">
            {/* Legend & Guide Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-5 flex-wrap">
                {(metricMode === 'cost' || metricMode === 'both') && (
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-0.5 bg-[#f59e0b] rounded-full inline-block" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Total Amount Charged (₹)
                    </span>
                  </div>
                )}
                {(metricMode === 'count' || metricMode === 'both') && (
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-0.5 rounded-full inline-block ${
                        metricMode === 'both' ? 'bg-[#3b82f6]' : 'bg-[#f59e0b]'
                      }`}
                    />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Service Count
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span>
                  Tip: Click any data point on the graph to inspect that{' '}
                  {granularity === 'daily' || (granularity === 'monthly' && selectedMonth !== 'all')
                    ? "date's"
                    : granularity === 'monthly'
                    ? "month's"
                    : "year's"}{' '}
                  breakdown
                </span>
                {inspectedKey && (
                  <button
                    type="button"
                    onClick={() => setInspectedKey(null)}
                    className="text-orange-500 dark:text-orange-400 hover:underline font-medium ml-1 cursor-pointer"
                  >
                    Clear selection
                  </button>
                )}
              </div>
            </div>

            {/* Recharts Canvas */}
            <div className="h-72 w-full pt-1">
              {graphData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={graphData}
                    margin={{ top: 10, right: 25, left: 5, bottom: 25 }}
                    onClick={(e: any) => {
                      if (e && e.activePayload && e.activePayload.length > 0) {
                        const clicked = e.activePayload[0].payload as AggregatedPoint;
                        setInspectedKey(clicked.key);
                      }
                    }}
                  >
                    <CartesianGrid
                      stroke="#e2e8f0"
                      className="dark:opacity-15"
                      strokeDasharray=""
                      vertical={true}
                      horizontal={true}
                    />
                    <XAxis
                      dataKey="shortLabel"
                      axisLine={{ stroke: '#64748b', strokeWidth: 1.5 }}
                      tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }}
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                      interval="preserveStartEnd"
                      minTickGap={20}
                      dy={8}
                    />
                    {metricMode === 'both' ? (
                      <>
                        <YAxis
                          yAxisId="left"
                          axisLine={{ stroke: '#64748b', strokeWidth: 1.5 }}
                          tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }}
                          tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                          tickFormatter={formatYAxisTick}
                          dx={-4}
                          name="Amount Charged (₹)"
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          axisLine={{ stroke: '#64748b', strokeWidth: 1.5 }}
                          tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }}
                          tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                          allowDecimals={false}
                          dx={4}
                          name="Service Count"
                        />
                      </>
                    ) : metricMode === 'count' ? (
                      <YAxis
                        axisLine={{ stroke: '#64748b', strokeWidth: 1.5 }}
                        tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }}
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                        allowDecimals={false}
                        dx={-4}
                      />
                    ) : (
                      <YAxis
                        axisLine={{ stroke: '#64748b', strokeWidth: 1.5 }}
                        tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }}
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                        tickFormatter={formatYAxisTick}
                        dx={-4}
                      />
                    )}

                    {/* Rich Tooltip displaying Serviced Asset, Work Performed & Amount Charged */}
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        const data = payload[0].payload as AggregatedPoint;
                        return (
                          <div className="bg-slate-900/95 text-white border border-slate-700/80 rounded-xl p-3 shadow-xl text-xs max-w-sm backdrop-blur-xs z-50">
                            <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-800">
                              <div className="flex items-center gap-1.5 font-bold text-slate-100">
                                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                                <span>{data.displayLabel}</span>
                              </div>
                              <span className="font-mono text-emerald-400 font-bold">
                                {formatCurrency(data.totalCost)}
                              </span>
                            </div>

                            <div className="py-1 text-[11px] text-slate-400 font-medium">
                              {data.serviceCount} service incident{data.serviceCount > 1 ? 's' : ''} logged:
                            </div>

                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {data.records.map((r, i) => (
                                <div
                                  key={r.id || i}
                                  className="p-2 bg-slate-800/80 rounded-lg border border-slate-700/60 text-[11px] space-y-1"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold text-blue-300">
                                      {r.resolvedAssetType} ({r.assetNumber})
                                    </span>
                                    <span className="font-mono text-emerald-400 font-semibold">
                                      {formatCurrency(Number(r.serviceCost) || 0)}
                                    </span>
                                  </div>
                                  <div className="text-slate-200 truncate">
                                    <span className="text-slate-400">Repair: </span>
                                    {r.workPerformed || r.problem}
                                  </div>
                                  <div className="text-[10px] text-slate-400 flex items-center justify-between gap-2">
                                    <span>Tech: {r.technician || 'IT Support'}</span>
                                    <span className="text-amber-300">{r.problemCategory}</span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="pt-2 text-[10px] text-amber-400 text-center font-medium border-t border-slate-800/80 mt-1">
                              Click data point to inspect breakdown
                            </div>
                          </div>
                        );
                      }}
                    />

                    {(metricMode === 'cost' || metricMode === 'both') && (
                      <Line
                        yAxisId={metricMode === 'both' ? 'left' : undefined}
                        type="linear"
                        dataKey="totalCost"
                        name="Amount Charged (₹)"
                        stroke="#f59e0b"
                        strokeWidth={2.4}
                        dot={{ r: 4, fill: '#f97316', stroke: '#fbbf24', strokeWidth: 1.5 }}
                        activeDot={{ r: 7, fill: '#ea580c', stroke: '#ffffff', strokeWidth: 2 }}
                        cursor="pointer"
                      />
                    )}

                    {(metricMode === 'count' || metricMode === 'both') && (
                      <Line
                        yAxisId={metricMode === 'both' ? 'right' : undefined}
                        type="linear"
                        dataKey="serviceCount"
                        name="Service Count"
                        stroke={metricMode === 'both' ? '#3b82f6' : '#f59e0b'}
                        strokeWidth={2.4}
                        dot={{
                          r: 4,
                          fill: metricMode === 'both' ? '#3b82f6' : '#f97316',
                          stroke: '#fbbf24',
                          strokeWidth: 1.5,
                        }}
                        activeDot={{
                          r: 7,
                          fill: metricMode === 'both' ? '#2563eb' : '#ea580c',
                          stroke: '#ffffff',
                          strokeWidth: 2,
                        }}
                        cursor="pointer"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 text-xs py-8 text-center bg-slate-50/50 dark:bg-[#070b14]/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800/80">
                  <Wrench className="w-8 h-8 mb-2 opacity-40 text-orange-500" />
                  <span>No service records match the selected asset, service type, or time filter.</span>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="mt-2 text-xs text-orange-600 dark:text-orange-400 font-semibold hover:underline cursor-pointer"
                    >
                      Reset filters to view all records
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 5. COMPLETE DATA SECTION (FOR SELECTED MONTH OR YEAR) OR CLICKED INSPECTION DRAWER */}
          {/* A. If a specific point was clicked on the graph */}
          {inspectedPointData ? (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Service Activity Breakdown: {inspectedPointData.displayLabel}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-semibold">
                        Total: {formatCurrency(inspectedPointData.totalCost)}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {inspectedPointData.serviceCount} service incident{inspectedPointData.serviceCount > 1 ? 's' : ''} logged for this period
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectedKey(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  title="Close inspection"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Serviced Assets Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {inspectedPointData.records.map((rec, idx) => (
                  <div
                    key={rec.id || idx}
                    className="p-3 bg-white dark:bg-[#101726] rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2 hover:border-orange-500/50 transition-all shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {rec.resolvedAssetType}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white font-mono">
                          {rec.assetNumber}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatCurrency(Number(rec.serviceCost) || 0)}
                      </span>
                    </div>

                    <div className="text-slate-700 dark:text-slate-300 font-medium">
                      {rec.deviceName || 'Company Assigned Device'}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/70 p-2 rounded-lg border border-slate-100 dark:border-slate-800/80 space-y-1">
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Service / Repair: </span>
                        {rec.workPerformed || rec.problem}
                      </div>
                      {rec.partsReplaced && rec.partsReplaced !== 'None' && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Parts: </span>
                          {rec.partsReplaced}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{rec.employeeName || 'Unassigned'}</span>
                      </span>
                      <span className="font-mono text-slate-500">
                        {formatDateDisplay(rec.serviceDate)}
                      </span>
                      <span className="font-medium text-amber-600 dark:text-amber-400">
                        {rec.problemCategory}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">
                        Tech: {rec.technician || 'IT Support'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : granularity === 'monthly' && selectedMonth !== 'all' ? (
            /* B. When a specific month is selected (e.g. September 2026), show complete service data for that month */
            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Complete Service &amp; Repair Data: {monthNameText}</span>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                        Total Charges: {formatCurrency(totalExpense)}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Complete list of all serviced assets, repairs performed, and maintenance costs in {monthNameText}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {filteredRecords.length} Service{filteredRecords.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Serviced Assets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredRecords.map((rec, idx) => (
                  <div
                    key={rec.id || idx}
                    className="p-3 bg-white dark:bg-[#101726] rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2 hover:border-orange-500/50 transition-all shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {resolveAssetType(rec)}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white font-mono">
                          {rec.assetNumber}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatCurrency(Number(rec.serviceCost) || 0)}
                      </span>
                    </div>

                    <div className="text-slate-700 dark:text-slate-300 font-medium">
                      {rec.deviceName || 'Company Assigned Device'}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/70 p-2 rounded-lg border border-slate-100 dark:border-slate-800/80 space-y-1">
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Service / Repair: </span>
                        {rec.workPerformed || rec.problem}
                      </div>
                      {rec.partsReplaced && rec.partsReplaced !== 'None' && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Parts: </span>
                          {rec.partsReplaced}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{rec.employeeName || 'Unassigned'}</span>
                      </span>
                      <span className="font-mono font-semibold text-slate-600 dark:text-slate-400">
                        {formatDateDisplay(rec.serviceDate)}
                      </span>
                      <span className="font-medium text-amber-600 dark:text-amber-400">
                        {rec.problemCategory}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">
                        Tech: {rec.technician || 'IT Support'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : granularity === 'yearly' && selectedYear !== 'all' ? (
            /* C. When a specific year is selected (e.g. Year 2026), show complete service data for that year */
            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                    <CalendarRange className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Complete Service &amp; Repair Data: Year {selectedYear}</span>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                        Total Charges: {formatCurrency(totalExpense)}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Annual breakdown of all assets serviced, diagnostic tasks, and expenditures throughout {selectedYear}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {filteredRecords.length} Service{filteredRecords.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Serviced Assets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredRecords.map((rec, idx) => (
                  <div
                    key={rec.id || idx}
                    className="p-3 bg-white dark:bg-[#101726] rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2 hover:border-orange-500/50 transition-all shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {resolveAssetType(rec)}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white font-mono">
                          {rec.assetNumber}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatCurrency(Number(rec.serviceCost) || 0)}
                      </span>
                    </div>

                    <div className="text-slate-700 dark:text-slate-300 font-medium">
                      {rec.deviceName || 'Company Assigned Device'}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/70 p-2 rounded-lg border border-slate-100 dark:border-slate-800/80 space-y-1">
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Service / Repair: </span>
                        {rec.workPerformed || rec.problem}
                      </div>
                      {rec.partsReplaced && rec.partsReplaced !== 'None' && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Parts: </span>
                          {rec.partsReplaced}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{rec.employeeName || 'Unassigned'}</span>
                      </span>
                      <span className="font-mono font-semibold text-slate-600 dark:text-slate-400">
                        {formatDateDisplay(rec.serviceDate)}
                      </span>
                      <span className="font-medium text-amber-600 dark:text-amber-400">
                        {rec.problemCategory}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">
                        Tech: {rec.technician || 'IT Support'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};
