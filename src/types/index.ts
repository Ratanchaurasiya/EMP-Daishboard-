// Core Entity Types for Employee & Desktop Asset Management Dashboard
// STRICT COMPLIANCE: Zero location fields anywhere in the application

export type EmployeeStatus =
  | 'Active'
  | 'On Probation'
  | 'On Leave'
  | 'Contractual'
  | 'Inactive'
  | 'Resigned';

export const CORPORATE_DEPARTMENTS = [
  'Engineering',
  'Product Management',
  'IT & Infrastructure',
  'Human Resources',
  'Finance & Accounts',
  'Sales & Marketing',
  'Operations & Support',
  'Legal & Compliance',
] as const;

export type CorporateDepartment = (typeof CORPORATE_DEPARTMENTS)[number];

export interface Employee {
  id: string; // Internal UUID
  employeeId: string; // Unique ID, e.g. "EMP001"
  companyEmployeeNumber: string; // Corporate badge / payroll identifier, e.g. "CORP-8820"
  name: string;
  department: string;
  designation: string;
  team: string;
  joiningDate: string; // YYYY-MM-DD
  status: EmployeeStatus;
  email: string;
  phone: string;
  remarks: string;
  photoUrl?: string;
  passwordHash?: string;
}

// Tracked peripheral & company-issued asset types
export type AssetType =
  | 'Laptop'
  | 'Desktop'
  | 'Mouse'
  | 'Keyboard'
  | 'Headset'
  | 'Monitor'
  | 'Mobile Phone'
  | 'SIM Card'
  | 'Docking Station'
  | 'Other';

export type AssetCondition = 'New' | 'Good' | 'Fair' | 'Damaged';

export type AssetStatus = 
  | 'Assigned' 
  | 'Available' 
  | 'Under Service' 
  | 'Returned' 
  | 'Damaged' 
  | 'Retired';

// Tracked Company Asset (Mouse, Keyboard, Headset, or standalone Laptop reference)
export interface CompanyAsset {
  id: string;
  assetType: AssetType;
  assetNumber: string; // Unique, e.g. "MOU-021" or "PHN-001"
  brand: string;
  model: string;
  serialNumber: string;
  assignedEmployeeId: string | null;
  assignedDate: string | null; // DD-MM-YYYY or YYYY-MM-DD
  returnDate: string | null;
  condition: AssetCondition;
  status: AssetStatus;
  remarks: string;
  deviceName?: string;
  imeiNumber?: string;
  phoneNumber?: string;
  securityFunctionAdded?: 'Yes' | 'No';
  securityFunctionAddedDate?: string;
}

// Windows "About" / System Information for Desktop & Laptop
export interface ProcessorSpecs {
  name: string; // e.g. "12th Gen Intel(R) Core(TM) i3-1215U"
  generation: string; // e.g. "12th Gen"
  speed: string; // e.g. "1.20 GHz - 4.40 GHz"
}

export interface MemorySpecs {
  installedRAM: string; // e.g. "8.00 GB"
  usableRAM: string; // e.g. "7.71 GB"
}

export interface GraphicsSpecs {
  card: string; // e.g. "Intel(R) UHD Graphics"
  memory: string; // e.g. "128 MB"
}

export interface StorageSpecs {
  total: string; // e.g. "477 GB"
  used: string; // e.g. "123 GB"
  free: string; // e.g. "354 GB"
  type: string; // e.g. "NVMe SSD"
}

export interface SystemSpecs {
  os: string; // e.g. "Windows 11 Pro 64-bit"
  systemType: string; // e.g. "64-bit operating system, x64-based processor"
  processorArchitecture: string; // e.g. "x64"
  deviceId: string; // RESTRICTED / SENSITIVE - Admin only
  productId: string; // RESTRICTED / SENSITIVE - Admin only
  penAndTouch: string; // e.g. "No pen or touch input is available for this display"
}

