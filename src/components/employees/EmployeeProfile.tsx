import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateComputerServiceSummary } from '../../utils/calculations';
import { formatCurrency, formatDateDisplay, maskSensitive } from '../../utils/formatters';
import {
  AssetStatusBadge,
  ConditionBadge,
  EmployeeStatusBadge,
  ProblemCategoryBadge,
  ServiceStatusBadge,
} from '../common/Badge';
import { EmployeeAvatar } from '../common/EmployeeAvatar';
import {
  Mail,
  Phone,
  Calendar,
  Layers,
  Cpu,
  CircuitBoard,
  Shield,
  ShieldAlert,
  Wrench,
  Clock,
  ArrowLeft,
  Copy,
  Check,
  Plus,
  RotateCcw,
  Info,
  Laptop,
  Smartphone,
  Pencil,
  Lock,
  UserX,
  Trash2,
  UserMinus,
  Share2,
  Building2,
  FileText,
  Eye,
} from 'lucide-react';
import { AssetEditModal } from '../assets/AssetEditModal';
import { ComputerAssignModal } from '../computers/ComputerAssignModal';
import { EditComputerModal } from '../computers/EditComputerModal';
import { EditEmployeeModal } from './EditEmployeeModal';
import { RemoveEmployeeModal } from './RemoveEmployeeModal';
import { DeactivateEmployeeModal } from './DeactivateEmployeeModal';
import { UnassignCustodianModal } from '../common/UnassignCustodianModal';
import { ShareEmployeeModal } from './ShareEmployeeModal';
import { EmployeeWeeklyPhotoSection } from '../documentation/EmployeeWeeklyPhotoSection';
import { getEmployeeAssignedCompanyAssets, UnifiedAssignedAsset } from '../../utils/assetUtils';
import { SimCard, ServiceRecord } from '../../types';
import { getSimStatusStyle, getSimPurposeStyle, calculateSimMonthlyExpense, formatINR } from '../../utils/simUtils';
import { AddEditSimModal } from '../sim/AddEditSimModal';
import { SuspendSimModal } from '../sim/SuspendSimModal';
import { RequestSimModal } from '../sim/RequestSimModal';
import { AddRechargeModal } from '../sim/AddRechargeModal';
import { AssignSimModal } from '../sim/AssignSimModal';
import { ServiceReceiptPreviewModal } from '../services/ServiceReceiptPreviewModal';

interface EmployeeProfileProps {
  employeeId: string;
  onBack: () => void;
  onOpenAssignAsset?: (employeeId: string) => void;
  onOpenReturnAsset?: (assetId: string) => void;
  onOpenAddService?: (computerId: string) => void;
}

