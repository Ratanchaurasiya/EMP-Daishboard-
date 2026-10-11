// Pure In-Memory Client-Side Persistence Engine (Zero Internal Database)
// All client-side data is kept in-memory; IndexedDB is explicitly disabled and deleted.

import {
  Employee,
  Computer,
  CompanyAsset,
  AssetAllocationRecord,
  ServiceRecord,
  AuditLog,
  WeeklyAssetPhotoRecord,
  StoredAssetFile,
  PurchaseRecord,
  AssetRequest,
  SimCard,
  SimRecharge,
  SimRequest,
  ServiceProvider,
  AssetQuery,
} from '../types';
import {
  INITIAL_EMPLOYEES,
  INITIAL_COMPUTERS,
  INITIAL_COMPANY_ASSETS,
  INITIAL_SERVICE_RECORDS,
  INITIAL_ALLOCATION_RECORDS,
  INITIAL_AUDIT_LOGS,
} from '../data/initialSeedData';

const DB_NAME = 'AssetCore_Enterprise_DB';

export type StoreName =
  | 'employees'
  | 'computers'
  | 'assets'
  | 'serviceRecords'
  | 'allocationRecords'
  | 'auditLogs'
  | 'weeklyAssetPhotos'
  | 'uploadedFiles'
  | 'purchases'
  | 'assetRequests'
  | 'simCards'
  | 'simRecharges'
  | 'simRequests'
  | 'serviceProviders'
  | 'assetQueries'
  | 'removedEmployees'
  | 'exitClearances'
  | 'systemSettings';

export interface DatabaseStats {
  connected: boolean;
  dbName: string;
  version: number;
  totalRecords: number;
  storeCounts: Record<string, number>;
  lastSynced: string;
  engine?: string;
  storageEstimate?: {
    usageBytes: number;
    quotaBytes: number;
    percentageUsed: number;
  };
}

class InMemoryStorageManager {
  private stores: Map<StoreName, Map<string, any>> = new Map();

  constructor() {
    this.clearAllStoresSync();
    // Explicitly delete any old browser internal IndexedDB if it exists
    if (typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined') {
      try {
        window.indexedDB.deleteDatabase(DB_NAME);
      } catch {}
    }
  }

  private getStore(storeName: StoreName): Map<string, any> {
    if (!this.stores.has(storeName)) {
      this.stores.set(storeName, new Map());
    }
    return this.stores.get(storeName)!;
  }

  private clearAllStoresSync(): void {
    const allStoreNames: StoreName[] = [
      'employees',
      'computers',
      'assets',
      'serviceRecords',
      'allocationRecords',
      'auditLogs',
      'weeklyAssetPhotos',
      'uploadedFiles',
      'purchases',
      'assetRequests',
      'simCards',
      'simRecharges',
      'simRequests',
      'serviceProviders',
      'assetQueries',
      'removedEmployees',
      'exitClearances',
      'systemSettings',
    ];
    for (const name of allStoreNames) {
      this.stores.set(name, new Map());
    }
  }

  public async getAll<T>(storeName: StoreName): Promise<T[]> {
    const store = this.getStore(storeName);
    return Array.from(store.values()) as T[];
  }

  public async putAll<T>(storeName: StoreName, items: T[]): Promise<void> {
    const store = this.getStore(storeName);
    store.clear();
    for (const item of items) {
      const key = (item as any)?.id || (item as any)?.key || String(Math.random());
      store.set(key, item);
    }
  }

  public async put<T>(storeName: StoreName, item: T): Promise<void> {
    const store = this.getStore(storeName);
    const key = (item as any)?.id || (item as any)?.key || String(Math.random());
    store.set(key, item);
  }

  public async delete(storeName: StoreName, key: string): Promise<void> {
    const store = this.getStore(storeName);
    store.delete(key);
  }

  public async clear(storeName: StoreName): Promise<void> {
    const store = this.getStore(storeName);
    store.clear();
  }

  public async clearAllStores(): Promise<void> {
    this.clearAllStoresSync();
  }