export interface Computer {
  id: string;
  assetNumber: string; // Unique, e.g. "LAP-001" or "DSK-014"
  deviceName: string; // e.g. "Ratan_Chaurasia"
  manufacturer: string; // e.g. "Dell", "Lenovo", "HP", "ASUS"
  model: string; // e.g. "Latitude 5430"
  deviceType: 'Laptop' | 'Desktop';
  serialNumber: string;
  assignedEmployeeId: string | null;
  processor: ProcessorSpecs;
  memory: MemorySpecs;
  graphics: GraphicsSpecs;
  storage: StorageSpecs;
  system: SystemSpecs;
  condition: AssetCondition;
  status: AssetStatus;
  assignedDate: string | null;
  remarks?: string;
  securityFunctionAdded?: 'Yes' | 'No';
  securityFunctionAddedDate?: string;
}

// Historical record of asset issue and return
export interface AssetAllocationRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  assetId: string;
  assetType: AssetType;
  assetNumber: string;
  serialNumber: string;
  assignedDate: string;
  issuedBy: string;
  receivedBy: string;
  conditionAtIssue: string;
  returnDate: string | null;
  returnCondition: string | null;
  status: 'Assigned' | 'Returned';
  remarks: string;
}

// Desktop Service History
export type ProblemCategory =
  | 'Windows Problem'
  | 'Slow Performance'
  | 'RAM Problem'
  | 'SSD/HDD Problem'
  | 'Keyboard Problem'
  | 'Mouse Problem'
  | 'Display Problem'
  | 'Network Problem'
  | 'Software Installation'
  | 'Driver Problem'
  | 'Hardware Failure'
  | 'Formatting'
  | 'Other';

export type ServiceStatus = 'Completed' | 'In Progress' | 'Pending Parts' | 'Cannot Repair';

export interface ServiceRecord {
  id: string; // e.g. "SRV-2026-001"
  computerId: string;
  assetNumber: string;
  deviceName: string;
  employeeId: string;
  employeeName: string;
  serviceDate: string; // YYYY-MM-DD
  problem: string;
  problemCategory: ProblemCategory;
  workPerformed: string;
  partsReplaced: string;
  technician: string;
  serviceCost: number; // In INR ₹
  serviceStatus: ServiceStatus;
  resolution: string;
  remarks: string;
  // Service Provider / Electric Shop Details
  serviceProviderId?: string;
  serviceProviderShopName?: string; // Shop or company name e.g. "QuickFix Chip & Board Lab" or "Sharma Electricals"
  serviceProviderPhone?: string; // Contact phone / WhatsApp number
  serviceProviderAddress?: string; // Address / city
  serviceType?: string; // Work category / specialty
  // Repair Receipt / Invoice Proof Fields
  receiptNumber?: string;
  receiptDate?: string;
  receiptFileName?: string;
  receiptFileUrl?: string;
  receiptFileType?: string;
  receiptFileSize?: number;
  receiptStoragePath?: string;
}

// Automatic Service Summary Calculated for each Computer
export interface ComputerServiceSummary {
  totalServices: number;
  lastServiceDate: string | null;
  servicesThisYear: number;
  servicesThisMonth: number;
  totalRepairCost: number;
  mostCommonProblem: string;
  partsReplaced: string[];
}

