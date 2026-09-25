import {
  Computer,
  ServiceRecord,
  PurchaseRecord,
  CompanyAsset,
  AuditLog,
  AssetRequest,
  SimRequest,
  SimCard,
  SimRecharge,
  AssetQuery,
  Employee,
  AuthUser,
  UserRole,
  ExitClearanceRecord,
} from '../../types';
import { isActiveAssignedSim } from '../../utils/simUtils';

export interface NotificationItem {
  id: string;
  category: 'alerts' | 'purchases' | 'maintenance' | 'system';
  severity: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  timestamp: string;
  rawDate: number;
  tabTarget?: string;
  targetId?: string;
  actionLabel?: string;
}

export const isEmployeeMatch = (
  recordEmployeeId?: string | null,
  companyEmployeeNumber?: string | null,
  employeeEmail?: string | null,
  assignedEmpId?: string | null,
  user?: AuthUser | null
): boolean => {
  if (!user) return false;
  const targetId = (user.id || '').trim().toLowerCase();
  const targetEmpId = (user.employeeId || '').trim().toLowerCase();
  const targetEmail = (user.email || '').trim().toLowerCase();

  const matchId = Boolean(recordEmployeeId && (recordEmployeeId.trim().toLowerCase() === targetId || recordEmployeeId.trim().toLowerCase() === targetEmpId));
  const matchEmpNo = Boolean(companyEmployeeNumber && (companyEmployeeNumber.trim().toLowerCase() === targetId || companyEmployeeNumber.trim().toLowerCase() === targetEmpId));
  const matchEmail = Boolean(employeeEmail && targetEmail && employeeEmail.trim().toLowerCase() === targetEmail);
  const matchAssigned = Boolean(assignedEmpId && (assignedEmpId.trim().toLowerCase() === targetId || assignedEmpId.trim().toLowerCase() === targetEmpId));

  return matchId || matchEmpNo || matchEmail || matchAssigned;
};

export interface GenerateNotificationsParams {
  computers: Computer[];
  serviceRecords: ServiceRecord[];
  purchases: PurchaseRecord[];
  assets: CompanyAsset[];
  auditLogs: AuditLog[];
  assetRequests: AssetRequest[];
  simRequests: SimRequest[];
  simCards: SimCard[];
  simRecharges: SimRecharge[];
  assetQueries?: AssetQuery[];
  exitClearances?: ExitClearanceRecord[];
  employees: Employee[];
  currentUser: AuthUser | null;
  userRole: UserRole;
}

