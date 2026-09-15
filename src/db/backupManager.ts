// Enterprise Database Snapshot & CSV / JSON Reporting Manager
import { assetCoreDB } from './indexedDB';
import { Employee, Computer, CompanyAsset, ServiceRecord } from '../types';

export interface SnapshotMetadata {
  id: string;
  timestamp: string;
  recordCount: number;
  label: string;
}

/**
 * Triggers a browser download of the complete system database as a timestamped JSON file.
 */
export async function downloadDatabaseBackup(): Promise<{ success: boolean; filename?: string; error?: string }> {
  try {
    const dump = await assetCoreDB.exportCompleteDatabase();
    const jsonStr = JSON.stringify(dump, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `AssetCore_Enterprise_Backup_${timestamp}.json`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, filename };
  } catch (err: any) {
    console.error('Backup generation failed:', err);
    return { success: false, error: err?.message || 'Failed to export backup' };
  }
}

/**
 * Restores the system database from an uploaded JSON file.
 */
export async function restoreDatabaseFromFile(file: File): Promise<{ success: boolean; error?: string }> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!data?.data?.employees && !data?.data?.computers) {
      return { success: false, error: 'Unrecognized backup format. Missing core enterprise stores.' };
    }

    await assetCoreDB.importCompleteDatabase(data);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to parse backup file' };
  }
}

/**
 * Exports current Fleet Matrix or Inventory data to CSV
 */
export function exportFleetToCSV(
  employees: Employee[],
  computers: Computer[],
  assets: CompanyAsset[],
  serviceRecords: ServiceRecord[]
): void {
  const headers = [
    'Employee Name',
    'Employee ID',
    'Corporate Badge',
    'Department',
    'Designation',
    'Assigned Computer Asset Tag',
    'Device Name',
    'PC Manufacturer & Model',
    'PC Serial Number',
    'Processor',
    'RAM',
    'Storage',
    'PC Condition',
    'PC Status',
    'Assigned Mobile Phone',
    'Phone IMEI',
    'Phone SIM Number',
    'Mouse Asset',
    'Keyboard Asset',
    'Headset Asset',
    'Lifetime Repair Count',
    'Total Maintenance Spend (INR)',
  ];

  const rows = employees.map(emp => {
    const comp = computers.find(
      c => c.assignedEmployeeId === emp.id || c.assignedEmployeeId === emp.employeeId
    );
    const empAssets = assets.filter(
      a => a.assignedEmployeeId === emp.id || a.assignedEmployeeId === emp.employeeId
    );

    const phone = empAssets.find(a => a.assetType === 'Mobile Phone');
    const mouse = empAssets.find(a => a.assetType === 'Mouse');
    const keyboard = empAssets.find(a => a.assetType === 'Keyboard');
    const headset = empAssets.find(a => a.assetType === 'Headset');

    const services = comp ? serviceRecords.filter(s => s.computerId === comp.id) : [];
    const totalSpend = services.reduce((acc, s) => acc + (Number(s.serviceCost) || 0), 0);

    const escape = (val?: string | number | null) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    return [
      escape(emp.name),
      escape(emp.employeeId),
      escape(emp.companyEmployeeNumber || 'N/A'),
      escape(emp.department),
      escape(emp.designation),
      escape(comp?.assetNumber || 'Unassigned'),
      escape(comp?.deviceName || 'None'),
      escape(comp ? `${comp.manufacturer} ${comp.model}` : 'None'),
      escape(comp?.serialNumber || 'N/A'),
      escape(comp?.processor?.name || 'N/A'),
      escape(comp?.memory?.installedRAM || 'N/A'),
      escape(comp?.storage ? `${comp.storage.total} (${comp.storage.type})` : 'N/A'),
      escape(comp?.condition || 'N/A'),
      escape(comp?.status || 'Available'),
      escape(phone ? `${phone.brand} ${phone.model} (${phone.assetNumber})` : 'None'),
      escape(phone?.imeiNumber || 'N/A'),
      escape(phone?.phoneNumber || 'N/A'),
      escape(mouse ? mouse.assetNumber : 'None'),
      escape(keyboard ? keyboard.assetNumber : 'None'),
      escape(headset ? headset.assetNumber : 'None'),
      escape(services.length),
      escape(totalSpend),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `AssetCore_Fleet_Audit_Report_${timestamp}.csv`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
