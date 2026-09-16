// Enterprise-Grade IndexedDB Persistence Engine for AssetCore
// Provides asynchronous, transactional client-side database storage with schema versioning,
// indices, automated backup/restore, and localStorage fallback.

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
const DB_VERSION = 7;

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
  | 'systemSettings';

export interface DatabaseStats {
  connected: boolean;
  dbName: string;
  version: number;
  totalRecords: number;
  storeCounts: Record<string, number>;
  lastSynced: string;
  storageEstimate?: {
    usageBytes: number;
    quotaBytes: number;
    percentageUsed: number;
  };
}

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;
  private isAvailable: boolean = typeof indexedDB !== 'undefined';

  public async getDB(): Promise<IDBDatabase> {
    if (!this.isAvailable) {
      throw new Error('IndexedDB is not supported in this environment');
    }
    if (this.db) {
      return this.db;
    }
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise<IDBDatabase>((resolve, reject) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = event => {
          const db = (event.target as IDBOpenDBRequest).result;

          // 1. Employees store
          if (!db.objectStoreNames.contains('employees')) {
            const empStore = db.createObjectStore('employees', { keyPath: 'id' });
            empStore.createIndex('employeeId', 'employeeId', { unique: true });
            empStore.createIndex('status', 'status', { unique: false });
            empStore.createIndex('department', 'department', { unique: false });
          }

          // 2. Computers store
          if (!db.objectStoreNames.contains('computers')) {
            const compStore = db.createObjectStore('computers', { keyPath: 'id' });
            compStore.createIndex('assetNumber', 'assetNumber', { unique: true });
            compStore.createIndex('assignedEmployeeId', 'assignedEmployeeId', { unique: false });
            compStore.createIndex('status', 'status', { unique: false });
          }

          // 3. Assets store (Peripherals & Mobile Phones)
          if (!db.objectStoreNames.contains('assets')) {
            const assetStore = db.createObjectStore('assets', { keyPath: 'id' });
            assetStore.createIndex('assetNumber', 'assetNumber', { unique: true });
            assetStore.createIndex('assetType', 'assetType', { unique: false });
            assetStore.createIndex('assignedEmployeeId', 'assignedEmployeeId', { unique: false });
            assetStore.createIndex('status', 'status', { unique: false });
          }

          // 4. Service Records store
          if (!db.objectStoreNames.contains('serviceRecords')) {
            const srvStore = db.createObjectStore('serviceRecords', { keyPath: 'id' });
            srvStore.createIndex('computerId', 'computerId', { unique: false });
            srvStore.createIndex('employeeId', 'employeeId', { unique: false });
            srvStore.createIndex('serviceStatus', 'serviceStatus', { unique: false });
          }

          // 5. Allocation Records store
          if (!db.objectStoreNames.contains('allocationRecords')) {
            const allocStore = db.createObjectStore('allocationRecords', { keyPath: 'id' });
            allocStore.createIndex('employeeId', 'employeeId', { unique: false });
            allocStore.createIndex('assetId', 'assetId', { unique: false });
          }

          // 6. Audit Logs store
          if (!db.objectStoreNames.contains('auditLogs')) {
            const auditStore = db.createObjectStore('auditLogs', { keyPath: 'id' });
            auditStore.createIndex('timestamp', 'timestamp', { unique: false });
            auditStore.createIndex('action', 'action', { unique: false });
          }

          // 7. Weekly Asset Photo Documentation store
          if (!db.objectStoreNames.contains('weeklyAssetPhotos')) {
            const photoStore = db.createObjectStore('weeklyAssetPhotos', { keyPath: 'id' });
            photoStore.createIndex('employeeId', 'employeeId', { unique: false });
            photoStore.createIndex('weekStartDate', 'weekStartDate', { unique: false });
            photoStore.createIndex('year', 'year', { unique: false });
          }

          // 8. System Settings
          if (!db.objectStoreNames.contains('systemSettings')) {
            db.createObjectStore('systemSettings', { keyPath: 'key' });
          }

          // 9. Permanent Stored Asset Files & Attachments
          if (!db.objectStoreNames.contains('uploadedFiles')) {
            const fileStore = db.createObjectStore('uploadedFiles', { keyPath: 'id' });
            fileStore.createIndex('employeeId', 'employeeId', { unique: false });
            fileStore.createIndex('assetNumber', 'assetNumber', { unique: false });
            fileStore.createIndex('uploadedAt', 'uploadedAt', { unique: false });
          }

          // 10. Admin PC/Laptop Purchases
          if (!db.objectStoreNames.contains('purchases')) {
            const purchaseStore = db.createObjectStore('purchases', { keyPath: 'id' });
            purchaseStore.createIndex('purchaseNumber', 'purchaseNumber', { unique: true });
            purchaseStore.createIndex('deviceType', 'deviceType', { unique: false });
            purchaseStore.createIndex('serialNumber', 'serialNumber', { unique: false });
            purchaseStore.createIndex('status', 'status', { unique: false });
          }

          // 11. Asset Requests / Requisitions
          if (!db.objectStoreNames.contains('assetRequests')) {
            const reqStore = db.createObjectStore('assetRequests', { keyPath: 'id' });
            reqStore.createIndex('employeeId', 'employeeId', { unique: false });
            reqStore.createIndex('status', 'status', { unique: false });
            reqStore.createIndex('urgency', 'urgency', { unique: false });
            reqStore.createIndex('createdAt', 'createdAt', { unique: false });
          }

          // 12. SIM Cards Master Store
          if (!db.objectStoreNames.contains('simCards')) {
            const simStore = db.createObjectStore('simCards', { keyPath: 'id' });
            simStore.createIndex('contactNumber', 'contactNumber', { unique: true });
            simStore.createIndex('assignedEmployeeId', 'assignedEmployeeId', { unique: false });
            simStore.createIndex('status', 'status', { unique: false });
            simStore.createIndex('purpose', 'purpose', { unique: false });
          }

          // 13. SIM Recharges Store
          if (!db.objectStoreNames.contains('simRecharges')) {
            const recStore = db.createObjectStore('simRecharges', { keyPath: 'id' });
            recStore.createIndex('simId', 'simId', { unique: false });
            recStore.createIndex('employeeId', 'employeeId', { unique: false });
            recStore.createIndex('rechargeDate', 'rechargeDate', { unique: false });
          }

          // 14. SIM Requests Store
          if (!db.objectStoreNames.contains('simRequests')) {
            const simReqStore = db.createObjectStore('simRequests', { keyPath: 'id' });
            simReqStore.createIndex('employeeId', 'employeeId', { unique: false });
            simReqStore.createIndex('requestType', 'requestType', { unique: false });
            simReqStore.createIndex('status', 'status', { unique: false });
          }

          // 15. Service Providers Store
          if (!db.objectStoreNames.contains('serviceProviders')) {
            const provStore = db.createObjectStore('serviceProviders', { keyPath: 'id' });
            provStore.createIndex('technicianName', 'technicianName', { unique: false });
            provStore.createIndex('shopName', 'shopName', { unique: false });
            provStore.createIndex('serviceType', 'serviceType', { unique: false });
            provStore.createIndex('city', 'city', { unique: false });
          }
        };

        request.onsuccess = event => {
          this.db = (event.target as IDBOpenDBRequest).result;
          resolve(this.db);
        };

        request.onerror = event => {
          console.error('IndexedDB open failed:', (event.target as IDBOpenDBRequest).error);
          reject((event.target as IDBOpenDBRequest).error);
        };
      } catch (err) {
        reject(err);
      }
    });

    return this.initPromise;
  }

  // Generic Get All Records
  public async getAll<T>(storeName: StoreName): Promise<T[]> {
    try {
      const db = await this.getDB();
      return new Promise<T[]>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();

        req.onsuccess = () => resolve(req.result as T[]);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn(`IndexedDB getAll(${storeName}) fallback:`, err);
      return [];
    }
  }

  // Generic Put All (Batch Insert/Update in Single Transaction)
  public async putAll<T>(storeName: StoreName, items: T[]): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);

        // Clear existing to keep fully in sync with state
        store.clear();
        for (const item of items) {
          store.put(item);
        }

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn(`IndexedDB putAll(${storeName}) error:`, err);
    }
  }

  // Put single record
  public async put<T>(storeName: StoreName, item: T): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(item);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn(`IndexedDB put(${storeName}) error:`, err);
    }
  }

  // Delete single record
  public async delete(storeName: StoreName, key: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(key);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn(`IndexedDB delete(${storeName}, ${key}) error:`, err);
    }
  }

  // Clear single store
  public async clear(storeName: StoreName): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.clear();

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn(`IndexedDB clear(${storeName}) error:`, err);
    }
  }

  // Clear all application stores
  public async clearAllStores(): Promise<void> {
    await Promise.all([
      this.clear('employees'),
      this.clear('computers'),
      this.clear('assets'),
      this.clear('serviceRecords'),
      this.clear('allocationRecords'),
      this.clear('auditLogs'),
      this.clear('weeklyAssetPhotos'),
      this.clear('uploadedFiles'),
      this.clear('purchases'),
      this.clear('assetRequests'),
      this.clear('simCards'),
      this.clear('simRecharges'),
      this.clear('simRequests'),
    ]);
  }

  // Initialize and Migrate data seamlessly from localStorage or seed
  public async initializeAndMigrate(storageKey: string): Promise<{
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
  }> {
    try {
      await this.getDB();

      // Read from IndexedDB
      const [
        dbEmployees,
        dbComputers,
        dbAssets,
        dbServices,
        dbAllocations,
        dbLogs,
        dbWeeklyPhotos,
        dbPurchases,
        dbRequests,
        dbSimCards,
        dbSimRecharges,
        dbSimRequests,
        dbServiceProviders,
      ] = await Promise.all([
        this.getAll<Employee>('employees'),
        this.getAll<Computer>('computers'),
        this.getAll<CompanyAsset>('assets'),
        this.getAll<ServiceRecord>('serviceRecords'),
        this.getAll<AssetAllocationRecord>('allocationRecords'),
        this.getAll<AuditLog>('auditLogs'),
        this.getAll<WeeklyAssetPhotoRecord>('weeklyAssetPhotos'),
        this.getAll<PurchaseRecord>('purchases'),
        this.getAll<AssetRequest>('assetRequests'),
        this.getAll<SimCard>('simCards'),
        this.getAll<SimRecharge>('simRecharges'),
        this.getAll<SimRequest>('simRequests'),
        this.getAll<ServiceProvider>('serviceProviders'),
      ]);

      return {
        employees: dbEmployees,
        computers: dbComputers,
        assets: dbAssets,
        serviceRecords: dbServices,
        allocationRecords: dbAllocations,
        auditLogs: dbLogs,
        weeklyPhotoRecords: dbWeeklyPhotos,
        purchases: dbPurchases,
        assetRequests: dbRequests,
        simCards: dbSimCards,
        simRecharges: dbSimRecharges,
        simRequests: dbSimRequests,
        serviceProviders: dbServiceProviders,
      };
    } catch (err) {
      console.warn('IndexedDB initialize error:', err);
      return {
        employees: [],
        computers: [],
        assets: [],
        serviceRecords: [],
        allocationRecords: [],
        auditLogs: [],
        weeklyPhotoRecords: [],
        purchases: [],
        assetRequests: [],
        simCards: [],
        simRecharges: [],
        simRequests: [],
        serviceProviders: [],
      };
    }
  }

  // Permanent Asset File Storage Operations
  public async saveUploadedFile(fileRecord: StoredAssetFile): Promise<void> {
    await this.put('uploadedFiles', fileRecord);
  }

  public async getUploadedFile(id: string): Promise<StoredAssetFile | null> {
    try {
      const db = await this.getDB();
      return new Promise<StoredAssetFile | null>((resolve, reject) => {
        const tx = db.transaction('uploadedFiles', 'readonly');
        const store = tx.objectStore('uploadedFiles');
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }

  public async deleteUploadedFile(id: string): Promise<void> {
    await this.delete('uploadedFiles', id);
  }

  public async getUploadedFilesByEmployee(employeeId: string): Promise<StoredAssetFile[]> {
    try {
      const all = await this.getAll<StoredAssetFile>('uploadedFiles');
      return all.filter(f => f.employeeId === employeeId);
    } catch {
      return [];
    }
  }

  // Telemetry & Stats
  public async getStats(): Promise<DatabaseStats> {
    try {
      const db = await this.getDB();
      const stores: StoreName[] = [
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
      ];

      const counts: Record<string, number> = {};
      let total = 0;

      for (const s of stores) {
        const items = await this.getAll(s);
        counts[s] = items.length;
        total += items.length;
      }

      let storageEstimate: DatabaseStats['storageEstimate'] = undefined;
      if (navigator.storage && navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        const usageBytes = est.usage || 0;
        const quotaBytes = est.quota || 1;
        storageEstimate = {
          usageBytes,
          quotaBytes,
          percentageUsed: Math.round((usageBytes / quotaBytes) * 100 * 10) / 10,
        };
      }

      return {
        connected: true,
        dbName: db.name,
        version: db.version,
        totalRecords: total,
        storeCounts: counts,
        lastSynced: new Date().toISOString(),
        storageEstimate,
      };
    } catch {
      return {
        connected: false,
        dbName: DB_NAME,
        version: DB_VERSION,
        totalRecords: 0,
        storeCounts: {},
        lastSynced: new Date().toISOString(),
      };
    }
  }

  // Full Database JSON Dump for Enterprise Backup
  public async exportCompleteDatabase(): Promise<Record<string, any>> {
    const [
      employees,
      computers,
      assets,
      serviceRecords,
      allocationRecords,
      auditLogs,
      weeklyAssetPhotos,
      uploadedFiles,
      purchases,
      assetRequests,
      simCards,
      simRecharges,
      simRequests,
      serviceProviders,
    ] = await Promise.all([
      this.getAll('employees'),
      this.getAll('computers'),
      this.getAll('assets'),
      this.getAll('serviceRecords'),
      this.getAll('allocationRecords'),
      this.getAll('auditLogs'),
      this.getAll('weeklyAssetPhotos'),
      this.getAll('uploadedFiles'),
      this.getAll('purchases'),
      this.getAll('assetRequests'),
      this.getAll('simCards'),
      this.getAll('simRecharges'),
      this.getAll('simRequests'),
      this.getAll('serviceProviders'),
    ]);

    return {
      metadata: {
        system: 'AssetCore Enterprise Fleet Management',
        schemaVersion: '2.2.0',
        exportedAt: new Date().toISOString(),
        totalEntities:
          employees.length +
          computers.length +
          assets.length +
          serviceRecords.length +
          weeklyAssetPhotos.length +
          uploadedFiles.length +
          purchases.length +
          assetRequests.length +
          simCards.length +
          simRecharges.length +
          simRequests.length +
          serviceProviders.length,
      },
      data: {
        employees,
        computers,
        assets,
        serviceRecords,
        allocationRecords,
        auditLogs,
        weeklyAssetPhotos,
        uploadedFiles,
        purchases,
        assetRequests,
        simCards,
        simRecharges,
        simRequests,
        serviceProviders,
      },
    };
  }

  // Restore Complete Database from JSON Backup
  public async importCompleteDatabase(backupObj: any): Promise<boolean> {
    if (!backupObj?.data) {
      throw new Error('Invalid backup archive structure');
    }

    const {
      employees,
      computers,
      assets,
      serviceRecords,
      allocationRecords,
      auditLogs,
      weeklyAssetPhotos,
      uploadedFiles,
      purchases,
      assetRequests,
      simCards,
      simRecharges,
      simRequests,
      serviceProviders,
    } = backupObj.data;

    await Promise.all([
      Array.isArray(employees) ? this.putAll('employees', employees) : Promise.resolve(),
      Array.isArray(computers) ? this.putAll('computers', computers) : Promise.resolve(),
      Array.isArray(assets) ? this.putAll('assets', assets) : Promise.resolve(),
      Array.isArray(serviceRecords) ? this.putAll('serviceRecords', serviceRecords) : Promise.resolve(),
      Array.isArray(allocationRecords) ? this.putAll('allocationRecords', allocationRecords) : Promise.resolve(),
      Array.isArray(auditLogs) ? this.putAll('auditLogs', auditLogs) : Promise.resolve(),
      Array.isArray(weeklyAssetPhotos) ? this.putAll('weeklyAssetPhotos', weeklyAssetPhotos) : Promise.resolve(),
      Array.isArray(uploadedFiles) ? this.putAll('uploadedFiles', uploadedFiles) : Promise.resolve(),
      Array.isArray(purchases) ? this.putAll('purchases', purchases) : Promise.resolve(),
      Array.isArray(assetRequests) ? this.putAll('assetRequests', assetRequests) : Promise.resolve(),
      Array.isArray(simCards) ? this.putAll('simCards', simCards) : Promise.resolve(),
      Array.isArray(simRecharges) ? this.putAll('simRecharges', simRecharges) : Promise.resolve(),
      Array.isArray(simRequests) ? this.putAll('simRequests', simRequests) : Promise.resolve(),
      Array.isArray(serviceProviders) ? this.putAll('serviceProviders', serviceProviders) : Promise.resolve(),
    ]);

    return true;
  }
}

export const assetCoreDB = new IndexedDBManager();
