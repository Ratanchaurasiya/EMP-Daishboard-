import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import {
  Mouse,
  Keyboard,
  Cpu,
  Monitor,
  Laptop,
  Headphones,
  Camera,
  Smartphone,
  Box,
  Plus,
  Minus,
  Trash2,
  Send,
  CheckCircle2,
  ExternalLink,
  Mail,
  Copy,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  X,
  Layers,
  ChevronRight,
  Clock,
  Flame,
  Info,
  Check,
  Building2,
  User,
  ShoppingBag,
  FileText,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import {
  EquipmentAssetType,
  AssetRequestItem,
  RequestUrgency,
} from '../../types';
import {
  IT_SUPPORT_EMAIL,
  dispatchAssetRequestEmail,
} from '../../utils/emailService';

interface SubmitAssetRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedAssetType?: string;
}

interface EquipmentCatalogItem {
  type: EquipmentAssetType;
  label: string;
  category: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeColor: string;
  defaultSpecPrompt: string;
}

const EQUIPMENT_CATALOG: EquipmentCatalogItem[] = [
  {
    type: 'Mouse',
    label: 'Mouse',
    category: 'Peripherals',
    sublabel: 'Optical, Wireless or Ergonomic',
    icon: Mouse,
    accentColor: 'text-blue-500 bg-blue-500/10 border-blue-500/30 group-hover:bg-blue-500/20',
    badgeColor: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    defaultSpecPrompt: 'e.g. Wireless optical, Ergonomic vertical, Silent clicks',
  },
  {
    type: 'Keyboard',
    label: 'Keyboard',
    category: 'Peripherals',
    sublabel: 'Mechanical, Standard or Compact',
    icon: Keyboard,
    accentColor: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30 group-hover:bg-indigo-500/20',
    badgeColor: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
    defaultSpecPrompt: 'e.g. Mechanical brown switch, Wireless, Numpad layout',
  },
  {
    type: 'CPU',
    label: 'CPU / Desktop',
    category: 'Compute',
    sublabel: 'Workstation Tower or Mini PC',
    icon: Cpu,
    accentColor: 'text-violet-500 bg-violet-500/10 border-violet-500/30 group-hover:bg-violet-500/20',
    badgeColor: 'bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800',
    defaultSpecPrompt: 'e.g. Core i7 / Ryzen 7, 32GB RAM, Dedicated GPU tower',
  },
  {
    type: 'Monitor',
    label: 'Monitor',
    category: 'Displays',
    sublabel: 'External Display (24", 27", 32")',
    icon: Monitor,
    accentColor: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30 group-hover:bg-cyan-500/20',
    badgeColor: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
    defaultSpecPrompt: 'e.g. 27-inch 4K IPS, Type-C connectivity, Dual monitor arm',
  },
  {
    type: 'Laptop',
    label: 'Laptop',
    category: 'Compute',
    sublabel: 'Portable Notebook / Workstation',
    icon: Laptop,
    accentColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30 group-hover:bg-emerald-500/20',
    badgeColor: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    defaultSpecPrompt: 'e.g. 16GB RAM, 512GB NVMe SSD, Lightweight mobility',
  },
  {
    type: 'Headset',
    label: 'Headset',
    category: 'Audio',
    sublabel: 'Noise-Cancelling with Mic',
    icon: Headphones,
    accentColor: 'text-pink-500 bg-pink-500/10 border-pink-500/30 group-hover:bg-pink-500/20',
    badgeColor: 'bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800',
    defaultSpecPrompt: 'e.g. Active noise cancelling, Bluetooth + USB dongle',
  },
  {
    type: 'Webcam',
    label: 'Webcam',
    category: 'Video',
    sublabel: 'HD Video Conference Camera',
    icon: Camera,
    accentColor: 'text-amber-500 bg-amber-500/10 border-amber-500/30 group-hover:bg-amber-500/20',
    badgeColor: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    defaultSpecPrompt: 'e.g. 1080p 60fps, Wide angle with physical privacy shutter',
  },
  {
    type: 'Mobile Phone',
    label: 'Mobile Phone',
    category: 'Mobile',
    sublabel: 'Corporate Handset / Test Device',
    icon: Smartphone,
    accentColor: 'text-teal-500 bg-teal-500/10 border-teal-500/30 group-hover:bg-teal-500/20',
    badgeColor: 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800',
    defaultSpecPrompt: 'e.g. iOS / Android mobile QA testing device with eSIM',
  },
  {
    type: 'Other',
    label: 'Other Equipment',
    category: 'Hardware',
    sublabel: 'Dock, Cables, Adapter, Surge Hub',
    icon: Box,
    accentColor: 'text-slate-500 bg-slate-500/10 border-slate-500/30 group-hover:bg-slate-500/20',
    badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    defaultSpecPrompt: 'e.g. USB-C Docking Station, Dual HDMI adapter, Surge protector',
  },
];

