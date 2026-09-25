import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { History, Shield, Clock } from 'lucide-react';

interface AuditLogViewProps {
  onSelectEmployee?: (employeeId: string) => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ onSelectEmployee }) => {
  const { auditLogs, allocationRecords, globalFilters, setGlobalFilters } = useApp();

  const filteredLogs = useMemo(() => {
    if (!globalFilters.search) return auditLogs;
    const q = globalFilters.search.toLowerCase();
    return auditLogs.filter(
      l =>
        l.action.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.actor.toLowerCase().includes(q)
    );
  }, [auditLogs, globalFilters.search]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <History className="w-5 h-5 text-blue-500" />
          <span>System Audit & Historical Ledger</span>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
            {filteredLogs.length} Events
          </span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Immutable event stream capturing all hardware allocations, returns, status changes, and repair records
        </p>
      </div>

      {/* 1. System Action Audit Stream */}
      <div className="bg-white dark:bg-[#101726] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Administrative Activity Trail
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Chronologically Indexed</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredLogs.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-2.5">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No audit records found matching your query
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {globalFilters.search ? `No log items matched "${globalFilters.search}"` : 'Event stream is currently empty.'}
              </p>
              {globalFilters.search && (
                <button
                  type="button"
                  onClick={() => setGlobalFilters({ search: '' })}
                  className="mt-3 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800 transition-colors cursor-pointer"
                >
                  Clear Search Filter
                </button>
              )}
            </div>
          ) : (
            filteredLogs.map(log => {
              const isAssign = log.action === 'Asset Assigned';
              const isReturn = log.action === 'Asset Returned';
              const isService = log.action.includes('Service');

              return (
                <div
                  key={log.id}
                  className="p-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isAssign
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : isReturn
                          ? 'bg-rose-500/10 text-rose-500'
                          : isService
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-blue-500/10 text-blue-500'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {log.action}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {log.actor}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed text-[11px]">
                        {log.details}
                      </p>
                    </div>
                  </div>

                  <span className="font-mono text-[11px] text-slate-400 shrink-0 sm:text-right">
                    {log.timestamp}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Formal Asset Allocation History Table */}
      <div className="bg-white dark:bg-[#101726] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Historical Allocation & Return Records
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Detailed ledger of every asset assignment, issuer, condition check, and return receipt
          </p>
        </div>

        {/* Mobile Card View (Optimized for Phone Screens) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
          {allocationRecords.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No allocation records found.
            </div>
          ) : (
            allocationRecords.map(rec => (
              <div key={rec.id} className="p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                      {rec.assetNumber}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {rec.assetType}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                      rec.status === 'Assigned'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {rec.status}
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#090d16] border border-slate-100 dark:border-slate-800/60 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Employee:</span>
                    {onSelectEmployee ? (
                      <button
                        type="button"
                        onClick={() => onSelectEmployee(rec.employeeId)}
                        className="font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] flex items-center gap-1.5 cursor-pointer"
                        title={`Click to view profile and assets for ${rec.employeeName} (${rec.employeeId})`}
                      >
                        <span>{rec.employeeName}</span>
                        <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
                          {rec.employeeId}
                        </span>
                      </button>
                    ) : (
                      <strong className="text-slate-800 dark:text-slate-200 text-[11px]">{rec.employeeName} ({rec.employeeId})</strong>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Assigned Date:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">{rec.assignedDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Issued By:</span>
                    <span className="text-slate-600 dark:text-slate-400 text-[11px]">{rec.issuedBy}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Condition at Issue:</span>
                    <span className="text-slate-600 dark:text-slate-400 text-[11px]">{rec.conditionAtIssue}</span>
                  </div>
                  {rec.returnDate && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">Returned:</span>
                      <span className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">{rec.returnDate} ({rec.returnCondition || 'Good'})</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table (Hidden on Mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Employee</th>
                <th className="py-2.5 px-4 font-semibold">Asset Type</th>
                <th className="py-2.5 px-4 font-semibold">Asset Number</th>
                <th className="py-2.5 px-4 font-semibold">Assigned Date</th>
                <th className="py-2.5 px-4 font-semibold">Issued By</th>
                <th className="py-2.5 px-4 font-semibold">Issue Condition</th>
                <th className="py-2.5 px-4 font-semibold">Return Date</th>
                <th className="py-2.5 px-4 font-semibold">Return Condition</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
              {allocationRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    No historical allocation records registered.
                  </td>
                </tr>
              ) : (
                allocationRecords.map(rec => (
                <tr key={rec.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4">
                    {onSelectEmployee ? (
                      <button
                        type="button"
                        onClick={() => onSelectEmployee(rec.employeeId)}
                        className="text-left group/emp cursor-pointer block"
                        title={`Click to view profile and assets for ${rec.employeeName} (${rec.employeeId})`}
                      >
                        <div className="font-bold text-slate-900 dark:text-white group-hover/emp:text-blue-600 dark:group-hover/emp:text-blue-400 transition-colors">
                          {rec.employeeName}
                        </div>
                        <span className="inline-block text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-1.5 py-0.5 rounded border border-blue-500/20 transition-colors mt-0.5">
                          {rec.employeeId}
                        </span>
                      </button>
                    ) : (
                      <div className="font-bold text-slate-900 dark:text-white">
                        {rec.employeeName} ({rec.employeeId})
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-semibold">{rec.assetType}</td>
                  <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                    {rec.assetNumber}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{rec.assignedDate}</td>
                  <td className="py-3 px-4 text-slate-500">{rec.issuedBy}</td>
                  <td className="py-3 px-4">{rec.conditionAtIssue}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                    {rec.returnDate || '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {rec.returnCondition || '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                        rec.status === 'Assigned'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {rec.status}
                    </span>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
