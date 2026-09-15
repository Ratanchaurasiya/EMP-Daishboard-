import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PurchaseRecord } from '../../types';
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  Download,
  Laptop,
  Monitor,
  Smartphone,
  Tv,
  Keyboard,
  Mouse,
  Headphones,
  Plug,
  Package,
  Calendar,
  Building2,
  DollarSign,
  Eye,
  Edit2,
  Trash2,
  Layers,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Wrench,
  AlertCircle,
  FileCheck,
  FileText,
  Paperclip,
  Tag,
} from 'lucide-react';
import { AddPurchaseModal } from './AddPurchaseModal';
import { EditPurchaseModal } from './EditPurchaseModal';
import { PurchaseDetailModal } from './PurchaseDetailModal';
import { UploadReceiptModal } from './UploadReceiptModal';
import { ReceiptPreviewModal } from './ReceiptPreviewModal';

const getAssetIcon = (type: string) => {
  switch (type) {
    case 'Laptop':
      return Laptop;
    case 'PC':
      return Monitor;
    case 'Mobile Phone':
      return Smartphone;
    case 'Monitor':
      return Tv;
    case 'Keyboard':
      return Keyboard;
    case 'Mouse':
      return Mouse;
    case 'Headset':
      return Headphones;
    case 'Docking Station':
      return Plug;
    default:
      return Package;
  }
};

const getAssetTypeColor = (type: string) => {
  switch (type) {
    case 'Laptop':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'PC':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    case 'Mobile Phone':
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    case 'Monitor':
      return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
    case 'Keyboard':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'Mouse':
      return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20';
    case 'Headset':
      return 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20';
    case 'Docking Station':
      return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    default:
      return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
  }
};