const REASON_PRESETS = [
  {
    id: 'setup',
    title: 'New Project Setup',
    tag: 'Deployment',
    description: 'Hardware and multi-screen peripheral setup required for new client deliverable.',
  },
  {
    id: 'faulty',
    title: 'Faulty / Damaged Hardware',
    tag: 'Replacement',
    description: 'Existing equipment is malfunctioning or experiencing erratic input/display failure.',
  },
  {
    id: 'upgrade',
    title: 'Ergonomic & Performance Upgrade',
    tag: 'Productivity',
    description: 'Upgrading to ergonomic accessories and higher resolution display for extended productivity.',
  },
  {
    id: 'hybrid',
    title: 'Hybrid / Work From Home',
    tag: 'Remote Kit',
    description: 'Peripheral hardware requested for seamless hybrid and home workstation operations.',
  },
];

export const SubmitAssetRequestModal: React.FC<SubmitAssetRequestModalProps> = ({
  isOpen,
  onClose,
  preselectedAssetType,
}) => {
  const {
    employees,
    currentUser,
    selectedEmployeeId,
    addAssetRequest,
    showToast,
  } = useApp();

  // Identify current requesting employee with guaranteed safe fallback
  const employee = useMemo(() => {
    const found =
      (currentUser?.role === 'employee' &&
        employees.find(
          e =>
            e.id === currentUser.id ||
            e.employeeId === currentUser.employeeId ||
            e.email?.toLowerCase() === currentUser.email?.toLowerCase()
        )) ||
      (selectedEmployeeId &&
        employees.find(
          e => e.id === selectedEmployeeId || e.employeeId === selectedEmployeeId
        )) ||
      employees[0];

    return (
      found || {
        id: currentUser?.id || 'emp-current',
        employeeId: currentUser?.employeeId || 'EMP-8821',
        name: currentUser?.name || 'Ratan Chaurasiya',
        email: currentUser?.email || 'ratanchaurasiya61@gmail.com',
        department: 'Engineering',
        designation: 'Staff Engineer',
        companyEmployeeNumber: 'CORP-8821',
        phone: '+91 98765 43210',
      }
    );
  }, [currentUser, employees, selectedEmployeeId]);

  // Form State
  const [selectedItems, setSelectedItems] = useState<AssetRequestItem[]>([
    {
      id: `item-${Date.now()}-1`,
      assetType: 'Mouse',
      quantity: 1,
      specifications: 'Wireless optical mouse',
    },
  ]);

  const [urgency, setUrgency] = useState<RequestUrgency>('Normal');
  const [reason, setReason] = useState<string>('New Project Setup: Hardware and multi-screen peripheral setup required for new client deliverable.');
  const [activePreset, setActivePreset] = useState<string | null>('setup');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [submissionResult, setSubmissionResult] = useState<{
    requestId: string;
    gmailComposeUrl: string;
    mailtoUrl: string;
    body: string;
    totalUnits: number;
    itemsCount: number;
  } | null>(null);

  // When modal is opened or reopened, reset submission result and ensure fresh items
  useEffect(() => {
    if (isOpen) {
      setSubmissionResult(null);
      setIsSubmitting(false);

      if (preselectedAssetType) {
        const match = EQUIPMENT_CATALOG.find(
          c => c.type.toLowerCase() === preselectedAssetType.toLowerCase()
        );
        if (match) {
          setSelectedItems([
            {
              id: `item-${Date.now()}-1`,
              assetType: match.type,
              quantity: 1,
              specifications: '',
            },
          ]);
          return;
        }
      }

      // If no items, give a starter Mouse item
      setSelectedItems(prev =>
        prev.length > 0
          ? prev
          : [
              {
                id: `item-${Date.now()}-1`,
                assetType: 'Mouse',
                quantity: 1,
                specifications: 'Wireless optical mouse',
              },
            ]
      );
    }
  }, [isOpen, preselectedAssetType]);

  const handleClose = () => {
    setSubmissionResult(null);
    onClose();
  };

  // Filter catalog by search - Top-level hook before any early return
  const filteredCatalog = useMemo(() => {
    if (!catalogSearch.trim()) return EQUIPMENT_CATALOG;
    const q = catalogSearch.toLowerCase().trim();
    return EQUIPMENT_CATALOG.filter(
      c =>
        c.label.toLowerCase().includes(q) ||
        c.sublabel.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }, [catalogSearch]);

  const totalUnits = selectedItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  // Toggle or add item to selected list
  const handleToggleCatalogItem = (catItem: EquipmentCatalogItem) => {
    const existingIndex = selectedItems.findIndex(i => i.assetType === catItem.type);
    if (existingIndex >= 0) {
      // If already present, increment quantity
      setSelectedItems(prev =>
        prev.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
      showToast(`Added another ${catItem.label} to requisition basket.`, 'info');
    } else {
      // Add new item
      setSelectedItems(prev => [
        ...prev,
        {
          id: `item-${Date.now()}-${prev.length + 1}`,
          assetType: catItem.type,
          customAssetName: catItem.type === 'Other' ? 'Docking Station' : undefined,
          quantity: 1,
          specifications: '',
        },
      ]);
      showToast(`Added ${catItem.label} to requisition basket.`, 'success');
    }
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setSelectedItems(prev =>
      prev
        .map(item => {
          if (item.id === id) {
            const nextQty = Math.max(1, Math.min(50, item.quantity + delta));
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(item => item.quantity > 0)
    );
  };

  const handleSetExactQuantity = (id: string, val: number) => {
    const safeVal = isNaN(val) ? 1 : Math.max(1, Math.min(50, val));
    setSelectedItems(prev =>
      prev.map(item => (item.id === id ? { ...item, quantity: safeVal } : item))
    );
  };

  const handleUpdateSpec = (id: string, specifications: string) => {
    setSelectedItems(prev =>
      prev.map(item => (item.id === id ? { ...item, specifications } : item))
    );
  };

  const handleUpdateCustomName = (id: string, customAssetName: string) => {
    setSelectedItems(prev =>
      prev.map(item => (item.id === id ? { ...item, customAssetName } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== id));
    showToast('Item removed from requisition.', 'info');
  };

  const handleApplyPreset = (preset: (typeof REASON_PRESETS)[0]) => {
    setActivePreset(preset.id);
    setReason(`${preset.title}: ${preset.description}`);
  };

  // Submit Requisition
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedItems.length === 0) {
      showToast('Please select at least one asset to request from the catalog on the left.', 'info');
      return;
    }

    const finalReason = reason.trim() || 'Official employee hardware requisition for daily development & workstation productivity.';

    setIsSubmitting(true);
    const currentDate = new Date().toISOString().substring(0, 10);

    // 1. Prepare email payload
    const emailPayload = {
      employeeName: employee.name,
      employeeId: employee.employeeId,
      companyEmployeeNumber: employee.companyEmployeeNumber,
      employeeEmail: employee.email,
      employeePhone: employee.phone,
      department: employee.department,
      designation: employee.designation,
      requestDate: currentDate,
      urgency,
      items: selectedItems.map(i => ({
        assetType: i.assetType,
        customAssetName: i.customAssetName,
        quantity: i.quantity,
        specifications: i.specifications,
      })),
      reason: finalReason,
    };

    const dispatchRes = dispatchAssetRequestEmail(emailPayload, false);

    // 2. Persist record in AppContext state and database
    const dbRes = addAssetRequest({
      employeeId: employee.employeeId,
      companyEmployeeNumber: employee.companyEmployeeNumber,
      employeeName: employee.name,
      employeeEmail: employee.email,
      employeePhone: employee.phone,
      department: employee.department,
      designation: employee.designation,
      requestDate: currentDate,
      urgency,
      status: 'Pending',
      items: selectedItems,
      reason: finalReason,
    });

    setIsSubmitting(false);

    if (dbRes.success && dbRes.requestId) {
      setSubmissionResult({
        requestId: dbRes.requestId,
        gmailComposeUrl: dispatchRes.gmailComposeUrl,
        mailtoUrl: dispatchRes.mailtoUrl,
        body: dispatchRes.body,
        totalUnits,
        itemsCount: selectedItems.length,
      });
      showToast(`Requisition #${dbRes.requestId} successfully submitted to IT Admin!`, 'success');
    } else {
      showToast('Failed to log requisition. Please try again.', 'error');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center animate-modal-backdrop">
      <div className="relative w-full h-full max-w-7xl max-h-[94vh] bg-white dark:bg-[#0b101b] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800/90 overflow-hidden flex flex-col animate-modal-enter">
        
        {/* ========================================================= */}
        {/* EXECUTIVE MODAL HEADER                                    */}
        {/* ========================================================= */}
        <div className="px-5 sm:px-7 py-4 border-b border-slate-200/90 dark:border-slate-800/80 flex items-center justify-between bg-white dark:bg-[#0d1424] shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 ring-4 ring-blue-500/10 shrink-0">
              <Layers className="w-5 h-5 animate-pulse-glow" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {submissionResult ? 'Requisition Dispatched to Command Desk' : 'Submit Equipment Request to Admin'}
                </h2>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Multi-Asset Engine
                </span>
                <span className="hidden sm:inline-flex text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Live Admin Dispatch
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {submissionResult
                  ? `Requisition #${submissionResult.requestId} logged into fleet management and routed to ${IT_SUPPORT_EMAIL}`
                  : 'Select company hardware peripherals, specify configurations, and submit multi-item request to IT Administration'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Requester Identity Pill in Header */}
            {employee && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-[11px] shadow-xs">
                  {employee.name.charAt(0)}
                </div>
                <div className="leading-tight text-left">
                  <div className="font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                    {employee.name}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {employee.employeeId} &bull; {employee.department}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-transform duration-200 hover:rotate-90 cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MODAL MAIN BODY                                           */}
        {/* ========================================================= */}
        {submissionResult ? (
          /* ========================================================= */
          /* SUCCESS CONFIRMATION VIEW                                  */
          /* ========================================================= */
          <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 animate-scale-in">
            <div className="text-center max-w-2xl mx-auto pt-2">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto mb-3.5 shadow-xl shadow-emerald-500/25 ring-8 ring-emerald-500/10">
                <CheckCircle2 className="w-9 h-9 animate-fade-in" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Equipment Request Logged &amp; Dispatched!
              </h3>
              <div className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-mono text-sm font-bold border border-emerald-300/80 dark:border-emerald-700 shadow-xs">
                <span>Requisition ID: #{submissionResult.requestId}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(submissionResult.requestId);
                    showToast('Copied Requisition ID!', 'info');
                  }}
                  className="hover:text-emerald-950 dark:hover:text-white transition-colors cursor-pointer"
                  title="Copy Request ID"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                Your requisition for{' '}
                <strong className="text-slate-900 dark:text-white font-semibold">
                  {submissionResult.totalUnits} unit(s)
                </strong>{' '}
                across{' '}
                <strong className="text-slate-900 dark:text-white font-semibold">
                  {submissionResult.itemsCount} equipment category(ies)
                </strong>{' '}
                has been recorded and routed directly to the IT Administrator Command Desk.
              </p>
            </div>

            {/* Split Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-5xl mx-auto">
              {/* Left Column: Requester & Telemetry Info */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    <span>Requisition Telemetry</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                      <span className="text-slate-500">Requester</span>
                      <span className="font-bold text-slate-900 dark:text-white">{employee?.name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                      <span className="text-slate-500">Department</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{employee?.department}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                      <span className="text-slate-500">Priority SLA</span>
                      <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        urgency === 'Critical'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                          : urgency === 'High'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                          : 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                      }`}>
                        {urgency} Priority
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Target Support</span>
                      <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{IT_SUPPORT_EMAIL}</span>
                    </div>
                  </div>
                </div>

                {/* Email Dispatch Fast Actions */}
                <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/60 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-950 dark:text-blue-200">
                    <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>External Mail Notification Shortcuts</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    A formal dispatch payload has been generated. You can open it in your email client or copy to clipboard:
                  </p>

                  <div className="space-y-2 pt-1">
                    <a
                      href={submissionResult.gmailComposeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Pre-filled Request in Gmail</span>
                    </a>

                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={submissionResult.mailtoUrl}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors text-center cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5 text-blue-500" />
                        <span>Outlook Mail</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(submissionResult.body);
                          showToast('Copied requisition details to clipboard!', 'info');
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy Summary</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Requested Items Cards */}
              <div className="lg:col-span-7 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />
                    <span>Requested Assets Manifest ({selectedItems.length} Categories)</span>
                  </span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                    {totalUnits} Total Units
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {selectedItems.map((item, idx) => {
                    const catalogMatch = EQUIPMENT_CATALOG.find(c => c.type === item.assetType);
                    const Icon = catalogMatch?.icon || Box;

                    return (
                      <div
                        key={item.id || idx}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${catalogMatch?.accentColor || 'text-blue-500 bg-blue-500/10'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                              {item.customAssetName ? `${item.assetType} — ${item.customAssetName}` : item.assetType}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {item.specifications || 'Standard company issue specification'}
                            </div>
                          </div>
                        </div>

                        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 shrink-0">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Justification quote */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Reason Provided:</span>
                  <p className="italic text-slate-500 dark:text-slate-400">&ldquo;{reason}&rdquo;</p>
                </div>
              </div>
            </div>

            {/* Done & Submit Another Actions */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSubmissionResult(null);
                  setSelectedItems([
                    {
                      id: `item-${Date.now()}-1`,
                      assetType: 'Mouse',
                      quantity: 1,
                      specifications: '',
                    },
                  ]);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Submit Another Request</span>
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="px-8 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-sm hover:scale-105"
              >
                Close &amp; Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* FORM VIEW: TWO-COLUMN COMMAND CENTER                      */
          /* ========================================================= */
          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col min-h-0">
            
            {/* Split Body Container */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
              
              {/* ======================================================= */}
              {/* LEFT COLUMN: VISUAL EQUIPMENT CATALOG & CATEGORY CARDS   */}
              {/* ======================================================= */}
              <div className="lg:col-span-5 p-4 sm:p-6 space-y-4 overflow-y-auto bg-slate-50/50 dark:bg-transparent">
                
                {/* Catalog Header & Search */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>1. Hardware Equipment Catalog</span>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {EQUIPMENT_CATALOG.length} Categories
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Click cards to add multiple hardware assets to your requisition basket
                      </p>
                    </div>
                  </div>

                  {/* Fast filter */}
                  <div className="relative">
                    <input
                      type="text"
                      value={catalogSearch}
                      onChange={e => setCatalogSearch(e.target.value)}
                      placeholder="Search hardware (e.g. mouse, monitor, laptop)..."
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                    {catalogSearch && (
                      <button
                        type="button"
                        onClick={() => setCatalogSearch('')}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 3x3 Equipment Grid with Dynamic Hover & Selection Rings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                  {filteredCatalog.map(cat => {
                    const Icon = cat.icon;
                    const existingItem = selectedItems.find(i => i.assetType === cat.type);
                    const isSelected = !!existingItem;
                    const selectedCount = existingItem?.quantity || 0;

                    return (
                      <button
                        type="button"
                        key={cat.type}
                        onClick={() => handleToggleCatalogItem(cat)}
                        className={`group relative p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md ${
                          isSelected
                            ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-500/80 shadow-xs ring-2 ring-blue-500/30'
                            : 'bg-white dark:bg-slate-900/60 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {/* Top Card Bar */}
                        <div className="flex items-center justify-between w-full mb-2">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-200 ${
                              isSelected
                                ? cat.accentColor
                                : 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                          </div>

                          {isSelected ? (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-xs animate-scale-in flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>{selectedCount} in Basket</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-0.5 transition-colors">
                              <Plus className="w-3 h-3" /> Add
                            </span>
                          )}
                        </div>

                        {/* Title & Category */}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                              {cat.label}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                            {cat.sublabel}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Corporate Policy Telemetry Notice */}
                <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-blue-950 dark:text-blue-200 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Automated Requisition Dispatch:</span>
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                      All requested items are tracked directly against company hardware inventory and reviewed by IT administration at{' '}
                      <strong className="text-blue-700 dark:text-blue-300 font-mono">{IT_SUPPORT_EMAIL}</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* ======================================================= */}
              {/* RIGHT COLUMN: REQUISITION BASKET & CONFIGURATION        */}
              {/* ======================================================= */}
              <div className="lg:col-span-7 p-4 sm:p-6 space-y-5 overflow-y-auto">
                
                {/* Section 2: Requisition Basket Header */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>2. Requisition Basket &amp; Specifications</span>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-bold">
                          ({selectedItems.length} Selected)
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Adjust quantities and specify technical requirements for each asset
                      </p>
                    </div>

                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-2xs flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{selectedItems.length} Asset Types &bull; {totalUnits} Units</span>
                    </span>
                  </div>

                  {/* Basket Items List */}
                  {selectedItems.length === 0 ? (
                    <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2 bg-slate-50/50 dark:bg-slate-900/30">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Your requisition basket is empty
                      </div>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                        Click any equipment card from the catalog on the left to add items to your hardware request.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedItems.map((item, index) => {
                        const catalogMatch = EQUIPMENT_CATALOG.find(c => c.type === item.assetType);
                        const Icon = catalogMatch?.icon || Box;

                        return (
                          <div
                            key={item.id}
                            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/90 shadow-xs space-y-2.5 animate-slide-down transition-all"
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              {/* Asset Title & Custom Specifier */}
                              <div className="flex items-center gap-2.5 font-bold text-slate-900 dark:text-white text-xs">
                                <span className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${catalogMatch?.accentColor || 'text-blue-500 bg-blue-500/10'}`}>
                                  <Icon className="w-3.5 h-3.5" />
                                </span>
                                {item.assetType === 'Other' ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-slate-500 text-xs">Other:</span>
                                    <input
                                      type="text"
                                      value={item.customAssetName || ''}
                                      onChange={e => handleUpdateCustomName(item.id, e.target.value)}
                                      placeholder="Specify Equipment (e.g. Docking Station, Hub)"
                                      className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-60"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span>{item.assetType}</span>
                                    <span className="text-[10px] font-normal text-slate-400 font-mono">
                                      #{index + 1}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Interactive Stepper & Remove */}
                              <div className="flex items-center gap-2">
                                <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/90 overflow-hidden shadow-2xs">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateQuantity(item.id, -1)}
                                    className="px-2.5 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                                    title="Decrease quantity"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <input
                                    type="number"
                                    min={1}
                                    max={50}
                                    value={item.quantity}
                                    onChange={e => handleSetExactQuantity(item.id, parseInt(e.target.value, 10))}
                                    className="w-10 text-center font-mono font-bold text-xs bg-transparent text-slate-900 dark:text-white focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateQuantity(item.id, 1)}
                                    className="px-2.5 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                                    title="Increase quantity"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                                  title="Remove item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Specification / Model Field */}
                            <div className="relative">
                              <input
                                type="text"
                                value={item.specifications || ''}
                                onChange={e => handleUpdateSpec(item.id, e.target.value)}
                                placeholder={catalogMatch?.defaultSpecPrompt || 'Optional model, interface, or technical specifications...'}
                                className="w-full px-3 py-2 text-xs bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans transition-colors"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Section 3: Reason / Justification with 1-Click Animated Presets */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>3. Business Justification &amp; Requirement</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-normal">Click preset to auto-populate</span>
                  </div>

                  {/* 4 Interactive Presets */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {REASON_PRESETS.map(preset => {
                      const isActive = activePreset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleApplyPreset(preset)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer group ${
                            isActive
                              ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 ring-1 ring-blue-500/40 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 border-slate-200/80 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              {preset.title}
                            </span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {preset.tag}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            {preset.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  <textarea
                    rows={3}
                    value={reason}
                    onChange={e => {
                      setReason(e.target.value);
                      setActivePreset(null);
                    }}
                    placeholder="Describe specific project requirements, equipment failure details, or reason for requesting these assets..."
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans leading-relaxed"
                  />
                </div>

                {/* Section 4: Urgency Level */}
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>4. Priority &amp; Delivery Urgency</span>
                  </label>

                  <div className="grid grid-cols-3 gap-2.5">
                    {(
                      [
                        { level: 'Normal', desc: 'Standard SLA (3-5 Days)', icon: Clock },
                        { level: 'High', desc: 'Accelerated (24-48 Hrs)', icon: Flame },
                        { level: 'Critical', desc: 'Emergency (Same-day)', icon: AlertCircle },
                      ] as const
                    ).map(item => {
                      const IconComp = item.icon;
                      const isSelected = urgency === item.level;
                      return (
                        <button
                          type="button"
                          key={item.level}
                          onClick={() => setUrgency(item.level as RequestUrgency)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                            isSelected
                              ? item.level === 'Critical'
                                ? 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/20 ring-2 ring-rose-500/30'
                                : item.level === 'High'
                                ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20 ring-2 ring-amber-500/30'
                                : 'bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-500/20 ring-2 ring-blue-500/30'
                              : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <IconComp className="w-3.5 h-3.5" />
                            <span>{item.level}</span>
                          </div>
                          <span className={`text-[9.5px] ${isSelected ? 'text-white/90' : 'text-slate-400'}`}>
                            {item.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* STICKY MODAL FOOTER                                       */}
            {/* ========================================================= */}
            <div className="px-5 sm:px-7 py-3.5 border-t border-slate-200/90 dark:border-slate-800/80 bg-slate-50 dark:bg-[#0d1424] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-900 dark:text-white">Summary:</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                  {selectedItems.length} Categories ({totalUnits} Units)
                </span>
                <span className="hidden sm:inline text-slate-400">&bull;</span>
                <span className="hidden sm:inline font-mono text-slate-500">
                  Urgency: {urgency}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-blue-500/25 active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Transmitting Requisition...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Request to Admin ({totalUnits} Unit{totalUnits > 1 ? 's' : ''})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};