export const EmployeeProfile: React.FC<EmployeeProfileProps> = ({
  employeeId,
  onBack,
  onOpenAssignAsset,
  onOpenReturnAsset,
  onOpenAddService,
}) => {
  const {
    employees,
    computers,
    assets,
    serviceRecords,
    simCards,
    userRole,
    currentUser,
    showToast,
    updateEmployee,
    reactivateEmployee,
    assignComputerToEmployee,
    returnAsset,
    reactivateSimCard,
    assignSimCard,
    unassignSimCard,
  } = useApp();

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [editingComputerId, setEditingComputerId] = useState<string | null>(null);
  const [showComputerAssignModal, setShowComputerAssignModal] = useState<boolean>(false);
  const [showEditEmployeeModal, setShowEditEmployeeModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showRemoveModal, setShowRemoveModal] = useState<boolean>(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState<boolean>(false);

  // SIM Modal States
  const [showAddSimModal, setShowAddSimModal] = useState<boolean>(false);
  const [showAssignSimModal, setShowAssignSimModal] = useState<boolean>(false);
  const [editingSim, setEditingSim] = useState<SimCard | null>(null);
  const [suspendingSim, setSuspendingSim] = useState<SimCard | null>(null);
  const [showRequestSimModal, setShowRequestSimModal] = useState<boolean>(false);
  const [rechargeSim, setRechargeSim] = useState<SimCard | null>(null);
  const [previewReceiptRecord, setPreviewReceiptRecord] = useState<ServiceRecord | null>(null);
  const [unassignTarget, setUnassignTarget] = useState<{
    id: string;
    entityType: 'Computer' | 'Mobile Phone' | 'Peripheral Asset';
    assetNumber: string;
    deviceName: string;
    employeeName: string;
    employeeId: string;
  } | null>(null);

  const handleConfirmUnassign = (condition: any, remarks: string) => {
    if (!unassignTarget) return;
    if (unassignTarget.entityType === 'Computer') {
      assignComputerToEmployee(
        unassignTarget.id,
        null,
        new Date().toISOString().substring(0, 10),
        condition,
        remarks
      );
      showToast(`Workstation ${unassignTarget.assetNumber} removed from ${unassignTarget.employeeName} & returned to fleet`, 'success');
    } else {
      returnAsset(
        unassignTarget.id,
        new Date().toISOString().substring(0, 10),
        condition,
        'IT Admin',
        'Available',
        remarks
      );
      showToast(`${unassignTarget.entityType} ${unassignTarget.assetNumber} removed from ${unassignTarget.employeeName} & returned to fleet`, 'success');
    }
    setUnassignTarget(null);
  };

  const employee = employees.find(e => e.id === employeeId || e.employeeId === employeeId);

  const isSelfOrAdmin = Boolean(
    userRole === 'admin' ||
    (currentUser?.role === 'employee' &&
      employee &&
      (currentUser.id === employee.id ||
        currentUser.employeeId === employee.employeeId ||
        (currentUser.email && employee.email && currentUser.email.toLowerCase() === employee.email.toLowerCase())))
  );

  const handlePhotoChange = (newPhotoUrl: string) => {
    if (!isSelfOrAdmin) {
      showToast('Unauthorized: You can only update your own profile photo.', 'error');
      return;
    }
    if (employee) {
      updateEmployee(employee.id, { photoUrl: newPhotoUrl });
      showToast(`Updated profile photo & biometric face reference for ${employee.name}`, 'success');
    }
  };

  const handlePhotoRemove = () => {
    if (!isSelfOrAdmin) {
      showToast('Unauthorized: You can only update your own profile photo.', 'error');
      return;
    }
    if (employee) {
      updateEmployee(employee.id, { photoUrl: undefined });
      showToast(`Removed custom photo for ${employee.name}`, 'info');
    }
  };

  if (!employee) {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#101726] rounded-xl border border-slate-200 dark:border-slate-800">
        <p className="text-slate-500 mb-4 text-xs">Employee record not found.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg"
        >
          Return to Directory
        </button>
      </div>
    );
  }

  const assignedComputer = computers.find(
    c => c.assignedEmployeeId === employee.id || c.assignedEmployeeId === employee.employeeId
  );
  const assignedAssets = assets.filter(
    a => a.assignedEmployeeId === employee.id || a.assignedEmployeeId === employee.employeeId
  );
  const employeeSims = simCards.filter(
    s =>
      s.assignedEmployeeId === employee.id ||
      s.assignedEmployeeId === employee.employeeId ||
      (s.assignedEmployeeName && s.assignedEmployeeName.trim().toLowerCase() === employee.name.trim().toLowerCase())
  );
  const unifiedCompanyAssets = getEmployeeAssignedCompanyAssets(employee, assignedComputer, assets);
  const assignedPhones = assignedAssets.filter(a => a.assetType === 'Mobile Phone');
  const computerServices = assignedComputer
    ? serviceRecords
        .filter(
          s =>
            s.computerId === assignedComputer.id ||
            s.employeeId === employee.id ||
            s.employeeId === employee.employeeId
        )
        .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime())
    : serviceRecords
        .filter(
          s => s.employeeId === employee.id || s.employeeId === employee.employeeId
        )
        .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime());

  const serviceSummary = assignedComputer
    ? calculateComputerServiceSummary(assignedComputer.id, serviceRecords)
    : null;

  const isAdmin = userRole === 'admin';

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast(`Copied ${fieldName} to clipboard`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* Top Navigation & Action Toolbar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <button
              onClick={() => setShowEditEmployeeModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Edit employee joining date, role, department and contact details"
            >
              <Pencil className="w-3.5 h-3.5 text-blue-500" />
              <span>Edit Details & Date</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setShowShareModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 border border-indigo-200/80 dark:border-indigo-800/80 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Share complete employee profile and equipment details directly with employee without requiring login"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Share Employee Data</span>
            </button>
          )}

          {isAdmin && employee.status === 'Active' && (
            <button
              onClick={() => setShowDeactivateModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 border border-amber-300/60 dark:border-amber-800/60 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Deactivate employee account (safe, preserves all assets and history)"
            >
              <UserX className="w-3.5 h-3.5 text-amber-500" />
              <span>Deactivate</span>
            </button>
          )}

          {isAdmin && (employee.status === 'Inactive' || employee.status === 'Resigned') && (
            <button
              onClick={() => reactivateEmployee(employee.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-300/60 dark:border-emerald-800/60 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Restore / Reactivate this employee account"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-500" />
              <span>Restore / Reactivate</span>
            </button>
          )}

          {isAdmin && assignedComputer && onOpenAddService && (
            <button
              onClick={() => onOpenAddService(assignedComputer.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-xs transition-colors"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Log Service Ticket</span>
            </button>
          )}

          {isAdmin && onOpenAssignAsset && (
            <button
              onClick={() => onOpenAssignAsset(employee.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign Asset</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setShowRemoveModal(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-900/60 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Permanently remove all data for this employee"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Employee Data</span>
            </button>
          )}
        </div>
      </div>

      {/* Deactivated Notice Banner */}
      {(employee.status === 'Inactive' || employee.status === 'Resigned') && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-3 text-xs animate-fade-in">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
              <UserX className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white">
                  Deactivated Employee Record ({employee.status})
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono">
                  System Access Revoked
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                This employee account is deactivated. Portal login access is revoked, while all historical workstation allocations, peripheral assets, and maintenance records remain safely preserved.
              </p>
            </div>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => reactivateEmployee(employee.id)}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Account</span>
            </button>
          )}
        </div>
      )}

      {/* 1. EMPLOYEE PROFILE HEADER CARD */}
      <div className="p-5 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-4">
            <EmployeeAvatar
              name={employee.name}
              photoUrl={employee.photoUrl}
              size="2xl"
              status={employee.status}
              showStatusDot={true}
              editable={isSelfOrAdmin}
              onPhotoChange={handlePhotoChange}
              onPhotoRemove={handlePhotoRemove}
            />

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {employee.name}
                </h2>
                <EmployeeStatusBadge status={employee.status} size="sm" />
              </div>
              <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-0.5">
                {employee.designation} • {employee.department}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Team: <span className="font-semibold text-slate-700 dark:text-slate-300">{employee.team}</span>
              </div>
            </div>
          </div>

          {/* Employee IDs */}
          <div className="flex items-center gap-3 text-xs bg-slate-50 dark:bg-slate-900/70 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-0.5">
                Employee ID
              </span>
              <strong className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 inline-block">
                {employee.employeeId}
              </strong>
            </div>
            <div className="h-7 w-px bg-slate-200 dark:bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-0.5">
                Company Number
              </span>
              <strong className="font-mono text-xs font-bold text-slate-900 dark:text-white inline-block">
                {employee.companyEmployeeNumber}
              </strong>
            </div>
          </div>
        </div>

        {/* Contact Metadata (STRICTLY ZERO LOCATION) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-0.5">
              Company Email
            </span>
            <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200 truncate">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{employee.email}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-0.5">
              Company Phone
            </span>
            <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200 font-mono">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{employee.phone}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/80 group relative">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Joining Date
              </span>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowEditEmployeeModal(true)}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 font-semibold cursor-pointer"
                  title="Edit Joining Date"
                >
                  <Pencil className="w-2.5 h-2.5" />
                  <span>Edit</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{formatDateDisplay(employee.joiningDate)}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-0.5">
              Remarks
            </span>
            <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 truncate">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{employee.remarks || 'Standard allocation'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ASSIGNED COMPANY ASSETS TABLE (Laptops, Monitors, Phones, Peripherals & Equipment) */}
      <div className="bg-white dark:bg-[#101726] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <span>Assigned Company Assets & Peripherals</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                {unifiedCompanyAssets.length}
              </span>
            </h3>
            <span className="text-[11px] text-slate-400 font-normal ml-1 hidden sm:inline">
              • Laptop/PC, Mobile Phone, Keyboard, Mouse, Headset & Peripherals
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin ? (
              onOpenAssignAsset && (
                <button
                  type="button"
                  onClick={() => onOpenAssignAsset(employee.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs transition-colors cursor-pointer"
                  title="Add and provision company asset with date and details"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Asset</span>
                </button>
              )
            ) : (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700/60"
                title="Only IT Administrator has permissions to add or change company assets"
              >
                <Lock className="w-3 h-3 text-amber-500" />
                <span>Only Admin Can Change</span>
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Asset</th>
                <th className="py-2.5 px-4 font-semibold">Asset No.</th>
                <th className="py-2.5 px-4 font-semibold">Brand & Model</th>
                <th className="py-2.5 px-4 font-semibold">Serial / IMEI</th>
                <th className="py-2.5 px-4 font-semibold">Assigned Date</th>
                <th className="py-2.5 px-4 font-semibold">Condition</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
              {unifiedCompanyAssets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p>No company assets currently provisioned to this employee.</p>
                      {isAdmin && onOpenAssignAsset && (
                        <button
                          type="button"
                          onClick={() => onOpenAssignAsset(employee.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Provision First Asset (Admin)</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                unifiedCompanyAssets.map(asset => (
                  <tr key={asset.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-base leading-none">
                          {asset.assetType === 'Laptop'
                            ? '💻'
                            : asset.assetType === 'Desktop'
                            ? '🖥️'
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
                          <span className="font-semibold text-slate-900 dark:text-white block">
                            {asset.assetType}
                          </span>
                          {asset.specPill && (
                            <span className="text-[10px] text-slate-400 font-normal">
                              {asset.specPill}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {asset.assetNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800 dark:text-slate-200 font-medium">
                        {asset.brand} {asset.model}
                      </div>
                      {asset.isPhone && asset.phoneNumber && (
                        <div className="text-[11px] text-pink-600 dark:text-pink-400 font-mono font-medium mt-0.5">
                          📞 {asset.phoneNumber}
                        </div>
                      )}
                      {asset.deviceName && asset.deviceName !== `${asset.brand} ${asset.model}` && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          Device: {asset.deviceName}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                      {asset.imeiNumber ? (
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase mr-1">IMEI:</span>
                          <span>{asset.imeiNumber}</span>
                        </div>
                      ) : (
                        asset.serialNumber
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {formatDateDisplay(asset.assignedDate)}
                    </td>
                    <td className="py-3 px-4">
                      <ConditionBadge condition={asset.condition} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <AssetStatusBadge status={asset.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isAdmin ? (
                        <div className="flex items-center justify-end gap-1.5">
                          {asset.originalAssetId ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setEditingAssetId(asset.originalAssetId!)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md transition-colors cursor-pointer"
                                title="Admin Change: Edit asset date, condition, status, specs"
                              >
                                <Pencil className="w-3 h-3" />
                                <span>Change</span>
                              </button>

                              {asset.status === 'Assigned' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setUnassignTarget({
                                      id: asset.originalAssetId!,
                                      entityType: 'Peripheral Asset',
                                      assetNumber: asset.assetNumber,
                                      deviceName: `${asset.brand} ${asset.model} (${asset.assetType})`,
                                      employeeName: employee.name,
                                      employeeId: employee.employeeId,
                                    })
                                  }
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 rounded-md transition-colors cursor-pointer"
                                  title="Remove this asset from employee"
                                >
                                  <UserMinus className="w-3 h-3" />
                                  <span>Remove Asset</span>
                                </button>
                              )}

                              {onOpenReturnAsset && asset.status === 'Assigned' && (
                                <button
                                  type="button"
                                  onClick={() => onOpenReturnAsset(asset.originalAssetId!)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-md transition-colors cursor-pointer"
                                  title="Admin Return: Check-in hardware with return date"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Return</span>
                                </button>
                              )}
                            </>
                          ) : asset.originalComputerId ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setEditingComputerId(asset.originalComputerId!)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md transition-colors cursor-pointer"
                                title="Edit computer specs"
                              >
                                <Pencil className="w-3 h-3" />
                                <span>Edit Specs</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowComputerAssignModal(true)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-md transition-colors cursor-pointer"
                                title="Change or reassign computer"
                              >
                                <span>Reassign</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setUnassignTarget({
                                    id: asset.originalComputerId!,
                                    entityType: 'Computer',
                                    assetNumber: asset.assetNumber,
                                    deviceName: `${asset.deviceName || asset.brand} (${asset.assetType})`,
                                    employeeName: employee.name,
                                    employeeId: employee.employeeId,
                                  })
                                }
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 rounded-md transition-colors cursor-pointer"
                                title="Remove this workstation asset from employee"
                              >
                                <UserMinus className="w-3 h-3" />
                                <span>Remove Asset</span>
                              </button>
                            </>
                          ) : (
                            onOpenAssignAsset && (
                              <button
                                type="button"
                                onClick={() => onOpenAssignAsset(employee.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md transition-colors cursor-pointer"
                                title="Custom provision asset"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Provision Custom</span>
                              </button>
                            )
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 italic">
                          <Lock className="w-2.5 h-2.5" />
                          <span>View-only</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2.5 ASSIGNED SIM CARDS & CONTACT NUMBERS (Requirement 2 & Add +) */}
      {(() => {
        const empSimExpense = calculateSimMonthlyExpense(employeeSims.length);
        return (
          <div className="bg-white dark:bg-[#101726] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-emerald-500/5 to-transparent">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Assigned SIM Cards & Mobile Fleet
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono border border-emerald-500/30">
                      Total SIMs: {employeeSims.length}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 font-mono border border-blue-500/30">
                      Total Monthly SIM Expense: {formatINR(empSimExpense.totalExpense)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {employee.name} — {employeeSims.length} {employeeSims.length === 1 ? 'SIM Card' : 'SIM Cards'} assigned • Base: {formatINR(empSimExpense.baseRecharge)} | GST (18%): {formatINR(empSimExpense.gstAmount)} | Total: {formatINR(empSimExpense.totalExpense)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => setShowAssignSimModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-lg shadow-sm transition-all cursor-pointer"
                    title="Click Add + to assign another SIM or contact number to this employee"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add +</span>
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => setShowRequestSimModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer"
                  title="Request an additional SIM card or submit a SIM requisition"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Request Additional SIM</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Contact / Mobile No.</th>
                    <th className="py-2.5 px-4 font-semibold">Purpose</th>
                    <th className="py-2.5 px-4 font-semibold">Project</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold">Monthly Recharge Cost</th>
                    <th className="py-2.5 px-4 font-semibold">Allocation Date</th>
                    <th className="py-2.5 px-4 font-semibold">Carrier / SIM</th>
                    <th className="py-2.5 px-4 font-semibold">Remarks</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                  {employeeSims.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Smartphone className="w-8 h-8 text-slate-300 dark:text-slate-700 stroke-1" />
                          <p className="text-xs">No SIM cards or contact numbers currently assigned to {employee.name}.</p>
                          {isAdmin ? (
                            <button
                              type="button"
                              onClick={() => setShowAssignSimModal(true)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Assign First SIM (Admin)</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowRequestSimModal(true)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Submit Additional SIM Request</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    employeeSims.map(sim => (
                      <tr key={sim.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">📱</span>
                            <span>{sim.contactNumber}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getSimPurposeStyle(sim.purpose)}`}>
                            {sim.purpose === 'Other' && sim.customPurpose ? `Other (${sim.customPurpose})` : sim.purpose}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                          {sim.project ? (
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                              📁 {sim.project}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getSimStatusStyle(sim.status)}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sim.status === 'Active' ? 'bg-emerald-500' : sim.status === 'Suspended' ? 'bg-rose-500' : 'bg-blue-500'}`} />
                            <span>{sim.status}</span>
                          </span>
                        </td>
                        {/* Monthly Recharge Breakdown */}
                        <td className="py-3 px-4 text-[11px]">
                          <div className="space-y-0.5 font-mono">
                            <div className="text-slate-900 dark:text-white font-bold">
                              Total: ₹470.82
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Recharge: ₹399.00 + GST (18%): ₹71.82
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300 text-[11px]">
                          {sim.issueDate ? formatDateDisplay(sim.issueDate) : '—'}
                        </td>
                        <td className="py-3 px-4 text-[11px]">
                          <span className="text-slate-800 dark:text-slate-200 font-medium">{sim.carrier || 'Standard'}</span>
                          {sim.simNumber && <p className="text-[10px] text-slate-400 font-mono">ICCID: {sim.simNumber}</p>}
                        </td>
                        <td className="py-3 px-4 text-[11px] text-slate-500 dark:text-slate-400 max-w-xs truncate">
                          {sim.status === 'Suspended' && sim.suspensionReason ? (
                            <span className="text-rose-600 dark:text-rose-400 font-medium">
                              Reason: {sim.suspensionReason}
                            </span>
                          ) : (
                            sim.remarks || '—'
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isAdmin ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setRechargeSim(sim)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md transition-colors cursor-pointer"
                                  title="Add Recharge record for this SIM"
                                >
                                  <span>+ Recharge</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingSim(sim);
                                    setShowAddSimModal(true);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md transition-colors cursor-pointer"
                                  title="Edit SIM details and purpose"
                                >
                                  <Pencil className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to release SIM ${sim.contactNumber} from ${employee.name} back to Available buffer?`)) {
                                      unassignSimCard(sim.id, `Released from ${employee.name}'s profile`);
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-md transition-colors cursor-pointer"
                                  title="Release / Unassign SIM back to inventory buffer"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Release</span>
                                </button>
                                {sim.status === 'Active' ? (
                                  <button
                                    type="button"
                                    onClick={() => setSuspendingSim(sim)}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer"
                                    title="Suspend this SIM (Mandatory reason required)"
                                  >
                                    <span>Suspend</span>
                                  </button>
                                ) : sim.status === 'Suspended' ? (
                                  <button
                                    type="button"
                                    onClick={() => reactivateSimCard(sim.id)}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md transition-colors cursor-pointer"
                                    title="Reactivate this SIM"
                                  >
                                    <span>Reactivate</span>
                                  </button>
                                ) : null}
                              </>
                            ) : (
                              sim.status === 'Active' && (
                                <button
                                  type="button"
                                  onClick={() => setSuspendingSim(sim)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer"
                                  title="Submit Suspension Request for this SIM"
                                >
                                  <span>Request Suspension</span>
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* 3. WINDOWS "ABOUT" SPECIFICATIONS SHEET */}
      <div className="bg-white dark:bg-[#101726] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CircuitBoard className="w-4 h-4 text-blue-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Assigned Computer Specifications
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {assignedComputer && <AssetStatusBadge status={assignedComputer.status} size="sm" />}
            {assignedComputer && isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setEditingComputerId(assignedComputer.id)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  title="Edit hardware specifications (Processor, RAM, Storage, OS, Serial) - automatically synchronizes with Hardware Fleet"
                >
                  <Pencil className="w-3 h-3 text-blue-500" />
                  <span>Edit Specs</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setUnassignTarget({
                      id: assignedComputer.id,
                      entityType: 'Computer',
                      assetNumber: assignedComputer.assetNumber,
                      deviceName: `${assignedComputer.deviceName} (${assignedComputer.manufacturer} ${assignedComputer.model})`,
                      employeeName: employee.name,
                      employeeId: employee.employeeId,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/60 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  title="Remove this workstation from the employee"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                  <span>Remove Device</span>
                </button>
              </>
            )}
            {isAdmin ? (
              <button
                type="button"
                onClick={() => setShowComputerAssignModal(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs transition-colors cursor-pointer"
                title="Admin Change: Assign or change computer with date and condition"
              >
                <Pencil className="w-3 h-3" />
                <span>{assignedComputer ? 'Change Computer' : 'Assign Computer'}</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200/60 dark:border-slate-700/60">
                <Lock className="w-2.5 h-2.5 text-slate-400" />
                <span>Only Admin Can Change</span>
              </span>
            )}
          </div>
        </div>

        {assignedComputer ? (
          <div className="p-5 space-y-4 text-xs">
            {/* Device Identity Header Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Device Name
                </span>
                <span className="font-mono font-bold text-xs text-slate-900 dark:text-white block mt-0.5">
                  {assignedComputer.deviceName}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Make & Model
                </span>
                <span className="font-semibold text-xs text-slate-900 dark:text-white block mt-0.5">
                  {assignedComputer.manufacturer} {assignedComputer.model}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Asset Number
                </span>
                <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 block mt-0.5">
                  {assignedComputer.assetNumber}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Serial Number
                </span>
                <span className="font-mono text-xs text-slate-700 dark:text-slate-300 block mt-0.5 truncate">
                  {assignedComputer.serialNumber}
                </span>
              </div>
            </div>

            {/* Hardware Metrics Row (CPU, RAM, GPU) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-lg bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                  <Cpu className="w-3.5 h-3.5 text-blue-500" />
                  <span>Processor</span>
                </div>
                <div className="font-medium text-slate-800 dark:text-slate-200 leading-snug">
                  {assignedComputer.processor?.name || 'Standard Processor'}
                </div>
                <div className="text-[10px] text-slate-400 pt-1">
                  Speed: {assignedComputer.processor?.speed || '2.4 GHz'}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                  <CircuitBoard className="w-3.5 h-3.5 text-emerald-500" />
                  <span>System Memory</span>
                </div>
                <div className="text-base font-black text-slate-900 dark:text-white font-mono">
                  {assignedComputer.memory?.installedRAM || '8 GB'}
                </div>
                <div className="text-[10px] text-slate-400 pt-1">
                  Usable: {assignedComputer.memory?.usableRAM || assignedComputer.memory?.installedRAM || '8 GB'}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                  <Layers className="w-3.5 h-3.5 text-purple-500" />
                  <span>Graphics Subsystem</span>
                </div>
                <div className="font-medium text-slate-800 dark:text-slate-200 leading-snug">
                  {assignedComputer.graphics?.card || 'Integrated Graphics'}
                </div>
                <div className="text-[10px] text-slate-400 pt-1">
                  Video RAM: {assignedComputer.graphics?.memory || 'Shared'}
                </div>
              </div>
            </div>

            {/* Operating System & Architecture */}
            <div className="p-3.5 rounded-lg bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Operating System & System Architecture
              </span>
              <div className="font-bold text-slate-900 dark:text-white text-xs">
                {assignedComputer.system?.os || 'Windows 11 Enterprise'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {assignedComputer.system?.systemType || '64-bit OS'} ({assignedComputer.system?.processorArchitecture || 'x64'}) • Pen & Touch: {assignedComputer.system?.penAndTouch || 'Not supported'}
              </div>
            </div>

            {/* RESTRICTED SECURITY SECTION: Device ID & Product ID */}
            <div
              className={`p-3.5 rounded-lg border transition-all ${
                isAdmin
                  ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                  : 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                  {isAdmin ? <Shield className="w-3.5 h-3.5 text-blue-500" /> : <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />}
                  <span>Windows Hardware Identifiers</span>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    isAdmin
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {isAdmin ? 'Authorized Admin Access' : 'Restricted Security Boundary'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Device ID
                  </span>
                  <div className="flex items-center justify-between p-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 font-mono text-xs">
                    <span className={isAdmin ? 'font-semibold text-slate-800 dark:text-slate-200' : 'text-slate-400 italic text-[11px]'}>
                      {maskSensitive(assignedComputer.system?.deviceId || 'DEV-N/A', isAdmin)}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleCopy(assignedComputer.system?.deviceId || '', 'Device ID')}
                        className="p-1 text-slate-400 hover:text-slate-600"
                        title="Copy Device ID"
                      >
                        {copiedField === 'Device ID' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Product ID
                  </span>
                  <div className="flex items-center justify-between p-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 font-mono text-xs">
                    <span className={isAdmin ? 'font-semibold text-slate-800 dark:text-slate-200' : 'text-slate-400 italic text-[11px]'}>
                      {maskSensitive(assignedComputer.system?.productId || 'PRD-N/A', isAdmin)}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleCopy(assignedComputer.system?.productId || '', 'Product ID')}
                        className="p-1 text-slate-400 hover:text-slate-600"
                        title="Copy Product ID"
                      >
                        {copiedField === 'Product ID' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <p>No computer unit currently assigned to this employee.</p>
            {isAdmin ? (
              <button
                type="button"
                onClick={() => setShowComputerAssignModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Assign Computer (Admin)</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 italic">
                Only IT Administrator has permissions to assign computers.
              </span>
            )}
          </div>
        )}
      </div>

      {/* 4. AUTOMATIC SERVICE SUMMARY */}
      {serviceSummary && (
        <div className="p-5 rounded-xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Maintenance & Diagnostic Summary
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Calculated Automatically</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Services</span>
              <span className="text-xl font-black text-slate-900 dark:text-white block mt-0.5 font-mono">
                {serviceSummary.totalServices}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Last Service Date</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white block mt-1 font-mono">
                {serviceSummary.lastServiceDate || 'Never'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Repair Cost</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 block mt-0.5 font-mono">
                {formatCurrency(serviceSummary.totalRepairCost)}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Most Common Issue</span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mt-1 truncate">
                {serviceSummary.mostCommonProblem}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. WEEKLY ASSET PHOTO DOCUMENTATION & AUDIT HISTORY */}
      <EmployeeWeeklyPhotoSection employeeId={employee.id} employeeName={employee.name} />

      {/* 6. SERVICE TIMELINE (Chronological Order) */}
      <div className="bg-white dark:bg-[#101726] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Chronological Service Timeline ({computerServices.length})
            </h3>
          </div>
        </div>

        <div className="p-5">
          {computerServices.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No historical service tickets recorded for this workstation.
            </div>
          ) : (
            <div className="relative pl-5 border-l border-slate-200 dark:border-slate-800 space-y-4 text-xs">
              {computerServices.map(service => (
                <div key={service.id} className="relative group">
                  <span className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 ring-4 ring-white dark:ring-[#101726]" />

                  <div className="p-3.5 rounded-lg bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {service.id}
                        </span>
                        <ProblemCategoryBadge category={service.problemCategory} />
                        <ServiceStatusBadge status={service.serviceStatus} size="sm" />
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-slate-500 dark:text-slate-400">
                          {formatDateDisplay(service.serviceDate)}
                        </span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(service.serviceCost)}
                        </span>
                      </div>
                    </div>

                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {service.problem}
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {service.workPerformed}
                    </p>

                    {service.serviceProviderShopName && (
                      <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 text-[11px]">
                        <div className="flex items-center gap-1.5 font-semibold text-blue-700 dark:text-blue-300">
                          <Building2 className="w-3.5 h-3.5 text-blue-500" />
                          <span>Shop: {service.serviceProviderShopName}</span>
                        </div>
                        {service.serviceProviderPhone && (
                          <a
                            href={`https://wa.me/${service.serviceProviderPhone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                            title="Chat on WhatsApp"
                          >
                            <Phone className="w-3 h-3" />
                            <span>+91 {service.serviceProviderPhone}</span>
                          </a>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-200/50 dark:border-slate-800">
                      <span>Parts: {service.partsReplaced}</span>
                      <span>Tech: {service.technician}</span>
                      {service.receiptFileUrl && (
                        <button
                          type="button"
                          onClick={() => setPreviewReceiptRecord(service)}
                          className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                          title="View service receipt"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Receipt Attached</span>
                          <Eye className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {service.resolution && (
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                        <strong>Resolution:</strong> {service.resolution}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals for Admin Modifications */}
      {editingAssetId && (
        <AssetEditModal
          isOpen={!!editingAssetId}
          onClose={() => setEditingAssetId(null)}
          assetId={editingAssetId}
        />
      )}

      {showComputerAssignModal && (
        <ComputerAssignModal
          isOpen={showComputerAssignModal}
          onClose={() => setShowComputerAssignModal(false)}
          employeeId={employee.id}
        />
      )}

      {editingComputerId && (
        <EditComputerModal
          isOpen={!!editingComputerId}
          onClose={() => setEditingComputerId(null)}
          computerId={editingComputerId}
        />
      )}

      {showEditEmployeeModal && (
        <EditEmployeeModal
          isOpen={showEditEmployeeModal}
          onClose={() => setShowEditEmployeeModal(false)}
          employeeId={employee.id}
        />
      )}

      {showShareModal && (
        <ShareEmployeeModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          employee={employee}
          assignedComputer={assignedComputer}
          assignedAssets={assignedAssets}
        />
      )}

      {showDeactivateModal && (
        <DeactivateEmployeeModal
          isOpen={showDeactivateModal}
          onClose={() => setShowDeactivateModal(false)}
          employeeId={employee.id}
        />
      )}

      {showRemoveModal && (
        <RemoveEmployeeModal
          isOpen={showRemoveModal}
          onClose={() => setShowRemoveModal(false)}
          employeeId={employee.id}
          onRemoved={onBack}
        />
      )}

      {/* Confirmation Dialog: Remove / Unassign Device */}
      {unassignTarget && (
        <UnassignCustodianModal
          isOpen={!!unassignTarget}
          onClose={() => setUnassignTarget(null)}
          entityType={unassignTarget.entityType}
          assetNumber={unassignTarget.assetNumber}
          deviceName={unassignTarget.deviceName}
          employeeName={unassignTarget.employeeName}
          employeeId={unassignTarget.employeeId}
          onConfirm={handleConfirmUnassign}
        />
      )}

      {/* SIM MODALS */}
      {showAssignSimModal && (
        <AssignSimModal
          isOpen={showAssignSimModal}
          onClose={() => setShowAssignSimModal(false)}
          preselectedEmployeeId={employee.id}
        />
      )}

      {showAddSimModal && (
        <AddEditSimModal
          isOpen={showAddSimModal}
          onClose={() => {
            setShowAddSimModal(false);
            setEditingSim(null);
          }}
          editSim={editingSim}
          preselectedEmployeeId={employee.id}
        />
      )}

      {suspendingSim && (
        <SuspendSimModal
          isOpen={!!suspendingSim}
          onClose={() => setSuspendingSim(null)}
          sim={suspendingSim}
        />
      )}

      {showRequestSimModal && (
        <RequestSimModal
          isOpen={showRequestSimModal}
          onClose={() => setShowRequestSimModal(false)}
          preselectedEmployeeId={employee.id}
        />
      )}

      {rechargeSim && (
        <AddRechargeModal
          isOpen={!!rechargeSim}
          onClose={() => setRechargeSim(null)}
          preselectedSimId={rechargeSim.id}
        />
      )}

      <ServiceReceiptPreviewModal
        isOpen={!!previewReceiptRecord}
        onClose={() => setPreviewReceiptRecord(null)}
        record={previewReceiptRecord}
      />
    </div>
  );
};
