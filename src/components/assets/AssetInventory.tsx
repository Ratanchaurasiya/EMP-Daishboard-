import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AssetStatusBadge, ConditionBadge } from '../common/Badge';
import { formatDateDisplay } from '../../utils/formatters';
import {
  Headphones,
  RotateCcw,
  UserCheck,
  Pencil,
  UserMinus,
  Wrench,
} from 'lucide-react';
import { AssetEditModal } from './AssetEditModal';
import { EmployeeAvatar } from '../common/EmployeeAvatar';
import { UnassignCustodianModal } from '../common/UnassignCustodianModal';

interface AssetInventoryProps {
  onOpenAssign: (assetId?: string) => void;
  onOpenReturn: (assetId: string) => void;
  onSelectEmployee?: (employeeId: string) => void;
  onOpenAddService?: (assetId?: string) => void;
}

export const AssetInventory: React.FC<AssetInventoryProps> = ({
  onOpenAssign,
  onOpenReturn,
  onSelectEmployee,
  onOpenAddService,
}) => {
  const { assets, employees, userRole, globalFilters, returnAsset, setActiveTab } = useApp();

  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [unassignTarget, setUnassignTarget] = useState<{
    id: string;
    assetNumber: string;
    deviceName: string;
    employeeName: string;
    employeeId: string;
  } | null>(null);

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

  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const assignedEmp = employees.find(
        e => e.id === a.assignedEmployeeId || e.employeeId === a.assignedEmployeeId
      );

      if (globalFilters.search) {
        const q = globalFilters.search.toLowerCase();
        const matches =
          a.assetNumber.toLowerCase().includes(q) ||
          a.brand.toLowerCase().includes(q) ||
          a.model.toLowerCase().includes(q) ||
          a.serialNumber.toLowerCase().includes(q) ||
          (a.imeiNumber && a.imeiNumber.toLowerCase().includes(q)) ||
          (a.phoneNumber && a.phoneNumber.toLowerCase().includes(q)) ||
          (a.deviceName && a.deviceName.toLowerCase().includes(q)) ||
          a.assetType.toLowerCase().includes(q) ||
          (assignedEmp && assignedEmp.name.toLowerCase().includes(q));
        if (!matches) return false;
      }

      if (typeFilter && a.assetType !== typeFilter) return false;
      if (statusFilter && a.status !== statusFilter) return false;

      return true;
    });
  }, [assets, employees, globalFilters.search, typeFilter, statusFilter]);

  const isAdmin = userRole === 'admin';

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Headphones className="w-5 h-5 text-blue-500" />
            <span>Company Peripherals & IT Hardware</span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
              {filteredAssets.length} Tracked
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Fleet perimeter tracking: Laptops, Monitors, Phones, Peripherals & Corporate Hardware
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => onOpenAssign()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Assign Asset</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Status Bar */}
      <div className="p-3 bg-white dark:bg-[#101726] rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Type pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['', 'Monitor', 'Mobile Phone', 'Docking Station', 'Mouse', 'Keyboard', 'Headset', 'Other'].map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-2.5 py-1 text-xs rounded-md transition-all font-medium cursor-pointer ${
                typeFilter === type
                  ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800'
              }`}
            >
              {type
                ? `${
                    type === 'Monitor'
                      ? '🖥️'
                      : type === 'Mobile Phone'
                      ? '📱'
                      : type === 'Docking Station'
                      ? '🔌'
                      : type === 'Mouse'
                      ? '🖱️'
                      : type === 'Keyboard'
                      ? '⌨️'
                      : type === 'Headset'
                      ? '🎧'
                      : '📦'
                  } ${type}`
                : 'All Hardware'}
            </button>
          ))}
          <button
            onClick={() => setActiveTab('computers')}
            className="px-2.5 py-1 text-xs rounded-md font-semibold transition-all bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80 cursor-pointer flex items-center gap-1"
            title="Switch to Laptops & Workstations Fleet"
          >
            <span>💻</span>
            <span>Laptops Fleet &rarr;</span>
          </button>
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
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

          {(typeFilter || statusFilter) && (
            <button
              onClick={() => {
                setTypeFilter('');
                setStatusFilter('');
              }}
              className="text-[11px] text-blue-600 hover:text-blue-500 font-semibold px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Mobile Card View (Optimized for Phone Screens) */}
      <div className="md:hidden space-y-3">
        {filteredAssets.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-[#101726] rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Headphones className="w-5 h-5" />
            </div>
            <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">No hardware assets found</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Try adjusting your filters</p>
          </div>
        ) : (
          filteredAssets.map(asset => {
            const assignedEmp = employees.find(
              e => e.id === asset.assignedEmployeeId || e.employeeId === asset.assignedEmployeeId
            );

            return (
              <div
                key={asset.id}
                className="p-3.5 bg-white dark:bg-[#101726] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
              >
                {/* Header: Type icon, tag, condition, status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {asset.assetType === 'Laptop'
                        ? '💻'
                        : asset.assetType === 'Monitor'
                        ? '🖥️'
                        : asset.assetType === 'Mobile Phone'
                        ? '📱'
                        : asset.assetType === 'Docking Station'
                        ? '🔌'
                        : asset.assetType === 'Mouse'
                        ? '🖱️'
                        : asset.assetType === 'Keyboard'
                        ? '⌨️'
                        : asset.assetType === 'Headset'
                        ? '🎧'
                        : '📦'}
                    </span>
                    <div>
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white block">
                        {asset.assetNumber}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block">
                        {asset.brand} {asset.model}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <ConditionBadge condition={asset.condition} size="sm" />
                    <AssetStatusBadge status={asset.status} size="sm" />
                  </div>
                </div>

                {/* Mobile Phone Highlight Box */}
                {asset.assetType === 'Mobile Phone' && (
                  <div className="p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-[11px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Device Label:</span>
                      <strong className="text-blue-700 dark:text-blue-300 font-semibold">{asset.deviceName || `${asset.brand} ${asset.model}`}</strong>
                    </div>
                    {asset.phoneNumber && (
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-slate-500 dark:text-slate-400">Mobile No:</span>
                        <strong className="text-slate-900 dark:text-white font-bold">{asset.phoneNumber}</strong>
                      </div>
                    )}
                    {asset.imeiNumber && (
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="text-slate-500 dark:text-slate-400">IMEI:</span>
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">{asset.imeiNumber}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Serial Number if not mobile phone */}
                {asset.assetType !== 'Mobile Phone' && asset.serialNumber && asset.serialNumber !== 'N/A' && (
                  <div className="flex items-center justify-between text-[11px] font-mono px-1">
                    <span className="text-slate-400">Serial Tag:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">{asset.serialNumber}</span>
                  </div>
                )}

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
                              • {formatDateDisplay(asset.assignedDate)}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Available in IT Fleet Buffer</span>
                    )}
                  </div>
                  {asset.returnDate && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      Ret: {formatDateDisplay(asset.returnDate)}
                    </span>
                  )}
                </div>

                {/* Touch Action Buttons */}
                {isAdmin && (
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                    <button
                      onClick={() => setEditingAssetId(asset.id)}
                      className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3 h-3 text-slate-500" />
                      <span>Edit</span>
                    </button>

                    {onOpenAddService && (
                      <button
                        onClick={() => onOpenAddService(asset.id)}
                        className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Log service or repair ticket for this asset"
                      >
                        <Wrench className="w-3 h-3 text-amber-500" />
                        <span>Service</span>
                      </button>
                    )}

                    {asset.status === 'Assigned' && assignedEmp && (
                      <button
                        onClick={() =>
                          setUnassignTarget({
                            id: asset.id,
                            assetNumber: asset.assetNumber,
                            deviceName: `${asset.brand} ${asset.model} (${asset.assetType})`,
                            employeeName: assignedEmp.name,
                            employeeId: assignedEmp.employeeId,
                          })
                        }
                        className="flex-1 py-1.5 px-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Remove assigned user"
                      >
                        <UserMinus className="w-3 h-3" />
                        <span>Remove User</span>
                      </button>
                    )}

                    {asset.status === 'Assigned' && (
                      <button
                        onClick={() => onOpenReturn(asset.id)}
                        className="flex-1 py-1.5 px-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Return</span>
                      </button>
                    )}

                    {asset.status !== 'Assigned' && (
                      <button
                        onClick={() => onOpenAssign(asset.id)}
                        className="flex-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>Assign</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table (Hidden on Mobile) */}
      <div className="hidden md:block bg-white dark:bg-[#101726] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Asset Type</th>
                <th className="py-2.5 px-4 font-semibold">Asset Number</th>
                <th className="py-2.5 px-4 font-semibold">Brand & Model</th>
                <th className="py-2.5 px-4 font-semibold">Serial / IMEI</th>
                <th className="py-2.5 px-4 font-semibold">Assigned Employee</th>
                <th className="py-2.5 px-4 font-semibold">Assigned Date</th>
                <th className="py-2.5 px-4 font-semibold">Date Returned</th>
                <th className="py-2.5 px-4 font-semibold">Condition</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                {isAdmin && <th className="py-2.5 px-4 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No hardware assets found matching filters.
                  </td>
                </tr>
              ) : (
                filteredAssets.map(asset => {
                  const assignedEmp = employees.find(
                    e => e.id === asset.assignedEmployeeId || e.employeeId === asset.assignedEmployeeId
                  );

                  return (
                    <tr
                      key={asset.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Asset Type */}
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="text-base leading-none">
                          {asset.assetType === 'Laptop'
                            ? '💻'
                            : asset.assetType === 'Monitor'
                            ? '🖥️'
                            : asset.assetType === 'Mobile Phone'
                            ? '📱'
                            : asset.assetType === 'Docking Station'
                            ? '🔌'
                            : asset.assetType === 'Mouse'
                            ? '🖱️'
                            : asset.assetType === 'Keyboard'
                            ? '⌨️'
                            : asset.assetType === 'Headset'
                            ? '🎧'
                            : '📦'}
                        </span>
                        <span>{asset.assetType}</span>
                      </td>

                      {/* Asset Number */}
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {asset.assetNumber}
                      </td>

                      {/* Brand & Model */}
                      <td className="py-3 px-4">
                        <div className="text-slate-800 dark:text-slate-200 font-medium">
                          {asset.brand} {asset.model}
                        </div>
                        {asset.assetType === 'Mobile Phone' && asset.phoneNumber && (
                          <div className="text-[11px] text-pink-600 dark:text-pink-400 font-mono font-medium mt-0.5">
                            📞 {asset.phoneNumber}
                          </div>
                        )}
                        {asset.assetType === 'Mobile Phone' && asset.deviceName && asset.deviceName !== `${asset.brand} ${asset.model}` && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            Device: {asset.deviceName}
                          </div>
                        )}
                        {asset.remarks && asset.assetType !== 'Mobile Phone' && (
                          <div className="text-[11px] text-slate-400 font-normal truncate max-w-xs mt-0.5">
                            {asset.remarks}
                          </div>
                        )}
                      </td>

                      {/* Serial Number / IMEI */}
                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                        {asset.assetType === 'Mobile Phone' && asset.imeiNumber ? (
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase mr-1">IMEI:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{asset.imeiNumber}</span>
                          </div>
                        ) : (
                          asset.serialNumber
                        )}
                      </td>

                      {/* Assigned Employee */}
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
                                    id: asset.id,
                                    assetNumber: asset.assetNumber,
                                    deviceName: `${asset.brand} ${asset.model} (${asset.assetType})`,
                                    employeeName: assignedEmp.name,
                                    employeeId: assignedEmp.employeeId,
                                  });
                                }}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900/60 transition-colors cursor-pointer shrink-0 ml-1.5"
                                title={`Remove this asset from ${assignedEmp.name} (unassign & return to inventory)`}
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
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {formatDateDisplay(asset.assignedDate)}
                      </td>

                      {/* Date Returned */}
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {formatDateDisplay(asset.returnDate)}
                      </td>

                      {/* Condition */}
                      <td className="py-3 px-4">
                        <ConditionBadge condition={asset.condition} size="sm" />
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <AssetStatusBadge status={asset.status} size="sm" />
                      </td>

                      {/* Actions */}
                      {isAdmin && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingAssetId(asset.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md transition-colors"
                              title="Edit hardware details & phone specs"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Edit</span>
                            </button>

                            {onOpenAddService && (
                              <button
                                onClick={() => onOpenAddService(asset.id)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-md transition-colors cursor-pointer"
                                title="Log service & maintenance ticket for this asset"
                              >
                                <Wrench className="w-3 h-3" />
                                <span>Service</span>
                              </button>
                            )}

                            {asset.status === 'Assigned' && assignedEmp && (
                              <button
                                onClick={() =>
                                  setUnassignTarget({
                                    id: asset.id,
                                    assetNumber: asset.assetNumber,
                                    deviceName: `${asset.brand} ${asset.model} (${asset.assetType})`,
                                    employeeName: assignedEmp.name,
                                    employeeId: assignedEmp.employeeId,
                                  })
                                }
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
                                title="Remove asset from assigned employee"
                              >
                                <UserMinus className="w-3 h-3" />
                                <span>Remove Asset</span>
                              </button>
                            )}

                            {asset.status === 'Assigned' && (
                              <button
                                onClick={() => onOpenReturn(asset.id)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-md transition-colors"
                                title="Process return"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Return</span>
                              </button>
                            )}

                            {asset.status === 'Available' && (
                              <button
                                onClick={() => onOpenAssign(asset.id)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md transition-colors"
                                title="Assign to employee"
                              >
                                <UserCheck className="w-3 h-3" />
                                <span>Assign</span>
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

      {/* Asset Edit Modal */}
      {editingAssetId && (
        <AssetEditModal
          isOpen={!!editingAssetId}
          onClose={() => setEditingAssetId(null)}
          assetId={editingAssetId}
        />
      )}

      {/* Quick Unassign / Remove User Modal */}
      {unassignTarget && (
        <UnassignCustodianModal
          isOpen={!!unassignTarget}
          onClose={() => setUnassignTarget(null)}
          entityType="Peripheral Asset"
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
