import React, { useState, useMemo } from 'react';
import { ExitClearanceRecord } from '../../types';
import { formatDateDisplay, formatCurrency } from '../../utils/formatters';
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Award,
  ChevronDown,
  ChevronUp,
  Laptop,
  Smartphone,
  Layers,
  Calendar,
  User,
  Clock,
  Building,
  FileCheck,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { EmployeeAvatar } from '../common/EmployeeAvatar';

interface ExitHistoryViewProps {
  clearances: ExitClearanceRecord[];
  onViewCertificate: (record: ExitClearanceRecord) => void;
  onSelectEmployee?: (empId: string) => void;
}

export const ExitHistoryView: React.FC<ExitHistoryViewProps> = ({
  clearances,
  onViewCertificate,
  onSelectEmployee,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 1. Filter only records that are Exited / Approved
  const exitedRecords = useMemo(() => {
    return clearances.filter(clr => {
      return (
        clr.status === 'Full & Final Approved' ||
        clr.status === 'Cleared' ||
        clr.exitRequest?.status === 'Approved'
      );
    });
  }, [clearances]);

  // 2. Department list
  const departments = useMemo(() => {
    const set = new Set<string>();
    exitedRecords.forEach(r => {
      if (r.department) set.add(r.department);
    });
    return ['All', ...Array.from(set)];
  }, [exitedRecords]);

  // 3. Filtered history
  const filteredHistory = useMemo(() => {
    return exitedRecords.filter(r => {
      if (departmentFilter !== 'All' && r.department !== departmentFilter) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.employeeName.toLowerCase().includes(q) ||
        r.employeeId.toLowerCase().includes(q) ||
        (r.companyEmployeeNumber && r.companyEmployeeNumber.toLowerCase().includes(q)) ||
        r.department.toLowerCase().includes(q) ||
        (r.exitRequest?.reason && r.exitRequest.reason.toLowerCase().includes(q)) ||
        r.exitType.toLowerCase().includes(q)
      );
    });
  }, [exitedRecords, searchQuery, departmentFilter]);

  // 4. Metrics
  const metrics = useMemo(() => {
    const totalExited = exitedRecords.length;
    const fullyCleared = exitedRecords.filter(r => r.status === 'Full & Final Approved').length;
    let pendingAssetsCount = 0;
    exitedRecords.forEach(r => {
      pendingAssetsCount += r.items.filter(
        i => i.returnStatus === 'Pending' || i.returnStatus === 'Missing' || i.returnStatus === 'Damaged'
      ).length;
    });

    return { totalExited, fullyCleared, pendingAssetsCount };
  }, [exitedRecords]);

  return (
    <div className="space-y-4">
      {/* 1. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">
            Total Exited Employees
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {metrics.totalExited}
          </div>
          <span className="text-[10px] text-slate-500">Archived & Retained in History</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] text-emerald-500 uppercase font-bold block">
            Fully Cleared (No-Dues Issued)
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            {metrics.fullyCleared}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
            No-Dues Certificates Generated
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] text-amber-500 uppercase font-bold block">
            Pending Hardware / Dues
          </span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
            {metrics.pendingAssetsCount}
          </div>
          <span className="text-[10px] text-amber-600 dark:text-amber-400">
            Items currently in recovery
          </span>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search exit history by employee name, ID, department, exit reason..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">Department:</span>
          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            {departments.map(d => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Exit History Table / Cards */}
      <div className="bg-white dark:bg-[#101726] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        {filteredHistory.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No Exited Employees Found
            </h3>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              {searchQuery || departmentFilter !== 'All'
                ? 'No exit history records matched your current query.'
                : 'Approved exit records and offboarded staff will automatically appear in this immutable historical ledger.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Exited Employee</th>
                  <th className="py-3 px-3">Joining Date</th>
                  <th className="py-3 px-3">Exit Request Date</th>
                  <th className="py-3 px-3">Final Exit Date</th>
                  <th className="py-3 px-3">Exit Reason</th>
                  <th className="py-3 px-3">Approved By</th>
                  <th className="py-3 px-3">Asset Clearance</th>
                  <th className="py-3 px-3">SIM Clearance</th>
                  <th className="py-3 px-3">Closure Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredHistory.map(rec => {
                  const isExpanded = expandedRowIds.has(rec.id);
                  const ext = rec.exitRequest;

                  const pendingAssets = rec.items.filter(
                    i =>
                      i.returnStatus === 'Pending' ||
                      i.returnStatus === 'Missing' ||
                      i.returnStatus === 'Damaged'
                  );
                  const simItems = rec.items.filter(i => i.assetType === 'SIM Card');
                  const pendingSims = simItems.filter(i => i.returnStatus === 'Pending');

                  const isCertified = rec.status === 'Full & Final Approved';

                  return (
                    <React.Fragment key={rec.id}>
                      <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        {/* 1. Employee Info */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <EmployeeAvatar name={rec.employeeName} size="sm" status="Exited" />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">
                                {rec.employeeName}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                                  {rec.companyEmployeeNumber || rec.employeeId}
                                </span>
                                <span>&bull;</span>
                                <span>{rec.department}</span>
                                {rec.team && (
                                  <>
                                    <span>&bull;</span>
                                    <span>{rec.team}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Joining Date */}
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          {rec.joiningDate || 'N/A'}
                        </td>

                        {/* 3. Exit Request Date */}
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          {ext?.requestedAt
                            ? new Date(ext.requestedAt).toLocaleDateString('en-GB')
                            : formatDateDisplay(rec.createdAt)}
                        </td>

                        {/* 4. Final Exit Date */}
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                          {formatDateDisplay(ext?.finalExitDate || rec.exitDate)}
                        </td>

                        {/* 5. Exit Reason */}
                        <td className="py-3 px-3 text-slate-700 dark:text-slate-200">
                          <span className="inline-block max-w-[150px] truncate" title={ext?.reason || rec.exitType}>
                            {ext?.reason || rec.exitType}
                          </span>
                        </td>

                        {/* 6. Approved By */}
                        <td className="py-3 px-3 text-[11px]">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {ext?.reviewedBy || rec.approvedByAdmin || 'Admin'}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {ext?.reviewedAt
                              ? new Date(ext.reviewedAt).toLocaleDateString('en-GB')
                              : rec.clearedAt
                              ? new Date(rec.clearedAt).toLocaleDateString('en-GB')
                              : 'Approved'}
                          </span>
                        </td>

                        {/* 7. Asset Clearance Status */}
                        <td className="py-3 px-3">
                          {pendingAssets.length === 0 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              All Cleared
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                              <AlertTriangle className="w-3 h-3" />
                              {pendingAssets.length} Pending
                            </span>
                          )}
                        </td>

                        {/* 8. SIM Clearance Status */}
                        <td className="py-3 px-3">
                          {simItems.length === 0 ? (
                            <span className="text-[10px] text-slate-400">None Issued</span>
                          ) : pendingSims.length === 0 ? (
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              Surrendered
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-500">
                              {pendingSims.length} Unreturned
                            </span>
                          )}
                        </td>

                        {/* 9. Final Closure Status */}
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              isCertified
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {isCertified ? 'Closed & Certified' : 'In Clearance'}
                          </span>
                        </td>

                        {/* 10. Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isCertified && (
                              <button
                                type="button"
                                onClick={() => onViewCertificate(rec)}
                                title="View No-Dues Certificate"
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                              >
                                <Award className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => toggleRow(rec.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              <span>{isExpanded ? 'Hide' : 'Details'}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Historical Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70 dark:bg-slate-900/40">
                          <td colSpan={10} className="p-4">
                            <div className="p-4 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Left Column: Separation & Admin Remarks */}
                                <div className="space-y-2">
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Administrative Record & Remarks
                                  </div>
                                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-1 text-xs">
                                    <div>
                                      <span className="text-slate-400 text-[10px]">Requested By:</span>{' '}
                                      <strong className="text-slate-800 dark:text-slate-200">
                                        {ext?.requestedBy || rec.employeeName}
                                      </strong>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 text-[10px]">Approved By:</span>{' '}
                                      <strong className="text-slate-800 dark:text-slate-200">
                                        {ext?.reviewedBy || rec.approvedByAdmin || 'Administrator'}
                                      </strong>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 text-[10px]">Admin Remarks:</span>{' '}
                                      <span className="italic text-slate-700 dark:text-slate-300">
                                        "{ext?.adminRemarks || rec.approvalRemarks || 'Exit verified and approved.'}"
                                      </span>
                                    </div>
                                    {rec.clearanceCertificateNumber && (
                                      <div>
                                        <span className="text-slate-400 text-[10px]">Certificate No:</span>{' '}
                                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                          {rec.clearanceCertificateNumber}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Right Column: Pending Assets Breakdown */}
                                <div className="space-y-2">
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Hardware & Asset Status Breakdown ({rec.items.length} Tracked)
                                  </div>
                                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-1.5 text-xs">
                                    {rec.items.length === 0 ? (
                                      <p className="text-slate-400 text-[11px]">
                                        No company assets were linked to this employee.
                                      </p>
                                    ) : (
                                      rec.items.map(item => (
                                        <div
                                          key={item.id}
                                          className="flex items-center justify-between text-[11px] pb-1 border-b border-slate-200/60 dark:border-slate-800 last:border-0"
                                        >
                                          <div className="flex items-center gap-1.5 truncate">
                                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                              {item.assetNumber}
                                            </span>
                                            <span className="truncate text-slate-700 dark:text-slate-300">
                                              {item.deviceName}
                                            </span>
                                          </div>
                                          <span
                                            className={`font-semibold shrink-0 ${
                                              item.returnStatus === 'Verified' ||
                                              item.returnStatus === 'Submitted'
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : item.returnStatus === 'Damaged' ||
                                                  item.returnStatus === 'Missing'
                                                ? 'text-rose-600'
                                                : 'text-amber-600'
                                            }`}
                                          >
                                            {item.returnStatus}
                                          </span>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Complete Historical Activity Trail */}
                              <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                  Complete Historical Activity Trail
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/60 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
                                  {rec.auditTrail.length === 0 ? (
                                    <div className="p-3 text-slate-400 text-center">
                                      No audit events logged.
                                    </div>
                                  ) : (
                                    rec.auditTrail.map(audit => (
                                      <div
                                        key={audit.id}
                                        className="p-2.5 flex items-center justify-between gap-2"
                                      >
                                        <div className="flex items-center gap-2">
                                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                                          <span className="font-bold text-slate-800 dark:text-slate-200">
                                            {audit.action}
                                          </span>
                                          <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                                            &bull; {audit.details}
                                          </span>
                                        </div>
                                        <div className="text-[10px] font-mono text-slate-400 shrink-0">
                                          {audit.actor} &bull;{' '}
                                          {new Date(audit.timestamp).toLocaleDateString('en-GB')}
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
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
        )}
      </div>
    </div>
  );
};
