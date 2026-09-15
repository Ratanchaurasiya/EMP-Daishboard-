import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AssetStatusBadge, ConditionBadge } from '../common/Badge';
import { formatDateDisplay } from '../../utils/formatters';
import {
  Laptop,
  Monitor,
  Plus,
  Eye,
  Search,
  X,
  RotateCcw,
  Pencil,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Wrench,
  Cpu,
  HardDrive,
  UserMinus,
} from 'lucide-react';
import { EmployeeAvatar } from '../common/EmployeeAvatar';
import { EditComputerModal } from './EditComputerModal';
import { UnassignCustodianModal } from '../common/UnassignCustodianModal';

interface ComputerListProps {
  onSelectComputer: (computerId: string) => void;
  onSelectEmployee?: (employeeId: string) => void;
  onOpenAddComputer: () => void;
  onOpenAddService?: (computerId?: string) => void;
}

export const ComputerList: React.FC<ComputerListProps> = ({
  onSelectComputer,
  onSelectEmployee,
  onOpenAddComputer,
  onOpenAddService,
}) => {
  const {
    computers,
    employees,
    serviceRecords,
    userRole,
    globalFilters,
    setGlobalFilters,
    showToast,
    assignComputerToEmployee,
  } = useApp();

  const [brandFilter, setBrandFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deviceTypeFilter, setDeviceTypeFilter] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  const [editingComputerId, setEditingComputerId] = useState<string | null>(null);
  const [unassignTarget, setUnassignTarget] = useState<{
    id: string;
    assetNumber: string;
    deviceName: string;
    employeeName: string;
    employeeId: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const brands = useMemo(() => {
    return Array.from(new Set(computers.map(c => c.manufacturer))).filter(Boolean);
  }, [computers]);

  const filteredComputers = useMemo(() => {
    return computers.filter(c => {
      const assignedEmp = employees.find(
        e => e.id === c.assignedEmployeeId || e.employeeId === c.assignedEmployeeId
      );

      if (globalFilters.search) {
        const q = globalFilters.search.toLowerCase();
        const matches =
          c.assetNumber.toLowerCase().includes(q) ||
          c.deviceName.toLowerCase().includes(q) ||
          c.manufacturer.toLowerCase().includes(q) ||
          c.model.toLowerCase().includes(q) ||
          c.serialNumber.toLowerCase().includes(q) ||
          (c.processor?.name && c.processor.name.toLowerCase().includes(q)) ||
          (c.memory?.installedRAM && c.memory.installedRAM.toLowerCase().includes(q)) ||
          (c.storage?.total && c.storage.total.toLowerCase().includes(q)) ||
          (c.system?.os && c.system.os.toLowerCase().includes(q)) ||
          (assignedEmp &&
            (assignedEmp.name.toLowerCase().includes(q) ||
              assignedEmp.employeeId.toLowerCase().includes(q) ||
              assignedEmp.department.toLowerCase().includes(q)));
        if (!matches) return false;
      }

      if (brandFilter && c.manufacturer !== brandFilter) return false;
      if (statusFilter && c.status !== statusFilter) return false;
      if (deviceTypeFilter && c.deviceType !== deviceTypeFilter) return false;
      if (conditionFilter && c.condition !== conditionFilter) return false;

      return true;
    });
  }, [computers, employees, globalFilters.search, brandFilter, statusFilter, deviceTypeFilter, conditionFilter]);

  // Fleet Telemetry
  const totalComputers = computers.length;
  const assignedCount = computers.filter(c => c.status === 'Assigned').length;
  const availableCount = computers.filter(c => c.status === 'Available').length;
  const underServiceCount = computers.filter(c => c.status === 'Under Service').length;
  const utilizationRate = totalComputers > 0 ? Math.round((assignedCount / totalComputers) * 100) : 0;
  const totalServiceTickets = serviceRecords.length;

  const handleCopy = (text: string, label: string, key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Copied ${label} to clipboard`, 'info');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleConfirmUnassign = (condition: any, remarks: string) => {
    if (!unassignTarget) return;
    assignComputerToEmployee(
      unassignTarget.id,
      null,
      new Date().toISOString().substring(0, 10),
      condition,
      remarks
    );
    setUnassignTarget(null);
  };

  const isAdmin = userRole === 'admin';

  return (
    <div className="space-y-4 animate-fade-in">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Laptop className="w-5 h-5 text-blue-500" />
            <span>Company Laptops, Desktops & Workstations</span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
              {filteredComputers.length} Registered
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Enterprise computing fleet: Windows hardware specs, processor telemetry, RAM/SSD capacities, and custodian tracking
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAddComputer}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Register Computer</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Fleet Telemetry Stat Cards (Matching Phone Fleet Layout) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Total Computing Fleet</span>
            <Laptop className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
            {totalComputers}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            Enterprise laptops & desktops
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Active in Custody</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            {assignedCount}
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
            {availableCount}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            Ready stock to deploy
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Under Service</span>
            <RotateCcw className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 font-mono">
            {underServiceCount}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            {totalServiceTickets} lifetime repairs logged
          </div>
        </div>
      </div>

      {/* 3. Filter Toolbar */}
      <div className="p-3 bg-white dark:bg-[#101726] rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={globalFilters.search}
              onChange={e => setGlobalFilters({ search: e.target.value })}
              placeholder="Search computer, serial, CPU, RAM, employee..."
              className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg pl-8 pr-7 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 w-52 sm:w-72"
            />
            {globalFilters.search && (
              <button
                onClick={() => setGlobalFilters({ search: '' })}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Brand Filter */}
          <select
            value={brandFilter}
            onChange={e => setBrandFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Brands</option>
            {brands.map(b => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Device Type Filter */}
          <select
            value={deviceTypeFilter}
            onChange={e => setDeviceTypeFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="Laptop">Laptop</option>
            <option value="Desktop">Desktop</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="Assigned">Assigned</option>
            <option value="Available">Available</option>
            <option value="Under Service">Under Service</option>
            <option value="Returned">Returned</option>
            <option value="Damaged">Damaged</option>
            <option value="Retired">Retired</option>
          </select>

          {/* Condition Filter */}
          <select
            value={conditionFilter}
            onChange={e => setConditionFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Conditions</option>
            <option value="New">New</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Damaged">Damaged</option>
          </select>

          {(brandFilter || statusFilter || deviceTypeFilter || conditionFilter || globalFilters.search) && (
            <button
              onClick={() => {
                setBrandFilter('');
                setStatusFilter('');
                setDeviceTypeFilter('');
                setConditionFilter('');
                setGlobalFilters({ search: '' });
              }}
              className="text-[11px] text-blue-600 hover:text-blue-500 font-semibold px-2 py-1 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        <span className="text-[11px] text-slate-400 font-mono">
          Showing {filteredComputers.length} of {computers.length} systems
        </span>
      </div>

      {/* 4. Mobile & Tablet Cards (Optimized for Touch Screens) */}
      <div className="md:hidden space-y-3">
        {filteredComputers.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-[#101726] rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Laptop className="w-5 h-5" />
            </div>
            <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">No computers found</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredComputers.map(comp => {
            const assignedEmp = employees.find(
              e => e.id === comp.assignedEmployeeId || e.employeeId === comp.assignedEmployeeId
            );
            const compServices = serviceRecords.filter(
              s => s.computerId === comp.id || s.assetNumber === comp.assetNumber
            );
            const latestService = compServices.length > 0
              ? [...compServices].sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime())[0]
              : null;
            const isUnderService = comp.status === 'Under Service';

            return (
              <div
                key={comp.id}
                className="p-3.5 bg-white dark:bg-[#101726] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
              >
                {/* Header row: Device icon, Tag, Device Name, Model, Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold shrink-0">
                      {comp.deviceType === 'Desktop' ? (
                        <Monitor className="w-4 h-4" />
                      ) : (
                        <Laptop className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                          {comp.assetNumber}
                        </span>
                        <button
                          type="button"
                          onClick={e => handleCopy(comp.assetNumber, 'Asset Tag', `tag-${comp.id}`, e)}
                          className="p-0.5 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                          title="Copy asset tag"
                        >
                          {copiedKey === `tag-${comp.id}` ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <span className="text-[11px] font-bold text-slate-900 dark:text-white block leading-tight">
                        {comp.deviceName}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {comp.manufacturer} {comp.model}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <ConditionBadge condition={comp.condition} size="sm" />
                    <AssetStatusBadge status={comp.status} size="sm" />
                  </div>
                </div>

                {/* Hardware Specification Box */}
                <div className="p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-[11px] space-y-1.5">
                  {/* Serial Number */}
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase">
                      Serial Number:
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-800 dark:text-slate-200 font-bold">
                        {comp.serialNumber}
                      </span>
                      <button
                        type="button"
                        onClick={e => handleCopy(comp.serialNumber, 'Serial Number', `sn-${comp.id}`, e)}
                        className="p-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 text-slate-400 hover:text-blue-600 cursor-pointer"
                        title="Copy serial number"
                      >
                        {copiedKey === `sn-${comp.id}` ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Processor */}
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-blue-500 shrink-0" />
                      <span>CPU:</span>
                    </span>
                    <span className="text-slate-900 dark:text-slate-100 font-semibold font-mono truncate max-w-[180px]" title={comp.processor.name}>
                      {comp.processor.name}
                    </span>
                  </div>

                  {/* RAM & Storage */}
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span>Memory & Disk:</span>
                    </span>
                    <span className="text-slate-900 dark:text-slate-100 font-semibold font-mono">
                      {comp.memory.installedRAM} RAM • {comp.storage.total} {comp.storage.type}
                    </span>
                  </div>

                  {/* Operating System */}
                  <div className="flex items-center justify-between text-[10px] pt-0.5 border-t border-blue-200/50 dark:border-blue-900/40">
                    <span className="text-slate-500 dark:text-slate-400">OS:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium font-mono truncate max-w-[190px]">
                      {comp.system.os}
                    </span>
                  </div>
                </div>

                {/* Custody: Assigned Employee Box */}
                <div
                  onClick={e => {
                    if (assignedEmp && onSelectEmployee) {
                      e.stopPropagation();
                      onSelectEmployee(assignedEmp.id);
                    }
                  }}
                  className={`p-2 rounded-lg bg-slate-50 dark:bg-[#090d16] border border-slate-100 dark:border-slate-800/60 flex items-center justify-between ${
                    assignedEmp && onSelectEmployee
                      ? 'cursor-pointer hover:border-blue-400 hover:bg-blue-50/20 transition-all'
                      : ''
                  }`}
                  title={
                    assignedEmp
                      ? `Click to view profile and assets for ${assignedEmp.name} (${assignedEmp.employeeId})`
                      : undefined
                  }
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {assignedEmp ? (
                      <>
                        <EmployeeAvatar name={assignedEmp.name} photoUrl={assignedEmp.photoUrl} size="xs" />
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block">
                            {assignedEmp.name}
                          </span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
                              {assignedEmp.employeeId}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono truncate">
                              • {assignedEmp.department}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Available in IT Ready Stock Buffer</span>
                    )}
                  </div>
                  {comp.assignedDate && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDateDisplay(comp.assignedDate)}
                    </span>
                  )}
                </div>

                {/* Service / Maintenance History Box */}
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#090d16] border border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-slate-600 dark:text-slate-400 text-[10px] font-medium">
                      Service History:
                    </span>
                    {compServices.length > 0 ? (
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                          isUnderService
                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300/60 dark:border-slate-700/60'
                        }`}
                      >
                        {compServices.length} {compServices.length === 1 ? 'Record' : 'Records'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        0 Issues (Healthy)
                      </span>
                    )}
                  </div>
                  {latestService && (
                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-[130px]" title={`Latest: ${latestService.problemCategory} on ${formatDateDisplay(latestService.serviceDate)}`}>
                      {latestService.problemCategory}
                    </span>
                  )}
                </div>

                {/* Touch Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                  <button
                    onClick={() => onSelectComputer(comp.id)}
                    className="flex-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Specs</span>
                  </button>

                  {isAdmin && (
                    <>
                      <button
                        onClick={() => setEditingComputerId(comp.id)}
                        className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3 h-3 text-slate-500" />
                        <span>Edit</span>
                      </button>

                      {onOpenAddService && (
                        <button
                          onClick={() => onOpenAddService(comp.id)}
                          className="flex-1 py-1.5 px-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          title="Log new maintenance ticket"
                        >
                          <Wrench className="w-3 h-3" />
                          <span>Service</span>
                        </button>
                      )}

                      {assignedEmp && (
                        <button
                          onClick={() =>
                            setUnassignTarget({
                              id: comp.id,
                              assetNumber: comp.assetNumber,
                              deviceName: `${comp.deviceName} (${comp.manufacturer} ${comp.model})`,
                              employeeName: assignedEmp.name,
                              employeeId: assignedEmp.employeeId,
                            })
                          }
                          className="flex-1 py-1.5 px-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          title={`Remove ${assignedEmp.name} from this computer`}
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          <span>Remove Asset</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Desktop & Tablet Table (Hidden on Mobile) */}
      <div className="hidden md:block bg-white dark:bg-[#101726] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Asset Tag</th>
                <th className="py-2.5 px-4 font-semibold">Device Name & Serial</th>
                <th className="py-2.5 px-4 font-semibold">Manufacturer & Model</th>
                <th className="py-2.5 px-4 font-semibold">Processor</th>
                <th className="py-2.5 px-4 font-semibold">RAM & Storage</th>
                <th className="py-2.5 px-4 font-semibold">Operating System</th>
                <th className="py-2.5 px-4 font-semibold">Assigned Custodian</th>
                <th className="py-2.5 px-4 font-semibold">Assigned Date</th>
                <th className="py-2.5 px-4 font-semibold">Condition</th>
                <th className="py-2.5 px-4 font-semibold text-center">Service History</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
              {filteredComputers.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 px-4 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                        <Laptop className="w-6 h-6" />
                      </div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                        No computers found matching your filter criteria
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {globalFilters.search
                          ? `No workstations match "${globalFilters.search}". Clear your search query or reset the filters.`
                          : 'Try adjusting your brand, status, device type, or condition filters.'}
                      </p>
                      <button
                        onClick={() => {
                          setBrandFilter('');
                          setStatusFilter('');
                          setDeviceTypeFilter('');
                          setConditionFilter('');
                          setGlobalFilters({ search: '' });
                        }}
                        className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Clear Search & Reset Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredComputers.map(comp => {
                  const assignedEmp = employees.find(
                    e => e.id === comp.assignedEmployeeId || e.employeeId === comp.assignedEmployeeId
                  );
                  const compServices = serviceRecords.filter(
                    s => s.computerId === comp.id || s.assetNumber === comp.assetNumber
                  );
                  const latestService = compServices.length > 0
                    ? [...compServices].sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime())[0]
                    : null;
                  const isUnderService = comp.status === 'Under Service';

                  return (
                    <tr
                      key={comp.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Asset Tag */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectComputer(comp.id)}
                            className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            {comp.assetNumber}
                          </button>
                          <button
                            type="button"
                            onClick={e => handleCopy(comp.assetNumber, 'Asset Tag', `d-tag-${comp.id}`, e)}
                            className="p-0.5 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                            title="Copy asset tag"
                          >
                            {copiedKey === `d-tag-${comp.id}` ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Device Name & Serial */}
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {comp.deviceName}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5 font-mono text-[10px] text-slate-400">
                            <span>SN: {comp.serialNumber}</span>
                            <button
                              type="button"
                              onClick={e => handleCopy(comp.serialNumber, 'Serial Number', `d-sn-${comp.id}`, e)}
                              className="p-0.5 rounded hover:text-blue-600 cursor-pointer"
                              title="Copy serial number"
                            >
                              {copiedKey === `d-sn-${comp.id}` ? (
                                <Check className="w-2.5 h-2.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-2.5 h-2.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Manufacturer & Model */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {comp.manufacturer}
                          </span>
                          <span className="text-slate-400">
                            {comp.model}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {comp.deviceType}
                        </span>
                      </td>

                      {/* Processor */}
                      <td className="py-3 px-4">
                        <div className="max-w-[160px] truncate" title={comp.processor.name}>
                          <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 block truncate">
                            {comp.processor.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {comp.processor.speed} • {comp.system.processorArchitecture}
                          </span>
                        </div>
                      </td>

                      {/* RAM & Storage */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div className="text-slate-800 dark:text-slate-200 font-semibold">
                          {comp.memory.installedRAM} RAM
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {comp.storage.total} {comp.storage.type}
                        </div>
                      </td>

                      {/* Operating System */}
                      <td className="py-3 px-4">
                        <span
                          className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 truncate max-w-[120px] inline-block"
                          title={comp.system.os}
                        >
                          {comp.system.os.replace(' 64-bit', '')}
                        </span>
                      </td>

                      {/* Assigned Custodian */}
                      <td className="py-3 px-4">
                        {assignedEmp ? (
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                if (onSelectEmployee) onSelectEmployee(assignedEmp.id);
                              }}
                              className="flex items-center gap-2 text-left group/emp cursor-pointer min-w-0"
                              title={`View profile for ${assignedEmp.name}`}
                            >
                              <EmployeeAvatar name={assignedEmp.name} photoUrl={assignedEmp.photoUrl} size="xs" />
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 dark:text-white group-hover/emp:text-blue-600 dark:group-hover/emp:text-blue-400 transition-colors leading-tight truncate">
                                  {assignedEmp.name}
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1 py-0.2 rounded border border-blue-500/20">
                                    {assignedEmp.employeeId}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-normal truncate">
                                    ({assignedEmp.department})
                                  </span>
                                </div>
                              </div>
                            </button>

                            {isAdmin && (
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  setUnassignTarget({
                                    id: comp.id,
                                    assetNumber: comp.assetNumber,
                                    deviceName: `${comp.deviceName} (${comp.manufacturer} ${comp.model})`,
                                    employeeName: assignedEmp.name,
                                    employeeId: assignedEmp.employeeId,
                                  });
                                }}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900/60 transition-colors cursor-pointer shrink-0 ml-1.5"
                                title={`Remove this computer asset from ${assignedEmp.name} (unassign & return to stock)`}
                              >
                                <UserMinus className="w-3 h-3 text-rose-500" />
                                <span>Remove Asset</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">In Stock (Available)</span>
                        )}
                      </td>

                      {/* Assigned Date */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {formatDateDisplay(comp.assignedDate)}
                      </td>

                      {/* Condition */}
                      <td className="py-3 px-4">
                        <ConditionBadge condition={comp.condition} size="sm" />
                      </td>

                      {/* Service History */}
                      <td className="py-3 px-4 text-center">
                        {compServices.length > 0 ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              isUnderService
                                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/40'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                            title={`Latest: ${latestService?.problemCategory || 'Service'} (${formatDateDisplay(latestService?.serviceDate)})`}
                          >
                            <Wrench className="w-2.5 h-2.5" />
                            <span>{compServices.length} {compServices.length === 1 ? 'Record' : 'Records'}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium font-mono">
                            Healthy
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <AssetStatusBadge status={comp.status} size="sm" />
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onSelectComputer(comp.id)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="View full system specs & hardware telemetry"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {isAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => setEditingComputerId(comp.id)}
                                className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Edit specs, condition, and custodian"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              {onOpenAddService && (
                                <button
                                  type="button"
                                  onClick={() => onOpenAddService(comp.id)}
                                  className="p-1 rounded text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                                  title="Log service ticket for this machine"
                                >
                                  <Wrench className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {assignedEmp && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setUnassignTarget({
                                      id: comp.id,
                                      assetNumber: comp.assetNumber,
                                      deviceName: `${comp.deviceName} (${comp.manufacturer} ${comp.model})`,
                                      employeeName: assignedEmp.name,
                                      employeeId: assignedEmp.employeeId,
                                    })
                                  }
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                  title={`Remove Asset: Unassign ${comp.assetNumber} from ${assignedEmp.name}`}
                                >
                                  <UserMinus className="w-3.5 h-3.5 text-rose-500" />
                                </button>
                              )}
                            </>
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

      {/* Edit Computer Modal */}
      {editingComputerId && (
        <EditComputerModal
          isOpen={!!editingComputerId}
          onClose={() => setEditingComputerId(null)}
          computerId={editingComputerId}
        />
      )}

      {/* Unassign Custodian Modal */}
      {unassignTarget && (
        <UnassignCustodianModal
          isOpen={!!unassignTarget}
          onClose={() => setUnassignTarget(null)}
          entityType="Computer"
          assetNumber={unassignTarget.assetNumber}
          deviceName={unassignTarget.deviceName}
          employeeName={unassignTarget.employeeName}
          employeeId={unassignTarget.employeeId}
          onConfirm={handleConfirmUnassign}
        />
      )}
    </div>
  );
};
