// SIM Card & Telecom Utilities
import { SimCard, SimPurpose, SimRecharge, SimRequest, SimStatus, SimType } from '../types';

/**
 * Calculates GST amount and Total amount given base recharge and GST percentage.
 */
export function calculateRechargeGst(
  rechargeAmount: number | string,
  gstPercentage: number | string = 18
): {
  rechargeAmount: number;
  gstPercentage: number;
  gstAmount: number;
  totalAmount: number;
} {
  const base = Math.max(0, Number(rechargeAmount) || 0);
  const gst = Math.max(0, Number(gstPercentage) || 0);
  const gstAmount = Number(((base * gst) / 100).toFixed(2));
  const totalAmount = Number((base + gstAmount).toFixed(2));

  return {
    rechargeAmount: base,
    gstPercentage: gst,
    gstAmount,
    totalAmount,
  };
}

/**
 * Formats a currency amount into Indian Rupee format (₹)
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}
export const BASE_MONTHLY_RECHARGE = 399;
export const DEFAULT_GST_PERCENT = 18;

/**
 * Calculates monthly SIM recharge cost breakdown given number of assigned SIMs.
 * Per SIM: Base ₹399 + 18% GST (₹71.82) = ₹470.82 total per SIM
 */
export function calculateSimMonthlyExpense(
  simCount: number,
  baseRatePerSim: number = BASE_MONTHLY_RECHARGE,
  gstPercentage: number = DEFAULT_GST_PERCENT
): {
  simCount: number;
  baseRatePerSim: number;
  gstPercentage: number;
  gstPerSim: number;
  totalPerSim: number;
  baseRecharge: number;
  gstAmount: number;
  totalExpense: number;
} {
  const count = Math.max(0, simCount || 0);
  const baseRate = Math.max(0, Number(baseRatePerSim) || 0);
  const gstPct = Math.max(0, Number(gstPercentage) || 0);

  const gstPerSim = Number(((baseRate * gstPct) / 100).toFixed(2));
  const totalPerSim = Number((baseRate + gstPerSim).toFixed(2));

  const baseRecharge = Number((count * baseRate).toFixed(2));
  const gstAmount = Number(((baseRecharge * gstPct) / 100).toFixed(2));
  const totalExpense = Number((baseRecharge + gstAmount).toFixed(2));

  return {
    simCount: count,
    baseRatePerSim: baseRate,
    gstPercentage: gstPct,
    gstPerSim,
    totalPerSim,
    baseRecharge,
    gstAmount,
    totalExpense,
  };
}

/**
 * Calculates actual completed recharge expense for Active Assigned SIM cards.
 * Sums actual rechargeAmount, gstAmount, and totalAmount from completed simRecharges
 * belonging ONLY to Active Assigned SIMs.
 */
export function calculateActiveSimActualRechargeExpense(
  simCards: SimCard[],
  simRecharges: SimRecharge[]
): {
  simCount: number;
  rechargeCount: number;
  baseRecharge: number;
  gstAmount: number;
  totalExpense: number;
} {
  const activeAssignedSims = getActiveAssignedSimCards(simCards);
  const activeSimIds = new Set(activeAssignedSims.map(s => s.id));

  const activeRecharges = (simRecharges || []).filter(r => activeSimIds.has(r.simId));

  const baseRecharge = activeRecharges.reduce((sum, r) => sum + (Number(r.rechargeAmount) || 0), 0);
  const gstAmount = activeRecharges.reduce((sum, r) => sum + (Number(r.gstAmount) || 0), 0);
  const totalExpense = activeRecharges.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);

  return {
    simCount: activeAssignedSims.length,
    rechargeCount: activeRecharges.length,
    baseRecharge,
    gstAmount,
    totalExpense,
  };
}

export const DEFAULT_ADMIN_WHATSAPP_NUMBER = '9328594724';

/**
 * Returns Tailwind/CSS classes for SIM status badge
 */