export function generateSystemNotifications(params: GenerateNotificationsParams): NotificationItem[] {
  const {
    computers,
    serviceRecords,
    purchases,
    assets,
    auditLogs,
    assetRequests,
    simRequests,
    simCards,
    simRecharges,
    assetQueries = [],
    exitClearances = [],
    employees,
    currentUser,
    userRole,
  } = params;

  const isEmployee = currentUser?.role === 'employee' || userRole === 'employee';
  const items: NotificationItem[] = [];
  const now = Date.now();

  const belongsToCurrentEmployee = (
    recEmpId?: string | null,
    compEmpNo?: string | null,
    email?: string | null,
    assignedId?: string | null
  ) => {
    if (!isEmployee) return true;
    return isEmployeeMatch(recEmpId, compEmpNo, email, assignedId, currentUser);
  };

  // ================= 0. EMPLOYEE EXIT & ASSET CLEARANCE NOTIFICATIONS =================
  (exitClearances || []).forEach(clr => {
    const isTarget = belongsToCurrentEmployee(clr.employeeId, clr.companyEmployeeNumber, clr.employeeEmail);
    if (!isTarget && isEmployee) return;

    const deadlineMillis = new Date(clr.returnDeadline).getTime();
    const isOverdue = now > (deadlineMillis + 24 * 60 * 60 * 1000) && clr.status !== 'Full & Final Approved';

    if (clr.status === 'Full & Final Approved') {
      items.push({
        id: `clr-approved-${clr.id}`,
        category: 'alerts',
        severity: 'success',
        title: `Asset Clearance Cleared: ${clr.employeeName}`,
        description: `Full & Final Exit Asset Clearance approved. Certificate: ${clr.clearanceCertificateNumber || 'Issued'}. Zero outstanding dues.`,
        timestamp: clr.clearedAt ? clr.clearedAt.substring(0, 10) : 'Cleared',
        rawDate: clr.clearedAt ? new Date(clr.clearedAt).getTime() : now,
        tabTarget: 'exit-clearance',
        targetId: clr.id,
        actionLabel: 'View Certificate',
      });
    } else if (clr.status === 'Action Required / Liability Pending') {
      items.push({
        id: `clr-liability-${clr.id}`,
        category: 'alerts',
        severity: 'critical',
        title: `Clearance Action Required: ${clr.employeeName}`,
        description: `Asset inspection flagged damaged or missing devices. Total recoverable liability: ₹${clr.summary.totalEmployeeLiableAmount.toLocaleString('en-IN')}.`,
        timestamp: 'Action Required',
        rawDate: now,
        tabTarget: 'exit-clearance',
        targetId: clr.id,
        actionLabel: 'Review Liability',
      });
    } else if (isOverdue) {
      items.push({
        id: `clr-overdue-${clr.id}`,
        category: 'alerts',
        severity: 'critical',
        title: `Asset Return Deadline Overdue: ${clr.employeeName}`,
        description: `Return deadline was ${clr.returnDeadline}. Late fine of ₹500/day per asset applies. Accumulated late fine: ₹${clr.summary.totalLateFines.toLocaleString('en-IN')}.`,
        timestamp: 'Overdue Deadline',
        rawDate: now + 1000,
        tabTarget: 'exit-clearance',
        targetId: clr.id,
        actionLabel: isEmployee ? 'Return Assets Now' : 'Inspect Overdue Assets',
      });
    } else if (clr.status === 'Pending Asset Return' || clr.status === 'Under Inspection') {
      items.push({
        id: `clr-active-${clr.id}`,
        category: 'alerts',
        severity: 'warning',
        title: `Asset Clearance Window Active: ${clr.employeeName}`,
        description: `${clr.items.filter(i => i.returnStatus === 'Pending').length} of ${clr.summary.totalAssigned} assets pending return before deadline ${clr.returnDeadline}.`,
        timestamp: `Deadline: ${clr.returnDeadline}`,
        rawDate: deadlineMillis || now,
        tabTarget: 'exit-clearance',
        targetId: clr.id,
        actionLabel: 'View Checklist',
      });
    }
  });

  // 0. Equipment & Asset Requests (Requisitions)
  (assetRequests || []).forEach(req => {
    if (!belongsToCurrentEmployee(req.employeeId, req.companyEmployeeNumber, req.employeeEmail)) return;

    const totalItems = (req.items || []).reduce((s, i) => s + (i.quantity || 1), 0);
    const itemsSummary = (req.items || []).map(i => `${i.quantity}x ${i.assetType}`).join(', ');
    const isPending = req.status === 'Pending';
    const severity = req.urgency === 'Critical' ? 'critical' : (req.urgency === 'High' ? 'warning' : 'info');

    const reqDateMillis = req.createdAt ? new Date(req.createdAt).getTime() : new Date(req.requestDate).getTime();
    const dateDisplay = req.createdAt
      ? new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : req.requestDate;

    items.push({
      id: `req-${req.id}`,
      category: 'alerts',
      severity: isPending ? severity : 'success',
      title: isPending
        ? (isEmployee ? `Request Submitted: ${totalItems} item(s)` : `New Request: ${req.employeeName} (${req.department})`)
        : `Request ${req.status}: ${req.employeeName}`,
      description: `Requested ${totalItems} item(s): ${itemsSummary}. Urgency: ${req.urgency}. Reason: ${req.reason.substring(0, 75)}${req.reason.length > 75 ? '...' : ''}`,
      timestamp: dateDisplay || 'Recent',
      rawDate: isNaN(reqDateMillis) ? now : reqDateMillis,
      tabTarget: 'requests',
      targetId: req.id,
      actionLabel: isPending ? (isEmployee ? 'View Requisition' : 'Review Request') : 'View Requisition',
    });
  });

  // 0.5. SIM Requisitions, Suspensions & Issue Reports
  (simRequests || []).forEach(req => {
    if (!belongsToCurrentEmployee(req.employeeId, null, req.employeeEmail)) return;

    const isPending = req.status === 'Pending' || req.status === 'In Progress';
    const isSuspension = req.requestType === 'Suspend SIM';
    const isIssue = req.requestType === 'Report Issue';
    const isUrgent = req.urgency === 'Urgent';
    const reqDateMillis = req.createdAt ? new Date(req.createdAt).getTime() : now;
    const dateDisplay = req.createdAt
      ? new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'Recent';

    let title = `SIM Request ${req.status}: ${req.employeeName}`;
    let severity: 'critical' | 'warning' | 'info' | 'success' = req.status === 'Approved' || req.status === 'Resolved' ? 'success' : 'info';

    if (isPending) {
      if (isIssue) {
        title = `🔴 SIM Issue (${req.issueType || 'Issue'}): ${req.employeeName}`;
        severity = isUrgent ? 'critical' : 'warning';
      } else if (isSuspension) {
        title = `⚠️ SIM Suspension Requested: ${req.employeeName}`;
        severity = 'warning';
      } else {
        title = `📱 SIM Requisition: ${req.employeeName}`;
        severity = 'info';
      }
    }

    let description = `Requested new SIM for ${req.purpose || 'Calling'}. Purpose/Remarks: ${req.reason}`;
    if (isIssue) {
      description = `SIM: ${req.contactNumber || 'N/A'} | Project: ${req.project || 'General'} | Priority: ${req.urgency || 'Normal'}. Description: ${req.reason}`;
    } else if (isSuspension) {
      description = `Suspension requested for SIM ${req.contactNumber || ''}. Mandatory Reason: ${req.reason}`;
    }

    items.push({
      id: `sim-req-${req.id}`,
      category: 'alerts',
      severity,
      title,
      description,
      timestamp: dateDisplay || 'Recent',
      rawDate: isNaN(reqDateMillis) ? now : reqDateMillis,
      tabTarget: 'sim-management',
      targetId: req.id,
      actionLabel: isPending ? (isEmployee ? 'View SIM Requests' : 'Take Action') : 'View SIM Records',
    });
  });

  // 0.6. SIM Recharge Notifications for Active Assigned SIMs
  (simRecharges || []).forEach(rec => {
    const targetSim = (simCards || []).find(s => s.id === rec.simId || s.contactNumber === rec.contactNumber);
    if (!targetSim || !isActiveAssignedSim(targetSim)) return;

    if (!belongsToCurrentEmployee(rec.employeeId, null, null, targetSim.assignedEmployeeId)) return;

    const recDateMillis = rec.createdAt ? new Date(rec.createdAt).getTime() : new Date(rec.rechargeDate).getTime();
    const dateDisplay = rec.rechargeDate || 'Recent';

    items.push({
      id: `sim-rec-${rec.id}`,
      category: 'alerts',
      severity: 'success',
      title: 'SIM Recharge Completed',
      description: `SIM (${rec.contactNumber}) recharged. Plan: ${rec.planDescription || 'Monthly Allowance'} (Total: ₹${rec.totalAmount}).`,
      timestamp: dateDisplay || 'Recent',
      rawDate: isNaN(recDateMillis) ? now : recDateMillis,
      tabTarget: isEmployee ? 'sim-management' : 'sim-management',
      targetId: rec.id,
      actionLabel: isEmployee ? 'View Recharges' : 'View SIM Records',
    });
  });

  // 0.7. Staff Asset Queries
  (assetQueries || []).forEach(q => {
    if (!belongsToCurrentEmployee(q.employeeId, q.companyEmployeeNumber, q.employeeEmail)) return;

    const isPending = q.status === 'Pending Acknowledgement';
    const isUnresolved = q.status === 'Still Unresolved';
    const qDateMillis = q.createdAt ? new Date(q.createdAt).getTime() : now;
    const dateDisplay = q.createdAt
      ? new Date(q.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'Recent';

    let severity: 'critical' | 'warning' | 'info' | 'success' = 'info';
    if (isUnresolved) severity = 'critical';
    else if (isPending) severity = 'warning';
    else if (q.status === 'Resolved' || q.status === 'Closed') severity = 'success';

    items.push({
      id: `query-${q.id}`,
      category: 'alerts',
      severity,
      title: isEmployee
        ? `Asset Query (${q.status}): ${q.subject}`
        : `Staff Query from ${q.employeeName}: ${q.subject}`,
      description: `Asset: ${q.assetName || q.assetNumber} | Type: ${q.queryType}. ${q.description.substring(0, 75)}${q.description.length > 75 ? '...' : ''}`,
      timestamp: dateDisplay,
      rawDate: isNaN(qDateMillis) ? now : qDateMillis,
      tabTarget: 'asset-queries',
      targetId: q.id,
      actionLabel: isEmployee ? 'View Query' : (isPending ? 'Acknowledge Query' : 'View Query'),
    });
  });

  // 1. Maintenance & Service Tickets & Receipts
  const empUserComp = isEmployee
    ? computers.find(c => isEmployeeMatch(null, null, null, c.assignedEmployeeId, currentUser))
    : null;

  (serviceRecords || []).forEach(s => {
    const targetEmp = (employees || []).find(e => e.id === s.employeeId || e.employeeId === s.employeeId);
    const isMyService = belongsToCurrentEmployee(
      s.employeeId,
      targetEmp?.companyEmployeeNumber || null,
      targetEmp?.email || null,
      null
    ) || (s.employeeName && currentUser?.name && s.employeeName.toLowerCase().trim() === currentUser.name.toLowerCase().trim())
      || (empUserComp && (s.computerId === empUserComp.id || s.assetNumber === empUserComp.assetNumber));

    if (!isMyService) return;

    const recDateMillis = s.serviceDate ? new Date(s.serviceDate).getTime() : now;
    const dateDisplay = s.serviceDate || 'Recent';

    if (s.serviceStatus === 'In Progress' || s.serviceStatus === 'Pending Parts') {
      items.push({
        id: `srv-${s.id}`,
        category: 'maintenance',
        severity: s.serviceStatus === 'In Progress' ? 'warning' : 'info',
        title: `Active Service: ${s.deviceName || s.assetNumber}`,
        description: `Ticket ${s.id} (${s.problemCategory || 'Repair'}) is currently ${s.serviceStatus}. Technician: ${s.technician || 'IT Support'}.`,
        timestamp: dateDisplay,
        rawDate: isNaN(recDateMillis) ? now : recDateMillis,
        tabTarget: 'services',
        targetId: s.id,
        actionLabel: 'View Ticket',
      });
    } else {
      items.push({
        id: `srv-receipt-${s.id}`,
        category: 'maintenance',
        severity: 'info',
        title: '🔧 New Service & Repair Receipt Added',
        description: `Service/repair receipt added for ${s.deviceName || s.assetNumber || 'Laptop/Asset'}. Technician: ${s.technician || 'IT Support'}.`,
        timestamp: dateDisplay,
        rawDate: isNaN(recDateMillis) ? now : recDateMillis,
        tabTarget: 'services',
        targetId: s.id,
        actionLabel: 'View Receipt Details',
      });
    }
  });

  // 2. Workstations / Computers Under Service or Damaged
  (computers || []).forEach(c => {
    const isMyComp = belongsToCurrentEmployee(null, null, null, c.assignedEmployeeId);
    if (!isMyComp) return;

    if (c.status === 'Under Service') {
      items.push({
        id: `comp-srv-${c.id}`,
        category: 'maintenance',
        severity: 'warning',
        title: `Workstation In Maintenance: ${c.assetNumber}`,
        description: `${c.deviceName} (${c.manufacturer} ${c.model}) is currently tagged Under Service.`,
        timestamp: 'Live Status',
        rawDate: now - 3600000,
        tabTarget: 'computers',
        targetId: c.id,
        actionLabel: 'Service Details',
      });
    }

    if (c.condition === 'Damaged') {
      items.push({
        id: `comp-dmg-${c.id}`,
        category: 'alerts',
        severity: 'critical',
        title: `Damaged Hardware Reported: ${c.assetNumber}`,
        description: `${c.deviceName} is marked as Damaged. Inspection or replacement required immediately.`,
        timestamp: 'Urgent',
        rawDate: now - 1800000,
        tabTarget: 'computers',
        targetId: c.id,
        actionLabel: 'Inspect Workstation',
      });
    }
  });

  // 3. Peripheral Assets Damaged
  (assets || []).forEach(a => {
    const isMyAsset = belongsToCurrentEmployee(null, null, null, a.assignedEmployeeId);
    if (!isMyAsset) return;

    if (a.condition === 'Damaged' || a.status === 'Damaged') {
      items.push({
        id: `asset-dmg-${a.id}`,
        category: 'alerts',
        severity: 'critical',
        title: `Damaged Peripheral: ${a.assetType} (${a.assetNumber})`,
        description: `${a.brand} ${a.model} is damaged. Needs replacement or repair disposal.`,
        timestamp: 'Action Needed',
        rawDate: now - 7200000,
        tabTarget: 'assets',
        targetId: a.id,
        actionLabel: 'View Asset',
      });
    }
  });

  // Admin-Only System & Procurement Notifications
  if (!isEmployee) {
    // 4. Purchases Without Invoice Receipts
    (purchases || []).forEach(p => {
      const hasReceipt = !!p.invoiceFileUrl || (p.invoiceNumber && p.invoiceNumber.trim() !== '');
      if (!hasReceipt) {
        items.push({
          id: `pur-noreceipt-${p.id}`,
          category: 'purchases',
          severity: 'warning',
          title: `Missing Invoice Receipt: PO #${p.purchaseNumber}`,
          description: `${p.brand} ${p.modelName} purchased for ₹${Number(p.grandTotalCost || 0).toLocaleString('en-IN')} has no bill/receipt uploaded.`,
          timestamp: p.purchaseDate || 'Pending',
          rawDate: new Date(p.purchaseDate).getTime() || now,
          tabTarget: 'purchases',
          targetId: p.id,
          actionLabel: 'Upload Bill',
        });
      }
    });

    // 5. High-Value Buffer Inventory Spares Available
    const availableLaptops = (computers || []).filter(c => c.status === 'Available');
    if (availableLaptops.length > 0) {
      items.push({
        id: 'fleet-buffer-available',
        category: 'system',
        severity: 'info',
        title: `Buffer Stock Ready: ${availableLaptops.length} Available PC/Laptop${availableLaptops.length > 1 ? 's' : ''}`,
        description: `Unassigned workstations in reserve ready for new onboarding or replacement deployment.`,
        timestamp: 'Inventory Reserve',
        rawDate: now - 86400000,
        tabTarget: 'computers',
        actionLabel: 'View Available',
      });
    }

    // 6. Recent System Activity & Audit Logs
    (auditLogs || []).slice(0, 5).forEach((log, index) => {
      items.push({
        id: `audit-${log.id || index}-${log.timestamp}`,
        category: 'system',
        severity: 'info',
        title: `${log.action}: ${log.actor || 'Admin'}`,
        description: log.details,
        timestamp: log.timestamp ? log.timestamp.substring(11, 16) || log.timestamp : 'Recent',
        rawDate: new Date(log.timestamp).getTime() || (now - (index + 1) * 3600000),
        tabTarget: 'audit',
        actionLabel: 'Audit Hub',
      });
    });
  }

  // Sort by priority and timestamp (critical first, then latest)
  return items.sort((a, b) => {
    const severityScore = { critical: 4, warning: 3, info: 2, success: 1 };
    const scoreDiff = severityScore[b.severity] - severityScore[a.severity];
    if (scoreDiff !== 0) return scoreDiff;
    return b.rawDate - a.rawDate;
  });
}