// Audit Log for tracking all administrative actions
export interface AuditLog {
  id: string;
  action: 
    | 'Asset Assigned'
    | 'Asset Returned'
    | 'Asset Status Changed'
    | 'Asset Removed'
    | 'Asset Moved to Buffer Stock'
    | 'Computer Added'
    | 'Computer Updated'
    | 'Computer Removed'
    | 'Computer Assigned'
    | 'Employee Added'
    | 'Employee Updated'
    | 'Employee Deactivated'
    | 'Employee Reactivated'
    | 'Employee Removed'
    | 'Service Record Added'
    | 'Service Record Updated'
    | 'Service Record Removed'
    | 'Weekly Photo Audit Added'
    | 'Weekly Photo Audit Updated'
    | 'Weekly Photo Audit Removed'
    | 'Purchase Record Added'
    | 'Purchase Record Updated'
    | 'Purchase Record Removed'
    | 'Asset Request Submitted'
    | 'Asset Request Status Updated'
    | 'Asset Request Removed'
    | 'Admin Sign-in'
    | 'Employee Sign-in'
    | 'User Sign-out'
    | 'System Reset'
    | 'Database Backup'
    | 'Database Restored'
    | 'Report Exported'
    | 'SIM Added'
    | 'SIM Updated'
    | 'SIM Assigned'
    | 'SIM Unassigned'
    | 'SIM Reassigned'
    | 'SIM Purpose Changed'
    | 'SIM Suspension Requested'
    | 'SIM Suspended'
    | 'SIM Reactivated'
    | 'SIM Removed'
    | 'SIM Recharge Added'
    | 'SIM Recharge Updated'
    | 'SIM Request Submitted'
    | 'SIM Request Status Updated'
    | 'Asset Query Submitted'
    | 'Asset Query Acknowledged'
    | 'Asset Query Status Updated'
    | 'Asset Query Still Unresolved'
    | 'Asset Query Star Toggled'
    | 'Asset Query Removed'
    | 'Service Provider Added'
    | 'Service Provider Updated'
    | 'Service Provider Deleted'
    | 'Admin Password Changed'
    | 'Employee Password Changed'
    | 'Admin OTP Requested';
  details: string;
  actor: string;
  timestamp: string;
}

// Weekly Asset Photo & Document Documentation
export interface AssetPhotoItem {
  id: string; // Unique photo item ID
  assetId?: string; // Optional reference to computer or asset ID
  assetType: AssetType | 'Desktop' | 'Laptop';
  assetNumber: string; // e.g. LAP-001, MOU-021
  assetName: string; // e.g. Dell Latitude 5430, Logitech MX Master
  photoUrl?: string; // Base64 data URL or hosted link
  fileName?: string; // Original uploaded file name
  fileSize?: number; // File size in bytes
  fileType?: string; // MIME type (e.g. image/jpeg, application/pdf)
  uploadType?: 'file' | 'drive' | 'both'; // Whether uploaded as file, drive link, or both
  googleDriveLink?: string; // Specific Google Drive link for this asset
  storageLocation?: string; // e.g. "Permanent IndexedDB Secure Storage" or "Google Drive Cloud"
  storagePath?: string; // Internal database reference / URI
  condition: AssetCondition;
  notes?: string;
  capturedAt: string; // ISO date timestamp
}

// Dedicated Permanent File Record stored in IndexedDB 'uploadedFiles' store
export interface StoredAssetFile {
  id: string; // Primary key e.g. "FILE-2026-..."
  employeeId: string;
  employeeName: string;
  assetId?: string;
  assetNumber: string;
  assetType: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  data: string; // Base64 data URL
  storagePath: string; // e.g. "indexeddb://uploadedFiles/FILE-..."
  storageLocation: string; // "Permanent IndexedDB Secure Storage"
  googleDriveLink?: string;
  uploadedAt: string;
}

export type WeeklyUploadStatus = 'Pending Review' | 'Verified' | 'Needs Attention' | 'Rejected';

export interface WeeklyAssetPhotoRecord {
  id: string; // e.g. "WPR-2026-W37-EMP001"
  employeeId: string; // Employee ID or UUID
  employeeCode: string; // e.g. "EMP001"
  employeeName: string;
  department?: string;
  designation?: string;
  weekNumber: number; // e.g. 37
  year: number; // e.g. 2026
  weekLabel: string; // e.g. "Week 37, 2026 (Sep 07 - Sep 13)"
  weekStartDate: string; // YYYY-MM-DD
  weekEndDate: string; // YYYY-MM-DD
  inspectionDate: string; // YYYY-MM-DD
  uploadDate?: string; // YYYY-MM-DD or ISO timestamp
  status?: WeeklyUploadStatus; // 'Pending Review' | 'Verified' | 'Needs Attention' | 'Rejected'
  reviewStatus?: WeeklyUploadStatus;
  reviewedBy?: string; // Admin reviewer name
  reviewedAt?: string; // ISO date timestamp
  adminRemarks?: string; // Feedback from Admin to Employee
  googleDriveLink?: string; // Google Drive folder or file share URL
  conductedBy: string; // Auditor / Submitter name
  overallRemarks?: string;
  assetPhotos: AssetPhotoItem[];
  createdAt: string;
  updatedAt: string;
}

