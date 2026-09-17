import { Employee, Computer, CompanyAsset, AssetCondition, AssetStatus, AssetType } from '../types';

export interface UnifiedAssignedAsset {
  id: string;
  source: 'computer' | 'asset';
  assetType: AssetType;
  assetNumber: string;
  brand: string;
  model: string;
  deviceName?: string;
  serialNumber: string;
  imeiNumber?: string;
  phoneNumber?: string;
  assignedDate: string;
  condition: AssetCondition;
  status: AssetStatus;
  relevantDetails: string;
  specPill?: string;
  isComputer?: boolean;
  isPhone?: boolean;
  originalAssetId?: string;
  originalComputerId?: string;
  securityFunctionAdded?: 'Yes' | 'No';
  securityFunctionAddedDate?: string;
}

/**
 * Returns only the actual company assets and computer hardware currently assigned
 * to an employee in the database. Never synthesizes phantom/dummy assets.
 */
export function getEmployeeAssignedCompanyAssets(
  employee: Employee | null,
  assignedComputerOrComputers: Computer | Computer[] | null | undefined,
  assets: CompanyAsset[]
): UnifiedAssignedAsset[] {
  if (!employee) return [];

  const list: UnifiedAssignedAsset[] = [];
  const targetIds = new Set(
    [employee.id, employee.employeeId]
      .filter((id): id is string => Boolean(id))
      .map(id => id.trim().toLowerCase())
  );

  const isEmployeeMatch = (assignedId?: string | null) => {
    if (!assignedId) return false;
    return targetIds.has(assignedId.trim().toLowerCase());
  };

  const registeredAssetNumbers = new Set<string>();

  // 1. Laptop / Desktop Workstations assigned to employee
  const computerList: Computer[] = Array.isArray(assignedComputerOrComputers)
    ? assignedComputerOrComputers.filter(
        c => isEmployeeMatch(c.assignedEmployeeId) && c.status !== 'Returned' && c.status !== 'Available'
      )
    : assignedComputerOrComputers &&
      isEmployeeMatch(assignedComputerOrComputers.assignedEmployeeId) &&
      assignedComputerOrComputers.status !== 'Returned' &&
      assignedComputerOrComputers.status !== 'Available'
    ? [assignedComputerOrComputers]
    : [];

  for (const comp of computerList) {
    const normAssetNum = comp.assetNumber?.trim().toLowerCase();
    if (normAssetNum) registeredAssetNumbers.add(normAssetNum);

    list.push({
      id: `comp-${comp.id}`,
      source: 'computer',
      assetType: comp.deviceType,
      assetNumber: comp.assetNumber,
      brand: comp.manufacturer,
      model: comp.model,
      deviceName: comp.deviceName || `${comp.manufacturer} ${comp.model}`,
      serialNumber: comp.serialNumber,
      assignedDate: comp.assignedDate || employee.joiningDate,
      condition: comp.condition,
      status: comp.status,
      relevantDetails: comp.processor?.name
        ? `${comp.processor.name} • ${comp.memory?.installedRAM || ''} RAM • ${comp.storage?.total || ''} ${comp.storage?.type || ''} • ${comp.system?.os || ''}`
        : `${comp.manufacturer || 'System'} ${comp.model || 'Workstation'}`,
      specPill: comp.memory?.installedRAM ? `${comp.memory.installedRAM} RAM / ${comp.storage?.total || ''}` : (comp.deviceType || 'Workstation'),
      isComputer: true,
      originalComputerId: comp.id,
      securityFunctionAdded: comp.securityFunctionAdded,
      securityFunctionAddedDate: comp.securityFunctionAddedDate,
    });
  }

  // 2. Real company assets (peripherals, mobile phones, monitors, laptops, etc.) assigned to this employee
  const empAssets = assets.filter(
    a => isEmployeeMatch(a.assignedEmployeeId) && a.status !== 'Returned' && a.status !== 'Available'
  );

  for (const a of empAssets) {
    const aNum = a.assetNumber?.trim().toLowerCase();
    // Avoid duplicate if this computer/asset is already tracked via computerList
    if (aNum && registeredAssetNumbers.has(aNum)) {
      continue;
    }
    if (aNum) registeredAssetNumbers.add(aNum);

    const isComputer = a.assetType === 'Laptop' || a.assetType === 'Desktop';
    const isPhone = a.assetType === 'Mobile Phone';

    let specPill: string | undefined = a.assetType;
    if (isPhone) {
      specPill = a.phoneNumber ? `📞 ${a.phoneNumber}` : '5G Cellular';
    } else if (a.assetType === 'Keyboard') {
      specPill = 'USB Wired / Chiclet';
    } else if (a.assetType === 'Mouse') {
      specPill = '1000 DPI Optical';
    } else if (a.assetType === 'Headset') {
      specPill = 'USB-A Stereo / Mic';
    } else if (a.assetType === 'Monitor') {
      specPill = 'External Display';
    }

    list.push({
      id: `asset-${a.id}`,
      source: 'asset',
      assetType: a.assetType,
      assetNumber: a.assetNumber,
      brand: a.brand,
      model: a.model,
      deviceName: a.deviceName || `${a.brand} ${a.model}`,
      serialNumber: a.imeiNumber || a.serialNumber,
      imeiNumber: a.imeiNumber,
      phoneNumber: a.phoneNumber,
      assignedDate: a.assignedDate || employee.joiningDate,
      condition: a.condition,
      status: a.status,
      relevantDetails:
        a.remarks ||
        (isPhone
          ? `Corporate Mobile Device • ${a.phoneNumber ? `Phone: ${a.phoneNumber}` : 'Active SIM'} • IMEI: ${a.imeiNumber || a.serialNumber}`
          : `${a.brand} ${a.model} (${a.assetType})`),
      specPill,
      isComputer,
      isPhone,
      originalAssetId: a.id,
      securityFunctionAdded: a.securityFunctionAdded,
      securityFunctionAddedDate: a.securityFunctionAddedDate,
    });
  }

  return list;
}
