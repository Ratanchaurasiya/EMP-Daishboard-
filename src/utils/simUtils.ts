// SIM Card & Telecom Utilities
import { SimCard, SimPurpose, SimRequest, SimStatus } from '../types';

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
