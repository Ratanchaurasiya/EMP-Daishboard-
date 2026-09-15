import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AssetStatusBadge, ConditionBadge } from '../common/Badge';
import { formatDateDisplay } from '../../utils/formatters';
import {
  Smartphone,
  RotateCcw,
  UserCheck,
  Pencil,
  Copy,
  Check,
  Search,
  X,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  UserMinus,
  Wrench,
} from 'lucide-react';
import { AssetEditModal } from '../assets/AssetEditModal';
import { EmployeeAvatar } from '../common/EmployeeAvatar';
import { UnassignCustodianModal } from '../common/UnassignCustodianModal';

interface PhoneInventoryProps {
  onOpenAssign: (assetId?: string) => void;
  onOpenReturn: (assetId: string) => void;
  onSelectEmployee?: (employeeId: string) => void;
  onOpenAddService?: (assetId?: string) => void;
}

export const PhoneInventory: React.FC<PhoneInventoryProps> = ({
  onOpenAssign,
  onOpenReturn,
  onSelectEmployee,
  onOpenAddService,
}) => {
  const { assets, employees, userRole, globalFilters, setGlobalFilters, showToast, returnAsset } = useApp();

  const [brandFilter, setBrandFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [unassignTarget, setUnassignTarget] = useState<{
    id: string;
    assetNumber: string;
    deviceName: string;
    employeeName: string;
    employeeId: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleConfirmUnassign = (condition: any, remarks: string) => {
    if (!unassignTarget) return;
    returnAsset(
      unassignTarget.id,
      new Date().toISOString().substring(0, 10),
      condition,
      'IT Admin',
      'Available',
      remarks
    );
    setUnassignTarget(null);
  };

  // Filter only Mobile Phone assets
  const allPhones = useMemo(() => {
    return assets.filter(a => a.assetType === 'Mobile Phone');
  }, [assets]);

  const brands = useMemo(() => {
    return Array.from(new Set(allPhones.map(p => p.brand))).filter(Boolean);
  }, [allPhones]);

  const filteredPhones = useMemo(() => {
    return allPhones.filter(phone => {
      const assignedEmp = employees.find(
        e => e.id === phone.assignedEmployeeId || e.employeeId === phone.assignedEmployeeId
      );

      if (globalFilters.search) {
        const q = globalFilters.search.toLowerCase();
        const matches =
          phone.assetNumber.toLowerCase().includes(q) ||
          phone.brand.toLowerCase().includes(q) ||
          phone.model.toLowerCase().includes(q) ||
          (phone.serialNumber && phone.serialNumber.toLowerCase().includes(q)) ||
          (phone.imeiNumber && phone.imeiNumber.toLowerCase().includes(q)) ||
          (phone.phoneNumber && phone.phoneNumber.toLowerCase().includes(q)) ||
          (phone.deviceName && phone.deviceName.toLowerCase().includes(q)) ||
          (assignedEmp &&
            (assignedEmp.name.toLowerCase().includes(q) ||
              assignedEmp.employeeId.toLowerCase().includes(q) ||
              assignedEmp.department.toLowerCase().includes(q)));
        if (!matches) return false;
      }

      if (brandFilter && phone.brand !== brandFilter) return false;
      if (statusFilter && phone.status !== statusFilter) return false;

      return true;
    });
  }, [allPhones, employees, globalFilters.search, brandFilter, statusFilter]);

  // Fleet Telemetry
  const totalPhones = allPhones.length;
  const assignedCount = allPhones.filter(p => p.status === 'Assigned').length;
  const availableCount = allPhones.filter(p => p.status === 'Available').length;
  const underServiceCount = allPhones.filter(p => p.status === 'Under Service').length;
  const utilizationRate = totalPhones > 0 ? Math.round((assignedCount / totalPhones) * 100) : 0;

  const handleCopy = (text: string, label: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Copied ${label} to clipboard`, 'info');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isAdmin = userRole === 'admin';

  return (
    <div className="space-y-4 animate-fade-in">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-500" />
            <span>Company Mobile Phones & Cellular Devices</span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
              {filteredPhones.length} Registered
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Enterprise smartphone fleet: 15-digit IMEI tracking, official SIM mobile numbers, and employee custody
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAssign()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>+ Register / Issue Phone</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Fleet Telemetry Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Total Mobile Fleet</span>
            <Smartphone className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
            {totalPhones}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            Corporate cellular devices
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
            Stock ready to issue
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
            In repair / maintenance
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
              placeholder="Search phone, IMEI, SIM, employee..."
              className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg pl-8 pr-7 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 sm:w-64"
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
          </select>

          {(brandFilter || statusFilter || globalFilters.search) && (
            <button
              onClick={() => {
                setBrandFilter('');
                setStatusFilter('');
                setGlobalFilters({ search: '' });
              }}
              className="text-[11px] text-blue-600 hover:text-blue-500 font-semibold px-2 py-1 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        <span className="text-[11px] text-slate-400 font-mono">
          Showing {filteredPhones.length} of {allPhones.length} phones
        </span>
      </div>

      {/* 4. Mobile Cards (Optimized for Phones & Tablets) */}
      <div className="md:hidden space-y-3">
        {filteredPhones.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-[#101726] rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Smartphone className="w-5 h-5" />
            </div>
            <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">No mobile phones found</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredPhones.map(phone => {
            const assignedEmp = employees.find(
              e => e.id === phone.assignedEmployeeId || e.employeeId === phone.assignedEmployeeId
            );

            return (
              <div
                key={phone.id}
                className="p-3.5 bg-white dark:bg-[#101726] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
              >
                {/* Header row: Device label, Asset Tag, Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center text-base">
                      📱
                    </div>
                    <div>
                      <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 block">
                        {phone.assetNumber}
                      </span>
                      <span className="text-[11px] font-bold text-slate-900 dark:text-white block leading-tight">
                        {phone.deviceName || `${phone.brand} ${phone.model}`}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {phone.brand} {phone.model}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <ConditionBadge condition={phone.condition} size="sm" />
                    <AssetStatusBadge status={phone.status} size="sm" />
                  </div>
                </div>

                {/* SIM Mobile Number & IMEI Box */}
                <div className="p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-[11px] space-y-1.5">
                  {phone.phoneNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <PhoneCall className="w-3 h-3 text-pink-500" />
                        <span>Company SIM:</span>
                      </span>
                      <div className="flex items-center gap-1">
                        <strong className="text-slate-900 dark:text-white font-bold font-mono">
                          {phone.phoneNumber}
                        </strong>
                        <button
                          type="button"
                          onClick={() => handleCopy(phone.phoneNumber!, 'Phone Number', `phone-${phone.id}`)}
                          className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 text-slate-400 hover:text-blue-600 cursor-pointer"
                          title="Copy phone number"
                        >
                          {copiedKey === `phone-${phone.id}` ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {phone.imeiNumber && (
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="text-slate-500 dark:text-slate-400 uppercase font-semibold">
                        IMEI (15-Digit):
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-800 dark:text-slate-200 font-bold">
                          {phone.imeiNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(phone.imeiNumber!, 'IMEI', `imei-${phone.id}`)}
                          className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 text-slate-400 hover:text-blue-600 cursor-pointer"
                          title="Copy IMEI number"
                        >
                          {copiedKey === `imei-${phone.id}` ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Custody: Assigned Employee */}
                <div
                  onClick={e => {
                    if (assignedEmp && onSelectEmployee) {
                      e.stopPropagation();
                      onSelectEmployee(assignedEmp.id);
                    }
                  }}
                  className={`p-2 rounded-lg bg-slate-50 dark:bg-[#090d16] border border-slate-100 dark:border-slate-800/60 flex items-center justify-between ${
                    assignedEmp && onSelectEmployee ? 'cursor-pointer hover:border-blue-400 hover:bg-blue-50/20 transition-all' : ''
                  }`}
                  title={assignedEmp ? `Click to view profile and assets for ${assignedEmp.name} (${assignedEmp.employeeId})` : undefined}
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
                      <span className="text-xs text-slate-400 italic">Available in IT Fleet Buffer</span>
                    )}
                  </div>
                  {phone.assignedDate && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDateDisplay(phone.assignedDate)}
                    </span>
                  )}
                </div>

                {/* Touch Actions */}
                {isAdmin && (
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                    <button
                      onClick={() => setEditingAssetId(phone.id)}
                      className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3 h-3 text-slate-500" />
                      <span>Edit Phone</span>
                    </button>

                    {phone.status === 'Assigned' && (
                      <>
                        <button
                          onClick={() => onOpenReturn(phone.id)}
                          className="flex-1 py-1.5 px-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Return</span>
                        </button>

                        {assignedEmp && (
                          <button
                            onClick={() =>
                              setUnassignTarget({
                                id: phone.id,
                                assetNumber: phone.assetNumber,
                                deviceName: `${phone.brand} ${phone.model} (${phone.phoneNumber || 'No SIM'})`,
                                employeeName: assignedEmp.name,
                                employeeId: assignedEmp.employeeId,
                              })
                            }
                            className="flex-1 py-1.5 px-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            title={`Remove ${assignedEmp.name} from this phone`}
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                            <span>Remove User</span>
                          </button>
                        )}
                      </>
                    )}

                    {phone.status !== 'Assigned' && (
                      <button
                        onClick={() => onOpenAssign(phone.id)}
                        className="flex-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>Assign Phone</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 5. Desktop Table (Hidden on Mobile) */}
      <div className="hidden md:block bg-white dark:bg-[#101726] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Asset Tag</th>
                <th className="py-2.5 px-4 font-semibold">Device Label & Model</th>
                <th className="py-2.5 px-4 font-semibold">SIM Mobile Number</th>
                <th className="py-2.5 px-4 font-semibold">15-Digit IMEI</th>
                <th className="py-2.5 px-4 font-semibold">Assigned Employee</th>
                <th className="py-2.5 px-4 font-semibold">Assigned Date</th>
                <th className="py-2.5 px-4 font-semibold">Condition</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                {isAdmin && <th className="py-2.5 px-4 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
              {filteredPhones.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No corporate mobile phones found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredPhones.map(phone => {
                  const assignedEmp = employees.find(
                    e => e.id === phone.assignedEmployeeId || e.employeeId === phone.assignedEmployeeId
                  );

                  return (
                    <tr
                      key={phone.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Asset Tag */}
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                        <span className="text-base leading-none">📱</span>
                        <span>{phone.assetNumber}</span>
                      </td>

                      {/* Device Label & Model */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          {phone.deviceName || `${phone.brand} ${phone.model}`}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {phone.brand} {phone.model}
                        </div>
                        {phone.remarks && (
                          <div className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5" title={phone.remarks}>
                            {phone.remarks}
                          </div>
                        )}
                      </td>

                      {/* SIM Mobile Number */}
                      <td className="py-3 px-4">
                        {phone.phoneNumber ? (
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="font-bold text-slate-900 dark:text-white">
                              📞 {phone.phoneNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(phone.phoneNumber!, 'Phone Number', `dt-phone-${phone.id}`)}
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                              title="Copy phone number"
                            >
                              {copiedKey === `dt-phone-${phone.id}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No SIM assigned</span>
                        )}
                      </td>

                      {/* 15-Digit IMEI */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {phone.imeiNumber ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {phone.imeiNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(phone.imeiNumber!, 'IMEI', `dt-imei-${phone.id}`)}
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                              title="Copy IMEI number"
                            >
                              {copiedKey === `dt-imei-${phone.id}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono">{phone.serialNumber || 'N/A'}</span>
                        )}
                      </td>

                      {/* Assigned Employee (Clickable Employee ID) */}
                      <td className="py-3 px-4">
                        {assignedEmp ? (
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                if (onSelectEmployee) onSelectEmployee(assignedEmp.id);
                              }}
                              className="text-left group/emp cursor-pointer block min-w-0"
                              title={`Click to view profile and assets for ${assignedEmp.name} (${assignedEmp.employeeId})`}
                            >
                              <span className="font-bold text-slate-900 dark:text-white group-hover/emp:text-blue-600 dark:group-hover/emp:text-blue-400 transition-colors block truncate">
                                {assignedEmp.name}
                              </span>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-1.5 py-0.2 rounded border border-blue-500/20 transition-colors">
                                  {assignedEmp.employeeId}
                                </span>
                                <span className="text-[10px] text-slate-400 font-normal truncate">
                                  ({assignedEmp.department})
                                </span>
                              </div>
                            </button>

                            {isAdmin && (
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  setUnassignTarget({
                                    id: phone.id,
                                    assetNumber: phone.assetNumber,
                                    deviceName: `${phone.brand} ${phone.model} (${phone.phoneNumber || 'No SIM'})`,
                                    employeeName: assignedEmp.name,
                                    employeeId: assignedEmp.employeeId,
                                  });
                                }}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900/60 transition-colors cursor-pointer shrink-0 ml-1.5"
                                title={`Remove this phone asset from ${assignedEmp.name} (return to available inventory)`}
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
                        {formatDateDisplay(phone.assignedDate)}
                      </td>

                      {/* Condition */}
                      <td className="py-3 px-4">
                        <ConditionBadge condition={phone.condition} size="sm" />
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <AssetStatusBadge status={phone.status} size="sm" />
                      </td>

                      {/* Actions */}
                      {isAdmin && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingAssetId(phone.id)}
                              className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Edit phone details, IMEI, or number"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {onOpenAddService && (
                              <button
                                type="button"
                                onClick={() => onOpenAddService(phone.id)}
                                className="p-1 rounded text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                                title="Log service & repair ticket for this phone"
                              >
                                <Wrench className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {phone.status === 'Assigned' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onOpenReturn(phone.id)}
                                  className="p-1 rounded text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                                  title="Check-in / Return phone"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>

                                {assignedEmp && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setUnassignTarget({
                                        id: phone.id,
                                        assetNumber: phone.assetNumber,
                                        deviceName: `${phone.brand} ${phone.model} (${phone.phoneNumber || 'No SIM'})`,
                                        employeeName: assignedEmp.name,
                                        employeeId: assignedEmp.employeeId,
                                      })
                                    }
                                    className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                    title={`Remove ${assignedEmp.name} from this phone`}
                                  >
                                    <UserMinus className="w-3.5 h-3.5 text-rose-500" />
                                  </button>
                                )}
                              </>
                            )}

                            {phone.status !== 'Assigned' && (
                              <button
                                type="button"
                                onClick={() => onOpenAssign(phone.id)}
                                className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                                title="Assign phone to employee"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingAssetId && (
        <AssetEditModal
          isOpen={!!editingAssetId}
          assetId={editingAssetId}
          onClose={() => setEditingAssetId(null)}
        />
      )}

      {/* Unassign Custodian Modal */}
      {unassignTarget && (
        <UnassignCustodianModal
          isOpen={!!unassignTarget}
          onClose={() => setUnassignTarget(null)}
          entityType="Mobile Phone"
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
