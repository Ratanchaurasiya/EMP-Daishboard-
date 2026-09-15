// Professional formatting utilities for Employee & Asset Management Dashboard

export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateDisplay(dateStr?: string | null): string {
  if (!dateStr) return '—';
  
  // If already in DD-MM-YYYY format
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    return dateStr;
  }
  
  // If in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  }

  // General date parsing
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export function maskSensitive(value: string, isAdmin: boolean): string {
  if (isAdmin) return value;
  return '••••••••-••••-•••• [RESTRICTED - IT ADMIN ONLY]';
}

/**
 * Extracts the first 6 digits of an employee's personal contact number.
 * E.g., "+91 98765 43210" -> "987654"
 */
export function getEmployeePhoneFirst6(phone?: string | null): string {
  if (!phone) return '987654';
  const digits = phone.replace(/\D/g, '');
  // If Indian country code (+91) followed by 10-digit mobile number
  if (digits.length > 10 && digits.startsWith('91')) {
    return digits.slice(2, 8);
  }
  if (digits.length >= 10) {
    return digits.slice(-10).slice(0, 6);
  }
  return digits.slice(0, 6) || '987654';
}

export function formatFileSize(bytes?: number | null): string {
  if (!bytes || isNaN(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(val < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

