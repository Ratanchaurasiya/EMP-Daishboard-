import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import * as seedData from './data/initialSeedData.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Robust .env file loading
const rootEnvPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(rootEnvPath)) {
  try {
    const envContent = fs.readFileSync(rootEnvPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const eqIdx = trimmed.indexOf('=');
        const k = trimmed.slice(0, eqIdx).trim();
        const v = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
        if (!process.env[k]) process.env[k] = v;
      }
    }
  } catch {}
}

// Data directory & file path for local persistence fallback
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = process.env.JSON_DB_PATH || path.join(DATA_DIR, 'database.json');

// Supabase Cloud Configuration with Safe Fallbacks for Vercel
const supabaseUrl = process.env.SUPABASE_URL || (process.env.SUPABASE_PROJECT_ID ? `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co` : null) || 'https://sjsgnooheqiuzwkfzhsi.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || null;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    console.log(`[Database] Supabase Cloud Client connected to: ${supabaseUrl}`);
  } catch (err) {
    console.warn('[Database] Failed to initialize Supabase client:', err.message);
  }
}

const COLLECTIONS = [
  'employees',
  'computers',
  'assets',
  'service_records',
  'allocations',
  'audit_logs',
  'weekly_photos',
  'purchases',
  'asset_requests',
  'system_settings',
  'sim_cards',
  'sim_recharges',
  'sim_requests',
  'service_providers',
  'asset_queries',
  'removed_employees',
  'exit_clearances',
];

const SEED_MAPPING = {
  employees: seedData.INITIAL_EMPLOYEES || [],
  computers: seedData.INITIAL_COMPUTERS || [],
  assets: seedData.INITIAL_COMPANY_ASSETS || [],
  allocations: seedData.INITIAL_ALLOCATION_RECORDS || [],
  service_records: seedData.INITIAL_SERVICE_RECORDS || [],
  audit_logs: seedData.INITIAL_AUDIT_LOGS || [],
  weekly_photos: seedData.INITIAL_WEEKLY_PHOTO_RECORDS || [],
  purchases: seedData.INITIAL_PURCHASES || [],
  sim_cards: seedData.INITIAL_SIM_CARDS || [],
  sim_recharges: seedData.INITIAL_SIM_RECHARGES || [],
  sim_requests: seedData.INITIAL_SIM_REQUESTS || [],
  service_providers: seedData.INITIAL_SERVICE_PROVIDERS || [],
  asset_queries: seedData.INITIAL_ASSET_QUERIES || [],
};

// In-memory application state
const state = {};