// User Role for Security & Access Control
export type UserRole = 'admin' | 'employee';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  employeeId?: string;
  department?: string;
  designation?: string;
  photoUrl?: string;
}

// Filter state interface
export interface GlobalFilters {
  search: string;
  department: string;
  assetType: string;
  status: string;
  assignedDate: string;
  serviceCount: string;
  computerBrand: string;
}

// ==================== FLEET & ASSET PURCHASE MANAGEMENT ====================
export const PURCHASE_ASSET_TYPES = [
  'Laptop',
  'PC',
  'Mobile Phone',
  'Monitor',
  'Keyboard',
  'Mouse',
  'Headset',
  'Docking Station',
  'Other',
] as const;

export type PurchaseAssetType = (typeof PURCHASE_ASSET_TYPES)[number] | 'Desktop';
export type PurchaseDeviceType = PurchaseAssetType;

export const PURCHASE_ACCESSORY_TYPES = [
  'Monitor',
  'Keyboard',
  'Mouse',
  'Headset',
  'Webcam',
  'UPS',
  'Laptop Bag',
  'Docking Station',
  'Other Accessories',
] as const;

export type PurchaseAccessoryType = (typeof PURCHASE_ACCESSORY_TYPES)[number];

export interface PurchasedAccessoryItem {
  id: string;
  type: PurchaseAccessoryType | string;
  name: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  notes?: string;
}

export type PurchaseStatus = 'In Stock' | 'Assigned' | 'Under Service' | 'Retired';

