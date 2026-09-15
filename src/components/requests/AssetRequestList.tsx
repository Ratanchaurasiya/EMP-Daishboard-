import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Layers,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Mouse,
  Keyboard,
  Cpu,
  Monitor,
  Laptop,
  Headphones,
  Camera,
  Smartphone,
  Box,
  Copy,
  Calendar,
  User,
  Building,
  Mail,
  Phone,
  ArrowUpDown,
  MoreVertical,
  Check,
  X,
  FileSpreadsheet,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Plus,
} from 'lucide-react';
import {
  AssetRequest,
  RequestStatus,
  RequestUrgency,
  EquipmentAssetType,
} from '../../types';
import { formatDateDisplay } from '../../utils/formatters';
import { SubmitAssetRequestModal } from './SubmitAssetRequestModal';

const ASSET_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Mouse,
  Keyboard,
  CPU: Cpu,
  Monitor,
  Laptop,
  Headset: Headphones,
  Webcam: Camera,
  'Mobile Phone': Smartphone,
  Other: Box,
};

export const AssetRequestList: React.FC = () => {
  const {
    assetRequests,
    updateAssetRequestStatus,
    removeAssetRequest,
    showToast,
    setSelectedEmployeeId,
    setActiveTab,
    highlightedRequestId,
    setHighlightedRequestId,
  } = useApp();

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>('all');
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);

  // Admin Review / Edit Notes Modal State
  const [selectedRequest, setSelectedRequest] = useState<AssetRequest | null>(null);
  const [editNotes, setEditNotes] = useState<string>('');
  const [editStatus, setEditStatus] = useState<RequestStatus>('Pending');

  // Deep link direct open from Notification Center click
  useEffect(() => {
    if (highlightedRequestId) {
      const match = assetRequests.find(r => r.id === highlightedRequestId);
      if (match) {
        setSelectedRequest(match);
        setEditNotes(match.adminNotes || '');
        setEditStatus(match.status);
        setSearchTerm('');
        setStatusFilter('all');
        setUrgencyFilter('all');
        setAssetTypeFilter('all');
        setHighlightedRequestId(null);
      }
    }
  }, [highlightedRequestId, assetRequests, setHighlightedRequestId]);

  // Confirmation for delete
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard!`, 'info');
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = assetRequests.length;
    const pending = assetRequests.filter(r => r.status === 'Pending').length;
    const approved = assetRequests.filter(r => r.status === 'Approved' || r.status === 'In Progress').length;
    const fulfilled = assetRequests.filter(r => r.status === 'Fulfilled').length;
    const totalUnits = assetRequests.reduce(
      (acc, r) => acc + r.items.reduce((sum, item) => sum + (item.quantity || 1), 0),
      0
    );
    return { total, pending, approved, fulfilled, totalUnits };
  }, [assetRequests]);

  // Filtered requests list
  const filteredRequests = useMemo(() => {
    return assetRequests.filter(r => {
      // Search
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.employeeName.toLowerCase().includes(q) ||
        r.employeeId.toLowerCase().includes(q) ||
        (r.companyEmployeeNumber && r.companyEmployeeNumber.toLowerCase().includes(q)) ||
        r.department.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.items.some(
          i =>
            i.assetType.toLowerCase().includes(q) ||
            (i.customAssetName && i.customAssetName.toLowerCase().includes(q)) ||
            (i.specifications && i.specifications.toLowerCase().includes(q))
        );

      // Status Filter
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;

      // Urgency Filter
      const matchesUrgency = urgencyFilter === 'all' || r.urgency === urgencyFilter;

      // Asset Type Filter
      const matchesAssetType =
        assetTypeFilter === 'all' ||
        r.items.some(i => i.assetType.toLowerCase() === assetTypeFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesUrgency && matchesAssetType;
    });
  }, [assetRequests, searchTerm, statusFilter, urgencyFilter, assetTypeFilter]);

  // Open review modal
  const handleOpenReview = (req: AssetRequest) => {
    setSelectedRequest(req);
    setEditNotes(req.adminNotes || '');
    setEditStatus(req.status);
  };

  // Save review modal
  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    updateAssetRequestStatus(selectedRequest.id, editStatus, editNotes.trim());
    setSelectedRequest(null);
  };

  // Quick One-Click Status Update
  const handleQuickStatus = (reqId: string, status: RequestStatus) => {
    updateAssetRequestStatus(reqId, status);
  };

  return (
    <div className="space-y-5 animate-fade-in text-xs">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span>Equipment Requisitions &amp; Requests</span>
            </h1>
            {stats.pending > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
                {stats.pending} Pending Review
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enterprise workforce multi-asset hardware requests, quantities, employee details, and fulfillment tracking.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowSubmitModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer self-start sm:self-auto shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Request to Admin</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 bg-white dark:bg-[#101726] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Requisitions
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stats.total}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Submitted requests</div>
        </div>

        <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 shadow-2xs">
          <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center justify-between">
            <span>Pending Action</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {stats.pending}
          </div>
          <div className="text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
            Awaiting Admin triage
          </div>
        </div>

        <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-200/60 dark:border-blue-900/40 shadow-2xs">
          <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center justify-between">
            <span>Approved / Active</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {stats.approved}
          </div>
          <div className="text-[10px] text-blue-700/80 dark:text-blue-400/80 mt-0.5">
            Queued for procurement
          </div>
        </div>

        <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 shadow-2xs">
          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center justify-between">
            <span>Fulfilled</span>
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.fulfilled}
          </div>
          <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
            Delivered &amp; assigned
          </div>
        </div>

        <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-200/60 dark:border-indigo-900/40 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center justify-between">
            <span>Total Units</span>
            <Box className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {stats.totalUnits}
          </div>
          <div className="text-[10px] text-indigo-700/80 dark:text-indigo-400/80 mt-0.5">
            Assets requested
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3.5 bg-white dark:bg-[#101726] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Search box */}
          <div className="sm:col-span-4 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by Employee, ID, Asset, Dept..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
            />
          </div>

          {/* Status filter */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans cursor-pointer"
            >
              <option value="all">All Statuses ({assetRequests.length})</option>
              <option value="Pending">Pending Review ({assetRequests.filter(r => r.status === 'Pending').length})</option>
              <option value="Approved">Approved ({assetRequests.filter(r => r.status === 'Approved').length})</option>
              <option value="In Progress">In Progress ({assetRequests.filter(r => r.status === 'In Progress').length})</option>
              <option value="Fulfilled">Fulfilled ({assetRequests.filter(r => r.status === 'Fulfilled').length})</option>
              <option value="Rejected">Rejected ({assetRequests.filter(r => r.status === 'Rejected').length})</option>
            </select>
          </div>

          {/* Asset Type filter */}
          <div className="sm:col-span-3">
            <select
              value={assetTypeFilter}
              onChange={e => setAssetTypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans cursor-pointer"
            >
              <option value="all">All Asset Types</option>
              <option value="Mouse">Mouse</option>
              <option value="Keyboard">Keyboard</option>
              <option value="CPU">CPU / Desktop</option>
              <option value="Monitor">Monitor</option>
              <option value="Laptop">Laptop</option>
              <option value="Headset">Headset</option>
              <option value="Webcam">Webcam</option>
              <option value="Mobile Phone">Mobile Phone</option>
              <option value="Other">Other Equipment</option>
            </select>
          </div>

          {/* Urgency filter */}
          <div className="sm:col-span-2">
            <select
              value={urgencyFilter}
              onChange={e => setUrgencyFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Active Filter Count & Reset */}
        {(searchTerm || statusFilter !== 'all' || urgencyFilter !== 'all' || assetTypeFilter !== 'all') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
            <span>
              Showing <strong>{filteredRequests.length}</strong> matching requisition{filteredRequests.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setUrgencyFilter('all');
                setAssetTypeFilter('all');
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Main Requisitions Display */}
      {filteredRequests.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#101726] rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
            No equipment requisitions found
          </div>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'all'
              ? 'Try modifying your search query or filter settings.'
              : 'When employees submit equipment requests through their portal, they will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map(req => {
            const reqTotalUnits = req.items.reduce((s, i) => s + (i.quantity || 1), 0);

            return (
              <div
                key={req.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-2xs ${
                  req.status === 'Pending'
                    ? 'bg-amber-50/20 dark:bg-amber-950/10 border-amber-300/80 dark:border-amber-800/60'
                    : req.status === 'Approved'
                    ? 'bg-blue-50/20 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900/50'
                    : req.status === 'Fulfilled'
                    ? 'bg-emerald-50/10 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/50'
                    : 'bg-white dark:bg-[#101726] border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Requisition Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleCopy(req.id, 'Request ID')}
                      className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Click to copy Request ID"
                    >
                      <span>#{req.id}</span>
                      <Copy className="w-3 h-3 text-slate-400" />
                    </button>

                    {/* Urgency Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        req.urgency === 'Critical'
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse'
                          : req.urgency === 'High'
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                      }`}
                    >
                      {req.urgency} Priority
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                        req.status === 'Pending'
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-400/50 animate-pulse'
                          : req.status === 'Approved'
                          ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-400/40'
                          : req.status === 'In Progress'
                          ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-400/40'
                          : req.status === 'Fulfilled'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/40'
                          : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-400/40'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span>{req.status}</span>
                    </span>

                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{formatDateDisplay(req.requestDate)}</span>
                    </span>
                  </div>

                  {/* Top Action Buttons */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    {req.status === 'Pending' && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatus(req.id, 'Approved')}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}

                    {req.status === 'Approved' && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatus(req.id, 'Fulfilled')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Mark Fulfilled</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenReview(req)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-[11px] transition-colors cursor-pointer"
                    >
                      Review &amp; Notes
                    </button>

                    {confirmDeleteId === req.id ? (
                      <div className="flex items-center gap-1 animate-fade-in">
                        <button
                          type="button"
                          onClick={() => {
                            removeAssetRequest(req.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2 py-1 rounded-lg bg-rose-600 text-white font-bold text-[10px] hover:bg-rose-500 cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(req.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 pt-3">
                  {/* Left Column: Employee Requester Details */}
                  <div className="lg:col-span-4 space-y-2 pr-0 lg:pr-3 lg:border-r border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3 h-3 text-blue-500" />
                      <span>Employee Details</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-sm flex items-center justify-center border border-blue-500/20 shrink-0">
                        {req.employeeName.charAt(0)}
                      </div>
                      <div className="truncate flex-1">
                        <div className="font-bold text-slate-900 dark:text-white text-xs truncate">
                          {req.employeeName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono truncate">
                          {req.employeeId} {req.companyEmployeeNumber ? `• ${req.companyEmployeeNumber}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <Building className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{req.department} {req.designation ? `(${req.designation})` : ''}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <a
                          href={`mailto:${req.employeeEmail}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline truncate"
                        >
                          {req.employeeEmail}
                        </a>
                      </div>
                      {req.employeePhone && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-mono text-slate-700 dark:text-slate-300 truncate">{req.employeePhone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Requested Assets, Quantities & Reason */}
                  <div className="lg:col-span-8 space-y-3">
                    {/* Requested Assets Badges */}
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>Requested Assets ({req.items.length} Categories • {reqTotalUnits} Units)</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {req.items.map((item, idx) => {
                          const Icon = ASSET_TYPE_ICONS[item.assetType] || Box;

                          return (
                            <div
                              key={item.id || idx}
                              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2 text-xs"
                            >
                              <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <div className="truncate flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-bold text-slate-900 dark:text-white truncate">
                                    {item.customAssetName ? `${item.assetType} (${item.customAssetName})` : item.assetType}
                                  </span>
                                  <span className="font-mono font-black text-[11px] px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300/60 dark:border-blue-800 shrink-0">
                                    {item.quantity} unit{item.quantity > 1 ? 's' : ''}
                                  </span>
                                </div>
                                {item.specifications && (
                                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 italic truncate">
                                    &ldquo;{item.specifications}&rdquo;
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Business Reason */}
                    <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 text-[11.5px]">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        Business Purpose &amp; Justification:
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                        {req.reason}
                      </p>
                    </div>

                    {/* Admin Notes if present */}
                    {req.adminNotes && (
                      <div className="p-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/40 text-[11px] flex items-start gap-1.5 text-blue-900 dark:text-blue-200">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold">IT Admin Note:</strong> {req.adminNotes}
                          {req.fulfilledDate && (
                            <span className="text-slate-500 dark:text-slate-400 block text-[10px] mt-0.5">
                              Fulfilled on: {formatDateDisplay(req.fulfilledDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* REVIEW & EDIT NOTES MODAL                                  */}
      {/* ========================================================= */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-[#101726] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Manage Requisition #{selectedRequest.id}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Requested by {selectedRequest.employeeName} ({selectedRequest.department})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="space-y-4 pt-4">
              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Requisition Status
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(['Pending', 'Approved', 'Fulfilled', 'Rejected'] as RequestStatus[]).map(st => (
                    <button
                      type="button"
                      key={st}
                      onClick={() => setEditStatus(st)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        editStatus === st
                          ? st === 'Fulfilled'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : st === 'Approved'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : st === 'Rejected'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-amber-500 text-white border-amber-600'
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Notes / Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Admin Notes &amp; Fulfillment Instructions
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="e.g. Approved by IT lead. Mouse and keyboard ready for pickup at IT desk. Monitor purchase order PO-882 pending delivery..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMIT ASSET REQUEST MODAL */}
      <SubmitAssetRequestModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
      />
    </div>
  );
};
