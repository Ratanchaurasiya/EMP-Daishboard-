import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import {
  PurchaseDeviceType,
  PURCHASE_ACCESSORY_TYPES,
} from '../../types';
import {
  X,
  Plus,
  Trash2,
  Laptop,
  Monitor,
  ShoppingBag,
  DollarSign,
  FileText,
  CheckCircle2,
  UploadCloud,
  Smartphone,
  Keyboard,
  Mouse,
  Headphones,
  Tv,
  Plug,
  Package,
  Layers,
  ShieldCheck,
  Building2,
  Calendar,
  Cpu,
  User,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AddPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ASSET_TYPE_CONFIG = [
  {
    type: 'Laptop',
    label: 'Laptop',
    subtitle: 'Notebook & Ultrabook',
    icon: Laptop,
    category: 'Computer',
  },
  {
    type: 'PC',
    label: 'Desktop / Workstation',
    subtitle: 'Tower, Mini PC & All-in-One',
    icon: Monitor,
    category: 'Computer',
  },
  {
    type: 'Mobile Phone',
    label: 'Mobile Device',
    subtitle: 'Smartphone & Cellular',
    icon: Smartphone,
    category: 'Mobile',
  },
  {
    type: 'Monitor',
    label: 'Monitor / Display',
    subtitle: 'External Screen & Panel',
    icon: Tv,
    category: 'Display',
  },
  {
    type: 'Keyboard',
    label: 'Keyboard',
    subtitle: 'Mechanical & Membrane',
    icon: Keyboard,
    category: 'Peripheral',
  },
  {
    type: 'Mouse',
    label: 'Mouse / Trackpad',
    subtitle: 'Optical & Precision Pointing',
    icon: Mouse,
    category: 'Peripheral',
  },
  {
    type: 'Headset',
    label: 'Headset / Audio',
    subtitle: 'Headphones & Microphone',
    icon: Headphones,
    category: 'Audio',
  },
  {
    type: 'Docking Station',
    label: 'Docking Station',
    subtitle: 'Hub & Port Replicator',
    icon: Plug,
    category: 'Connectivity',
  },
  {
    type: 'Other',
    label: 'Other Company Asset',
    subtitle: 'General IT Hardware & Gear',
    icon: Package,
    category: 'General',
  },
] as const;

export const AddPurchaseModal: React.FC<AddPurchaseModalProps> = ({ isOpen, onClose }) => {
  const { addPurchaseRecord, employees } = useApp();

  const [deviceType, setDeviceType] = useState<PurchaseDeviceType>('Laptop');
  const [purchaseNumber, setPurchaseNumber] = useState(
    `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [brand, setBrand] = useState('');
  const [modelName, setModelName] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().substring(0, 10));
  const [vendor, setVendor] = useState('');

  // Quantity & Unit Cost
  const [quantity, setQuantity] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<number | ''>('');

  // Computer Specific Specs
  const [processor, setProcessor] = useState('');
  const [ram, setRam] = useState('');
  const [storage, setStorage] = useState('');
  const [os, setOs] = useState('Windows 11 Pro');

  // Mobile Phone Specific Specs
  const [imeiNumber, setImeiNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Monitor / Accessory Specific Specs
  const [screenSize, setScreenSize] = useState('');
  const [specsDetails, setSpecsDetails] = useState('');

  // Warranty
  const [warrantyPeriod, setWarrantyPeriod] = useState('1 Year On-Site');
  const [warrantyExpiryDate, setWarrantyExpiryDate] = useState('');
  const [warrantyProvider, setWarrantyProvider] = useState('Manufacturer');

  // Invoice & Receipt
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [invoiceFileName, setInvoiceFileName] = useState('');
  const [invoiceFileUrl, setInvoiceFileUrl] = useState('');

  // Custody & Fleet
  const [status, setStatus] = useState<'In Stock' | 'Assigned' | 'Under Service'>('In Stock');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState<string>('');
  const [addToFleet, setAddToFleet] = useState<boolean>(true);
  const [notes, setNotes] = useState('');

  // Dynamic bundled accessories
  const [showBundledSection, setShowBundledSection] = useState<boolean>(false);
  const [accessories, setAccessories] = useState<
    Array<{
      id: string;
      type: string;
      name: string;
      quantity: number;
      unitCost: number;
      totalCost: number;
    }>
  >([]);

  // Calculations
  const numericQuantity = Math.max(1, Number(quantity) || 1);
  const numericUnitCost = Number(unitCost) || 0;
  const baseAssetCost = numericQuantity * numericUnitCost;

  const totalAccessoriesCost = accessories.reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0);
  const grandTotalCost = baseAssetCost + totalAccessoriesCost;

  // Helpers
  const isComputer = deviceType === 'Laptop' || deviceType === 'PC';
  const isPhone = deviceType === 'Mobile Phone';
  const isMonitor = deviceType === 'Monitor';
  const isAccessory = ['Keyboard', 'Mouse', 'Headset', 'Docking Station', 'Other'].includes(deviceType);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInvoiceFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setInvoiceFileUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddAccessory = () => {
    setAccessories(prev => [
      ...prev,
      {
        id: 'acc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
        type: 'Keyboard',
        name: '',
        quantity: 1,
        unitCost: 0,
        totalCost: 0,
      },
    ]);
  };

  const handleUpdateAccessory = (id: string, field: string, val: any) => {
    setAccessories(prev =>
      prev.map(acc => {
        if (acc.id !== id) return acc;
        const updated = { ...acc, [field]: val };
        const q = Number(updated.quantity) || 1;
        const c = Number(updated.unitCost) || 0;
        updated.totalCost = q * c;
        return updated;
      })
    );
  };

  const handleRemoveAccessory = (id: string) => {
    setAccessories(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!brand.trim() || !modelName.trim()) {
      alert('Please specify the asset Brand and Model / Name.');
      return;
    }

    if (!numericUnitCost && numericUnitCost !== 0) {
      alert('Please enter a valid purchase unit cost.');
      return;
    }

    const assignedEmp = assignedEmployeeId ? employees.find(e => e.id === assignedEmployeeId) : null;

    const result = addPurchaseRecord(
      {
        purchaseNumber: purchaseNumber.trim(),
        deviceType,
        quantity: numericQuantity,
        unitCost: numericUnitCost,
        brand: brand.trim(),
        modelName: modelName.trim(),
        modelNumber: modelNumber.trim(),
        serialNumber: serialNumber.trim() || undefined,
        imeiNumber: isPhone ? imeiNumber.trim() || undefined : undefined,
        phoneNumber: isPhone ? phoneNumber.trim() || undefined : undefined,
        screenSize: isMonitor ? screenSize.trim() || undefined : undefined,
        specsDetails: (isMonitor || isAccessory) ? specsDetails.trim() || undefined : undefined,
        purchaseDate,
        vendor: vendor.trim(),
        deviceCost: baseAssetCost,
        processor: isComputer ? processor.trim() : undefined,
        ram: isComputer ? ram.trim() : undefined,
        storage: isComputer || isPhone ? storage.trim() : undefined,
        os: isComputer || isPhone ? os.trim() : undefined,
        warrantyPeriod: warrantyPeriod.trim(),
        warrantyExpiryDate: warrantyExpiryDate || undefined,
        warrantyProvider: warrantyProvider.trim(),
        invoiceNumber: invoiceNumber.trim() || undefined,
        invoiceDate: invoiceDate || undefined,
        invoiceFileName: invoiceFileName || undefined,
        invoiceFileUrl: invoiceFileUrl || undefined,
        accessories: accessories.map(a => ({
          id: a.id,
          type: a.type as any,
          name: a.name.trim(),
          quantity: a.quantity,
          unitCost: a.unitCost,
          totalCost: a.totalCost,
        })),
        status,
        assignedEmployeeId: assignedEmployeeId || undefined,
        assignedEmployeeName: assignedEmp ? assignedEmp.name : undefined,
        notes: notes.trim(),
      },
      { addToFleet }
    );

    if (result.success) {
      onClose();
    }
  };

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] p-2.5 sm:p-4 md:p-5 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center animate-modal-backdrop">
      <div className="relative w-full h-full bg-white dark:bg-[#0b101b] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800/90 overflow-hidden flex flex-col animate-modal-enter">
        
        {/* Sleek Enterprise Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-white dark:bg-[#0d1424]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 shadow-2xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Record Asset Purchase
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Log procurement details, hardware parameters, invoice documentation, and fleet allocation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: Asset Classification */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                <span>Asset Classification</span>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Active Category: <strong className="text-slate-700 dark:text-slate-200">{deviceType}</strong>
              </span>
            </div>

            {/* 3x3 Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {ASSET_TYPE_CONFIG.map(item => {
                const IconComponent = item.icon;
                const isSelected = deviceType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => {
                      setDeviceType(item.type as PurchaseDeviceType);
                      if (item.type === 'Laptop' || item.type === 'PC') {
                        if (!os) setOs('Windows 11 Pro');
                      }
                    }}
                    className={`group relative flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500 text-slate-900 dark:text-white shadow-xs ring-1 ring-amber-500/30'
                        : 'bg-white dark:bg-[#0f172a]/50 border-slate-200 dark:border-slate-800/90 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-[#151f33]'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-[#182338] text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold truncate">{item.label}</span>
                        {isSelected && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Primary Identity & Order Metadata */}
          <div className="p-4.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0f172a]/40 space-y-3.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Asset Identity & Order Metadata</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  PO / Order Number *
                </label>
                <input
                  type="text"
                  required
                  value={purchaseNumber}
                  onChange={e => setPurchaseNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs font-mono focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Brand / Manufacturer *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dell, Apple, Logitech"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Model Name / Product *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Latitude 5440, MX Master 3S"
                  value={modelName}
                  onChange={e => setModelName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Model Number / SKU
                </label>
                <input
                  type="text"
                  placeholder="e.g. KB216, SM-S921B"
                  value={modelNumber}
                  onChange={e => setModelNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Quantity Purchased *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Unit Purchase Cost (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={unitCost}
                    onChange={e => setUnitCost(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs font-bold focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Serial Number (S/N)
                  <span className="text-[10px] text-slate-400 font-normal ml-1">
                    {isComputer ? '(Required for PC)' : '(Optional for Gear)'}
                  </span>
                </label>
                <input
                  type="text"
                  required={isComputer && numericQuantity === 1}
                  placeholder={numericQuantity > 1 ? 'Multi-unit bulk order' : 'e.g. SN-8849201'}
                  value={serialNumber}
                  onChange={e => setSerialNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs font-mono focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Purchase Date *
                </label>
                <input
                  type="date"
                  required
                  value={purchaseDate}
                  onChange={e => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                />
              </div>
            </div>

            {/* Inline Subtotal Bar */}
            <div className="mt-2 flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Item Subtotal:
                </span>
                <span className="font-mono text-slate-600 dark:text-slate-300">
                  {numericQuantity} {numericQuantity > 1 ? 'units' : 'unit'} × ₹{numericUnitCost.toLocaleString('en-IN')}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  = ₹{baseAssetCost.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {deviceType} • {brand || 'Brand'}
              </div>
            </div>
          </div>

          {/* Section 3: Technical Details & Specifications */}
          <div key={deviceType} className="p-4.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0f172a]/40 space-y-3.5 animate-tab-fade">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-amber-500" />
              <span>Technical Specifications ({deviceType})</span>
            </div>

            {/* Case A: Computer / Laptop / Desktop */}
            {isComputer && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Processor (CPU) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Intel Core i7-13700H, M3 Pro"
                    value={processor}
                    onChange={e => setProcessor(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Memory (RAM) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 16 GB DDR5, 32 GB"
                    value={ram}
                    onChange={e => setRam(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Internal Storage *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 512 GB NVMe SSD, 1 TB"
                    value={storage}
                    onChange={e => setStorage(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Operating System
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Windows 11 Pro, macOS Sonoma"
                    value={os}
                    onChange={e => setOs(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Case B: Mobile Phone */}
            {isPhone && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Phone / SIM Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs font-mono focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    IMEI Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 354892109823451"
                    value={imeiNumber}
                    onChange={e => setImeiNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs font-mono focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Internal Storage / RAM
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 128 GB / 8 GB RAM"
                    value={storage}
                    onChange={e => setStorage(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    OS / Platform
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Android 14, iOS 17"
                    value={os}
                    onChange={e => setOs(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Case C: Monitor */}
            {isMonitor && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Screen Size *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 24 inch, 27 inch 4K"
                    value={screenSize}
                    onChange={e => setScreenSize(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Display Specs & Ports
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1920x1080 IPS, 75Hz, HDMI + DisplayPort, Height Adjustable"
                    value={specsDetails}
                    onChange={e => setSpecsDetails(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Case D: Peripherals & Other Accessories */}
            {isAccessory && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Technical Specifications / Connectivity
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Wireless 2.4GHz + Bluetooth, USB-C Charging, Noise-Cancelling"
                    value={specsDetails}
                    onChange={e => setSpecsDetails(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Form Factor / Color
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Full-size, Ergonomic, Graphite"
                    value={storage}
                    onChange={e => setStorage(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Procurement, Warranty & Vendor */}
          <div className="p-4.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0f172a]/40 space-y-3.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Procurement Terms & Warranty</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Vendor / Supplier
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dell Direct, Amazon Business"
                  value={vendor}
                  onChange={e => setVendor(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Warranty Coverage
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1 Year On-Site, 3 Years ProSupport"
                  value={warrantyPeriod}
                  onChange={e => setWarrantyPeriod(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Warranty Expiry Date
                </label>
                <input
                  type="date"
                  value={warrantyExpiryDate}
                  onChange={e => setWarrantyExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Warranty Provider
                </label>
                <input
                  type="text"
                  placeholder="e.g. Manufacturer, Third-Party"
                  value={warrantyProvider}
                  onChange={e => setWarrantyProvider(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Bundled Peripherals (Collapsible Accordion) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0f172a]/40 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowBundledSection(prev => !prev)}
              className="w-full px-4.5 py-3 flex items-center justify-between text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Bundled Accessories with this Order
                </span>
                {accessories.length > 0 && (
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    {accessories.length} items (₹{totalAccessoriesCost.toLocaleString('en-IN')})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{showBundledSection ? 'Hide' : 'Add Bundled Items'}</span>
                {showBundledSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showBundledSection && (
              <div className="p-4.5 pt-2 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Include companion gear (e.g. mouse, bag, adapter, monitor) packaged alongside this purchase.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddAccessory}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Item
                  </button>
                </div>

                {accessories.length === 0 ? (
                  <div className="py-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-400">
                    No bundled accessories added yet. Click "+ Add Item" if this purchase includes extra gear.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {accessories.map((item, idx) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-12 gap-2 p-2.5 rounded-lg bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] items-center"
                      >
                        <div className="col-span-3">
                          <select
                            value={item.type}
                            onChange={e => handleUpdateAccessory(item.id, 'type', e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded text-xs"
                          >
                            {PURCHASE_ACCESSORY_TYPES.map(t => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-4">
                          <input
                            type="text"
                            placeholder="Item model or description"
                            value={item.name}
                            onChange={e => handleUpdateAccessory(item.id, 'name', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded text-xs"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            min={1}
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={e => handleUpdateAccessory(item.id, 'quantity', Math.max(1, parseInt(e.target.value, 10) || 1))}
                            className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded text-xs text-center font-semibold"
                          />
                        </div>
                        <div className="col-span-2">
                          <div className="relative">
                            <span className="absolute left-2 top-1.5 text-[10px] text-slate-400">₹</span>
                            <input
                              type="number"
                              min={0}
                              placeholder="Price"
                              value={item.unitCost || ''}
                              onChange={e => handleUpdateAccessory(item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                              className="w-full pl-5 pr-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded text-xs text-right font-bold"
                            />
                          </div>
                        </div>
                        <div className="col-span-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveAccessory(item.id)}
                            className="p-1 rounded text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="Remove accessory"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 6: Invoicing & Custody */}
          <div className="p-4.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0f172a]/40 space-y-3.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>Invoicing, Receipt Document & Allocation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Invoice / Bill Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. INV-2026-0982"
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs font-mono focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={e => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Initial Status
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                >
                  <option value="In Stock">In Stock (IT Store)</option>
                  <option value="Assigned">Assigned to Employee</option>
                  <option value="Under Service">Under Service</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Assign To Staff
                </label>
                <select
                  value={assignedEmployeeId}
                  onChange={e => {
                    setAssignedEmployeeId(e.target.value);
                    if (e.target.value) setStatus('Assigned');
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                >
                  <option value="">-- Leave Unassigned (In Stock) --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.department} • {emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Receipt Upload Drop Zone */}
            <div className="pt-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Attach Bill / Receipt Document (PDF or Image)
              </label>
              <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-center bg-white dark:bg-[#090d16] hover:border-amber-500/50 transition-colors">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {invoiceFileName ? (
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Attached: {invoiceFileName}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                    <UploadCloud className="w-4 h-4 text-slate-400" />
                    <span>Drop receipt file here or click to browse</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Procurement Notes / PO Justification
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Approved quarterly refresh for Engineering department..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#090d16] border border-slate-200 dark:border-[#1e293b] text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
              />
            </div>
          </div>

          {/* Section 7: Auto-Fleet Registration Switch */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0f172a]/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Auto-Register in Fleet Inventory</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Recommended
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Instantly registers {numericQuantity} {deviceType} unit{numericQuantity > 1 ? 's' : ''} in AssetCore with sequential asset tag numbers.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={addToFleet}
                onChange={e => setAddToFleet(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
            </label>
          </div>

        </form>

        {/* Professional Enterprise Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#0d1424]">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                Total Procurement
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  ₹{grandTotalCost.toLocaleString('en-IN')}
                </span>
                {numericQuantity > 1 && (
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    ({numericQuantity} units)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record Purchase</span>
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
