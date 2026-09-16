import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Phone,
  MessageCircle,
  MapPin,
  Building,
  User,
  Plus,
  Edit2,
  Trash2,
  Star,
  Clock,
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Send,
  ExternalLink,
  Laptop,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  Cpu,
  Tv,
  Terminal,
  Activity,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ServiceProvider, ServiceProviderType } from '../../types';

export const SystemPcSupportView: React.FC = () => {
  const {
    serviceProviders,
    addServiceProvider,
    updateServiceProvider,
    deleteServiceProvider,
    activeSystemSupportTicket,
    setActiveSystemSupportTicket,
    selectedServiceProviderId,
    setSelectedServiceProviderId,
    showToast,
    userRole,
  } = useApp();

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServiceType, setSelectedServiceType] = useState<string>('ALL');
  const [onlyPreferred, setOnlyPreferred] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ServiceProvider | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    technicianName: '',
    shopName: '',
    phoneNumber: '',
    whatsappNumber: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    serviceType: 'Hardware Repair & Chip-Level' as ServiceProviderType,
    customServiceType: '',
    rating: 5.0,
    experienceYears: 5,
    workingHours: '10:00 AM - 8:00 PM (Mon-Sat)',
    isPreferred: true,
    remarks: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Available service categories
  const SERVICE_TYPES: ServiceProviderType[] = [
    'Hardware Repair & Chip-Level',
    'Screen & Display Replacement',
    'OS & Enterprise Software Setup',
    'AMC & General Maintenance',
    'Custom',
  ];

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingProvider(null);
    setFormData({
      technicianName: '',
      shopName: '',
      phoneNumber: '',
      whatsappNumber: '',
      email: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      serviceType: 'Hardware Repair & Chip-Level',
      customServiceType: '',
      rating: 5.0,
      experienceYears: 5,
      workingHours: '10:00 AM - 8:00 PM (Mon-Sat)',
      isPreferred: false,
      remarks: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (provider: ServiceProvider) => {
    setEditingProvider(provider);
    const isStandardType = SERVICE_TYPES.includes(provider.serviceType as ServiceProviderType);
    setFormData({
      technicianName: provider.technicianName,
      shopName: provider.shopName,
      phoneNumber: provider.phoneNumber,
      whatsappNumber: provider.whatsappNumber || provider.phoneNumber.replace(/\D/g, ''),
      email: provider.email || '',
      address: provider.address,
      city: provider.city || '',
      state: provider.state || '',
      pincode: provider.pincode || '',
      serviceType: isStandardType ? (provider.serviceType as ServiceProviderType) : 'Custom',
      customServiceType: isStandardType ? '' : provider.serviceType,
      rating: provider.rating || 5.0,
      experienceYears: provider.experienceYears || 5,
      workingHours: provider.workingHours || '10:00 AM - 8:00 PM (Mon-Sat)',
      isPreferred: provider.isPreferred ?? false,
      remarks: provider.remarks || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.technicianName.trim()) {
      errors.technicianName = 'Technician name is required';
    }
    if (!formData.shopName.trim()) {
      errors.shopName = 'Shop / Company name is required';
    }
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    }
    if (!formData.address.trim()) {
      errors.address = 'Shop/Office address is required';
    }
    if (formData.serviceType === 'Custom' && !formData.customServiceType.trim()) {
      errors.customServiceType = 'Please specify the custom service type';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const resolvedServiceType: ServiceProviderType =
      formData.serviceType === 'Custom'
        ? (formData.customServiceType.trim() as ServiceProviderType)
        : formData.serviceType;

    const cleanWhatsapp = formData.whatsappNumber.trim()
      ? formData.whatsappNumber.replace(/\D/g, '')
      : formData.phoneNumber.replace(/\D/g, '');

    const payload = {
      technicianName: formData.technicianName.trim(),
      shopName: formData.shopName.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      whatsappNumber: cleanWhatsapp,
      email: formData.email.trim() || undefined,
      address: formData.address.trim(),
      city: formData.city.trim() || undefined,
      state: formData.state.trim() || undefined,
      pincode: formData.pincode.trim() || undefined,
      serviceType: resolvedServiceType,
      rating: Number(formData.rating),
      experienceYears: Number(formData.experienceYears),
      workingHours: formData.workingHours.trim(),
      isPreferred: formData.isPreferred,
      remarks: formData.remarks.trim() || undefined,
    };

    if (editingProvider) {
      await updateServiceProvider(editingProvider.id, payload);
    } else {
      await addServiceProvider(payload);
    }

    setIsModalOpen(false);
  };

  // Handle WhatsApp Click
  const handleContactOnWhatsApp = (provider: ServiceProvider) => {
    const rawNumber = provider.whatsappNumber || provider.phoneNumber;
    let cleanNumber = rawNumber.replace(/\D/g, '');

    // Default to Indian country code 91 if 10 digits
    if (cleanNumber.length === 10) {
      cleanNumber = '91' + cleanNumber;
    }

    let message = '';
    if (activeSystemSupportTicket) {
      message =
        `Hello ${provider.technicianName},\n\n` +
        `We have a PC/Laptop service request from IT Department.\n` +
        `• Employee: ${activeSystemSupportTicket.employeeName} (${activeSystemSupportTicket.employeeId})\n` +
        `• Workstation / Device: ${activeSystemSupportTicket.deviceName || activeSystemSupportTicket.assetType || 'Laptop'} (${activeSystemSupportTicket.assetNumber || 'N/A'})\n` +
        `• Issue Description: ${activeSystemSupportTicket.problemDescription}\n` +
        (activeSystemSupportTicket.urgency ? `• Urgency: ${activeSystemSupportTicket.urgency}\n` : '') +
        `\nPlease advise on technician availability and repair estimation. Thank you!`;
    } else {
      message =
        `Hello ${provider.technicianName},\n\n` +
        `Reaching out from Enterprise IT Support regarding PC/Laptop repair and hardware maintenance services for our organization (${provider.shopName}).`;
    }

    const encoded = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encoded}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // Filtered providers
  const filteredProviders = useMemo(() => {
    return serviceProviders.filter(p => {
      const matchesSearch =
        p.technicianName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.city && p.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.remarks && p.remarks.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = selectedServiceType === 'ALL' || p.serviceType === selectedServiceType;
      const matchesPreferred = !onlyPreferred || p.isPreferred;

      return matchesSearch && matchesType && matchesPreferred;
    });
  }, [serviceProviders, searchQuery, selectedServiceType, onlyPreferred]);

  // Provider category icon helper
  const getServiceTypeIcon = (type: string) => {
    if (type.toLowerCase().includes('chip') || type.toLowerCase().includes('hardware')) {
      return <Cpu className="w-4 h-4 text-amber-400" />;
    }
    if (type.toLowerCase().includes('screen') || type.toLowerCase().includes('display')) {
      return <Tv className="w-4 h-4 text-cyan-400" />;
    }
    if (type.toLowerCase().includes('software') || type.toLowerCase().includes('os')) {
      return <Terminal className="w-4 h-4 text-emerald-400" />;
    }
    if (type.toLowerCase().includes('amc') || type.toLowerCase().includes('maintenance')) {
      return <Activity className="w-4 h-4 text-indigo-400" />;
    }
    return <Wrench className="w-4 h-4 text-sky-400" />;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold tracking-wide uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              IT Infrastructure Support & Fleet Maintenance
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <span className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/30">
                <Wrench className="w-6 h-6" />
              </span>
              System / PC Support & Service Providers
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Centralized registry of verified hardware technicians, chip-level repair shops, screen specialists, and AMC partners. Contact vendors directly via WhatsApp for rapid laptop/PC repair dispatch.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Repair Provider
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3.5 backdrop-blur-sm">
            <div className="text-xs text-slate-400 font-medium">Total Providers</div>
            <div className="text-xl font-bold text-white mt-1 flex items-baseline gap-2">
              {serviceProviders.length}
              <span className="text-xs text-emerald-400 font-normal">Active Verified</span>
            </div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3.5 backdrop-blur-sm">
            <div className="text-xs text-slate-400 font-medium">Preferred Partners</div>
            <div className="text-xl font-bold text-amber-400 mt-1 flex items-baseline gap-2">
              {serviceProviders.filter(p => p.isPreferred).length}
              <span className="text-xs text-slate-400 font-normal">Priority SLAs</span>
            </div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3.5 backdrop-blur-sm">
            <div className="text-xs text-slate-400 font-medium">WhatsApp Enabled</div>
            <div className="text-xl font-bold text-emerald-400 mt-1 flex items-baseline gap-2">
              {serviceProviders.filter(p => p.whatsappNumber || p.phoneNumber).length}
              <span className="text-xs text-slate-400 font-normal">Instant Dispatch</span>
            </div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3.5 backdrop-blur-sm">
            <div className="text-xs text-slate-400 font-medium">Service Categories</div>
            <div className="text-xl font-bold text-indigo-400 mt-1 flex items-baseline gap-2">
              {new Set(serviceProviders.map(p => p.serviceType)).size}
              <span className="text-xs text-slate-400 font-normal">Specializations</span>
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVE TICKET CONTEXT BANNER (When navigated from Approved Request) */}
      {activeSystemSupportTicket && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border-2 border-amber-500/40 p-5 md:p-6 shadow-xl relative overflow-hidden backdrop-blur-xl animate-fadeIn">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shrink-0 shadow-lg">
                <Laptop className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold text-xs border border-amber-500/40 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Active Request Under Resolution
                  </span>
                  {activeSystemSupportTicket.urgency && (
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        activeSystemSupportTicket.urgency === 'Critical' || activeSystemSupportTicket.urgency === 'High'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {activeSystemSupportTicket.urgency} Priority
                    </span>
                  )}
                  <span className="text-xs text-slate-400">ID: {activeSystemSupportTicket.requestId}</span>
                </div>

                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {activeSystemSupportTicket.employeeName}
                  <span className="text-slate-400 font-normal text-sm">
                    ({activeSystemSupportTicket.employeeId}) • {activeSystemSupportTicket.deviceName || activeSystemSupportTicket.assetType || 'Laptop'} [{activeSystemSupportTicket.assetNumber || 'Unassigned'}]
                  </span>
                </h3>

                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-sm text-slate-300 max-w-3xl">
                  <strong className="text-amber-400 mr-1">Reported Problem:</strong> {activeSystemSupportTicket.problemDescription}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <button
                onClick={() => {
                  setActiveSystemSupportTicket(null);
                  setSelectedServiceProviderId(null);
                  showToast('Support ticket context cleared.', 'info');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Dismiss Banner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-xl backdrop-blur-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by technician name, shop, city, address, phone or specialty..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedServiceType}
              onChange={e => setSelectedServiceType(e.target.value)}
              className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer pr-8"
            >
              <option value="ALL">All Service Types ({serviceProviders.length})</option>
              {SERVICE_TYPES.filter(t => t !== 'Custom').map(type => (
                <option key={type} value={type}>
                  {type} ({serviceProviders.filter(p => p.serviceType === type).length})
                </option>
              ))}
            </select>
          </div>

          {/* Preferred Filter */}
          <button
            onClick={() => setOnlyPreferred(!onlyPreferred)}
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
              onlyPreferred
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-lg shadow-amber-500/10'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${onlyPreferred ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
            Preferred Only
          </button>
        </div>
      </div>

      {/* Service Providers Grid */}
      {filteredProviders.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 backdrop-blur-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400 mb-4">
            <Wrench className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Service Providers Found</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
            {searchQuery || selectedServiceType !== 'ALL' || onlyPreferred
              ? 'No service providers match your current filters. Try resetting search criteria or add a new provider.'
              : 'There are no PC/laptop service providers registered in the database yet.'}
          </p>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First Provider
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
          {filteredProviders.map(provider => {
            const isSelected = selectedServiceProviderId === provider.id;

            return (
              <div
                key={provider.id}
                className={`group relative rounded-2xl border transition-all duration-300 p-6 flex flex-col justify-between backdrop-blur-xl ${
                  isSelected
                    ? 'bg-gradient-to-b from-indigo-950/60 to-slate-900 border-indigo-500/60 shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-500/40'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90 shadow-lg'
                }`}
              >
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 font-bold text-lg shadow-inner">
                        {provider.technicianName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base md:text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                            {provider.technicianName}
                          </h3>
                          {provider.isPreferred && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-semibold tracking-wide">
                              <Star className="w-2.5 h-2.5 fill-amber-400" />
                              Preferred
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-slate-300 flex items-center gap-1.5 mt-0.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          {provider.shopName}
                        </p>
                      </div>
                    </div>

                    {/* Action Controls for Admin */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEditModal(provider)}
                        title="Edit Provider"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(provider.id)}
                        title="Delete Provider"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Badge & Rating Row */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-indigo-300">
                      {getServiceTypeIcon(provider.serviceType)}
                      {provider.serviceType}
                    </span>

                    {provider.rating && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-300">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {provider.rating.toFixed(1)}
                      </span>
                    )}

                    {provider.experienceYears && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-slate-500" />
                        {provider.experienceYears}+ yrs exp
                      </span>
                    )}
                  </div>

                  {/* Details List */}
                  <div className="space-y-2 text-xs text-slate-300 bg-slate-950/40 rounded-xl p-3.5 border border-slate-800/80 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        Mobile / Calling:
                      </span>
                      <a
                        href={`tel:${provider.phoneNumber}`}
                        className="font-mono text-indigo-400 hover:text-indigo-300 hover:underline font-semibold"
                      >
                        {provider.phoneNumber}
                      </a>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                        WhatsApp Direct:
                      </span>
                      <span className="font-mono text-emerald-400 font-semibold">
                        +{provider.whatsappNumber || provider.phoneNumber.replace(/\D/g, '')}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-800/60">
                      <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        Address:
                      </span>
                      <span className="text-right text-slate-300">
                        {provider.address}
                        {provider.city ? `, ${provider.city}` : ''}
                        {provider.pincode ? ` - ${provider.pincode}` : ''}
                      </span>
                    </div>

                    {provider.workingHours && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          Hours:
                        </span>
                        <span className="text-slate-300 font-medium">{provider.workingHours}</span>
                      </div>
                    )}

                    {provider.remarks && (
                      <div className="pt-2 border-t border-slate-800/60 text-slate-400 italic">
                        "{provider.remarks}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleContactOnWhatsApp(provider)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <MessageCircle className="w-4 h-4 fill-white/20" />
                    Contact on WhatsApp
                  </button>

                  {activeSystemSupportTicket && (
                    <button
                      onClick={() => {
                        setSelectedServiceProviderId(provider.id);
                        showToast(`Selected "${provider.technicianName}" for active service ticket.`, 'success');
                      }}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border-slate-700'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          Assigned Vendor
                        </>
                      ) : (
                        'Select Vendor'
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT SERVICE PROVIDER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingProvider ? 'Edit Service Provider' : 'Add New PC / Laptop Repair Provider'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Register hardware technician, chip-level shop, or AMC maintenance vendor
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Technician Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Technician / Contact Person <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Rakesh Sharma"
                      value={formData.technicianName}
                      onChange={e => setFormData({ ...formData, technicianName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  {formErrors.technicianName && (
                    <p className="text-rose-400 text-xs mt-1">{formErrors.technicianName}</p>
                  )}
                </div>

                {/* Shop / Company Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Shop / Company Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Apex PC Care & Chip Repair"
                      value={formData.shopName}
                      onChange={e => setFormData({ ...formData, shopName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  {formErrors.shopName && <p className="text-rose-400 text-xs mt-1">{formErrors.shopName}</p>}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Mobile / Phone Number <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. +91 98112-98765"
                      value={formData.phoneNumber}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData({
                          ...formData,
                          phoneNumber: val,
                          whatsappNumber: formData.whatsappNumber || val.replace(/\D/g, ''),
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  {formErrors.phoneNumber && (
                    <p className="text-rose-400 text-xs mt-1">{formErrors.phoneNumber}</p>
                  )}
                </div>

                {/* WhatsApp Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    WhatsApp Direct Number
                  </label>
                  <div className="relative">
                    <MessageCircle className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. 9811298765 (digits only)"
                      value={formData.whatsappNumber}
                      onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Service Type */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Service Type & Specialization <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.serviceType}
                    onChange={e =>
                      setFormData({ ...formData, serviceType: e.target.value as ServiceProviderType })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    {SERVICE_TYPES.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Service Type Input */}
                {formData.serviceType === 'Custom' && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-1.5">
                      Specify Custom Service Type <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Data Recovery & Forensic Drive Imaging"
                      value={formData.customServiceType}
                      onChange={e => setFormData({ ...formData, customServiceType: e.target.value })}
                      className="w-full bg-slate-950 border border-indigo-500/50 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
                    />
                    {formErrors.customServiceType && (
                      <p className="text-rose-400 text-xs mt-1">{formErrors.customServiceType}</p>
                    )}
                  </div>
                )}

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Shop / Service Center Address <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <textarea
                      rows={2}
                      placeholder="e.g. Shop #108, Nehru Place Tech Complex"
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  {formErrors.address && <p className="text-rose-400 text-xs mt-1">{formErrors.address}</p>}
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. New Delhi"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* State / Pincode */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      State
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Delhi"
                      value={formData.state}
                      onChange={e => setFormData({ ...formData, state: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Pincode
                    </label>
                    <input
                      type="text"
                      placeholder="110019"
                      value={formData.pincode}
                      onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Rating & Experience */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Rating (1 - 5)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={formData.rating}
                      onChange={e => setFormData({ ...formData, rating: parseFloat(e.target.value) || 5 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Experience (Yrs)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={formData.experienceYears}
                      onChange={e => setFormData({ ...formData, experienceYears: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Working Hours */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Working Hours
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10:00 AM - 8:30 PM (Mon-Sat)"
                    value={formData.workingHours}
                    onChange={e => setFormData({ ...formData, workingHours: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Preferred Partner Toggle */}
                <div className="md:col-span-2 flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <Star className={`w-4 h-4 ${formData.isPreferred ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                    <div>
                      <div className="text-xs font-semibold text-white">Mark as Preferred IT Partner</div>
                      <div className="text-[11px] text-slate-400">Preferred partners appear highlighted at the top of service vendor lists</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isPreferred}
                    onChange={e => setFormData({ ...formData, isPreferred: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 bg-slate-800 border-slate-700 rounded focus:ring-indigo-500"
                  />
                </div>

                {/* Remarks */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Notes & Specializations
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Expert in Dell/HP motherboard chip-level repair, BGA reballing, and thermal paste replacement."
                    value={formData.remarks}
                    onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <Check className="w-4 h-4" />
                  {editingProvider ? 'Save Changes' : 'Register Provider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Delete Service Provider?</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to remove this service provider from the database? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteServiceProvider(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30"
              >
                Delete Provider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
