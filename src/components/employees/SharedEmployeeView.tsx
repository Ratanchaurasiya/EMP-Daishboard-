import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { EmployeeAvatar } from '../common/EmployeeAvatar';
import { formatCurrency, formatDateDisplay } from '../../utils/formatters';
import {
  ShieldCheck,
  Laptop,
  Smartphone,
  Headphones,
  Wrench,
  Printer,
  Copy,
  Check,
  ExternalLink,
  Cpu,
  HardDrive,
  Activity,
  Calendar,
  Mail,
  Phone,
  Building,
  Briefcase,
  AlertTriangle,
  Lock,
  Layers,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

interface SharedEmployeeViewProps {
  employeeId?: string | null;
  onExit?: () => void;
}

export const SharedEmployeeView: React.FC<SharedEmployeeViewProps> = ({
  employeeId: propEmployeeId,
  onExit,
}) => {
  const { employees, computers, assets, serviceRecords, showToast } = useApp();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'computer' | 'phone' | 'peripherals' | 'services'>('overview');

  // Extract employeeId from URL hash first, fallback to props
  const effectiveId = useMemo(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const match = hash.match(/[?&]id=([^&]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    }
    if (propEmployeeId) return propEmployeeId;
    return null;
  }, [propEmployeeId]);

  const employee = useMemo(() => {
    if (!effectiveId) return null;
    return employees.find(
      e => e.id === effectiveId || e.employeeId.toLowerCase() === effectiveId.toLowerCase()
    ) || null;
  }, [employees, effectiveId]);

  const assignedComputer = useMemo(() => {
    if (!employee) return null;
    return computers.find(
      c => c.assignedEmployeeId === employee.id || c.assignedEmployeeId === employee.employeeId
    ) || null;
  }, [computers, employee]);

  const employeeAssets = useMemo(() => {
    if (!employee) return [];
    return assets.filter(
      a => a.assignedEmployeeId === employee.id || a.assignedEmployeeId === employee.employeeId
    );
  }, [assets, employee]);

  const assignedPhones = useMemo(() => {
    return employeeAssets.filter(a => a.assetType === 'Mobile Phone');
  }, [employeeAssets]);

  const assignedPeripherals = useMemo(() => {
    return employeeAssets.filter(a => a.assetType !== 'Mobile Phone' && a.assetType !== 'Laptop');
  }, [employeeAssets]);

  const employeeServices = useMemo(() => {
    if (!employee) return [];
    return serviceRecords
      .filter(
        s =>
          (assignedComputer && s.computerId === assignedComputer.id) ||
          (assignedComputer && s.assetNumber && assignedComputer.assetNumber.trim().toLowerCase() === s.assetNumber.trim().toLowerCase()) ||
          s.employeeId === employee.id ||
          s.employeeId === employee.employeeId ||
          employeeAssets.some(
            a => a.assetNumber && s.assetNumber && a.assetNumber.trim().toLowerCase() === s.assetNumber.trim().toLowerCase()
          )
      )
      .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime());
  }, [serviceRecords, employee, assignedComputer, employeeAssets]);

  const handleCopyCurrentLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      showToast('Share link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Please copy the URL from the browser bar.', 'info');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!employee) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 bg-white dark:bg-[#101726] rounded-2xl shadow-xl border border-slate-200 dark:border-[#1e293b] text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Employee Custody Record Not Found
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            The shared link might be expired or the employee identifier is invalid. Please request an updated share link from your IT Administrator.
          </p>
          <button
            onClick={() => {
              if (onExit) onExit();
              else window.location.hash = '#/dashboard';
            }}
            className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors cursor-pointer"
          >
            Go to Company Portal
          </button>
        </div>
      </div>
    );
  }

  const totalAssignedEquipmentCount =
    (assignedComputer ? 1 : 0) + assignedPhones.length + assignedPeripherals.length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 font-sans pb-12 print:bg-white print:text-black">
      {/* Top Direct Access Notification Banner (Screen Only) */}
      <div className="bg-indigo-600 text-white px-4 py-2.5 text-xs font-medium print:hidden shadow-xs">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span>
              <strong>Direct Staff View:</strong> Verified equipment custody record for {employee.name}. No sign-in required.
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] self-end sm:self-auto">
            <button
              onClick={handleCopyCurrentLink}
              className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer"
            >
              <Printer className="w-3 h-3" />
              <span>Print Custody Slip</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Document Header & Handover Title */}
        <div className="bg-white dark:bg-[#101726] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-[#1e293b] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:border-none print:shadow-none print:p-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Official Equipment Handover Record
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Ref: {employee.employeeId}-CUSTODY
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              IT Asset Allocation & Custody Dossier
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Departmental hardware allocation, workstation specifications, and serial tracking
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 print:hidden">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-[#0d131f] dark:hover:bg-slate-800 border border-slate-200 dark:border-[#1e293b] rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4 text-blue-500" />
              <span>Print / Export PDF</span>
            </button>

            {onExit && (
              <button
                onClick={onExit}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Admin Exit</span>
              </button>
            )}
          </div>
        </div>

        {/* Employee Primary Profile Card */}
        <div className="bg-white dark:bg-[#101726] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-[#1e293b] shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 pb-5 border-b border-slate-100 dark:border-[#1e293b]">
            <EmployeeAvatar
              name={employee.name}
              photoUrl={employee.photoUrl}
              size="lg"
            />

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                  {employee.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {employee.employeeId}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  employee.status === 'Active'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}>
                  {employee.status} Staff Member
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                  <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                  {employee.designation}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-purple-500" />
                  {employee.department} ({employee.team || 'Core'})
                </span>
              </div>
            </div>

            <div className="text-right shrink-0 hidden md:block">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Equipment Custody
              </div>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                {totalAssignedEquipmentCount} <span className="text-xs font-normal text-slate-500">Units</span>
              </div>
            </div>
          </div>

          {/* Quick Contact & Employment Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Corporate Email</span>
              <p className="font-mono text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                {employee.email}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Phone Number</span>
              <p className="font-mono text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                {employee.phone}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Joining Date</span>
              <p className="font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                {formatDateDisplay(employee.joiningDate)}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Company Ref #</span>
              <p className="font-mono text-slate-800 dark:text-slate-200">
                {employee.companyEmployeeNumber || `CORP-${employee.employeeId}`}
              </p>
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs (Screen Only) */}
        <div className="flex border-b border-slate-200 dark:border-[#1e293b] text-xs font-semibold gap-2 overflow-x-auto scrollbar-none print:hidden">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Equipment ({totalAssignedEquipmentCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('computer')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'computer'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Workstation / Laptop {assignedComputer ? '✓' : ''}</span>
          </button>

          <button
            onClick={() => setActiveTab('phone')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'phone'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Phone ({assignedPhones.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('peripherals')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'peripherals'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Peripherals ({assignedPeripherals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'services'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Service Logs ({employeeServices.length})</span>
          </button>
        </div>

        {/* 1. ASSIGNED WORKSTATION / LAPTOP SECTION */}
        {(activeTab === 'overview' || activeTab === 'computer') && (
          <div className="bg-white dark:bg-[#101726] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-[#1e293b] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e293b] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Primary Workstation / Computer Specifications
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Official enterprise compute device allocated to this custodian
                  </p>
                </div>
              </div>

              {assignedComputer && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {assignedComputer.condition} Condition
                </span>
              )}
            </div>

            {assignedComputer ? (
              <div className="space-y-4">
                {/* Core Device Header Card */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-slate-200/80 dark:border-[#1e293b] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Device Name</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">{assignedComputer.deviceName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Asset Tag</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">{assignedComputer.assetNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Hardware Make / Model</span>
                    <span className="font-bold text-slate-900 dark:text-white">{assignedComputer.manufacturer} {assignedComputer.model}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Serial Number</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">{assignedComputer.serialNumber}</span>
                  </div>
                </div>

                {/* Technical Specifications Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-[#0d131f]/70 border border-slate-200/60 dark:border-[#1e293b] space-y-1">
                    <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold text-[11px]">
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Processor (CPU)</span>
                    </div>
                    <div className="font-medium text-slate-800 dark:text-slate-200">{assignedComputer.processor.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{assignedComputer.processor.speed}</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-[#0d131f]/70 border border-slate-200/60 dark:border-[#1e293b] space-y-1">
                    <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-semibold text-[11px]">
                      <Activity className="w-3.5 h-3.5" />
                      <span>Installed Memory (RAM)</span>
                    </div>
                    <div className="font-medium text-slate-800 dark:text-slate-200">{assignedComputer.memory.installedRAM}</div>
                    <div className="text-[10px] text-slate-500 font-mono">Usable: {assignedComputer.memory.usableRAM}</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-[#0d131f]/70 border border-slate-200/60 dark:border-[#1e293b] space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                      <HardDrive className="w-3.5 h-3.5" />
                      <span>Storage Drive</span>
                    </div>
                    <div className="font-medium text-slate-800 dark:text-slate-200">{assignedComputer.storage.total} ({assignedComputer.storage.type})</div>
                    <div className="text-[10px] text-slate-500 font-mono">{assignedComputer.storage.free} free of {assignedComputer.storage.total}</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-[#0d131f]/70 border border-slate-200/60 dark:border-[#1e293b] space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                      <Laptop className="w-3.5 h-3.5" />
                      <span>Operating System</span>
                    </div>
                    <div className="font-medium text-slate-800 dark:text-slate-200">{assignedComputer.system.os}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{assignedComputer.system.processorArchitecture}</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-[#0d131f]/70 border border-slate-200/60 dark:border-[#1e293b] space-y-1">
                    <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Device ID</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate">{assignedComputer.system.deviceId}</div>
                    <div className="text-[10px] text-slate-500 font-mono">Product ID: {assignedComputer.system.productId}</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-[#0d131f]/70 border border-slate-200/60 dark:border-[#1e293b] space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-semibold text-[11px]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Assignment Date</span>
                    </div>
                    <div className="font-medium text-slate-800 dark:text-slate-200">{formatDateDisplay(assignedComputer.assignedDate)}</div>
                    <div className="text-[10px] text-slate-500">Status: {assignedComputer.status}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-dashed border-slate-300 dark:border-slate-800">
                <Laptop className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-medium">No dedicated laptop/workstation currently allocated to this employee.</p>
              </div>
            )}
          </div>
        )}

        {/* 2. ASSIGNED COMPANY PHONE SECTION */}
        {(activeTab === 'overview' || activeTab === 'phone') && (
          <div className="bg-white dark:bg-[#101726] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-[#1e293b] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e293b] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Company Mobile Devices ({assignedPhones.length})
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Handheld cellular hardware, IMEI registry, and active mobile assignments
                  </p>
                </div>
              </div>
            </div>

            {assignedPhones.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {assignedPhones.map(phone => (
                  <div
                    key={phone.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-slate-200/80 dark:border-[#1e293b] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {phone.deviceName || `${phone.brand} ${phone.model}`}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-pink-500/10 text-pink-500 border border-pink-500/20">
                        {phone.assetNumber}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 block">Brand & Model</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{phone.brand} {phone.model}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 block">Phone Number</span>
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{phone.phoneNumber || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 block">IMEI Number</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">{phone.imeiNumber || phone.serialNumber}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 block">Condition / Status</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{phone.condition} ({phone.status})</span>
                      </div>
                    </div>

                    {phone.assignedDate && (
                      <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                        <span>Issued: {formatDateDisplay(phone.assignedDate)}</span>
                        <span>{phone.remarks || 'Standard allocation'}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-dashed border-slate-300 dark:border-slate-800 text-xs">
                <Smartphone className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p>No company mobile device assigned to this employee.</p>
              </div>
            )}
          </div>
        )}

        {/* 3. ASSIGNED PERIPHERALS & GEAR SECTION */}
        {(activeTab === 'overview' || activeTab === 'peripherals') && (
          <div className="bg-white dark:bg-[#101726] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-[#1e293b] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e293b] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Assigned Peripherals & Hardware Gear ({assignedPeripherals.length})
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Mice, keyboards, headsets, and desktop accessory inventory
                  </p>
                </div>
              </div>
            </div>

            {assignedPeripherals.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                {assignedPeripherals.map(asset => (
                  <div
                    key={asset.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-slate-200/80 dark:border-[#1e293b] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {asset.assetType}
                      </span>
                      <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        {asset.assetNumber}
                      </span>
                    </div>

                    <div className="text-[11px] space-y-0.5">
                      <div className="text-slate-700 dark:text-slate-300 font-medium">
                        {asset.brand} {asset.model}
                      </div>
                      <div className="text-slate-500 font-mono text-[10px]">
                        SN: {asset.serialNumber || 'N/A'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                      <span>Condition: <strong className="text-slate-700 dark:text-slate-300">{asset.condition}</strong></span>
                      <span>{asset.assignedDate ? formatDateDisplay(asset.assignedDate) : 'Assigned'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-dashed border-slate-300 dark:border-slate-800 text-xs">
                <Headphones className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p>No peripheral devices assigned to this employee.</p>
              </div>
            )}
          </div>
        )}

        {/* 4. SERVICE & MAINTENANCE LOGS */}
        {(activeTab === 'overview' || activeTab === 'services') && (
          <div className="bg-white dark:bg-[#101726] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-[#1e293b] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e293b] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Service & Maintenance Records ({employeeServices.length})
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Lifecycle servicing, repairs, and technical maintenance events
                  </p>
                </div>
              </div>
            </div>

            {employeeServices.length > 0 ? (
              <div className="space-y-2.5 text-xs">
                {employeeServices.map(service => (
                  <div
                    key={service.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-slate-200/80 dark:border-[#1e293b] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {service.problem}
                        </span>
                        <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {service.serviceStatus}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {service.workPerformed}
                      </p>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span>Technician: {service.technician}</span>
                        <span>•</span>
                        <span>Asset: {service.assetNumber}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(service.serviceCost)}
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {formatDateDisplay(service.serviceDate)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-dashed border-slate-300 dark:border-slate-800 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mx-auto mb-2" />
                <p>No maintenance tickets or repair incidents recorded. All equipment is fully functional.</p>
              </div>
            )}
          </div>
        )}

        {/* 5. FORMAL CUSTODY ACKNOWLEDGEMENT & PRINT SIGN-OFF */}
        <div className="bg-white dark:bg-[#101726] rounded-2xl p-6 border border-slate-200/80 dark:border-[#1e293b] shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Equipment Custody & Policy Acknowledgment</span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            All listed computing assets, mobile devices, and peripherals remain company property and are issued to <strong>{employee.name}</strong> ({employee.employeeId}) for official business duties. The custodian agrees to maintain the equipment in good condition and immediately report any loss, damage, or malfunction to IT Asset Administration.
          </p>

          {/* Signature Block for Print */}
          <div className="pt-6 grid grid-cols-2 gap-8 border-t border-slate-100 dark:border-[#1e293b] text-xs">
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Employee Custodian Signature
              </span>
              <div className="h-10 border-b border-slate-300 dark:border-slate-700" />
              <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                {employee.name} • Date: {new Date().toISOString().slice(0, 10)}
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                IT Administrator Verification
              </span>
              <div className="h-10 border-b border-slate-300 dark:border-slate-700" />
              <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                IT Asset Fleet Desk • Verified Official
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