export interface PurchaseRecord {
  id: string;
  purchaseNumber: string;
  deviceType: PurchaseDeviceType;
  assetType?: AssetType;
  quantity?: number;
  unitCost?: number;
  brand: string;
  modelName: string;
  modelNumber: string;
  serialNumber?: string;
  imeiNumber?: string;
  phoneNumber?: string;
  screenSize?: string;
  specsDetails?: string;
  purchaseDate: string;
  vendor: string;
  deviceCost: number; // Base cost of the asset(s)
  processor?: string;
  ram?: string;
  storage?: string;
  os?: string;
  warrantyPeriod: string;
  warrantyExpiryDate?: string;
  warrantyProvider?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceFileUrl?: string;
  invoiceFileName?: string;
  accessories: PurchasedAccessoryItem[];
  totalAccessoriesCost: number;
  grandTotalCost: number;
  status: PurchaseStatus;
  assignedEmployeeId?: string | null;
  assignedEmployeeName?: string | null;
  assignedComputerId?: string | null;
  assignedAssetIds?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Multi-Asset Employee Requisitions & Admin Management
export type EquipmentAssetType =
  | 'Mouse'
  | 'Keyboard'
  | 'CPU'
  | 'Monitor'
  | 'Laptop'
  | 'Headset'
  | 'Webcam'
  | 'Mobile Phone'
  | 'Other';

export interface AssetRequestItem {
  id: string;
  assetType: EquipmentAssetType | string;
  customAssetName?: string; // For "Other"
  quantity: number;
  specifications?: string; // e.g. "Wireless", "27-inch 4K", "Noise-cancelling"
}

export type RequestStatus = 'Pending' | 'Approved' | 'In Progress' | 'Fulfilled' | 'Rejected';
export type RequestUrgency = 'Normal' | 'High' | 'Critical' | 'Urgent';

export interface AssetRequest {
  id: string; // e.g. "REQ-2026-001"
  employeeId: string;
  companyEmployeeNumber?: string;
  employeeName: string;
  employeeEmail: string;
  employeePhone?: string;
  department: string;
  designation?: string;
  requestDate: string; // YYYY-MM-DD
  urgency: RequestUrgency;
  status: RequestStatus;
  items: AssetRequestItem[];
  reason: string; // Business reason / description
  adminNotes?: string;
  fulfilledDate?: string;
  createdAt: string;
  updatedAt?: string;
}

// ==================== SIM CARD & TELECOM MANAGEMENT ====================
export type SimStatus = 'Available' | 'Assigned' | 'Active' | 'Suspended' | 'Deactivated';

export const SIM_TYPES = ['Prepaid', 'Postpaid'] as const;
export type SimType = (typeof SIM_TYPES)[number];

export const SIM_PURPOSES = [
  'Holding',
  'WhatsApp',
  'Marketing',
  'Calling',
  'Incoming',
  'CP',
  'Other',
] as const;

export type SimPurpose = (typeof SIM_PURPOSES)[number];

export interface SimCard {
  id: string; // Unique ID, e.g. "SIM-2026-001" or UUID
  contactNumber: string; // e.g. "9876543210"
  simNumber?: string; // ICCID or SIM number e.g. "8991..."
  assignedEmployeeId?: string | null; // e.g. "EMP001"
  assignedEmployeeName?: string | null;
  status: SimStatus;
  purpose: SimPurpose;
  customPurpose?: string; // Exact purpose if purpose is 'Other'
  simType?: SimType; // 'Prepaid' | 'Postpaid'
  project?: string; // Project for which SIM is allocated (e.g. "ABC Project", "HQ Ops")
  department?: string;
  carrier?: string; // e.g. "Airtel", "Jio", "Vodafone Idea", "BSNL"
  issueDate?: string | null; // YYYY-MM-DD or allocation date
  assignedDate?: string | null; // Allocation date alias
  unassignedDate?: string | null; // Return/release date
  remarks?: string;
  suspensionReason?: string | null;
  suspendedBy?: string | null;
  suspendedAt?: string | null;
  reactivatedAt?: string | null;
  lastRechargeDate?: string | null;
  lastRechargeAmount?: number | null;
  rechargeStatus?: 'Recharged' | 'Pending' | string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SimRecharge {
  id: string; // e.g. "REC-2026-001"
  simId: string; // Reference to SimCard.id
  contactNumber: string;
  employeeId?: string | null;
  employeeName?: string | null;
  project?: string;
  rechargeDate: string; // YYYY-MM-DD
  planDescription: string; // e.g. "Unlimited 5G 84 Days + 2GB/Day"
  rechargeAmount: number; // Base recharge amount in INR
  gstPercentage: number; // Default: 18%
  gstAmount: number; // Auto: Amount * (GST% / 100)
  totalAmount: number; // Auto: Amount + GST Amount
  paymentMode?: string; // 'Company UPI', 'Corporate Card', 'Net Banking', 'Cash'
  referenceNumber?: string; // Transaction ID / Invoice Ref
  remarks?: string;
  createdAt: string;
}

export type SimRequestType = 'Additional SIM' | 'Suspend SIM' | 'Report Issue';
export type SimRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'In Progress' | 'Resolved';

export type SimIssueType =
  | 'SIM Blocked'
  | 'SIM Not Working'
  | 'Incoming Calls Not Working'
  | 'Outgoing Calls Not Working'
  | 'Internet/Data Not Working'
  | 'WhatsApp Issue'
  | 'Network Issue'
  | 'SIM Lost'
  | 'SIM Damaged'
  | 'Other';

export interface SimRequest {
  id: string; // e.g. "SIMREQ-2026-001"
  employeeId: string;
  employeeName: string;
  companyEmployeeNumber?: string;
  employeeEmail?: string;
  employeePhone?: string;
  quantity?: number; // Quantity of SIMs requested (default 1)
  project?: string; // Project for which SIM is required
  requestType: SimRequestType;
  issueType?: SimIssueType | string; // For issue reports
  simId?: string; // For suspend or issue requests
  contactNumber?: string; // For suspend or issue requests
  purpose?: SimPurpose | string; // For additional SIM or issue report
  customPurpose?: string; // If 'Other' is selected
  simType?: SimType; // 'Prepaid' | 'Postpaid'
  urgency: RequestUrgency;
  reason: string; // Mandatory requirement details / justification
  remarks?: string;
  status: SimRequestStatus;
  adminRemarks?: string;
  resolutionRemarks?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  targetWhatsAppNumber?: string; // e.g. "9328594724"
  whatsAppStatus?: 'Sent' | 'Pending' | 'Not Configured' | 'Failed';
  createdAt: string;
  updatedAt?: string;
}

// ==================== SYSTEM / PC SUPPORT & SERVICE PROVIDERS ====================
export type ServiceProviderType =
  | 'Hardware Repair & Chip-Level'
  | 'Screen & Display Replacement'
  | 'OS & Enterprise Software Setup'
  | 'Networking & Infrastructure'
  | 'Authorized Brand Service Center'
  | 'AMC & General Maintenance'
  | 'Data Recovery & Storage'
  | 'Custom'
  | 'Other';

export interface ServiceProvider {
  id: string; // e.g. "PROV-2026-001"
  technicianName: string; // Person Name, e.g. "Ramesh Sharma"
  shopName: string; // Shop/Company Name, e.g. "Apex PC Care & Chip Level Solutions"
  phoneNumber: string; // Mobile/WhatsApp Number, e.g. "+91 98765-43210"
  whatsappNumber?: string;
  email?: string;
  address: string; // Shop Address / Location
  city?: string;
  state?: string;
  pincode?: string;
  serviceType: ServiceProviderType | string;
  rating?: number; // 1 to 5 stars
  experienceYears?: number;
  workingHours?: string; // e.g. "10:00 AM - 8:30 PM (Mon-Sat)"
  isPreferred?: boolean;
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ActiveSystemSupportTicket {
  requestId?: string;
  ticketId?: string;
  employeeId?: string;
  employeeName?: string;
  department?: string;
  deviceName?: string;
  assetNumber?: string;
  assetType?: string;
  serialNumber?: string;
  problemCategory?: string;
  problemDescription?: string;
  urgency?: RequestUrgency;
  status?: string;
  createdAt?: string;
}

// ==================== STAFF ASSET QUERY MANAGEMENT ====================
export type AssetQueryStatus =
  | 'Pending Acknowledgement'
  | 'Acknowledged'
  | 'In Progress'
  | 'Handover Completed'
  | 'Still Unresolved'
  | 'Resolved'
  | 'Closed';

export type AssetQueryType =
  | 'Hardware Issue'
  | 'Software / OS'
  | 'Battery / Charger'
  | 'Performance / Slow'
  | 'Handover Followup'
  | 'Physical Damage'
  | 'Other';

export interface AssetQueryHistoryItem {
  id: string;
  timestamp: string;
  status: AssetQueryStatus;
  updatedBy: string;
  notes?: string;
}

export interface AssetQuery {
  id: string; // e.g. "QRY-2026-001"
  employeeId: string;
  companyEmployeeNumber?: string;
  employeeName: string;
  employeeEmail: string;
  employeePhone?: string;
  department: string;
  assetId?: string;
  assetNumber: string; // e.g. "LAP-001"
  assetName: string; // e.g. "Dell Latitude 5430"
  assetType: 'Laptop' | 'Desktop' | 'Mobile Phone' | 'Monitor' | 'Other' | string;
  queryType: AssetQueryType | string;
  subject: string;
  description: string;
  isStarred: boolean;
  status: AssetQueryStatus;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  handoverDate?: string;
  stillUnresolvedDate?: string;
  stillUnresolvedNotes?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt?: string;
  history: AssetQueryHistoryItem[];
}