export const PurchaseManagementView: React.FC = () => {
  const { purchases, removePurchaseRecord, updatePurchaseRecord } = useApp();

  // Modal controls
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseRecord | null>(null);
  const [viewingPurchase, setViewingPurchase] = useState<PurchaseRecord | null>(null);
  const [uploadReceiptPurchaseId, setUploadReceiptPurchaseId] = useState<string | null>(null);
  const [showUploadReceiptModal, setShowUploadReceiptModal] = useState<boolean>(false);
  const [previewReceiptPurchase, setPreviewReceiptPurchase] = useState<PurchaseRecord | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDeviceType, setFilterDeviceType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'cost' | 'brand'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // KPI Metrics Calculation
  const stats = useMemo(() => {
    const totalPurchases = purchases.length;
    const totalUnitsCount = purchases.reduce((sum, p) => sum + (p.quantity || 1), 0);
    const totalDeviceCost = purchases.reduce((sum, p) => sum + (Number(p.deviceCost) || 0), 0);
    const totalAccessoriesCost = purchases.reduce((sum, p) => sum + (Number(p.totalAccessoriesCost) || 0), 0);
    const grandTotalCost = purchases.reduce((sum, p) => sum + (Number(p.grandTotalCost) || 0), 0);

    const computersCount = purchases
      .filter(p => p.deviceType === 'Laptop' || p.deviceType === 'PC')
      .reduce((sum, p) => sum + (p.quantity || 1), 0);
    const phonesCount = purchases
      .filter(p => p.deviceType === 'Mobile Phone')
      .reduce((sum, p) => sum + (p.quantity || 1), 0);
    const monitorsCount = purchases
      .filter(p => p.deviceType === 'Monitor')
      .reduce((sum, p) => sum + (p.quantity || 1), 0);
    const accessoriesCount = purchases
      .filter(p => !['Laptop', 'PC', 'Mobile Phone', 'Monitor'].includes(p.deviceType))
      .reduce((sum, p) => sum + (p.quantity || 1), 0);

    const inStockCount = purchases.filter(p => p.status === 'In Stock').length;
    const assignedCount = purchases.filter(p => p.status === 'Assigned').length;

    const bundledAccessoriesCount = purchases.reduce((sum, p) => sum + (p.accessories?.length || 0), 0);
    const receiptsCount = purchases.filter(p => !!p.invoiceFileUrl || !!p.invoiceNumber).length;

    return {
      totalPurchases,
      totalUnitsCount,
      totalDeviceCost,
      totalAccessoriesCost,
      grandTotalCost,
      computersCount,
      phonesCount,
      monitorsCount,
      accessoriesCount,
      inStockCount,
      assignedCount,
      bundledAccessoriesCount,
      receiptsCount,
    };
  }, [purchases]);

  // Filtered & Sorted list
  const filteredPurchases = useMemo(() => {
    return purchases
      .filter(p => {
        // Device Type filter
        if (filterDeviceType !== 'all' && p.deviceType !== filterDeviceType) {
          return false;
        }

        // Status filter
        if (filterStatus !== 'all' && p.status !== filterStatus) {
          return false;
        }

        // Search Term
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchPO = (p.purchaseNumber || '').toLowerCase().includes(q);
          const matchType = (p.deviceType || '').toLowerCase().includes(q);
          const matchBrand = (p.brand || '').toLowerCase().includes(q);
          const matchModel = (p.modelName || '').toLowerCase().includes(q);
          const matchModelNo = (p.modelNumber || '').toLowerCase().includes(q);
          const matchSerial = (p.serialNumber || '').toLowerCase().includes(q);
          const matchVendor = (p.vendor || '').toLowerCase().includes(q);
          const matchInv = (p.invoiceNumber || '').toLowerCase().includes(q);
          const matchEmp = (p.assignedEmployeeName || '').toLowerCase().includes(q);
          const matchNotes = (p.notes || '').toLowerCase().includes(q);
          const matchPhone = (p.phoneNumber || '').toLowerCase().includes(q);
          const matchIMEI = (p.imeiNumber || '').toLowerCase().includes(q);
          const matchSpecs = (p.specsDetails || '').toLowerCase().includes(q);
          const matchTags = (p.assignedAssetIds || []).some(id => id.toLowerCase().includes(q));
          const matchAccessories = (p.accessories || []).some(
            acc =>
              (acc.name || '').toLowerCase().includes(q) ||
              (acc.type || '').toLowerCase().includes(q) ||
              (acc.serialNumber || '').toLowerCase().includes(q)
          );

          if (
            !matchPO &&
            !matchType &&
            !matchBrand &&
            !matchModel &&
            !matchModelNo &&
            !matchSerial &&
            !matchVendor &&
            !matchInv &&
            !matchEmp &&
            !matchNotes &&
            !matchPhone &&
            !matchIMEI &&
            !matchSpecs &&
            !matchTags &&
            !matchAccessories
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'date') {
          cmp = new Date(a.purchaseDate || 0).getTime() - new Date(b.purchaseDate || 0).getTime();
        } else if (sortBy === 'cost') {
          cmp = (a.grandTotalCost || 0) - (b.grandTotalCost || 0);
        } else if (sortBy === 'brand') {
          cmp = (a.brand || '').localeCompare(b.brand || '');
        }
        return sortOrder === 'asc' ? cmp : -cmp;
      });
  }, [purchases, searchTerm, filterDeviceType, filterStatus, sortBy, sortOrder]);

  const handleDelete = (id: string, poNumber: string) => {
    if (confirm(`Are you sure you want to permanently delete purchase record ${poNumber}?`)) {
      removePurchaseRecord(id);
    }
  };

  const handleRemoveReceipt = (purchaseId: string) => {
    updatePurchaseRecord(purchaseId, {
      invoiceFileName: undefined,
      invoiceFileUrl: undefined,
    });
  };

  const handleExportCSV = () => {
    if (purchases.length === 0) {
      alert('No purchase records to export.');
      return;
    }

    const headers = [
      'PO Number',
      'Asset Category',
      'Brand',
      'Model Name',
      'Model Number',
      'Serial Number',
      'Quantity',
      'Unit Cost (INR)',
      'Total Asset Cost (INR)',
      'Purchase Date',
      'Vendor',
      'Processor',
      'RAM',
      'Storage',
      'OS',
      'Phone Number',
      'IMEI Number',
      'Screen Size',
      'Specs Details',
      'Warranty Details',
      'Warranty Expiry',
      'Invoice Number',
      'Invoice Date',
      'Has Receipt File',
      'Registered Fleet Tags',
      'Bundled Accessories Count',
      'Bundled Accessories Details',
      'Total Accessories Cost (INR)',
      'Grand Total Cost (INR)',
      'Status',
      'Assigned Employee',
      'Notes',
    ];

    const rows = purchases.map(p => {
      const accessoriesSummary = (p.accessories || [])
        .map(a => `${a.type}: ${a.name || ''} (Qty: ${a.quantity}, Cost: ₹${a.totalCost})`)
        .join(' | ');

      const tagsSummary = (p.assignedAssetIds || []).join('; ');

      return [
        `"${p.purchaseNumber}"`,
        `"${p.deviceType}"`,
        `"${p.brand}"`,
        `"${p.modelName}"`,
        `"${p.modelNumber || ''}"`,
        `"${p.serialNumber || ''}"`,
        p.quantity || 1,
        p.unitCost || p.deviceCost,
        p.deviceCost,
        `"${p.purchaseDate}"`,
        `"${p.vendor || ''}"`,
        `"${p.processor || ''}"`,
        `"${p.ram || ''}"`,
        `"${p.storage || ''}"`,
        `"${p.os || ''}"`,
        `"${p.phoneNumber || ''}"`,
        `"${p.imeiNumber || ''}"`,
        `"${p.screenSize || ''}"`,
        `"${(p.specsDetails || '').replace(/"/g, '""')}"`,
        `"${p.warrantyPeriod || ''}"`,
        `"${p.warrantyExpiryDate || ''}"`,
        `"${p.invoiceNumber || ''}"`,
        `"${p.invoiceDate || ''}"`,
        p.invoiceFileUrl ? 'Yes' : 'No',
        `"${tagsSummary}"`,
        p.accessories?.length || 0,
        `"${accessoriesSummary.replace(/"/g, '""')}"`,
        p.totalAccessoriesCost,
        p.grandTotalCost,
        `"${p.status}"`,
        `"${p.assignedEmployeeName || 'Unassigned'}"`,
        `"${(p.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Fleet_Purchase_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-sm">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                IT Fleet & Asset Purchase Management
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {purchases.length} Orders ({stats.totalUnitsCount} Units)
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Complete procurement records for computers, mobile phones, peripherals, accessories, and company assets
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => setShowUploadReceiptModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 transition-colors shadow-xs cursor-pointer"
          >
            <FileCheck className="w-4 h-4" />
            Upload Receipt / Bill
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-xl shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Record Purchase
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Grand Total Investment */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-750 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Grand Total Capital
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              ₹{stats.grandTotalCost.toLocaleString('en-IN')}
            </span>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <span>₹{stats.totalDeviceCost.toLocaleString('en-IN')} (Assets)</span>
              <span>+</span>
              <span>₹{stats.totalAccessoriesCost.toLocaleString('en-IN')} (Bundled)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Devices & Assets Breakdown */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-750 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Fleet Units Purchased
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.totalUnitsCount} Units
            </span>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {stats.computersCount} PCs • {stats.phonesCount} Phones • {stats.monitorsCount} Displays • {stats.accessoriesCount} Peripherals
            </div>
          </div>
        </div>

        {/* Card 3: Accessories Spend */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-750 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Peripherals & Bundled
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
              ₹{stats.totalAccessoriesCost.toLocaleString('en-IN')}
            </span>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {stats.bundledAccessoriesCount} bundled items with orders
            </div>
          </div>
        </div>

        {/* Card 4: Inventory Deployment & Receipts */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-750 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Fleet Status & Receipts
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.assignedCount} Assigned
            </span>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {stats.inStockCount} In Stock • {stats.receiptsCount} Invoices Attached
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-750 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search PO #, category, brand, model, serial, vendor, tag..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Asset Type Filter */}
          <select
            value={filterDeviceType}
            onChange={e => setFilterDeviceType(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Asset Categories</option>
            <option value="Laptop">Laptops</option>
            <option value="PC">PC / Workstations</option>
            <option value="Mobile Phone">Mobile Phones</option>
            <option value="Monitor">Monitors</option>
            <option value="Keyboard">Keyboards</option>
            <option value="Mouse">Mice</option>
            <option value="Headset">Headsets</option>
            <option value="Docking Station">Docking Stations</option>
            <option value="Other">Other Assets</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Assigned">Assigned</option>
            <option value="Under Service">Under Service</option>
            <option value="Retired">Retired</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300"
          >
            <option value="date">Sort by Date</option>
            <option value="cost">Sort by Total Cost</option>
            <option value="brand">Sort by Brand</option>
          </select>

          <button
            onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
            title="Toggle sort direction"
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Purchases Table */}
      <div className="bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-750 rounded-2xl shadow-sm overflow-hidden">
        {filteredPurchases.length === 0 ? (
          <div className="text-center py-16 px-4">
            <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No purchase records found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {purchases.length === 0
                ? 'Record your first purchase order for laptops, PCs, mobile phones, monitors, or accessories.'
                : 'No records matched your search filters. Try adjusting your query.'}
            </p>
            {purchases.length === 0 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Record First Purchase
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">PO & Date</th>
                  <th className="py-3.5 px-4">Asset Details</th>
                  <th className="py-3.5 px-4">Specifications</th>
                  <th className="py-3.5 px-4">Vendor & Bill / Receipt</th>
                  <th className="py-3.5 px-4 text-center">Bundled</th>
                  <th className="py-3.5 px-4 text-right">Cost Breakdown</th>
                  <th className="py-3.5 px-4 text-center">Status / Custody</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPurchases.map(purchase => {
                  const AssetIcon = getAssetIcon(purchase.deviceType);
                  const colorClass = getAssetTypeColor(purchase.deviceType);
                  const qty = purchase.quantity || 1;
                  const isComputer = purchase.deviceType === 'Laptop' || purchase.deviceType === 'PC';
                  const isPhone = purchase.deviceType === 'Mobile Phone';
                  const isMonitor = purchase.deviceType === 'Monitor';

                  return (
                    <tr
                      key={purchase.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* PO & Date */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 dark:text-white block">
                          {purchase.purchaseNumber}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {purchase.purchaseDate || 'N/A'}
                        </span>
                      </td>

                      {/* Asset Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl border shrink-0 ${colorClass}`}>
                            <AssetIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {purchase.brand} {purchase.modelName}
                              </span>
                              {qty > 1 && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                  ×{qty}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="font-medium text-amber-600 dark:text-amber-400">
                                {purchase.deviceType}
                              </span>
                              {purchase.serialNumber && (
                                <span className="font-mono text-slate-400">
                                  SN: {purchase.serialNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Specs */}
                      <td className="py-3.5 px-4 text-[11px] text-slate-600 dark:text-slate-300">
                        {isComputer ? (
                          <>
                            <div>
                              <strong>{purchase.processor || 'CPU'}</strong> • {purchase.ram || 'RAM'}
                            </div>
                            <div className="text-slate-500 dark:text-slate-400">
                              {purchase.storage || 'SSD'} • {purchase.os || 'OS'}
                            </div>
                          </>
                        ) : isPhone ? (
                          <>
                            <div>
                              <strong>SIM:</strong> {purchase.phoneNumber || 'Not configured'}
                            </div>
                            <div className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                              IMEI: {purchase.imeiNumber || 'N/A'}
                            </div>
                          </>
                        ) : isMonitor ? (
                          <>
                            <div>
                              <strong>{purchase.screenSize || 'Display'}</strong>
                            </div>
                            <div className="text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                              {purchase.specsDetails || 'Full HD / IPS'}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="truncate max-w-[180px]">
                              {purchase.specsDetails || 'Standard Enterprise Gear'}
                            </div>
                            {qty > 1 && purchase.unitCost && (
                              <div className="text-slate-500 dark:text-slate-400 text-[10px]">
                                ₹{purchase.unitCost.toLocaleString('en-IN')} / unit
                              </div>
                            )}
                          </>
                        )}

                        {/* Registered tags badge preview */}
                        {purchase.assignedAssetIds && purchase.assignedAssetIds.length > 0 && (
                          <div className="mt-1 flex items-center gap-1 flex-wrap">
                            {purchase.assignedAssetIds.slice(0, 2).map((tag, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.2 rounded font-mono text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              >
                                {tag}
                              </span>
                            ))}
                            {purchase.assignedAssetIds.length > 2 && (
                              <span className="text-[9px] text-slate-400">
                                +{purchase.assignedAssetIds.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Vendor & Receipt / Bill */}
                      <td className="py-3.5 px-4 text-[11px]">
                        <span className="font-medium text-slate-800 dark:text-slate-200 block">
                          {purchase.vendor || 'Direct / Supplier'}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 block">
                          {purchase.invoiceNumber ? `Bill #: ${purchase.invoiceNumber}` : 'No Bill #'}
                        </span>
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          {purchase.invoiceFileUrl ? (
                            <button
                              onClick={() => setPreviewReceiptPurchase(purchase)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/25 transition-colors cursor-pointer"
                              title="Click to preview, print or download receipt"
                            >
                              <FileCheck className="w-3 h-3 text-emerald-500" />
                              <span>View Receipt</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setUploadReceiptPurchaseId(purchase.id)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border border-dashed border-amber-500/40 transition-colors cursor-pointer"
                              title="Attach / upload receipt or bill for this device"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>Add Receipt</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Bundled Accessories */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                          <ShoppingBag className="w-3 h-3" />
                          {purchase.accessories?.length || 0} items
                        </span>
                      </td>

                      {/* Cost Breakdown */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-slate-900 dark:text-emerald-400 text-sm">
                          ₹{(purchase.grandTotalCost || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {qty > 1 && purchase.unitCost
                            ? `${qty} × ₹${purchase.unitCost.toLocaleString('en-IN')}`
                            : `₹${(purchase.deviceCost || 0).toLocaleString('en-IN')}`}
                          {(purchase.totalAccessoriesCost || 0) > 0 && ` + ₹${(purchase.totalAccessoriesCost || 0).toLocaleString('en-IN')} acc`}
                        </div>
                      </td>

                      {/* Status & Custody */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            purchase.status === 'Assigned'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : purchase.status === 'In Stock'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {purchase.status}
                        </span>
                        {purchase.assignedEmployeeName && (
                          <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[120px] mx-auto">
                            {purchase.assignedEmployeeName}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingPurchase(purchase)}
                            title="View Details"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (purchase.invoiceFileUrl) {
                                setPreviewReceiptPurchase(purchase);
                              } else {
                                setUploadReceiptPurchaseId(purchase.id);
                              }
                            }}
                            title={purchase.invoiceFileUrl ? 'View Attached Receipt' : 'Upload Receipt / Bill'}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                          >
                            <FileCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingPurchase(purchase)}
                            title="Edit Purchase Record"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(purchase.id, purchase.purchaseNumber)}
                            title="Delete Record"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddPurchaseModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Edit Modal */}
      {editingPurchase && (
        <EditPurchaseModal
          isOpen={!!editingPurchase}
          purchase={editingPurchase}
          onClose={() => setEditingPurchase(null)}
        />
      )}

      {/* Detail Modal */}
      {viewingPurchase && (
        <PurchaseDetailModal
          isOpen={!!viewingPurchase}
          purchase={viewingPurchase}
          onClose={() => setViewingPurchase(null)}
          onEdit={p => setEditingPurchase(p)}
          onOpenUploadReceipt={id => setUploadReceiptPurchaseId(id)}
          onOpenPreviewReceipt={p => setPreviewReceiptPurchase(p)}
        />
      )}

      {/* Upload / Attach Receipt Modal */}
      {(uploadReceiptPurchaseId || showUploadReceiptModal) && (
        <UploadReceiptModal
          isOpen={!!uploadReceiptPurchaseId || showUploadReceiptModal}
          purchaseId={uploadReceiptPurchaseId}
          onClose={() => {
            setUploadReceiptPurchaseId(null);
            setShowUploadReceiptModal(false);
          }}
        />
      )}

      {/* View & Print Receipt Lightbox Modal */}
      {previewReceiptPurchase && (
        <ReceiptPreviewModal
          isOpen={!!previewReceiptPurchase}
          purchase={previewReceiptPurchase}
          onClose={() => setPreviewReceiptPurchase(null)}
          onOpenUpload={id => setUploadReceiptPurchaseId(id)}
          onRemoveReceipt={handleRemoveReceipt}
        />
      )}
    </div>
  );
};
