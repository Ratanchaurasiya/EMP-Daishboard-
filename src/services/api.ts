// Enterprise API Client for AssetCore SQLite Database Backend
import {
  Employee,
  Computer,
  CompanyAsset,
  AssetAllocationRecord,
  ServiceRecord,
  AuditLog,
  WeeklyAssetPhotoRecord,
  PurchaseRecord,
  AssetRequest,
  SimCard,
  SimRecharge,
  SimRequest,
  ServiceProvider,
  AssetQuery,
  RemovedEmployeeRecord,
  ExitClearanceRecord,
} from '../types';

// In development or unified hosting, use relative '/api'
// For split deployment (e.g. Vercel frontend + Render backend), reads VITE_API_BASE_URL
const rawApiBase = import.meta.env.VITE_API_BASE_URL
  ? String(import.meta.env.VITE_API_BASE_URL).trim().replace(/\/$/, '')
  : '';
const API_BASE = rawApiBase ? `${rawApiBase}/api` : '/api';

export interface BootstrapResponse {
  success: boolean;
  databaseConnected?: boolean;
  engine?: string;
  data: {
    employees: Employee[];
    computers: Computer[];
    assets: CompanyAsset[];
    serviceRecords: ServiceRecord[];
    allocationRecords: AssetAllocationRecord[];
    auditLogs: AuditLog[];
    weeklyPhotoRecords: WeeklyAssetPhotoRecord[];
    purchases?: PurchaseRecord[];
    assetRequests?: AssetRequest[];
    simCards?: SimCard[];
    simRecharges?: SimRecharge[];
    simRequests?: SimRequest[];
    serviceProviders?: ServiceProvider[];
    assetQueries?: AssetQuery[];
    removedEmployees?: RemovedEmployeeRecord[];
    exitClearances?: ExitClearanceRecord[];
  };
  stats?: any;
}

