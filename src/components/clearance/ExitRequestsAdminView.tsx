import React, { useState, useMemo } from 'react';
import { ExitClearanceRecord } from '../../types';
import { formatDateDisplay } from '../../utils/formatters';
import {
  FileText,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Calendar,
  Paperclip,
  Download,
  AlertTriangle,
  ArrowRight,
  UserX,
  Plus,
} from 'lucide-react';
import { EmployeeAvatar } from '../common/EmployeeAvatar';

interface ExitRequestsAdminViewProps {
  clearances: ExitClearanceRecord[];
  onReviewRequest: (record: ExitClearanceRecord) => void;
  onInitiateClearance: () => void;
}

export const ExitRequestsAdminView: React.FC<ExitRequestsAdminViewProps> = ({
  clearances,
  onReviewRequest,
  onInitiateClearance,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Filter requests (only records that have exitRequest or where status is pending)
  const requests = useMemo(() => {
    return clearances.filter(clr => Boolean(clr.exitRequest));
  }, [clearances]);

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const st = req.exitRequest?.status || 'Pending';
      if (statusFilter !== 'All' && st !== statusFilter) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        req.employeeName.toLowerCase().includes(q) ||
        req.employeeId.toLowerCase().includes(q) ||
        (req.companyEmployeeNumber && req.companyEmployeeNumber.toLowerCase().includes(q)) ||
        req.department.toLowerCase().includes(q) ||
        (req.exitRequest?.reason && req.exitRequest.reason.toLowerCase().includes(q))
      );
    });
  }, [requests, searchQuery, statusFilter]);

  const metrics = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter(
        r => r.exitRequest?.status === 'Pending' || r.exitRequest?.status === 'Under Review'
      ).length,
      approved: requests.filter(r => r.exitRequest?.status === 'Approved').length,
      changesRequested: requests.filter(r => r.exitRequest?.status === 'Changes Requested').length,
      rejected: requests.filter(r => r.exitRequest?.status === 'Rejected').length,
    };
  }, [requests]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Approved
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      case 'Changes Requested':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
            <RefreshCw className="w-3 h-3" />
            Changes Requested
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 animate-pulse">
            <Clock className="w-3 h-3" />
            Pending Under Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => setStatusFilter('All')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'All'
              ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30'
              : 'bg-white dark:bg-[#101726] border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <span className="text-[10px] text-slate-400 uppercase font-bold block">
            Total Requests
          </span>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {metrics.total}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('Pending')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'Pending'
              ? 'bg-blue-500/10 border-blue-500/40 ring-1 ring-blue-500/30'
              : 'bg-white dark:bg-[#101726] border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <span className="text-[10px] text-blue-500 uppercase font-bold block">
            Pending Review
          </span>
          <div className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1">
            {metrics.pending}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('Approved')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'Approved'
              ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30'
              : 'bg-white dark:bg-[#101726] border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <span className="text-[10px] text-emerald-500 uppercase font-bold block">
            Approved Exits
          </span>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            {metrics.approved}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('Changes Requested')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'Changes Requested'
              ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30'
              : 'bg-white dark:bg-[#101726] border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <span className="text-[10px] text-amber-500 uppercase font-bold block">
            Changes Needed
          </span>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
            {metrics.changesRequested}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('Rejected')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'Rejected'
              ? 'bg-rose-500/10 border-rose-500/40 ring-1 ring-rose-500/30'
              : 'bg-white dark:bg-[#101726] border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <span className="text-[10px] text-rose-500 uppercase font-bold block">Rejected</span>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
            {metrics.rejected}
          </div>
        </div>
      </div>

      {/* 2. Search & Toolbar */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search exit requests by employee name, ID, department, reason..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-[#090d16] border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onInitiateClearance}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs shadow-xs dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 dark:font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Initiate Direct Clearance</span>
          </button>
        </div>
      </div>

      {/* 3. Requests List */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No Exit Requests Found
            </h3>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'All'
                ? 'Try adjusting your search query or filter criteria.'
                : 'No employee has submitted an exit request yet.'}
            </p>
          </div>
        ) : (
          filteredRequests.map(req => {
            const ext = req.exitRequest;
            const currentStatus = ext?.status || 'Pending';

            return (
              <div
                key={req.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all space-y-3"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <EmployeeAvatar name={req.employeeName} size="md" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          {req.employeeName}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700">
                          {req.companyEmployeeNumber || req.employeeId}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {req.department} &bull; {req.designation || 'Staff'} &bull; Joined:{' '}
                        {req.joiningDate || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {getStatusBadge(currentStatus)}
                    <button
                      type="button"
                      onClick={() => onReviewRequest(req)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                    >
                      <span>Review & Take Action</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Proposed Exit Date
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                      {formatDateDisplay(ext?.proposedExitDate || req.exitDate)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Exit Reason
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {ext?.reason || req.exitType}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Assigned Devices
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                      {req.items.length} Assets Tracked
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Request Date
                    </span>
                    <span className="text-slate-600 dark:text-slate-300 font-mono">
                      {ext?.requestedAt
                        ? new Date(ext.requestedAt).toLocaleDateString('en-GB')
                        : formatDateDisplay(req.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Remarks & Supporting Document */}
                {ext?.remarks && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">
                      Employee Remarks
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 italic">"{ext.remarks}"</p>
                  </div>
                )}

                {/* If supporting document was attached */}
                {ext?.supportingDocumentUrl && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-3.5 h-3.5 text-amber-500" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {ext.supportingDocumentName || 'Supporting_Document.pdf'}
                      </span>
                    </div>
                    <a
                      href={ext.supportingDocumentUrl}
                      download={ext.supportingDocumentName || 'document'}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 underline"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </a>
                  </div>
                )}

                {/* If approved/rejected feedback is present */}
                {currentStatus === 'Approved' && ext?.adminRemarks && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs">
                    <strong>Admin Approval Remarks:</strong> {ext.adminRemarks} (Final Exit:{' '}
                    {formatDateDisplay(ext.finalExitDate || req.exitDate)})
                  </div>
                )}

                {currentStatus === 'Rejected' && ext?.rejectionReason && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-xs">
                    <strong>Rejection Reason:</strong> {ext.rejectionReason}
                  </div>
                )}

                {currentStatus === 'Changes Requested' && ext?.changesRequestedNotes && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs">
                    <strong>Changes Requested:</strong> {ext.changesRequestedNotes}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
