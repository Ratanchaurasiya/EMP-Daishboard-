import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateComputerServiceSummary } from '../../utils/calculations';
import { formatCurrency, formatDateDisplay, maskSensitive } from '../../utils/formatters';
import {
  AssetStatusBadge,
  ConditionBadge,
  ProblemCategoryBadge,
  ServiceStatusBadge,
} from '../common/Badge';
import {
  X,
  Laptop,
  Cpu,
  CircuitBoard,
  Layers,
  Shield,
  ShieldAlert,
  Wrench,
  User,
  Copy,
  Check,
  Plus,
  Pencil,
  RotateCcw,
  CheckCircle2,
  Trash2,
  UserMinus,
  Building2,
  FileText,
  Eye,
} from 'lucide-react';
import { EditComputerModal } from './EditComputerModal';
import { UnassignCustodianModal } from '../common/UnassignCustodianModal';
import { ServiceReceiptPreviewModal } from '../services/ServiceReceiptPreviewModal';
import { ServiceRecord } from '../../types';

interface ComputerDetailModalProps {
  computerId: string;
  onClose: () => void;
  onOpenAddService?: (computerId: string) => void;
  onSelectEmployee?: (employeeId: string) => void;
}

export const ComputerDetailModal: React.FC<ComputerDetailModalProps> = ({
  computerId,
  onClose,
  onOpenAddService,
  onSelectEmployee,
}) => {
  const {
    computers,
    employees,
    serviceRecords,
    userRole,
    updateComputer,
    assignComputerToEmployee,
    removeComputerPermanently,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'specs' | 'services'>('specs');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [confirmDecommission, setConfirmDecommission] = useState<boolean>(false);
  const [showUnassignModal, setShowUnassignModal] = useState<boolean>(false);
  const [previewReceiptRecord, setPreviewReceiptRecord] = useState<ServiceRecord | null>(null);

  const computer = computers.find(c => c.id === computerId);

  const assignedEmp = computer
    ? employees.find(e => e.id === computer.assignedEmployeeId || e.employeeId === computer.assignedEmployeeId)
    : undefined;

  const handleConfirmUnassign = (condition: any, remarks: string) => {
    if (!computer) return;
    assignComputerToEmployee(
      computer.id,
      null,
      new Date().toISOString().substring(0, 10),
      condition,
      remarks
    );
    showToast(
      `Workstation ${computer.assetNumber} removed from ${assignedEmp?.name || 'employee'} & returned to pool`,
      'success'
    );
    setShowUnassignModal(false);
  };

  if (!computer) return null;

  const computerServices = serviceRecords
    .filter(s => s.computerId === computer.id)
    .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime());

  const serviceSummary = calculateComputerServiceSummary(computer.id, serviceRecords);
  const isAdmin = userRole === 'admin';

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast(`Copied ${fieldName} to clipboard`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#101726] rounded-t-2xl sm:rounded-xl max-w-3xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in my-0 sm:my-auto overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                  {computer.assetNumber}
                </h3>
                <AssetStatusBadge status={computer.status} size="sm" />
                <ConditionBadge condition={computer.condition} size="sm" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {computer.deviceName} • {computer.manufacturer} {computer.model}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {isAdmin && (
              <>
                {/* 1-Click Status Quick Actions */}
                {computer.status === 'Under Service' && (
                  <button
                    type="button"
                    onClick={() => {
                      updateComputer(computer.id, {
                        status: computer.assignedEmployeeId ? 'Assigned' : 'Available',
                        condition: 'Good',
                      });
                      showToast(`Workstation ${computer.assetNumber} marked as Serviced & Operational`, 'success');
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors cursor-pointer"
                    title="Mark diagnostic/repair complete and return to service"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Operational</span>
                  </button>
                )}

                {computer.status === 'Assigned' && assignedEmp && (
                  <button
                    type="button"
                    onClick={() => setShowUnassignModal(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60 transition-colors cursor-pointer"
                    title="Remove this workstation from the assigned employee"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                    <span>Remove Device</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 transition-colors cursor-pointer"
                  title="Edit specs, condition, hardware parameters"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Specs</span>
                </button>

                {!confirmDecommission ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDecommission(true)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Decommission workstation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/30 p-1 rounded-lg">
                    <span className="text-[10px] text-rose-500 font-semibold px-1">Decommission?</span>
                    <button
                      type="button"
                      onClick={() => {
                        removeComputerPermanently(computer.id);
                        onClose();
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
                    >
                      Yes, Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDecommission(false)}
                      className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-200/80 dark:border-slate-800 px-4 pt-1.5 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
          <button
            onClick={() => setActiveTab('specs')}
            className={`flex items-center gap-1.5 py-2 px-3 font-semibold border-b-2 transition-all ${
              activeTab === 'specs'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <CircuitBoard className="w-3.5 h-3.5" />
            <span>Hardware Specs</span>
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`flex items-center gap-1.5 py-2 px-3 font-semibold border-b-2 transition-all ${
              activeTab === 'services'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Service History ({computerServices.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'specs' && (
            <div className="space-y-3.5 text-xs animate-fade-in">
              {/* Assigned Employee Banner */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Currently Assigned To
                    </span>
                    {assignedEmp ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectEmployee) {
                            onSelectEmployee(assignedEmp.id);
                            onClose();
                          }
                        }}
                        className="text-left font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 cursor-pointer mt-0.5 flex-wrap"
                        title={`Click to view profile and assets for ${assignedEmp.name} (${assignedEmp.employeeId})`}
                      >
                        <span>{assignedEmp.name}</span>
                        <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-1.5 py-0.2 rounded border border-blue-500/20 transition-colors">
                          {assignedEmp.employeeId}
                        </span>
                        <span className="text-slate-500 font-normal text-xs">• {assignedEmp.department}</span>
                      </button>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned (In IT Pool)</span>
                    )}
                  </div>
                </div>

                {assignedEmp && (
                  <div className="flex items-center gap-2">
                    {onSelectEmployee && (
                      <button
                        onClick={() => {
                          onSelectEmployee(assignedEmp.id);
                          onClose();
                        }}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 cursor-pointer"
                      >
                        View Profile →
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setShowUnassignModal(true)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 transition-colors cursor-pointer"
                        title="Remove this device from the assigned employee"
                      >
                        <UserMinus className="w-3 h-3" />
                        <span>Remove Device</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Security Function Banner */}
              <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Security Function
                    </span>
                    <span className={`text-xs font-bold ${computer.securityFunctionAdded === 'No' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-300'}`}>
                      Security Function Added: {computer.securityFunctionAdded || 'Yes'}
                    </span>
                  </div>
                </div>
                {computer.securityFunctionAddedDate && (
                  <div className="text-right text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    <span className="block text-[10px] text-slate-400">Added Date</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDateDisplay(computer.securityFunctionAddedDate)}</span>
                  </div>
                )}
              </div>

              {/* Hardware Specifications Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Processor */}
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                    <Cpu className="w-3.5 h-3.5 text-blue-500" />
                    <span>Processor</span>
                  </div>
                  <div className="font-medium text-slate-800 dark:text-slate-200">
                    {computer.processor?.name || 'Standard Processor'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Speed: {computer.processor?.speed || '2.4 GHz'}
                  </div>
                </div>

                {/* RAM */}
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                    <CircuitBoard className="w-3.5 h-3.5 text-emerald-500" />
                    <span>RAM</span>
                  </div>
                  <div className="font-mono text-base font-black text-slate-900 dark:text-white">
                    {computer.memory?.installedRAM || '8 GB'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Usable: {computer.memory?.usableRAM || computer.memory?.installedRAM || '8 GB'}
                  </div>
                </div>

                {/* Graphics */}
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                    <Layers className="w-3.5 h-3.5 text-purple-500" />
                    <span>Graphics Card</span>
                  </div>
                  <div className="font-medium text-slate-800 dark:text-slate-200">
                    {computer.graphics?.card || 'Integrated Graphics'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    VRAM: {computer.graphics?.memory || 'Shared'}
                  </div>
                </div>
              </div>

              {/* Windows System Info */}
              <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Windows Edition & Architecture
                </span>
                <div className="font-bold text-slate-900 dark:text-white">{computer.system?.os || 'Windows 11 Enterprise'}</div>
                <div className="text-[11px] text-slate-500">
                  {computer.system?.systemType || '64-bit operating system, x64-based processor'} • Pen & Touch: {computer.system?.penAndTouch || 'No pen or touch input available for this display'}
                </div>
              </div>

              {/* RESTRICTED SECURITY SECTION */}
              <div
                className={`p-3.5 rounded-lg border transition-all ${
                  isAdmin
                    ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                    : 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
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
                    {isAdmin ? 'Admin View' : 'Restricted to IT Admin'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Device ID
                    </span>
                    <div className="flex items-center justify-between p-2 rounded-md bg-white dark:bg-slate-900 border font-mono text-xs">
                      <span className={isAdmin ? 'font-semibold text-slate-800 dark:text-slate-200' : 'text-slate-400 italic text-[11px]'}>
                        {maskSensitive(computer.system.deviceId, isAdmin)}
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() => handleCopy(computer.system.deviceId, 'Device ID')}
                          className="p-1 text-slate-400 hover:text-slate-600"
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
                    <div className="flex items-center justify-between p-2 rounded-md bg-white dark:bg-slate-900 border font-mono text-xs">
                      <span className={isAdmin ? 'font-semibold text-slate-800 dark:text-slate-200' : 'text-slate-400 italic text-[11px]'}>
                        {maskSensitive(computer.system.productId, isAdmin)}
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() => handleCopy(computer.system.productId, 'Product ID')}
                          className="p-1 text-slate-400 hover:text-slate-600"
                        >
                          {copiedField === 'Product ID' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-3.5 text-xs animate-fade-in">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Services</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white block mt-0.5 font-mono">
                    {serviceSummary.totalServices}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Last Service</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block mt-1 font-mono">
                    {serviceSummary.lastServiceDate || 'None'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Repair Cost</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400 block mt-0.5 font-mono">
                    {formatCurrency(serviceSummary.totalRepairCost)}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Common Issue</span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mt-1 truncate">
                    {serviceSummary.mostCommonProblem}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              {isAdmin && onOpenAddService && (
                <div className="flex justify-end">
                  <button
                    onClick={() => onOpenAddService(computer.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Service Ticket</span>
                  </button>
                </div>
              )}

              {/* List of service records */}
              <div className="space-y-2.5">
                {computerServices.length === 0 ? (
                  <p className="text-center py-6 text-slate-400">
                    No service records logged for this computer.
                  </p>
                ) : (
                  computerServices.map(service => (
                    <div
                      key={service.id}
                      className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {service.id}
                          </span>
                          <ProblemCategoryBadge category={service.problemCategory} />
                          <ServiceStatusBadge status={service.serviceStatus} size="sm" />
                        </div>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(service.serviceCost)}
                        </span>
                      </div>

                      <div className="font-semibold text-slate-900 dark:text-white">
                        {service.problem}
                      </div>

                      <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                        {service.workPerformed}
                      </p>

                      {/* Service Provider / Electric Shop Banner */}
                      {(service.serviceProviderShopName || service.technician) && (
                        <div className="p-2 rounded-lg bg-amber-500/10 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5 truncate">
                            <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                              {service.serviceProviderShopName || 'Local Tech Repair Center'}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400">
                              &bull; Tech: {service.technician || 'IT Support'}
                            </span>
                          </div>
                          {service.serviceProviderPhone && (
                            <a
                              href={`https://wa.me/${service.serviceProviderPhone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#25D366] text-white shadow-2xs shrink-0"
                            >
                              WhatsApp
                            </a>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-800">
                        <span>Date: {formatDateDisplay(service.serviceDate)}</span>
                        {service.receiptFileUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewReceiptRecord(service)}
                            className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                          >
                            <FileText className="w-3 h-3" />
                            <span>View Receipt Invoice</span>
                            <Eye className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <EditComputerModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          computerId={computer.id}
        />
      )}

      {/* Confirmation Dialog: Remove / Unassign Device */}
      {showUnassignModal && assignedEmp && (
        <UnassignCustodianModal
          isOpen={showUnassignModal}
          onClose={() => setShowUnassignModal(false)}
          entityType="Computer"
          assetNumber={computer.assetNumber}
          deviceName={`${computer.deviceName} (${computer.manufacturer} ${computer.model})`}
          employeeName={assignedEmp.name}
          employeeId={assignedEmp.employeeId}
          onConfirm={handleConfirmUnassign}
        />
      )}

      {/* Service Receipt Preview Modal */}
      <ServiceReceiptPreviewModal
        isOpen={!!previewReceiptRecord}
        record={previewReceiptRecord}
        onClose={() => setPreviewReceiptRecord(null)}
      />
    </div>
  );
};