function mapItemForSupabase(collection, item) {
  const id = String(item.id || item.key || item.employeeId || '');
  const base = { id, data: item };

  if (collection === 'employees') {
    return { ...base, employee_id: String(item.employeeId || id), name: item.name || '', department: item.department || '', designation: item.designation || '', status: item.status || 'Active' };
  }
  if (collection === 'computers') {
    return { ...base, asset_number: String(item.assetNumber || ''), assigned_employee_id: item.assignedEmployeeId ? String(item.assignedEmployeeId) : null, status: item.status || 'Available' };
  }
  if (collection === 'assets') {
    return { ...base, asset_number: String(item.assetNumber || ''), asset_type: item.assetType || '', assigned_employee_id: item.assignedEmployeeId ? String(item.assignedEmployeeId) : null, status: item.status || 'Available' };
  }
  if (collection === 'service_records') {
    return { ...base, computer_id: item.computerId ? String(item.computerId) : null, employee_id: item.employeeId ? String(item.employeeId) : null };
  }
  if (collection === 'allocations') {
    return { ...base, employee_id: item.employeeId ? String(item.employeeId) : null, asset_id: item.assetId ? String(item.assetId) : null };
  }
  if (collection === 'audit_logs') {
    return { ...base, action: item.action || '', actor: item.actor || '', timestamp: item.timestamp || new Date().toISOString() };
  }
  if (collection === 'weekly_photos') {
    return { ...base, employee_id: item.employeeId ? String(item.employeeId) : null, week_start_date: item.weekStartDate || '' };
  }
  if (collection === 'purchases') {
    return { ...base, purchase_number: item.purchaseNumber || '', device_type: item.deviceType || '', brand: item.brand || '', model_name: item.modelName || '', serial_number: item.serialNumber || '', purchase_date: item.purchaseDate || '', vendor: item.vendor || '', device_cost: Number(item.deviceCost || 0), total_accessories_cost: Number(item.totalAccessoriesCost || 0), grand_total_cost: Number(item.grandTotalCost || 0), status: item.status || '' };
  }
  if (collection === 'asset_requests') {
    return { ...base, employee_id: item.employeeId ? String(item.employeeId) : null, employee_name: item.employeeName || '', department: item.department || '', urgency: item.urgency || '', status: item.status || '' };
  }
  if (collection === 'sim_cards') {
    return { ...base, contact_number: item.contactNumber || '', assigned_employee_id: item.assignedEmployeeId ? String(item.assignedEmployeeId) : null, status: item.status || 'Active', purpose: item.purpose || '' };
  }
  if (collection === 'sim_recharges') {
    return { ...base, sim_id: item.simId ? String(item.simId) : null, employee_id: item.employeeId ? String(item.employeeId) : null, recharge_date: item.rechargeDate || '', recharge_amount: Number(item.rechargeAmount || 0), total_amount: Number(item.totalAmount || 0) };
  }
  if (collection === 'sim_requests') {
    return { ...base, employee_id: item.employeeId ? String(item.employeeId) : null, request_type: item.requestType || '', status: item.status || '', urgency: item.urgency || '' };
  }
  if (collection === 'service_providers') {
    return { ...base, technician_name: item.technicianName || '', shop_name: item.shopName || '', phone_number: item.phoneNumber || '', service_type: item.serviceType || '', city: item.city || '' };
  }
  if (collection === 'asset_queries') {
    return { ...base, employee_id: item.employeeId ? String(item.employeeId) : null, asset_number: item.assetNumber || '', status: item.status || '', query_type: item.queryType || '', is_starred: Boolean(item.isStarred) };
  }
  if (collection === 'removed_employees') {
    return { ...base, employee_id: item.employeeId ? String(item.employeeId) : null, name: item.name || '', department: item.department || '', removed_date: item.removedDate || '', removed_by: item.removedBy || '' };
  }
  if (collection === 'exit_clearances') {
    return { ...base, employee_id: item.employeeId ? String(item.employeeId) : null };
  }
  return base;
}

function loadState() {
  let loaded = {};
  if (fs.existsSync(DB_PATH)) {
    try {
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      loaded = JSON.parse(raw);
    } catch (err) {
      console.warn('[Database JSON] Could not read database.json, initializing defaults:', err.message);
    }
  }

  for (const col of COLLECTIONS) {
    if (Array.isArray(loaded[col])) {
      state[col] = loaded[col];
    } else {
      state[col] = [];
    }
  }
}