export function getSimStatusStyle(status: SimStatus): { bg: string; text: string; border: string; label: string } {
  switch (status) {
    case 'Active':
      return {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-500/30',
        label: 'Active',
      };
    case 'Assigned':
      return {
        bg: 'bg-blue-500/10 dark:bg-blue-500/20',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-500/30',
        label: 'Assigned',
      };
    case 'Suspended':
      return {
        bg: 'bg-rose-500/10 dark:bg-rose-500/20',
        text: 'text-rose-700 dark:text-rose-400',
        border: 'border-rose-500/30',
        label: 'Suspended',
      };
    case 'Deactivated':
      return {
        bg: 'bg-zinc-500/10 dark:bg-zinc-500/20',
        text: 'text-zinc-600 dark:text-zinc-400',
        border: 'border-zinc-500/30',
        label: 'Deactivated',
      };
    case 'Available':
    default:
      return {
        bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
        text: 'text-cyan-700 dark:text-cyan-400',
        border: 'border-cyan-500/30',
        label: 'Available (In Stock)',
      };
  }
}

/**
 * Returns color classes for SIM purpose badge
 */
export function getSimPurposeStyle(purpose: SimPurpose | string): { bg: string; text: string; border: string } {
  switch (purpose) {
    case 'WhatsApp':
    case 'WhatsApp Marketing':
      return {
        bg: 'bg-green-500/10 dark:bg-green-500/20',
        text: 'text-green-700 dark:text-green-400',
        border: 'border-green-500/30',
      };
    case 'Marketing':
      return {
        bg: 'bg-teal-500/10 dark:bg-teal-500/20',
        text: 'text-teal-700 dark:text-teal-400',
        border: 'border-teal-500/30',
      };
    case 'Calling':
      return {
        bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
        text: 'text-indigo-700 dark:text-indigo-400',
        border: 'border-indigo-500/30',
      };
    case 'Incoming':
      return {
        bg: 'bg-sky-500/10 dark:bg-sky-500/20',
        text: 'text-sky-700 dark:text-sky-400',
        border: 'border-sky-500/30',
      };
    case 'CP':
      return {
        bg: 'bg-purple-500/10 dark:bg-purple-500/20',
        text: 'text-purple-700 dark:text-purple-400',
        border: 'border-purple-500/30',
      };
    case 'Holding':
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-500/30',
      };
    case 'Other':
    default:
      return {
        bg: 'bg-zinc-500/10 dark:bg-zinc-500/20',
        text: 'text-zinc-700 dark:text-zinc-400',
        border: 'border-zinc-500/30',
      };
  }
}

/**
 * Returns color classes for SIM Type badge (Prepaid vs Postpaid)
 */
export function getSimTypeBadgeStyle(simType?: SimType | string): { bg: string; text: string; border: string; label: string } {
  if (simType === 'Postpaid') {
    return {
      bg: 'bg-purple-500/10 dark:bg-purple-950/40',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-500/30',
      label: 'Postpaid',
    };
  }
  return {
    bg: 'bg-blue-500/10 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-500/30',
    label: 'Prepaid',
  };
}

/**
 * Generates WhatsApp notification URL for SIM requests (targeting Admin: 9328594724)
 */
