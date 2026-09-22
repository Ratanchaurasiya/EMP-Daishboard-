import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AssetQuery, AssetQueryStatus } from '../../types';
import { formatDateDisplay } from '../../utils/formatters';
import {
  HelpCircle,
  Plus,
  Search,
  Star,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  User,
  Laptop,
  Check,
  Eye,
  Filter,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { RaiseAssetQueryModal } from './RaiseAssetQueryModal';
import { AssetQueryDetailModal } from './AssetQueryDetailModal';
import { RemoveQueryModal } from '../common/RemoveQueryModal';

export const AssetQueryList: React.FC = () => {
  const {
    assetQueries,
    userRole,
    currentUser,
    acknowledgeAssetQuery,
    toggleStarAssetQuery,
    removeAssetQuery,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'starred' | 'pending' | 'unresolved' | 'inprogress' | 'resolved'>('all');
  const [showRaiseModal, setShowRaiseModal] = useState<boolean>(false);
  const [selectedQuery, setSelectedQuery] = useState<AssetQuery | null>(null);
  const [removeTarget, setRemoveTarget] = useState<AssetQuery | null>(null);

  const isAdmin = userRole === 'admin';
  const isEmployee = currentUser?.role === 'employee' || userRole === 'employee';

  // Live-derived active query so modal updates immediately when status is updated
  const liveSelectedQuery = useMemo(() => {
    if (!selectedQuery) return null;
    return assetQueries.find(q => q.id === selectedQuery.id) || null;
  }, [selectedQuery, assetQueries]);

  // Filter queries by search & tab filter
  const filteredQueries = useMemo(() => {
    return assetQueries.filter(q => {
      // Role scope if employee
      if (isEmployee && currentUser) {
        const isMyQuery =
          q.employeeId === currentUser.id ||
          q.companyEmployeeNumber === currentUser.employeeId ||
          (currentUser.email && q.employeeEmail && currentUser.email.toLowerCase() === q.employeeEmail.toLowerCase());
        if (!isMyQuery && !isAdmin) return false;
      }

      // Tab filter
      if (activeFilter === 'starred' && !q.isStarred) return false;
      if (activeFilter === 'pending' && q.status !== 'Pending Acknowledgement') return false;
      if (activeFilter === 'unresolved' && q.status !== 'Still Unresolved') return false;
      if (activeFilter === 'inprogress' && q.status !== 'In Progress' && q.status !== 'Acknowledged') return false;
      if (activeFilter === 'resolved' && q.status !== 'Resolved' && q.status !== 'Closed') return false;

      // Search term
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        q.id.toLowerCase().includes(term) ||
        q.employeeName.toLowerCase().includes(term) ||
        q.assetNumber.toLowerCase().includes(term) ||
        q.assetName.toLowerCase().includes(term) ||
        q.subject.toLowerCase().includes(term) ||
        q.queryType.toLowerCase().includes(term)
      );
    });
  }, [assetQueries, searchTerm, activeFilter, isEmployee, currentUser, isAdmin]);

  // KPI Metrics
  const metrics = useMemo(() => {
    const list = isEmployee && currentUser
      ? assetQueries.filter(
          q =>
            q.employeeId === currentUser.id ||
            q.companyEmployeeNumber === currentUser.employeeId ||
            (currentUser.email && q.employeeEmail && currentUser.email.toLowerCase() === q.employeeEmail.toLowerCase())
        )
      : assetQueries;

    return {
      total: list.length,
      pendingAck: list.filter(q => q.status === 'Pending Acknowledgement').length,
      stillUnresolved: list.filter(q => q.status === 'Still Unresolved').length,
      starred: list.filter(q => q.isStarred).length,
    };
  }, [assetQueries, isEmployee, currentUser]);

  const getStatusBadgeStyle = (status: AssetQueryStatus) => {
    switch (status) {
      case 'Pending Acknowledgement':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold';
      case 'Acknowledged':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'In Progress':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30';
      case 'Handover Completed':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30';
      case 'Still Unresolved':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 font-bold';
      case 'Resolved':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'Closed':
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-4 animate-fade-in text-xs">
      {/* Header Banner */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-white dark:bg-[#101726] p-4 rounded-xl border border-slate-200 dark:border-[#1e293b] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Staff Asset Query Management
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mandatory Admin Acknowledgement &bull; Post-Handover Unresolved Tracking &bull; Starred Queries
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowRaiseModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Raise Asset Query</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setActiveFilter('all')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-blue-500/10 border-blue-500/40 ring-1 ring-blue-500/30'
              : 'bg-white dark:bg-[#101726] border-slate-200 dark:border-[#1e293b] hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Total Queries</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono">{metrics.total}</span>
            <HelpCircle className="w-4 h-4 text-blue-500" />
          </div>
        </div>

        <div
          onClick={() => setActiveFilter('pending')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            activeFilter === 'pending'
              ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30'
              : 'bg-white dark:bg-[#101726] border-slate-200 dark:border-[#1e293b] hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider block">Pending Ack</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">{metrics.pendingAck}</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        <div
          onClick={() => setActiveFilter('unresolved')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            activeFilter === 'unresolved'
              ? 'bg-rose-500/10 border-rose-500/40 ring-1 ring-rose-500/30'
              : 'bg-white dark:bg-[#101726] border-slate-200 dark:border-[#1e293b] hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider block">Still Unresolved</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono">{metrics.stillUnresolved}</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
        </div>

        <div
          onClick={() => setActiveFilter('starred')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            activeFilter === 'starred'
              ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30'
              : 'bg-white dark:bg-[#101726] border-slate-200 dark:border-[#1e293b] hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">Starred / Important</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-amber-500 font-mono">{metrics.starred}</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white dark:bg-[#101726] p-3 rounded-xl border border-slate-200 dark:border-[#1e293b] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All Queries ({metrics.total})
          </button>

          <button
            onClick={() => setActiveFilter('starred')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'starred'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>Starred ({metrics.starred})</span>
          </button>

          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Pending Ack ({metrics.pendingAck})
          </button>

          <button
            onClick={() => setActiveFilter('unresolved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'unresolved'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
            }`}
          >
            Still Unresolved ({metrics.stillUnresolved})
          </button>

          <button
            onClick={() => setActiveFilter('inprogress')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'inprogress'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            In Progress / Ack
          </button>

          <button
            onClick={() => setActiveFilter('resolved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'resolved'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Resolved & Closed
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search query ID, staff name, asset tag, subject..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
          />
        </div>
      </div>

      {/* Query Cards List */}
      <div className="space-y-3">
        {filteredQueries.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-[#101726] rounded-xl border border-slate-200 dark:border-[#1e293b]">
            <p className="text-slate-400 text-xs">No asset queries found matching the current criteria.</p>
            <button
              type="button"
              onClick={() => setShowRaiseModal(true)}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white font-semibold rounded-lg text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Raise First Query</span>
            </button>
          </div>
        ) : (
          filteredQueries.map(q => (
            <div
              key={q.id}
              className={`p-4 rounded-xl bg-white dark:bg-[#101726] border transition-all space-y-2.5 shadow-2xs hover:shadow-xs ${
                q.isStarred
                  ? 'border-amber-500/40 dark:border-amber-500/30'
                  : 'border-slate-200/80 dark:border-[#1e293b]'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => toggleStarAssetQuery(q.id)}
                    className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    title={q.isStarred ? 'Unstar query' : 'Star query as important'}
                  >
                    <Star className={`w-4 h-4 ${q.isStarred ? 'fill-amber-400 text-amber-500' : 'text-slate-300 dark:text-slate-600'}`} />
                  </button>

                  <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                    {q.id}
                  </span>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeStyle(q.status)}`}>
                    {q.status}
                  </span>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {q.queryType}
                  </span>
                </div>

                <span className="font-mono text-[11px] text-slate-400">
                  {formatDateDisplay(q.createdAt)}
                </span>
              </div>

              {/* Subject & Asset Line */}
              <div>
                <h3
                  onClick={() => setSelectedQuery(q)}
                  className="font-bold text-slate-900 dark:text-white text-sm hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                >
                  {q.subject}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-xs mt-1 line-clamp-2">
                  {q.description}
                </p>
              </div>

              {/* Card Footer Info & Actions */}
              <div className="pt-2.5 border-t border-slate-100 dark:border-[#1e293b] flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    <span>{q.employeeName} ({q.department})</span>
                  </span>

                  <span className="flex items-center gap-1 font-mono font-semibold text-blue-600 dark:text-blue-400">
                    <Laptop className="w-3.5 h-3.5" />
                    <span>{q.assetName} [{q.assetNumber}]</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  {/* ADMIN MANDATORY ACKNOWLEDGE BUTTON */}
                  {isAdmin && q.status === 'Pending Acknowledgement' && (
                    <button
                      type="button"
                      onClick={() => acknowledgeAssetQuery(q.id, currentUser?.name || 'IT Admin')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Acknowledge Query</span>
                    </button>
                  )}

                  {/* DETAILS BUTTON */}
                  <button
                    type="button"
                    onClick={() => setSelectedQuery(q)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 font-semibold text-xs cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Timeline & History</span>
                  </button>

                  {/* ADMIN DELETE BUTTON */}
                  {isAdmin && (
                    <button
                      type="button"
                      title="Remove query record"
                      onClick={e => {
                        e.stopPropagation();
                        setRemoveTarget(q);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODALS */}
      {showRaiseModal && (
        <RaiseAssetQueryModal
          isOpen={showRaiseModal}
          onClose={() => setShowRaiseModal(false)}
        />
      )}

      {liveSelectedQuery && (
        <AssetQueryDetailModal
          isOpen={Boolean(liveSelectedQuery)}
          query={liveSelectedQuery}
          onClose={() => setSelectedQuery(null)}
        />
      )}

      <RemoveQueryModal
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={reason => {
          if (removeTarget) {
            removeAssetQuery(removeTarget.id, reason);
            setRemoveTarget(null);
          }
        }}
        title="Remove Staff Asset Query"
        queryId={removeTarget?.id}
        employeeName={removeTarget?.employeeName}
        queryTypeLabel="Query"
      />
    </div>
  );
};