  public async initializeAndMigrate(_storageKey: string): Promise<{
    employees: Employee[];
    computers: Computer[];
    assets: CompanyAsset[];
    serviceRecords: ServiceRecord[];
    allocationRecords: AssetAllocationRecord[];
    auditLogs: AuditLog[];
    weeklyPhotoRecords: WeeklyAssetPhotoRecord[];
    purchases: PurchaseRecord[];
    assetRequests: AssetRequest[];
    simCards: SimCard[];
    simRecharges: SimRecharge[];
    simRequests: SimRequest[];
    serviceProviders: ServiceProvider[];
    assetQueries: AssetQuery[];
  }> {
    return {
      employees: (await this.getAll<Employee>('employees')) || INITIAL_EMPLOYEES,
      computers: (await this.getAll<Computer>('computers')) || INITIAL_COMPUTERS,
      assets: (await this.getAll<CompanyAsset>('assets')) || INITIAL_COMPANY_ASSETS,
      serviceRecords: (await this.getAll<ServiceRecord>('serviceRecords')) || INITIAL_SERVICE_RECORDS,
      allocationRecords: (await this.getAll<AssetAllocationRecord>('allocationRecords')) || INITIAL_ALLOCATION_RECORDS,
      auditLogs: (await this.getAll<AuditLog>('auditLogs')) || INITIAL_AUDIT_LOGS,
      weeklyPhotoRecords: (await this.getAll<WeeklyAssetPhotoRecord>('weeklyAssetPhotos')) || [],
      purchases: (await this.getAll<PurchaseRecord>('purchases')) || [],
      assetRequests: (await this.getAll<AssetRequest>('assetRequests')) || [],
      simCards: (await this.getAll<SimCard>('simCards')) || [],
      simRecharges: (await this.getAll<SimRecharge>('simRecharges')) || [],
      simRequests: (await this.getAll<SimRequest>('simRequests')) || [],
      serviceProviders: (await this.getAll<ServiceProvider>('serviceProviders')) || [],
      assetQueries: (await this.getAll<AssetQuery>('assetQueries')) || [],
    };
  }

  public async saveUploadedFile(fileRecord: StoredAssetFile): Promise<void> {
    await this.put('uploadedFiles', fileRecord);
  }

  public async getUploadedFile(id: string): Promise<StoredAssetFile | null> {
    const store = this.getStore('uploadedFiles');
    return store.get(id) || null;
  }

  public async deleteUploadedFile(id: string): Promise<void> {
    await this.delete('uploadedFiles', id);
  }

  public async getUploadedFilesByEmployee(employeeId: string): Promise<StoredAssetFile[]> {
    const all = await this.getAll<StoredAssetFile>('uploadedFiles');
    return all.filter(f => f.employeeId === employeeId);
  }

  public async getStats(): Promise<DatabaseStats> {
    const counts: Record<string, number> = {};
    let total = 0;

    for (const [name, map] of this.stores.entries()) {
      counts[name] = map.size;
      total += map.size;
    }

    return {
      connected: true,
      dbName: 'In-Memory Storage (Zero Internal DB)',
      version: 0,
      totalRecords: total,
      storeCounts: counts,
      lastSynced: new Date().toISOString(),
      storageEstimate: {
        usageBytes: 0,
        quotaBytes: 1000000000,
        percentageUsed: 0,
      },
    };
  }

  public async exportCompleteDatabase(): Promise<Record<string, any>> {
    const data: Record<string, any[]> = {};
    let totalEntities = 0;

    for (const [name, map] of this.stores.entries()) {
      const items = Array.from(map.values());
      data[name] = items;
      totalEntities += items.length;
    }

    return {
      metadata: {
        system: 'AssetCore In-Memory Management',
        schemaVersion: '2.2.0',
        exportedAt: new Date().toISOString(),
        totalEntities,
      },
      data,
    };
  }

  public async importCompleteDatabase(backupObj: any): Promise<boolean> {
    if (!backupObj?.data) {
      throw new Error('Invalid backup archive structure');
    }

    for (const [storeName, items] of Object.entries(backupObj.data)) {
      if (Array.isArray(items)) {
        await this.putAll(storeName as StoreName, items);
      }
    }
    return true;
  }
}

export const assetCoreDB = new InMemoryStorageManager();