export function generateSimRequestWhatsAppUrl(
  request: SimRequest,
  recipientPhone: string = DEFAULT_ADMIN_WHATSAPP_NUMBER
): string {
  const isSuspension = request.requestType === 'Suspend SIM';
  const header = isSuspension
    ? `🚨 *ASSETCORE: SIM SUSPENSION REQUEST*`
    : `📱 *ASSETCORE: NEW SIM CARD REQUEST*`;

  const lines = [
    header,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `👤 *Employee Name:* ${request.employeeName}`,
    `🆔 *Employee ID:* ${request.companyEmployeeNumber || request.employeeId}`,
  ];

  if (!isSuspension) {
    lines.push(`🔢 *Requested SIM Quantity:* ${request.quantity || 1}`);
    const purposeText = request.purpose === 'Other' && request.customPurpose
      ? `Other (${request.customPurpose})`
      : request.purpose || 'General';
    lines.push(`🎯 *Purpose:* ${purposeText}`);
    lines.push(`📁 *Project:* ${request.project || 'General Operations'}`);
  } else {
    if (request.contactNumber) {
      lines.push(`📞 *SIM / Mobile Number:* ${request.contactNumber}`);
    }
    if (request.project) {
      lines.push(`📁 *Project:* ${request.project}`);
    }
  }

  lines.push(`📝 *Reason:* ${request.reason}`);
  if (request.remarks) {
    lines.push(`💬 *Remarks:* ${request.remarks}`);
  }
  lines.push(`📅 *Request Date/Time:* ${new Date(request.createdAt).toLocaleString('en-IN')}`);
  lines.push(`🔑 *Request ID:* ${request.id}`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`🔗 *Review in Admin Panel:* ${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5174'}/#/sim-management`);

  const message = lines.join('\n');
  const encoded = encodeURIComponent(message);
  
  const cleanPhone = recipientPhone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encoded}`;
}

/**
 * Generates WhatsApp notification URL for SIM suspension
 */
export function generateSimSuspensionWhatsAppUrl(
  sim: SimCard,
  reason: string,
  requesterName?: string,
  recipientPhone: string = DEFAULT_ADMIN_WHATSAPP_NUMBER
): string {
  const lines = [
    `🚨 *ASSETCORE: SIM CARD SUSPENSION*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📞 *SIM / Mobile Number:* ${sim.contactNumber}`,
    `👤 *Assigned Employee:* ${sim.assignedEmployeeName || 'Unassigned'} (${sim.assignedEmployeeId || 'N/A'})`,
    `📁 *Project:* ${sim.project || 'General Operations'}`,
    `🎯 *Purpose:* ${sim.purpose === 'Other' && sim.customPurpose ? `Other (${sim.customPurpose})` : sim.purpose}`,
    `⚠️ *Mandatory Reason:* ${reason}`,
    `👤 *Action Initiated By:* ${requesterName || 'Employee / Admin'}`,
    `📅 *Date/Time:* ${new Date().toLocaleString('en-IN')}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🔗 *Review in Admin Panel:* ${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5174'}/#/sim-management`,
  ];

  const message = lines.join('\n');
  const encoded = encodeURIComponent(message);
  const cleanPhone = recipientPhone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encoded}`;
}

/**
 * Generates WhatsApp notification URL for SIM Issue Reports
 */
export function generateSimIssueWhatsAppUrl(
  request: SimRequest,
  recipientPhone: string = DEFAULT_ADMIN_WHATSAPP_NUMBER,
  senderRole: 'employee' | 'admin' = 'employee'
): string {
  const isEmployee = senderRole === 'employee';
  const header = isEmployee
    ? `🚨 *ASSETCORE: SIM ISSUE REPORT*`
    : `🔴 *SIM ISSUE ALERT*`;

  const lines = [
    header,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `👤 *Employee:* ${request.employeeName} (${request.companyEmployeeNumber || request.employeeId})`,
    `📞 *SIM / Contact Number:* ${request.contactNumber || 'N/A'}`,
    `📁 *Project:* ${request.project || 'General Operations'}`,
    `⚠️ *Issue Type:* ${request.issueType || 'SIM Issue'}`,
    `🔥 *Priority:* ${request.urgency || 'Normal'}`,
    `📝 *Description:* ${request.reason}`,
  ];

  if (request.adminRemarks) {
    lines.push(`💬 *Admin Remarks:* ${request.adminRemarks}`);
  }
  if (request.resolutionRemarks) {
    lines.push(`🟢 *Resolution:* ${request.resolutionRemarks}`);
  }

  lines.push(`📅 *Recorded:* ${new Date(request.createdAt).toLocaleString('en-IN')}`);
  lines.push(`🔑 *Ticket ID:* ${request.id}`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`Please check and resolve this SIM issue.`);

  const message = lines.join('\n');
  const encoded = encodeURIComponent(message);
  const cleanPhone = recipientPhone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encoded}`;
}

/**
 * Generates direct WhatsApp chat URL with custom text
 */
export function generateDirectWhatsAppUrl(recipientPhone: string, message: string): string {
  const cleanPhone = recipientPhone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
}

/**
 * Determines if a SIM card is currently an Active Assigned SIM.
 * STRICT REQUIREMENTS:
 * - Must be assigned to an employee/user (assignedEmployeeId != null)
 * - Status must be 'Active' or 'Assigned'
 * - EXCLUDES: Buffer SIMs, Available/unassigned SIMs, Blocked/Suspended SIMs, Inactive SIMs, Deactivated/returned SIMs
 */
