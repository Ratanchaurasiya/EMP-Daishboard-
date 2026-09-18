import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ProblemCategoryBadge, ServiceStatusBadge } from '../common/Badge';
import { formatCurrency, formatDateDisplay } from '../../utils/formatters';
import { ProblemCategory, ServiceStatus, ServiceRecord } from '../../types';
import {
  Wrench,
  Plus,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Activity,
  RotateCcw,
  Check,
  ShieldCheck,
  Trash2,
  IndianRupee,
  Calendar,
  AlertCircle,
  X,
  User,
  GitBranch,
  FileText,
  UploadCloud,
  Eye,
  Paperclip,
  Building2,
  Phone,
} from 'lucide-react';
import { DateWiseServiceExpenseGraph } from '../analytics/DateWiseServiceExpenseGraph';
import { ServiceReceiptPreviewModal } from './ServiceReceiptPreviewModal';
import { UploadServiceReceiptModal } from './UploadServiceReceiptModal';

interface ServiceListProps {
  onOpenAddService: (computerId?: string) => void;
  onSelectComputer: (computerId: string) => void;
  onSelectEmployee?: (employeeId: string) => void;
}

export const ServiceList: React.FC<ServiceListProps> = ({
  onOpenAddService,
  onSelectComputer,
  onSelectEmployee,
}) => {
  const {
    serviceRecords,
    computers,
    serviceProviders,
    userRole,
    globalFilters,
    updateServiceRecord,
    removeServiceRecord,
    setActiveTab,
    setSelectedEmployeeId,
    setActiveSystemSupportTicket,
    highlightedServiceId,
    setHighlightedServiceId,
  } = useApp();

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Receipt Modal States
  const [previewReceiptRecord, setPreviewReceiptRecord] = useState<ServiceRecord | null>(null);
  const [uploadReceiptRecordId, setUploadReceiptRecordId] = useState<string | null>(null);

  useEffect(() => {
    if (highlightedServiceId) {
      const rec = serviceRecords.find(s => s.id === highlightedServiceId);
      if (rec) {
        setPreviewReceiptRecord(rec);
      }
      setHighlightedServiceId(null);
    }
  }, [highlightedServiceId, serviceRecords, setHighlightedServiceId]);

  const categories: ProblemCategory[] = [
    'Windows Problem',
    'Slow Performance',
    'RAM Problem',
    'SSD/HDD Problem',
    'Keyboard Problem',
    'Mouse Problem',
    'Display Problem',
    'Network Problem',
    'Software Installation',
    'Driver Problem',
    'Hardware Failure',
    'Formatting',
    'Other',
  ];

  // Admin completion dialog state when transitioning to Done/Completed
  const [completingRecord, setCompletingRecord] = useState<typeof serviceRecords[0] | null>(null);
  const [completionAmount, setCompletionAmount] = useState<number>(0);
  const [completionShopName, setCompletionShopName] = useState<string>('');
  const [completionTechnicianName, setCompletionTechnicianName] = useState<string>('');
  const [completionPhone, setCompletionPhone] = useState<string>('');
  const [completionWorkPerformed, setCompletionWorkPerformed] = useState<string>('');
  const [completionDate, setCompletionDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [completionNotes, setCompletionNotes] = useState<string>('');
  const [completionParts, setCompletionParts] = useState<string>('None');
  const [completionReceiptNumber, setCompletionReceiptNumber] = useState<string>('');
  const [completionReceiptDate, setCompletionReceiptDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [completionReceiptFileName, setCompletionReceiptFileName] = useState<string>('');
  const [completionReceiptFileUrl, setCompletionReceiptFileUrl] = useState<string>('');
  const [completionReceiptFileSize, setCompletionReceiptFileSize] = useState<number>(0);
  const [completionReceiptError, setCompletionReceiptError] = useState<string>('');

  const completionFileInputRef = useRef<HTMLInputElement>(null);

  const handleCompletionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompletionReceiptError('');

    if (file.size > 10 * 1024 * 1024) {
      setCompletionReceiptError('File size is too large. Please select a receipt under 10MB.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|gif|pdf)$/i)) {
      setCompletionReceiptError('Unsupported file format. Please upload JPG, PNG, or PDF.');
      return;
    }

    setCompletionReceiptFileName(file.name);
    setCompletionReceiptFileSize(file.size);

    const reader = new FileReader();
    reader.onload = () => {
      setCompletionReceiptFileUrl(reader.result as string);
    };
    reader.onerror = () => {
      setCompletionReceiptError('Failed to read file. Please try another file.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCompletionFile = () => {
    setCompletionReceiptFileName('');
    setCompletionReceiptFileUrl('');
    setCompletionReceiptFileSize(0);
    setCompletionReceiptError('');
    if (completionFileInputRef.current) {
      completionFileInputRef.current.value = '';
    }
  };

  // Open modal when Admin initiates Done / Completed
  const initiateCompleteRecord = (record: typeof serviceRecords[0]) => {
    setCompletingRecord(record);
    setCompletionAmount(Number(record.serviceCost) || 0);
    setCompletionShopName(record.serviceProviderShopName || '');
    setCompletionTechnicianName(record.technician || '');
    setCompletionPhone(record.serviceProviderPhone || '');
    setCompletionWorkPerformed(record.workPerformed || '');
    setCompletionDate(record.serviceDate || new Date().toISOString().substring(0, 10));
    setCompletionNotes(record.resolution || record.remarks || '');
    setCompletionParts(record.partsReplaced && record.partsReplaced !== 'None' ? record.partsReplaced : 'None');
    setCompletionReceiptNumber(record.receiptNumber || '');
    setCompletionReceiptDate(record.receiptDate || record.serviceDate || new Date().toISOString().substring(0, 10));
    setCompletionFileName(record.receiptFileName || '');
    setCompletionFileUrl(record.receiptFileUrl || '');
    setCompletionReceiptFileSize(record.receiptFileSize || 0);
    setCompletionReceiptError('');
  };

  const handleCompletionProviderSelect = (providerId: string) => {
    if (!providerId) return;
    const p = serviceProviders.find(sp => sp.id === providerId);
    if (p) {
      setCompletionShopName(p.shopName);
      setCompletionTechnicianName(p.technicianName);
      setCompletionPhone(p.whatsappNumber || p.phoneNumber);
    }
  };

  const setCompletionFileName = (name: string) => setCompletionReceiptFileName(name);
  const setCompletionFileUrl = (url: string) => setCompletionReceiptFileUrl(url);

  // Submit complete record with all required details
  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingRecord) return;

    updateServiceRecord(completingRecord.id, {
      serviceStatus: 'Completed',
      serviceCost: Number(completionAmount) || 0,
      serviceProviderShopName: completionShopName.trim() || undefined,
      technician: completionTechnicianName.trim() || undefined,
      serviceProviderPhone: completionPhone.trim() || undefined,
      workPerformed: completionWorkPerformed.trim() || 'Service & repair maintenance completed.',
      serviceDate: completionDate,
      resolution: completionNotes.trim() || 'Service and repair successfully performed and tested.',
      partsReplaced: completionParts.trim() || 'None',
      remarks: completionNotes.trim() ? `${completingRecord.remarks ? completingRecord.remarks + ' • ' : ''}${completionNotes.trim()}` : completingRecord.remarks,
      receiptNumber: completionReceiptNumber.trim() || undefined,
      receiptDate: completionReceiptDate || completionDate,
      receiptFileName: completionReceiptFileName || undefined,
      receiptFileUrl: completionReceiptFileUrl || undefined,
      receiptFileSize: completionReceiptFileSize || undefined,
      receiptFileType: completionReceiptFileName?.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
    });

    setCompletingRecord(null);
  };

  // Quick interactive status updater
  const handleUpdateStatus = (id: string, newStatus: ServiceStatus) => {
    if (newStatus === 'Completed') {
      const rec = serviceRecords.find(s => s.id === id);
      if (rec) {
        initiateCompleteRecord(rec);
        return;
      }
    }
    updateServiceRecord(id, {
      serviceStatus: newStatus,
    });
  };

  // Toggle between In Progress and Completed
  const handleToggleStatus = (id: string, currentStatus: ServiceStatus) => {
    if (currentStatus === 'In Progress') {
      const rec = serviceRecords.find(s => s.id === id);
      if (rec) {
        initiateCompleteRecord(rec);
        return;
      }
    }
    handleUpdateStatus(id, 'In Progress');
  };

  // Dynamic status metrics
  const totalTickets = serviceRecords.length;
  const inProgressRecords = useMemo(
    () => serviceRecords.filter(s => s.serviceStatus === 'In Progress'),
    [serviceRecords]
  );
  const completedRecords = useMemo(
    () => serviceRecords.filter(s => s.serviceStatus === 'Completed'),
    [serviceRecords]
  );
  const pendingPartsRecords = useMemo(
    () => serviceRecords.filter(s => s.serviceStatus === 'Pending Parts'),
    [serviceRecords]
  );

  const completionRate =
    totalTickets > 0 ? Math.round((completedRecords.length / totalTickets) * 100) : 100;
  const inProgressRate =
    totalTickets > 0 ? Math.round((inProgressRecords.length / totalTickets) * 100) : 0;

  const employeeRequestsCount = useMemo(
    () => serviceRecords.filter(s => s.problem?.includes('[Employee Request]') || s.workPerformed?.includes('employee portal')).length,
    [serviceRecords]
  );

  // Filtered dataset for table
  const filteredRecords = useMemo(() => {
    return serviceRecords.filter(s => {
      if (globalFilters.search) {
        const q = globalFilters.search.toLowerCase();
        const matches =
          s.id.toLowerCase().includes(q) ||
          s.assetNumber.toLowerCase().includes(q) ||
          s.deviceName.toLowerCase().includes(q) ||
          s.employeeName.toLowerCase().includes(q) ||
          s.problem.toLowerCase().includes(q) ||
          s.technician.toLowerCase().includes(q) ||
          s.problemCategory.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (categoryFilter && s.problemCategory !== categoryFilter) return false;
      if (statusFilter) {
        if (statusFilter === 'employee-requests') {
          const isEmp = s.problem?.includes('[Employee Request]') || s.workPerformed?.includes('employee portal');
          if (!isEmp) return false;
        } else if (s.serviceStatus !== statusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [serviceRecords, globalFilters.search, categoryFilter, statusFilter]);

  const totalCost = filteredRecords.reduce((acc, s) => acc + (Number(s.serviceCost) || 0), 0);
  const isAdmin = userRole === 'admin';

  return (
    <div className="space-y-4 animate-fade-in">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-500" />
            <span>Desktop Maintenance & Repair Desk</span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
              {filteredRecords.length} Tickets
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Historical diagnostic records, part replacements, technician assignments, and cost telemetry
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('system-support')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            title="View PC / Laptop Repair Providers & Vendors"
          >
            <Wrench className="w-3.5 h-3.5 text-indigo-500" />
            <span>PC Support Providers</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => onOpenAddService()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Service Ticket</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. SUMMARY KPI STRIP (Interactive) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        <div
          onClick={() => setStatusFilter('')}
          className="p-3.5 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs cursor-pointer hover:border-blue-500/30 transition-all group"
        >
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block group-hover:text-blue-500 transition-colors">
              Total Tickets Logged
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
              {totalTickets}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('In Progress')}
          className="p-3.5 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs cursor-pointer hover:border-amber-500/40 transition-all group"
        >
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block group-hover:text-amber-500 transition-colors">
              Under Active Repair
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {inProgressRecords.length}
              </span>
              {inProgressRecords.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
            <Wrench className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Repair Expenditure</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {formatCurrency(totalCost)}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* DATE-WISE SERVICE & MAINTENANCE EXPENSE TELEMETRY LINE GRAPH */}
      <DateWiseServiceExpenseGraph
        onSelectComputer={onSelectComputer}
        onSelectEmployee={onSelectEmployee}
      />

      {/* 3. DEDICATED PROGRESS STATUS SECTION FOR "DESKTOP MAINTENANCE & REPAIR DESK" */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-[#1e293b] shadow-xs space-y-3.5">
        {/* Progress Status Header & Interactive Filter Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Progress Status • Maintenance & Repair Pipeline
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                  {completionRate}% Completed
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Live interactive task progress across active bench repairs and resolved tickets
              </p>
            </div>
          </div>

          {/* Interactive Progress Status Filter Switcher Buttons */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-[#090d16] border border-slate-200/60 dark:border-slate-800 text-xs self-start lg:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-3 py-1.5 rounded-md font-semibold text-xs transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === ''
                  ? 'bg-white dark:bg-[#101726] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Tasks ({totalTickets})
            </button>

            <button
              onClick={() => setStatusFilter('employee-requests')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'employee-requests'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-purple-700 dark:text-purple-400 hover:bg-purple-500/10'
              }`}
            >
              <User className="w-3 h-3" />
              <span>Employee Requests ({employeeRequestsCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('In Progress')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'In Progress'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-amber-700 dark:text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>In Progress ({inProgressRecords.length})</span>
            </button>

            <button
              onClick={() => setStatusFilter('Completed')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'Completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed ({completedRecords.length})</span>
            </button>

            {pendingPartsRecords.length > 0 && (
              <button
                onClick={() => setStatusFilter('Pending Parts')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium text-xs transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'Pending Parts'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10'
                }`}
              >
                <span>Pending Parts ({pendingPartsRecords.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Dual-Segment Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Fleet Repair Resolution:</span>
              <span className="font-mono text-slate-900 dark:text-white font-bold">{completedRecords.length} of {totalTickets} Tasks Resolved</span>
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{completedRecords.length} Completed ({completionRate}%)</span>
              {inProgressRecords.length > 0 && (
                <>
                  {' • '}
                  <span className="text-amber-600 dark:text-amber-400 font-bold">{inProgressRecords.length} In Progress ({inProgressRate}%)</span>
                </>
              )}
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden flex shadow-inner">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
              title={`Completed: ${completedRecords.length} (${completionRate}%)`}
            />
            <div
              className="bg-amber-500 h-full transition-all duration-500 animate-pulse"
              style={{ width: `${inProgressRate}%` }}
              title={`In Progress: ${inProgressRecords.length} (${inProgressRate}%)`}
            />
          </div>
        </div>

        {/* ACTIVE TASK SPOTLIGHT (If tasks are In Progress) */}
        {inProgressRecords.length > 0 ? (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-amber-800 dark:text-amber-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                Active Work In Progress on Diagnostic Bench ({inProgressRecords.length} task{inProgressRecords.length > 1 ? 's' : ''}):
              </span>
              <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
                Click "Mark as Completed" to finish repair and return workstation to active status
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {inProgressRecords.map(task => {
                const comp = computers.find(c => c.id === task.computerId || c.assetNumber === task.assetNumber);

                return (
                  <div
                    key={task.id}
                    className="p-3 rounded-lg bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
                        <Clock className="w-4 h-4 animate-spin" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {task.id}
                          </span>
                          {task.problem?.includes('[Employee Request]') && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                              <User className="w-3 h-3 text-purple-500" />
                              Employee Raised Request
                            </span>
                          )}
                          <button
                            onClick={() => comp && onSelectComputer(comp.id)}
                            className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            {task.assetNumber}
                          </button>
                          <span className="text-slate-500 dark:text-slate-400 font-medium">
                            ({task.deviceName})
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            {task.employeeName}
                          </span>
                        </div>

                        <p className="text-xs text-slate-800 dark:text-slate-200 mt-1 font-semibold">
                          {task.problem}
                        </p>

                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>Technician: <strong className="text-slate-700 dark:text-slate-300">{task.technician}</strong></span>
                          <span>Parts: <strong className="text-slate-700 dark:text-slate-300">{task.partsReplaced || 'None'}</strong></span>
                          <span>Cost: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(task.serviceCost)}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Action Controls */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      {/* DYNAMIC "IN PROGRESS" BUTTON/STATUS */}
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                        In Progress
                      </span>

                      {/* DIRECT "MARK COMPLETED" BUTTON */}
                      {isAdmin && (
                        <button
                          onClick={() => handleUpdateStatus(task.id, 'Completed')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer"
                          title="Click to complete this repair task"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Completed</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="font-semibold">All Desktop Maintenance & Repair tasks are completed. Full workstation fleet is healthy and operational.</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              0 machines currently under active bench repair
            </span>
          </div>
        )}
      </div>

      {/* 4. FILTER CONTROLS */}
      <div className="p-3 bg-white dark:bg-[#101726] rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Problem Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          >
            <option value="">All Statuses ({totalTickets})</option>
            <option value="Completed">Completed ({completedRecords.length})</option>
            <option value="In Progress">In Progress ({inProgressRecords.length})</option>
            <option value="Pending Parts">Pending Parts ({pendingPartsRecords.length})</option>
            <option value="Cannot Repair">Cannot Repair</option>
          </select>

          {(categoryFilter || statusFilter) && (
            <button
              onClick={() => {
                setCategoryFilter('');
                setStatusFilter('');
              }}
              className="text-[11px] text-blue-600 hover:text-blue-500 font-semibold px-2 py-1 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        <span className="text-[11px] text-slate-400 font-mono">
          Showing {filteredRecords.length} records
        </span>
      </div>

      {/* Mobile Card View (Optimized for Phone Screens) */}
      <div className="md:hidden space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-[#101726] rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Wrench className="w-5 h-5" />
            </div>
            <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">No service records found</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Try adjusting your filters</p>
          </div>
        ) : (
          filteredRecords.map(record => {
            const comp = computers.find(
              c => c.id === record.computerId || c.assetNumber === record.assetNumber
            );
            return (
              <div
                key={record.id}
                className="p-3.5 bg-white dark:bg-[#101726] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                      {record.id}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDateDisplay(record.serviceDate)}
                    </span>
                  </div>
                  <ServiceStatusBadge status={record.serviceStatus} size="sm" />
                </div>

                <div>
                  {record.problem?.includes('[Employee Request]') && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 mb-1">
                      <User className="w-2.5 h-2.5" />
                      Employee Request
                    </span>
                  )}
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                    {record.problem.replace('[Employee Request]', '').trim()}
                  </h4>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {record.problemCategory}
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#090d16] border border-slate-100 dark:border-slate-800/60 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Workstation:</span>
                    <button
                      onClick={() => comp && onSelectComputer(comp.id)}
                      className="font-mono font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 underline text-[11px]"
                    >
                      {record.assetNumber} ({record.deviceName})
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Employee:</span>
                    <button
                      type="button"
                      onClick={() => (onSelectEmployee ? onSelectEmployee(record.employeeId) : setSelectedEmployeeId(record.employeeId))}
                      className="font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] flex items-center gap-1.5 cursor-pointer"
                      title={`Click to view profile and assets for ${record.employeeName} (${record.employeeId})`}
                    >
                      <span>{record.employeeName}</span>
                      <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
                        {record.employeeId}
                      </span>
                    </button>
                  </div>
                  {/* Service Provider / Electric Shop */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-amber-500" />
                      <span>Shop / Vendor:</span>
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right truncate max-w-[160px]">
                      {record.serviceProviderShopName || 'IT Support / In-House'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Technician:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{record.technician || 'IT Support'}</span>
                      {record.serviceProviderPhone && (
                        <a
                          href={`https://wa.me/${record.serviceProviderPhone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-0.5 px-1 rounded text-[10px] bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-colors"
                          title="Contact on WhatsApp"
                        >
                          WA
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800 font-mono">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Cost:</span>
                    <strong className="text-slate-900 dark:text-white font-bold text-[11px]">
                      {record.serviceCost > 0 ? `₹${record.serviceCost.toLocaleString()}` : 'Free / In-House'}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800 text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Receipt:</span>
                    {record.receiptFileUrl ? (
                      <button
                        type="button"
                        onClick={() => setPreviewReceiptRecord(record)}
                        className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Bill</span>
                        <Eye className="w-3 h-3 text-emerald-500 ml-0.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setUploadReceiptRecordId(record.id)}
                        className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 cursor-pointer"
                      >
                        <UploadCloud className="w-3 h-3" />
                        <span>+ Attach</span>
                      </button>
                    )}
                  </div>
                </div>

                {isAdmin && record.serviceStatus === 'In Progress' && (
                  <button
                    onClick={() => handleUpdateStatus(record.id, 'Completed')}
                    className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Task Completed</span>
                  </button>
                )}

                {isAdmin && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {record.receiptFileUrl && (
                        <button
                          type="button"
                          onClick={() => setPreviewReceiptRecord(record)}
                          className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 py-1 cursor-pointer font-medium"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Receipt</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setUploadReceiptRecordId(record.id)}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 py-1 cursor-pointer font-medium"
                      >
                        <UploadCloud className="w-3 h-3" />
                        <span>Edit Bill</span>
                      </button>
                    </div>

                    {confirmDeleteId === record.id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">Delete?</span>
                        <button
                          onClick={() => {
                            removeServiceRecord(record.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-semibold cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px] font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(record.id)}
                        className="text-[11px] text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 py-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 5. SERVICE RECORDS TABLE (Hidden on Mobile) */}
      <div className="hidden md:block bg-white dark:bg-[#101726] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Service ID</th>
                <th className="py-2.5 px-4 font-semibold">Service Date</th>
                <th className="py-2.5 px-4 font-semibold">Computer Unit</th>
                <th className="py-2.5 px-4 font-semibold">Employee</th>
                <th className="py-2.5 px-4 font-semibold">Category</th>
                <th className="py-2.5 px-4 font-semibold">Diagnosis &amp; Work</th>
                <th className="py-2.5 px-4 font-semibold">Parts Replaced</th>
                <th className="py-2.5 px-4 font-semibold">Service Provider &amp; Tech</th>
                <th className="py-2.5 px-4 font-semibold">Cost</th>
                <th className="py-2.5 px-4 font-semibold">Receipt / Invoice</th>
                <th className="py-2.5 px-4 font-semibold">Progress &amp; Status</th>
                {isAdmin && <th className="py-2.5 px-4 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 12 : 11} className="py-12 text-center text-slate-400">
                    No service records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map(record => {
                  const comp = computers.find(
                    c => c.id === record.computerId || c.assetNumber === record.assetNumber
                  );

                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Service ID */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {record.id}
                      </td>

                      {/* Service Date */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDateDisplay(record.serviceDate)}
                      </td>

                      {/* Computer Unit */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            if (comp) onSelectComputer(comp.id);
                          }}
                          className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span className="font-mono text-blue-600 dark:text-blue-400">{record.assetNumber}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({record.deviceName})</span>
                        </button>
                      </td>

                      {/* Employee */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => (onSelectEmployee ? onSelectEmployee(record.employeeId) : setSelectedEmployeeId(record.employeeId))}
                          className="text-left group/emp cursor-pointer block"
                          title={`Click to view profile and assets for ${record.employeeName} (${record.employeeId})`}
                        >
                          <div className="font-semibold text-slate-900 dark:text-white group-hover/emp:text-blue-600 dark:group-hover/emp:text-blue-400 transition-colors">
                            {record.employeeName}
                          </div>
                          <span className="inline-block text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-1.5 py-0.5 rounded border border-blue-500/20 transition-colors mt-0.5">
                            {record.employeeId}
                          </span>
                        </button>
                      </td>

                      {/* Problem Category */}
                      <td className="py-3 px-4">
                        <ProblemCategoryBadge category={record.problemCategory} />
                      </td>

                      {/* Diagnosis & Work */}
                      <td className="py-3 px-4 max-w-xs">
                        {record.problem?.includes('[Employee Request]') && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 mb-1">
                            <User className="w-2.5 h-2.5" />
                            Employee Request
                          </span>
                        )}
                        <div className="font-semibold text-slate-900 dark:text-white truncate" title={record.problem}>
                          {record.problem.replace('[Employee Request]', '').trim()}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate" title={record.workPerformed}>
                          {record.workPerformed}
                        </div>
                      </td>

                      {/* Parts Replaced */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {record.partsReplaced}
                      </td>

                      {/* Service Provider & Technician */}
                      <td className="py-3 px-4 max-w-[190px]">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200 truncate" title={record.serviceProviderShopName || 'IT Support / In-House'}>
                            <Building2 className="w-3 h-3 text-amber-500 shrink-0" />
                            <span className="truncate">{record.serviceProviderShopName || 'IT Support / In-House'}</span>
                          </div>
                          <div className="flex items-center justify-between gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="truncate">{record.technician || 'IT Support'}</span>
                            {record.serviceProviderPhone && (
                              <a
                                href={`https://wa.me/${record.serviceProviderPhone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-colors shrink-0"
                                title="Chat on WhatsApp"
                              >
                                <span>WA</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(record.serviceCost)}
                      </td>

                      {/* Receipt / Invoice */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {record.receiptFileUrl ? (
                          <button
                            type="button"
                            onClick={() => setPreviewReceiptRecord(record)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer group shadow-2xs"
                            title="View uploaded repair receipt"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Receipt Attached</span>
                            <Eye className="w-3 h-3 text-emerald-500 opacity-70 group-hover:opacity-100" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setUploadReceiptRecordId(record.id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-dashed border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                            title="Attach receipt/invoice for this repair"
                          >
                            <UploadCloud className="w-3 h-3" />
                            <span>+ Attach</span>
                          </button>
                        )}
                      </td>

                      {/* DYNAMIC & INTERACTIVE PROGRESS STATUS COLUMN */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isAdmin ? (
                          <div className="flex items-center gap-1.5">
                            {record.serviceStatus === 'In Progress' ? (
                              <div className="flex items-center gap-1.5">
                                {/* IN PROGRESS BUTTON / STATUS */}
                                <button
                                  onClick={() => handleToggleStatus(record.id, record.serviceStatus)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/40 shadow-xs transition-all cursor-pointer group"
                                  title="Admin Action: Task is currently In Progress. Click to Mark as Completed"
                                >
                                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping group-hover:hidden" />
                                  <CheckCircle2 className="w-3.5 h-3.5 hidden group-hover:inline text-emerald-600 dark:text-emerald-400" />
                                  <span>In Progress</span>
                                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal hidden xl:inline">
                                    ⚡
                                  </span>
                                </button>

                                {/* DIRECT QUICK "COMPLETE" BUTTON */}
                                <button
                                  onClick={() => handleUpdateStatus(record.id, 'Completed')}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer"
                                  title="Mark as Completed"
                                >
                                  <Check className="w-3 h-3" />
                                  <span className="hidden xl:inline">Done</span>
                                </button>
                              </div>
                            ) : record.serviceStatus === 'Completed' ? (
                              <div className="flex items-center gap-1.5">
                                {/* COMPLETED BUTTON / STATUS */}
                                <button
                                  onClick={() => handleToggleStatus(record.id, record.serviceStatus)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 shadow-xs transition-all cursor-pointer group"
                                  title="Admin Action: Task is Completed. Click to Reopen as In Progress"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>Completed</span>
                                  <RotateCcw className="w-3 h-3 hidden group-hover:inline text-slate-400" />
                                </button>

                                {/* Subtle Reopen Trigger */}
                                <button
                                  onClick={() => handleUpdateStatus(record.id, 'In Progress')}
                                  className="text-[10px] text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 px-1 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="Reopen this service ticket as In Progress"
                                >
                                  Reopen
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <ServiceStatusBadge status={record.serviceStatus} size="sm" />
                                <button
                                  onClick={() => handleUpdateStatus(record.id, 'In Progress')}
                                  className="text-[10px] text-amber-600 hover:underline cursor-pointer"
                                >
                                  Start
                                </button>
                              </div>
                            )}

                            {/* Quick Status Dropdown Selector */}
                            <select
                              value={record.serviceStatus}
                              onChange={e => handleUpdateStatus(record.id, e.target.value as ServiceStatus)}
                              className="text-[10px] font-mono bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ml-1"
                              title="Admin quick change status"
                            >
                              <option value="Completed">Completed</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Pending Parts">Pending Parts</option>
                              <option value="Cannot Repair">Cannot Repair</option>
                            </select>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <ServiceStatusBadge status={record.serviceStatus} size="sm" />
                            <span className="text-[10px] text-slate-400 font-mono italic">
                              (Admin only)
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      {isAdmin && (
                        <td className="py-3 px-4 text-right">
                          {confirmDeleteId === record.id ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">Delete?</span>
                              <button
                                onClick={() => {
                                  removeServiceRecord(record.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-semibold cursor-pointer shadow-xs"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px] font-semibold cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveSystemSupportTicket({
                                    requestId: record.id,
                                    employeeId: record.employeeId || 'Staff',
                                    employeeName: record.employeeName || 'Assigned Staff',
                                    deviceName: record.deviceName,
                                    assetType: 'Workstation / Laptop',
                                    assetNumber: record.assetNumber,
                                    problemDescription: `${record.problemCategory}: ${record.problem}`,
                                    urgency: 'High',
                                    status: record.serviceStatus,
                                    createdAt: record.serviceDate,
                                  });
                                  setActiveTab('system-support');
                                }}
                                className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors cursor-pointer"
                                title="Contact / Assign PC Support Vendor"
                              >
                                <Wrench className="w-3.5 h-3.5" />
                              </button>
                              {record.receiptFileUrl && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewReceiptRecord(record)}
                                  className="p-1 rounded text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
                                  title="View Receipt"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setUploadReceiptRecordId(record.id)}
                                className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
                                title="Upload / Edit Receipt"
                              >
                                <UploadCloud className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(record.id)}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                title="Delete service ticket"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
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

      {/* 6. ADMIN COMPLETE SERVICE & REPAIR DETAILS MODAL */}
      {completingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#101726] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Complete Service &amp; Repair</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {completingRecord.id}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Record final repair expenses, work performed, and attach receipt
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCompletingRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Asset & Employee Identity Strip */}
            <div className="px-5 py-3 bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/30 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Asset:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{completingRecord.assetNumber}</span>
                <span className="text-slate-500 dark:text-slate-400">({completingRecord.deviceName})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 dark:text-slate-400">Employee:</span>
                <span className="font-bold text-slate-900 dark:text-white">{completingRecord.employeeName}</span>
                <span className="font-mono text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                  {completingRecord.employeeId}
                </span>
              </div>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleCompleteSubmit} className="p-5 overflow-y-auto space-y-4">
              {/* Problem Reported Display */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Reported Issue ({completingRecord.problemCategory})
                </div>
                <div className="font-medium text-slate-800 dark:text-slate-200">
                  {completingRecord.problem}
                </div>
              </div>

              {/* Service Provider & Electric Shop Section */}
              <div className="p-3 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-500" />
                    <span>Service Provider / Electric Shop</span>
                  </span>
                  {serviceProviders.length > 0 && (
                    <select
                      onChange={e => handleCompletionProviderSelect(e.target.value)}
                      className="text-[11px] bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-800/60 rounded-md px-2 py-0.5 text-slate-700 dark:text-slate-300"
                    >
                      <option value="">Quick Pick Vendor...</option>
                      {serviceProviders.map(p => (
                        <option key={p.id} value={p.id}>{p.shopName} ({p.technicianName})</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                      Shop / Service Provider Name
                    </label>
                    <input
                      type="text"
                      value={completionShopName}
                      onChange={e => setCompletionShopName(e.target.value)}
                      placeholder="e.g. QuickFix Chip & Board Lab"
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                      Technician / Person Name
                    </label>
                    <input
                      type="text"
                      value={completionTechnicianName}
                      onChange={e => setCompletionTechnicianName(e.target.value)}
                      placeholder="e.g. Suresh Kumar"
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                    Contact Number / WhatsApp (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={completionPhone}
                      onChange={e => setCompletionPhone(e.target.value)}
                      placeholder="e.g. +91 98765-11223"
                      className="w-full pl-7 pr-2.5 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* 1. Repair / Service Amount (₹) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Repair / Service Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative rounded-xl shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={completionAmount}
                    onChange={e => setCompletionAmount(Number(e.target.value))}
                    placeholder="Enter total repair cost in INR (₹)"
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Enter ₹0 if covered by warranty or handled in-house with zero parts cost.
                </p>
              </div>

              {/* 2. What service or repair was performed */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  What Service or Repair Was Performed <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={completionWorkPerformed}
                  onChange={e => setCompletionWorkPerformed(e.target.value)}
                  placeholder="e.g. Replaced faulty membrane switch, updated USB transceiver firmware and tested input response"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* 3. Service / Repair Date & Parts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Service / Repair Date <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative rounded-xl shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <input
                      type="date"
                      required
                      value={completionDate}
                      onChange={e => setCompletionDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Parts Replaced / Installed
                  </label>
                  <input
                    type="text"
                    value={completionParts}
                    onChange={e => setCompletionParts(e.target.value)}
                    placeholder="e.g. Keycaps, New USB Dongle, or None"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              {/* 4. Receipt / Invoice Attachments (JPG, PNG, PDF) */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Vendor Invoice / Repair Receipt</span>
                  </label>
                  <span className="text-[10px] text-slate-400">(Optional Proof)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                      Bill / Invoice Number
                    </label>
                    <input
                      type="text"
                      value={completionReceiptNumber}
                      onChange={e => setCompletionReceiptNumber(e.target.value)}
                      placeholder="e.g. INV-2026-0044"
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                      Bill Date
                    </label>
                    <input
                      type="date"
                      value={completionReceiptDate}
                      onChange={e => setCompletionReceiptDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {!completionReceiptFileUrl ? (
                  <label className="border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-lg p-2.5 flex flex-col items-center justify-center cursor-pointer bg-white dark:bg-slate-900 transition-colors">
                    <input
                      ref={completionFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={handleCompletionFileChange}
                      className="hidden"
                    />
                    <UploadCloud className="w-4 h-4 text-emerald-500 mb-1" />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Click to upload invoice document (JPG, PNG, PDF)
                    </span>
                  </label>
                ) : (
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="truncate font-semibold text-slate-800 dark:text-slate-200">
                        {completionReceiptFileName}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCompletionFile}
                      className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                      title="Remove file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {completionReceiptError && (
                  <p className="text-[10px] text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{completionReceiptError}</span>
                  </p>
                )}
              </div>

              {/* 5. Service Notes / Resolution Details */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Service Notes / Resolution Details
                </label>
                <textarea
                  rows={2}
                  value={completionNotes}
                  onChange={e => setCompletionNotes(e.target.value)}
                  placeholder="Optional technician remarks, diagnostic notes or verification tests completed..."
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCompletingRecord(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Service as Done</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. SERVICE RECEIPT PREVIEW MODAL */}
      <ServiceReceiptPreviewModal
        isOpen={!!previewReceiptRecord}
        record={previewReceiptRecord}
        onClose={() => setPreviewReceiptRecord(null)}
        onOpenUpload={(id) => setUploadReceiptRecordId(id)}
      />

      {/* 8. UPLOAD / UPDATE SERVICE RECEIPT MODAL */}
      <UploadServiceReceiptModal
        isOpen={!!uploadReceiptRecordId}
        recordId={uploadReceiptRecordId}
        onClose={() => setUploadReceiptRecordId(null)}
      />
    </div>
  );
};