export const api = {
  // Bootstrap: Hydrate entire dataset in 1 roundtrip
  async getBootstrap(): Promise<BootstrapResponse | null> {
    try {
      const res = await fetch(`${API_BASE}/bootstrap`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[API] Bootstrap fetch failed (using local cache fallback):', err);
      return null;
    }
  },

  // Health check
  async getHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return await res.json();
    } catch {
      return { status: 'offline' };
    }
  },

  // Dedicated Database Status Check
  async getDbStatus() {
    try {
      const res = await fetch(`${API_BASE}/db-status`);
      return await res.json();
    } catch (err) {
      return { success: false, status: 'offline', error: String(err) };
    }
  },

  // ================= EMPLOYEES =================
  async getEmployees(): Promise<Employee[]> {
    try {
      const res = await fetch(`${API_BASE}/employees`);
      const json = await res.json();
      return json.success ? json.data : [];
    } catch {
      return [];
    }
  },

  async createEmployee(employee: Employee): Promise<{ success: boolean; error?: string; data?: Employee }> {
    try {
      const res = await fetch(`${API_BASE}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employee),
      });
      const json = await res.json();
      if (!res.ok) return { success: false, error: json.error || 'Failed to save employee' };
      return json;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/employees/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteEmployee(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/employees/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteAllEmployees(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/employees`, { method: 'DELETE' });
      return res.ok;
    } catch {
      return false;
    }
  },

  // ================= COMPUTERS =================
  async createComputer(comp: Computer): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/computers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comp),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateComputer(id: string, updates: Partial<Computer>): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/computers/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteComputer(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/computers/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // ================= ASSETS =================
  async createAsset(asset: CompanyAsset): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asset),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateAsset(id: string, updates: Partial<CompanyAsset>): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/assets/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteAsset(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/assets/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // ================= ALLOCATIONS =================
  async createAllocation(record: AssetAllocationRecord): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/allocations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateAllocation(id: string, updates: Partial<AssetAllocationRecord>): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/allocations/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteAllocation(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/allocations/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // ================= SERVICES =================
  async createServiceRecord(srv: ServiceRecord): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(srv),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateServiceRecord(id: string, updates: Partial<ServiceRecord>): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/services/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteServiceRecord(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/services/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // ================= AUDIT LOGS =================
  async createAuditLog(log: AuditLog): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // ================= WEEKLY PHOTOS =================
  async createWeeklyPhoto(record: WeeklyAssetPhotoRecord): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/weekly-photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateWeeklyPhoto(id: string, updates: Partial<WeeklyAssetPhotoRecord>): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/weekly-photos/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteWeeklyPhoto(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/weekly-photos/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // ================= PURCHASES & ACCESSORIES =================
  async getPurchases(): Promise<PurchaseRecord[]> {
    try {
      const res = await fetch(`${API_BASE}/purchases`);
      const json = await res.json();
      return json.success ? json.data : [];
    } catch {
      return [];
    }
  },

  async createPurchase(purchase: PurchaseRecord): Promise<{ success: boolean; data?: PurchaseRecord; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/purchases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchase),
      });
      const json = await res.json();
      if (!res.ok) return { success: false, error: json.error || 'Failed to save purchase record' };
      return json;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  async updatePurchase(id: string, updates: Partial<PurchaseRecord>): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/purchases/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deletePurchase(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/purchases/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // ================= ASSET REQUESTS & REQUISITIONS =================
  async getAssetRequests(): Promise<AssetRequest[]> {
    try {
      const res = await fetch(`${API_BASE}/asset-requests`);
      const json = await res.json();
      return json.success ? json.data : [];
    } catch {
      return [];
    }
  },

  async createAssetRequest(request: AssetRequest): Promise<{ success: boolean; data?: AssetRequest; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/asset-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      const json = await res.json();
      if (!res.ok) return { success: false, error: json.error || 'Failed to save requisition' };
      return json;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  async updateAssetRequest(id: string, updates: Partial<AssetRequest>): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/asset-requests/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteAssetRequest(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/asset-requests/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // ================= SIM CARD MANAGEMENT =================
  async getSims(): Promise<SimCard[]> {
    try {
      const res = await fetch(`${API_BASE}/sims`);
      const json = await res.json();
      return json.success ? json.data : [];
    } catch {
      return [];
    }
  },

  async createSim(sim: SimCard): Promise<{ success: boolean; data?: SimCard; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/sims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sim),
      });
      const json = await res.json();
      if (!res.ok) return { success: false, error: json.error || 'Failed to save SIM' };
      return json;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  async updateSim(id: string, updates: Partial<SimCard>): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/sims/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async suspendSim(id: string, reason: string, suspendedBy?: string): Promise<{ success: boolean; data?: SimCard; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/sims/${encodeURIComponent(id)}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, suspendedBy }),
      });
      const json = await res.json();
      if (!res.ok) return { success: false, error: json.error || 'Failed to suspend SIM' };
      return json;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  async reactivateSim(id: string): Promise<{ success: boolean; data?: SimCard; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/sims/${encodeURIComponent(id)}/reactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (!res.ok) return { success: false, error: json.error || 'Failed to reactivate SIM' };
      return json;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  async deleteSim(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/sims/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // ================= SIM RECHARGES =================
  async getSimRecharges(): Promise<SimRecharge[]> {
    try {
      const res = await fetch(`${API_BASE}/sim-recharges`);
      const json = await res.json();
      return json.success ? json.data : [];
    } catch {
      return [];
    }
  },

  async createSimRecharge(recharge: SimRecharge, updatedSim?: SimCard | null): Promise<{ success: boolean; data?: SimRecharge; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/sim-recharges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSim ? { recharge, updatedSim } : recharge),
      });
      const json = await res.json();
      if (!res.ok) return { success: false, error: json.error || 'Failed to save recharge to Cloud Database' };
      return json;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error connecting to backend' };
    }
  },

  async createBatchSimRecharge(recharges: SimRecharge[], updatedSims?: SimCard[]): Promise<{ success: boolean; data?: SimRecharge[]; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/sim-recharges/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recharges, updatedSims }),
      });
      const json = await res.json();
      if (!res.ok) return { success: false, error: json.error || 'Failed to process batch recharge on Cloud Database' };
      return json;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error connecting to backend' };
    }
  },

  async deleteSimRecharge(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/sim-recharges/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // ================= SIM REQUESTS =================
  async getSimRequests(): Promise<SimRequest[]> {
    try {
      const res = await fetch(`${API_BASE}/sim-requests`);
      const json = await res.json();
      return json.success ? json.data : [];
    } catch {
      return [];
    }
  },

  async createSimRequest(request: SimRequest): Promise<{ success: boolean; data?: SimRequest; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/sim-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      const json = await res.json();
      if (!res.ok) return { success: false, error: json.error || 'Failed to submit SIM request' };
      return json;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  async updateSimRequest(id: string, updates: Partial<SimRequest>): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/sim-requests/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteSimRequest(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/sim-requests/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // ================= SERVICE PROVIDERS (PC/SYSTEM REPAIR VENDORS) =================
  async getServiceProviders(): Promise<ServiceProvider[]> {
    try {
      const res = await fetch(`${API_BASE}/service-providers`);
      const json = await res.json();
      return json.success ? json.data : [];
    } catch {
      return [];
    }
  },

  async createServiceProvider(provider: ServiceProvider): Promise<{ success: boolean; data?: ServiceProvider; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/service-providers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(provider),
      });
      const json = await res.json();
      if (!res.ok) return { success: false, error: json.error || 'Failed to save service provider' };
      return json;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  async updateServiceProvider(id: string, updates: Partial<ServiceProvider>): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/service-providers/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteServiceProvider(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/service-providers/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // ================= ASSET QUERIES =================
  async getAssetQueries(): Promise<AssetQuery[]> {
    try {
      const res = await fetch(`${API_BASE}/asset-queries`);
      const json = await res.json();
      return json.success ? json.data : [];
    } catch {
      return [];
    }
  },

  async createAssetQuery(query: AssetQuery): Promise<{ success: boolean; error?: string; data?: AssetQuery }> {
    try {
      const res = await fetch(`${API_BASE}/asset-queries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query),
      });
      const json = await res.json();
      if (!res.ok) return { success: false, error: json.error || 'Failed to save asset query' };
      return json;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  async updateAssetQuery(id: string, updates: Partial<AssetQuery>): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/asset-queries/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteAssetQuery(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/asset-queries/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // ================= REMOVED EMPLOYEES =================
  async getRemovedEmployees(): Promise<RemovedEmployeeRecord[]> {
    try {
      const res = await fetch(`${API_BASE}/removed-employees`);
      const json = await res.json();
      return json.success ? json.data : [];
    } catch {
      return [];
    }
  },

  async createRemovedEmployee(record: RemovedEmployeeRecord): Promise<{ success: boolean; data?: RemovedEmployeeRecord; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/removed-employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      const json = await res.json();
      if (!res.ok) return { success: false, error: json.error || 'Failed to save removed employee record' };
      return json;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  async deleteRemovedEmployee(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/removed-employees/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // ================= EMPLOYEE EXIT & ASSET CLEARANCE =================
  async getExitClearances(): Promise<ExitClearanceRecord[]> {
    try {
      const res = await fetch(`${API_BASE}/exit-clearances`);
      const json = await res.json();
      return json.success ? json.data : [];
    } catch {
      return [];
    }
  },

  async getExitClearanceById(id: string): Promise<ExitClearanceRecord | null> {
    try {
      const res = await fetch(`${API_BASE}/exit-clearances/${encodeURIComponent(id)}`);
      const json = await res.json();
      return json.success ? json.data : null;
    } catch {
      return null;
    }
  },

  async createExitClearance(
    record: ExitClearanceRecord
  ): Promise<{ success: boolean; error?: string; data?: ExitClearanceRecord }> {
    try {
      const res = await fetch(`${API_BASE}/exit-clearances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      const json = await res.json();
      return json;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  async updateExitClearance(
    id: string,
    record: ExitClearanceRecord
  ): Promise<{ success: boolean; error?: string; data?: ExitClearanceRecord }> {
    try {
      const res = await fetch(`${API_BASE}/exit-clearances/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      const json = await res.json();
      return json;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  async deleteExitClearance(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/exit-clearances/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // ================= BULK SYNC / RESTORE =================
  async syncAll(data: {
    employees?: Employee[];
    computers?: Computer[];
    assets?: CompanyAsset[];
    serviceRecords?: ServiceRecord[];
    allocationRecords?: AssetAllocationRecord[];
    auditLogs?: AuditLog[];
    weeklyPhotoRecords?: WeeklyAssetPhotoRecord[];
    purchases?: PurchaseRecord[];
    assetRequests?: AssetRequest[];
    simCards?: SimCard[];
    simRecharges?: SimRecharge[];
    simRequests?: SimRequest[];
    serviceProviders?: ServiceProvider[];
    assetQueries?: AssetQuery[];
    removedEmployees?: RemovedEmployeeRecord[];
    exitClearances?: ExitClearanceRecord[];
  }): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // ================= BULK PURGE / CLEAN SLATE =================
  async clearAll(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};
