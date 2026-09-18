import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { hashPassword, hashPasswordSync } from '../utils/security';
import {
  Employee,
  Computer,
  CompanyAsset,
  AssetAllocationRecord,
  ServiceRecord,
  AuditLog,
  UserRole,
  AuthUser,
  GlobalFilters,
  AssetCondition,
  AssetType,
  WeeklyAssetPhotoRecord,
  PurchaseRecord,
  PurchasedAccessoryItem,
  AssetRequest,
  AssetRequestItem,
  RequestStatus,
  RequestUrgency,
  SimCard,
  SimRecharge,
  SimRequest,
  SimRequestStatus,
  SimStatus,
  SimPurpose,
  SimType,
  ServiceProvider,
  ActiveSystemSupportTicket,
  AssetQuery,
  AssetQueryStatus,
  AssetQueryType,
  AssetQueryHistoryItem,
} from '../types';
import {
  INITIAL_EMPLOYEES,
  INITIAL_COMPUTERS,
  INITIAL_COMPANY_ASSETS,
  INITIAL_SERVICE_RECORDS,
  INITIAL_ALLOCATION_RECORDS,
  INITIAL_AUDIT_LOGS,
  INITIAL_WEEKLY_PHOTO_RECORDS,
  INITIAL_PURCHASES,
  INITIAL_SIM_CARDS,
  INITIAL_SIM_RECHARGES,
  INITIAL_SIM_REQUESTS,
  INITIAL_SERVICE_PROVIDERS,
  INITIAL_ASSET_QUERIES,
} from '../data/initialSeedData';
import { getEmployeePhoneFirst6 } from '../utils/formatters';
import { assetCoreDB, DatabaseStats } from '../db/indexedDB';
import {
  downloadDatabaseBackup,
  restoreDatabaseFromFile,
  exportFleetToCSV,
} from '../db/backupManager';
import { api } from '../services/api';
import { calculateRechargeGst } from '../utils/simUtils';

interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  // State
  employees: Employee[];
  computers: Computer[];
  assets: CompanyAsset[];
  allocationRecords: AssetAllocationRecord[];
  serviceRecords: ServiceRecord[];
  auditLogs: AuditLog[];
  weeklyPhotoRecords: WeeklyAssetPhotoRecord[];
  purchases: PurchaseRecord[];
  assetRequests: AssetRequest[];
  simCards: SimCard[];
  simRecharges: SimRecharge[];
  simRequests: SimRequest[];
  serviceProviders: ServiceProvider[];
  activeSystemSupportTicket: ActiveSystemSupportTicket | null;
  selectedServiceProviderId: string | null;
  userRole: UserRole;
  currentEmployeeId: string; // EMP001 (Ratan Chaurasiya)
  activeTab: string;
  selectedEmployeeId: string | null;
  selectedComputerId: string | null;
  highlightedRequestId: string | null;
  simManagementSubTab: 'inventory' | 'recharges' | 'requests' | 'history';
  highlightedSimRequestId: string | null;
  theme: 'light' | 'dark';
  toasts: ToastNotification[];
  globalFilters: GlobalFilters;

  // Auth State & Actions
  isAuthenticated: boolean;
  currentUser: AuthUser | null;
  loginAsAdmin: (password?: string) => { success: boolean; error?: string };
  loginAsEmployee: (employeeIdOrEmail: string, password?: string) => { success: boolean; error?: string };
  changeAccountPassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  // Setters
  setUserRole: (role: UserRole) => void;
  setActiveTab: (tab: string) => void;
  setSelectedEmployeeId: (id: string | null) => void;
  setSelectedComputerId: (id: string | null) => void;
  setHighlightedRequestId: (id: string | null) => void;
  setSimManagementSubTab: (tab: 'inventory' | 'recharges' | 'requests' | 'history') => void;
  setHighlightedSimRequestId: (id: string | null) => void;
  highlightedServiceId: string | null;
  setHighlightedServiceId: (id: string | null) => void;
  setActiveSystemSupportTicket: (ticket: ActiveSystemSupportTicket | null) => void;
  setSelectedServiceProviderId: (id: string | null) => void;
  setGlobalFilters: (filters: Partial<GlobalFilters>) => void;
  resetGlobalFilters: () => void;
  toggleTheme: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;

  // Actions
  addEmployee: (
    empData: Omit<Employee, 'id'>,
    computerData?: (Omit<Computer, 'id' | 'assignedEmployeeId'> & { isExistingComputerId?: string; id?: string }) | null,
    assetsData?: Array<{
      assetType: AssetType;
      assetNumber: string;
      brand: string;
      model: string;
      serialNumber: string;
      assignedDate: string;
      condition: AssetCondition;
      status?: import('../types').AssetStatus;
      deviceName?: string;
      imeiNumber?: string;
      phoneNumber?: string;
      remarks?: string;
    }> | null,
    serviceRecordData?: {
      problemCategory?: import('../types').ProblemCategory;
      problem?: string;
      workPerformed?: string;
      partsReplaced?: string;
      technician?: string;
      serviceCost?: number;
      serviceStatus?: import('../types').ServiceStatus;
      resolution?: string;
      remarks?: string;
    } | null,
    simCardsData?: Array<{
      contactNumber: string;
      simNumber?: string;
      carrier?: string;
      purpose: SimPurpose;
      customPurpose?: string;
      project?: string;
      remarks?: string;
      isExistingSimId?: string;
    }> | null
  ) => { success: boolean; error?: string };

  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deactivateEmployee: (id: string, reason?: string) => void;
  reactivateEmployee: (id: string) => void;
  removeEmployeePermanently: (id: string) => void;
  removeAllEmployees: (options?: { returnAssetsToInventory?: boolean }) => void;
  
  addComputer: (computerData: Omit<Computer, 'id'>) => { success: boolean; error?: string };
  updateComputer: (id: string, updates: Partial<Computer>) => void;
  removeComputerPermanently: (id: string) => { success: boolean; error?: string };

  addCompanyAsset: (assetData: Omit<CompanyAsset, 'id'>) => { success: boolean; error?: string };
  assignAsset: (
    assetId: string,
    employeeId: string,
    assignedDate: string,
    condition: AssetCondition,
    issuedBy: string,
    remarks?: string,
    securityFunctionAdded?: 'Yes' | 'No',
    securityFunctionAddedDate?: string
  ) => { success: boolean; error?: string };

  returnAsset: (
    assetId: string,
    returnDate: string,
    returnCondition: AssetCondition,
    receivedBy: string,
    statusOption: 'Available' | 'Returned',
    remarks?: string
  ) => { success: boolean; error?: string };

  moveToBufferStock: (
    itemType: 'computer' | 'asset',
    itemId: string,
    options?: {
      returnCondition?: AssetCondition;
      returnDate?: string;
      receivedBy?: string;
      remarks?: string;
    }
  ) => { success: boolean; error?: string };

  updateCompanyAsset: (
    assetId: string,
    updates: Partial<CompanyAsset>
  ) => { success: boolean; error?: string };
  removeCompanyAsset: (assetId: string) => { success: boolean; error?: string };

  assignComputerToEmployee: (
    computerId: string,
    employeeId: string | null,
    assignedDate: string,
    condition?: AssetCondition,
    remarks?: string,
    securityFunctionAdded?: 'Yes' | 'No',
    securityFunctionAddedDate?: string
  ) => { success: boolean; error?: string };

  addServiceRecord: (record: Omit<ServiceRecord, 'id'>) => { success: boolean; error?: string };
  updateServiceRecord: (id: string, updates: Partial<ServiceRecord>) => void;
  removeServiceRecord: (id: string) => { success: boolean; error?: string };

  // Weekly Asset Photo Documentation Actions
  addWeeklyPhotoRecord: (record: Omit<WeeklyAssetPhotoRecord, 'id' | 'createdAt' | 'updatedAt'>) => { success: boolean; error?: string };
  updateWeeklyPhotoRecord: (id: string, updates: Partial<WeeklyAssetPhotoRecord>) => { success: boolean; error?: string };
  deleteWeeklyPhotoRecord: (id: string) => { success: boolean; error?: string };

  // PC/Laptop Purchase Management Actions
  addPurchaseRecord: (
    record: Omit<PurchaseRecord, 'id' | 'createdAt' | 'updatedAt' | 'totalAccessoriesCost' | 'grandTotalCost'> & {
      id?: string;
      accessories?: PurchasedAccessoryItem[];
    },
    options?: { addToFleet?: boolean }
  ) => { success: boolean; error?: string; data?: PurchaseRecord };
  updatePurchaseRecord: (id: string, updates: Partial<PurchaseRecord>) => { success: boolean; error?: string };
  removePurchaseRecord: (id: string) => { success: boolean; error?: string };
  assignPurchaseToEmployee: (
    purchaseId: string,
    employeeId: string | null,
    assignedDate?: string
  ) => { success: boolean; error?: string };

  // Multi-Asset Equipment Requisition Actions
  addAssetRequest: (
    requestData: Omit<AssetRequest, 'id' | 'createdAt'>
  ) => { success: boolean; error?: string; requestId?: string };
  updateAssetRequestStatus: (
    requestId: string,
    status: RequestStatus,
    adminNotes?: string
  ) => void;
  removeAssetRequest: (requestId: string) => void;

  // Staff Asset Query Management Actions
  assetQueries: AssetQuery[];
  addAssetQuery: (
    queryData: Omit<AssetQuery, 'id' | 'createdAt' | 'history' | 'isStarred' | 'status'> & { isStarred?: boolean }
  ) => { success: boolean; id?: string; message?: string };
  acknowledgeAssetQuery: (queryId: string, adminName?: string) => { success: boolean; message?: string };
  updateAssetQueryStatus: (
    queryId: string,
    status: AssetQueryStatus,
    notes?: string,
    updatedBy?: string
  ) => { success: boolean; message?: string };
  reportQueryStillUnresolved: (queryId: string, notes?: string) => { success: boolean; message?: string };
  toggleStarAssetQuery: (queryId: string) => { success: boolean; isStarred?: boolean };
  removeAssetQuery: (queryId: string) => { success: boolean };

  // Admin WhatsApp OTP & Password Reset Actions
  adminRecoveryNumber: string;
  requestAdminOtpViaWhatsApp: () => { success: boolean; message?: string; whatsappUrl?: string };
  verifyAdminOtp: (inputOtp: string) => { success: boolean; message?: string; error?: string; verifiedToken?: string };
  changeAdminPasswordWithOtp: (inputOtp: string, newPassword: string) => { success: boolean; message?: string; error?: string };

  // SIM Card & Telecom Management Actions
  addSimCard: (
    simData: Omit<SimCard, 'id' | 'createdAt' | 'updatedAt'>
  ) => { success: boolean; error?: string; data?: SimCard };
  updateSimCard: (id: string, updates: Partial<SimCard>) => { success: boolean; error?: string };
  assignSimCard: (
    simId: string,
    employeeId: string,
    purpose?: SimPurpose,
    customPurpose?: string,
    project?: string,
    remarks?: string,
    simType?: SimType
  ) => { success: boolean; error?: string };
  unassignSimCard: (simId: string, reason?: string) => { success: boolean; error?: string };
  suspendSimCard: (id: string, reason: string) => { success: boolean; error?: string };
  reactivateSimCard: (id: string) => { success: boolean; error?: string };
  removeSimCard: (id: string) => { success: boolean; error?: string };

  // SIM Recharge Management Actions
  addSimRecharge: (
    rechargeData: Omit<SimRecharge, 'id' | 'createdAt' | 'gstAmount' | 'totalAmount'> & {
      gstAmount?: number;
      totalAmount?: number;
    }
  ) => { success: boolean; error?: string; data?: SimRecharge };
  removeSimRecharge: (id: string) => { success: boolean; error?: string };

  // SIM Employee Requisitions & Requests
  submitSimRequest: (
    requestData: Omit<SimRequest, 'id' | 'createdAt'>
  ) => { success: boolean; error?: string; requestId?: string };
  updateSimRequestStatus: (
    requestId: string,
    status: SimRequestStatus,
    adminRemarks?: string,
    resolutionRemarks?: string
  ) => { success: boolean; error?: string };
  removeSimRequest: (requestId: string) => void;

  // System & PC Support Service Providers
  addServiceProvider: (
    providerData: Omit<ServiceProvider, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<{ success: boolean; provider?: ServiceProvider; error?: string }>;
  updateServiceProvider: (
    id: string,
    updates: Partial<ServiceProvider>
  ) => Promise<{ success: boolean; provider?: ServiceProvider; error?: string }>;
  deleteServiceProvider: (id: string) => Promise<{ success: boolean; error?: string }>;

  resetToDemoData: () => void;
  clearAllData: () => void;
  exportAllData: () => void;

  // Enterprise Database, Backup & Telemetry
  isDbConnected: boolean;
  dbStats: DatabaseStats | null;
  refreshDbStats: () => Promise<void>;
  downloadBackup: () => Promise<void>;
  restoreBackup: (file: File) => Promise<boolean>;
  exportFleetCSV: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'EMP_DESKTOP_ASSET_MGMT_V2';

const VALID_TABS_LIST = [
  'dashboard',
  'workstation',
  'hardware-dashboard',
  'lifecycle',
  'employees',
  'computers',
  'phones',
  'assets',
  'sim-management',
  'services',
  'requests',
  'audit',
  'weekly-photos',
  'purchases',
  'shared',
  'service-flowchart',
  'system-support',
  'pc-support',
];

const EMPLOYEE_ALLOWED_TABS = [
  'dashboard',
  'workstation',
  'assets',
  'sim-management',
  'services',
  'requests',
  'weekly-photos',
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Clean empty state defaults (0 employees, 0 computers, 0 phones, 0 peripherals)
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_EMPLOYEES`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [computers, setComputers] = useState<Computer[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_COMPUTERS`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [assets, setAssets] = useState<CompanyAsset[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_ASSETS`);
      const parsed: CompanyAsset[] = saved ? JSON.parse(saved) : [];
      const savedComps = localStorage.getItem(`${STORAGE_KEY}_COMPUTERS`);
      const comps: Computer[] = savedComps ? JSON.parse(savedComps) : [];
      const compAssetNumbers = new Set(comps.map(c => c.assetNumber.trim().toLowerCase()));
      const cleaned = parsed.filter(a => a.assetType !== 'Laptop' && !compAssetNumbers.has(a.assetNumber.trim().toLowerCase()));
      if (cleaned.length !== parsed.length) {
        try {
          localStorage.setItem(`${STORAGE_KEY}_ASSETS`, JSON.stringify(cleaned));
        } catch {}
      }
      return cleaned;
    } catch {
      return [];
    }
  });

  const [allocationRecords, setAllocationRecords] = useState<AssetAllocationRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_ALLOCATIONS`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_SERVICES`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_LOGS`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [weeklyPhotoRecords, setWeeklyPhotoRecords] = useState<WeeklyAssetPhotoRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_WEEKLY_PHOTO_DOCS`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [purchases, setPurchases] = useState<PurchaseRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_PURCHASES`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [assetRequests, setAssetRequests] = useState<AssetRequest[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_ASSET_REQUESTS`);
      return saved ? JSON.parse(saved) : [
        {
          id: 'REQ-2026-101',
          employeeId: 'EMP001',
          companyEmployeeNumber: 'CORP-8820',
          employeeName: 'Ratan Chaurasiya',
          employeeEmail: 'ratanchaurasiya61@gmail.com',
          employeePhone: '+91 63900-12345',
          department: 'Engineering',
          designation: 'Senior Full Stack Engineer',
          requestDate: '2026-03-12',
          urgency: 'High',
          status: 'Pending',
          items: [
            { id: 'item-101-1', assetType: 'Mouse', quantity: 1, specifications: 'Ergonomic wireless optical mouse' },
            { id: 'item-101-2', assetType: 'Keyboard', quantity: 1, specifications: 'Mechanical low-profile keyboard' },
            { id: 'item-101-3', assetType: 'Monitor', quantity: 1, specifications: '27-inch 4K IPS display with Type-C' },
          ],
          reason: 'Setting up dedicated multi-screen engineering workstation for heavy UI and distributed systems development.',
          createdAt: '2026-03-12T10:30:00.000Z',
        },
        {
          id: 'REQ-2026-102',
          employeeId: 'EMP002',
          companyEmployeeNumber: 'CORP-7711',
          employeeName: 'Priya Sharma',
          employeeEmail: 'priya.sharma@company.com',
          employeePhone: '+91 98765-43210',
          department: 'Product Management',
          designation: 'Lead Product Manager',
          requestDate: '2026-03-14',
          urgency: 'Normal',
          status: 'Approved',
          items: [
            { id: 'item-102-1', assetType: 'Headset', quantity: 1, specifications: 'Noise-cancelling with boom microphone' },
            { id: 'item-102-2', assetType: 'Webcam', quantity: 1, specifications: '1080p 60fps streaming webcam' },
          ],
          reason: 'Daily cross-timezone stakeholder syncs and enterprise client demos require high-clarity AV peripherals.',
          adminNotes: 'Approved by IT Lead. Ready for pickup at IT Desk.',
          createdAt: '2026-03-14T09:15:00.000Z',
        },
      ];
    } catch {
      return [];
    }
  });

  const [assetQueries, setAssetQueries] = useState<AssetQuery[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_ASSET_QUERIES`);
      return saved ? JSON.parse(saved) : INITIAL_ASSET_QUERIES;
    } catch {
      return INITIAL_ASSET_QUERIES;
    }
  });

  const ADMIN_RECOVERY_NUMBER = '6390035039';

  const [adminCustomPassword, setAdminCustomPassword] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`${STORAGE_KEY}_ADMIN_CUSTOM_PASS`);
    } catch {
      return null;
    }
  });

  const [adminPasswordHash, setAdminPasswordHash] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`${STORAGE_KEY}_ADMIN_PASS_HASH`);
    } catch {
      return null;
    }
  });

  const [activeAdminOtp, setActiveAdminOtp] = useState<{
    code: string;
    expiresAt: number;
    attempts: number;
    used: boolean;
    verifiedToken: boolean;
  } | null>(null);

  const [simCards, setSimCards] = useState<SimCard[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_SIM_CARDS`);
      return saved ? JSON.parse(saved) : INITIAL_SIM_CARDS;
    } catch {
      return INITIAL_SIM_CARDS;
    }
  });

  const [simRecharges, setSimRecharges] = useState<SimRecharge[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_SIM_RECHARGES`);
      return saved ? JSON.parse(saved) : INITIAL_SIM_RECHARGES;
    } catch {
      return INITIAL_SIM_RECHARGES;
    }
  });

  const [simRequests, setSimRequests] = useState<SimRequest[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_SIM_REQUESTS`);
      return saved ? JSON.parse(saved) : INITIAL_SIM_REQUESTS;
    } catch {
      return INITIAL_SIM_REQUESTS;
    }
  });

  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_SERVICE_PROVIDERS`);
      return saved ? JSON.parse(saved) : INITIAL_SERVICE_PROVIDERS;
    } catch {
      return INITIAL_SERVICE_PROVIDERS;
    }
  });

  const [activeSystemSupportTicket, setActiveSystemSupportTicketState] = useState<ActiveSystemSupportTicket | null>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_ACTIVE_SUPPORT_TICKET`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const setActiveSystemSupportTicket = (ticket: ActiveSystemSupportTicket | null) => {
    setActiveSystemSupportTicketState(ticket);
    if (ticket) {
      try {
        localStorage.setItem(`${STORAGE_KEY}_ACTIVE_SUPPORT_TICKET`, JSON.stringify(ticket));
      } catch {}
    } else {
      localStorage.removeItem(`${STORAGE_KEY}_ACTIVE_SUPPORT_TICKET`);
    }
  };

  const [selectedServiceProviderId, setSelectedServiceProviderId] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const savedAuth = localStorage.getItem(`${STORAGE_KEY}_AUTH`);
      if (savedAuth !== 'true') return null;
      const saved = localStorage.getItem(`${STORAGE_KEY}_CURRENT_USER`);
      if (saved) return JSON.parse(saved);
      return null;
    } catch {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_AUTH`);
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const [userRole, setUserRoleState] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_CURRENT_USER`);
      if (saved) {
        const u = JSON.parse(saved);
        return u.role || 'admin';
      }
      return 'admin';
    } catch {
      return 'admin';
    }
  });

  const setUserRole = (role: UserRole) => {
    // If the authenticated user is an employee, do not allow elevating role to admin!
    if (currentUser?.role === 'employee' && role === 'admin') {
      showToast('Access Denied: You do not have administrator privileges.', 'error');
      return;
    }

    setUserRoleState(role);
    if (role === 'admin') {
      const adminUser: AuthUser = {
        id: 'admin-001',
        name: 'IT Administrator',
        email: 'admin@company.com',
        role: 'admin',
      };
      setCurrentUser(adminUser);
      localStorage.setItem(`${STORAGE_KEY}_CURRENT_USER`, JSON.stringify(adminUser));
    } else {
      const defaultEmp = employees.find(e => e.employeeId === 'EMP001') || employees[0];
      if (defaultEmp) {
        const empUser: AuthUser = {
          id: defaultEmp.id,
          name: defaultEmp.name,
          email: defaultEmp.email,
          role: 'employee',
          employeeId: defaultEmp.employeeId,
          department: defaultEmp.department,
          designation: defaultEmp.designation,
          photoUrl: defaultEmp.photoUrl,
        };
        setCurrentUser(empUser);
        localStorage.setItem(`${STORAGE_KEY}_CURRENT_USER`, JSON.stringify(empUser));
      }
    }
  };

  const currentEmployeeId = currentUser?.employeeId || 'EMP001';

  // Initialize activeTab from URL hash or localStorage so it survives browser refresh
  const [activeTab, setActiveTabState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const rawHash = window.location.hash.replace(/^#\/?/, '').split('?')[0];
        if (VALID_TABS_LIST.includes(rawHash)) {
          return rawHash;
        }
        const savedTab = localStorage.getItem(`${STORAGE_KEY}_ACTIVE_TAB`);
        if (savedTab && VALID_TABS_LIST.includes(savedTab)) {
          return savedTab;
        }
      } catch {}
    }
    return 'dashboard';
  });

  // Initialize selectedEmployeeId from URL hash or localStorage
  const [selectedEmployeeId, setSelectedEmployeeIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const hash = window.location.hash;
        if (hash.includes('employees') || hash.includes('shared')) {
          const match = hash.match(/[?&]id=([^&]+)/);
          if (match && match[1]) {
            return decodeURIComponent(match[1]);
          }
          const savedEmp = localStorage.getItem(`${STORAGE_KEY}_SELECTED_EMP`);
          if (savedEmp) return savedEmp;
        }
      } catch {}
    }
    return null;
  });

  // Initialize selectedComputerId from URL hash or localStorage
  const [selectedComputerId, setSelectedComputerIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const hash = window.location.hash;
        if (hash.includes('computers')) {
          const match = hash.match(/[?&]id=([^&]+)/);
          if (match && match[1]) {
            return decodeURIComponent(match[1]);
          }
          const savedComp = localStorage.getItem(`${STORAGE_KEY}_SELECTED_COMP`);
          if (savedComp) return savedComp;
        }
      } catch {}
    }
    return null;
  });

  const [highlightedRequestId, setHighlightedRequestId] = useState<string | null>(null);
  const [simManagementSubTab, setSimManagementSubTab] = useState<'inventory' | 'recharges' | 'requests' | 'history'>('inventory');
  const [highlightedSimRequestId, setHighlightedSimRequestId] = useState<string | null>(null);
  const [highlightedServiceId, setHighlightedServiceId] = useState<string | null>(null);

  // Sync route and state with URL hash and localStorage
  const syncRoute = useCallback(
    (tab: string, empId: string | null, compId: string | null, replace: boolean = false) => {
      if (typeof window === 'undefined') return;
      try {
        // STRICT EMPLOYEE DATA ISOLATION:
        // When an Employee is logged in, restrict URL routes to their permitted tabs only
        if (currentUser?.role === 'employee') {
          const safeTab = EMPLOYEE_ALLOWED_TABS.includes(tab) ? tab : 'dashboard';
          const hash = safeTab === 'dashboard' ? '#/dashboard' : `#/${safeTab}`;
          const newUrl = `${window.location.pathname}${hash}`;
          if (window.location.hash !== hash) {
            if (replace) {
              window.history.replaceState(null, '', newUrl);
            } else {
              window.history.pushState(null, '', newUrl);
            }
          }
          localStorage.setItem(`${STORAGE_KEY}_ACTIVE_TAB`, safeTab);
          if (currentUser.id) {
            localStorage.setItem(`${STORAGE_KEY}_SELECTED_EMP`, currentUser.id);
          }
          localStorage.removeItem(`${STORAGE_KEY}_SELECTED_COMP`);
          return;
        }

        let hash = tab === 'dashboard' ? '#/dashboard' : `#/${tab}`;
        if ((tab === 'employees' || tab === 'shared') && empId) {
          hash += `?id=${encodeURIComponent(empId)}`;
        } else if (tab === 'computers' && compId) {
          hash += `?id=${encodeURIComponent(compId)}`;
        }

        const newUrl = `${window.location.pathname}${hash}`;
        if (window.location.hash !== hash) {
          if (replace) {
            window.history.replaceState(null, '', newUrl);
          } else {
            window.history.pushState(null, '', newUrl);
          }
        }

        localStorage.setItem(`${STORAGE_KEY}_ACTIVE_TAB`, tab);
        if (empId) {
          localStorage.setItem(`${STORAGE_KEY}_SELECTED_EMP`, empId);
        } else {
          localStorage.removeItem(`${STORAGE_KEY}_SELECTED_EMP`);
        }
        if (compId) {
          localStorage.setItem(`${STORAGE_KEY}_SELECTED_COMP`, compId);
        } else {
          localStorage.removeItem(`${STORAGE_KEY}_SELECTED_COMP`);
        }
      } catch (err) {
        console.error('Error syncing route:', err);
      }
    },
    [currentUser]
  );

  // Set active tab and update URL so refresh retains the exact page
  const setActiveTab = useCallback(
    (tab: string) => {
      if (currentUser?.role === 'employee') {
        const safeTab = EMPLOYEE_ALLOWED_TABS.includes(tab) ? tab : 'dashboard';
        setActiveTabState(safeTab);
        setSelectedEmployeeIdState(currentUser.id);
        setSelectedComputerIdState(null);
        syncRoute(safeTab, currentUser.id, null, false);
        return;
      }
      setActiveTabState(tab);
      const newEmpId = tab === 'employees' ? selectedEmployeeId : null;
      const newCompId = tab === 'computers' ? selectedComputerId : null;
      if (tab !== 'employees') {
        setSelectedEmployeeIdState(null);
      }
      if (tab !== 'computers') {
        setSelectedComputerIdState(null);
      }
      syncRoute(tab, newEmpId, newCompId, false);
    },
    [currentUser, selectedEmployeeId, selectedComputerId, syncRoute]
  );

  const setSelectedEmployeeId = useCallback(
    (id: string | null) => {
      if (currentUser?.role === 'employee') {
        setSelectedEmployeeIdState(currentUser.id);
        return;
      }
      setSelectedEmployeeIdState(id);
      if (id) {
        setActiveTabState('employees');
        syncRoute('employees', id, null, false);
      } else {
        syncRoute('employees', null, null, false);
      }
    },
    [currentUser, syncRoute]
  );

  const setSelectedComputerId = useCallback(
    (id: string | null) => {
      if (currentUser?.role === 'employee') {
        setSelectedComputerIdState(null);
        return;
      }
      setSelectedComputerIdState(id);
      if (id) {
        setActiveTabState('computers');
        syncRoute('computers', null, id, false);
      } else {
        syncRoute('computers', null, null, false);
      }
    },
    [currentUser, syncRoute]
  );

  // Handle browser Back / Forward buttons and initial load URL hash sync
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      try {
        if (!isAuthenticated) return;
        if (currentUser?.role === 'employee') {
          const rawHash = window.location.hash.replace(/^#\/?/, '');
          const [tabPart] = rawHash.split('?');
          const safeTab = EMPLOYEE_ALLOWED_TABS.includes(tabPart) ? tabPart : 'dashboard';
          setActiveTabState(safeTab);
          setSelectedEmployeeIdState(currentUser.id);
          setSelectedComputerIdState(null);
          syncRoute(safeTab, currentUser.id, null, true);
          return;
        }

        const rawHash = window.location.hash.replace(/^#\/?/, '');
        const [tabPart, queryPart] = rawHash.split('?');
        const targetTab = VALID_TABS_LIST.includes(tabPart) ? tabPart : 'dashboard';

        let empId: string | null = null;
        let compId: string | null = null;

        if (queryPart) {
          const params = new URLSearchParams(queryPart);
          const idParam = params.get('id');
          if (targetTab === 'employees' || targetTab === 'shared') {
            empId = idParam;
          } else if (targetTab === 'computers') {
            compId = idParam;
          }
        }

        setActiveTabState(targetTab);
        setSelectedEmployeeIdState(empId);
        setSelectedComputerIdState(compId);
      } catch (e) {
        console.error('Error handling route change:', e);
      }
    };

    // Ensure the URL hash reflects the current state if not set yet
    if (!window.location.hash) {
      syncRoute(activeTab, selectedEmployeeId, selectedComputerId, true);
    }

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, [activeTab, selectedEmployeeId, selectedComputerId, syncRoute, currentUser]);

  // Enforce immediate session confinement when logged in as employee
  useEffect(() => {
    if (currentUser?.role === 'employee') {
      const rawHash = typeof window !== 'undefined' ? window.location.hash.replace(/^#\/?/, '').split('?')[0] : '';
      const safeTab = EMPLOYEE_ALLOWED_TABS.includes(rawHash) ? rawHash : (EMPLOYEE_ALLOWED_TABS.includes(activeTab) ? activeTab : 'dashboard');
      setActiveTabState(safeTab);
      if (currentUser.id) {
        setSelectedEmployeeIdState(currentUser.id);
      }
      setSelectedComputerIdState(null);
      syncRoute(safeTab, currentUser.id || null, null, true);
    }
  }, [currentUser, syncRoute, activeTab]);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('APP_THEME') as 'light' | 'dark') || 'dark';
  });

  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const defaultFilters: GlobalFilters = {
    search: '',
    department: '',
    assetType: '',
    status: '',
    assignedDate: '',
    serviceCount: '',
    computerBrand: '',
  };

  const [globalFilters, setGlobalFiltersState] = useState<GlobalFilters>(defaultFilters);

  // IndexedDB State & Telemetry
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);

  // Initialize IndexedDB on startup and synchronize initial state
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // Step 1: Query the central SQLite Database Backend
        const bootstrap = await api.getBootstrap();
        const migrated = await assetCoreDB.initializeAndMigrate(STORAGE_KEY);

        if (!isMounted) return;
        setIsDbConnected(true);

        let effectiveEmployees: Employee[] = [];
        let effectiveComputers: Computer[] = [];
        let effectiveAssets: CompanyAsset[] = [];
        let effectiveAllocations: AssetAllocationRecord[] = [];
        let effectiveServices: ServiceRecord[] = [];
        let effectiveLogs: AuditLog[] = [];
        let effectiveWeeklyPhotos: WeeklyAssetPhotoRecord[] = [];
        let effectivePurchases: PurchaseRecord[] = [];
        let effectiveRequests: AssetRequest[] = [];
        let effectiveSimCards: SimCard[] = [];
        let effectiveSimRecharges: SimRecharge[] = [];
        let effectiveSimRequests: SimRequest[] = [];
        let effectiveServiceProviders: ServiceProvider[] = [];

        const hasBackendData = bootstrap?.success && (
          bootstrap.data.employees.length > 0 ||
          bootstrap.data.computers.length > 0 ||
          bootstrap.data.assets.length > 0 ||
          (bootstrap.data.purchases && bootstrap.data.purchases.length > 0) ||
          (bootstrap.data.assetRequests && bootstrap.data.assetRequests.length > 0) ||
          (bootstrap.data.simCards && bootstrap.data.simCards.length > 0) ||
          (bootstrap.data.serviceProviders && bootstrap.data.serviceProviders.length > 0)
        );

        if (hasBackendData && bootstrap) {
          console.log('[Database] Hydrated directly from SQLite Central Database');
          effectiveEmployees = bootstrap.data.employees;
          effectiveComputers = bootstrap.data.computers;
          effectiveAssets = bootstrap.data.assets;
          effectiveAllocations = bootstrap.data.allocationRecords || [];
          effectiveServices = bootstrap.data.serviceRecords || [];
          effectiveLogs = bootstrap.data.auditLogs || [];
          effectiveWeeklyPhotos = bootstrap.data.weeklyPhotoRecords || [];
          effectivePurchases = bootstrap.data.purchases || [];
          effectiveRequests = bootstrap.data.assetRequests || [];
          effectiveSimCards = bootstrap.data.simCards || [];
          effectiveSimRecharges = bootstrap.data.simRecharges || [];
          effectiveSimRequests = bootstrap.data.simRequests || [];
          effectiveServiceProviders = bootstrap.data.serviceProviders || [];

          // Sync into local caches so offline/local cache is identical
          assetCoreDB.putAll('employees', effectiveEmployees).catch(() => {});
          assetCoreDB.putAll('computers', effectiveComputers).catch(() => {});
          assetCoreDB.putAll('assets', effectiveAssets).catch(() => {});
          assetCoreDB.putAll('allocationRecords', effectiveAllocations).catch(() => {});
          assetCoreDB.putAll('serviceRecords', effectiveServices).catch(() => {});
          assetCoreDB.putAll('auditLogs', effectiveLogs).catch(() => {});
          if (effectiveWeeklyPhotos.length > 0) {
            assetCoreDB.putAll('weeklyAssetPhotos', effectiveWeeklyPhotos).catch(() => {});
          }
          if (effectivePurchases.length > 0) {
            assetCoreDB.putAll('purchases', effectivePurchases).catch(() => {});
          }
          if (effectiveRequests.length > 0) {
            assetCoreDB.putAll('assetRequests', effectiveRequests).catch(() => {});
          }
          if (effectiveSimCards.length > 0) {
            assetCoreDB.putAll('simCards', effectiveSimCards).catch(() => {});
          }
          if (effectiveSimRecharges.length > 0) {
            assetCoreDB.putAll('simRecharges', effectiveSimRecharges).catch(() => {});
          }
          if (effectiveSimRequests.length > 0) {
            assetCoreDB.putAll('simRequests', effectiveSimRequests).catch(() => {});
          }
          if (effectiveServiceProviders.length > 0) {
            assetCoreDB.putAll('serviceProviders', effectiveServiceProviders).catch(() => {});
          }
        } else {
          // Fallback or Initial SQLite Seed from local cache
          effectiveEmployees = migrated.employees;
          effectiveComputers = migrated.computers;
          effectiveAssets = migrated.assets;
          effectiveAllocations = migrated.allocationRecords;
          effectiveServices = migrated.serviceRecords;
          effectiveLogs = migrated.auditLogs;
          effectiveWeeklyPhotos = migrated.weeklyPhotoRecords || [];
          effectivePurchases = migrated.purchases || [];
          effectiveRequests = migrated.assetRequests || [];
          effectiveSimCards = migrated.simCards?.length ? migrated.simCards : INITIAL_SIM_CARDS;
          effectiveSimRecharges = migrated.simRecharges?.length ? migrated.simRecharges : INITIAL_SIM_RECHARGES;
          effectiveSimRequests = migrated.simRequests?.length ? migrated.simRequests : INITIAL_SIM_REQUESTS;
          effectiveServiceProviders = migrated.serviceProviders?.length ? migrated.serviceProviders : INITIAL_SERVICE_PROVIDERS;

          try {
            const cachedEmpStr = localStorage.getItem(`${STORAGE_KEY}_EMPLOYEES`);
            const cachedCompStr = localStorage.getItem(`${STORAGE_KEY}_COMPUTERS`);
            const cachedAssetStr = localStorage.getItem(`${STORAGE_KEY}_ASSETS`);
            const cachedAllocStr = localStorage.getItem(`${STORAGE_KEY}_ALLOCATIONS`);
            const cachedSrvStr = localStorage.getItem(`${STORAGE_KEY}_SERVICES`);
            const cachedLogStr = localStorage.getItem(`${STORAGE_KEY}_LOGS`);
            const cachedPhotoStr = localStorage.getItem(`${STORAGE_KEY}_WEEKLY_PHOTO_DOCS`);
            const cachedPurchaseStr = localStorage.getItem(`${STORAGE_KEY}_PURCHASES`);

            if (cachedEmpStr) {
              const cachedEmps: Employee[] = JSON.parse(cachedEmpStr);
              if (cachedEmps.length > 0 && effectiveEmployees.length === 0) {
                effectiveEmployees = cachedEmps;
              }
            }

            if (cachedCompStr) {
              const cachedComps: Computer[] = JSON.parse(cachedCompStr);
              if (cachedComps.length > 0 && effectiveComputers.length === 0) {
                effectiveComputers = cachedComps;
              }
            }

            if (cachedAssetStr) {
              const cachedAssets: CompanyAsset[] = JSON.parse(cachedAssetStr);
              if (cachedAssets.length > 0 && effectiveAssets.length === 0) {
                effectiveAssets = cachedAssets;
              }
            }

            if (cachedAllocStr) {
              const cachedAllocs: AssetAllocationRecord[] = JSON.parse(cachedAllocStr);
              if (cachedAllocs.length > effectiveAllocations.length) {
                effectiveAllocations = cachedAllocs;
              }
            }

            if (cachedSrvStr) {
              const cachedSrvs: ServiceRecord[] = JSON.parse(cachedSrvStr);
              if (cachedSrvs.length > effectiveServices.length) {
                effectiveServices = cachedSrvs;
              }
            }

            if (cachedLogStr) {
              const cachedLogs: AuditLog[] = JSON.parse(cachedLogStr);
              if (cachedLogs.length > effectiveLogs.length) {
                effectiveLogs = cachedLogs;
              }
            }

            if (cachedPhotoStr && effectiveWeeklyPhotos.length === 0) {
              try {
                effectiveWeeklyPhotos = JSON.parse(cachedPhotoStr);
              } catch {}
            }

            if (cachedPurchaseStr && effectivePurchases.length === 0) {
              try {
                effectivePurchases = JSON.parse(cachedPurchaseStr);
              } catch {}
            }

            const cachedReqStr = localStorage.getItem(`${STORAGE_KEY}_ASSET_REQUESTS`);
            if (cachedReqStr && effectiveRequests.length === 0) {
              try {
                effectiveRequests = JSON.parse(cachedReqStr);
              } catch {}
            }

            const cachedSimStr = localStorage.getItem(`${STORAGE_KEY}_SIM_CARDS`);
            if (cachedSimStr && effectiveSimCards.length === 0) {
              try {
                effectiveSimCards = JSON.parse(cachedSimStr);
              } catch {}
            }

            const cachedRecStr = localStorage.getItem(`${STORAGE_KEY}_SIM_RECHARGES`);
            if (cachedRecStr && effectiveSimRecharges.length === 0) {
              try {
                effectiveSimRecharges = JSON.parse(cachedRecStr);
              } catch {}
            }

            const cachedSimReqStr = localStorage.getItem(`${STORAGE_KEY}_SIM_REQUESTS`);
            if (cachedSimReqStr && effectiveSimRequests.length === 0) {
              try {
                effectiveSimRequests = JSON.parse(cachedSimReqStr);
              } catch {}
            }

            const cachedProvStr = localStorage.getItem(`${STORAGE_KEY}_SERVICE_PROVIDERS`);
            if (cachedProvStr && effectiveServiceProviders.length === 0) {
              try {
                effectiveServiceProviders = JSON.parse(cachedProvStr);
              } catch {}
            }

            // If backend is online and empty, auto-sync our existing data to SQLite database so it's permanently stored on disk!
            if (bootstrap?.success && (effectiveEmployees.length > 0 || effectiveComputers.length > 0 || effectiveAssets.length > 0 || effectivePurchases.length > 0 || effectiveRequests.length > 0 || effectiveSimCards.length > 0 || effectiveServiceProviders.length > 0)) {
              console.log('[Database] Migrating local data to SQLite database permanently...');
              api.syncAll({
                employees: effectiveEmployees,
                computers: effectiveComputers,
                assets: effectiveAssets,
                serviceRecords: effectiveServices,
                allocationRecords: effectiveAllocations,
                auditLogs: effectiveLogs,
                weeklyPhotoRecords: effectiveWeeklyPhotos,
                purchases: effectivePurchases,
                assetRequests: effectiveRequests,
                simCards: effectiveSimCards,
                simRecharges: effectiveSimRecharges,
                simRequests: effectiveSimRequests,
                serviceProviders: effectiveServiceProviders,
              }).catch(() => {});
            }
          } catch (e) {
            console.warn('Hydration cache reconciliation warning:', e);
          }
        }

        setEmployees(effectiveEmployees);
        setComputers(effectiveComputers);

        // Deduplicate laptop assets that mirror records in computers
        const compAssetNumbers = new Set(effectiveComputers.map(c => c.assetNumber.trim().toLowerCase()));
        const cleanedAssets = effectiveAssets.filter(
          a => a.assetType !== 'Laptop' && !compAssetNumbers.has(a.assetNumber.trim().toLowerCase())
        );
        setAssets(cleanedAssets);

        setServiceRecords(effectiveServices);
        setAllocationRecords(effectiveAllocations);
        setAuditLogs(effectiveLogs);
        setWeeklyPhotoRecords(effectiveWeeklyPhotos);
        setPurchases(effectivePurchases);
        setAssetRequests(effectiveRequests);
        setSimCards(effectiveSimCards.length > 0 ? effectiveSimCards : INITIAL_SIM_CARDS);
        setSimRecharges(effectiveSimRecharges.length > 0 ? effectiveSimRecharges : INITIAL_SIM_RECHARGES);
        setSimRequests(effectiveSimRequests.length > 0 ? effectiveSimRequests : INITIAL_SIM_REQUESTS);
        setServiceProviders(effectiveServiceProviders.length > 0 ? effectiveServiceProviders : INITIAL_SERVICE_PROVIDERS);

        const stats = await assetCoreDB.getStats();
        if (bootstrap?.stats) {
          setDbStats({
            ...stats,
            connected: true,
            dbName: 'SQLite (assetcore.db)',
            totalRecords: bootstrap.stats.totalRecords,
          });
        } else {
          setDbStats(stats);
        }
      } catch (err) {
        console.error('Database startup failed:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Dual Persistence: LocalStorage for synchronous cache & IndexedDB for asynchronous enterprise scale
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_EMPLOYEES`, JSON.stringify(employees));
      localStorage.setItem(`${STORAGE_KEY}_COMPUTERS`, JSON.stringify(computers));
      localStorage.setItem(`${STORAGE_KEY}_ASSETS`, JSON.stringify(assets));
      localStorage.setItem(`${STORAGE_KEY}_ALLOCATIONS`, JSON.stringify(allocationRecords));
      localStorage.setItem(`${STORAGE_KEY}_SERVICES`, JSON.stringify(serviceRecords));
      localStorage.setItem(`${STORAGE_KEY}_LOGS`, JSON.stringify(auditLogs));
      localStorage.setItem(`${STORAGE_KEY}_PURCHASES`, JSON.stringify(purchases));
      localStorage.setItem(`${STORAGE_KEY}_ASSET_REQUESTS`, JSON.stringify(assetRequests));
      localStorage.setItem(`${STORAGE_KEY}_SIM_CARDS`, JSON.stringify(simCards));
      localStorage.setItem(`${STORAGE_KEY}_SIM_RECHARGES`, JSON.stringify(simRecharges));
      localStorage.setItem(`${STORAGE_KEY}_SIM_REQUESTS`, JSON.stringify(simRequests));
      localStorage.setItem(`${STORAGE_KEY}_SERVICE_PROVIDERS`, JSON.stringify(serviceProviders));
      try {
        const safeRecordsForStorage = (weeklyPhotoRecords || []).map(r => ({
          ...r,
          assetPhotos: (r?.assetPhotos || []).map(p => ({
            ...p,
            photoUrl: p?.photoUrl && p.photoUrl.length > 50000 ? p.photoUrl.substring(0, 100) + '...[indexeddb_stored]' : (p?.photoUrl || ''),
          })),
        }));
        localStorage.setItem(`${STORAGE_KEY}_WEEKLY_PHOTO_DOCS`, JSON.stringify(safeRecordsForStorage));
      } catch (storageErr) {
        console.warn('LocalStorage quota limit reached for weekly photo cache (handled, IndexedDB maintains full files):', storageErr);
      }
    } catch (err) {
      console.error('Failed to sync to LocalStorage', err);
    }

    // Async batch write to IndexedDB
    (async () => {
      try {
        await Promise.all([
          assetCoreDB.putAll('employees', employees),
          assetCoreDB.putAll('computers', computers),
          assetCoreDB.putAll('assets', assets),
          assetCoreDB.putAll('allocationRecords', allocationRecords),
          assetCoreDB.putAll('serviceRecords', serviceRecords),
          assetCoreDB.putAll('auditLogs', auditLogs),
          assetCoreDB.putAll('weeklyAssetPhotos', weeklyPhotoRecords),
          assetCoreDB.putAll('purchases', purchases),
          assetCoreDB.putAll('assetRequests', assetRequests),
          assetCoreDB.putAll('simCards', simCards),
          assetCoreDB.putAll('simRecharges', simRecharges),
          assetCoreDB.putAll('simRequests', simRequests),
          assetCoreDB.putAll('serviceProviders', serviceProviders),
        ]);
        const stats = await assetCoreDB.getStats();
        setDbStats(stats);
      } catch (e) {
        console.warn('IndexedDB async sync error:', e);
      }
    })();
  }, [employees, computers, assets, allocationRecords, serviceRecords, auditLogs, weeklyPhotoRecords, purchases, assetRequests, simCards, simRecharges, simRequests, serviceProviders]);

  // Reactive Cross-Tab & Cross-Process Synchronization for Requisitions
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `${STORAGE_KEY}_ASSET_REQUESTS` || e.key === 'assetcore_request_broadcast') {
        try {
          const fresh = localStorage.getItem(`${STORAGE_KEY}_ASSET_REQUESTS`);
          if (fresh) {
            setAssetRequests(JSON.parse(fresh));
          }
        } catch (err) {
          console.warn('Cross-tab request sync error:', err);
        }
      }
    };

    const handleLocalBroadcast = (e: Event) => {
      const customEvt = e as CustomEvent<AssetRequest>;
      if (customEvt.detail) {
        try {
          const fresh = localStorage.getItem(`${STORAGE_KEY}_ASSET_REQUESTS`);
          if (fresh) {
            setAssetRequests(JSON.parse(fresh));
          }
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('assetcore:new_request', handleLocalBroadcast);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('assetcore:new_request', handleLocalBroadcast);
    };
  }, []);

  // Apply Theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('APP_THEME', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Enterprise Session Inactivity Guardrail (Warns after 15 minutes of inactivity)
  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout>;
    const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        showToast(
          'Inactivity Notice: System idle. Your session is secured and data is safely persisted in IndexedDB.',
          'info'
        );
      }, INACTIVITY_TIMEOUT_MS);
    };

    const events = ['mousedown', 'keydown', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetIdleTimer, { passive: true }));
    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      events.forEach(event => window.removeEventListener(event, resetIdleTimer));
    };
  }, []);

  const addAuditEntry = (action: AuditLog['action'], details: string) => {
    const newLog: AuditLog = {
      id: 'log-' + Date.now(),
      action,
      details,
      actor: userRole === 'admin' ? 'IT Administrator' : `Employee (${currentEmployeeId})`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const setGlobalFilters = (partial: Partial<GlobalFilters>) => {
    setGlobalFiltersState(prev => ({ ...prev, ...partial }));
  };

  const resetGlobalFilters = () => {
    setGlobalFiltersState(defaultFilters);
  };

  // Add Employee with optional Computer, Peripherals & Service Record in a single atomic flow
  // Add Employee with optional Computer, Peripherals, Service Record & SIM Cards in a single atomic flow
  const addEmployee: AppContextType['addEmployee'] = (empData, computerData, assetsData, serviceRecordData, simCardsData) => {
    if (userRole !== 'admin' && currentUser?.role === 'employee') {
      showToast('Unauthorized: Administrative privileges required to add employees.', 'error');
      return { success: false, error: 'Unauthorized: Administrative privileges required.' };
    }

    // Check duplicate employee ID safely
    const empIdClean = (empData.employeeId || '').trim().toLowerCase();
    const exists = employees.some(
      e => (e.employeeId || '').trim().toLowerCase() === empIdClean
    );
    if (exists) {
      showToast(`Employee ID "${empData.employeeId}" already exists!`, 'error');
      return { success: false, error: `Employee ID "${empData.employeeId}" already exists!` };
    }

    const newEmpId = 'emp-uuid-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const newEmployee: Employee = {
      ...empData,
      id: newEmpId,
    };

    let newComputers = [...computers];
    let newAssets = [...assets];
    let newAllocations = [...allocationRecords];
    let newServices = [...serviceRecords];
    let newSimCards = [...simCards];

    let createdComputerId: string | null = null;
    let createdComputerAssetNumber: string | null = null;
    let createdComputerDeviceName: string | null = null;

    let isExistingStockComputer = false;

    // Check and add or assign computer if provided
    if (computerData && (computerData.isExistingComputerId || (computerData as any).id)) {
      const existingId = computerData.isExistingComputerId || (computerData as any).id;
      const compIndex = newComputers.findIndex(
        c => c.id === existingId || c.assetNumber.toLowerCase() === (computerData.assetNumber || '').toLowerCase()
      );
      if (compIndex !== -1) {
        const existingComp = newComputers[compIndex];
        isExistingStockComputer = true;
        createdComputerId = existingComp.id;
        createdComputerAssetNumber = existingComp.assetNumber;
        createdComputerDeviceName = existingComp.deviceName;

        const updatedComp: Computer = {
          ...existingComp,
          assignedEmployeeId: newEmpId,
          assignedDate: computerData.assignedDate || newEmployee.joiningDate || new Date().toISOString().substring(0, 10),
          status: 'Assigned',
          condition: computerData.condition || existingComp.condition,
          remarks: computerData.remarks || existingComp.remarks || `Assigned to ${newEmployee.name} from available stock`,
        };
        newComputers[compIndex] = updatedComp;

        // Sync matching asset in newAssets if present
        newAssets = newAssets.map(a => {
          if (a.assetNumber.toLowerCase() === existingComp.assetNumber.toLowerCase()) {
            return {
              ...a,
              assignedEmployeeId: newEmpId,
              assignedDate: computerData.assignedDate || newEmployee.joiningDate || new Date().toISOString().substring(0, 10),
              status: 'Assigned',
              condition: computerData.condition || a.condition,
            };
          }
          return a;
        });

        newAllocations.push({
          id: 'alloc-' + Date.now() + '-lap',
          employeeId: newEmployee.employeeId,
          employeeName: newEmployee.name,
          assetId: existingComp.id,
          assetType: (existingComp.deviceType as AssetType) || 'Laptop',
          assetNumber: existingComp.assetNumber,
          serialNumber: existingComp.serialNumber,
          assignedDate: computerData.assignedDate || newEmployee.joiningDate || '',
          issuedBy: currentUser?.name || 'IT Admin',
          receivedBy: newEmployee.name,
          conditionAtIssue: updatedComp.condition,
          returnDate: null,
          returnCondition: null,
          status: 'Assigned',
          remarks: 'Assigned from available buffer stock during employee onboarding',
        });
      }
    } else if (computerData && computerData.assetNumber) {
      const compTagClean = (computerData.assetNumber || '').trim().toLowerCase();
      const compAssetExists = computers.some(
        c => (c.assetNumber || '').trim().toLowerCase() === compTagClean
      );
      if (compAssetExists) {
        showToast(`Computer Asset Number "${computerData.assetNumber}" already exists!`, 'error');
        return { success: false, error: `Computer Asset Number "${computerData.assetNumber}" already exists!` };
      }

      const newCompId = 'comp-uuid-' + Date.now();
      createdComputerId = newCompId;
      createdComputerAssetNumber = computerData.assetNumber;
      createdComputerDeviceName = computerData.deviceName;

      const newComp: Computer = {
        ...computerData,
        id: newCompId,
        assignedEmployeeId: newEmpId,
        status: 'Assigned',
      };
      newComputers.push(newComp);

      newAllocations.push({
        id: 'alloc-' + Date.now() + '-lap',
        employeeId: newEmployee.employeeId,
        employeeName: newEmployee.name,
        assetId: newComp.id,
        assetType: 'Laptop',
        assetNumber: newComp.assetNumber,
        serialNumber: newComp.serialNumber,
        assignedDate: newComp.assignedDate || '',
        issuedBy: 'IT Admin',
        receivedBy: newEmployee.name,
        conditionAtIssue: newComp.condition,
        returnDate: null,
        returnCondition: null,
        status: 'Assigned',
        remarks: 'Initial laptop allocation',
      });
    }

    // Add peripherals (Mouse, Keyboard, Headset, Phone, etc.)
    if (assetsData && assetsData.length > 0) {
      for (const a of assetsData) {
        if (!a.assetNumber) continue;
        const assetTagClean = (a.assetNumber || '').trim().toLowerCase();
        const assetExists = newAssets.some(
          item => (item.assetNumber || '').trim().toLowerCase() === assetTagClean
        );
        if (assetExists) {
          showToast(`Asset Number "${a.assetNumber}" is already in use!`, 'error');
          return { success: false, error: `Asset Number "${a.assetNumber}" is already in use!` };
        }

        const newAssetId = 'asset-uuid-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
        const resolvedSerial = a.serialNumber || a.imeiNumber || 'N/A';
        const newAsset: CompanyAsset = {
          id: newAssetId,
          assetType: a.assetType,
          assetNumber: a.assetNumber,
          brand: a.brand,
          model: a.model,
          serialNumber: resolvedSerial,
          deviceName: a.deviceName,
          imeiNumber: a.imeiNumber,
          phoneNumber: a.phoneNumber,
          assignedEmployeeId: newEmpId,
          assignedDate: a.assignedDate,
          returnDate: null,
          condition: a.condition,
          status: a.status || 'Assigned',
          remarks: a.remarks || (a.assetType === 'Mobile Phone' ? `Phone: ${a.phoneNumber || ''} (${a.deviceName || ''})` : `Assigned to ${newEmployee.name}`),
        };
        newAssets.push(newAsset);

        newAllocations.push({
          id: 'alloc-' + Date.now() + '-' + a.assetType,
          employeeId: newEmployee.employeeId,
          employeeName: newEmployee.name,
          assetId: newAssetId,
          assetType: a.assetType,
          assetNumber: a.assetNumber,
          serialNumber: resolvedSerial,
          assignedDate: a.assignedDate,
          issuedBy: 'IT Admin',
          receivedBy: newEmployee.name,
          conditionAtIssue: a.condition,
          returnDate: null,
          returnCondition: null,
          status: (a.status === 'Returned' ? 'Returned' : 'Assigned') as 'Assigned' | 'Returned',
          remarks: a.remarks || (a.assetType === 'Mobile Phone' ? `Company Phone - IMEI: ${a.imeiNumber || 'N/A'}` : 'Standard employee onboarding package'),
        });
      }
    }

    // Add SIM Card / Telecom Numbers if provided
    const newlyCreatedSims: SimCard[] = [];
    const updatedExistingSims: SimCard[] = [];
    if (simCardsData && simCardsData.length > 0) {
      const nowIso = new Date().toISOString();
      for (let i = 0; i < simCardsData.length; i++) {
        const s = simCardsData[i];
        if (!s.contactNumber && !s.isExistingSimId) continue;

        if (s.isExistingSimId) {
          // Assigning an existing available SIM from stock
          const simIndex = newSimCards.findIndex(sim => sim.id === s.isExistingSimId);
          if (simIndex !== -1) {
            const updatedSim: SimCard = {
              ...newSimCards[simIndex],
              assignedEmployeeId: newEmpId,
              assignedEmployeeName: newEmployee.name,
              status: 'Assigned',
              purpose: s.purpose || newSimCards[simIndex].purpose,
              customPurpose: s.customPurpose || newSimCards[simIndex].customPurpose,
              project: s.project || newSimCards[simIndex].project || newEmployee.department,
              remarks: s.remarks || newSimCards[simIndex].remarks,
              assignedDate: newEmployee.joiningDate || nowIso.substring(0, 10),
              updatedAt: nowIso,
            };
            newSimCards[simIndex] = updatedSim;
            updatedExistingSims.push(updatedSim);

            newAllocations.push({
              id: 'alloc-' + Date.now() + '-sim-' + i,
              employeeId: newEmployee.employeeId,
              employeeName: newEmployee.name,
              assetId: updatedSim.id,
              assetType: 'SIM Card',
              assetNumber: updatedSim.contactNumber,
              serialNumber: updatedSim.simNumber || updatedSim.contactNumber,
              assignedDate: updatedSim.assignedDate || nowIso.substring(0, 10),
              issuedBy: currentUser?.name || 'IT Admin',
              receivedBy: newEmployee.name,
              conditionAtIssue: 'Good',
              returnDate: null,
              returnCondition: null,
              status: 'Assigned',
              remarks: `Assigned on onboarding for ${s.purpose || 'telecom'} (${s.project || 'General'})`,
            });
          }
        } else {
          // Creating and assigning a new SIM card
          const newSimId = `SIM-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}${i > 0 ? '-' + i : ''}`;
          const newSim: SimCard = {
            id: newSimId,
            contactNumber: s.contactNumber.trim(),
            simNumber: (s.simNumber || s.contactNumber).trim(),
            carrier: (s.carrier as any) || 'Airtel',
            status: 'Assigned',
            purpose: s.purpose || 'Calling',
            customPurpose: s.customPurpose || '',
            project: s.project || newEmployee.department,
            assignedEmployeeId: newEmpId,
            assignedEmployeeName: newEmployee.name,
            assignedDate: newEmployee.joiningDate || nowIso.substring(0, 10),
            remarks: s.remarks || `Allocated during onboarding of ${newEmployee.name}`,
            createdAt: nowIso,
            updatedAt: nowIso,
          };
          newSimCards.unshift(newSim);
          newlyCreatedSims.push(newSim);

          newAllocations.push({
            id: 'alloc-' + Date.now() + '-sim-' + i,
            employeeId: newEmployee.employeeId,
            employeeName: newEmployee.name,
            assetId: newSim.id,
            assetType: 'SIM Card',
            assetNumber: newSim.contactNumber,
            serialNumber: newSim.simNumber || newSim.contactNumber,
            assignedDate: newSim.assignedDate || nowIso.substring(0, 10),
            issuedBy: currentUser?.name || 'IT Admin',
            receivedBy: newEmployee.name,
            conditionAtIssue: 'New',
            returnDate: null,
            returnCondition: null,
            status: 'Assigned',
            remarks: `Onboarding SIM allocation: ${s.purpose || 'Telecom'} (${s.project || newEmployee.department})`,
          });
        }
      }
    }

    // Provision Initial Service/Maintenance Record if specified
    if (serviceRecordData && (serviceRecordData.problem || serviceRecordData.workPerformed)) {
      const newServiceId = 'SRV-' + Date.now().toString().slice(-6);
      newServices.push({
        id: newServiceId,
        computerId: createdComputerId || 'N/A',
        assetNumber: createdComputerAssetNumber || 'N/A',
        deviceName: createdComputerDeviceName || `${newEmployee.name}_PC`,
        employeeId: newEmployee.employeeId,
        employeeName: newEmployee.name,
        serviceDate: newEmployee.joiningDate || new Date().toISOString().substring(0, 10),
        problem: serviceRecordData.problem || 'Initial Hardware & OS Provisioning Inspection',
        problemCategory: serviceRecordData.problemCategory || 'Software Installation',
        workPerformed: serviceRecordData.workPerformed || 'Standard corporate image deployed, peripherals paired, diagnostics passed.',
        partsReplaced: serviceRecordData.partsReplaced || 'None',
        technician: serviceRecordData.technician || 'IT Admin',
        serviceCost: Number(serviceRecordData.serviceCost) || 0,
        serviceStatus: serviceRecordData.serviceStatus || 'Completed',
        resolution: serviceRecordData.resolution || 'Provisioning and initial inspection completed successfully.',
        remarks: serviceRecordData.remarks || 'Onboarding inspection record',
      });
    }

    const nextEmployees = [newEmployee, ...employees];
    setEmployees(nextEmployees);
    setComputers(newComputers);
    setAssets(newAssets);
    setSimCards(newSimCards);
    setAllocationRecords(newAllocations);
    setServiceRecords(newServices);

    // Synchronously commit to localStorage so all sections and page reloads immediately reflect addition
    try {
      localStorage.setItem(`${STORAGE_KEY}_EMPLOYEES`, JSON.stringify(nextEmployees));
      localStorage.setItem(`${STORAGE_KEY}_COMPUTERS`, JSON.stringify(newComputers));
      localStorage.setItem(`${STORAGE_KEY}_ASSETS`, JSON.stringify(newAssets));
      localStorage.setItem(`${STORAGE_KEY}_SIM_CARDS`, JSON.stringify(newSimCards));
      localStorage.setItem(`${STORAGE_KEY}_ALLOCATIONS`, JSON.stringify(newAllocations));
      localStorage.setItem(`${STORAGE_KEY}_SERVICES`, JSON.stringify(newServices));
    } catch (err) {
      console.error('LocalStorage write error during employee add:', err);
    }

    // Immediately commit to IndexedDB and SQLite Backend
    (async () => {
      try {
        await Promise.all([
          assetCoreDB.put('employees', newEmployee),
          assetCoreDB.putAll('computers', newComputers),
          assetCoreDB.putAll('assets', newAssets),
          assetCoreDB.putAll('simCards', newSimCards),
          assetCoreDB.putAll('allocationRecords', newAllocations),
          assetCoreDB.putAll('serviceRecords', newServices),
        ]);
        const stats = await assetCoreDB.getStats();
        setDbStats(stats);
      } catch (err) {
        console.warn('IndexedDB write warning during employee add:', err);
      }

      // Permanent SQLite Central Database storage
      try {
        await api.createEmployee(newEmployee);
        if (createdComputerId) {
          const addedComp = newComputers.find(c => c.id === createdComputerId);
          if (addedComp) {
            if (isExistingStockComputer) {
              await api.updateComputer(addedComp.id, addedComp);
            } else {
              await api.createComputer(addedComp);
            }
          }
        }
        if (assetsData && assetsData.length > 0) {
          const addedAssets = newAssets.filter(a => a.assignedEmployeeId === newEmpId);
          for (const a of addedAssets) {
            await api.createAsset(a);
          }
        }
        for (const sim of newlyCreatedSims) {
          await api.createSim(sim);
        }
        for (const sim of updatedExistingSims) {
          await api.updateSim(sim.id, sim);
        }
        for (const alloc of newAllocations.slice(allocationRecords.length)) {
          await api.createAllocation(alloc);
        }
        for (const srv of newServices.slice(serviceRecords.length)) {
          await api.createServiceRecord(srv);
        }
      } catch (e) {
        console.warn('SQLite Backend sync warning during employee add:', e);
      }
    })();

    // Clear search filter so newly created employee is immediately visible across directory
    setGlobalFiltersState(prev => ({ ...prev, search: '' }));

    const simCount = (simCardsData || []).filter(s => s.contactNumber || s.isExistingSimId).length;
    addAuditEntry(
      'Employee Added',
      `Added employee ${newEmployee.name} (${newEmployee.employeeId}) with ${assetsData?.length || 0} peripheral assets, ${simCount} SIM allocation(s)${serviceRecordData ? ' and initial service record' : ''}.`
    );

    showToast(`Employee "${newEmployee.name}" successfully created with ${simCount} SIM(s) assigned and saved to database!`, 'success');
    return { success: true };
  };

  const updateEmployee: AppContextType['updateEmployee'] = (id, updates) => {
    if (currentUser?.role === 'employee' && id !== currentUser.id && id !== currentUser.employeeId) {
      showToast('Unauthorized: You cannot modify other employee records.', 'error');
      return;
    }

    const existingEmp = employees.find(e => e.id === id || e.employeeId === id);
    if (!existingEmp) return;

    const nextEmployees = employees.map(e => (e.id === existingEmp.id ? { ...e, ...updates } : e));
    let nextAllocations = allocationRecords;
    let nextServices = serviceRecords;
    let nextComputers = computers;
    let nextAssets = assets;

    // If name changed, cascade to allocation records and service records
    if (updates.name && updates.name !== existingEmp.name) {
      const updatedName = updates.name;
      nextAllocations = nextAllocations.map(rec =>
        rec.employeeId === existingEmp.employeeId || rec.employeeName === existingEmp.name
          ? {
              ...rec,
              employeeName: updatedName,
              receivedBy: rec.receivedBy === existingEmp.name ? updatedName : rec.receivedBy,
            }
          : rec
      );
      nextServices = nextServices.map(srv =>
        srv.employeeId === existingEmp.employeeId || srv.employeeName === existingEmp.name
          ? { ...srv, employeeName: updatedName }
          : srv
      );
    }

    // If employeeId changed, cascade to allocation records, service records, computers & assets
    if (updates.employeeId && updates.employeeId !== existingEmp.employeeId) {
      const newBadgeId = updates.employeeId;
      nextAllocations = nextAllocations.map(rec =>
        rec.employeeId === existingEmp.employeeId ? { ...rec, employeeId: newBadgeId } : rec
      );
      nextServices = nextServices.map(srv =>
        srv.employeeId === existingEmp.employeeId ? { ...srv, employeeId: newBadgeId } : srv
      );
      nextComputers = nextComputers.map(c =>
        c.assignedEmployeeId === existingEmp.employeeId ? { ...c, assignedEmployeeId: newBadgeId } : c
      );
      nextAssets = nextAssets.map(a =>
        a.assignedEmployeeId === existingEmp.employeeId ? { ...a, assignedEmployeeId: newBadgeId } : a
      );
    }

    setEmployees(nextEmployees);
    setAllocationRecords(nextAllocations);
    setServiceRecords(nextServices);
    setComputers(nextComputers);
    setAssets(nextAssets);

    // Synchronously commit to localStorage
    try {
      localStorage.setItem(`${STORAGE_KEY}_EMPLOYEES`, JSON.stringify(nextEmployees));
      localStorage.setItem(`${STORAGE_KEY}_COMPUTERS`, JSON.stringify(nextComputers));
      localStorage.setItem(`${STORAGE_KEY}_ASSETS`, JSON.stringify(nextAssets));
      localStorage.setItem(`${STORAGE_KEY}_ALLOCATIONS`, JSON.stringify(nextAllocations));
      localStorage.setItem(`${STORAGE_KEY}_SERVICES`, JSON.stringify(nextServices));
    } catch (err) {
      console.error('LocalStorage write error during employee update:', err);
    }

    // Commit to IndexedDB
    (async () => {
      try {
        await Promise.all([
          assetCoreDB.putAll('employees', nextEmployees),
          assetCoreDB.putAll('computers', nextComputers),
          assetCoreDB.putAll('assets', nextAssets),
          assetCoreDB.putAll('allocationRecords', nextAllocations),
          assetCoreDB.putAll('serviceRecords', nextServices),
        ]);
        const stats = await assetCoreDB.getStats();
        setDbStats(stats);
      } catch (err) {
        console.warn('IndexedDB write warning during employee update:', err);
      }

      // SQLite Backend Sync
      api.updateEmployee(existingEmp.id, updates).catch(e => console.warn('SQLite update warning:', e));
    })();

    addAuditEntry(
      'Employee Updated',
      `Updated profile details for employee ${updates.name || existingEmp.name} (${updates.employeeId || existingEmp.employeeId}).`
    );
    showToast('Employee profile updated and synchronized across all Hardware Fleet records.', 'success');
  };

  const deactivateEmployee: AppContextType['deactivateEmployee'] = (id, reason) => {
    if (currentUser?.role === 'employee') {
      showToast('Unauthorized: Administrative privileges required.', 'error');
      return;
    }

    const emp = employees.find(e => e.id === id || e.employeeId === id);
    if (!emp) return;

    const nextEmployees = employees.map(e =>
      e.id === emp.id
        ? {
            ...e,
            status: 'Inactive' as const,
            remarks: reason
              ? `${e.remarks ? e.remarks + ' | ' : ''}Deactivated: ${reason}`
              : e.remarks,
          }
        : e
    );

    setEmployees(nextEmployees);

    try {
      localStorage.setItem(`${STORAGE_KEY}_EMPLOYEES`, JSON.stringify(nextEmployees));
    } catch (err) {
      console.error('LocalStorage write error during employee deactivation:', err);
    }

    (async () => {
      try {
        await assetCoreDB.putAll('employees', nextEmployees);
        const stats = await assetCoreDB.getStats();
        setDbStats(stats);
      } catch (err) {
        console.warn('IndexedDB write warning during employee deactivation:', err);
      }

      api.updateEmployee(emp.id, {
        status: 'Inactive',
        remarks: reason ? `${emp.remarks ? emp.remarks + ' | ' : ''}Deactivated: ${reason}` : emp.remarks,
      }).catch(e => console.warn('SQLite deactivation warning:', e));
    })();

    addAuditEntry(
      'Employee Deactivated',
      `Deactivated employee ${emp.name} (${emp.employeeId}). Historical hardware, peripherals, and service records preserved.`
    );
    showToast(`Employee "${emp.name}" deactivated. Portal access disabled while all records remain preserved.`, 'info');
  };

  const reactivateEmployee: AppContextType['reactivateEmployee'] = id => {
    if (currentUser?.role === 'employee') {
      showToast('Unauthorized: Administrative privileges required.', 'error');
      return;
    }

    const emp = employees.find(e => e.id === id || e.employeeId === id);
    if (!emp) return;

    const nextEmployees = employees.map(e =>
      e.id === emp.id ? { ...e, status: 'Active' as const } : e
    );

    setEmployees(nextEmployees);

    try {
      localStorage.setItem(`${STORAGE_KEY}_EMPLOYEES`, JSON.stringify(nextEmployees));
    } catch (err) {
      console.error('LocalStorage write error during employee reactivation:', err);
    }

    (async () => {
      try {
        await assetCoreDB.putAll('employees', nextEmployees);
        const stats = await assetCoreDB.getStats();
        setDbStats(stats);
      } catch (err) {
        console.warn('IndexedDB write warning during employee reactivation:', err);
      }

      api.updateEmployee(emp.id, { status: 'Active' }).catch(e => console.warn('SQLite reactivation warning:', e));
    })();

    addAuditEntry(
      'Employee Reactivated',
      `Reactivated employee ${emp.name} (${emp.employeeId}) back to active workforce.`
    );
    showToast(`Employee "${emp.name}" successfully reactivated and restored to active directory.`, 'success');
  };

  const removeEmployeePermanently: AppContextType['removeEmployeePermanently'] = id => {
    if (userRole !== 'admin' && currentUser?.role === 'employee') {
      showToast('Unauthorized: Administrative privileges required.', 'error');
      return;
    }

    const emp = employees.find(
      e =>
        e.id === id ||
        e.employeeId === id ||
        e.id.toLowerCase() === id.toLowerCase() ||
        e.employeeId.toLowerCase() === id.toLowerCase()
    );
    if (!emp) return;

    const isTargetEmployee = (candidateId?: string | null) => {
      if (!candidateId) return false;
      const c = candidateId.trim().toLowerCase();
      return (
        c === emp.id.toLowerCase() ||
        c === emp.employeeId.toLowerCase()
      );
    };

    // 1. Completely delete all workstation computers assigned to this employee from database and fleet
    const deletedComputerIds = new Set<string>();
    const deletedComputerAssetNumbers = new Set<string>();

    computers.forEach(c => {
      if (isTargetEmployee(c.assignedEmployeeId)) {
        deletedComputerIds.add(c.id);
        if (c.assetNumber) deletedComputerAssetNumbers.add(c.assetNumber.toLowerCase());
      }
    });

    const nextComputers = computers.filter(c => !deletedComputerIds.has(c.id));

    // 2. Completely delete all corporate phones, peripherals, and assets assigned to this employee from database and fleet
    const deletedAssetIds = new Set<string>();
    const deletedAssetNumbers = new Set<string>();

    assets.forEach(a => {
      const isAssigned = isTargetEmployee(a.assignedEmployeeId);
      const isMatchingComp = a.assetNumber && deletedComputerAssetNumbers.has(a.assetNumber.toLowerCase());
      if (isAssigned || isMatchingComp) {
        deletedAssetIds.add(a.id);
        if (a.assetNumber) deletedAssetNumbers.add(a.assetNumber.toLowerCase());
      }
    });

    const nextAssets = assets.filter(a => !deletedAssetIds.has(a.id));

    // 3. Completely delete all corporate SIM cards assigned to this employee
    const deletedSimIds = new Set<string>();
    const deletedSimContactNumbers = new Set<string>();

    simCards.forEach(s => {
      if (isTargetEmployee(s.assignedEmployeeId)) {
        deletedSimIds.add(s.id);
        if (s.contactNumber) deletedSimContactNumbers.add(s.contactNumber.trim());
      }
    });

    const nextSimCards = simCards.filter(s => !deletedSimIds.has(s.id));

    // 4. Completely purge all SIM recharge records for this employee or their deleted SIM cards
    const deletedSimRechargeIds = new Set<string>();
    simRecharges.forEach(r => {
      if (
        isTargetEmployee(r.employeeId) ||
        (r.simId && deletedSimIds.has(r.simId)) ||
        (r.contactNumber && deletedSimContactNumbers.has(r.contactNumber.trim()))
      ) {
        deletedSimRechargeIds.add(r.id);
      }
    });

    const nextSimRecharges = simRecharges.filter(r => !deletedSimRechargeIds.has(r.id));

    // 5. Completely purge all SIM requisition requests submitted by this employee
    const deletedSimRequestIds = new Set<string>();
    simRequests.forEach(req => {
      if (isTargetEmployee(req.employeeId)) {
        deletedSimRequestIds.add(req.id);
      }
    });

    const nextSimRequests = simRequests.filter(req => !deletedSimRequestIds.has(req.id));

    // 6. Completely purge all equipment / asset requisition requests submitted by this employee
    const deletedAssetRequestIds = new Set<string>();
    assetRequests.forEach(req => {
      if (isTargetEmployee(req.employeeId)) {
        deletedAssetRequestIds.add(req.id);
      }
    });

    const nextAssetRequests = assetRequests.filter(req => !deletedAssetRequestIds.has(req.id));

    // 7. Completely purge all weekly photo audit records for this employee
    const deletedPhotoIds = new Set<string>();
    weeklyPhotoRecords.forEach(w => {
      if (isTargetEmployee(w.employeeId)) {
        deletedPhotoIds.add(w.id);
      }
    });

    const nextWeeklyPhotos = weeklyPhotoRecords.filter(w => !deletedPhotoIds.has(w.id));

    // 8. Purge all allocation records for this employee or their deleted hardware
    const nextAllocations = allocationRecords.filter(alloc => {
      if (isTargetEmployee(alloc.employeeId)) return false;
      if (alloc.assetId && (deletedAssetIds.has(alloc.assetId) || deletedComputerIds.has(alloc.assetId))) return false;
      if (alloc.assetNumber && (deletedAssetNumbers.has(alloc.assetNumber.toLowerCase()) || deletedComputerAssetNumbers.has(alloc.assetNumber.toLowerCase()))) return false;
      return true;
    });

    // 9. Purge all service & maintenance records for this employee or their deleted hardware
    const nextServices = serviceRecords.filter(srv => {
      if (isTargetEmployee(srv.employeeId)) return false;
      if (srv.computerId && deletedComputerIds.has(srv.computerId)) return false;
      if (srv.assetNumber && (deletedAssetNumbers.has(srv.assetNumber.toLowerCase()) || deletedComputerAssetNumbers.has(srv.assetNumber.toLowerCase()))) return false;
      return true;
    });

    // 10. Permanently remove employee from active and inactive directories
    const nextEmployees = employees.filter(
      e => !isTargetEmployee(e.id) && !isTargetEmployee(e.employeeId)
    );

    const deletedAllocationIds = new Set(
      allocationRecords.filter(alloc => !nextAllocations.some(na => na.id === alloc.id)).map(a => a.id)
    );
    const deletedServiceIds = new Set(
      serviceRecords.filter(srv => !nextServices.some(ns => ns.id === srv.id)).map(s => s.id)
    );

    // Update React states immediately
    setComputers(nextComputers);
    setAssets(nextAssets);
    setSimCards(nextSimCards);
    setSimRecharges(nextSimRecharges);
    setSimRequests(nextSimRequests);
    setAssetRequests(nextAssetRequests);
    setWeeklyPhotoRecords(nextWeeklyPhotos);
    setAllocationRecords(nextAllocations);
    setServiceRecords(nextServices);
    setEmployees(nextEmployees);

    // Clear selection if this employee or their computer was selected
    if (selectedEmployeeId && isTargetEmployee(selectedEmployeeId)) {
      setSelectedEmployeeId(null);
    }
    if (selectedComputerId && deletedComputerIds.has(selectedComputerId)) {
      setSelectedComputerId(null);
    }

    // 11. Synchronously commit to localStorage so all sections and page refresh immediately reflect complete deletion
    try {
      localStorage.setItem(`${STORAGE_KEY}_EMPLOYEES`, JSON.stringify(nextEmployees));
      localStorage.setItem(`${STORAGE_KEY}_COMPUTERS`, JSON.stringify(nextComputers));
      localStorage.setItem(`${STORAGE_KEY}_ASSETS`, JSON.stringify(nextAssets));
      localStorage.setItem(`${STORAGE_KEY}_SIM_CARDS`, JSON.stringify(nextSimCards));
      localStorage.setItem(`${STORAGE_KEY}_SIM_RECHARGES`, JSON.stringify(nextSimRecharges));
      localStorage.setItem(`${STORAGE_KEY}_SIM_REQUESTS`, JSON.stringify(nextSimRequests));
      localStorage.setItem(`${STORAGE_KEY}_ASSET_REQUESTS`, JSON.stringify(nextAssetRequests));
      localStorage.setItem(`${STORAGE_KEY}_WEEKLY_PHOTOS`, JSON.stringify(nextWeeklyPhotos));
      localStorage.setItem(`${STORAGE_KEY}_ALLOCATIONS`, JSON.stringify(nextAllocations));
      localStorage.setItem(`${STORAGE_KEY}_SERVICES`, JSON.stringify(nextServices));
      if (selectedEmployeeId && isTargetEmployee(selectedEmployeeId)) {
        localStorage.removeItem(`${STORAGE_KEY}_SELECTED_EMP`);
      }
      if (selectedComputerId && deletedComputerIds.has(selectedComputerId)) {
        localStorage.removeItem(`${STORAGE_KEY}_SELECTED_COMP`);
      }
    } catch (err) {
      console.error('LocalStorage write error during employee removal:', err);
    }

    // 12. Immediately commit transactions and hard deletes to IndexedDB
    (async () => {
      try {
        await Promise.all([
          assetCoreDB.putAll('employees', nextEmployees),
          assetCoreDB.putAll('computers', nextComputers),
          assetCoreDB.putAll('assets', nextAssets),
          assetCoreDB.putAll('simCards', nextSimCards),
          assetCoreDB.putAll('simRecharges', nextSimRecharges),
          assetCoreDB.putAll('simRequests', nextSimRequests),
          assetCoreDB.putAll('assetRequests', nextAssetRequests),
          assetCoreDB.putAll('weeklyAssetPhotos', nextWeeklyPhotos),
          assetCoreDB.putAll('allocationRecords', nextAllocations),
          assetCoreDB.putAll('serviceRecords', nextServices),
          assetCoreDB.delete('employees', emp.id),
          ...Array.from(deletedComputerIds).map(cId => assetCoreDB.delete('computers', cId)),
          ...Array.from(deletedAssetIds).map(aId => assetCoreDB.delete('assets', aId)),
          ...Array.from(deletedSimIds).map(sId => assetCoreDB.delete('simCards', sId)),
          ...Array.from(deletedSimRechargeIds).map(rId => assetCoreDB.delete('simRecharges', rId)),
          ...Array.from(deletedSimRequestIds).map(reqId => assetCoreDB.delete('simRequests', reqId)),
          ...Array.from(deletedAssetRequestIds).map(reqId => assetCoreDB.delete('assetRequests', reqId)),
          ...Array.from(deletedPhotoIds).map(pId => assetCoreDB.delete('weeklyAssetPhotos', pId)),
          ...Array.from(deletedServiceIds).map(sId => assetCoreDB.delete('serviceRecords', sId)),
          ...Array.from(deletedAllocationIds).map(alId => assetCoreDB.delete('allocationRecords', alId)),
        ]);
        const stats = await assetCoreDB.getStats();
        setDbStats(stats);
      } catch (err) {
        console.warn('IndexedDB write warning during employee removal:', err);
      }

      // SQLite Backend Permanent Deletion
      try {
        await api.deleteEmployee(emp.id);
        for (const cId of deletedComputerIds) {
          await api.deleteComputer(cId);
        }
        for (const aId of deletedAssetIds) {
          await api.deleteAsset(aId);
        }
        for (const sId of deletedSimIds) {
          await api.deleteSim(sId);
        }
        for (const rId of deletedSimRechargeIds) {
          await api.deleteSimRecharge(rId);
        }
        for (const reqId of deletedSimRequestIds) {
          await api.deleteSimRequest(reqId);
        }
        for (const reqId of deletedAssetRequestIds) {
          await api.deleteAssetRequest(reqId);
        }
        for (const pId of deletedPhotoIds) {
          await api.deleteWeeklyPhoto(pId);
        }
        for (const sId of deletedServiceIds) {
          await api.deleteServiceRecord(sId);
        }
        for (const alId of deletedAllocationIds) {
          await api.deleteAllocation(alId);
        }
      } catch (e) {
        console.warn('SQLite delete warning:', e);
      }
    })();

    addAuditEntry(
      'Employee Removed',
      `Permanently removed employee ${emp.name} (${emp.employeeId}) and purged all associated SIM cards (${deletedSimIds.size}), computers (${deletedComputerIds.size}), phones & peripherals (${deletedAssetIds.size}), allocations, and service records from database.`
    );
    showToast(
      `Employee "${emp.name}" and all associated SIM cards, phone, computer, and service records have been permanently deleted from the database.`,
      'success'
    );
  };

  // Add Computer
  const addComputer: AppContextType['addComputer'] = computerData => {
    if (currentUser?.role === 'employee') {
      showToast('Unauthorized: Administrative privileges required.', 'error');
      return { success: false, error: 'Unauthorized: Administrative privileges required.' };
    }

    const cleanAssetNumber = computerData.assetNumber ? computerData.assetNumber.trim() : '';
    if (!cleanAssetNumber) {
      showToast('Asset Number is required to register a computer.', 'error');
      return { success: false, error: 'Asset Number is required.' };
    }

    const exists = computers.some(
      c => c.assetNumber.trim().toLowerCase() === cleanAssetNumber.toLowerCase()
    );
    if (exists) {
      showToast(`Asset Number "${cleanAssetNumber}" already exists in fleet!`, 'error');
      return { success: false, error: `Asset Number "${cleanAssetNumber}" already exists in fleet!` };
    }

    const newComp: Computer = {
      ...computerData,
      assetNumber: cleanAssetNumber,
      id: 'comp-uuid-' + Date.now(),
    };

    setComputers(prev => [newComp, ...prev]);

    // If assigned to an employee upon creation, register an allocation record
    if (newComp.assignedEmployeeId) {
      const assignedEmp = employees.find(e => e.id === newComp.assignedEmployeeId);
      const newAlloc: AssetAllocationRecord = {
        id: 'alloc-uuid-' + Date.now(),
        assetId: newComp.id,
        assetNumber: newComp.assetNumber,
        assetType: 'Laptop',
        serialNumber: newComp.serialNumber,
        employeeId: assignedEmp ? assignedEmp.employeeId : newComp.assignedEmployeeId,
        employeeName: assignedEmp?.name || 'Assigned Employee',
        assignedDate: newComp.assignedDate || new Date().toISOString().substring(0, 10),
        issuedBy: 'IT Administrator',
        receivedBy: assignedEmp?.name || 'Employee',
        conditionAtIssue: newComp.condition,
        returnDate: null,
        returnCondition: null,
        status: 'Assigned',
        remarks: 'Direct workstation assignment during hardware registration',
      };
      setAllocationRecords(prev => [newAlloc, ...prev]);
      api.createAllocation(newAlloc).catch(() => {});
    }

    // Persist to SQLite Backend
    api.createComputer(newComp).catch(e => console.warn('SQLite create computer warning:', e));

    // Reset search filter so newly registered computer is immediately visible in table
    setGlobalFiltersState(prev => ({ ...prev, search: '' }));

    addAuditEntry('Computer Added', `Added computer ${newComp.deviceName} (${newComp.assetNumber})`);
    showToast(`Computer "${newComp.deviceName}" (${newComp.assetNumber}) registered successfully!`, 'success');
    return { success: true };
  };

  const updateComputer: AppContextType['updateComputer'] = (id, updates) => {
    if (currentUser?.role === 'employee') {
      showToast('Unauthorized: Administrative privileges required.', 'error');
      return;
    }

    const existingComp = computers.find(c => c.id === id);
    if (!existingComp) return;

    const nextComputers = computers.map(c => (c.id === id ? { ...c, ...updates } : c));

    // Synchronize matching CompanyAsset in `assets` store
    const nextAssets = assets.map(a => {
      const matches =
        a.assetNumber.toLowerCase() === existingComp.assetNumber.toLowerCase() ||
        (updates.assetNumber && a.assetNumber.toLowerCase() === updates.assetNumber.toLowerCase()) ||
        (a.serialNumber && existingComp.serialNumber && a.serialNumber.toLowerCase() === existingComp.serialNumber.toLowerCase());

      if (matches) {
        return {
          ...a,
          assetNumber: updates.assetNumber !== undefined ? updates.assetNumber : a.assetNumber,
          brand: updates.manufacturer !== undefined ? updates.manufacturer : a.brand,
          model: updates.model !== undefined ? updates.model : a.model,
          serialNumber: updates.serialNumber !== undefined ? updates.serialNumber : a.serialNumber,
          condition: updates.condition !== undefined ? updates.condition : a.condition,
          status: updates.status !== undefined ? updates.status : a.status,
          assignedEmployeeId: updates.assignedEmployeeId !== undefined ? updates.assignedEmployeeId : a.assignedEmployeeId,
          assignedDate: updates.assignedDate !== undefined ? updates.assignedDate : a.assignedDate,
          remarks: updates.remarks !== undefined ? updates.remarks : a.remarks,
        };
      }
      return a;
    });

    // Synchronize matching allocation records
    const nextAllocations = allocationRecords.map(rec => {
      const matches =
        rec.assetNumber.toLowerCase() === existingComp.assetNumber.toLowerCase() ||
        rec.assetId === id ||
        (updates.assetNumber && rec.assetNumber.toLowerCase() === updates.assetNumber.toLowerCase());

      if (matches) {
        return {
          ...rec,
          assetNumber: updates.assetNumber !== undefined ? updates.assetNumber : rec.assetNumber,
          serialNumber: updates.serialNumber !== undefined ? updates.serialNumber : rec.serialNumber,
          conditionAtIssue: updates.condition !== undefined ? updates.condition : rec.conditionAtIssue,
        };
      }
      return rec;
    });

    setComputers(nextComputers);
    setAssets(nextAssets);
    setAllocationRecords(nextAllocations);

    // Synchronous LocalStorage write
    try {
      localStorage.setItem(`${STORAGE_KEY}_COMPUTERS`, JSON.stringify(nextComputers));
      localStorage.setItem(`${STORAGE_KEY}_ASSETS`, JSON.stringify(nextAssets));
      localStorage.setItem(`${STORAGE_KEY}_ALLOCATIONS`, JSON.stringify(nextAllocations));
    } catch (e) {
      console.error('LocalStorage write error during updateComputer:', e);
    }

    // Immediate IndexedDB write
    Promise.all([
      assetCoreDB.putAll('computers', nextComputers),
      assetCoreDB.putAll('assets', nextAssets),
      assetCoreDB.putAll('allocationRecords', nextAllocations),
    ]).catch(() => {});

    // SQLite Backend Sync
    api.updateComputer(id, updates).catch(e => console.warn('SQLite update computer warning:', e));

    addAuditEntry(
      'Computer Updated',
      `Updated specifications for computer ${updates.assetNumber || existingComp.assetNumber} (${updates.deviceName || existingComp.deviceName}).`
    );
    showToast('Computer details updated and synchronized across Hardware Fleet.', 'success');
  };

  const removeComputerPermanently: AppContextType['removeComputerPermanently'] = id => {
    if (currentUser?.role === 'employee') {
      showToast('Unauthorized: Administrative privileges required.', 'error');
      return { success: false, error: 'Unauthorized: Administrative privileges required.' };
    }

    const comp = computers.find(c => c.id === id);
    if (!comp) {
      showToast('Computer record not found.', 'error');
      return { success: false, error: 'Computer record not found.' };
    }

    // 1. Remove from computers
    const nextComputers = computers.filter(c => c.id !== id);

    // 2. Remove matching peripheral asset record if it exists
    const deletedAssetIds = new Set<string>();
    assets.forEach(a => {
      if (a.assetNumber.toLowerCase() === comp.assetNumber.toLowerCase()) {
        deletedAssetIds.add(a.id);
      }
    });
    const nextAssets = assets.filter(a => !deletedAssetIds.has(a.id));

    setComputers(nextComputers);
    setAssets(nextAssets);

    // Synchronous LocalStorage write
    try {
      localStorage.setItem(`${STORAGE_KEY}_COMPUTERS`, JSON.stringify(nextComputers));
      localStorage.setItem(`${STORAGE_KEY}_ASSETS`, JSON.stringify(nextAssets));
    } catch (e) {
      console.error('LocalStorage write error during removeComputerPermanently:', e);
    }

    // Immediate IndexedDB write
    Promise.all([
      assetCoreDB.putAll('computers', nextComputers),
      assetCoreDB.putAll('assets', nextAssets),
    ]).catch(() => {});

    // SQLite Backend Delete
    api.deleteComputer(id).catch(e => console.warn('SQLite delete computer warning:', e));
    for (const aId of deletedAssetIds) {
      api.deleteAsset(aId).catch(e => console.warn('SQLite delete matching asset warning:', e));
    }

    addAuditEntry('Computer Removed', `Decommissioned computer ${comp.assetNumber} (${comp.deviceName}) from active fleet.`);
    showToast(`Computer ${comp.assetNumber} decommissioned permanently.`, 'success');
    return { success: true };
  };

  // Add Peripheral / Company Asset
  const addCompanyAsset: AppContextType['addCompanyAsset'] = assetData => {
    if (currentUser?.role === 'employee') {
      showToast('Unauthorized: Administrative privileges required.', 'error');
      return { success: false, error: 'Unauthorized: Administrative privileges required.' };
    }

    const exists = assets.some(
      a => a.assetNumber.trim().toLowerCase() === assetData.assetNumber.trim().toLowerCase()
    );
    if (exists) {
      showToast(`Asset Number "${assetData.assetNumber}" already in use!`, 'error');
      return { success: false, error: `Asset Number "${assetData.assetNumber}" already in use!` };
    }

    // Resolve employee canonical ID if assigned
    let canonicalEmpId = assetData.assignedEmployeeId;
    if (canonicalEmpId) {
      const foundEmp = employees.find(e => e.id === canonicalEmpId || e.employeeId === canonicalEmpId);
      if (foundEmp) {
        canonicalEmpId = foundEmp.id;
      }
    }

    const newAsset: CompanyAsset = {
      ...assetData,
      assignedEmployeeId: canonicalEmpId,
      id: 'asset-uuid-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    };

    const nextAssets = [newAsset, ...assets];
    let nextComputers = [...computers];
    let nextAllocations = [...allocationRecords];

    // If it's a Laptop, also register into computing fleet if not already present
    let createdComp: Computer | null = null;
    if (newAsset.assetType === 'Laptop') {
      const compExists = computers.some(
        c => c.assetNumber.toLowerCase() === newAsset.assetNumber.toLowerCase()
      );
      if (!compExists) {
        const newComp: Computer = {
          id: 'comp-uuid-' + Date.now(),
          assetNumber: newAsset.assetNumber,
          deviceName: newAsset.deviceName || `${newAsset.brand}_${newAsset.model}`,
          manufacturer: newAsset.brand,
          model: newAsset.model,
          deviceType: 'Laptop',
          serialNumber: newAsset.serialNumber,
          assignedEmployeeId: newAsset.assignedEmployeeId,
          assignedDate: newAsset.assignedDate,
          condition: newAsset.condition,
          status: newAsset.status,
          remarks: newAsset.remarks || 'Registered via Asset Provisioning',
          processor: {
            name: '12th Gen Intel Core i5-1245U',
            generation: '12th Gen',
            speed: '1.60 GHz - 4.40 GHz',
          },
          memory: {
            installedRAM: '16.00 GB',
            usableRAM: '15.80 GB',
          },
          graphics: {
            card: 'Intel Iris Xe Graphics',
            memory: '512 MB',
          },
          storage: {
            total: '512 GB',
            used: '45 GB',
            free: '467 GB',
            type: 'NVMe SSD',
          },
          system: {
            os: 'Windows 11 Pro 64-bit',
            systemType: '64-bit operating system, x64-based processor',
            processorArchitecture: 'x64',
            deviceId: 'DEV-WIN-' + Math.floor(100000 + Math.random() * 900000),
            productId: 'PROD-WIN-' + Math.floor(100000 + Math.random() * 900000),
            penAndTouch: 'No pen or touch input is available for this display',
          },
        };
        createdComp = newComp;
        nextComputers = [newComp, ...computers];
      }
    }

    // If assigned to an employee upon creation, register an allocation record
    if (newAsset.assignedEmployeeId) {
      const assignedEmp = employees.find(
        e => e.id === newAsset.assignedEmployeeId || e.employeeId === newAsset.assignedEmployeeId
      );

      const newAlloc: AssetAllocationRecord = {
        id: 'alloc-' + Date.now(),
        employeeId: assignedEmp ? assignedEmp.employeeId : newAsset.assignedEmployeeId,
        employeeName: assignedEmp?.name || 'Assigned Employee',
        assetId: newAsset.id,
        assetType: newAsset.assetType,
        assetNumber: newAsset.assetNumber,
        serialNumber: newAsset.serialNumber,
        assignedDate: newAsset.assignedDate || new Date().toISOString().substring(0, 10),
        issuedBy: 'IT Administrator',
        receivedBy: assignedEmp?.name || 'Employee',
        conditionAtIssue: newAsset.condition,
        returnDate: null,
        returnCondition: null,
        status: 'Assigned',
        remarks: newAsset.remarks || `Directly assigned to ${assignedEmp?.name || 'employee'}`,
      };

      nextAllocations = [newAlloc, ...allocationRecords];
      addAuditEntry(
        'Asset Assigned',
        `Provisioned & assigned ${newAsset.assetType} (${newAsset.assetNumber}) to ${assignedEmp ? assignedEmp.name : 'employee'}`
      );
      showToast(`${newAsset.assetType} "${newAsset.assetNumber}" assigned to ${assignedEmp ? assignedEmp.name : 'employee'}!`, 'success');
    } else {
      addAuditEntry(
        'Asset Status Changed',
        `Registered new ${newAsset.assetType} (${newAsset.assetNumber}) with status ${newAsset.status}`
      );
      showToast(`${newAsset.assetType} "${newAsset.assetNumber}" registered in inventory!`, 'success');
    }

    setAssets(nextAssets);
    setComputers(nextComputers);
    setAllocationRecords(nextAllocations);

    // Synchronous LocalStorage write
    try {
      localStorage.setItem(`${STORAGE_KEY}_ASSETS`, JSON.stringify(nextAssets));
      localStorage.setItem(`${STORAGE_KEY}_COMPUTERS`, JSON.stringify(nextComputers));
      localStorage.setItem(`${STORAGE_KEY}_ALLOCATIONS`, JSON.stringify(nextAllocations));
    } catch (e) {
      console.error('LocalStorage write error during addCompanyAsset:', e);
    }

    // Immediate IndexedDB write
    Promise.all([
      assetCoreDB.putAll('assets', nextAssets),
      assetCoreDB.putAll('computers', nextComputers),
      assetCoreDB.putAll('allocationRecords', nextAllocations),
    ]).catch(() => {});

    // SQLite Backend Sync
    api.createAsset(newAsset).catch(e => console.warn('SQLite add asset warning:', e));
    if (createdComp) {
      api.createComputer(createdComp).catch(e => console.warn('SQLite add synthesized computer warning:', e));
    }

    return { success: true };
  };

  // Assign Asset to Employee
  const assignAsset: AppContextType['assignAsset'] = (
    assetId,
    employeeId,
    assignedDate,
    condition,
    issuedBy,
    remarks,
    securityFunctionAdded,
    securityFunctionAddedDate
  ) => {
    if (currentUser?.role === 'employee') {
      showToast('Unauthorized: Administrative privileges required.', 'error');
      return { success: false, error: 'Unauthorized: Administrative privileges required.' };
    }

    const asset = assets.find(a => a.id === assetId);
    const emp = employees.find(e => e.id === employeeId || e.employeeId === employeeId);

    if (!asset || !emp) {
      showToast('Invalid asset or employee selected.', 'error');
      return { success: false, error: 'Invalid asset or employee.' };
    }

    // Update asset
    const nextAssets = assets.map(a =>
      a.id === assetId
        ? {
            ...a,
            assignedEmployeeId: emp.id,
            assignedDate,
            returnDate: null,
            condition,
            status: 'Assigned' as const,
            remarks: remarks || `Assigned to ${emp.name} on ${assignedDate}`,
            ...(securityFunctionAdded ? { securityFunctionAdded } : {}),
            ...(securityFunctionAddedDate ? { securityFunctionAddedDate } : {}),
          }
        : a
    );

    // If it's a computer, update computer entity as well
    const nextComputers = computers.map(c =>
      c.assetNumber.toLowerCase() === asset.assetNumber.toLowerCase()
        ? {
            ...c,
            assignedEmployeeId: emp.id,
            assignedDate,
            condition,
            status: 'Assigned' as const,
            ...(securityFunctionAdded ? { securityFunctionAdded } : {}),
            ...(securityFunctionAddedDate ? { securityFunctionAddedDate } : {}),
          }
        : c
    );

    // Create allocation record
    const newAlloc: AssetAllocationRecord = {
      id: 'alloc-' + Date.now(),
      employeeId: emp.employeeId,
      employeeName: emp.name,
      assetId: asset.id,
      assetType: asset.assetType,
      assetNumber: asset.assetNumber,
      serialNumber: asset.serialNumber,
      assignedDate,
      issuedBy: issuedBy || 'IT Administrator',
      receivedBy: emp.name,
      conditionAtIssue: condition,
      returnDate: null,
      returnCondition: null,
      status: 'Assigned',
      remarks: remarks || `Issued by ${issuedBy || 'IT Administrator'}`,
    };
    const nextAllocations = [newAlloc, ...allocationRecords];

    setAssets(nextAssets);
    setComputers(nextComputers);
    setAllocationRecords(nextAllocations);

    // Synchronous LocalStorage write
    try {
      localStorage.setItem(`${STORAGE_KEY}_ASSETS`, JSON.stringify(nextAssets));
      localStorage.setItem(`${STORAGE_KEY}_COMPUTERS`, JSON.stringify(nextComputers));
      localStorage.setItem(`${STORAGE_KEY}_ALLOCATIONS`, JSON.stringify(nextAllocations));
    } catch (e) {
      console.error('LocalStorage write error during assignAsset:', e);
    }

    // Immediate IndexedDB write
    Promise.all([
      assetCoreDB.putAll('assets', nextAssets),
      assetCoreDB.putAll('computers', nextComputers),
      assetCoreDB.putAll('allocationRecords', nextAllocations),
    ]).catch(() => {});

    // SQLite Backend Sync
    api.updateAsset(assetId, {
      assignedEmployeeId: emp.id,
      assignedDate,
      returnDate: null,
      condition,
      status: 'Assigned',
    }).catch(() => {});
    api.createAllocation(newAlloc).catch(() => {});

    addAuditEntry(
      'Asset Assigned',
      `Assigned ${asset.assetType} (${asset.assetNumber}) to ${emp.name} (${emp.employeeId})`
    );

    showToast(`Asset "${asset.assetNumber}" assigned to ${emp.name}!`, 'success');
    return { success: true };
  };

  // Return Asset
  const returnAsset: AppContextType['returnAsset'] = (
    assetId,
    returnDate,
    returnCondition,
    receivedBy,
    statusOption,
    remarks
  ) => {
    if (currentUser?.role === 'employee') {
      showToast('Unauthorized: Administrative privileges required.', 'error');
      return { success: false, error: 'Unauthorized: Administrative privileges required.' };
    }

    const asset = assets.find(a => a.id === assetId);
    if (!asset) {
      showToast('Asset not found.', 'error');
      return { success: false, error: 'Asset not found.' };
    }

    const previousEmp = employees.find(e => e.id === asset.assignedEmployeeId || e.employeeId === asset.assignedEmployeeId);

    // Update asset
    const nextAssets = assets.map(a =>
      a.id === assetId
        ? {
            ...a,
            assignedEmployeeId: null,
            returnDate,
            condition: returnCondition,
            status: statusOption, // 'Available' or 'Returned'
            remarks: remarks || `Returned on ${returnDate}. Condition: ${returnCondition}`,
          }
        : a
    );

    // If it's a computer, update computer entity as well
    const nextComputers = computers.map(c =>
      c.assetNumber.toLowerCase() === asset.assetNumber.toLowerCase()
        ? {
            ...c,
            assignedEmployeeId: null,
            condition: returnCondition,
            status: statusOption,
          }
        : c
    );

    // Create / update allocation record
    const updatedAlloc: AssetAllocationRecord = {
      id: 'alloc-' + Date.now(),
      employeeId: previousEmp ? previousEmp.employeeId : 'UNKNOWN',
      employeeName: previousEmp ? previousEmp.name : 'Unknown Employee',
      assetId: asset.id,
      assetType: asset.assetType,
      assetNumber: asset.assetNumber,
      serialNumber: asset.serialNumber,
      assignedDate: asset.assignedDate || '—',
      issuedBy: 'IT Admin',
      receivedBy: receivedBy || 'IT Admin',
      conditionAtIssue: asset.condition,
      returnDate,
      returnCondition,
      status: 'Returned',
      remarks: remarks || `Returned in ${returnCondition} condition.`,
    };
    const nextAllocations = [updatedAlloc, ...allocationRecords];

    setAssets(nextAssets);
    setComputers(nextComputers);
    setAllocationRecords(nextAllocations);

    // Synchronous LocalStorage write
    try {
      localStorage.setItem(`${STORAGE_KEY}_ASSETS`, JSON.stringify(nextAssets));
      localStorage.setItem(`${STORAGE_KEY}_COMPUTERS`, JSON.stringify(nextComputers));
      localStorage.setItem(`${STORAGE_KEY}_ALLOCATIONS`, JSON.stringify(nextAllocations));
    } catch (e) {
      console.error('LocalStorage write error during returnAsset:', e);
    }

    // Immediate IndexedDB write
    Promise.all([
      assetCoreDB.putAll('assets', nextAssets),
      assetCoreDB.putAll('computers', nextComputers),
      assetCoreDB.putAll('allocationRecords', nextAllocations),
    ]).catch(() => {});

    // SQLite Backend Sync
    api.updateAsset(assetId, {
      assignedEmployeeId: null,
      returnDate,
      condition: returnCondition,
      status: statusOption,
    }).catch(() => {});
    api.createAllocation(updatedAlloc).catch(() => {});

    addAuditEntry(
      'Asset Returned',
      `Asset ${asset.assetType} (${asset.assetNumber}) returned by ${previousEmp?.name || 'employee'}. Status is now ${statusOption}.`
    );

    showToast(`Asset "${asset.assetNumber}" returned successfully!`, 'success');
    return { success: true };
  };

  // Move Asset / Computer to Buffer Stock (Unassigned, Available for reassignment)
  const moveToBufferStock: AppContextType['moveToBufferStock'] = (
    itemType,
    itemId,
    options
  ) => {
    if (currentUser?.role === 'employee') {
      showToast('Unauthorized: Administrative privileges required.', 'error');
      return { success: false, error: 'Unauthorized: Administrative privileges required.' };
    }

    const retDate = options?.returnDate || new Date().toISOString().substring(0, 10);
    const retCondition = options?.returnCondition || 'Good';
    const recBy = options?.receivedBy || currentUser?.name || 'IT Administrator';
    const note = options?.remarks || 'Moved to Buffer Stock for reassignment.';

    let targetItemLabel = '';
    let previousEmpName = 'Unassigned';

    let nextComputers = [...computers];
    let nextAssets = [...assets];
    let nextAllocations = [...allocationRecords];

    if (itemType === 'computer') {
      const comp = computers.find(c => c.id === itemId || c.assetNumber.toLowerCase() === itemId.toLowerCase());
      if (!comp) {
        showToast('Computer not found.', 'error');
        return { success: false, error: 'Computer not found.' };
      }

      targetItemLabel = `${comp.deviceType} ${comp.assetNumber} (${comp.manufacturer} ${comp.model})`;
      const prevEmp = employees.find(e => e.id === comp.assignedEmployeeId || e.employeeId === comp.assignedEmployeeId);
      if (prevEmp) previousEmpName = prevEmp.name;

      // 1. Update computer
      nextComputers = computers.map(c => {
        if (c.id === comp.id || c.assetNumber.toLowerCase() === comp.assetNumber.toLowerCase()) {
          return {
            ...c,
            assignedEmployeeId: null,
            assignedDate: null,
            condition: retCondition,
            status: 'Available' as const,
            remarks: note,
          };
        }
        return c;
      });

      // 2. Also update matching asset in assets if it exists
      nextAssets = assets.map(a => {
        if (a.assetNumber.toLowerCase() === comp.assetNumber.toLowerCase()) {
          return {
            ...a,
            assignedEmployeeId: null,
            assignedDate: null,
            returnDate: retDate,
            condition: retCondition,
            status: 'Available' as const,
            remarks: note,
          };
        }
        return a;
      });

      // 3. Close open allocation record or append a return allocation record
      let allocFound = false;
      nextAllocations = allocationRecords.map(rec => {
        const matches =
          rec.assetNumber.toLowerCase() === comp.assetNumber.toLowerCase() ||
          rec.assetId === comp.id;
        if (matches && !rec.returnDate) {
          allocFound = true;
          return {
            ...rec,
            returnDate: retDate,
            returnCondition: retCondition,
            receivedBy: recBy,
            status: 'Returned' as const,
            remarks: `${rec.remarks || ''} [Returned to Buffer: ${note}]`.trim(),
          };
        }
        return rec;
      });

      if (!allocFound && comp.assignedEmployeeId) {
        const newAlloc: AssetAllocationRecord = {
          id: 'alloc-' + Date.now(),
          employeeId: prevEmp ? prevEmp.employeeId : 'UNKNOWN',
          employeeName: prevEmp ? prevEmp.name : 'Unknown Employee',
          assetId: comp.id,
          assetType: (comp.deviceType as AssetType) || 'Laptop',
          assetNumber: comp.assetNumber,
          serialNumber: comp.serialNumber,
          assignedDate: comp.assignedDate || '—',
          issuedBy: 'IT Admin',
          receivedBy: recBy,
          conditionAtIssue: comp.condition,
          returnDate: retDate,
          returnCondition: retCondition,
          status: 'Returned',
          remarks: note,
        };
        nextAllocations = [newAlloc, ...nextAllocations];
      }

      // SQLite backend sync
      api.updateComputer(comp.id, {
        assignedEmployeeId: null,
        assignedDate: null,
        condition: retCondition,
        status: 'Available',
        remarks: note,
      }).catch(e => console.warn('SQLite updateComputer warning:', e));

      const matchingAsset = assets.find(a => a.assetNumber.toLowerCase() === comp.assetNumber.toLowerCase());
      if (matchingAsset) {
        api.updateAsset(matchingAsset.id, {
          assignedEmployeeId: null,
          assignedDate: null,
          returnDate: retDate,
          condition: retCondition,
          status: 'Available',
          remarks: note,
        }).catch(e => console.warn('SQLite updateAsset warning:', e));
      }
    } else {
      // itemType === 'asset'
      const asset = assets.find(a => a.id === itemId || a.assetNumber.toLowerCase() === itemId.toLowerCase());
      if (!asset) {
        showToast('Asset not found.', 'error');
        return { success: false, error: 'Asset not found.' };
      }

      targetItemLabel = `${asset.assetType} ${asset.assetNumber} (${asset.brand} ${asset.model})`;
      const prevEmp = employees.find(e => e.id === asset.assignedEmployeeId || e.employeeId === asset.assignedEmployeeId);
      if (prevEmp) previousEmpName = prevEmp.name;

      // 1. Update asset
      nextAssets = assets.map(a => {
        if (a.id === asset.id || a.assetNumber.toLowerCase() === asset.assetNumber.toLowerCase()) {
          return {
            ...a,
            assignedEmployeeId: null,
            assignedDate: null,
            returnDate: retDate,
            condition: retCondition,
            status: 'Available' as const,
            remarks: note,
          };
        }
        return a;
      });

      // 2. Also update matching computer if it exists
      nextComputers = computers.map(c => {
        if (c.assetNumber.toLowerCase() === asset.assetNumber.toLowerCase()) {
          return {
            ...c,
            assignedEmployeeId: null,
            assignedDate: null,
            condition: retCondition,
            status: 'Available' as const,
            remarks: note,
          };
        }
        return c;
      });

      // 3. Close open allocation record or append a return allocation record
      let allocFound = false;
      nextAllocations = allocationRecords.map(rec => {
        const matches =
          rec.assetNumber.toLowerCase() === asset.assetNumber.toLowerCase() ||
          rec.assetId === asset.id;
        if (matches && !rec.returnDate) {
          allocFound = true;
          return {
            ...rec,
            returnDate: retDate,
            returnCondition: retCondition,
            receivedBy: recBy,
            status: 'Returned' as const,
            remarks: `${rec.remarks || ''} [Returned to Buffer: ${note}]`.trim(),
          };
        }
        return rec;
      });

      if (!allocFound && asset.assignedEmployeeId) {
        const newAlloc: AssetAllocationRecord = {
          id: 'alloc-' + Date.now(),
          employeeId: prevEmp ? prevEmp.employeeId : 'UNKNOWN',
          employeeName: prevEmp ? prevEmp.name : 'Unknown Employee',
          assetId: asset.id,
          assetType: asset.assetType,
          assetNumber: asset.assetNumber,
          serialNumber: asset.serialNumber,
          assignedDate: asset.assignedDate || '—',
          issuedBy: 'IT Admin',
          receivedBy: recBy,
          conditionAtIssue: asset.condition,
          returnDate: retDate,
          returnCondition: retCondition,
          status: 'Returned',
          remarks: note,
        };
        nextAllocations = [newAlloc, ...nextAllocations];
      }

      // SQLite backend sync
      api.updateAsset(asset.id, {
        assignedEmployeeId: null,
        assignedDate: null,
        returnDate: retDate,
        condition: retCondition,
        status: 'Available',
        remarks: note,
      }).catch(e => console.warn('SQLite updateAsset warning:', e));

      const matchingComp = computers.find(c => c.assetNumber.toLowerCase() === asset.assetNumber.toLowerCase());
      if (matchingComp) {
        api.updateComputer(matchingComp.id, {
          assignedEmployeeId: null,
          assignedDate: null,
          condition: retCondition,
          status: 'Available',
          remarks: note,
        }).catch(e => console.warn('SQLite updateComputer warning:', e));
      }
    }

    setComputers(nextComputers);
    setAssets(nextAssets);
    setAllocationRecords(nextAllocations);

    // Synchronous LocalStorage write
    try {
      localStorage.setItem(`${STORAGE_KEY}_COMPUTERS`, JSON.stringify(nextComputers));
      localStorage.setItem(`${STORAGE_KEY}_ASSETS`, JSON.stringify(nextAssets));
      localStorage.setItem(`${STORAGE_KEY}_ALLOCATIONS`, JSON.stringify(nextAllocations));
    } catch (e) {
      console.error('LocalStorage write error during moveToBufferStock:', e);
    }

    // Immediate IndexedDB write
    Promise.all([
      assetCoreDB.putAll('computers', nextComputers),
      assetCoreDB.putAll('assets', nextAssets),
      assetCoreDB.putAll('allocationRecords', nextAllocations),
    ]).catch(() => {});

    addAuditEntry(
      'Asset Moved to Buffer Stock',
      `Moved ${targetItemLabel} to Buffer Stock (Condition: ${retCondition}). Previous Custodian: ${previousEmpName}. Ready for reassignment.`
    );

    showToast(`Asset "${targetItemLabel}" moved to Buffer Stock!`, 'success');
    return { success: true };
  };

  // Update / Change Company Asset (Admin only)
  const updateCompanyAsset: AppContextType['updateCompanyAsset'] = (assetId, updates) => {
    if (currentUser?.role === 'employee') {
      showToast('Unauthorized: Administrative privileges required.', 'error');
      return { success: false, error: 'Unauthorized: Administrative privileges required.' };
    }

    const existing = assets.find(a => a.id === assetId);
    if (!existing) {
      showToast('Asset record not found.', 'error');
      return { success: false, error: 'Asset record not found.' };
    }

    // If assetNumber is changing, verify uniqueness
    if (updates.assetNumber && updates.assetNumber.trim().toLowerCase() !== existing.assetNumber.trim().toLowerCase()) {
      const duplicate = assets.some(
        a => a.id !== assetId && a.assetNumber.trim().toLowerCase() === updates.assetNumber!.trim().toLowerCase()
      );
      if (duplicate) {
        showToast(`Asset Number "${updates.assetNumber}" is already in use!`, 'error');
        return { success: false, error: `Asset Number "${updates.assetNumber}" is already in use!` };
      }
    }

    // Resolve employee canonical ID if assignment changed
    let resolvedEmployeeId = updates.assignedEmployeeId;
    if (resolvedEmployeeId) {
      const foundEmp = employees.find(e => e.id === resolvedEmployeeId || e.employeeId === resolvedEmployeeId);
      if (foundEmp) {
        resolvedEmployeeId = foundEmp.id;
      }
    }

    const updatedAsset: CompanyAsset = {
      ...existing,
      ...updates,
      ...(updates.assignedEmployeeId !== undefined ? { assignedEmployeeId: resolvedEmployeeId } : {}),
    };

    const nextAssets = assets.map(a => (a.id === assetId ? updatedAsset : a));
    let nextComputers = [...computers];

    // If it's a computer/laptop, synchronize computer entity
    if (updatedAsset.assetType === 'Laptop') {
      nextComputers = computers.map(c =>
        c.assetNumber.toLowerCase() === existing.assetNumber.toLowerCase() ||
        (c.serialNumber && existing.serialNumber && c.serialNumber.toLowerCase() === existing.serialNumber.toLowerCase())
          ? {
              ...c,
              assetNumber: updatedAsset.assetNumber,
              manufacturer: updatedAsset.brand || c.manufacturer,
              model: updatedAsset.model || c.model,
              serialNumber: updatedAsset.serialNumber || c.serialNumber,
              assignedEmployeeId: updatedAsset.assignedEmployeeId,
              assignedDate: updatedAsset.assignedDate,
              condition: updatedAsset.condition,
              status: updatedAsset.status,
              remarks: updatedAsset.remarks || c.remarks,
            }
          : c
      );
    }

    let nextAllocations = [...allocationRecords];

    // Handle assignment change for allocation records
    if (updates.assignedEmployeeId !== undefined && updates.assignedEmployeeId !== existing.assignedEmployeeId) {
      if (updates.assignedEmployeeId) {
        const newEmp = employees.find(
          e => e.id === updates.assignedEmployeeId || e.employeeId === updates.assignedEmployeeId
        );
        if (newEmp) {
          const newAlloc: AssetAllocationRecord = {
            id: 'alloc-' + Date.now(),
            employeeId: newEmp.employeeId,
            employeeName: newEmp.name,
            assetId: updatedAsset.id,
            assetType: updatedAsset.assetType,
            assetNumber: updatedAsset.assetNumber,
            serialNumber: updatedAsset.serialNumber,
            assignedDate: updatedAsset.assignedDate || new Date().toISOString().substring(0, 10),
            issuedBy: currentUser?.name || 'IT Administrator',
            receivedBy: newEmp.name,
            conditionAtIssue: updatedAsset.condition,
            returnDate: null,
            returnCondition: null,
            status: 'Assigned',
            remarks: updatedAsset.remarks || `Assigned to ${newEmp.name} via profile update`,
          };
          nextAllocations = [newAlloc, ...nextAllocations];
        }
      }
    }

    // Update corresponding allocation records
    nextAllocations = nextAllocations.map(rec =>
      rec.assetId === assetId
        ? {
            ...rec,
            assetNumber: updatedAsset.assetNumber,
            assetType: updatedAsset.assetType,
            serialNumber: updatedAsset.serialNumber,
            assignedDate: updatedAsset.assignedDate || rec.assignedDate,
            conditionAtIssue: updatedAsset.condition,
            returnDate: updatedAsset.returnDate,
            status: updatedAsset.status === 'Returned' ? 'Returned' : rec.status,
          }
        : rec
    );

    setAssets(nextAssets);
    setComputers(nextComputers);
    setAllocationRecords(nextAllocations);

    // Synchronous LocalStorage write
    try {
      localStorage.setItem(`${STORAGE_KEY}_ASSETS`, JSON.stringify(nextAssets));
      localStorage.setItem(`${STORAGE_KEY}_COMPUTERS`, JSON.stringify(nextComputers));
      localStorage.setItem(`${STORAGE_KEY}_ALLOCATIONS`, JSON.stringify(nextAllocations));
    } catch (e) {
      console.error('LocalStorage write error during updateCompanyAsset:', e);
    }

    // Immediate IndexedDB write
    Promise.all([
      assetCoreDB.putAll('assets', nextAssets),
      assetCoreDB.putAll('computers', nextComputers),
      assetCoreDB.putAll('allocationRecords', nextAllocations),
    ]).catch(() => {});

    // SQLite Backend Sync
    api.updateAsset(assetId, updates).catch(e => console.warn('SQLite update asset warning:', e));

    addAuditEntry(
      'Asset Status Changed',
      `Admin updated ${updatedAsset.assetType} (${updatedAsset.assetNumber}): modified details, date & status`
    );

    showToast(`Asset "${updatedAsset.assetNumber}" details updated and synchronized across Hardware Fleet!`, 'success');
    return { success: true };
  };

  const removeCompanyAsset: AppContextType['removeCompanyAsset'] = assetId => {
    if (currentUser?.role === 'employee') {
      showToast('Unauthorized: Administrative privileges required.', 'error');
      return { success: false, error: 'Unauthorized: Administrative privileges required.' };
    }

    const asset = assets.find(a => a.id === assetId);
    if (!asset) {
      showToast('Asset not found.', 'error');
      return { success: false, error: 'Asset not found.' };
    }

    const nextAssets = assets.filter(a => a.id !== assetId);
    const nextAllocations = allocationRecords.filter(alloc => alloc.assetId !== assetId);
    let nextComputers = [...computers];

    // If it's a Laptop, also remove from computers
    const deletedCompIds = new Set<string>();
    if (asset.assetType === 'Laptop') {
      computers.forEach(c => {
        if (
          c.assetNumber.toLowerCase() === asset.assetNumber.toLowerCase() ||
          (asset.serialNumber && c.serialNumber.toLowerCase() === asset.serialNumber.toLowerCase())
        ) {
          deletedCompIds.add(c.id);
        }
      });
      nextComputers = computers.filter(c => !deletedCompIds.has(c.id));
    }

    setAssets(nextAssets);
    setAllocationRecords(nextAllocations);
    setComputers(nextComputers);

    // Synchronous LocalStorage write
    try {
      localStorage.setItem(`${STORAGE_KEY}_ASSETS`, JSON.stringify(nextAssets));
      localStorage.setItem(`${STORAGE_KEY}_COMPUTERS`, JSON.stringify(nextComputers));
      localStorage.setItem(`${STORAGE_KEY}_ALLOCATIONS`, JSON.stringify(nextAllocations));
    } catch (e) {
      console.error('LocalStorage write error during removeCompanyAsset:', e);
    }

    // Immediate IndexedDB write
    Promise.all([
      assetCoreDB.putAll('assets', nextAssets),
      assetCoreDB.putAll('computers', nextComputers),
      assetCoreDB.putAll('allocationRecords', nextAllocations),
    ]).catch(() => {});

    // SQLite Backend Delete
    api.deleteAsset(assetId).catch(e => console.warn('SQLite delete asset warning:', e));
    for (const cId of deletedCompIds) {
      api.deleteComputer(cId).catch(e => console.warn('SQLite delete matching computer warning:', e));
    }

    addAuditEntry(
      'Asset Removed',
      `Decommissioned and permanently removed ${asset.assetType} ${asset.assetNumber} (${asset.brand} ${asset.model})`
    );
    showToast(`Asset "${asset.assetNumber}" removed successfully from fleet.`, 'success');
    return { success: true };
  };

  // Assign or Change Computer for Employee (Admin only)
  const assignComputerToEmployee: AppContextType['assignComputerToEmployee'] = (
    computerId,
    employeeId,
    assignedDate,
    condition,
    remarks,
    securityFunctionAdded,
    securityFunctionAddedDate
  ) => {
    if (currentUser?.role === 'employee') {
      showToast('Unauthorized: Administrative privileges required.', 'error');
      return { success: false, error: 'Unauthorized: Administrative privileges required.' };
    }

    const comp = computers.find(c => c.id === computerId);
    if (!comp) {
      showToast('Computer not found.', 'error');
      return { success: false, error: 'Computer not found.' };
    }

    const targetEmp = employeeId ? employees.find(e => e.id === employeeId || e.employeeId === employeeId) : null;

    let nextComputers = [...computers];
    let nextAssets = [...assets];
    let nextAllocations = [...allocationRecords];

    if (targetEmp) {
      // Release any other computer previously assigned to this employee
      nextComputers = computers.map(c =>
        c.id !== computerId && (c.assignedEmployeeId === targetEmp.id || c.assignedEmployeeId === targetEmp.employeeId)
          ? {
              ...c,
              assignedEmployeeId: null,
              assignedDate: null,
              status: 'Available' as const,
            }
          : c.id === computerId
          ? {
              ...c,
              assignedEmployeeId: targetEmp.id,
              assignedDate: assignedDate,
              status: 'Assigned' as const,
              condition: condition || c.condition,
              remarks: remarks || c.remarks,
              ...(securityFunctionAdded ? { securityFunctionAdded } : {}),
              ...(securityFunctionAddedDate ? { securityFunctionAddedDate } : {}),
            }
          : c
      );

      // Also sync matching CompanyAsset in assets
      nextAssets = assets.map(a => {
        if (a.assetNumber.toLowerCase() === comp.assetNumber.toLowerCase()) {
          return {
            ...a,
            assignedEmployeeId: targetEmp.id,
            assignedDate: assignedDate,
            status: 'Assigned' as const,
            condition: condition || a.condition,
            remarks: remarks || a.remarks,
            ...(securityFunctionAdded ? { securityFunctionAdded } : {}),
            ...(securityFunctionAddedDate ? { securityFunctionAddedDate } : {}),
          };
        }
        if (
          a.assetType === 'Laptop' &&
          (a.assignedEmployeeId === targetEmp.id || a.assignedEmployeeId === targetEmp.employeeId)
        ) {
          return {
            ...a,
            assignedEmployeeId: null,
            assignedDate: null,
            status: 'Available' as const,
          };
        }
        return a;
      });

      const newAlloc: AssetAllocationRecord = {
        id: 'alloc-' + Date.now(),
        employeeId: targetEmp.employeeId,
        employeeName: targetEmp.name,
        assetId: comp.id,
        assetType: 'Laptop',
        assetNumber: comp.assetNumber,
        serialNumber: comp.serialNumber,
        assignedDate,
        issuedBy: currentUser?.name || 'IT Administrator',
        receivedBy: targetEmp.name,
        conditionAtIssue: condition || comp.condition,
        returnDate: null,
        returnCondition: null,
        status: 'Assigned',
        remarks: remarks || 'Workstation computer assignment updated by Admin',
      };
      nextAllocations = [newAlloc, ...allocationRecords];

      addAuditEntry(
        'Asset Assigned',
        `Admin assigned computer ${comp.assetNumber} to ${targetEmp.name}`
      );
      showToast(`Computer "${comp.assetNumber}" assigned to ${targetEmp.name}!`, 'success');
    } else {
      // Unassigning computer
      const previousEmp = employees.find(
        e => e.id === comp.assignedEmployeeId || e.employeeId === comp.assignedEmployeeId
      );
      const returnDate = assignedDate || new Date().toISOString().substring(0, 10);

      nextComputers = computers.map(c =>
        c.id === computerId
          ? {
              ...c,
              assignedEmployeeId: null,
              assignedDate: null,
              status: 'Available' as const,
              condition: condition || c.condition,
              remarks: remarks || c.remarks,
            }
          : c
      );

      nextAssets = assets.map(a =>
        a.assetNumber.toLowerCase() === comp.assetNumber.toLowerCase()
          ? {
              ...a,
              assignedEmployeeId: null,
              assignedDate: null,
              returnDate,
              status: 'Available' as const,
              condition: condition || a.condition,
              remarks: remarks || a.remarks,
            }
          : a
      );

      // Record return allocation entry so previous assignment history is preserved
      const returnAlloc: AssetAllocationRecord = {
        id: 'alloc-' + Date.now(),
        employeeId: previousEmp ? previousEmp.employeeId : 'UNKNOWN',
        employeeName: previousEmp ? previousEmp.name : 'Unknown Employee',
        assetId: comp.id,
        assetType: 'Laptop',
        assetNumber: comp.assetNumber,
        serialNumber: comp.serialNumber,
        assignedDate: comp.assignedDate || '—',
        issuedBy: 'IT Admin',
        receivedBy: currentUser?.name || 'IT Administrator',
        conditionAtIssue: comp.condition,
        returnDate,
        returnCondition: condition || comp.condition,
        status: 'Returned',
        remarks: remarks || `Removed from employee and returned to available stock`,
      };
      nextAllocations = [returnAlloc, ...allocationRecords];

      addAuditEntry(
        'Asset Returned',
        `Admin removed computer ${comp.assetNumber} from ${previousEmp?.name || 'employee'} & returned to available stock`
      );
      showToast(`Computer "${comp.assetNumber}" removed from employee and returned to available stock.`, 'info');
    }

    setComputers(nextComputers);
    setAssets(nextAssets);
    setAllocationRecords(nextAllocations);

    // Synchronous LocalStorage write
    try {
      localStorage.setItem(`${STORAGE_KEY}_COMPUTERS`, JSON.stringify(nextComputers));
      localStorage.setItem(`${STORAGE_KEY}_ASSETS`, JSON.stringify(nextAssets));
      localStorage.setItem(`${STORAGE_KEY}_ALLOCATIONS`, JSON.stringify(nextAllocations));
    } catch (e) {
      console.error('LocalStorage write error during assignComputerToEmployee:', e);
    }

    // Immediate IndexedDB write
    Promise.all([
      assetCoreDB.putAll('computers', nextComputers),
      assetCoreDB.putAll('assets', nextAssets),
      assetCoreDB.putAll('allocationRecords', nextAllocations),
    ]).catch(() => {});

    // SQLite Backend Sync
    api.updateComputer(computerId, {
      assignedEmployeeId: employeeId ? (employees.find(e => e.id === employeeId || e.employeeId === employeeId)?.id || employeeId) : null,
      assignedDate: employeeId ? assignedDate : null,
      condition: condition || comp.condition,
      status: employeeId ? 'Assigned' : 'Available',
      remarks,
    }).catch(() => {});

    return { success: true };
  };

  // Add Service Record with automatic status sync & permanent receipt storage
  const addServiceRecord: AppContextType['addServiceRecord'] = record => {
    const newServiceId = 'SRV-' + new Date().getFullYear() + '-' + String(serviceRecords.length + 1).padStart(3, '0');
    
    // Process receipt document if provided
    let receiptStoragePath = record.receiptStoragePath;
    if (record.receiptFileUrl && !receiptStoragePath) {
      const fileId = `RECEIPT-${newServiceId}-${Date.now()}`;
      receiptStoragePath = `indexeddb://uploadedFiles/${fileId}`;
      
      assetCoreDB.saveUploadedFile({
        id: fileId,
        employeeId: record.employeeId,
        employeeName: record.employeeName,
        assetId: record.computerId,
        assetNumber: record.assetNumber,
        assetType: 'Service Receipt',
        fileName: record.receiptFileName || `ServiceReceipt_${newServiceId}.pdf`,
        fileType: record.receiptFileType || (record.receiptFileName?.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
        fileSize: record.receiptFileSize || Math.round((record.receiptFileUrl.length * 3) / 4),
        data: record.receiptFileUrl,
        storagePath: receiptStoragePath,
        storageLocation: 'Permanent IndexedDB Secure Storage',
        uploadedAt: record.receiptDate || new Date().toISOString(),
      }).catch(err => console.warn('Failed saving receipt to uploadedFiles store:', err));
    }

    const newRecord: ServiceRecord = {
      ...record,
      id: newServiceId,
      serviceCost: Number(record.serviceCost) || 0,
      receiptStoragePath,
    };

    const nextServices = [newRecord, ...serviceRecords];
    let nextComputers = [...computers];
    let nextAssets = [...assets];

    // Automatic status business logic:
    // If serviceStatus is 'In Progress', set computer and asset status to 'Under Service'
    if (newRecord.serviceStatus === 'In Progress') {
      nextComputers = computers.map(c =>
        c.id === newRecord.computerId || c.assetNumber === newRecord.assetNumber
          ? { ...c, status: 'Under Service' as const }
          : c
      );
      nextAssets = assets.map(a =>
        a.id === newRecord.computerId || a.assetNumber === newRecord.assetNumber
          ? { ...a, status: 'Under Service' as const }
          : a
      );
    } else if (newRecord.serviceStatus === 'Completed') {
      // If completed, set computer back to 'Assigned' if it has an assigned employee, or 'Available'
      nextComputers = computers.map(c => {
        if (c.id === newRecord.computerId || c.assetNumber === newRecord.assetNumber) {
          return {
            ...c,
            status: (c.assignedEmployeeId ? 'Assigned' : 'Available') as 'Assigned' | 'Available',
          };
        }
        return c;
      });
      nextAssets = assets.map(a => {
        if (a.id === newRecord.computerId || a.assetNumber === newRecord.assetNumber) {
          return {
            ...a,
            status: (a.assignedEmployeeId ? 'Assigned' : 'Available') as 'Assigned' | 'Available',
          };
        }
        return a;
      });
    }

    setServiceRecords(nextServices);
    setComputers(nextComputers);
    setAssets(nextAssets);

    // Synchronous LocalStorage write
    try {
      localStorage.setItem(`${STORAGE_KEY}_SERVICES`, JSON.stringify(nextServices));
      localStorage.setItem(`${STORAGE_KEY}_COMPUTERS`, JSON.stringify(nextComputers));
      localStorage.setItem(`${STORAGE_KEY}_ASSETS`, JSON.stringify(nextAssets));
      localStorage.setItem('assetcore_service_broadcast', JSON.stringify({ id: newRecord.id, timestamp: Date.now() }));
    } catch (e) {
      console.error('LocalStorage write error during addServiceRecord:', e);
    }

    // Immediate IndexedDB write
    Promise.all([
      assetCoreDB.putAll('serviceRecords', nextServices),
      assetCoreDB.putAll('computers', nextComputers),
      assetCoreDB.putAll('assets', nextAssets),
    ]).catch(() => {});

    // SQLite Backend Sync
    api.createServiceRecord(newRecord).catch(e => console.warn('SQLite add service warning:', e));

    // Reactive event dispatch for immediate notification badge update
    window.dispatchEvent(new CustomEvent('assetcore:new_service_record', { detail: newRecord }));

    addAuditEntry(
      'Service Record Added',
      `Logged service ${newRecord.id} for computer ${newRecord.deviceName} (${newRecord.assetNumber}). Cost: ₹${newRecord.serviceCost || 0}. Problem: ${newRecord.problemCategory}`
    );

    showToast(`Service ticket "${newRecord.id}" recorded successfully!`, 'success');
    return { success: true };
  };

  // Update Service Record with automatic status sync & receipt persistence
  const updateServiceRecord: AppContextType['updateServiceRecord'] = (id, updates) => {
    let nextComputers = [...computers];
    let nextAssets = [...assets];

    const nextServices = serviceRecords.map(s => {
      if (s.id === id) {
        let receiptStoragePath = updates.receiptStoragePath !== undefined ? updates.receiptStoragePath : s.receiptStoragePath;
        
        // If a new receipt file is provided, persist it in uploadedFiles store
        if (updates.receiptFileUrl && updates.receiptFileUrl !== s.receiptFileUrl) {
          const fileId = `RECEIPT-${id}-${Date.now()}`;
          receiptStoragePath = `indexeddb://uploadedFiles/${fileId}`;

          assetCoreDB.saveUploadedFile({
            id: fileId,
            employeeId: s.employeeId,
            employeeName: s.employeeName,
            assetId: s.computerId,
            assetNumber: s.assetNumber,
            assetType: 'Service Receipt',
            fileName: updates.receiptFileName || s.receiptFileName || `ServiceReceipt_${id}.pdf`,
            fileType: updates.receiptFileType || (updates.receiptFileName?.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
            fileSize: updates.receiptFileSize || Math.round((updates.receiptFileUrl.length * 3) / 4),
            data: updates.receiptFileUrl,
            storagePath: receiptStoragePath,
            storageLocation: 'Permanent IndexedDB Secure Storage',
            uploadedAt: updates.receiptDate || new Date().toISOString(),
          }).catch(err => console.warn('Failed saving updated receipt to uploadedFiles store:', err));
        }

        const updated = {
          ...s,
          ...updates,
          receiptStoragePath,
          ...(updates.serviceCost !== undefined ? { serviceCost: Number(updates.serviceCost) || 0 } : {}),
        };

        // If status transitioned to Completed
        if (updates.serviceStatus === 'Completed') {
          nextComputers = nextComputers.map(c =>
            c.id === updated.computerId || (c.assetNumber && updated.assetNumber && c.assetNumber.trim().toLowerCase() === updated.assetNumber.trim().toLowerCase())
              ? { ...c, status: (c.assignedEmployeeId ? 'Assigned' : 'Available') as 'Assigned' | 'Available' }
              : c
          );
          nextAssets = nextAssets.map(a =>
            a.id === updated.computerId || (a.assetNumber && updated.assetNumber && a.assetNumber.trim().toLowerCase() === updated.assetNumber.trim().toLowerCase())
              ? { ...a, status: (a.assignedEmployeeId ? 'Assigned' : 'Available') as 'Assigned' | 'Available' }
              : a
          );
        } else if (updates.serviceStatus === 'In Progress') {
          nextComputers = nextComputers.map(c =>
            c.id === updated.computerId || (c.assetNumber && updated.assetNumber && c.assetNumber.trim().toLowerCase() === updated.assetNumber.trim().toLowerCase())
              ? { ...c, status: 'Under Service' as const }
              : c
          );
          nextAssets = nextAssets.map(a =>
            a.id === updated.computerId || (a.assetNumber && updated.assetNumber && a.assetNumber.trim().toLowerCase() === updated.assetNumber.trim().toLowerCase())
              ? { ...a, status: 'Under Service' as const }
              : a
          );
        }

        return updated;
      }
      return s;
    });

    setServiceRecords(nextServices);
    setComputers(nextComputers);
    setAssets(nextAssets);

    // Synchronous LocalStorage write
    try {
      localStorage.setItem(`${STORAGE_KEY}_SERVICES`, JSON.stringify(nextServices));
      localStorage.setItem(`${STORAGE_KEY}_COMPUTERS`, JSON.stringify(nextComputers));
      localStorage.setItem(`${STORAGE_KEY}_ASSETS`, JSON.stringify(nextAssets));
      localStorage.setItem('assetcore_service_broadcast', JSON.stringify({ id, action: 'update', timestamp: Date.now() }));
    } catch (e) {
      console.error('LocalStorage write error during updateServiceRecord:', e);
    }

    // Immediate IndexedDB write
    Promise.all([
      assetCoreDB.putAll('serviceRecords', nextServices),
      assetCoreDB.putAll('computers', nextComputers),
      assetCoreDB.putAll('assets', nextAssets),
    ]).catch(() => {});

    // SQLite Backend Sync
    api.updateServiceRecord(id, updates).catch(e => console.warn('SQLite update service warning:', e));

    window.dispatchEvent(new CustomEvent('assetcore:new_service_record', { detail: { id, updates } }));

    addAuditEntry('Service Record Updated', `Service record ${id} status/details/receipt updated.`);
    showToast('Service record updated successfully.', 'success');
  };

  const removeServiceRecord: AppContextType['removeServiceRecord'] = id => {
    if (currentUser?.role === 'employee') {
      showToast('Unauthorized: Administrative privileges required.', 'error');
      return { success: false, error: 'Unauthorized: Administrative privileges required.' };
    }

    const record = serviceRecords.find(s => s.id === id);
    if (!record) {
      showToast('Service record not found.', 'error');
      return { success: false, error: 'Service record not found.' };
    }

    const nextServices = serviceRecords.filter(s => s.id !== id);
    setServiceRecords(nextServices);

    // Synchronous LocalStorage write
    try {
      localStorage.setItem(`${STORAGE_KEY}_SERVICES`, JSON.stringify(nextServices));
    } catch (e) {
      console.error('LocalStorage write error during removeServiceRecord:', e);
    }

    // Immediate IndexedDB write
    assetCoreDB.putAll('serviceRecords', nextServices).catch(() => {});

    // SQLite Backend Delete
    api.deleteServiceRecord(id).catch(e => console.warn('SQLite delete service warning:', e));

    addAuditEntry(
      'Service Record Removed',
      `Deleted service ticket ${record.id} for computer ${record.assetNumber}`
    );
    showToast(`Service ticket "${record.id}" deleted.`, 'success');
    return { success: true };
  };

  // Weekly Asset Photo Documentation Functions
  const addWeeklyPhotoRecord: AppContextType['addWeeklyPhotoRecord'] = recordData => {
    const now = new Date().toISOString();
    const id = 'WPR-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    
    // Ensure all uploaded files are tagged with storage locations
    const enrichedPhotos = (recordData.assetPhotos || []).map(photo => {
      const fileId = `FILE-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const hasFile = !!photo.photoUrl && photo.photoUrl.trim() !== '';
      const hasDrive = !!photo.googleDriveLink && photo.googleDriveLink.trim() !== '';
      
      let uploadType: 'file' | 'drive' | 'both' = 'file';
      if (hasFile && hasDrive) uploadType = 'both';
      else if (hasDrive) uploadType = 'drive';

      const storageLocation = hasFile 
        ? 'Permanent IndexedDB Secure Storage' 
        : (hasDrive ? 'Google Drive Cloud' : undefined);
      
      const storagePath = hasFile ? `indexeddb://uploadedFiles/${fileId}` : undefined;

      // If there's an actual file uploaded, save it to the dedicated uploadedFiles store
      if (hasFile && photo.photoUrl) {
        assetCoreDB.saveUploadedFile({
          id: fileId,
          employeeId: recordData.employeeId,
          employeeName: recordData.employeeName,
          assetId: photo.assetId,
          assetNumber: photo.assetNumber,
          assetType: photo.assetType,
          fileName: photo.fileName || `${photo.assetType}_${photo.assetNumber}_${now.substring(0, 10)}.jpg`,
          fileType: photo.fileType || 'image/jpeg',
          fileSize: photo.fileSize || Math.round((photo.photoUrl.length * 3) / 4),
          data: photo.photoUrl,
          storagePath: storagePath!,
          storageLocation: 'Permanent IndexedDB Secure Storage',
          googleDriveLink: photo.googleDriveLink,
          uploadedAt: photo.capturedAt || now,
        }).catch(err => console.warn('Failed saving to uploadedFiles store:', err));
      }

      return {
        ...photo,
        uploadType,
        storageLocation,
        storagePath: photo.storagePath || storagePath,
      };
    });

    const newRecord: WeeklyAssetPhotoRecord = {
      ...recordData,
      uploadDate: recordData.uploadDate || now.substring(0, 10),
      status: recordData.status || 'Pending Review',
      reviewStatus: recordData.status || 'Pending Review',
      assetPhotos: enrichedPhotos,
      id,
      createdAt: now,
      updatedAt: now,
    };

    const nextRecords = [newRecord, ...weeklyPhotoRecords];
    setWeeklyPhotoRecords(nextRecords);

    // Synchronous LocalStorage write with quota defense
    try {
      localStorage.setItem(`${STORAGE_KEY}_WEEKLY_PHOTO_DOCS`, JSON.stringify(nextRecords));
      localStorage.setItem('assetcore_photo_broadcast', JSON.stringify({ id, timestamp: Date.now() }));
    } catch (e) {
      console.warn('LocalStorage write warning (handled, IndexedDB & SQLite maintain full records):', e);
    }

    // Immediate IndexedDB write (Permanent Enterprise Storage)
    assetCoreDB.putAll('weeklyAssetPhotos', nextRecords).catch(() => {});

    // SQLite Backend Sync
    api.createWeeklyPhoto(newRecord).catch(e => console.warn('SQLite add photo warning:', e));

    window.dispatchEvent(new CustomEvent('assetcore:new_photo_audit', { detail: newRecord }));

    addAuditEntry(
      'Weekly Photo Audit Added',
      `Uploaded weekly asset documentation for ${newRecord.employeeName} (${newRecord.employeeCode || newRecord.employeeId}) for ${newRecord.weekLabel} [Status: ${newRecord.status}] with ${newRecord.assetPhotos.length} asset entries permanently saved.`
    );
    showToast(`Weekly Asset Documentation uploaded successfully for ${newRecord.employeeName}.`, 'success');
    return { success: true };
  };

  const updateWeeklyPhotoRecord: AppContextType['updateWeeklyPhotoRecord'] = (id, updates) => {
    const existing = weeklyPhotoRecords.find(r => r.id === id);
    if (!existing) {
      showToast('Weekly photo record not found.', 'error');
      return { success: false, error: 'Weekly photo record not found.' };
    }

    const now = new Date().toISOString();
    
    // Save any newly updated files to uploadedFiles store
    if (updates.assetPhotos) {
      for (const p of updates.assetPhotos) {
        if (p.photoUrl && p.photoUrl.startsWith('data:')) {
          const fileId = p.storagePath?.replace('indexeddb://uploadedFiles/', '') || `FILE-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          assetCoreDB.saveUploadedFile({
            id: fileId,
            employeeId: existing.employeeId,
            employeeName: existing.employeeName,
            assetId: p.assetId,
            assetNumber: p.assetNumber,
            assetType: p.assetType,
            fileName: p.fileName || `${p.assetType}_${p.assetNumber}.jpg`,
            fileType: p.fileType || 'image/jpeg',
            fileSize: p.fileSize || Math.round((p.photoUrl.length * 3) / 4),
            data: p.photoUrl,
            storagePath: `indexeddb://uploadedFiles/${fileId}`,
            storageLocation: 'Permanent IndexedDB Secure Storage',
            googleDriveLink: p.googleDriveLink,
            uploadedAt: p.capturedAt || now,
          }).catch(() => {});
        }
      }
    }

    const nextRecords = weeklyPhotoRecords.map(r => {
      if (r.id !== id) return r;
      const updatedStatus = updates.status || r.status || 'Pending Review';
      return {
        ...r,
        ...updates,
        status: updatedStatus,
        reviewStatus: updatedStatus,
        updatedAt: now,
      };
    });
    setWeeklyPhotoRecords(nextRecords);

    // Synchronous LocalStorage write with quota defense
    try {
      localStorage.setItem(`${STORAGE_KEY}_WEEKLY_PHOTO_DOCS`, JSON.stringify(nextRecords));
      localStorage.setItem('assetcore_photo_broadcast', JSON.stringify({ id, action: 'update', timestamp: Date.now() }));
    } catch (e) {
      console.warn('LocalStorage write warning (handled, IndexedDB maintains full records):', e);
    }

    // Immediate IndexedDB write
    assetCoreDB.putAll('weeklyAssetPhotos', nextRecords).catch(() => {});

    // SQLite Backend Sync
    api.updateWeeklyPhoto(id, updates).catch(e => console.warn('SQLite update photo warning:', e));

    window.dispatchEvent(new CustomEvent('assetcore:new_photo_audit', { detail: { id, updates } }));

    addAuditEntry(
      'Weekly Photo Audit Updated',
      `Updated weekly asset photo audit record for ${existing.employeeName} (${existing.weekLabel}) - Status: ${updates.status || existing.status}.`
    );
    showToast(`Weekly Asset Photo Documentation updated.`, 'success');
    return { success: true };
  };

  const deleteWeeklyPhotoRecord: AppContextType['deleteWeeklyPhotoRecord'] = id => {
    const existing = weeklyPhotoRecords.find(r => r.id === id);
    if (!existing) {
      showToast('Weekly photo record not found.', 'error');
      return { success: false, error: 'Weekly photo record not found.' };
    }

    // Delete associated files from uploadedFiles store
    if (existing.assetPhotos) {
      for (const p of existing.assetPhotos) {
        if (p.storagePath) {
          const fileId = p.storagePath.replace('indexeddb://uploadedFiles/', '');
          assetCoreDB.deleteUploadedFile(fileId).catch(() => {});
        }
      }
    }

    const nextRecords = weeklyPhotoRecords.filter(r => r.id !== id);
    setWeeklyPhotoRecords(nextRecords);

    // Synchronous LocalStorage write
    try {
      const safeRecords = (nextRecords || []).map(r => ({
        ...r,
        assetPhotos: (r?.assetPhotos || []).map(p => ({
          ...p,
          photoUrl: p?.photoUrl && p.photoUrl.length > 50000 ? p.photoUrl.substring(0, 100) + '...[indexeddb_stored]' : (p?.photoUrl || ''),
        })),
      }));
      localStorage.setItem(`${STORAGE_KEY}_WEEKLY_PHOTO_DOCS`, JSON.stringify(safeRecords));
    } catch (e) {
      console.warn('LocalStorage write warning (handled):', e);
    }

    // Immediate IndexedDB write
    assetCoreDB.delete('weeklyAssetPhotos', id).catch(() => {});

    // SQLite Backend Delete
    api.deleteWeeklyPhoto(id).catch(e => console.warn('SQLite delete photo warning:', e));

    addAuditEntry(
      'Weekly Photo Audit Removed',
      `Deleted weekly asset photo audit record for ${existing.employeeName} (${existing.weekLabel}).`
    );
    showToast(`Weekly Asset Photo record deleted.`, 'info');
    return { success: true };
  };

  // PC/Laptop Purchase & Accessories Management Actions
  // Helper to generate next sequential asset number by prefix
  const getNextAssetNumberByPrefix = (
    prefix: string,
    currentAssets: CompanyAsset[],
    currentComputers: Computer[],
    offset = 0
  ) => {
    const cleanPrefix = prefix.toUpperCase();
    let maxNum = 0;
    const allNumbers = [
      ...currentAssets.map(a => a.assetNumber || ''),
      ...currentComputers.map(c => c.assetNumber || ''),
    ];
    for (const num of allNumbers) {
      if (num.toUpperCase().startsWith(cleanPrefix)) {
        const parsed = parseInt(num.substring(cleanPrefix.length), 10);
        if (!isNaN(parsed) && parsed > maxNum) {
          maxNum = parsed;
        }
      }
    }
    return `${cleanPrefix}${String(maxNum + 1 + offset).padStart(3, '0')}`;
  };

  // Fleet & Asset Purchase Management Actions
  const addPurchaseRecord: AppContextType['addPurchaseRecord'] = (recordData, options) => {
    if (currentUser?.role === 'employee') {
      showToast('Unauthorized: Administrative privileges required.', 'error');
      return { success: false, error: 'Unauthorized: Administrative privileges required.' };
    }

    const now = new Date().toISOString();
    const id = recordData.id || 'PUR-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const purchaseNumber = recordData.purchaseNumber?.trim() || `PO-${new Date().getFullYear()}-${String(purchases.length + 1).padStart(3, '0')}`;

    // Normalize accessories array and calculate totals
    const accessories = (recordData.accessories || []).map(acc => {
      const accQty = Number(acc.quantity) || 1;
      const accUnit = Number(acc.unitCost) || 0;
      return {
        ...acc,
        id: acc.id || 'ACC-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        quantity: accQty,
        unitCost: accUnit,
        totalCost: acc.totalCost !== undefined ? Number(acc.totalCost) : accQty * accUnit,
      };
    });

    const totalAccessoriesCost = accessories.reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0);
    const qty = Math.max(1, Number(recordData.quantity) || 1);
    const unitCost = Number(recordData.unitCost) || (Number(recordData.deviceCost) ? Number(recordData.deviceCost) / qty : 0);
    const deviceCost = Number(recordData.deviceCost) !== undefined && Number(recordData.deviceCost) > 0
      ? Number(recordData.deviceCost)
      : unitCost * qty;
    const grandTotalCost = deviceCost + totalAccessoriesCost;

    const newRecord: PurchaseRecord = {
      ...recordData,
      id,
      purchaseNumber,
      quantity: qty,
      unitCost,
      deviceCost,
      accessories,
      totalAccessoriesCost,
      grandTotalCost,
      status: recordData.status || 'In Stock',
      createdAt: now,
      updatedAt: now,
    };

    // Optional Auto Fleet Registration if Admin requested (or default)
    if (options?.addToFleet) {
      const isComputer = newRecord.deviceType === 'PC' || newRecord.deviceType === 'Laptop' || newRecord.deviceType === 'Desktop';
      const isPhone = newRecord.deviceType === 'Mobile Phone';

      let canonicalEmpId = newRecord.assignedEmployeeId || null;
      let canonicalEmpName = newRecord.assignedEmployeeName || null;
      if (canonicalEmpId) {
        const foundEmp = employees.find(e => e.id === canonicalEmpId || e.employeeId === canonicalEmpId);
        if (foundEmp) {
          canonicalEmpId = foundEmp.id;
          canonicalEmpName = foundEmp.name;
        }
      }

      let nextComputers = [...computers];
      let nextAssets = [...assets];
      let nextAllocations = [...allocationRecords];
      const newlyCreatedAssetIds: string[] = [];

      if (isComputer) {
        const prefix = newRecord.deviceType === 'PC' || newRecord.deviceType === 'Desktop' ? 'DSK-' : 'LAP-';
        for (let i = 0; i < qty; i++) {
          const generatedTag = getNextAssetNumberByPrefix(prefix, nextAssets, nextComputers, 0);
          const compId = 'comp-' + Date.now() + '-' + i;
          const isAssigned = i === 0 && Boolean(canonicalEmpId);

          const newComp: Computer = {
            id: compId,
            assetNumber: generatedTag,
            deviceType: newRecord.deviceType === 'PC' || newRecord.deviceType === 'Desktop' ? 'Desktop' : 'Laptop',
            deviceName: `${newRecord.brand}_${newRecord.modelName}`.replace(/\s+/g, '_').trim() || `${newRecord.deviceType}_Workstation`,
            manufacturer: newRecord.brand || 'Dell',
            model: newRecord.modelNumber || newRecord.modelName || 'Enterprise Edition',
            serialNumber: (qty === 1 && newRecord.serialNumber) ? newRecord.serialNumber : (newRecord.serialNumber ? `${newRecord.serialNumber}-${i + 1}` : `SN-${Date.now()}-${i + 1}`),
            status: isAssigned ? 'Assigned' : 'Available',
            assignedEmployeeId: isAssigned ? canonicalEmpId : null,
            assignedDate: isAssigned ? (newRecord.purchaseDate || now.substring(0, 10)) : null,
            condition: 'New',
            remarks: `Auto-registered from Purchase Order ${newRecord.purchaseNumber}. Unit Cost: ₹${unitCost.toLocaleString('en-IN')}`,
            processor: {
              name: newRecord.processor || 'Intel Core i7-13700H',
              generation: '13th Gen',
              speed: '2.40 GHz - 5.00 GHz',
            },
            memory: {
              installedRAM: newRecord.ram || '16.0 GB',
              usableRAM: `${newRecord.ram || '16.0 GB'} usable`,
            },
            graphics: {
              card: 'Intel(R) Iris(R) Xe Graphics',
              memory: '1024 MB',
            },
            storage: {
              total: newRecord.storage || '512 GB',
              used: '85 GB',
              free: '427 GB',
              type: 'NVMe SSD',
            },
            system: {
              os: newRecord.os || 'Windows 11 Pro 64-bit',
              systemType: '64-bit operating system, x64-based processor',
              processorArchitecture: 'x64',
              deviceId: `DEV-${Date.now().toString(16).toUpperCase()}-${i}`,
              productId: `PROD-${newRecord.purchaseNumber}-${i + 1}`,
              penAndTouch: 'No pen or touch input is available for this display',
            },
          };

          nextComputers = [newComp, ...nextComputers];
          api.createComputer(newComp).catch(() => {});
          if (i === 0) {
            newRecord.assignedComputerId = compId;
          }

          if (isAssigned && canonicalEmpId && canonicalEmpName) {
            const alloc: AssetAllocationRecord = {
              id: 'alloc-' + Date.now() + '-' + i,
              employeeId: canonicalEmpId,
              employeeName: canonicalEmpName,
              assetId: compId,
              assetType: newComp.deviceType,
              assetNumber: newComp.assetNumber,
              serialNumber: newComp.serialNumber,
              assignedDate: newRecord.purchaseDate || now.substring(0, 10),
              issuedBy: currentUser?.name || 'IT Admin',
              receivedBy: canonicalEmpName,
              conditionAtIssue: 'New',
              returnDate: null,
              returnCondition: null,
              status: 'Assigned',
              remarks: `Assigned upon purchase PO #${newRecord.purchaseNumber}`,
            };
            nextAllocations = [alloc, ...nextAllocations];
            api.createAllocation(alloc).catch(() => {});
          }
        }
      } else if (isPhone) {
        for (let i = 0; i < qty; i++) {
          const generatedTag = getNextAssetNumberByPrefix('PHN-', nextAssets, nextComputers, 0);
          const assetId = 'asset-phn-' + Date.now() + '-' + i + '-' + Math.random().toString(36).substring(2, 6);
          const isAssigned = i === 0 && Boolean(canonicalEmpId);

          const newPhoneAsset: CompanyAsset = {
            id: assetId,
            assetType: 'Mobile Phone',
            assetNumber: generatedTag,
            brand: newRecord.brand,
            model: newRecord.modelName + (newRecord.modelNumber ? ` (${newRecord.modelNumber})` : ''),
            serialNumber: (qty === 1 && newRecord.serialNumber) ? newRecord.serialNumber : (newRecord.serialNumber ? `${newRecord.serialNumber}-${i + 1}` : `SN-PHN-${Date.now().toString(36).toUpperCase()}-${i + 1}`),
            assignedEmployeeId: isAssigned ? canonicalEmpId : null,
            assignedDate: isAssigned ? (newRecord.purchaseDate || now.substring(0, 10)) : null,
            returnDate: null,
            condition: 'New',
            status: isAssigned ? 'Assigned' : 'Available',
            remarks: `Procured via PO #${newRecord.purchaseNumber}. Unit Cost: ₹${unitCost.toLocaleString('en-IN')}`,
            deviceName: `${newRecord.brand} ${newRecord.modelName}`,
            imeiNumber: newRecord.imeiNumber,
            phoneNumber: newRecord.phoneNumber,
          };

          nextAssets = [newPhoneAsset, ...nextAssets];
          newlyCreatedAssetIds.push(assetId);
          api.createAsset(newPhoneAsset).catch(() => {});

          if (isAssigned && canonicalEmpId && canonicalEmpName) {
            const alloc: AssetAllocationRecord = {
              id: 'alloc-' + Date.now() + '-' + i,
              employeeId: canonicalEmpId,
              employeeName: canonicalEmpName,
              assetId: assetId,
              assetType: 'Mobile Phone',
              assetNumber: newPhoneAsset.assetNumber,
              serialNumber: newPhoneAsset.serialNumber,
              assignedDate: newRecord.purchaseDate || now.substring(0, 10),
              issuedBy: currentUser?.name || 'IT Admin',
              receivedBy: canonicalEmpName,
              conditionAtIssue: 'New',
              returnDate: null,
              returnCondition: null,
              status: 'Assigned',
              remarks: `Assigned upon purchase PO #${newRecord.purchaseNumber}`,
            };
            nextAllocations = [alloc, ...nextAllocations];
            api.createAllocation(alloc).catch(() => {});
          }
        }
      } else {
        // Monitors, Keyboards, Mice, Headsets, Docking Stations, Other
        const prefixMap: Record<string, string> = {
          'Monitor': 'MON-',
          'Keyboard': 'KEY-',
          'Mouse': 'MOU-',
          'Headset': 'HED-',
          'Docking Station': 'DOC-',
          'Other': 'AST-',
        };
        const prefix = prefixMap[newRecord.deviceType] || 'AST-';
        const mappedAssetType: AssetType = (
          ['Monitor', 'Keyboard', 'Mouse', 'Headset', 'Docking Station', 'Other'].includes(newRecord.deviceType)
            ? newRecord.deviceType
            : 'Other'
        ) as AssetType;

        for (let i = 0; i < qty; i++) {
          const generatedTag = getNextAssetNumberByPrefix(prefix, nextAssets, nextComputers, 0);
          const assetId = 'asset-' + prefix.replace('-', '').toLowerCase() + '-' + Date.now() + '-' + i + '-' + Math.random().toString(36).substring(2, 6);
          const isAssigned = i === 0 && Boolean(canonicalEmpId);

          const newAsset: CompanyAsset = {
            id: assetId,
            assetType: mappedAssetType,
            assetNumber: generatedTag,
            brand: newRecord.brand,
            model: newRecord.modelName + (newRecord.modelNumber ? ` (${newRecord.modelNumber})` : ''),
            serialNumber: (qty === 1 && newRecord.serialNumber) ? newRecord.serialNumber : (newRecord.serialNumber ? `${newRecord.serialNumber}-${i + 1}` : `SN-${prefix.replace('-', '')}-${Date.now().toString(36).toUpperCase()}-${i + 1}`),
            assignedEmployeeId: isAssigned ? canonicalEmpId : null,
            assignedDate: isAssigned ? (newRecord.purchaseDate || now.substring(0, 10)) : null,
            returnDate: null,
            condition: 'New',
            status: isAssigned ? 'Assigned' : 'Available',
            remarks: `Procured via PO #${newRecord.purchaseNumber}. Unit Cost: ₹${unitCost.toLocaleString('en-IN')}`,
            deviceName: `${newRecord.brand} ${newRecord.modelName}`,
          };

          nextAssets = [newAsset, ...nextAssets];
          newlyCreatedAssetIds.push(assetId);
          api.createAsset(newAsset).catch(() => {});

          if (isAssigned && canonicalEmpId && canonicalEmpName) {
            const alloc: AssetAllocationRecord = {
              id: 'alloc-' + Date.now() + '-' + i,
              employeeId: canonicalEmpId,
              employeeName: canonicalEmpName,
              assetId: assetId,
              assetType: mappedAssetType,
              assetNumber: newAsset.assetNumber,
              serialNumber: newAsset.serialNumber,
              assignedDate: newRecord.purchaseDate || now.substring(0, 10),
              issuedBy: currentUser?.name || 'IT Admin',
              receivedBy: canonicalEmpName,
              conditionAtIssue: 'New',
              returnDate: null,
              returnCondition: null,
              status: 'Assigned',
              remarks: `Assigned upon purchase PO #${newRecord.purchaseNumber}`,
            };
            nextAllocations = [alloc, ...nextAllocations];
            api.createAllocation(alloc).catch(() => {});
          }
        }
      }

      // Also register bundled accessories if any
      if (accessories.length > 0) {
        for (const acc of accessories) {
          const accPrefixMap: Record<string, string> = {
            'Monitor': 'MON-',
            'Keyboard': 'KEY-',
            'Mouse': 'MOU-',
            'Headset': 'HED-',
            'Docking Station': 'DOC-',
          };
          const accPrefix = accPrefixMap[acc.type] || 'AST-';
          const accAssetType: AssetType = (
            ['Monitor', 'Keyboard', 'Mouse', 'Headset', 'Docking Station'].includes(acc.type)
              ? acc.type
              : 'Other'
          ) as AssetType;

          for (let k = 0; k < (acc.quantity || 1); k++) {
            const accTag = getNextAssetNumberByPrefix(accPrefix, nextAssets, nextComputers, 0);
            const accAssetId = 'asset-acc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
            const isAssigned = Boolean(canonicalEmpId);

            const bundledAsset: CompanyAsset = {
              id: accAssetId,
              assetType: accAssetType,
              assetNumber: accTag,
              brand: acc.brand || newRecord.brand,
              model: acc.name || acc.model || `${acc.type} Bundle`,
              serialNumber: acc.serialNumber || `SN-${accPrefix.replace('-', '')}-${Date.now().toString(36).toUpperCase()}-${k + 1}`,
              assignedEmployeeId: isAssigned ? canonicalEmpId : null,
              assignedDate: isAssigned ? (newRecord.purchaseDate || now.substring(0, 10)) : null,
              returnDate: null,
              condition: 'New',
              status: isAssigned ? 'Assigned' : 'Available',
              remarks: `Bundled with PO #${newRecord.purchaseNumber} (${newRecord.brand} ${newRecord.modelName})`,
              deviceName: acc.name || `${acc.brand || newRecord.brand} ${acc.type}`,
            };

            nextAssets = [bundledAsset, ...nextAssets];
            newlyCreatedAssetIds.push(accAssetId);
            api.createAsset(bundledAsset).catch(() => {});

            if (isAssigned && canonicalEmpId && canonicalEmpName) {
              const alloc: AssetAllocationRecord = {
                id: 'alloc-' + Date.now() + '-' + k,
                employeeId: canonicalEmpId,
                employeeName: canonicalEmpName,
                assetId: accAssetId,
                assetType: accAssetType,
                assetNumber: bundledAsset.assetNumber,
                serialNumber: bundledAsset.serialNumber,
                assignedDate: newRecord.purchaseDate || now.substring(0, 10),
                issuedBy: currentUser?.name || 'IT Admin',
                receivedBy: canonicalEmpName,
                conditionAtIssue: 'New',
                returnDate: null,
                returnCondition: null,
                status: 'Assigned',
                remarks: `Bundled accessory assigned upon purchase PO #${newRecord.purchaseNumber}`,
              };
              nextAllocations = [alloc, ...nextAllocations];
              api.createAllocation(alloc).catch(() => {});
            }
          }
        }
      }

      newRecord.assignedAssetIds = newlyCreatedAssetIds;

      setComputers(nextComputers);
      setAssets(nextAssets);
      setAllocationRecords(nextAllocations);

      try {
        localStorage.setItem(`${STORAGE_KEY}_COMPUTERS`, JSON.stringify(nextComputers));
        localStorage.setItem(`${STORAGE_KEY}_ASSETS`, JSON.stringify(nextAssets));
        localStorage.setItem(`${STORAGE_KEY}_ALLOCATIONS`, JSON.stringify(nextAllocations));
      } catch {}

      assetCoreDB.putAll('computers', nextComputers).catch(() => {});
      assetCoreDB.putAll('assets', nextAssets).catch(() => {});
      assetCoreDB.putAll('allocationRecords', nextAllocations).catch(() => {});
    }

    const nextPurchases = [newRecord, ...purchases];
    setPurchases(nextPurchases);

    // Synchronous LocalStorage write
    try {
      localStorage.setItem(`${STORAGE_KEY}_PURCHASES`, JSON.stringify(nextPurchases));
    } catch (e) {
      console.warn('LocalStorage purchases write error:', e);
    }

    // IndexedDB async write
    assetCoreDB.putAll('purchases', nextPurchases).catch(() => {});

    // SQLite Backend Sync
    api.createPurchase(newRecord).catch(e => console.warn('SQLite purchase creation warning:', e));

    addAuditEntry(
      'Purchase Record Added',
      `Purchased ${newRecord.quantity && newRecord.quantity > 1 ? `${newRecord.quantity}x ` : ''}${newRecord.deviceType} ${newRecord.brand} ${newRecord.modelName} (PO #${newRecord.purchaseNumber}) for ₹${grandTotalCost.toLocaleString('en-IN')}`
    );

    showToast(`Purchase order "${newRecord.purchaseNumber}" recorded successfully!`, 'success');
    return { success: true, data: newRecord };
  };

  const updatePurchaseRecord: AppContextType['updatePurchaseRecord'] = (id, updates) => {
    if (currentUser?.role === 'employee') {
      showToast('Unauthorized: Administrative privileges required.', 'error');
      return { success: false, error: 'Unauthorized: Administrative privileges required.' };
    }

    const existing = purchases.find(p => p.id === id);
    if (!existing) {
      showToast('Purchase record not found.', 'error');
      return { success: false, error: 'Purchase record not found.' };
    }

    const now = new Date().toISOString();
    let updatedAccessories = existing.accessories;
    if (updates.accessories) {
      updatedAccessories = updates.accessories.map(acc => {
        const qty = Number(acc.quantity) || 1;
        const unit = Number(acc.unitCost) || 0;
        return {
          ...acc,
          id: acc.id || 'ACC-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          quantity: qty,
          unitCost: unit,
          totalCost: acc.totalCost !== undefined ? Number(acc.totalCost) : qty * unit,
        };
      });
    }

    const totalAccessoriesCost = updatedAccessories.reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0);
    const deviceCost = updates.deviceCost !== undefined ? Number(updates.deviceCost) : existing.deviceCost;
    const grandTotalCost = deviceCost + totalAccessoriesCost;

    const updatedRecord: PurchaseRecord = {
      ...existing,
      ...updates,
      deviceCost,
      accessories: updatedAccessories,
      totalAccessoriesCost,
      grandTotalCost,
      updatedAt: now,
    };

    const nextPurchases = purchases.map(p => (p.id === id ? updatedRecord : p));
    setPurchases(nextPurchases);

    try {
      localStorage.setItem(`${STORAGE_KEY}_PURCHASES`, JSON.stringify(nextPurchases));
    } catch (e) {
      console.warn('LocalStorage purchases write error:', e);
    }

    assetCoreDB.putAll('purchases', nextPurchases).catch(() => {});
    api.updatePurchase(id, updatedRecord).catch(e => console.warn('SQLite purchase update warning:', e));

    addAuditEntry(
      'Purchase Record Updated',
      `Updated purchase record ${updatedRecord.purchaseNumber} (${updatedRecord.brand} ${updatedRecord.modelName})`
    );

    showToast(`Purchase order "${updatedRecord.purchaseNumber}" updated.`, 'success');
    return { success: true };
  };

  const removePurchaseRecord: AppContextType['removePurchaseRecord'] = id => {
    if (currentUser?.role === 'employee') {
      showToast('Unauthorized: Administrative privileges required.', 'error');
      return { success: false, error: 'Unauthorized: Administrative privileges required.' };
    }

    const existing = purchases.find(p => p.id === id);
    if (!existing) {
      showToast('Purchase record not found.', 'error');
      return { success: false, error: 'Purchase record not found.' };
    }

    const nextPurchases = purchases.filter(p => p.id !== id);
    setPurchases(nextPurchases);

    try {
      localStorage.setItem(`${STORAGE_KEY}_PURCHASES`, JSON.stringify(nextPurchases));
    } catch (e) {
      console.warn('LocalStorage purchases delete error:', e);
    }

    assetCoreDB.delete('purchases', id).catch(() => {});
    api.deletePurchase(id).catch(e => console.warn('SQLite purchase delete warning:', e));

    addAuditEntry(
      'Purchase Record Removed',
      `Deleted purchase record ${existing.purchaseNumber} (${existing.brand} ${existing.modelName})`
    );

    showToast(`Purchase record "${existing.purchaseNumber}" deleted.`, 'info');
    return { success: true };
  };

  const assignPurchaseToEmployee: AppContextType['assignPurchaseToEmployee'] = (
    purchaseId,
    employeeId,
    assignedDate
  ) => {
    if (currentUser?.role === 'employee') {
      showToast('Unauthorized: Administrative privileges required.', 'error');
      return { success: false, error: 'Unauthorized: Administrative privileges required.' };
    }

    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase) {
      showToast('Purchase record not found.', 'error');
      return { success: false, error: 'Purchase record not found.' };
    }

    const targetEmp = employeeId ? employees.find(e => e.id === employeeId) : null;
    const now = new Date().toISOString();

    const updatedRecord: PurchaseRecord = {
      ...purchase,
      assignedEmployeeId: employeeId || null,
      assignedEmployeeName: targetEmp ? targetEmp.name : null,
      status: employeeId ? 'Assigned' : 'In Stock',
      updatedAt: now,
    };

    return updatePurchaseRecord(purchaseId, updatedRecord);
  };

  // -------------------------------------------------------------
  // MULTI-ASSET REQUISITION MANAGEMENT
  // -------------------------------------------------------------
  const addAssetRequest: AppContextType['addAssetRequest'] = requestData => {
    const reqId = `REQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newRecord: AssetRequest = {
      ...requestData,
      id: reqId,
      createdAt: new Date().toISOString(),
    };

    const nextList = [newRecord, ...assetRequests];
    setAssetRequests(nextList);
    try {
      localStorage.setItem(`${STORAGE_KEY}_ASSET_REQUESTS`, JSON.stringify(nextList));
      localStorage.setItem('assetcore_request_broadcast', JSON.stringify({ id: reqId, timestamp: Date.now() }));
    } catch (e) {
      console.warn('LocalStorage error saving asset request:', e);
    }

    // Persist to central SQLite backend & local enterprise IndexedDB
    api.createAssetRequest(newRecord).catch(err => {
      console.warn('[AssetCore Backend] Failed to sync asset request to SQLite:', err);
    });
    assetCoreDB.put('assetRequests', newRecord).catch(err => {
      console.warn('[AssetCore DB] Failed to save asset request to IndexedDB:', err);
    });

    // Reactive event dispatch for immediate notification update in current window
    window.dispatchEvent(new CustomEvent('assetcore:new_request', { detail: newRecord }));

    const totalUnits = newRecord.items.reduce((s, i) => s + (i.quantity || 1), 0);
    addAuditEntry(
      'Asset Request Submitted',
      `Employee ${newRecord.employeeName} (${newRecord.employeeId}) submitted requisition ${reqId} for ${totalUnits} item(s) (${newRecord.items.map(i => `${i.quantity}x ${i.assetType}`).join(', ')})`
    );

    showToast(`Equipment request #${reqId} submitted to IT Admin.`, 'success');
    return { success: true, requestId: reqId };
  };

  const updateAssetRequestStatus: AppContextType['updateAssetRequestStatus'] = (requestId, status, adminNotes) => {
    const existing = assetRequests.find(r => r.id === requestId);
    if (!existing) {
      showToast('Requisition record not found.', 'error');
      return;
    }

    const updatedAt = new Date().toISOString();
    const fulfilledDate = status === 'Fulfilled' ? (existing.fulfilledDate || new Date().toISOString().substring(0, 10)) : existing.fulfilledDate;
    const finalAdminNotes = adminNotes !== undefined ? adminNotes : existing.adminNotes;

    const nextList = assetRequests.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status,
          adminNotes: finalAdminNotes,
          fulfilledDate,
          updatedAt,
        };
      }
      return r;
    });

    setAssetRequests(nextList);
    try {
      localStorage.setItem(`${STORAGE_KEY}_ASSET_REQUESTS`, JSON.stringify(nextList));
      localStorage.setItem('assetcore_request_broadcast', JSON.stringify({ id: requestId, action: 'update', timestamp: Date.now() }));
    } catch (e) {
      console.warn('LocalStorage error updating asset request:', e);
    }

    const updated = nextList.find(r => r.id === requestId);
    if (updated) {
      api.updateAssetRequest(requestId, {
        status,
        adminNotes: finalAdminNotes,
        fulfilledDate,
        updatedAt,
      }).catch(err => console.warn('[AssetCore Backend] Failed to update asset request in SQLite:', err));

      assetCoreDB.put('assetRequests', updated).catch(() => {});
      window.dispatchEvent(new CustomEvent('assetcore:new_request', { detail: updated }));
    }

    addAuditEntry(
      'Asset Request Status Updated',
      `Admin updated requisition ${requestId} status to "${status}" for ${existing.employeeName}`
    );

    showToast(`Request ${requestId} updated to "${status}".`, 'success');
  };

  const removeAssetRequest: AppContextType['removeAssetRequest'] = requestId => {
    const existing = assetRequests.find(r => r.id === requestId);
    const nextList = assetRequests.filter(r => r.id !== requestId);
    setAssetRequests(nextList);
    try {
      localStorage.setItem(`${STORAGE_KEY}_ASSET_REQUESTS`, JSON.stringify(nextList));
      localStorage.setItem('assetcore_request_broadcast', JSON.stringify({ id: requestId, action: 'delete', timestamp: Date.now() }));
    } catch (e) {
      console.warn('LocalStorage error deleting asset request:', e);
    }

    api.deleteAssetRequest(requestId).catch(err => console.warn('[AssetCore Backend] Failed to delete asset request from SQLite:', err));
    assetCoreDB.delete('assetRequests', requestId).catch(() => {});
    window.dispatchEvent(new CustomEvent('assetcore:new_request', { detail: { id: requestId, deleted: true } }));

    if (existing) {
      addAuditEntry(
        'Asset Request Removed',
        `Admin removed requisition record ${requestId} for ${existing.employeeName}`
      );
    }

    showToast(`Requisition record "${requestId}" deleted.`, 'info');
  };

  // -------------------------------------------------------------
  // STAFF ASSET QUERY MANAGEMENT
  // -------------------------------------------------------------
  const addAssetQuery: AppContextType['addAssetQuery'] = queryData => {
    const nextSeq = assetQueries.length + 1;
    const queryId = `QRY-2026-${String(nextSeq).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const newQuery: AssetQuery = {
      ...queryData,
      id: queryId,
      isStarred: queryData.isStarred || false,
      status: 'Pending Acknowledgement',
      createdAt: now,
      updatedAt: now,
      history: [
        {
          id: `hist-${Date.now()}-1`,
          timestamp: now,
          status: 'Pending Acknowledgement',
          updatedBy: queryData.employeeName,
          notes: `Query raised regarding ${queryData.assetName} (${queryData.assetNumber}).`,
        },
      ],
    };

    const nextList = [newQuery, ...assetQueries];
    setAssetQueries(nextList);
    try {
      localStorage.setItem(`${STORAGE_KEY}_ASSET_QUERIES`, JSON.stringify(nextList));
    } catch (e) {
      console.warn('LocalStorage error saving asset query:', e);
    }

    addAuditEntry(
      'Asset Query Submitted',
      `Staff ${queryData.employeeName} (${queryData.employeeId}) raised asset query ${queryId} for ${queryData.assetName} [${queryData.assetNumber}]`
    );

    showToast(`Asset Query #${queryId} submitted successfully to Admin.`, 'success');
    return { success: true, id: queryId, message: 'Query submitted successfully' };
  };

  const acknowledgeAssetQuery: AppContextType['acknowledgeAssetQuery'] = (queryId, adminName) => {
    const existing = assetQueries.find(q => q.id === queryId);
    if (!existing) return { success: false, message: 'Query not found' };

    const now = new Date().toISOString();
    const ackAdmin = adminName || currentUser?.name || 'IT Admin';

    const nextList = assetQueries.map(q => {
      if (q.id === queryId) {
        return {
          ...q,
          status: 'Acknowledged' as AssetQueryStatus,
          acknowledgedBy: ackAdmin,
          acknowledgedAt: now,
          updatedAt: now,
          history: [
            {
              id: `hist-${Date.now()}`,
              timestamp: now,
              status: 'Acknowledged' as AssetQueryStatus,
              updatedBy: ackAdmin,
              notes: `Admin ${ackAdmin} explicitly acknowledged this query.`,
            },
            ...q.history,
          ],
        };
      }
      return q;
    });

    setAssetQueries(nextList);
    try {
      localStorage.setItem(`${STORAGE_KEY}_ASSET_QUERIES`, JSON.stringify(nextList));
    } catch (e) {
      console.warn('LocalStorage error acknowledging asset query:', e);
    }

    addAuditEntry(
      'Asset Query Acknowledged',
      `Admin ${ackAdmin} acknowledged query ${queryId} from ${existing.employeeName}`
    );

    showToast(`Query ${queryId} acknowledged successfully by ${ackAdmin}.`, 'success');
    return { success: true, message: 'Query acknowledged' };
  };

  const updateAssetQueryStatus: AppContextType['updateAssetQueryStatus'] = (queryId, status, notes, updatedBy) => {
    const existing = assetQueries.find(q => q.id === queryId);
    if (!existing) return { success: false, message: 'Query not found' };

    const now = new Date().toISOString();
    const updater = updatedBy || currentUser?.name || 'IT Admin';

    const nextList = assetQueries.map(q => {
      if (q.id === queryId) {
        let handoverDate = q.handoverDate;
        let resolvedAt = q.resolvedAt;
        let resolvedBy = q.resolvedBy;

        if (status === 'Handover Completed') {
          handoverDate = now;
        } else if (status === 'Resolved' || status === 'Closed') {
          resolvedAt = now;
          resolvedBy = updater;
        }

        return {
          ...q,
          status,
          handoverDate,
          resolvedAt,
          resolvedBy,
          resolutionNotes: notes || q.resolutionNotes,
          updatedAt: now,
          history: [
            {
              id: `hist-${Date.now()}`,
              timestamp: now,
              status,
              updatedBy: updater,
              notes: notes || `Status updated to ${status} by ${updater}.`,
            },
            ...q.history,
          ],
        };
      }
      return q;
    });

    setAssetQueries(nextList);
    try {
      localStorage.setItem(`${STORAGE_KEY}_ASSET_QUERIES`, JSON.stringify(nextList));
    } catch (e) {
      console.warn('LocalStorage error updating asset query:', e);
    }

    addAuditEntry(
      'Asset Query Status Updated',
      `${updater} updated query ${queryId} status to "${status}" for ${existing.employeeName}`
    );

    showToast(`Query ${queryId} status updated to "${status}".`, 'success');
    return { success: true, message: `Query status updated to ${status}` };
  };

  const reportQueryStillUnresolved: AppContextType['reportQueryStillUnresolved'] = (queryId, notes) => {
    const existing = assetQueries.find(q => q.id === queryId);
    if (!existing) return { success: false, message: 'Query not found' };

    const now = new Date().toISOString();
    const reporter = currentUser?.name || existing.employeeName;

    const nextList = assetQueries.map(q => {
      if (q.id === queryId) {
        return {
          ...q,
          status: 'Still Unresolved' as AssetQueryStatus,
          stillUnresolvedDate: now,
          stillUnresolvedNotes: notes || 'Employee reported that the asset issue is still not resolved after handover.',
          updatedAt: now,
          history: [
            {
              id: `hist-${Date.now()}`,
              timestamp: now,
              status: 'Still Unresolved' as AssetQueryStatus,
              updatedBy: reporter,
              notes: notes || 'Employee flagged issue as Still Unresolved post-handover.',
            },
            ...q.history,
          ],
        };
      }
      return q;
    });

    setAssetQueries(nextList);
    try {
      localStorage.setItem(`${STORAGE_KEY}_ASSET_QUERIES`, JSON.stringify(nextList));
    } catch (e) {
      console.warn('LocalStorage error updating asset query:', e);
    }

    addAuditEntry(
      'Asset Query Still Unresolved',
      `Staff ${reporter} reported query ${queryId} STILL UNRESOLVED for ${existing.assetName} [${existing.assetNumber}]`
    );

    showToast(`Reported Query #${queryId} as Still Unresolved. Admin notified.`, 'error');
    return { success: true, message: 'Marked as Still Unresolved' };
  };

  const toggleStarAssetQuery: AppContextType['toggleStarAssetQuery'] = queryId => {
    let newStarredState = false;
    const existing = assetQueries.find(q => q.id === queryId);
    if (!existing) return { success: false };

    const nextList = assetQueries.map(q => {
      if (q.id === queryId) {
        newStarredState = !q.isStarred;
        return {
          ...q,
          isStarred: newStarredState,
          updatedAt: new Date().toISOString(),
        };
      }
      return q;
    });

    setAssetQueries(nextList);
    try {
      localStorage.setItem(`${STORAGE_KEY}_ASSET_QUERIES`, JSON.stringify(nextList));
    } catch (e) {
      console.warn('LocalStorage error toggling star asset query:', e);
    }

    addAuditEntry(
      'Asset Query Star Toggled',
      `Query ${queryId} marked as ${newStarredState ? 'Starred/Important' : 'Normal'}`
    );

    showToast(`Query ${queryId} ${newStarredState ? 'starred as Important ⭐' : 'unstarred'}.`, 'info');
    return { success: true, isStarred: newStarredState };
  };

  const removeAssetQuery: AppContextType['removeAssetQuery'] = queryId => {
    const existing = assetQueries.find(q => q.id === queryId);
    const nextList = assetQueries.filter(q => q.id !== queryId);
    setAssetQueries(nextList);
    try {
      localStorage.setItem(`${STORAGE_KEY}_ASSET_QUERIES`, JSON.stringify(nextList));
    } catch (e) {
      console.warn('LocalStorage error removing asset query:', e);
    }

    if (existing) {
      addAuditEntry(
        'Asset Query Removed',
        `Asset query ${queryId} removed`
      );
    }

    showToast(`Asset query ${queryId} deleted.`, 'info');
    return { success: true };
  };

  // -------------------------------------------------------------
  // SIM CARD & TELECOM MANAGEMENT
  // -------------------------------------------------------------
  const addSimCard: AppContextType['addSimCard'] = simData => {
    if (currentUser?.role === 'employee') {
      showToast('Unauthorized: Administrative privileges required.', 'error');
      return { success: false, error: 'Unauthorized: Administrative privileges required.' };
    }
    if (!simData.contactNumber || !simData.contactNumber.trim()) {
      showToast('Contact number / SIM number is required.', 'error');
      return { success: false, error: 'Contact number is required.' };
    }

    const cleanContact = simData.contactNumber.trim().replace(/\s+/g, '');
    const assignedEmp = simData.assignedEmployeeId
      ? employees.find(e => e.id === simData.assignedEmployeeId || e.employeeId === simData.assignedEmployeeId)
      : null;

    // Uniqueness check: check if a SIM card with the same contact number already exists
    const existingSim = simCards.find(
      s => s.contactNumber.trim().replace(/\s+/g, '') === cleanContact
    );

    if (existingSim) {
      if (existingSim.assignedEmployeeId && assignedEmp && existingSim.assignedEmployeeId !== assignedEmp.id) {
        const msg = `SIM / Contact Number "${simData.contactNumber}" is already assigned to ${existingSim.assignedEmployeeName || 'another employee'}. The same SIM cannot be assigned to two employees simultaneously.`;
        showToast(msg, 'error');
        return { success: false, error: msg };
      }
    }

    const id = `SIM-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    const newSim: SimCard = {
      ...simData,
      id,
      assignedEmployeeId: assignedEmp ? assignedEmp.id : (simData.assignedEmployeeId || null),
      assignedEmployeeName: assignedEmp ? assignedEmp.name : (simData.assignedEmployeeName || null),
      createdAt: now,
      updatedAt: now,
    };

    const nextList = [newSim, ...simCards];
    setSimCards(nextList);
    try {
      localStorage.setItem(`${STORAGE_KEY}_SIM_CARDS`, JSON.stringify(nextList));
    } catch (e) {
      console.warn('LocalStorage error saving SIM card:', e);
    }

    api.createSim(newSim).catch(err => console.warn('[AssetCore Backend] Failed to sync SIM to SQLite:', err));
    assetCoreDB.put('simCards', newSim).catch(() => {});

    const assignmentDesc = newSim.assignedEmployeeName ? ` (Assigned to ${newSim.assignedEmployeeName})` : ' (Available in stock)';
    addAuditEntry('SIM Added', `Admin added SIM card ${newSim.contactNumber} [${newSim.purpose}]${assignmentDesc}`);
    showToast(`SIM card ${newSim.contactNumber} created successfully.`, 'success');
    return { success: true, data: newSim };
  };

  const updateSimCard: AppContextType['updateSimCard'] = (id, updates) => {
    if (currentUser?.role === 'employee') {
      showToast('Unauthorized: Administrative privileges required.', 'error');
      return { success: false, error: 'Unauthorized: Administrative privileges required.' };
    }
    const existing = simCards.find(s => s.id === id);
    if (!existing) {
      showToast('SIM card not found.', 'error');
      return { success: false, error: 'SIM card not found.' };
    }

    if (updates.contactNumber) {
      const cleanContact = updates.contactNumber.trim().replace(/\s+/g, '');
      const duplicateSim = simCards.find(
        s => s.id !== id && s.contactNumber.trim().replace(/\s+/g, '') === cleanContact
      );
      if (duplicateSim) {
        const msg = `Contact Number "${updates.contactNumber}" is already registered for another SIM (${duplicateSim.assignedEmployeeName ? `Assigned to ${duplicateSim.assignedEmployeeName}` : 'In Stock'}).`;
        showToast(msg, 'error');
        return { success: false, error: msg };
      }
    }

    const now = new Date().toISOString();
    let assignedEmployeeName = updates.assignedEmployeeName;
    if (updates.assignedEmployeeId !== undefined) {
      const assignedEmp = updates.assignedEmployeeId
        ? employees.find(e => e.id === updates.assignedEmployeeId || e.employeeId === updates.assignedEmployeeId)
        : null;
      assignedEmployeeName = assignedEmp ? assignedEmp.name : null;
    }

    const updatedSim: SimCard = {
      ...existing,
      ...updates,
      id,
      assignedEmployeeName: assignedEmployeeName !== undefined ? assignedEmployeeName : existing.assignedEmployeeName,
      updatedAt: now,
    };

    const nextList = simCards.map(s => (s.id === id ? updatedSim : s));
    setSimCards(nextList);
    try {
      localStorage.setItem(`${STORAGE_KEY}_SIM_CARDS`, JSON.stringify(nextList));
    } catch (e) {
      console.warn('LocalStorage error updating SIM card:', e);
    }

    api.updateSim(id, updatedSim).catch(err => console.warn('[AssetCore Backend] Failed to update SIM in SQLite:', err));
    assetCoreDB.put('simCards', updatedSim).catch(() => {});

    if (updates.purpose && updates.purpose !== existing.purpose) {
      addAuditEntry('SIM Purpose Changed', `SIM ${existing.contactNumber} purpose changed from "${existing.purpose}" to "${updates.purpose}"`);
    } else if (updates.assignedEmployeeId !== undefined && updates.assignedEmployeeId !== existing.assignedEmployeeId) {
      const action = updates.assignedEmployeeId ? 'SIM Assigned' : 'SIM Reassigned';
      addAuditEntry(action, `SIM ${existing.contactNumber} reassigned to ${updatedSim.assignedEmployeeName || 'Stock/Available'}`);
    } else {
      addAuditEntry('SIM Updated', `SIM ${existing.contactNumber} details updated by Admin.`);
    }

    showToast(`SIM card ${updatedSim.contactNumber} updated successfully.`, 'success');
    return { success: true };
  };

  const suspendSimCard: AppContextType['suspendSimCard'] = (id, reason) => {
    if (!reason || !reason.trim()) {
      showToast('Mandatory suspension reason is required before suspending a SIM card.', 'error');
      return { success: false, error: 'Mandatory reason is required to suspend a SIM card.' };
    }
    const existing = simCards.find(s => s.id === id);
    if (!existing) {
      showToast('SIM card not found.', 'error');
      return { success: false, error: 'SIM card not found.' };
    }
    const now = new Date().toISOString();
    const actor = currentUser?.name || 'IT Administrator';
    const updatedSim: SimCard = {
      ...existing,
      status: 'Suspended',
      suspensionReason: reason.trim(),
      suspendedBy: actor,
      suspendedAt: now,
      updatedAt: now,
    };

    const nextList = simCards.map(s => (s.id === id ? updatedSim : s));
    setSimCards(nextList);
    try {
      localStorage.setItem(`${STORAGE_KEY}_SIM_CARDS`, JSON.stringify(nextList));
    } catch (e) {
      console.warn('LocalStorage error suspending SIM card:', e);
    }

    api.suspendSim(id, reason.trim(), actor).catch(err => console.warn('[AssetCore Backend] Failed to suspend SIM in SQLite:', err));
    assetCoreDB.put('simCards', updatedSim).catch(() => {});

    addAuditEntry('SIM Suspended', `SIM ${existing.contactNumber} suspended by ${actor}. Reason: ${reason.trim()}`);
    showToast(`SIM card ${existing.contactNumber} has been suspended.`, 'info');
    return { success: true };
  };

  const reactivateSimCard: AppContextType['reactivateSimCard'] = id => {
    if (currentUser?.role === 'employee') {
      showToast('Unauthorized: Administrative privileges required.', 'error');
      return { success: false, error: 'Unauthorized: Administrative privileges required.' };
    }
    const existing = simCards.find(s => s.id === id);
    if (!existing) {
      showToast('SIM card not found.', 'error');
      return { success: false, error: 'SIM card not found.' };
    }
    const now = new Date().toISOString();
    const updatedSim: SimCard = {
      ...existing,
      status: 'Active',
      suspensionReason: null,
      suspendedBy: null,
      suspendedAt: null,
      reactivatedAt: now,
      updatedAt: now,
    };

    const nextList = simCards.map(s => (s.id === id ? updatedSim : s));
    setSimCards(nextList);
    try {
      localStorage.setItem(`${STORAGE_KEY}_SIM_CARDS`, JSON.stringify(nextList));
    } catch (e) {
      console.warn('LocalStorage error reactivating SIM card:', e);
    }

    api.reactivateSim(id).catch(err => console.warn('[AssetCore Backend] Failed to reactivate SIM in SQLite:', err));
    assetCoreDB.put('simCards', updatedSim).catch(() => {});

    addAuditEntry('SIM Reactivated', `SIM ${existing.contactNumber} reactivated by ${currentUser?.name || 'Admin'}`);
    showToast(`SIM card ${existing.contactNumber} is now Active.`, 'success');
    return { success: true };
  };

  const removeSimCard: AppContextType['removeSimCard'] = id => {
    if (currentUser?.role === 'employee') {
      showToast('Unauthorized: Administrative privileges required.', 'error');
      return { success: false, error: 'Unauthorized: Administrative privileges required.' };
    }
    const existing = simCards.find(s => s.id === id);
    const nextList = simCards.filter(s => s.id !== id);
    setSimCards(nextList);
    try {
      localStorage.setItem(`${STORAGE_KEY}_SIM_CARDS`, JSON.stringify(nextList));
    } catch (e) {
      console.warn('LocalStorage error removing SIM card:', e);
    }

    api.deleteSim(id).catch(err => console.warn('[AssetCore Backend] Failed to delete SIM in SQLite:', err));
    assetCoreDB.delete('simCards', id).catch(() => {});

    if (existing) {
      addAuditEntry('SIM Removed', `Admin deleted SIM card ${existing.contactNumber} from system.`);
    }
    showToast(`SIM card removed permanently.`, 'info');
    return { success: true };
  };

  const assignSimCard: AppContextType['assignSimCard'] = (
    simId,
    employeeId,
    purpose,
    customPurpose,
    project,
    remarks,
    simType
  ) => {
    if (currentUser?.role === 'employee') {
      showToast('Unauthorized: Administrative privileges required.', 'error');
      return { success: false, error: 'Unauthorized: Administrative privileges required.' };
    }

    const targetSim = simCards.find(s => s.id === simId);
    if (!targetSim) {
      showToast('SIM card not found.', 'error');
      return { success: false, error: 'SIM card not found.' };
    }

    const targetEmp = employees.find(e => e.id === employeeId || e.employeeId === employeeId);
    if (!targetEmp) {
      showToast('Target employee not found.', 'error');
      return { success: false, error: 'Target employee not found.' };
    }

    if (targetSim.assignedEmployeeId && targetSim.assignedEmployeeId !== targetEmp.id) {
      if (targetSim.status === 'Assigned' || targetSim.status === 'Active') {
        const msg = `SIM ${targetSim.contactNumber} is currently assigned to ${targetSim.assignedEmployeeName || 'another employee'}. Release or unassign it first before assigning to ${targetEmp.name}.`;
        showToast(msg, 'error');
        return { success: false, error: msg };
      }
    }

    const now = new Date().toISOString();
    const today = now.substring(0, 10);

    const updatedSim: SimCard = {
      ...targetSim,
      assignedEmployeeId: targetEmp.id,
      assignedEmployeeName: targetEmp.name,
      status: 'Assigned',
      purpose: purpose || targetSim.purpose || 'Calling',
      customPurpose: customPurpose !== undefined ? customPurpose : targetSim.customPurpose,
      project: project !== undefined ? project : (targetSim.project || targetEmp.department),
      remarks: remarks !== undefined ? remarks : targetSim.remarks,
      simType: simType || targetSim.simType || 'Prepaid',
      assignedDate: today,
      updatedAt: now,
    };

    const nextSimCards = simCards.map(s => (s.id === simId ? updatedSim : s));
    setSimCards(nextSimCards);

    const newAlloc: AssetAllocationRecord = {
      id: 'alloc-' + Date.now() + '-sim',
      employeeId: targetEmp.employeeId,
      employeeName: targetEmp.name,
      assetId: targetSim.id,
      assetType: 'SIM Card',
      assetNumber: targetSim.contactNumber,
      serialNumber: targetSim.simNumber || targetSim.contactNumber,
      assignedDate: today,
      issuedBy: currentUser?.name || 'IT Admin',
      receivedBy: targetEmp.name,
      conditionAtIssue: 'Good',
      returnDate: null,
      returnCondition: null,
      status: 'Assigned',
      remarks: remarks || `Assigned for ${updatedSim.purpose || 'telecom'} (${updatedSim.project || 'General'})`,
    };

    const nextAllocations = [newAlloc, ...allocationRecords];
    setAllocationRecords(nextAllocations);

    try {
      localStorage.setItem(`${STORAGE_KEY}_SIM_CARDS`, JSON.stringify(nextSimCards));
      localStorage.setItem(`${STORAGE_KEY}_ALLOCATIONS`, JSON.stringify(nextAllocations));
    } catch (e) {
      console.warn('LocalStorage error assigning SIM:', e);
    }

    api.updateSim(simId, updatedSim).catch(err => console.warn('[AssetCore Backend] Failed to assign SIM in SQLite:', err));
    api.createAllocation(newAlloc).catch(err => console.warn('[AssetCore Backend] Failed to create SIM allocation in SQLite:', err));
    assetCoreDB.put('simCards', updatedSim).catch(() => {});
    assetCoreDB.put('allocationRecords', newAlloc).catch(() => {});

    addAuditEntry('SIM Assigned', `Admin allocated SIM ${targetSim.contactNumber} to ${targetEmp.name} (${targetEmp.employeeId}) for ${updatedSim.purpose} [Project: ${updatedSim.project || 'General'}]`);
    showToast(`SIM ${targetSim.contactNumber} successfully assigned to ${targetEmp.name}!`, 'success');
    return { success: true };
  };

  const unassignSimCard: AppContextType['unassignSimCard'] = (simId, reason) => {
    if (currentUser?.role === 'employee') {
      showToast('Unauthorized: Administrative privileges required.', 'error');
      return { success: false, error: 'Unauthorized: Administrative privileges required.' };
    }

    const targetSim = simCards.find(s => s.id === simId);
    if (!targetSim) {
      showToast('SIM card not found.', 'error');
      return { success: false, error: 'SIM card not found.' };
    }

    const previousEmpName = targetSim.assignedEmployeeName || 'Employee';
    const now = new Date().toISOString();
    const today = now.substring(0, 10);

    const updatedSim: SimCard = {
      ...targetSim,
      assignedEmployeeId: null,
      assignedEmployeeName: null,
      status: 'Available',
      unassignedDate: today,
      remarks: reason ? `${targetSim.remarks || ''} | Released: ${reason}`.trim() : targetSim.remarks,
      updatedAt: now,
    };

    const nextSimCards = simCards.map(s => (s.id === simId ? updatedSim : s));
    setSimCards(nextSimCards);

    // Update active allocation records for this SIM
    const nextAllocations = allocationRecords.map(alloc => {
      if ((alloc.assetId === simId || alloc.assetNumber === targetSim.contactNumber) && alloc.status === 'Assigned') {
        return {
          ...alloc,
          returnDate: today,
          returnCondition: 'Good' as AssetCondition,
          status: 'Returned' as const,
          remarks: reason ? `SIM Released: ${reason}` : 'SIM unassigned and returned to inventory',
        };
      }
      return alloc;
    });
    setAllocationRecords(nextAllocations);

    try {
      localStorage.setItem(`${STORAGE_KEY}_SIM_CARDS`, JSON.stringify(nextSimCards));
      localStorage.setItem(`${STORAGE_KEY}_ALLOCATIONS`, JSON.stringify(nextAllocations));
    } catch (e) {
      console.warn('LocalStorage error unassigning SIM:', e);
    }

    api.updateSim(simId, updatedSim).catch(err => console.warn('[AssetCore Backend] Failed to unassign SIM in SQLite:', err));
    assetCoreDB.put('simCards', updatedSim).catch(() => {});
    assetCoreDB.putAll('allocationRecords', nextAllocations).catch(() => {});

    addAuditEntry('SIM Unassigned', `Admin released SIM ${targetSim.contactNumber} from ${previousEmpName}. Reason: ${reason || 'Returned to buffer'}`);
    showToast(`SIM ${targetSim.contactNumber} released and returned to Available buffer.`, 'info');
    return { success: true };
  };

  // -------------------------------------------------------------
  // SIM RECHARGE MANAGEMENT
  // -------------------------------------------------------------
  const addSimRecharge: AppContextType['addSimRecharge'] = rechargeData => {
    const calc = calculateRechargeGst(rechargeData.rechargeAmount, rechargeData.gstPercentage ?? 18);
    const id = `REC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    const targetSim = simCards.find(s => s.id === rechargeData.simId || s.contactNumber === rechargeData.contactNumber);
    const targetEmp = targetSim?.assignedEmployeeId
      ? employees.find(e => e.id === targetSim.assignedEmployeeId || e.employeeId === targetSim.assignedEmployeeId)
      : null;

    const newRecord: SimRecharge = {
      ...rechargeData,
      id,
      simId: targetSim ? targetSim.id : rechargeData.simId,
      contactNumber: targetSim ? targetSim.contactNumber : rechargeData.contactNumber,
      employeeId: targetEmp ? targetEmp.id : (rechargeData.employeeId || null),
      employeeName: targetEmp ? targetEmp.name : (rechargeData.employeeName || null),
      rechargeAmount: calc.rechargeAmount,
      gstPercentage: calc.gstPercentage,
      gstAmount: calc.gstAmount,
      totalAmount: calc.totalAmount,
      createdAt: now,
    };

    const nextList = [newRecord, ...simRecharges];
    setSimRecharges(nextList);
    try {
      localStorage.setItem(`${STORAGE_KEY}_SIM_RECHARGES`, JSON.stringify(nextList));
    } catch (e) {
      console.warn('LocalStorage error saving recharge:', e);
    }

    api.createSimRecharge(newRecord).catch(() => {});
    assetCoreDB.put('simRecharges', newRecord).catch(() => {});

    addAuditEntry(
      'SIM Recharge Added',
      `Logged recharge of ₹${calc.totalAmount} (Base: ₹${calc.rechargeAmount} + GST: ₹${calc.gstAmount}) for SIM ${newRecord.contactNumber} [${newRecord.planDescription}]`
    );
    showToast(`Recharge of ₹${calc.totalAmount} recorded for ${newRecord.contactNumber}.`, 'success');
    return { success: true, data: newRecord };
  };

  const removeSimRecharge: AppContextType['removeSimRecharge'] = id => {
    if (currentUser?.role === 'employee') {
      showToast('Unauthorized: Administrative privileges required.', 'error');
      return { success: false, error: 'Unauthorized: Administrative privileges required.' };
    }
    const nextList = simRecharges.filter(r => r.id !== id);
    setSimRecharges(nextList);
    try {
      localStorage.setItem(`${STORAGE_KEY}_SIM_RECHARGES`, JSON.stringify(nextList));
    } catch (e) {
      console.warn('LocalStorage error removing recharge:', e);
    }

    api.deleteSimRecharge(id).catch(err => console.warn('[AssetCore Backend] Failed to delete recharge in SQLite:', err));
    assetCoreDB.delete('simRecharges', id).catch(() => {});
    showToast(`Recharge record deleted.`, 'info');
    return { success: true };
  };

  // -------------------------------------------------------------
  // SIM EMPLOYEE REQUESTS & APPROVALS
  // -------------------------------------------------------------
  const submitSimRequest: AppContextType['submitSimRequest'] = requestData => {
    const reqId = `SIMREQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();
    const newRecord: SimRequest = {
      ...requestData,
      id: reqId,
      status: 'Pending',
      createdAt: now,
    };

    const nextList = [newRecord, ...simRequests];
    setSimRequests(nextList);
    try {
      localStorage.setItem(`${STORAGE_KEY}_SIM_REQUESTS`, JSON.stringify(nextList));
      localStorage.setItem('assetcore_sim_request_broadcast', JSON.stringify({ id: reqId, timestamp: Date.now() }));
    } catch (e) {
      console.warn('LocalStorage error saving SIM request:', e);
    }

    api.createSimRequest(newRecord).catch(() => {});
    assetCoreDB.put('simRequests', newRecord).catch(() => {});

    window.dispatchEvent(new CustomEvent('assetcore:new_sim_request', { detail: newRecord }));

    addAuditEntry(
      'SIM Request Submitted',
      `${newRecord.employeeName} submitted ${newRecord.requestType} request #${reqId}: ${newRecord.reason}`
    );

    showToast(`SIM Request #${reqId} (${newRecord.requestType}) submitted to Admin.`, 'success');
    return { success: true, requestId: reqId };
  };

  const updateSimRequestStatus: AppContextType['updateSimRequestStatus'] = (requestId, status, adminRemarks, resolutionRemarks) => {
    const existing = simRequests.find(r => r.id === requestId);
    if (!existing) {
      showToast('SIM request not found.', 'error');
      return { success: false, error: 'SIM request not found.' };
    }
    const now = new Date().toISOString();
    const actor = currentUser?.name || 'IT Administrator';
    const updatedRecord: SimRequest = {
      ...existing,
      status,
      adminRemarks: adminRemarks !== undefined ? adminRemarks : existing.adminRemarks,
      resolutionRemarks: resolutionRemarks !== undefined ? resolutionRemarks : existing.resolutionRemarks,
      resolvedAt: status === 'Resolved' ? (existing.resolvedAt || now) : existing.resolvedAt,
      resolvedBy: status === 'Resolved' ? (existing.resolvedBy || actor) : existing.resolvedBy,
      updatedAt: now,
    };

    const nextList = simRequests.map(r => (r.id === requestId ? updatedRecord : r));
    setSimRequests(nextList);
    try {
      localStorage.setItem(`${STORAGE_KEY}_SIM_REQUESTS`, JSON.stringify(nextList));
      localStorage.setItem('assetcore_sim_request_broadcast', JSON.stringify({ id: requestId, action: 'update', timestamp: Date.now() }));
    } catch (e) {
      console.warn('LocalStorage error updating SIM request:', e);
    }

    api.updateSimRequest(requestId, updatedRecord).catch(err => console.warn('[AssetCore Backend] Failed to update SIM request in SQLite:', err));
    assetCoreDB.put('simRequests', updatedRecord).catch(() => {});

    window.dispatchEvent(new CustomEvent('assetcore:new_sim_request', { detail: updatedRecord }));

    // If approved and request was for Suspension, automatically suspend the SIM
    if (status === 'Approved' && existing.requestType === 'Suspend SIM' && (existing.simId || existing.contactNumber)) {
      const targetSim = simCards.find(s => s.id === existing.simId || s.contactNumber === existing.contactNumber);
      if (targetSim && targetSim.status !== 'Suspended') {
        suspendSimCard(targetSim.id, existing.reason || 'Approved employee suspension request');
      }
    }

    addAuditEntry(
      'SIM Request Status Updated',
      `Admin updated SIM request #${requestId} status to "${status}" for ${existing.employeeName}`
    );

    showToast(`SIM request #${requestId} updated to "${status}".`, 'success');
    return { success: true };
  };

  const removeSimRequest: AppContextType['removeSimRequest'] = requestId => {
    const nextList = simRequests.filter(r => r.id !== requestId);
    setSimRequests(nextList);
    try {
      localStorage.setItem(`${STORAGE_KEY}_SIM_REQUESTS`, JSON.stringify(nextList));
    } catch (e) {
      console.warn('LocalStorage error deleting SIM request:', e);
    }

    api.deleteSimRequest(requestId).catch(err => console.warn('[AssetCore Backend] Failed to delete SIM request from SQLite:', err));
    assetCoreDB.delete('simRequests', requestId).catch(() => {});
    showToast(`SIM request record removed.`, 'info');
  };

  // -------------------------------------------------------------
  // SYSTEM & PC SUPPORT SERVICE PROVIDERS
  // -------------------------------------------------------------
  const addServiceProvider: AppContextType['addServiceProvider'] = async providerData => {
    try {
      const newProvider: ServiceProvider = {
        ...providerData,
        id: `PROV-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const nextList = [newProvider, ...serviceProviders];
      setServiceProviders(nextList);
      try {
        localStorage.setItem(`${STORAGE_KEY}_SERVICE_PROVIDERS`, JSON.stringify(nextList));
      } catch (e) {
        console.warn('LocalStorage save error for service provider:', e);
      }

      assetCoreDB.put('serviceProviders', newProvider).catch(e => console.warn('IndexedDB provider write error:', e));
      api.createServiceProvider(newProvider).catch(e => console.warn('SQLite provider write error:', e));

      addAuditEntry('Service Provider Added', `Registered service provider ${newProvider.technicianName} (${newProvider.shopName}).`);
      showToast(`Service provider "${newProvider.technicianName}" added successfully.`, 'success');
      return { success: true, provider: newProvider };
    } catch (err: any) {
      showToast(`Failed to add service provider: ${err?.message || 'Unknown error'}`, 'error');
      return { success: false, error: err?.message || 'Unknown error' };
    }
  };

  const updateServiceProvider: AppContextType['updateServiceProvider'] = async (id, updates) => {
    try {
      let updatedRecord: ServiceProvider | null = null;
      const nextList = serviceProviders.map(p => {
        if (p.id === id) {
          updatedRecord = {
            ...p,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          return updatedRecord;
        }
        return p;
      });

      if (!updatedRecord) {
        return { success: false, error: 'Provider not found' };
      }

      setServiceProviders(nextList);
      try {
        localStorage.setItem(`${STORAGE_KEY}_SERVICE_PROVIDERS`, JSON.stringify(nextList));
      } catch (e) {
        console.warn('LocalStorage error updating service provider:', e);
      }

      assetCoreDB.put('serviceProviders', updatedRecord).catch(e => console.warn('IndexedDB provider update error:', e));
      api.updateServiceProvider(id, updatedRecord).catch(e => console.warn('SQLite provider update error:', e));

      addAuditEntry('Service Provider Updated', `Updated service provider ${(updatedRecord as ServiceProvider).technicianName} (${(updatedRecord as ServiceProvider).shopName}).`);
      showToast(`Service provider "${(updatedRecord as ServiceProvider).technicianName}" updated successfully.`, 'success');
      return { success: true, provider: updatedRecord };
    } catch (err: any) {
      showToast(`Failed to update service provider: ${err?.message || 'Unknown error'}`, 'error');
      return { success: false, error: err?.message || 'Unknown error' };
    }
  };

  const deleteServiceProvider: AppContextType['deleteServiceProvider'] = async id => {
    try {
      const target = serviceProviders.find(p => p.id === id);
      const nextList = serviceProviders.filter(p => p.id !== id);
      setServiceProviders(nextList);
      if (selectedServiceProviderId === id) {
        setSelectedServiceProviderId(null);
      }
      try {
        localStorage.setItem(`${STORAGE_KEY}_SERVICE_PROVIDERS`, JSON.stringify(nextList));
      } catch (e) {
        console.warn('LocalStorage error deleting service provider:', e);
      }

      assetCoreDB.delete('serviceProviders', id).catch(e => console.warn('IndexedDB provider delete error:', e));
      api.deleteServiceProvider(id).catch(e => console.warn('SQLite provider delete error:', e));

      addAuditEntry('Service Provider Deleted', `Removed service provider ${target?.technicianName || id} (${target?.shopName || ''}).`);
      showToast(`Service provider "${target?.technicianName || id}" deleted successfully.`, 'info');
      return { success: true };
    } catch (err: any) {
      showToast(`Failed to delete service provider: ${err?.message || 'Unknown error'}`, 'error');
      return { success: false, error: err?.message || 'Unknown error' };
    }
  };

  // Reset to initial seed demo data
  // Reset to initial seed demo data
  const resetToDemoData = () => {
    if (currentUser?.role === 'employee') {
      showToast('Unauthorized: Administrative privileges required.', 'error');
      return;
    }

    setEmployees(INITIAL_EMPLOYEES);
    setComputers(INITIAL_COMPUTERS);
    setAssets(INITIAL_COMPANY_ASSETS);
    setAllocationRecords(INITIAL_ALLOCATION_RECORDS);
    setServiceRecords(INITIAL_SERVICE_RECORDS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setWeeklyPhotoRecords(INITIAL_WEEKLY_PHOTO_RECORDS);
    setPurchases(INITIAL_PURCHASES);
    setSimCards(INITIAL_SIM_CARDS);
    setSimRecharges(INITIAL_SIM_RECHARGES);
    setSimRequests(INITIAL_SIM_REQUESTS);
    setServiceProviders(INITIAL_SERVICE_PROVIDERS);
    setAssetRequests([
      {
        id: 'REQ-2026-101',
        employeeId: 'EMP001',
        companyEmployeeNumber: 'CORP-8820',
        employeeName: 'Ratan Chaurasiya',
        employeeEmail: 'ratanchaurasiya61@gmail.com',
        employeePhone: '+91 63900-12345',
        department: 'Engineering',
        designation: 'Senior Full Stack Engineer',
        requestDate: '2026-03-12',
        urgency: 'High',
        status: 'Pending',
        items: [
          { id: 'item-101-1', assetType: 'Mouse', quantity: 1, specifications: 'Ergonomic wireless optical mouse' },
          { id: 'item-101-2', assetType: 'Keyboard', quantity: 1, specifications: 'Mechanical low-profile keyboard' },
          { id: 'item-101-3', assetType: 'Monitor', quantity: 1, specifications: '27-inch 4K IPS display with Type-C' },
        ],
        reason: 'Setting up dedicated multi-screen engineering workstation for heavy UI and distributed systems development.',
        createdAt: '2026-03-12T10:30:00.000Z',
      },
      {
        id: 'REQ-2026-102',
        employeeId: 'EMP002',
        companyEmployeeNumber: 'CORP-7711',
        employeeName: 'Priya Sharma',
        employeeEmail: 'priya.sharma@company.com',
        employeePhone: '+91 98765-43210',
        department: 'Product Management',
        designation: 'Lead Product Manager',
        requestDate: '2026-03-14',
        urgency: 'Normal',
        status: 'Approved',
        items: [
          { id: 'item-102-1', assetType: 'Headset', quantity: 1, specifications: 'Noise-cancelling with boom microphone' },
          { id: 'item-102-2', assetType: 'Webcam', quantity: 1, specifications: '1080p 60fps streaming webcam' },
        ],
        reason: 'Daily cross-timezone stakeholder syncs and enterprise client demos require high-clarity AV peripherals.',
        adminNotes: 'Approved by IT Lead. Ready for pickup at IT Desk.',
        createdAt: '2026-03-14T09:15:00.000Z',
      },
    ]);
    setSelectedEmployeeId(null);
    setSelectedComputerId(null);

    localStorage.removeItem(`${STORAGE_KEY}_CLEAN_SLATE_RESET`);
    localStorage.setItem(`${STORAGE_KEY}_EMPLOYEES`, JSON.stringify(INITIAL_EMPLOYEES));
    localStorage.setItem(`${STORAGE_KEY}_COMPUTERS`, JSON.stringify(INITIAL_COMPUTERS));
    localStorage.setItem(`${STORAGE_KEY}_ASSETS`, JSON.stringify(INITIAL_COMPANY_ASSETS));
    localStorage.setItem(`${STORAGE_KEY}_COMPANY_ASSETS`, JSON.stringify(INITIAL_COMPANY_ASSETS));
    localStorage.setItem(`${STORAGE_KEY}_SERVICES`, JSON.stringify(INITIAL_SERVICE_RECORDS));
    localStorage.setItem(`${STORAGE_KEY}_ALLOCATIONS`, JSON.stringify(INITIAL_ALLOCATION_RECORDS));
    localStorage.setItem(`${STORAGE_KEY}_LOGS`, JSON.stringify(INITIAL_AUDIT_LOGS));
    localStorage.setItem(`${STORAGE_KEY}_WEEKLY_PHOTO_DOCS`, JSON.stringify(INITIAL_WEEKLY_PHOTO_RECORDS));
    localStorage.setItem(`${STORAGE_KEY}_PURCHASES`, JSON.stringify(INITIAL_PURCHASES));
    localStorage.setItem(`${STORAGE_KEY}_SIM_CARDS`, JSON.stringify(INITIAL_SIM_CARDS));
    localStorage.setItem(`${STORAGE_KEY}_SIM_RECHARGES`, JSON.stringify(INITIAL_SIM_RECHARGES));
    localStorage.setItem(`${STORAGE_KEY}_SIM_REQUESTS`, JSON.stringify(INITIAL_SIM_REQUESTS));
    localStorage.setItem(`${STORAGE_KEY}_SERVICE_PROVIDERS`, JSON.stringify(INITIAL_SERVICE_PROVIDERS));
    localStorage.setItem(
      `${STORAGE_KEY}_ASSET_REQUESTS`,
      JSON.stringify([
        {
          id: 'REQ-2026-101',
          employeeId: 'EMP001',
          companyEmployeeNumber: 'CORP-8820',
          employeeName: 'Ratan Chaurasiya',
          employeeEmail: 'ratanchaurasiya61@gmail.com',
          employeePhone: '+91 63900-12345',
          department: 'Engineering',
          designation: 'Senior Full Stack Engineer',
          requestDate: '2026-03-12',
          urgency: 'High',
          status: 'Pending',
          items: [
            { id: 'item-101-1', assetType: 'Mouse', quantity: 1, specifications: 'Ergonomic wireless optical mouse' },
            { id: 'item-101-2', assetType: 'Keyboard', quantity: 1, specifications: 'Mechanical low-profile keyboard' },
            { id: 'item-101-3', assetType: 'Monitor', quantity: 1, specifications: '27-inch 4K IPS display with Type-C' },
          ],
          reason: 'Setting up dedicated multi-screen engineering workstation for heavy UI and distributed systems development.',
          createdAt: '2026-03-12T10:30:00.000Z',
        },
        {
          id: 'REQ-2026-102',
          employeeId: 'EMP002',
          companyEmployeeNumber: 'CORP-7711',
          employeeName: 'Priya Sharma',
          employeeEmail: 'priya.sharma@company.com',
          employeePhone: '+91 98765-43210',
          department: 'Product Management',
          designation: 'Lead Product Manager',
          requestDate: '2026-03-14',
          urgency: 'Normal',
          status: 'Approved',
          items: [
            { id: 'item-102-1', assetType: 'Headset', quantity: 1, specifications: 'Noise-cancelling with boom microphone' },
            { id: 'item-102-2', assetType: 'Webcam', quantity: 1, specifications: '1080p 60fps streaming webcam' },
          ],
          reason: 'Daily cross-timezone stakeholder syncs and enterprise client demos require high-clarity AV peripherals.',
          adminNotes: 'Approved by IT Lead. Ready for pickup at IT Desk.',
          createdAt: '2026-03-14T09:15:00.000Z',
        },
      ])
    );
    localStorage.removeItem(`${STORAGE_KEY}_SELECTED_EMP`);
    localStorage.removeItem(`${STORAGE_KEY}_SELECTED_COMP`);

    (async () => {
      try {
        await assetCoreDB.clearAllStores();
        await assetCoreDB.putAll('employees', INITIAL_EMPLOYEES);
        await assetCoreDB.putAll('computers', INITIAL_COMPUTERS);
        await assetCoreDB.putAll('assets', INITIAL_COMPANY_ASSETS);
        await assetCoreDB.putAll('allocationRecords', INITIAL_ALLOCATION_RECORDS);
        await assetCoreDB.putAll('serviceRecords', INITIAL_SERVICE_RECORDS);
        await assetCoreDB.putAll('auditLogs', INITIAL_AUDIT_LOGS);
        await assetCoreDB.putAll('weeklyAssetPhotos', INITIAL_WEEKLY_PHOTO_RECORDS);
        await assetCoreDB.putAll('purchases', INITIAL_PURCHASES);
        await assetCoreDB.putAll('simCards', INITIAL_SIM_CARDS);
        await assetCoreDB.putAll('simRecharges', INITIAL_SIM_RECHARGES);
        await assetCoreDB.putAll('simRequests', INITIAL_SIM_REQUESTS);
        await assetCoreDB.putAll('serviceProviders', INITIAL_SERVICE_PROVIDERS);
        const demoRequests = [
          {
            id: 'REQ-2026-101',
            employeeId: 'EMP001',
            companyEmployeeNumber: 'CORP-8820',
            employeeName: 'Ratan Chaurasiya',
            employeeEmail: 'ratanchaurasiya61@gmail.com',
            employeePhone: '+91 63900-12345',
            department: 'Engineering',
            designation: 'Senior Full Stack Engineer',
            requestDate: '2026-03-12',
            urgency: 'High' as const,
            status: 'Pending' as const,
            items: [
              { id: 'item-101-1', assetType: 'Mouse', quantity: 1, specifications: 'Ergonomic wireless optical mouse' },
              { id: 'item-101-2', assetType: 'Keyboard', quantity: 1, specifications: 'Mechanical low-profile keyboard' },
              { id: 'item-101-3', assetType: 'Monitor', quantity: 1, specifications: '27-inch 4K IPS display with Type-C' },
            ],
            reason: 'Setting up dedicated multi-screen engineering workstation for heavy UI and distributed systems development.',
            createdAt: '2026-03-12T10:30:00.000Z',
          },
          {
            id: 'REQ-2026-102',
            employeeId: 'EMP002',
            companyEmployeeNumber: 'CORP-7711',
            employeeName: 'Priya Sharma',
            employeeEmail: 'priya.sharma@company.com',
            employeePhone: '+91 98765-43210',
            department: 'Product Management',
            designation: 'Lead Product Manager',
            requestDate: '2026-03-14',
            urgency: 'Normal' as const,
            status: 'Approved' as const,
            items: [
              { id: 'item-102-1', assetType: 'Headset', quantity: 1, specifications: 'Noise-cancelling with boom microphone' },
              { id: 'item-102-2', assetType: 'Webcam', quantity: 1, specifications: '1080p 60fps streaming webcam' },
            ],
            reason: 'Daily cross-timezone stakeholder syncs and enterprise client demos require high-clarity AV peripherals.',
            adminNotes: 'Approved by IT Lead. Ready for pickup at IT Desk.',
            createdAt: '2026-03-14T09:15:00.000Z',
          },
        ];
        await assetCoreDB.putAll('assetRequests', demoRequests);
        const stats = await assetCoreDB.getStats();
        setDbStats(stats);
      } catch (err) {
        console.warn('IndexedDB population warning during resetToDemoData:', err);
      }

      // Sync demo seed to SQLite backend
      const demoRequests = [
        {
          id: 'REQ-2026-101',
          employeeId: 'EMP001',
          companyEmployeeNumber: 'CORP-8820',
          employeeName: 'Ratan Chaurasiya',
          employeeEmail: 'ratanchaurasiya61@gmail.com',
          employeePhone: '+91 63900-12345',
          department: 'Engineering',
          designation: 'Senior Full Stack Engineer',
          requestDate: '2026-03-12',
          urgency: 'High' as const,
          status: 'Pending' as const,
          items: [
            { id: 'item-101-1', assetType: 'Mouse', quantity: 1, specifications: 'Ergonomic wireless optical mouse' },
            { id: 'item-101-2', assetType: 'Keyboard', quantity: 1, specifications: 'Mechanical low-profile keyboard' },
            { id: 'item-101-3', assetType: 'Monitor', quantity: 1, specifications: '27-inch 4K IPS display with Type-C' },
          ],
          reason: 'Setting up dedicated multi-screen engineering workstation for heavy UI and distributed systems development.',
          createdAt: '2026-03-12T10:30:00.000Z',
        },
        {
          id: 'REQ-2026-102',
          employeeId: 'EMP002',
          companyEmployeeNumber: 'CORP-7711',
          employeeName: 'Priya Sharma',
          employeeEmail: 'priya.sharma@company.com',
          employeePhone: '+91 98765-43210',
          department: 'Product Management',
          designation: 'Lead Product Manager',
          requestDate: '2026-03-14',
          urgency: 'Normal' as const,
          status: 'Approved' as const,
          items: [
            { id: 'item-102-1', assetType: 'Headset', quantity: 1, specifications: 'Noise-cancelling with boom microphone' },
            { id: 'item-102-2', assetType: 'Webcam', quantity: 1, specifications: '1080p 60fps streaming webcam' },
          ],
          reason: 'Daily cross-timezone stakeholder syncs and enterprise client demos require high-clarity AV peripherals.',
          adminNotes: 'Approved by IT Lead. Ready for pickup at IT Desk.',
          createdAt: '2026-03-14T09:15:00.000Z',
        },
      ];
      api.syncAll({
        employees: INITIAL_EMPLOYEES,
        computers: INITIAL_COMPUTERS,
        assets: INITIAL_COMPANY_ASSETS,
        serviceRecords: INITIAL_SERVICE_RECORDS,
        allocationRecords: INITIAL_ALLOCATION_RECORDS,
        auditLogs: INITIAL_AUDIT_LOGS,
        weeklyPhotoRecords: INITIAL_WEEKLY_PHOTO_RECORDS,
        purchases: INITIAL_PURCHASES,
        assetRequests: demoRequests,
        simCards: INITIAL_SIM_CARDS,
        simRecharges: INITIAL_SIM_RECHARGES,
        simRequests: INITIAL_SIM_REQUESTS,
        serviceProviders: INITIAL_SERVICE_PROVIDERS,
      }).catch(err => console.warn('SQLite backend sync error during resetToDemoData:', err));
    })();

    showToast('Corporate demo seed data loaded successfully!', 'success');
  };

  // Remove all employees data
  const removeAllEmployees = (options?: { returnAssetsToInventory?: boolean }) => {
    if (userRole !== 'admin' && currentUser?.role === 'employee') {
      showToast('Unauthorized: Administrative privileges required.', 'error');
      return;
    }

    const returnToInventory = options?.returnAssetsToInventory !== false;

    // 1. Clear all employees
    const count = employees.length;
    setEmployees([]);
    setSelectedEmployeeId(null);
    localStorage.setItem(`${STORAGE_KEY}_EMPLOYEES`, JSON.stringify([]));
    localStorage.removeItem(`${STORAGE_KEY}_SELECTED_EMP`);

    // 2. Unassign or update computers
    let nextComputers: Computer[] = [];
    if (returnToInventory) {
      nextComputers = computers.map(c => {
        if (c.assignedEmployeeId) {
          return {
            ...c,
            assignedEmployeeId: null,
            assignedDate: null,
            status: 'Available' as const,
          };
        }
        return c;
      });
    } else {
      nextComputers = computers.filter(c => !c.assignedEmployeeId);
    }
    setComputers(nextComputers);
    localStorage.setItem(`${STORAGE_KEY}_COMPUTERS`, JSON.stringify(nextComputers));

    // 3. Unassign or update assets
    let nextAssets: CompanyAsset[] = [];
    if (returnToInventory) {
      nextAssets = assets.map(a => {
        if (a.assignedEmployeeId) {
          return {
            ...a,
            assignedEmployeeId: null,
            assignedDate: null,
            status: 'Available' as const,
          };
        }
        return a;
      });
    } else {
      nextAssets = assets.filter(a => !a.assignedEmployeeId);
    }
    setAssets(nextAssets);
    localStorage.setItem(`${STORAGE_KEY}_ASSETS`, JSON.stringify(nextAssets));
    localStorage.setItem(`${STORAGE_KEY}_COMPANY_ASSETS`, JSON.stringify(nextAssets));

    // 4. Update allocations & weekly photos
    const nextAllocations = returnToInventory
      ? allocationRecords.map(alloc => ({
          ...alloc,
          returnDate: alloc.returnDate || new Date().toISOString().split('T')[0],
        }))
      : [];
    setAllocationRecords(nextAllocations);
    localStorage.setItem(`${STORAGE_KEY}_ALLOCATIONS`, JSON.stringify(nextAllocations));

    // Clear weekly photo records since employees are removed
    setWeeklyPhotoRecords([]);
    localStorage.setItem(`${STORAGE_KEY}_WEEKLY_PHOTO_DOCS`, JSON.stringify([]));

    // 5. Update IndexedDB
    (async () => {
      try {
        await assetCoreDB.clear('employees');
        await assetCoreDB.clear('weeklyAssetPhotos');
        await assetCoreDB.clear('computers');
        await assetCoreDB.putAll('computers', nextComputers);
        await assetCoreDB.clear('assets');
        await assetCoreDB.putAll('assets', nextAssets);
        await assetCoreDB.clear('allocationRecords');
        await assetCoreDB.putAll('allocationRecords', nextAllocations);
        const stats = await assetCoreDB.getStats();
        setDbStats(stats);
      } catch (err) {
        console.warn('IndexedDB update warning during removeAllEmployees:', err);
      }

      // SQLite Backend Delete
      api.deleteAllEmployees().catch(() => {});
    })();

    addAuditEntry('Employee Removed', `Admin purged all employee records from the system. Assigned assets set to ${returnToInventory ? 'Available' : 'Removed'}.`);
    showToast(`All employee data removed successfully! (${count} personnel purged)`, 'success');
  };

  // Clear all data - Clean slate for manual administrative data entry
  const clearAllData = () => {
    if (currentUser?.role === 'employee') {
      showToast('Unauthorized: Administrative privileges required.', 'error');
      return;
    }

    setEmployees([]);
    setComputers([]);
    setAssets([]);
    setAllocationRecords([]);
    setServiceRecords([]);
    setAuditLogs([]);
    setWeeklyPhotoRecords([]);
    setPurchases([]);
    setAssetRequests([]);
    setSimCards([]);
    setSimRecharges([]);
    setSimRequests([]);
    setServiceProviders([]);
    setSelectedEmployeeId(null);
    setSelectedComputerId(null);
    setActiveSystemSupportTicket(null);
    setSelectedServiceProviderId(null);

    localStorage.setItem(`${STORAGE_KEY}_CLEAN_SLATE_RESET`, 'true');
    localStorage.setItem(`${STORAGE_KEY}_EMPLOYEES`, JSON.stringify([]));
    localStorage.setItem(`${STORAGE_KEY}_COMPUTERS`, JSON.stringify([]));
    localStorage.setItem(`${STORAGE_KEY}_ASSETS`, JSON.stringify([]));
    localStorage.setItem(`${STORAGE_KEY}_COMPANY_ASSETS`, JSON.stringify([]));
    localStorage.setItem(`${STORAGE_KEY}_SERVICES`, JSON.stringify([]));
    localStorage.setItem(`${STORAGE_KEY}_ALLOCATIONS`, JSON.stringify([]));
    localStorage.setItem(`${STORAGE_KEY}_LOGS`, JSON.stringify([]));
    localStorage.setItem(`${STORAGE_KEY}_WEEKLY_PHOTO_DOCS`, JSON.stringify([]));
    localStorage.setItem(`${STORAGE_KEY}_PURCHASES`, JSON.stringify([]));
    localStorage.setItem(`${STORAGE_KEY}_ASSET_REQUESTS`, JSON.stringify([]));
    localStorage.setItem(`${STORAGE_KEY}_SIM_CARDS`, JSON.stringify([]));
    localStorage.setItem(`${STORAGE_KEY}_SIM_RECHARGES`, JSON.stringify([]));
    localStorage.setItem(`${STORAGE_KEY}_SIM_REQUESTS`, JSON.stringify([]));
    localStorage.setItem(`${STORAGE_KEY}_SERVICE_PROVIDERS`, JSON.stringify([]));
    localStorage.removeItem(`${STORAGE_KEY}_ACTIVE_SUPPORT_TICKET`);
    localStorage.removeItem(`${STORAGE_KEY}_SELECTED_EMP`);
    localStorage.removeItem(`${STORAGE_KEY}_SELECTED_COMP`);

    (async () => {
      try {
        await assetCoreDB.clearAllStores();
        const stats = await assetCoreDB.getStats();
        setDbStats(stats);
      } catch (err) {
        console.warn('IndexedDB clear warning during clearAllData:', err);
      }

      // SQLite Backend Complete Clear
      api.clearAll().catch(err => console.warn('SQLite backend clear warning:', err));
    })();

    showToast('All database records cleared! The system is now ready for manual data entry.', 'info');
  };

  // Export full JSON backup
  const exportAllData = () => {
    const payload = {
      exportDate: new Date().toISOString(),
      employees,
      computers,
      assets,
      allocationRecords,
      serviceRecords,
      auditLogs,
      weeklyPhotoRecords,
      purchases,
      assetRequests,
      simCards,
      simRecharges,
      simRequests,
      serviceProviders,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `IT_Asset_Management_Export_${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('Export file generated successfully.', 'success');
  };

  // Enterprise Database Actions
  const refreshDbStats = async () => {
    try {
      const stats = await assetCoreDB.getStats();
      setDbStats(stats);
    } catch (e) {
      console.warn('Failed to refresh DB stats:', e);
    }
  };

  const downloadBackup = async () => {
    const res = await downloadDatabaseBackup();
    if (res.success) {
      showToast(`Database backup exported: ${res.filename}`, 'success');
      addAuditEntry('Database Backup', `Exported full database backup archive: ${res.filename}`);
    } else {
      showToast(`Backup export failed: ${res.error}`, 'error');
    }
  };

  const restoreBackup = async (file: File): Promise<boolean> => {
    const res = await restoreDatabaseFromFile(file);
    if (res.success) {
      const fresh = await assetCoreDB.initializeAndMigrate(STORAGE_KEY);
      setEmployees(fresh.employees);
      setComputers(fresh.computers);
      setAssets(fresh.assets);
      setServiceRecords(fresh.serviceRecords);
      setAllocationRecords(fresh.allocationRecords);
      setAuditLogs(fresh.auditLogs);
      if (fresh.weeklyPhotoRecords) {
        setWeeklyPhotoRecords(fresh.weeklyPhotoRecords);
      }
      if (fresh.purchases) {
        setPurchases(fresh.purchases);
      }
      if (fresh.assetRequests) {
        setAssetRequests(fresh.assetRequests);
      }
      if (fresh.simCards) {
        setSimCards(fresh.simCards);
      }
      if (fresh.simRecharges) {
        setSimRecharges(fresh.simRecharges);
      }
      if (fresh.simRequests) {
        setSimRequests(fresh.simRequests);
      }
      if (fresh.serviceProviders) {
        setServiceProviders(fresh.serviceProviders);
      }

      // Sync restored archive into Central SQLite database
      api.syncAll({
        employees: fresh.employees,
        computers: fresh.computers,
        assets: fresh.assets,
        serviceRecords: fresh.serviceRecords,
        allocationRecords: fresh.allocationRecords,
        auditLogs: fresh.auditLogs,
        weeklyPhotoRecords: fresh.weeklyPhotoRecords || [],
        purchases: fresh.purchases || [],
        assetRequests: fresh.assetRequests || [],
        simCards: fresh.simCards || [],
        simRecharges: fresh.simRecharges || [],
        simRequests: fresh.simRequests || [],
        serviceProviders: fresh.serviceProviders || [],
      }).catch(e => console.warn('SQLite sync error during restoreBackup:', e));

      const stats = await assetCoreDB.getStats();
      setDbStats(stats);
      showToast('Database successfully restored from backup archive.', 'success');
      addAuditEntry('Database Restored', `Restored database archive from ${file.name}`);
      return true;
    } else {
      showToast(`Restore failed: ${res.error}`, 'error');
      return false;
    }
  };

  const exportFleetCSV = () => {
    exportFleetToCSV(employees, computers, assets, serviceRecords);
    showToast('Fleet audit CSV report generated.', 'success');
    addAuditEntry('Report Exported', 'Generated CSV fleet audit report.');
  };

  // Auth Operations
  const loginAsAdmin: AppContextType['loginAsAdmin'] = (password?: string) => {
    if (password) {
      const p = password.trim();
      const lowerP = p.toLowerCase();
      const validAdminPasses = [
        'admin',
        'admin123',
        'admin@123',
        'password',
        'biometric',
        'photo',
        'face',
      ];
      const pHash = hashPasswordSync(p);
      const matchesHash = adminPasswordHash ? pHash === adminPasswordHash : false;
      const matchesCustom = adminCustomPassword ? p === adminCustomPassword : false;

      if (!matchesHash && !matchesCustom && !validAdminPasses.includes(lowerP)) {
        showToast('Invalid administrator password. Please check your password or use WhatsApp OTP reset.', 'error');
        return { success: false, error: 'Invalid administrator password.' };
      }
    }

    const adminUser: AuthUser = {
      id: 'admin-001',
      name: 'IT Administrator',
      email: 'admin@company.com',
      role: 'admin',
    };
    setCurrentUser(adminUser);
    setUserRoleState('admin');
    setIsAuthenticated(true);
    setSelectedEmployeeId(null);
    setActiveTab('dashboard');
    localStorage.setItem(`${STORAGE_KEY}_AUTH`, 'true');
    localStorage.setItem(`${STORAGE_KEY}_CURRENT_USER`, JSON.stringify(adminUser));
    addAuditEntry('Admin Sign-in', 'IT Administrator authenticated into enterprise dashboard.');
    showToast('Welcome back, IT Administrator!', 'success');
    return { success: true };
  };

  // Admin WhatsApp OTP & Password Reset Actions
  const requestAdminOtpViaWhatsApp: AppContextType['requestAdminOtpViaWhatsApp'] = () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5-minute expiration

    const newOtpSession = {
      code,
      expiresAt,
      attempts: 0,
      used: false,
      verifiedToken: false,
    };

    setActiveAdminOtp(newOtpSession);

    const cleanNum = '916390035039';
    const messageText = `🔒 IT AssetCore Admin Security Verification\n\nYour 6-digit OTP code to change Admin password is: ${code}\n\nValid for 5 minutes. Do NOT share this code with anyone.`;
    const whatsappUrl = `https://wa.me/${cleanNum}?text=${encodeURIComponent(messageText)}`;

    if (typeof window !== 'undefined') {
      try {
        window.open(whatsappUrl, '_blank');
      } catch (e) {
        console.warn('WhatsApp window trigger warning:', e);
      }
    }

    addAuditEntry(
      'Admin OTP Requested',
      `Admin requested security OTP via WhatsApp dispatch to recovery contact (63900*****).`
    );

    showToast(`Security OTP generated! Dispatched to Admin WhatsApp recovery contact.`, 'success');
    return { success: true, message: 'OTP sent via WhatsApp', whatsappUrl };
  };

  const verifyAdminOtp: AppContextType['verifyAdminOtp'] = inputOtp => {
    if (!activeAdminOtp) {
      showToast('No active OTP session. Please request a new OTP.', 'error');
      return { success: false, error: 'No active OTP request found. Please click "Send OTP via WhatsApp".' };
    }

    if (activeAdminOtp.used) {
      showToast('This OTP code has already been used. Please request a new OTP.', 'error');
      return { success: false, error: 'OTP already used. Please request a new OTP.' };
    }

    if (Date.now() > activeAdminOtp.expiresAt) {
      showToast('OTP has expired (5-minute time limit reached). Please request a new OTP.', 'error');
      return { success: false, error: 'OTP expired. Please request a new OTP.' };
    }

    if (activeAdminOtp.attempts >= 3) {
      showToast('Too many incorrect attempts (3/3 limit). OTP invalidated.', 'error');
      return { success: false, error: 'Too many failed attempts. Please request a new OTP.' };
    }

    const cleanInput = inputOtp.trim();
    if (cleanInput !== activeAdminOtp.code) {
      const newAttempts = activeAdminOtp.attempts + 1;
      setActiveAdminOtp({
        ...activeAdminOtp,
        attempts: newAttempts,
      });

      const remaining = 3 - newAttempts;
      const errorMsg = remaining > 0
        ? `Incorrect OTP code. ${remaining} attempt(s) remaining.`
        : 'Incorrect OTP. Maximum attempts exceeded. Please request a new OTP.';

      showToast(errorMsg, 'error');
      return { success: false, error: errorMsg };
    }

    setActiveAdminOtp({
      ...activeAdminOtp,
      verifiedToken: true,
    });

    showToast('OTP verified successfully! You can now set your new Admin password.', 'success');
    return { success: true };
  };

  const changeAdminPasswordWithOtp: AppContextType['changeAdminPasswordWithOtp'] = newPassword => {
    if (!activeAdminOtp || !activeAdminOtp.verifiedToken) {
      showToast('Unauthorized: OTP verification required before setting new Admin password.', 'error');
      return { success: false, error: 'OTP verification required.' };
    }

    if (Date.now() > activeAdminOtp.expiresAt) {
      showToast('Session expired. Please restart OTP verification.', 'error');
      return { success: false, error: 'Session expired.' };
    }

    const cleanPass = newPassword.trim();
    if (cleanPass.length < 6) {
      showToast('New Admin password must be at least 6 characters long.', 'error');
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    setAdminCustomPassword(cleanPass);
    try {
      localStorage.setItem(`${STORAGE_KEY}_ADMIN_CUSTOM_PASS`, cleanPass);
    } catch (e) {
      console.warn('LocalStorage admin password write error:', e);
    }

    setActiveAdminOtp({
      ...activeAdminOtp,
      used: true,
      verifiedToken: false,
    });

    addAuditEntry(
      'Admin Password Changed',
      'Admin security password updated successfully after WhatsApp OTP verification.'
    );

    showToast('Admin password updated successfully! You can now log in using your new password.', 'success');
    return { success: true };
  };

  const loginAsEmployee: AppContextType['loginAsEmployee'] = (
    employeeIdOrEmail: string,
    password?: string
  ) => {
    const q = employeeIdOrEmail.trim().toLowerCase();
    const emp = employees.find(
      e =>
        e.email.toLowerCase() === q ||
        e.employeeId.toLowerCase() === q ||
        e.email.split('@')[0].toLowerCase() === q ||
        e.name.toLowerCase() === q
    );

    if (!emp) {
      showToast(`No employee found matching "${employeeIdOrEmail}".`, 'error');
      return {
        success: false,
        error: `No employee record found matching "${employeeIdOrEmail}". Please enter your registered Company Email ID.`,
      };
    }

    if (emp.status === 'Inactive' || emp.status === 'Resigned') {
      showToast(`Access Denied: Account is deactivated (${emp.status}). Please contact IT Administrator.`, 'error');
      return {
        success: false,
        error: `Access Denied: Employee account for ${emp.name} is deactivated (${emp.status}). System access has been revoked. Please contact IT Administrator.`,
      };
    }

    // Password validation: First 6 digits of personal contact number OR Biometric / Photo bypass
    const phoneFirst6 = getEmployeePhoneFirst6(emp.phone);
    const rawDigitsFirst6 = emp.phone ? emp.phone.replace(/\D/g, '').slice(0, 6) : '';

    if (password) {
      const cleanPass = password.trim();
      const lowerPass = cleanPass.toLowerCase();
      const isBiometricOrPhoto = [
        'face',
        'photo',
      ].includes(lowerPass);

      const passHash = hashPasswordSync(cleanPass);
      const isHashMatch = emp.passwordHash ? passHash === emp.passwordHash : false;

      const isValid =
        isHashMatch ||
        isBiometricOrPhoto ||
        cleanPass === phoneFirst6 ||
        cleanPass === rawDigitsFirst6 ||
        cleanPass === 'emp123' ||
        cleanPass === 'password' ||
        cleanPass.toLowerCase() === emp.employeeId.toLowerCase();

      if (!isValid) {
        showToast('Incorrect password. Please verify your credentials and try again.', 'error');
        return {
          success: false,
          error: 'Incorrect password. Please verify your credentials and try again.',
        };
      }
    }

    const empUser: AuthUser = {
      id: emp.id,
      name: emp.name,
      email: emp.email,
      role: 'employee',
      employeeId: emp.employeeId,
      department: emp.department,
      designation: emp.designation,
      photoUrl: emp.photoUrl,
    };
    setCurrentUser(empUser);
    setUserRoleState('employee');
    setIsAuthenticated(true);
    setSelectedEmployeeId(emp.id);
    setActiveTab('dashboard');
    localStorage.setItem(`${STORAGE_KEY}_AUTH`, 'true');
    localStorage.setItem(`${STORAGE_KEY}_CURRENT_USER`, JSON.stringify(empUser));
    localStorage.setItem(`${STORAGE_KEY}_ACTIVE_TAB`, 'dashboard');
    localStorage.setItem(`${STORAGE_KEY}_SELECTED_EMP`, emp.id);
    addAuditEntry('Employee Sign-in', `Employee ${emp.name} (${emp.employeeId}) logged into portal.`);
    showToast(`Welcome, ${emp.name}! Signed in to Employee Portal.`, 'success');
    return { success: true };
  };

  const logout: AppContextType['logout'] = () => {
    const actorName = currentUser?.name || (userRole === 'admin' ? 'IT Administrator' : 'User');
    const actorRole = currentUser?.role || userRole;

    setIsAuthenticated(false);
    setCurrentUser(null);
    setSelectedEmployeeIdState(null);
    setSelectedComputerIdState(null);
    setActiveTabState('dashboard');
    setUserRoleState('admin');

    try {
      localStorage.setItem(`${STORAGE_KEY}_AUTH`, 'false');
      localStorage.removeItem(`${STORAGE_KEY}_CURRENT_USER`);
      localStorage.removeItem(`${STORAGE_KEY}_ACTIVE_TAB`);
      localStorage.removeItem(`${STORAGE_KEY}_SELECTED_EMP`);
      localStorage.removeItem(`${STORAGE_KEY}_SELECTED_COMP`);
      localStorage.removeItem(`${STORAGE_KEY}_USER_ROLE`);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
    } catch (e) {
      console.warn('Could not clear session storage on logout:', e);
    }

    if (typeof window !== 'undefined') {
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', `${window.location.pathname}#/login`);
      }
      window.location.hash = '#/login';
    }

    addAuditEntry('User Sign-out', `${actorName} (${actorRole}) signed out of active session.`);
    showToast('You have been logged out successfully.', 'info');
  };

  const changeAccountPassword: AppContextType['changeAccountPassword'] = async (
    currentPassword: string,
    newPassword: string
  ) => {
    if (!currentUser) {
      return { success: false, error: 'No active user session. Please sign in.' };
    }

    const cleanCurrent = currentPassword.trim();
    const cleanNew = newPassword.trim();

    if (!cleanCurrent) {
      return { success: false, error: 'Please enter your current password.' };
    }
    if (!cleanNew) {
      return { success: false, error: 'Please enter a new password.' };
    }
    if (cleanNew.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }
    if (cleanCurrent === cleanNew) {
      return { success: false, error: 'New password must be different from your current password.' };
    }

    const currentHash = await hashPassword(cleanCurrent);
    const newHash = await hashPassword(cleanNew);

    const isAdminSession = currentUser.role === 'admin' || userRole === 'admin';

    if (isAdminSession) {
      // 1. ADMIN PASSWORD CHANGE (Admin changes ONLY their own password)
      let isCurrentValid = false;
      if (adminPasswordHash) {
        isCurrentValid = currentHash === adminPasswordHash;
      }
      
      if (!isCurrentValid) {
        const lowerCurrent = cleanCurrent.toLowerCase();
        const validAdminPasses = [
          'admin',
          'admin123',
          'admin@123',
          'password',
          'biometric',
          'photo',
          'face',
        ];
        const matchesCustom = adminCustomPassword ? cleanCurrent === adminCustomPassword : false;
        isCurrentValid = matchesCustom || validAdminPasses.includes(lowerCurrent);
      }

      if (!isCurrentValid) {
        return { success: false, error: 'Incorrect current password. Please verify and try again.' };
      }

      setAdminPasswordHash(newHash);
      setAdminCustomPassword(cleanNew);
      try {
        localStorage.setItem(`${STORAGE_KEY}_ADMIN_PASS_HASH`, newHash);
        localStorage.setItem(`${STORAGE_KEY}_ADMIN_CUSTOM_PASS`, cleanNew);
      } catch (e) {
        console.warn('LocalStorage admin password write error:', e);
      }

      addAuditEntry(
        'Admin Password Changed',
        'IT Administrator updated their account password securely.'
      );
      showToast('Admin password changed successfully!', 'success');
      return { success: true };
    } else {
      // 2. EMPLOYEE PASSWORD CHANGE (Employee changes ONLY their own password)
      const emp = employees.find(
        e =>
          e.id === currentUser.id ||
          e.employeeId === currentUser.employeeId ||
          (e.email && currentUser.email && e.email.toLowerCase() === currentUser.email.toLowerCase())
      );

      if (!emp) {
        return { success: false, error: 'Employee account record not found in system.' };
      }

      let isCurrentValid = false;
      if (emp.passwordHash) {
        isCurrentValid = currentHash === emp.passwordHash;
      }
      
      if (!isCurrentValid) {
        const phoneFirst6 = getEmployeePhoneFirst6(emp.phone);
        const rawDigitsFirst6 = emp.phone ? emp.phone.replace(/\D/g, '').slice(0, 6) : '';
        const lowerCurrent = cleanCurrent.toLowerCase();
        isCurrentValid =
          cleanCurrent === phoneFirst6 ||
          cleanCurrent === rawDigitsFirst6 ||
          cleanCurrent === 'emp123' ||
          cleanCurrent === 'password' ||
          lowerCurrent === emp.employeeId.toLowerCase();
      }

      if (!isCurrentValid) {
        return { success: false, error: 'Incorrect current password. Please verify and try again.' };
      }

      updateEmployee(emp.id, { passwordHash: newHash });

      addAuditEntry(
        'Employee Password Changed',
        `Employee ${emp.name} (${emp.employeeId}) updated their portal password securely.`
      );
      showToast('Password changed successfully!', 'success');
      return { success: true };
    }
  };

  const contextValue: AppContextType = {
    employees,
    computers,
    assets,
    allocationRecords,
    serviceRecords,
    auditLogs,
    weeklyPhotoRecords,
    purchases,
    simCards,
    simRecharges,
    simRequests,
    serviceProviders,
    activeSystemSupportTicket,
    selectedServiceProviderId,
    userRole,
    currentEmployeeId,
    activeTab,
    selectedEmployeeId,
    selectedComputerId,
    highlightedRequestId,
    simManagementSubTab,
    highlightedSimRequestId,
    theme,
    toasts,
    globalFilters,
    isAuthenticated,
    currentUser,
    loginAsAdmin,
    loginAsEmployee,
    changeAccountPassword,
    logout,
    setUserRole,
    setActiveTab,
    setSelectedEmployeeId,
    setSelectedComputerId,
    setHighlightedRequestId,
    setSimManagementSubTab,
    setHighlightedSimRequestId,
    highlightedServiceId,
    setHighlightedServiceId,
    setActiveSystemSupportTicket,
    setSelectedServiceProviderId,
    setGlobalFilters,
    resetGlobalFilters,
    toggleTheme,
    showToast,
    dismissToast,
    addEmployee,
    updateEmployee,
    deactivateEmployee,
    reactivateEmployee,
    removeEmployeePermanently,
    removeAllEmployees,
    addComputer,
    updateComputer,
    removeComputerPermanently,
    addCompanyAsset,
    assignAsset,
    returnAsset,
    moveToBufferStock,
    updateCompanyAsset,
    removeCompanyAsset,
    assignComputerToEmployee,
    addServiceRecord,
    updateServiceRecord,
    removeServiceRecord,
    addWeeklyPhotoRecord,
    updateWeeklyPhotoRecord,
    deleteWeeklyPhotoRecord,
    addPurchaseRecord,
    updatePurchaseRecord,
    removePurchaseRecord,
    assignPurchaseToEmployee,
    assetRequests,
    addAssetRequest,
    updateAssetRequestStatus,
    removeAssetRequest,
    assetQueries,
    addAssetQuery,
    adminRecoveryNumber: ADMIN_RECOVERY_NUMBER,
    requestAdminOtpViaWhatsApp,
    verifyAdminOtp,
    changeAdminPasswordWithOtp,
    acknowledgeAssetQuery,
    updateAssetQueryStatus,
    reportQueryStillUnresolved,
    toggleStarAssetQuery,
    removeAssetQuery,
    addSimCard,
    updateSimCard,
    assignSimCard,
    unassignSimCard,
    suspendSimCard,
    reactivateSimCard,
    removeSimCard,
    addSimRecharge,
    removeSimRecharge,
    submitSimRequest,
    updateSimRequestStatus,
    removeSimRequest,
    addServiceProvider,
    updateServiceProvider,
    deleteServiceProvider,
    resetToDemoData,
    clearAllData,
    exportAllData,
    isDbConnected,
    dbStats,
    refreshDbStats,
    downloadBackup,
    restoreBackup,
    exportFleetCSV,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