export function isActiveAssignedSim(sim?: SimCard | null): boolean {
  if (!sim) return false;
  if (!sim.assignedEmployeeId || !sim.assignedEmployeeId.trim()) return false;
  if (sim.status === 'Available' || sim.status === 'Suspended' || sim.status === 'Deactivated') return false;
  return sim.status === 'Active' || sim.status === 'Assigned';
}

/**
 * Returns all currently Active Assigned SIM Cards across the entire fleet.
 * Excludes buffer stock, unassigned SIMs, suspended lines, and deactivated lines.
 */
export function getActiveAssignedSimCards(simCards: SimCard[]): SimCard[] {
  if (!simCards) return [];
  return simCards.filter(isActiveAssignedSim);
}

/**
 * Resolves all Active Assigned SIM cards for a specific employee.
 * Multiple active SIMs assigned to the same employee are all included.
 * Suspended, unassigned, or deactivated SIMs are excluded.
 */
export function getEmployeeActiveSimCards(
  emp: { id?: string; employeeId?: string; name?: string } | null | undefined,
  simCards: SimCard[]
): SimCard[] {
  return getEmployeeSimCards(emp, simCards).filter(isActiveAssignedSim);
}

/**
 * Resolves all SIM cards assigned to an employee based on ID, Employee Code, or Name.
 * Only active corporate allocations are counted (status !== 'Deactivated').
 */
export function getEmployeeSimCards(
  emp: { id?: string; employeeId?: string; name?: string } | null | undefined,
  simCards: SimCard[]
): SimCard[] {
  if (!emp || !simCards) return [];
  const targetIds = new Set([emp.id, emp.employeeId].filter(Boolean) as string[]);
  const empNameLower = (emp.name || '').trim().toLowerCase();

  return simCards.filter(s => {
    if (s.status === 'Deactivated') return false;
    if (s.assignedEmployeeId && targetIds.has(s.assignedEmployeeId)) return true;
    if (empNameLower && s.assignedEmployeeName && s.assignedEmployeeName.trim().toLowerCase() === empNameLower) {
      return true;
    }
    return false;
  });
}

/**
 * Returns count of assigned SIM cards for an employee
 */
export function getEmployeeSimCount(
  emp: { id?: string; employeeId?: string; name?: string } | null | undefined,
  simCards: SimCard[]
): number {
  return getEmployeeSimCards(emp, simCards).length;
}

export type SimUsageFilterType = 'all' | '1' | '2' | '3' | '3+' | '4+' | '0';

/**
 * Returns the usage category bucket for a given SIM count
 */
export function getSimUsageCategory(count: number): '0' | '1' | '2' | '3' | '4+' {
  if (count <= 0) return '0';
  if (count === 1) return '1';
  if (count === 2) return '2';
  if (count === 3) return '3';
  return '4+';
}

/**
 * Returns styling and label for SIM usage count badge
 */
export function getSimUsageBadgeStyle(count: number): {
  label: string;
  shortLabel: string;
  bg: string;
  text: string;
  border: string;
  dotColor: string;
} {
  if (count === 0) {
    return {
      label: 'No SIM Assigned',
      shortLabel: 'No SIM',
      bg: 'bg-zinc-500/10 dark:bg-zinc-800/60',
      text: 'text-zinc-600 dark:text-zinc-400',
      border: 'border-zinc-300 dark:border-zinc-700',
      dotColor: 'bg-zinc-400',
    };
  }
  if (count === 1) {
    return {
      label: '1 Corporate SIM',
      shortLabel: '1 SIM',
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-500/30',
      dotColor: 'bg-blue-500',
    };
  }
  if (count === 2) {
    return {
      label: '2 Corporate SIMs',
      shortLabel: '2 SIMs',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    };
  }
  if (count === 3) {
    return {
      label: '3 Corporate SIMs',
      shortLabel: '3 SIMs',
      bg: 'bg-purple-500/10 dark:bg-purple-500/20',
      text: 'text-purple-700 dark:text-purple-400',
      border: 'border-purple-500/30',
      dotColor: 'bg-purple-500',
    };
  }
  return {
    label: `${count} SIMs (Power User)`,
    shortLabel: `${count} SIMs`,
    bg: 'bg-orange-500/10 dark:bg-orange-500/20',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-500/30',
    dotColor: 'bg-orange-500',
  };
}
