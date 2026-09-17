import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateComputerServiceSummary } from '../../utils/calculations';
import { formatCurrency, formatDateDisplay, maskSensitive } from '../../utils/formatters';
import {
  AssetStatusBadge,
  ConditionBadge,
  ProblemCategoryBadge,
  ServiceStatusBadge,
} from '../common/Badge';
import { EmployeeAvatar } from '../common/EmployeeAvatar';
import { ProblemCategory, SimCard, SimRecharge, ServiceRecord } from '../../types';
import {
  User,
  Shield,
  Laptop,
  Monitor,
  Mouse,
  Keyboard,
  Headphones,
  Smartphone,
  Layers,
  Cpu,
  CircuitBoard,
  HardDrive,
  Wrench,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  Copy,
  Check,
  Plus,
  ShieldCheck,
  Lock,
  HelpCircle,
  X,
  Send,
  Bell,
  Mail,
  ExternalLink,
  Camera,
  Loader2,
  IndianRupee,
  FileText,
  UploadCloud,
  Eye,
  Paperclip,
  Building2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { EmployeeWeeklyPhotoSection } from '../documentation/EmployeeWeeklyPhotoSection';
import {
  IT_SUPPORT_EMAIL,
  dispatchServiceTicketEmail,
  ServiceTicketEmailPayload,
} from '../../utils/emailService';
import { getEmployeeAssignedCompanyAssets } from '../../utils/assetUtils';
import { SubmitAssetRequestModal } from '../requests/SubmitAssetRequestModal';
import { RequestSimModal } from '../sim/RequestSimModal';
import { ReportSimIssueModal } from '../sim/ReportSimIssueModal';
import { ServiceReceiptPreviewModal } from '../services/ServiceReceiptPreviewModal';
import { UploadServiceReceiptModal } from '../services/UploadServiceReceiptModal';
import { getSimStatusStyle, getSimPurposeStyle, getSimTypeBadgeStyle, generateSimSuspensionWhatsAppUrl, calculateSimMonthlyExpense, formatINR, getEmployeeSimCards, getEmployeeActiveSimCards, getSimUsageBadgeStyle } from '../../utils/simUtils';

interface EmployeeDashboardProps {
  onOpenReportIssue?: () => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = () => {
  const {
    employees,
    computers,
    assets,
    serviceRecords,
    allocationRecords,
    assetRequests,
    simCards,
    simRequests,
    simRecharges,
    currentUser,
    userRole,
    updateEmployee,
    addServiceRecord,
    showToast,
    activeTab,
    setActiveTab,
    selectedEmployeeId,
    setSelectedEmployeeId,
  } = useApp();

  // Active sub-tab in employee dashboard for fast navigation
  const [activeSection, setActiveSection] = useState<'all' | 'workstation' | 'assets' | 'photos' | 'maintenance' | 'requests' | 'updates' | 'sim-cards'>('all');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Multi-asset equipment request modal state
  const [showAssetRequestModal, setShowAssetRequestModal] = useState<boolean>(false);

  // SIM Modal States
  const [showSimRequestModal, setShowSimRequestModal] = useState<boolean>(false);
  const [simModalDefaultType, setSimModalDefaultType] = useState<'Additional SIM' | 'Suspend SIM'>('Additional SIM');
  const [showReportIssueModal, setShowReportIssueModal] = useState<boolean>(false);
  const [selectedSimForIssue, setSelectedSimForIssue] = useState<SimCard | null>(null);

  // Sync activeSection whenever activeTab changes from Sidebar or URL
  useEffect(() => {
    if (activeTab === 'workstation') {
      setActiveSection('workstation');
    } else if (activeTab === 'assets') {
      setActiveSection('assets');
    } else if (activeTab === 'services') {
      setActiveSection('maintenance');
    } else if (activeTab === 'requests') {
      setActiveSection('requests');
    } else if (activeTab === 'weekly-photos') {
      setActiveSection('photos');
    } else if (activeTab === 'sim-management' || activeTab === 'sim-cards') {
      setActiveSection('sim-cards');
    } else if (activeTab === 'dashboard' || !activeTab) {
      setActiveSection('all');
    }
  }, [activeTab]);

  // Self-service issue reporting modal state
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [problemCategory, setProblemCategory] = useState<ProblemCategory>('Slow Performance');
  const [problemDescription, setProblemDescription] = useState('');
  const [issueUrgency, setIssueUrgency] = useState<'Normal' | 'High' | 'Critical'>('Normal');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [reportRepairCost, setReportRepairCost] = useState<number>(0);
  const [reportReceiptNumber, setReportReceiptNumber] = useState<string>('');
  const [reportReceiptDate, setReportReceiptDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [reportReceiptFileName, setReportReceiptFileName] = useState<string>('');
  const [reportReceiptFileUrl, setReportReceiptFileUrl] = useState<string>('');
  const [reportReceiptFileSize, setReportReceiptFileSize] = useState<number>(0);
  const [reportReceiptError, setReportReceiptError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicketResult, setSubmittedTicketResult] = useState<{
    ticketId: string;
    gmailComposeUrl: string;
    mailtoUrl: string;
    subject: string;
    body: string;
    deviceName: string;
    assetNumber: string;
  } | null>(null);
  const [dispatchedTicketInfo, setDispatchedTicketInfo] = useState<{
    gmailUrl: string;
    subject: string;
    ticketId: string;
  } | null>(null);

  // Receipt Modal States
  const [previewReceiptRecord, setPreviewReceiptRecord] = useState<ServiceRecord | null>(null);
  const [uploadReceiptRecordId, setUploadReceiptRecordId] = useState<string | null>(null);

  // State for Asset Repair & Maintenance Graph
  const [repairMetricMode, setRepairMetricMode] = useState<'both' | 'repairs' | 'cost'>('cost');
  const [chartViewMode, setChartViewMode] = useState<'date-wise' | 'timeline' | 'asset'>('date-wise');
  const [selectedRepairAssetNumber, setSelectedRepairAssetNumber] = useState<string | null>(null);

  // Identify current logged-in employee record
  const employee = useMemo(() => {
    if (!currentUser) return null;
    if (currentUser.role === 'employee') {
      return (
        employees.find(
          e =>
            e.id === currentUser.id ||
            e.employeeId === currentUser.employeeId ||
            e.email.toLowerCase() === currentUser.email.toLowerCase()
        ) || null
      );
    }
    // When IT Admin is viewing/simulating employee portal
    if (selectedEmployeeId) {
      return (
        employees.find(
          e => e.id === selectedEmployeeId || e.employeeId === selectedEmployeeId
        ) || employees[0] || null
      );
    }
    return employees[0] || null;
  }, [employees, currentUser, selectedEmployeeId]);

  // Assigned computer / workstation
  const assignedComputer = useMemo(() => {
    if (!employee) return null;
    return computers.find(
      c => c.assignedEmployeeId === employee.id || c.assignedEmployeeId === employee.employeeId
    ) || null;
  }, [computers, employee]);

  // Assigned peripheral company assets (Mouse, Keyboard, Headset, Monitor, Dock, etc.)
  const assignedAssets = useMemo(() => {
    if (!employee) return [];
    return assets.filter(
      a => a.assignedEmployeeId === employee.id || a.assignedEmployeeId === employee.employeeId
    );
  }, [assets, employee]);

  // Unified Company Assets & Peripherals (Laptop/Desktop, Mobile Phone, Keyboard, Mouse, Headset & Other Equipment)
  const assignedCompanyAssets = useMemo(() => {
    return getEmployeeAssignedCompanyAssets(employee, assignedComputer, assets);
  }, [employee, assignedComputer, assets]);

  const isSelfOrAdmin = useMemo(() => {
    return Boolean(
      userRole === 'admin' ||
      (currentUser?.role === 'employee' &&
        employee &&
        (currentUser.id === employee.id ||
          currentUser.employeeId === employee.employeeId ||
          (currentUser.email && employee.email && currentUser.email.toLowerCase() === employee.email.toLowerCase())))
    );
  }, [userRole, currentUser, employee]);

  const handlePhotoChange = (newPhotoUrl: string) => {
    if (!isSelfOrAdmin) {
      showToast('Unauthorized: You can only update your own profile photo.', 'error');
      return;
    }
    if (employee) {
      updateEmployee(employee.id, { photoUrl: newPhotoUrl });
      showToast(`Profile photo & biometric face reference updated successfully!`, 'success');
    }
  };

  const handlePhotoRemove = () => {
    if (!isSelfOrAdmin) {
      showToast('Unauthorized: You can only update your own profile photo.', 'error');
      return;
    }
    if (employee) {
      updateEmployee(employee.id, { photoUrl: undefined });
      showToast(`Removed custom profile photo for ${employee.name}`, 'info');
    }
  };

  // Service records for this employee's assigned workstation or matching employee identifier
  const myServiceRecords = useMemo(() => {
    if (!employee) return [];
    return serviceRecords
      .filter(
        s =>
          (assignedComputer && s.computerId === assignedComputer.id) ||
          (assignedComputer && s.assetNumber === assignedComputer.assetNumber) ||
          s.employeeId === employee.id ||
          s.employeeId === employee.employeeId ||
          assignedCompanyAssets.some(
            a => a.assetNumber && s.assetNumber && a.assetNumber.trim().toLowerCase() === s.assetNumber.trim().toLowerCase()
          )
      )
      .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime());
  }, [serviceRecords, assignedComputer, employee, assignedCompanyAssets]);

  // Allocation & custody history records for this employee
  const myAllocations = useMemo(() => {
    if (!employee) return [];
    return allocationRecords.filter(
      r =>
        r.employeeId === employee.employeeId ||
        r.employeeId === employee.id ||
        r.employeeName.toLowerCase() === employee.name.toLowerCase()
    );
  }, [allocationRecords, employee]);

  // Equipment requisitions submitted by this employee
  const myAssetRequests = useMemo(() => {
    if (!employee) return [];
    return assetRequests
      .filter(
        r =>
          r.employeeId === employee.employeeId ||
          r.employeeId === employee.id ||
          (r.employeeEmail && r.employeeEmail.toLowerCase() === employee.email.toLowerCase())
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [assetRequests, employee]);

  // Assigned SIM cards for this employee
  const mySimCards = useMemo(() => {
    if (!employee) return [];
    return getEmployeeSimCards(employee, simCards);
  }, [simCards, employee]);

  // SIM Requests & Suspension requisitions submitted by this employee
  const mySimRequests = useMemo(() => {
    if (!employee) return [];
    return simRequests
      .filter(
        r =>
          r.employeeId === employee.employeeId ||
          r.employeeId === employee.id ||
          (r.employeeEmail && r.employeeEmail.toLowerCase() === employee.email.toLowerCase())
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [simRequests, employee]);

  // Calculate service & maintenance summary for workstation
  const serviceSummary = useMemo(() => {
    if (!assignedComputer) return null;
    return calculateComputerServiceSummary(assignedComputer.id, serviceRecords);
  }, [assignedComputer, serviceRecords]);

  // Active tickets
  const activeTickets = useMemo(() => {
    return myServiceRecords.filter(
      s => s.serviceStatus === 'In Progress' || s.serviceStatus === 'Pending Parts'
    );
  }, [myServiceRecords]);

  // Asset Repair & Maintenance Analytics Data: dynamically computed from actual system service records
  const assetRepairStatsData = useMemo(() => {
    // Collect all assigned company assets to ensure every currently assigned device is represented
    const assetMap = new Map<string, {
      assetNumber: string;
      assetName: string;
      assetType: string;
      brand: string;
      model: string;
      repairCount: number;
      totalCost: number;
      records: typeof myServiceRecords;
      lastRepairedDate: string | null;
      status: string;
    }>();

    // 1. Seed with employee's assigned assets so even 0-repair items show up
    assignedCompanyAssets.forEach(a => {
      const num = (a.assetNumber || '').trim();
      if (!num) return;
      assetMap.set(num.toLowerCase(), {
        assetNumber: a.assetNumber,
        assetName: a.deviceName || `${a.brand} ${a.model}`,
        assetType: a.assetType,
        brand: a.brand,
        model: a.model,
        repairCount: 0,
        totalCost: 0,
        records: [],
        lastRepairedDate: null,
        status: a.status,
      });
    });

    // 2. Aggregate actual service records for this employee or hardware
    myServiceRecords.forEach(rec => {
      const recAssetNum = (rec.assetNumber || '').trim();
      const key = recAssetNum.toLowerCase();
      const existing = assetMap.get(key);

      const cost = Number(rec.serviceCost) || 0;

      if (existing) {
        existing.repairCount += 1;
        existing.totalCost += cost;
        existing.records.push(rec);
        if (!existing.lastRepairedDate || new Date(rec.serviceDate) > new Date(existing.lastRepairedDate)) {
          existing.lastRepairedDate = rec.serviceDate;
        }
      } else if (recAssetNum) {
        // Asset repaired in past that might not be in currently active assignedCompanyAssets
        assetMap.set(key, {
          assetNumber: rec.assetNumber,
          assetName: rec.deviceName || `${rec.assetNumber}`,
          assetType: 'Hardware',
          brand: '',
          model: '',
          repairCount: 1,
          totalCost: cost,
          records: [rec],
          lastRepairedDate: rec.serviceDate,
          status: 'Recorded',
        });
      }
    });

    // 3. Format into chart ready array with distinct colors for each asset type
    const assetTypeColors: { [type: string]: string } = {
      Laptop: '#3b82f6', // Blue
      Desktop: '#2563eb', // Darker Blue
      Mouse: '#10b981', // Emerald
      Keyboard: '#6366f1', // Indigo
      Headset: '#f59e0b', // Amber
      Monitor: '#06b6d4', // Cyan
      'Mobile Phone': '#ec4899', // Pink
    };

    return Array.from(assetMap.values()).map(item => ({
      ...item,
      color: assetTypeColors[item.assetType] || '#8b5cf6',
      // Short label for chart axis: "Mouse (MOU-001)"
      displayName: `${item.assetType} (${item.assetNumber})`,
      label: `${item.assetType} (${item.assetNumber})`,
      cost: item.totalCost,
      repairs: item.repairCount,
    }));
  }, [assignedCompanyAssets, myServiceRecords]);

  // Monthly Repair & Maintenance Timeline Data (formatted to match Photo 2: Jun 2022, Aug 2022, etc.)
  const monthlyRepairTimelineData = useMemo(() => {
    const monthsMap = new Map<string, {
      monthKey: string;
      label: string;
      cost: number;
      repairs: number;
      records: typeof myServiceRecords;
    }>();

    // Collect dates from service records
    const validDates = myServiceRecords
      .map(r => r.serviceDate)
      .filter(Boolean)
      .map(d => new Date(d))
      .filter(d => !isNaN(d.getTime()));

    let startDate: Date;
    let endDate: Date;

    // Start timeline from August as requested ("graph August sa start kero")
    let startYear: number;
    if (validDates.length > 0) {
      const paidDates = myServiceRecords
        .filter(r => (Number(r.serviceCost) || 0) > 0 && r.serviceDate)
        .map(r => new Date(r.serviceDate))
        .filter(d => !isNaN(d.getTime()));

      const referenceDate = paidDates.length > 0
        ? new Date(Math.min(...paidDates.map(d => d.getTime())))
        : new Date(Math.min(...validDates.map(d => d.getTime())));

      startYear = referenceDate.getFullYear();
    } else {
      const now = new Date();
      startYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    }

    startDate = new Date(startYear, 7, 1); // Month index 7 = August

    if (validDates.length > 0) {
      const maxTime = Math.max(...validDates.map(d => d.getTime()));
      endDate = new Date(maxTime);
      endDate.setDate(1);
    } else {
      endDate = new Date();
      endDate.setDate(1);
    }
    if (endDate < startDate) {
      endDate = new Date(startDate);
    }

    // Populate all months between startDate and endDate
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      const y = cursor.getFullYear();
      const m = cursor.getMonth();
      const monthKey = `${y}-${String(m + 1).padStart(2, '0')}`;
      const label = cursor.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthsMap.set(monthKey, {
        monthKey,
        label,
        cost: 0,
        repairs: 0,
        records: [],
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    // Aggregate records into months
    myServiceRecords.forEach(rec => {
      if (!rec.serviceDate) return;
      const d = new Date(rec.serviceDate);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const cost = Number(rec.serviceCost) || 0;

      let item = monthsMap.get(key);
      if (!item) {
        const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        item = { monthKey: key, label, cost: 0, repairs: 0, records: [] };
        monthsMap.set(key, item);
      }
      item.cost += cost;
      item.repairs += 1;
      item.records.push(rec);
    });

    return Array.from(monthsMap.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [myServiceRecords]);

  // Date-Wise Service Events Data (Date → Asset → Service/Repair Charge)
  const dateWiseServiceTimelineData = useMemo(() => {
    const recordsWithDates = [...myServiceRecords]
      .filter(r => r.serviceDate)
      .sort((a, b) => new Date(a.serviceDate).getTime() - new Date(b.serviceDate).getTime());

    const dateMap = new Map<string, {
      date: string;
      displayDate: string;
      label: string;
      cost: number;
      repairs: number;
      records: typeof myServiceRecords;
      assetSummary: string;
    }>();

    // Start with August baseline anchor point if earliest service date is in/after August
    if (recordsWithDates.length > 0) {
      const firstDate = new Date(recordsWithDates[0].serviceDate);
      if (!isNaN(firstDate.getTime())) {
        const firstYear = firstDate.getFullYear();
        const augDateKey = `${firstYear}-08-01`;
        if (new Date(augDateKey).getTime() < firstDate.getTime()) {
          dateMap.set(augDateKey, {
            date: augDateKey,
            displayDate: `Aug ${firstYear}`,
            label: `Aug ${firstYear}`,
            cost: 0,
            repairs: 0,
            records: [],
            assetSummary: 'Baseline Start (Aug)',
          });
        }
      }
    }

    recordsWithDates.forEach(rec => {
      const dateKey = (rec.serviceDate || '').substring(0, 10);
      if (!dateKey) return;
      const parsed = new Date(rec.serviceDate);
      const displayDate = !isNaN(parsed.getTime())
        ? parsed.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
        : dateKey;

      const cost = Number(rec.serviceCost) || 0;

      let existing = dateMap.get(dateKey);
      if (!existing) {
        existing = {
          date: dateKey,
          displayDate,
          label: displayDate,
          cost: 0,
          repairs: 0,
          records: [],
          assetSummary: '',
        };
        dateMap.set(dateKey, existing);
      }

      existing.cost += cost;
      existing.repairs += 1;
      existing.records.push(rec);
    });

    return Array.from(dateMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({
        ...d,
        assetSummary: d.records
          .map(r => `${r.assetNumber} (${formatCurrency(Number(r.serviceCost) || 0)})`)
          .join(' • '),
      }));
  }, [myServiceRecords]);

  // Active dataset depending on timeline mode vs asset mode
  const activeRepairChartData: any[] = useMemo(() => {
    if (chartViewMode === 'asset') {
      return assetRepairStatsData;
    }
    if (chartViewMode === 'date-wise') {
      return dateWiseServiceTimelineData;
    }
    return monthlyRepairTimelineData;
  }, [chartViewMode, assetRepairStatsData, dateWiseServiceTimelineData, monthlyRepairTimelineData]);

  // Y-axis tick formatter matching Photo 2 (0, 100K, 200K, etc.)
  const formatYAxisTick = (val: number) => {
    if (val === 0) return '0';
    if (val >= 1000000) {
      const m = val / 1000000;
      return `${m % 1 === 0 ? m : m.toFixed(1)}M`;
    }
    if (val >= 1000) {
      const k = val / 1000;
      return `${k % 1 === 0 ? k : k.toFixed(1)}K`;
    }
    return `${val}`;
  };

  // Selected asset details for modal/drawer breakdown
  const selectedRepairAsset = useMemo(() => {
    if (!selectedRepairAssetNumber) return null;
    return assetRepairStatsData.find(
      a => a.assetNumber.toLowerCase() === selectedRepairAssetNumber.toLowerCase()
    ) || null;
  }, [assetRepairStatsData, selectedRepairAssetNumber]);

  // Copy helper
  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast(`Copied ${fieldName} to clipboard`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Handle receipt file upload in employee issue report modal
  const handleReportReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReportReceiptError('');

    if (file.size > 10 * 1024 * 1024) {
      setReportReceiptError('File size is too large. Please select a receipt under 10MB.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|gif|pdf)$/i)) {
      setReportReceiptError('Unsupported file format. Please upload JPG, PNG, or PDF.');
      return;
    }

    setReportReceiptFileName(file.name);
    setReportReceiptFileSize(file.size);

    const reader = new FileReader();
    reader.onload = () => {
      setReportReceiptFileUrl(reader.result as string);
    };
    reader.onerror = () => {
      setReportReceiptError('Failed to read file. Please try another image or PDF.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReportReceiptFile = () => {
    setReportReceiptFileName('');
    setReportReceiptFileUrl('');
    setReportReceiptFileSize(0);
    setReportReceiptError('');
  };

  // Submit issue report ticket to Admin
  const handleReportIssue = (e: React.FormEvent) => {
    e.preventDefault();
    const targetAsset = (selectedAssetId && assignedAssets.find(a => a.id === selectedAssetId))
      ? assignedAssets.find(a => a.id === selectedAssetId)!
      : assignedComputer;

    if (!employee) {
      showToast('Employee profile not loaded.', 'error');
      return;
    }
    if (!problemDescription.trim()) {
      showToast('Please provide a brief description of the issue.', 'error');
      return;
    }

    setIsSubmitting(true);
    const currentDate = new Date().toISOString().substring(0, 10);

    const comp = assignedComputer && (targetAsset?.id === assignedComputer.id || !selectedAssetId)
      ? assignedComputer
      : null;

    const targetBrand = targetAsset
      ? ('brand' in targetAsset ? targetAsset.brand : targetAsset.manufacturer)
      : (assignedComputer?.manufacturer || 'Enterprise');
    const targetDeviceName = targetAsset
      ? ('deviceName' in targetAsset && targetAsset.deviceName ? targetAsset.deviceName : `${targetBrand} ${targetAsset.model}`)
      : (assignedComputer?.deviceName || 'Assigned Workstation / PC');
    const targetDeviceType = targetAsset
      ? ('deviceType' in targetAsset ? (targetAsset.deviceType as string) : targetAsset.assetType)
      : (assignedComputer?.deviceType || 'Desktop');
    const targetManufacturer = targetAsset
      ? ('manufacturer' in targetAsset ? (targetAsset.manufacturer as string) : targetAsset.brand)
      : (assignedComputer?.manufacturer || 'Standard');
    const targetModel = targetAsset ? targetAsset.model : (assignedComputer?.model || 'Workstation');
    const targetAssetNumber = targetAsset ? targetAsset.assetNumber : (assignedComputer?.assetNumber || `PC-${employee.employeeId}`);
    const targetSerialNumber = targetAsset ? targetAsset.serialNumber : (assignedComputer?.serialNumber || 'N/A');

    const emailPayload: ServiceTicketEmailPayload = {
      employeeName: employee.name,
      employeeId: employee.employeeId,
      companyEmployeeNumber: employee.companyEmployeeNumber,
      employeeEmail: employee.email,
      employeePhone: employee.phone,
      department: employee.department,
      designation: employee.designation,
      assetNumber: targetAssetNumber,
      deviceName: targetDeviceName,
      deviceType: targetDeviceType,
      manufacturer: targetManufacturer,
      model: targetModel,
      serialNumber: targetSerialNumber,
      problemCategory,
      urgency: issueUrgency,
      issueDescription: `${problemDescription.trim()}${reportRepairCost > 0 ? `\n[Reported Repair Cost]: ₹${reportRepairCost}` : ''}${reportReceiptFileName ? `\n[Receipt Attached]: ${reportReceiptFileName}` : ''}`,
      serviceDate: currentDate,
      processor: comp?.processor?.name,
      installedRAM: comp?.memory?.installedRAM,
      storage: comp?.storage?.total,
      os: comp?.system?.os,
    };

    // Prepare dispatch links without intrusive popup
    const dispatchResult = dispatchServiceTicketEmail(emailPayload, false);

    // 2. Persist record in database for Admin review with repair cost & receipt document
    const res = addServiceRecord({
      computerId: comp ? comp.id : (targetAsset ? targetAsset.id : (assignedComputer?.id || 'comp-general')),
      assetNumber: targetAssetNumber,
      deviceName: targetDeviceName,
      employeeId: employee.employeeId,
      employeeName: employee.name,
      serviceDate: currentDate,
      problem: `[Employee Request] [Priority: ${issueUrgency}] ${problemDescription.trim()}`,
      problemCategory,
      workPerformed: `Request submitted by ${employee.name} (${employee.employeeId}) via employee portal. Awaiting IT Admin review and technician assignment.`,
      partsReplaced: 'None',
      technician: 'IT Admin / Helpdesk',
      serviceCost: Number(reportRepairCost) || 0,
      serviceStatus: 'In Progress',
      resolution: 'Awaiting IT service desk inspection and triage.',
      remarks: `Submitted by ${employee.name} (${employee.employeeId}) • Contact: ${employee.phone || employee.email}${reportReceiptFileName ? ` • Receipt: ${reportReceiptFileName}` : ''} • Routed to ${IT_SUPPORT_EMAIL}`,
      receiptNumber: reportReceiptNumber.trim() || undefined,
      receiptDate: reportReceiptDate || currentDate,
      receiptFileName: reportReceiptFileName || undefined,
      receiptFileUrl: reportReceiptFileUrl || undefined,
      receiptFileSize: reportReceiptFileSize || undefined,
      receiptFileType: reportReceiptFileName?.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
    });

    setIsSubmitting(false);
    if (res.success) {
      setSubmittedTicketResult({
        ticketId: dispatchResult.ticketId,
        gmailComposeUrl: dispatchResult.gmailComposeUrl,
        mailtoUrl: dispatchResult.mailtoUrl,
        subject: dispatchResult.subject,
        body: dispatchResult.body,
        deviceName: targetDeviceName,
        assetNumber: targetAssetNumber,
      });
      setDispatchedTicketInfo({
        gmailUrl: dispatchResult.gmailComposeUrl,
        subject: dispatchResult.subject,
        ticketId: dispatchResult.ticketId,
      });
      showToast(
        `Support request "${dispatchResult.ticketId}" with repair details submitted to Admin!`,
        'success'
      );
    }
  };

  // Get asset type icon
  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'Laptop':
        return <Laptop className="w-4 h-4 text-blue-500" />;
      case 'Monitor':
        return <Monitor className="w-4 h-4 text-indigo-500" />;
      case 'Mouse':
        return <Mouse className="w-4 h-4 text-emerald-500" />;
      case 'Keyboard':
        return <Keyboard className="w-4 h-4 text-amber-500" />;
      case 'Headset':
        return <Headphones className="w-4 h-4 text-purple-500" />;
      case 'Mobile Phone':
        return <Smartphone className="w-4 h-4 text-pink-500" />;
      case 'Docking Station':
        return <Layers className="w-4 h-4 text-cyan-500" />;
      default:
        return <Laptop className="w-4 h-4 text-slate-500" />;
    }
  };

  if (!employee) {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#101726] rounded-2xl border border-slate-200 dark:border-slate-800 animate-fade-in">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Employee Profile Not Found</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Unable to locate authenticated employee records. Please sign out and sign in again.
        </p>
      </div>
    );
  }

  // Calculate storage percentage if workstation exists
  const storageTotalGb = assignedComputer
    ? parseInt(assignedComputer.storage?.total?.replace(/\D/g, '') || '512') || 512
    : 512;
  const storageUsedGb = assignedComputer
    ? parseInt(assignedComputer.storage?.used?.replace(/\D/g, '') || '120') || 120
    : 120;
  const storagePercentage = Math.round((storageUsedGb / storageTotalGb) * 100);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Admin Simulation Banner with Employee Switcher */}
      {currentUser?.role === 'admin' && (
        <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Admin Simulation Mode</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono font-medium">
                  {employee.employeeId}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Viewing personal workstation, assigned devices, and tickets as this employee.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto self-end sm:self-center">
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 shrink-0">
              Preview Employee:
            </label>
            <select
              value={employee.id}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              aria-label="Select employee to preview in simulation mode"
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer w-full sm:w-auto"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employeeId}) — {emp.department}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Service Ticket Dispatched Success Notice */}
      {dispatchedTicketInfo && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500 text-white shrink-0 mt-0.5 shadow-2xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-2 flex-wrap">
                <span>Service Ticket Prepared & Dispatched to IT Support</span>
                <span className="font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-[10px] text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                  {dispatchedTicketInfo.ticketId}
                </span>
              </h4>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                Full hardware diagnostics and problem symptoms were compiled and routed directly to{' '}
                <strong className="font-mono text-emerald-900 dark:text-emerald-100 underline">
                  {IT_SUPPORT_EMAIL}
                </strong>
                .
              </p>
              <div className="flex items-center gap-3 mt-2.5">
                <a
                  href={dispatchedTicketInfo.gmailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-2xs transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Ticket in Gmail Web</span>
                </a>
                <button
                  type="button"
                  onClick={() => setDispatchedTicketInfo(null)}
                  className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDispatchedTicketInfo(null)}
            className="p-1 rounded text-emerald-500 hover:text-emerald-700 cursor-pointer"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. TOP WELCOME & EMPLOYEE IDENTITY BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-xl border border-blue-800/40">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <EmployeeAvatar
                name={employee.name}
                photoUrl={employee.photoUrl}
                size="xl"
                className="ring-3 ring-white/20 shadow-xl"
                editable={isSelfOrAdmin}
                onPhotoChange={handlePhotoChange}
                onPhotoRemove={handlePhotoRemove}
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {employee.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {employee.status}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {employee.department}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5">
                {employee.designation} &bull; <span className="text-slate-400">{employee.team}</span>
              </p>

              <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-300 flex-wrap">
                <button
                  onClick={() => handleCopy(employee.employeeId, 'Employee ID')}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 transition-colors font-mono cursor-pointer"
                  title="Click to copy Employee ID"
                >
                  <span className="text-slate-400">ID:</span> {employee.employeeId}
                  {copiedField === 'Employee ID' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                </button>

                <button
                  onClick={() => handleCopy(employee.companyEmployeeNumber, 'Badge Number')}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 transition-colors font-mono cursor-pointer"
                  title="Click to copy Corporate Badge Number"
                >
                  <span className="text-slate-400">Badge:</span> {employee.companyEmployeeNumber}
                  {copiedField === 'Badge Number' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                </button>

                <span className="flex items-center gap-1 text-slate-300">
                  <Calendar className="w-3 h-3 text-blue-400" /> Joined {formatDateDisplay(employee.joiningDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Button for Employee */}
          <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
            <button
              onClick={() => setShowAssetRequestModal(true)}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>Submit Request to Admin</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const composeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${IT_SUPPORT_EMAIL}&su=${encodeURIComponent(`IT Support Request - ${employee.name} (${employee.employeeId})`)}`;
                window.open(composeUrl, '_blank');
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">IT Helpdesk</span>
            </button>
          </div>
        </div>

        {/* Active Ticket Banner Alert (If any active repair ticket exists) */}
        {activeTickets.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-3 text-xs bg-amber-500/10 -mx-6 -mb-6 px-6 py-3 text-amber-200">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span>
                <strong>Active Workstation Service in Progress:</strong> Ticket #{activeTickets[0].id} (
                {activeTickets[0].problemCategory}) &mdash; Technician {activeTickets[0].technician}
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
              {activeTickets[0].serviceStatus}
            </span>
          </div>
        )}
      </div>

      {/* QUICK SECTION NAV PILLS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <button
          onClick={() => {
            setActiveSection('all');
            setActiveTab('dashboard');
          }}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            activeSection === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#101726] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
          }`}
        >
          All Overview
        </button>
        <button
          onClick={() => {
            setActiveSection('requests');
            setActiveTab('requests');
          }}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeSection === 'requests'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#101726] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>My Requisitions ({myAssetRequests.length})</span>
        </button>
        <button
          onClick={() => {
            setActiveSection('workstation');
            setActiveTab('workstation');
          }}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeSection === 'workstation'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#101726] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Laptop className="w-3.5 h-3.5" />
          <span>My Workstation</span>
        </button>
        <button
          onClick={() => {
            setActiveSection('assets');
            setActiveTab('assets');
          }}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeSection === 'assets'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#101726] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Assigned Company Assets ({assignedCompanyAssets.length})</span>
        </button>
        <button
          onClick={() => {
            setActiveSection('photos');
            setActiveTab('weekly-photos');
          }}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeSection === 'photos'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#101726] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Weekly Asset Photos</span>
        </button>
        <button
          onClick={() => {
            setActiveSection('maintenance');
            setActiveTab('services');
          }}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeSection === 'maintenance'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#101726] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Repair & Service History ({myServiceRecords.length})</span>
        </button>
        <button
          onClick={() => {
            setActiveSection('sim-cards');
            setActiveTab('sim-management');
          }}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeSection === 'sim-cards'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#101726] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
          <span>My SIM Cards & Recharges ({mySimCards.length})</span>
        </button>
        <button
          onClick={() => setActiveSection('updates')}
          className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeSection === 'updates'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#101726] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Notifications & Updates</span>
        </button>
      </div>

      {/* 1.5. ASSET REPAIR & MAINTENANCE GRAPH (DYNAMIC HARDWARE SERVICE ANALYTICS) */}
      {(activeSection === 'all' || activeSection === 'workstation' || activeSection === 'assets' || activeSection === 'maintenance') && (
        <div className="bg-white dark:bg-[#101726] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
          {/* Card Header & Dynamic Toggles */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Asset Repair & Maintenance Analytics
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Database
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Actual breakdown of repair frequency and maintenance expenditure per assigned company asset
                </p>
              </div>
            </div>

            {/* View Mode & Metric Mode Switcher */}
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              {/* Timeline vs Asset Toggle */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setChartViewMode('date-wise')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    chartViewMode === 'date-wise'
                      ? 'bg-white dark:bg-[#1e293b] text-rose-600 dark:text-rose-400 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Date-Wise Details
                </button>
                <button
                  type="button"
                  onClick={() => setChartViewMode('timeline')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    chartViewMode === 'timeline'
                      ? 'bg-white dark:bg-[#1e293b] text-rose-600 dark:text-rose-400 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Monthly Timeline
                </button>
                <button
                  type="button"
                  onClick={() => setChartViewMode('asset')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    chartViewMode === 'asset'
                      ? 'bg-white dark:bg-[#1e293b] text-rose-600 dark:text-rose-400 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  By Asset
                </button>
              </div>

              {/* Metric Mode Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRepairMetricMode('cost')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    repairMetricMode === 'cost'
                      ? 'bg-white dark:bg-[#1e293b] text-rose-600 dark:text-rose-400 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Repair Cost (₹)
                </button>
                <button
                  type="button"
                  onClick={() => setRepairMetricMode('repairs')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    repairMetricMode === 'repairs'
                      ? 'bg-white dark:bg-[#1e293b] text-rose-600 dark:text-rose-400 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Repair Count
                </button>
                <button
                  type="button"
                  onClick={() => setRepairMetricMode('both')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    repairMetricMode === 'both'
                      ? 'bg-white dark:bg-[#1e293b] text-rose-600 dark:text-rose-400 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Both
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics KPI Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40">
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-medium">
                <Wrench className="w-3.5 h-3.5" />
                <span>Total Asset Repairs</span>
              </div>
              <div className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                {assetRepairStatsData.reduce((acc, curr) => acc + curr.repairCount, 0)} Repairs
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Across {assetRepairStatsData.filter(a => a.repairCount > 0).length} serviced devices
              </div>
            </div>

            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                <IndianRupee className="w-3.5 h-3.5" />
                <span>Total Repair Cost</span>
              </div>
              <div className="mt-1 text-lg font-bold text-slate-900 dark:text-white font-mono">
                {formatCurrency(assetRepairStatsData.reduce((acc, curr) => acc + curr.totalCost, 0))}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Lifetime maintenance outlay
              </div>
            </div>

            <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900/40">
              <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 text-xs font-medium">
                <Laptop className="w-3.5 h-3.5" />
                <span>Most Repaired Asset</span>
              </div>
              <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white truncate">
                {(() => {
                  const sorted = [...assetRepairStatsData].sort((a, b) => b.repairCount - a.repairCount);
                  return sorted[0] && sorted[0].repairCount > 0
                    ? `${sorted[0].assetType} (${sorted[0].repairCount}x)`
                    : 'None (Healthy)';
                })()}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Highest service frequency
              </div>
            </div>

            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/40">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>Active Service Tickets</span>
              </div>
              <div className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                {activeTickets.length} Open
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {activeTickets.length > 0 ? 'Under repair / technician' : 'All assets operational'}
              </div>
            </div>
          </div>

          {/* Interactive Recharts Graph (Photo 2 Style: Clean Linear Trend) */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {/* Top Legend matching Photo 2: pink line marker followed by metric name */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-5">
                {(repairMetricMode === 'cost' || repairMetricMode === 'both') && (
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-0.5 bg-[#f43f5e] rounded-full inline-block" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {chartViewMode === 'timeline' ? 'Repair Cost (₹)' : 'Repair Cost (₹)'}
                    </span>
                  </div>
                )}
                {(repairMetricMode === 'repairs' || repairMetricMode === 'both') && (
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-0.5 rounded-full inline-block ${
                        repairMetricMode === 'both' ? 'bg-[#3b82f6]' : 'bg-[#f43f5e]'
                      }`}
                    />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {chartViewMode === 'timeline' ? 'Repairs Logged' : 'Repairs (Times)'}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {chartViewMode === 'timeline'
                  ? 'Monthly service expenditure timeline'
                  : 'Breakdown across company hardware'}
              </span>
            </div>

            <div className="h-72 w-full pt-1">
              {activeRepairChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={activeRepairChartData}
                    margin={{ top: 10, right: 25, left: 5, bottom: 20 }}
                    onClick={(e: any) => {
                      if (e && e.activePayload && e.activePayload.length > 0) {
                        const clicked = e.activePayload[0].payload;
                        if (clicked.assetNumber) {
                          setSelectedRepairAssetNumber(clicked.assetNumber);
                        } else if (clicked.records && clicked.records.length > 0) {
                          setSelectedRepairAssetNumber(clicked.records[0].assetNumber);
                        }
                      }
                    }}
                  >
                    <CartesianGrid
                      stroke="#e2e8f0"
                      className="dark:opacity-15"
                      strokeDasharray=""
                      vertical={true}
                      horizontal={true}
                    />
                    <XAxis
                      dataKey="label"
                      axisLine={{ stroke: '#64748b', strokeWidth: 1.5 }}
                      tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }}
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                      interval="preserveStartEnd"
                      minTickGap={20}
                      dy={8}
                    />
                    {repairMetricMode === 'both' ? (
                      <>
                        <YAxis
                          yAxisId="left"
                          axisLine={{ stroke: '#64748b', strokeWidth: 1.5 }}
                          tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }}
                          tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                          tickFormatter={formatYAxisTick}
                          dx={-4}
                          name="Cost"
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          axisLine={{ stroke: '#64748b', strokeWidth: 1.5 }}
                          tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }}
                          tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                          allowDecimals={false}
                          dx={4}
                          name="Repairs"
                        />
                      </>
                    ) : repairMetricMode === 'repairs' ? (
                      <YAxis
                        axisLine={{ stroke: '#64748b', strokeWidth: 1.5 }}
                        tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }}
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                        allowDecimals={false}
                        dx={-4}
                      />
                    ) : (
                      <YAxis
                        axisLine={{ stroke: '#64748b', strokeWidth: 1.5 }}
                        tickLine={{ stroke: '#64748b', strokeWidth: 1.5 }}
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                        tickFormatter={formatYAxisTick}
                        dx={-4}
                      />
                    )}
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        const data = payload[0].payload;
                        const recs: typeof myServiceRecords = data.records || [];
                        const displayCost = Number(data.cost ?? data.totalCost ?? 0);
                        return (
                          <div className="bg-[#0f172a]/95 text-white border border-slate-700/90 rounded-xl p-3 shadow-2xl text-xs max-w-xs sm:max-w-sm backdrop-blur-xs z-50">
                            {/* Header: Date and Total Cost */}
                            <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-800">
                              <div className="flex items-center gap-1.5 font-bold text-rose-400">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{data.displayDate ? `Date: ${data.displayDate}` : data.label}</span>
                              </div>
                              <span className="font-mono text-emerald-400 font-bold text-sm">
                                {formatCurrency(displayCost)}
                              </span>
                            </div>

                            {/* Date → Asset → Service/Repair Charge */}
                            <div className="pt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Date → Asset → Service/Repair Charge:
                            </div>

                            {recs.length > 0 ? (
                              <div className="space-y-2 mt-1.5 max-h-52 overflow-y-auto pr-0.5">
                                {recs.map((r, i) => (
                                  <div
                                    key={r.id || i}
                                    className="p-2 bg-slate-800/90 rounded-lg border border-slate-700/60 text-[11px] space-y-1"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-bold text-blue-300">
                                        {r.deviceName || r.assetNumber} ({r.assetNumber})
                                      </span>
                                      <span className="font-mono text-emerald-400 font-bold">
                                        {formatCurrency(Number(r.serviceCost) || 0)}
                                      </span>
                                    </div>
                                    <div className="text-slate-200">
                                      <span className="text-slate-400 font-medium">Service / Repair: </span>
                                      {r.workPerformed || r.problem || 'Hardware Maintenance'}
                                    </div>
                                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
                                      <span>Tech: {r.technician || 'IT Support'}</span>
                                      <span className="px-1.5 py-0.2 rounded bg-slate-700 text-slate-300">
                                        {r.serviceStatus || 'Completed'}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="py-2 text-[11px] text-slate-400 italic">
                                {displayCost === 0 ? 'Zero maintenance charge logged for this period.' : 'Diagnostic inspection completed.'}
                              </div>
                            )}
                          </div>
                        );
                      }}
                    />
                    {(repairMetricMode === 'cost' || repairMetricMode === 'both') && (
                      <Line
                        yAxisId={repairMetricMode === 'both' ? 'left' : undefined}
                        type="linear"
                        dataKey="cost"
                        name="Repair Cost (₹)"
                        stroke="#f43f5e"
                        strokeWidth={2.2}
                        dot={{ r: 4, fill: '#f43f5e', stroke: '#ffffff', strokeWidth: 1.5 }}
                        activeDot={{ r: 6.5, fill: '#e11d48', stroke: '#ffffff', strokeWidth: 2 }}
                        cursor="pointer"
                      />
                    )}
                    {(repairMetricMode === 'repairs' || repairMetricMode === 'both') && (
                      <Line
                        yAxisId={repairMetricMode === 'both' ? 'right' : undefined}
                        type="linear"
                        dataKey="repairs"
                        name="Repairs Logged"
                        stroke={repairMetricMode === 'both' ? '#3b82f6' : '#f43f5e'}
                        strokeWidth={2.2}
                        dot={{
                          r: 4,
                          fill: repairMetricMode === 'both' ? '#3b82f6' : '#f43f5e',
                          stroke: '#ffffff',
                          strokeWidth: 1.5,
                        }}
                        activeDot={{
                          r: 6.5,
                          fill: repairMetricMode === 'both' ? '#2563eb' : '#e11d48',
                          stroke: '#ffffff',
                          strokeWidth: 2,
                        }}
                        cursor="pointer"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 text-xs text-center p-6 bg-slate-50/50 dark:bg-[#070b14]/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800/80">
                  <Wrench className="w-8 h-8 mb-2 opacity-40 text-rose-500" />
                  <span>No assigned assets or repair records logged in the database yet.</span>
                </div>
              )}
            </div>

            {/* Date → Asset → Service/Repair Charge Telemetry Section */}
            {myServiceRecords.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-rose-500" />
                    <span>Date-Wise Service Details (Date → Asset → Service/Repair Charge):</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {myServiceRecords.length} recorded service event{myServiceRecords.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {myServiceRecords.map((rec, idx) => {
                    const isSelected = selectedRepairAssetNumber?.toLowerCase() === rec.assetNumber?.toLowerCase();
                    return (
                      <div
                        key={rec.id || idx}
                        onClick={() => setSelectedRepairAssetNumber(isSelected ? null : rec.assetNumber)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                          isSelected
                            ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-400 dark:border-rose-500/50 ring-1 ring-rose-400'
                            : 'bg-white dark:bg-[#101726] border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {/* Date & Charge */}
                        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800/80">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                            <Calendar className="w-3 h-3 text-rose-500" />
                            <span>{formatDateDisplay(rec.serviceDate)}</span>
                          </div>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                            {formatCurrency(Number(rec.serviceCost) || 0)}
                          </span>
                        </div>

                        {/* Asset info */}
                        <div className="pt-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-semibold text-xs text-blue-600 dark:text-blue-400">
                            <span>{rec.deviceName || rec.assetNumber}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                              {rec.assetNumber}
                            </span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {rec.problemCategory}
                          </span>
                        </div>

                        {/* Service / repair detail */}
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1 mt-1">
                          <span className="text-slate-400 font-medium">Repair: </span>
                          {rec.workPerformed || rec.problem}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Asset Quick Selector Chips & Details Trigger */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">
                  Filter / View History:
                </span>
                {assetRepairStatsData.map(item => {
                  const isSelected = selectedRepairAssetNumber?.toLowerCase() === item.assetNumber.toLowerCase();
                  return (
                    <button
                      key={item.assetNumber}
                      type="button"
                      onClick={() => setSelectedRepairAssetNumber(isSelected ? null : item.assetNumber)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-400'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.assetType} ({item.assetNumber})</span>
                      <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-blue-700 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                        {item.repairCount}x &bull; {formatCurrency(item.totalCost)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedRepairAssetNumber && (
                <button
                  type="button"
                  onClick={() => setSelectedRepairAssetNumber(null)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {/* Selected Asset Detailed History Panel */}
            {selectedRepairAsset && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-blue-200 dark:border-blue-900/60 shadow-sm animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: selectedRepairAsset.color }}
                    />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{selectedRepairAsset.assetName}</span>
                        <span className="font-mono text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900/60">
                          {selectedRepairAsset.assetNumber}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                          {selectedRepairAsset.assetType}
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Brand: {selectedRepairAsset.brand || 'Enterprise'} &bull; Model: {selectedRepairAsset.model || 'Standard'} &bull; Status: {selectedRepairAsset.status}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Spent</div>
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatCurrency(selectedRepairAsset.totalCost)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedRepairAssetNumber(null)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Repair Records List for this specific asset */}
                <div className="mt-3">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Logged Repair & Maintenance History ({selectedRepairAsset.records.length})
                  </h4>

                  {selectedRepairAsset.records.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {selectedRepairAsset.records.map(rec => (
                        <div
                          key={rec.id}
                          className="p-3 bg-white dark:bg-[#101726] rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                #{rec.id}
                              </span>
                              <ProblemCategoryBadge category={rec.problemCategory} />
                              <ServiceStatusBadge status={rec.serviceStatus} />
                              <span className="text-slate-400">&bull;</span>
                              <span className="text-slate-500 dark:text-slate-400 font-medium">
                                {formatDateDisplay(rec.serviceDate)}
                              </span>
                            </div>
                            <p className="text-slate-800 dark:text-slate-200 font-medium">
                              {rec.problem}
                            </p>
                            {rec.workPerformed && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                <strong>Work Done:</strong> {rec.workPerformed}
                              </p>
                            )}
                            {rec.partsReplaced && (
                              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                                <strong>Parts Replaced:</strong> {rec.partsReplaced}
                              </p>
                            )}
                          </div>

                          <div className="sm:text-right shrink-0">
                            <div className="text-[10px] text-slate-400">Cost Incurred</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                              {formatCurrency(rec.serviceCost || 0)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Tech: {rec.technician || 'IT Support'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>
                        This asset has <strong>0 repairs recorded</strong> and is operating in optimal hardware condition with zero maintenance expense.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. PERSONAL EMPLOYEE DETAILS CARD */}
      {(activeSection === 'all' || activeSection === 'workstation') && (
        <div className="bg-white dark:bg-[#101726] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Personal & Employment Information
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Your authorized corporate profile details maintained in AssetCore
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800/60">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Identity Verified</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800/80">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Full Legal Name
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                {employee.name}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{employee.designation}</div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800/80">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Corporate Badge Number
              </div>
              <div className="text-xs font-bold font-mono text-slate-900 dark:text-white mt-1 flex items-center justify-between">
                <span>{employee.companyEmployeeNumber}</span>
                <button
                  onClick={() => handleCopy(employee.companyEmployeeNumber, 'Badge')}
                  className="text-slate-400 hover:text-blue-500 p-0.5"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Emp ID: {employee.employeeId}</div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800/80">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Department & Team
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                {employee.department}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Team: {employee.team}</div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800/80">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Official Company Email
              </div>
              <div className="text-xs font-medium text-slate-900 dark:text-white mt-1 truncate flex items-center justify-between">
                <span className="truncate">{employee.email}</span>
                <button
                  onClick={() => handleCopy(employee.email, 'Email')}
                  className="text-slate-400 hover:text-blue-500 p-0.5 shrink-0 ml-1"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{employee.phone}</div>
            </div>
          </div>

          {employee.remarks && (
            <div className="mt-3 p-2.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-lg text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
              <span>
                <strong>Profile Remarks:</strong> {employee.remarks}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 3. ASSIGNED DESKTOP / DEVICE WORKSTATION CARD (WINDOWS "ABOUT" SYSTEM INFO) */}
      {(activeSection === 'all' || activeSection === 'workstation') && (
        <div className="bg-white dark:bg-[#101726] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Assigned Workstation & Device Specs
                  </h2>
                  {assignedComputer ? (
                    <>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                        {assignedComputer.assetNumber}
                      </span>
                      <ConditionBadge condition={assignedComputer.condition} />
                      <AssetStatusBadge status={assignedComputer.status} />
                    </>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-500">
                      No Computer Assigned
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Full Windows specification profile extracted from system hardware diagnostics
                </p>
              </div>
            </div>

            {assignedComputer && (
              <button
                onClick={() => setShowReportModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-800/80 transition-colors self-start sm:self-auto cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Report Issue</span>
              </button>
            )}
          </div>

          {assignedComputer ? (
            <div className="pt-4 space-y-5">
              {/* Top Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/70 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Device Name
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white mt-1 font-mono">
                    {assignedComputer.deviceName}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {assignedComputer.manufacturer} {assignedComputer.model}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900/70 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Form Factor & Serial
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                    {assignedComputer.deviceType}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 mt-0.5 truncate" title={assignedComputer.serialNumber}>
                    S/N: {assignedComputer.serialNumber}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900/70 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Assignment Date
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    <span>{formatDateDisplay(assignedComputer.assignedDate)}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Active Custody</div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900/70 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Maintenance Summary
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                    {serviceSummary ? `${serviceSummary.totalServices} Services Logged` : '0 Services'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Last: {serviceSummary?.lastServiceDate || 'None'}
                  </div>
                </div>
              </div>

              {/* Windows "About" Hardware Specifications Grid */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-blue-500" />
                  <span>Hardware & Operating System Specifications</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Left Column: Processor, RAM, Storage */}
                  <div className="space-y-3">
                    {/* Processor */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-blue-500" /> Processor (CPU)
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold">
                          {assignedComputer.processor?.generation || 'Standard'}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {assignedComputer.processor?.name || 'High Performance Processor'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Clock Speed: <span className="font-mono text-slate-700 dark:text-slate-300">{assignedComputer.processor?.speed || '2.4 GHz'}</span>
                      </div>
                    </div>

                    {/* RAM */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <CircuitBoard className="w-3.5 h-3.5 text-emerald-500" /> Installed RAM (Memory)
                        </span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          {assignedComputer.memory?.installedRAM || '8 GB'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Usable System Memory: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{assignedComputer.memory?.usableRAM || '7.8 GB'}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full w-[96%]" />
                      </div>
                    </div>

                    {/* Storage */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <HardDrive className="w-3.5 h-3.5 text-amber-500" /> Storage Capacity ({assignedComputer.storage?.type || 'SSD'})
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                          {assignedComputer.storage?.total || '256 GB'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Used: <strong className="text-slate-700 dark:text-slate-200">{assignedComputer.storage?.used || '120 GB'}</strong></span>
                        <span>Free Space: <strong className="text-emerald-600 dark:text-emerald-400">{assignedComputer.storage?.free || '136 GB'}</strong></span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden flex">
                        <div
                          className="bg-blue-600 h-full rounded-l-full transition-all"
                          style={{ width: `${storagePercentage}%` }}
                        />
                        <div
                          className="bg-emerald-500/40 h-full rounded-r-full transition-all"
                          style={{ width: `${100 - storagePercentage}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 text-right mt-1">
                        {storagePercentage}% Capacity Utilized
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Graphics, OS, Architecture, Masked Keys */}
                  <div className="space-y-3">
                    {/* Graphics */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-purple-500" /> Graphics Adapter (GPU)
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold">
                          {assignedComputer.graphics?.memory || 'Integrated'}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {assignedComputer.graphics?.card || 'Intel UHD / Iris Xe Graphics'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Display output calibrated for enterprise workloads
                      </div>
                    </div>

                    {/* Operating System & Architecture */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Operating System Edition
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {assignedComputer.system?.os || 'Windows 11 Pro / Enterprise'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        System Type: <span className="text-slate-700 dark:text-slate-300">{assignedComputer.system?.systemType || '64-bit operating system, x64-based processor'}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Pen and Touch: <span className="text-slate-700 dark:text-slate-300">{assignedComputer.system?.penAndTouch || 'No pen or touch input available'}</span>
                      </div>
                    </div>

                    {/* Enterprise Security Masked Keys Notice */}
                    <div className="p-3.5 bg-slate-100/80 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        <Lock className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Protected Enterprise Identifiers</span>
                      </div>
                      <div className="space-y-1 text-[11px] text-slate-500">
                        <div className="flex items-center justify-between">
                          <span>Device ID:</span>
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {assignedComputer.system?.deviceId ? maskSensitive(assignedComputer.system.deviceId, false) : '••••••••-••••'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Product ID:</span>
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {assignedComputer.system?.productId ? maskSensitive(assignedComputer.system.productId, false) : '•••••-•••••-•••••-•••••'}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 italic">
                        * Hardware keys are protected under corporate cybersecurity policy. Contact IT Admin for licensing queries.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-xl mt-4 border border-dashed border-slate-200 dark:border-slate-800">
              <Laptop className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No Desktop or Laptop currently assigned
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                If you require a workstation, please contact the IT Infrastructure team.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 4. ASSIGNED COMPANY ASSETS & PERIPHERALS */}
      {(activeSection === 'all' || activeSection === 'assets') && (
        <div className="bg-white dark:bg-[#101726] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-xs">
                  <Layers className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Assigned Company Assets & Peripherals</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      {assignedCompanyAssets.length} Assets
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    All company-provided equipment issued to your custody, including Laptop/Desktop, Mobile Phone, Keyboard, Mouse & Headset
                  </p>
                </div>
              </div>
            </div>

            {/* Category Quick Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                <Laptop className="w-3 h-3 text-blue-500" /> Laptop/PC
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border border-pink-200/60 dark:border-pink-800/60">
                <Smartphone className="w-3 h-3 text-pink-500" /> Mobile Phone
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                <Keyboard className="w-3 h-3 text-amber-500" /> Keyboard
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                <Mouse className="w-3 h-3 text-purple-500" /> Mouse
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                <Headphones className="w-3 h-3 text-emerald-500" /> Headset
              </span>
            </div>
          </div>

          {assignedCompanyAssets.length > 0 ? (
            <div className="pt-4 space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-3 px-3.5">Asset Type</th>
                      <th className="py-3 px-3.5">Asset Tag #</th>
                      <th className="py-3 px-3.5">Brand & Model</th>
                      <th className="py-3 px-3.5">Serial / IMEI</th>
                      <th className="py-3 px-3.5">Assignment Date</th>
                      <th className="py-3 px-3.5">Condition</th>
                      <th className="py-3 px-3.5">Status</th>
                      <th className="py-3 px-3.5">Relevant Asset Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {assignedCompanyAssets.map(asset => {
                      const isPhone = asset.assetType === 'Mobile Phone';
                      const isComp = asset.assetType === 'Laptop' || asset.assetType === 'Desktop';
                      return (
                        <tr
                          key={asset.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors"
                        >
                          {/* 1. Asset Type */}
                          <td className="py-3.5 px-3.5">
                            <div className="flex items-center gap-2.5 font-bold text-slate-900 dark:text-white">
                              <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                                {getAssetIcon(asset.assetType)}
                              </div>
                              <div>
                                <span className="block">{asset.assetType}</span>
                                {isComp && (
                                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">
                                    Primary Workstation
                                  </span>
                                )}
                                {isPhone && (
                                  <span className="text-[10px] text-pink-600 dark:text-pink-400 font-normal">
                                    Company Cellular
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 2. Asset Tag # */}
                          <td className="py-3.5 px-3.5">
                            <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20 inline-block">
                              {asset.assetNumber}
                            </span>
                          </td>

                          {/* 3. Brand & Model */}
                          <td className="py-3.5 px-3.5 text-slate-800 dark:text-slate-200 font-semibold">
                            <div>{asset.brand} {asset.model}</div>
                            {asset.deviceName && asset.deviceName !== `${asset.brand} ${asset.model}` && (
                              <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                                Device: <span className="font-mono">{asset.deviceName}</span>
                              </div>
                            )}
                          </td>

                          {/* 4. Serial / IMEI */}
                          <td className="py-3.5 px-3.5 font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                            {asset.imeiNumber ? (
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase mr-1">IMEI:</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{asset.imeiNumber}</span>
                              </div>
                            ) : (
                              asset.serialNumber
                            )}
                          </td>

                          {/* 5. Assignment Date */}
                          <td className="py-3.5 px-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{formatDateDisplay(asset.assignedDate)}</span>
                            </div>
                          </td>

                          {/* 6. Condition */}
                          <td className="py-3.5 px-3.5">
                            <ConditionBadge condition={asset.condition} />
                          </td>

                          {/* 7. Status */}
                          <td className="py-3.5 px-3.5">
                            <AssetStatusBadge status={asset.status} />
                          </td>

                          {/* 8. Relevant Asset Details */}
                          <td className="py-3.5 px-3.5 text-slate-600 dark:text-slate-300">
                            <div className="text-[11px] leading-relaxed max-w-xs">
                              {asset.relevantDetails}
                            </div>
                            {asset.specPill && (
                              <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                                {asset.specPill}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Asset Custody Guidelines */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>
                    All listed company assets remain corporate property under active custody. Please report damaged, lost, or malfunctioning equipment to IT Support promptly.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 cursor-pointer"
                  >
                    <Wrench className="w-3 h-3" />
                    <span>Report Asset Issue</span>
                  </button>
                  <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Active Custody Verified
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-xl mt-4 border border-dashed border-slate-200 dark:border-slate-800">
              <Layers className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No company assets currently assigned
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Workstation, mobile phone, and peripheral equipment will appear here once allocated.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 5. ASSET ALLOCATION DATES & CUSTODY HISTORY */}
      {(activeSection === 'all' || activeSection === 'assets') && myAllocations.length > 0 && (
        <div className="bg-white dark:bg-[#101726] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Asset Assignment Dates & Custody History
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Signed handover records and verification dates for your issued devices
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
                  <th className="py-2.5 px-3 rounded-l-lg">Handover Date</th>
                  <th className="py-2.5 px-3">Asset</th>
                  <th className="py-2.5 px-3">Tag / Serial</th>
                  <th className="py-2.5 px-3">Issued By</th>
                  <th className="py-2.5 px-3">Condition at Issue</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 rounded-r-lg">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {myAllocations.map(alloc => (
                  <tr key={alloc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      {formatDateDisplay(alloc.assignedDate)}
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                      {alloc.assetType}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {alloc.assetNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      {alloc.issuedBy}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                        {alloc.conditionAtIssue}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                        {alloc.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {alloc.remarks || 'Standard assignment'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. DESKTOP MAINTENANCE AND REPAIR HISTORY */}
      {(activeSection === 'all' || activeSection === 'maintenance') && (
        <div className="bg-white dark:bg-[#101726] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Workstation Maintenance & Repair History</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    {myServiceRecords.length} Records
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Detailed technical service log and resolution notes for your machine
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAssetRequestModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit Request to Admin</span>
            </button>
          </div>

          {/* Maintenance KPIs */}
          {assignedComputer && serviceSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Total Services</div>
                <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  {serviceSummary.totalServices}
                </div>
                <div className="text-[10px] text-slate-500">Since provision date</div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Last Service</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                  {serviceSummary.lastServiceDate || 'None'}
                </div>
                <div className="text-[10px] text-slate-500">Inspection date</div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Total Cost Approved</div>
                <div className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCurrency(serviceSummary.totalRepairCost)}
                </div>
                <div className="text-[10px] text-slate-500">Covered by IT Department</div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Device Health</div>
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{assignedComputer.status === 'Under Service' ? 'Under Repair' : 'Operational'}</span>
                </div>
                <div className="text-[10px] text-slate-500">{assignedComputer.condition} Condition</div>
              </div>
            </div>
          )}

          {/* Service Records Table */}
          {myServiceRecords.length > 0 ? (
            <div className="pt-4 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
                    <th className="py-2.5 px-3 rounded-l-lg">Ticket ID & Date</th>
                    <th className="py-2.5 px-3">Problem Category</th>
                    <th className="py-2.5 px-3">Reported Issue & Diagnostics</th>
                    <th className="py-2.5 px-3">Work Performed & Parts</th>
                    <th className="py-2.5 px-3">Service Provider & Tech</th>
                    <th className="py-2.5 px-3">Repair Cost</th>
                    <th className="py-2.5 px-3">Receipt / Invoice</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 rounded-r-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {myServiceRecords.map(record => (
                    <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {record.id}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{formatDateDisplay(record.serviceDate)}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                          {record.assetNumber}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <ProblemCategoryBadge category={record.problemCategory} />
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {record.problem}
                        </div>
                        {record.resolution && (
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">Service Notes / Resolution:</span> {record.resolution}
                          </div>
                        )}
                        {record.remarks && record.remarks !== record.resolution && (
                          <div className="text-[10px] text-slate-400 italic mt-0.5">
                            {record.remarks}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-700 dark:text-slate-300 font-medium">
                          {record.workPerformed || 'Standard maintenance performed.'}
                        </div>
                        {record.partsReplaced && record.partsReplaced !== 'None' && (
                          <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400 mt-1">
                            Parts Replaced: {record.partsReplaced}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {record.serviceProviderShopName ? (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span className="truncate max-w-[150px]">{record.serviceProviderShopName}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {record.technician || 'Technician'}
                            </div>
                            {record.serviceProviderPhone && (
                              <a
                                href={`https://wa.me/${record.serviceProviderPhone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                                title="Chat on WhatsApp"
                              >
                                <span>+91 {record.serviceProviderPhone}</span>
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="text-slate-600 dark:text-slate-400 font-medium">
                            {record.technician || 'Assigned Technician'}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(record.serviceCost || 0)}
                      </td>
                      <td className="py-3 px-3">
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
                            <span>Add Receipt</span>
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <ServiceStatusBadge status={record.serviceStatus} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {record.receiptFileUrl && (
                            <button
                              type="button"
                              onClick={() => setPreviewReceiptRecord(record)}
                              className="p-1 rounded text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="View / Download Receipt"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setUploadReceiptRecordId(record.id)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-[11px] font-semibold flex items-center gap-1"
                            title="Upload / Update Receipt & Cost"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-xl mt-4 border border-dashed border-slate-200 dark:border-slate-800">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No active maintenance incidents reported
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
                Having issues with your assigned PC, desktop, or peripherals? You can submit a support ticket directly to the IT Admin.
              </p>
              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Submit a PC or Hardware Support Request</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 7. WEEKLY ASSET PHOTO DOCUMENTATION & HISTORY */}
      {employee && (activeSection === 'all' || activeSection === 'assets' || activeSection === 'photos') && (
        <EmployeeWeeklyPhotoSection employeeId={employee.id} employeeName={employee.name} />
      )}

      {/* 8. RELEVANT NOTIFICATIONS AND UPDATES */}
      {(activeSection === 'all' || activeSection === 'updates') && (
        <div className="bg-white dark:bg-[#101726] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Relevant Notifications & System Updates
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Important alerts regarding your workstation, assets, and IT policies
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
            {/* Dynamic SIM Recharge Notification for Employee Active Assigned SIMs */}
            {(() => {
              const activeMySimCards = getEmployeeActiveSimCards(employee, simCards);
              const activeMySimIds = new Set(activeMySimCards.map(s => s.id));
              const myRechargeLogs = (simRecharges || []).filter((r: SimRecharge) => activeMySimIds.has(r.simId) || (r.employeeId && r.employeeId === (employee?.id || employee?.employeeId)));
              const latestRecharge = myRechargeLogs.length > 0 ? myRechargeLogs[0] : null;

              if (!latestRecharge) return null;

              return (
                <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/80 dark:border-emerald-900/50 flex items-start gap-3 col-span-1 md:col-span-2 shadow-2xs">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        SIM Recharge Completed
                      </h4>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded font-bold">
                        RECHARGED
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 font-medium">
                      Your assigned SIM ({latestRecharge.contactNumber}) has been successfully recharged by the admin.
                    </p>
                    <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Recharged on {latestRecharge.rechargeDate}</span>
                      <span>•</span>
                      <span>Plan: {latestRecharge.planDescription || 'Monthly Unlimited'}</span>
                      <span>•</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">Total: {formatINR(latestRecharge.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Notification 1: Workstation Health Alert */}
            <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200/80 dark:border-blue-900/50 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Hardware Security & Policy Status
                  </h4>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded font-bold">
                    COMPLIANT
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                  Your workstation ({assignedComputer?.assetNumber || 'Workstation'}) is compliant with corporate antivirus, TPM 2.0, and endpoint encryption standards.
                </p>
                <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Verified today
                </div>
              </div>
            </div>

            {/* Notification 2: Maintenance Notice */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Preventive Maintenance Window
                  </h4>
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded font-bold">
                    UPCOMING
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                  Periodic dust cleanup and thermal paste diagnostics for engineering and developer machines is scheduled for next month.
                </p>
                <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Scheduled for October 2026
                </div>
              </div>
            </div>

            {/* Notification 3: Peripheral Custody Audit */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Peripheral Custody Verification
                  </h4>
                  <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded font-bold">
                    VERIFIED
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                  {assignedAssets.length} peripheral items recorded under your custody. All serial numbers match current IT inventory records.
                </p>
                <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Updated 01-Sep-2026
                </div>
              </div>
            </div>

            {/* Notification 4: IT Helpdesk Contact Desk */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Need Hardware Assistance?
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                  For keyboard/mouse replacements, monitor cables, or urgent system repairs, contact the IT desk directly.
                </p>
                <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-2 font-semibold flex items-center gap-3">
                  <span>Desk Ext: #4400</span>
                  <span>&bull;</span>
                  <a
                    href={`mailto:${IT_SUPPORT_EMAIL}`}
                    className="hover:underline flex items-center gap-1 font-mono text-xs"
                  >
                    <Mail className="w-3 h-3" />
                    <span>{IT_SUPPORT_EMAIL}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7.5. MY MULTI-ASSET EQUIPMENT REQUISITIONS */}
      {(activeSection === 'all' || activeSection === 'requests') && (
        <div className="bg-white dark:bg-[#101726] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>My Equipment Requisitions &amp; Requests</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    {myAssetRequests.length} Requests
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Track requested hardware, accessories, quantities, and IT Admin fulfillment status
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAssetRequestModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit Request to Admin</span>
            </button>
          </div>

          {myAssetRequests.length === 0 ? (
            <div className="p-8 text-center bg-slate-50/60 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-500 flex items-center justify-center mx-auto">
                <Layers className="w-5 h-5" />
              </div>
              <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                No equipment requisitions submitted yet
              </div>
              <p className="text-slate-500 text-[11px] max-w-sm mx-auto">
                Need a new mouse, mechanical keyboard, monitor, headset, or other equipment? Submit a request to the IT Admin.
              </p>
              <button
                type="button"
                onClick={() => setShowAssetRequestModal(true)}
                className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Submit Request to Admin</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myAssetRequests.map(req => {
                const totalUnits = req.items.reduce((s, i) => s + (i.quantity || 1), 0);
                return (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-2.5 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          #{req.id}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            req.status === 'Pending'
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse'
                              : req.status === 'Approved'
                              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
                              : req.status === 'Fulfilled'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {req.status}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {req.urgency} Priority
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatDateDisplay(req.requestDate)}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">
                        {req.items.length} Asset Type{req.items.length > 1 ? 's' : ''} &bull; {totalUnits} Total Unit{totalUnits > 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Items chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {req.items.map((item, idx) => (
                        <span
                          key={item.id || idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-800 dark:text-slate-200"
                        >
                          <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                            {item.quantity}x
                          </span>
                          <span>
                            {item.customAssetName ? `${item.assetType} (${item.customAssetName})` : item.assetType}
                          </span>
                          {item.specifications && (
                            <span className="text-[10px] text-slate-400 italic">
                              ({item.specifications})
                            </span>
                          )}
                        </span>
                      ))}
                    </div>

                    {/* Reason */}
                    <p className="text-[11.5px] text-slate-600 dark:text-slate-400 italic bg-white/60 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                      &ldquo;{req.reason}&rdquo;
                    </p>

                    {/* Admin Notes if present */}
                    {req.adminNotes && (
                      <div className="p-2 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/50 text-[11px] text-blue-900 dark:text-blue-300">
                        <strong>IT Admin Note:</strong> {req.adminNotes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 7.8. MY ASSIGNED SIM CARDS & TELECOM FLEET */}
      {(activeSection === 'all' || activeSection === 'sim-cards') &&
        (() => {
          const activeMySimCards = getEmployeeActiveSimCards(employee, simCards);
          const activeMySimIds = new Set(activeMySimCards.map(s => s.id));
          const myRecharges = (simRecharges || []).filter((r: SimRecharge) => activeMySimIds.has(r.simId) || (r.employeeId && r.employeeId === (employee?.id || employee?.employeeId)));
          const myBaseRecharge = myRecharges.reduce((sum: number, r: SimRecharge) => sum + (Number(r.rechargeAmount) || 0), 0);
          const myGstAmount = myRecharges.reduce((sum: number, r: SimRecharge) => sum + (Number(r.gstAmount) || 0), 0);
          const myTotalExpense = myRecharges.reduce((sum: number, r: SimRecharge) => sum + (Number(r.totalAmount) || 0), 0);
          const mySimExpense = {
            simCount: activeMySimCards.length,
            rechargeCount: myRecharges.length,
            baseRecharge: myBaseRecharge,
            gstAmount: myGstAmount,
            totalExpense: myTotalExpense,
          };
          const usageBadge = getSimUsageBadgeStyle(mySimCards.length);
        return (
          <div className="p-5 rounded-2xl bg-white dark:bg-[#101726] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                    <span>My Assigned SIM Cards &amp; Mobile Numbers</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${usageBadge.bg} ${usageBadge.text} ${usageBadge.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1 ${usageBadge.dotColor}`} />
                      {usageBadge.label}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      Total Monthly SIM Expense: {formatINR(mySimExpense.totalExpense)}
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Track allocated corporate numbers, project assignments, and monthly SIM recharge expense
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSimModalDefaultType('Suspend SIM');
                    setShowSimRequestModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Request Suspension</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSimModalDefaultType('Additional SIM');
                    setShowSimRequestModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Request Additional SIM</span>
                </button>
              </div>
            </div>

            {/* SIM Recharge Cost Breakdown Telemetry Card */}
            {mySimCards.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/5 via-blue-500/5 to-transparent border border-emerald-500/20">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Assigned SIMs</span>
                  <p className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">{mySimExpense.simCount} SIMs</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Monthly Base Recharge</span>
                  <p className="text-lg font-mono font-bold text-slate-900 dark:text-white">{formatINR(mySimExpense.baseRecharge)}</p>
                  <p className="text-[10px] text-slate-400">({mySimExpense.simCount} × ₹399.00)</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">GST Amount (18%)</span>
                  <p className="text-lg font-mono font-bold text-amber-600 dark:text-amber-400">{formatINR(mySimExpense.gstAmount)}</p>
                  <p className="text-[10px] text-slate-400">({mySimExpense.simCount} × ₹71.82)</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Monthly SIM Expense</span>
                  <p className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">{formatINR(mySimExpense.totalExpense)}</p>
                  <p className="text-[10px] text-slate-400">({mySimExpense.simCount} × ₹470.82)</p>
                </div>
              </div>
            )}

            {/* SIM Table */}
            {mySimCards.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/60 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 space-y-2.5">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center mx-auto">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                  No corporate SIM cards currently assigned
                </div>
                <p className="text-slate-500 text-[11px] max-w-sm mx-auto">
                  Need a dedicated calling, WhatsApp, or field operations SIM for a project? Submit a requisition directly to Admin.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSimModalDefaultType('Additional SIM');
                    setShowSimRequestModal(true);
                  }}
                  className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Request New SIM</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/70 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Contact / Mobile No.</th>
                      <th className="py-2.5 px-4 font-semibold">Purpose</th>
                      <th className="py-2.5 px-4 font-semibold">Project</th>
                      <th className="py-2.5 px-4 font-semibold">Status</th>
                      <th className="py-2.5 px-4 font-semibold">Monthly Recharge Cost</th>
                      <th className="py-2.5 px-4 font-semibold">Carrier / Plan</th>
                      <th className="py-2.5 px-4 font-semibold">Remarks / Notes</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                    {mySimCards.map(sim => (
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
                          <div className="space-y-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getSimStatusStyle(sim.status)}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sim.status === 'Active' ? 'bg-emerald-500' : sim.status === 'Suspended' ? 'bg-rose-500' : 'bg-blue-500'}`} />
                              <span>{sim.status}</span>
                            </span>

                            {(() => {
                              const activeIssue = mySimRequests.find(r => (r.simId === sim.id || r.contactNumber === sim.contactNumber) && r.requestType === 'Report Issue');
                              if (activeIssue) {
                                return (
                                  <div className="p-1 rounded bg-rose-500/10 border border-rose-500/20 text-[10px]">
                                    <div className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 flex-wrap">
                                      <span>🔴 {activeIssue.issueType || 'Issue Reported'}</span>
                                      <span className={`px-1.5 py-0.2 rounded font-mono text-[9px] ${
                                        activeIssue.status === 'Resolved'
                                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                          : activeIssue.status === 'In Progress'
                                          ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                                          : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                      }`}>
                                        Status: {activeIssue.status}
                                      </span>
                                    </div>
                                    {activeIssue.resolutionRemarks && (
                                      <div className="text-emerald-600 dark:text-emerald-400 font-medium text-[9px] mt-0.5">
                                        🟢 Resolution: {activeIssue.resolutionRemarks}
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </td>
                        {/* Monthly Recharge Breakdown */}
                        <td className="py-3 px-4 text-[11px]">
                          {(() => {
                            const simRec = (simRecharges || []).find((r: SimRecharge) => r.simId === sim.id || r.contactNumber === sim.contactNumber);
                            if (simRec) {
                              return (
                                <div className="space-y-0.5 font-mono">
                                  <div className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                    <span>🟢 Total: {formatINR(simRec.totalAmount)}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate max-w-[200px]" title={`${simRec.rechargeDate} — ${simRec.planDescription}`}>
                                    Recharged: {simRec.rechargeDate} ({simRec.planDescription})
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <div className="space-y-0.5 font-mono">
                                <div className="text-slate-900 dark:text-white font-bold">
                                  Total: ₹0.00
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  No completed recharge logged
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="py-3 px-4 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-800 dark:text-slate-200 font-medium">{sim.carrier || 'Standard'}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${getSimTypeBadgeStyle(sim.simType).bg} ${getSimTypeBadgeStyle(sim.simType).text} ${getSimTypeBadgeStyle(sim.simType).border}`}>
                              {getSimTypeBadgeStyle(sim.simType).label}
                            </span>
                          </div>
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
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSimForIssue(sim);
                                setShowReportIssueModal(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-md transition-colors cursor-pointer"
                              title="Report SIM blockage, no service, or data issue to IT Admin"
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-500" />
                              <span>Report Issue</span>
                            </button>

                            {sim.status === 'Active' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSimModalDefaultType('Suspend SIM');
                                  setShowSimRequestModal(true);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer"
                                title="Submit Suspension Request for this SIM"
                              >
                                <span>Request Suspension</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          {/* SIM Requests tracking */}
          {mySimRequests.length > 0 && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                My SIM Requisition &amp; Suspension History ({mySimRequests.length})
              </h4>
              <div className="space-y-2">
                {mySimRequests.map(req => (
                  <div
                    key={req.id}
                    className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">#{req.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          req.requestType === 'Suspend SIM'
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        }`}>
                          {req.requestType}
                        </span>
                        {req.simType && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getSimTypeBadgeStyle(req.simType).bg} ${getSimTypeBadgeStyle(req.simType).text} ${getSimTypeBadgeStyle(req.simType).border}`}>
                            {getSimTypeBadgeStyle(req.simType).label}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          req.status === 'Pending'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse'
                            : req.status === 'Approved'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                        }`}>
                          {req.status}
                        </span>
                        {req.project && (
                          <span className="text-[11px] text-slate-500 font-medium">📁 {req.project}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                        &ldquo;{req.reason}&rdquo;
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const waUrl = req.requestType === 'Suspend SIM' && req.simId
                          ? generateSimSuspensionWhatsAppUrl({ contactNumber: req.contactNumber || '', purpose: (req.purpose as any) || 'General' } as SimCard, req.reason, req.employeeName)
                          : generateSimSuspensionWhatsAppUrl({ contactNumber: 'New Requisition', purpose: (req.purpose as any) || 'General' } as SimCard, req.reason, req.employeeName);
                        window.open(waUrl, '_blank', 'noopener,noreferrer');
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md transition-colors shrink-0"
                    >
                      <Send className="w-3 h-3" />
                      <span>WhatsApp Notify</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    })()}

      {/* 8. SELF-SERVICE WORKSTATION & ASSET ISSUE REPORTING MODAL */}
      {showReportModal && (assignedComputer || assignedAssets.length > 0) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-[#101726] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {submittedTicketResult ? 'Service Ticket Dispatched' : 'Report Workstation Issue'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {submittedTicketResult
                      ? `Ticket #${submittedTicketResult.ticketId} logged & prepared for IT Support`
                      : `Log an IT service ticket for your assigned hardware (${assignedComputer ? assignedComputer.assetNumber : 'Assets'})`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setSubmittedTicketResult(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {submittedTicketResult ? (
              <div className="pt-4 space-y-4">
                <div className="text-center py-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 ring-8 ring-emerald-500/5">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Ticket Logged & IT Dispatch Prepared!
                  </h3>
                  <div className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono text-xs font-bold border border-emerald-300/60 dark:border-emerald-800">
                    <span>Ticket ID: {submittedTicketResult.ticketId}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                    A permanent record has been saved to your service database and formatted for delivery directly to{' '}
                    <strong className="text-blue-600 dark:text-blue-400 font-mono">{IT_SUPPORT_EMAIL}</strong>.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Target Device:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {submittedTicketResult.assetNumber} &mdash; {submittedTicketResult.deviceName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Database Status:</span>
                    <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      In Progress (Assigned for IT Diagnostics)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">IT Destination:</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {IT_SUPPORT_EMAIL}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Send / Dispatch Actions:</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">Gmail window auto-opened</span>
                  </div>

                  <a
                    href={submittedTicketResult.gmailComposeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Pre-filled Ticket in Gmail Web</span>
                  </a>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={submittedTicketResult.mailtoUrl}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-500" />
                      <span>Desktop Mail (Outlook)</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(submittedTicketResult.body);
                        showToast('Copied complete ticket & specs to clipboard!', 'info');
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Full Ticket</span>
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReportModal(false);
                      setSubmittedTicketResult(null);
                      setProblemDescription('');
                      setActiveSection('maintenance');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    <span>View in My Maintenance History &rarr;</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowReportModal(false);
                      setSubmittedTicketResult(null);
                      setProblemDescription('');
                    }}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReportIssue} className="space-y-4 pt-4">
                {/* Target Device Selector / Info */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Workstation / Device *
                  </label>
                  <select
                    value={selectedAssetId}
                    onChange={e => setSelectedAssetId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                  >
                    <option value="">
                      {assignedComputer
                        ? `💻 Primary Workstation: ${assignedComputer.assetNumber} - ${assignedComputer.deviceName} (${assignedComputer.manufacturer} ${assignedComputer.model})`
                        : `💻 Assigned Workstation / Primary PC (${employee.name})`}
                    </option>
                    {assignedAssets.map(a => (
                      <option key={a.id} value={a.id}>
                        🔌 {a.assetType}: ${a.assetNumber} - ${a.brand} ${a.model} (S/N: ${a.serialNumber || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quick Problem Presets */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Quick Problem Presets (Click to Auto-fill)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {[
                      {
                        title: 'My PC is not working properly',
                        desc: 'System freezing, startup issues or unexpected crashes',
                        category: 'Windows Problem' as ProblemCategory,
                      },
                      {
                        title: 'Hardware/Software technical support required',
                        desc: 'Technical diagnostic or repair needed on workstation',
                        category: 'Hardware Failure' as ProblemCategory,
                      },
                      {
                        title: 'System running extremely slow / freezing',
                        desc: 'High CPU/RAM utilization and frequent application unresponsiveness',
                        category: 'Slow Performance' as ProblemCategory,
                      },
                      {
                        title: 'Display / Screen or Peripheral malfunction',
                        desc: 'Screen flickering, keyboard or mouse input failure',
                        category: 'Display Problem' as ProblemCategory,
                      },
                    ].map(preset => (
                      <button
                        key={preset.title}
                        type="button"
                        onClick={() => {
                          setProblemDescription(`${preset.title}. ${preset.desc}.`);
                          setProblemCategory(preset.category);
                        }}
                        className="text-left p-2 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200/60 dark:border-blue-800/60 transition-colors cursor-pointer group"
                      >
                        <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 group-hover:text-blue-600">
                          &ldquo;{preset.title}&rdquo;
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {preset.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Problem Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Problem Category *
                  </label>
                  <select
                    value={problemCategory}
                    onChange={e => setProblemCategory(e.target.value as ProblemCategory)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Slow Performance">Slow Performance / Freezing</option>
                    <option value="Windows Problem">Windows OS / Crash / Blue Screen</option>
                    <option value="RAM Problem">RAM / Memory Shortage</option>
                    <option value="SSD/HDD Problem">Storage / Disk Full / Corrupted Files</option>
                    <option value="Display Problem">Display / Screen Flickering</option>
                    <option value="Keyboard Problem">Keyboard Malfunction</option>
                    <option value="Mouse Problem">Mouse / Touchpad Problem</option>
                    <option value="Network Problem">Wi-Fi / Ethernet Connection Issue</option>
                    <option value="Software Installation">Software / Dev Tool Installation</option>
                    <option value="Driver Problem">Driver / Audio / Bluetooth Issue</option>
                    <option value="Hardware Failure">Hardware Failure / Overheating</option>
                    <option value="Other">Other Hardware Issue</option>
                  </select>
                </div>

                {/* Urgency */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Urgency Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Normal', 'High', 'Critical'] as const).map(lvl => (
                      <button
                        type="button"
                        key={lvl}
                        onClick={() => setIssueUrgency(lvl)}
                        className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                          issueUrgency === lvl
                            ? lvl === 'Critical'
                              ? 'bg-rose-500 text-white border-rose-600'
                              : lvl === 'High'
                              ? 'bg-amber-500 text-white border-amber-600'
                              : 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Problem Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Issue Description &amp; Observed Symptoms *
                  </label>
                  <textarea
                    rows={3}
                    value={problemDescription}
                    onChange={e => setProblemDescription(e.target.value)}
                    placeholder="e.g. My PC is not working properly or has a hardware/software issue..."
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Repair Cost & Receipt Info Section */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Repair / Service Cost &amp; Receipt Upload</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">(Optional / If applicable)</span>
                  </div>

                  {/* Repair Cost Input */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Repair Cost Amount (₹)
                    </label>
                    <div className="relative rounded-lg shadow-2xs">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                        <IndianRupee className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={reportRepairCost}
                        onChange={e => setReportRepairCost(Number(e.target.value))}
                        placeholder="Enter estimated or actual repair amount (₹)"
                        className="w-full pl-8 pr-3 py-1.5 text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Receipt Number & Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                        Receipt / Invoice No.
                      </label>
                      <input
                        type="text"
                        value={reportReceiptNumber}
                        onChange={e => setReportReceiptNumber(e.target.value)}
                        placeholder="e.g. BILL-8890"
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                        Receipt Date
                      </label>
                      <input
                        type="date"
                        value={reportReceiptDate}
                        onChange={e => setReportReceiptDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Receipt Upload File */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Upload Repair Receipt (JPG, PNG, PDF &lt; 10MB)
                    </label>

                    {!reportReceiptFileUrl ? (
                      <label className="border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer bg-white dark:bg-slate-800/60 transition-colors">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          onChange={handleReportReceiptFileChange}
                          className="hidden"
                        />
                        <UploadCloud className="w-5 h-5 text-emerald-500 mb-1" />
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Click to select repair receipt or invoice file
                        </span>
                        <span className="text-[9px] text-slate-400">JPG, PNG, or PDF up to 10MB</span>
                      </label>
                    ) : (
                      <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                          <div className="overflow-hidden">
                            <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
                              {reportReceiptFileName}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {reportReceiptFileName.endsWith('.pdf') ? 'PDF Document' : 'Image File'} • {Math.round(reportReceiptFileSize / 1024)} KB
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveReportReceiptFile}
                          className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
                          title="Remove file"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {reportReceiptError && (
                      <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{reportReceiptError}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Direct Admin Notification Notice */}
                <div className="p-3 bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 rounded-xl flex items-start gap-2.5 text-[11px] text-blue-950 dark:text-blue-200">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold flex items-center gap-1.5 flex-wrap">
                      <span>Direct Enterprise Delivery:</span>
                      <span className="font-mono bg-blue-100 dark:bg-blue-900/70 px-1.5 py-0.5 rounded text-blue-700 dark:text-blue-300 font-bold border border-blue-300/50">
                        Admin Command Desk &amp; {IT_SUPPORT_EMAIL}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed text-[11px]">
                      Your request will immediately appear in the IT Admin&apos;s <strong>Service &amp; Repairs</strong> queue for prompt diagnosis and resolution.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReportModal(false);
                      setSubmittedTicketResult(null);
                      setReportRepairCost(0);
                      setReportReceiptFileName('');
                      setReportReceiptFileUrl('');
                      setReportReceiptFileSize(0);
                      setReportReceiptNumber('');
                      setReportReceiptError('');
                    }}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting Request...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Issue Ticket to Admin</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 9. MULTI-ASSET EQUIPMENT REQUISITION MODAL */}
      <SubmitAssetRequestModal
        isOpen={showAssetRequestModal}
        onClose={() => setShowAssetRequestModal(false)}
      />

      {/* 10. SIM REQUISITION & SUSPENSION MODAL */}
      <RequestSimModal
        isOpen={showSimRequestModal}
        onClose={() => setShowSimRequestModal(false)}
        defaultType={simModalDefaultType}
        preselectedEmployeeId={employee?.id}
      />

      {/* 11. REPORT SIM ISSUE MODAL */}
      <ReportSimIssueModal
        isOpen={showReportIssueModal}
        onClose={() => {
          setShowReportIssueModal(false);
          setSelectedSimForIssue(null);
        }}
        targetSim={selectedSimForIssue}
      />

      {/* 12. SERVICE RECEIPT PREVIEW MODAL */}
      <ServiceReceiptPreviewModal
        isOpen={!!previewReceiptRecord}
        record={previewReceiptRecord}
        onClose={() => setPreviewReceiptRecord(null)}
        onOpenUpload={(id) => setUploadReceiptRecordId(id)}
      />

      {/* 13. UPLOAD / UPDATE SERVICE RECEIPT MODAL */}
      <UploadServiceReceiptModal
        isOpen={!!uploadReceiptRecordId}
        recordId={uploadReceiptRecordId}
        onClose={() => setUploadReceiptRecordId(null)}
      />
    </div>
  );
};