function persistState() {
  try {
    const tmpPath = `${DB_PATH}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2), 'utf8');
    fs.renameSync(tmpPath, DB_PATH);
  } catch {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2), 'utf8');
    } catch (e) {
      console.error('[Database JSON Error] Failed to persist database.json:', e.message);
    }
  }
}

// Initial load
loadState();
persistState();

export const db = {
  activeEngine: supabase ? 'Supabase PostgreSQL Cloud' : 'Local JSON File',
  dbPath: DB_PATH,
  isPostgres: Boolean(supabase),
  isMySQL: false,
  isSQLite: false,

  checkpoint() {
    persistState();
    return true;
  },

  async getAll(collection) {
    if (supabase) {
      try {
        const { data, error } = await supabase.from(collection).select('*');
        if (!error && Array.isArray(data) && data.length > 0) {
          const items = data.map(row => (row.data ? { ...row.data } : row));
          state[collection] = items;
          persistState();
          return items;
        }
      } catch (err) {
        console.warn(`[Supabase Read Fallback] ${collection}:`, err.message);
      }
    }
    const items = state[collection] || [];
    return items.map(i => ({ ...i }));
  },

  async getById(collection, id) {
    if (!id) return null;
    const all = await this.getAll(collection);
    const target = String(id);
    const found = all.find(item => {
      if (item.id && String(item.id) === target) return true;
      if (item.key && String(item.key) === target) return true;
      if (item.employeeId && String(item.employeeId) === target) return true;
      if (item.assetNumber && String(item.assetNumber) === target) return true;
      if (item.contactNumber && String(item.contactNumber) === target) return true;
      if (item.purchaseNumber && String(item.purchaseNumber) === target) return true;
      if (item.simId && String(item.simId) === target) return true;
      return false;
    });
    return found ? { ...found } : null;
  },

  async upsert(collection, item) {
    if (!item) return null;
    if (!state[collection]) state[collection] = [];

    const recordId = item.id || item.key || item.employeeId || item.assetNumber;
    const itemToStore = { ...item, id: recordId };
    if (!itemToStore.updated_at) {
      itemToStore.updated_at = new Date().toISOString();
    }

    // Local state sync
    const idx = state[collection].findIndex(existing => {
      if (recordId && (existing.id === recordId || existing.key === recordId)) return true;
      if (collection === 'employees' && item.employeeId && existing.employeeId === item.employeeId) return true;
      if (collection === 'computers' && item.assetNumber && existing.assetNumber === item.assetNumber) return true;
      if (collection === 'assets' && item.assetNumber && existing.assetNumber === item.assetNumber) return true;
      if (collection === 'sim_cards' && item.contactNumber && existing.contactNumber === item.contactNumber) return true;
      return false;
    });

    if (idx >= 0) {
      state[collection][idx] = { ...state[collection][idx], ...itemToStore };
    } else {
      state[collection].push(itemToStore);
    }
    persistState();

    // Supabase Cloud Async Upsert
    if (supabase) {
      try {
        const payload = mapItemForSupabase(collection, itemToStore);
        const { error } = await supabase.from(collection).upsert(payload, { onConflict: 'id' });
        if (error) {
          console.warn(`[Supabase Upsert Warning] ${collection}:`, error.message);
        }
      } catch (err) {
        console.warn(`[Supabase Upsert Exception] ${collection}:`, err.message);
      }
    }

    return { ...itemToStore };
  },

  async batchUpsert(collection, items) {
    if (!Array.isArray(items)) return [];
    for (const item of items) {
      await this.upsert(collection, item);
    }
    return items;
  },

  async delete(collection, id) {
    if (!id || !state[collection]) return false;
    const target = String(id);
    const beforeLen = state[collection].length;
    state[collection] = state[collection].filter(item => {
      if (item.id && String(item.id) === target) return false;
      if (item.key && String(item.key) === target) return false;
      return true;
    });
    const deleted = state[collection].length < beforeLen;
    if (deleted) {
      persistState();
    }

    if (supabase) {
      try {
        await supabase.from(collection).delete().eq('id', target);
      } catch (err) {
        console.warn(`[Supabase Delete Warning] ${collection}:`, err.message);
      }
    }

    return deleted;
  },

  async clear(collection) {
    if (state[collection]) {
      state[collection] = [];
      persistState();
    }
    if (supabase) {
      try {
        await supabase.from(collection).delete().neq('id', '___non_existent___');
      } catch {}
    }
    return true;
  },

  async saveSimRechargeTransaction(rechargeRecord, updatedSimRecord = null) {
    await this.upsert('sim_recharges', rechargeRecord);
    if (updatedSimRecord) {
      await this.upsert('sim_cards', updatedSimRecord);
    }
    persistState();
    return rechargeRecord;
  },

  async saveBatchSimRechargeTransaction(rechargesList, updatedSimsList = []) {
    if (Array.isArray(rechargesList)) {
      for (const r of rechargesList) {
        await this.upsert('sim_recharges', r);
      }
    }
    if (Array.isArray(updatedSimsList)) {
      for (const s of updatedSimsList) {
        await this.upsert('sim_cards', s);
      }
    }
    persistState();
    return rechargesList;
  },

  async getStats() {
    let supabaseOnline = false;
    if (supabase) {
      try {
        const { error } = await supabase.from('employees').select('id', { count: 'exact', head: true });
        supabaseOnline = !error;
      } catch {
        supabaseOnline = false;
      }
    }

    const counts = {};
    let total = 0;
    for (const c of COLLECTIONS) {
      const cnt = Array.isArray(state[c]) ? state[c].length : 0;
      counts[c] = cnt;
      total += cnt;
    }

    return {
      connected: supabaseOnline || true,
      supabaseOnline,
      engine: supabaseOnline ? 'Supabase PostgreSQL Cloud' : 'Local JSON File (Zero Database)',
      dbPath: DB_PATH,
      totalRecords: total,
      counts,
      lastChecked: new Date().toISOString(),
    };
  },
};
