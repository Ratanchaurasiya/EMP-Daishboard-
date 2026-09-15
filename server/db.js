import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {}
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure server/data directory exists for local development fallback
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'assetcore.db');
const JSON_BACKUP_PATH = path.join(DATA_DIR, 'database_fallback.json');

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || null;
const isProduction = process.env.NODE_ENV === 'production';

let pgPool = null;
let sqliteDB = null;
let useFallback = false;
let activeEngine = 'initializing';

// Initialize PostgreSQL Connection Pool if DATABASE_URL is supplied
if (DATABASE_URL) {
  try {
    const isLocalhost = DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1');
    pgPool = new pg.Pool({
      connectionString: DATABASE_URL,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Test connection synchronously at module load time
    const client = await pgPool.connect();
    activeEngine = 'PostgreSQL';
    console.log('[Database] Connected successfully to Cloud PostgreSQL production database.');
    client.release();

    // Verify & Initialize PostgreSQL Tables Idempotently
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(100) PRIMARY KEY,
        employee_id VARCHAR(100) UNIQUE,
        name VARCHAR(255),
        department VARCHAR(255),
        status VARCHAR(100),
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS computers (
        id VARCHAR(100) PRIMARY KEY,
        asset_number VARCHAR(100) UNIQUE,
        assigned_employee_id VARCHAR(100),
        status VARCHAR(100),
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS assets (
        id VARCHAR(100) PRIMARY KEY,
        asset_number VARCHAR(100) UNIQUE,
        asset_type VARCHAR(100),
        assigned_employee_id VARCHAR(100),
        status VARCHAR(100),
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS service_records (
        id VARCHAR(100) PRIMARY KEY,
        computer_id VARCHAR(100),
        employee_id VARCHAR(100),
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS allocations (
        id VARCHAR(100) PRIMARY KEY,
        employee_id VARCHAR(100),
        asset_id VARCHAR(100),
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(100) PRIMARY KEY,
        action VARCHAR(255),
        actor VARCHAR(255),
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS weekly_photos (
        id VARCHAR(100) PRIMARY KEY,
        employee_id VARCHAR(100),
        week_start_date VARCHAR(50),
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS purchases (
        id VARCHAR(100) PRIMARY KEY,
        purchase_number VARCHAR(100),
        device_type VARCHAR(100),
        brand VARCHAR(100),
        model_name VARCHAR(255),
        serial_number VARCHAR(100),
        purchase_date VARCHAR(50),
        vendor VARCHAR(255),
        device_cost NUMERIC DEFAULT 0,
        total_accessories_cost NUMERIC DEFAULT 0,
        grand_total_cost NUMERIC DEFAULT 0,
        status VARCHAR(100),
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS asset_requests (
        id VARCHAR(100) PRIMARY KEY,
        employee_id VARCHAR(100),
        employee_name VARCHAR(255),
        department VARCHAR(255),
        urgency VARCHAR(100),
        status VARCHAR(100),
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_emp_employee_id ON employees(employee_id);
      CREATE INDEX IF NOT EXISTS idx_comp_asset_number ON computers(asset_number);
      CREATE INDEX IF NOT EXISTS idx_comp_assigned_emp ON computers(assigned_employee_id);
      CREATE INDEX IF NOT EXISTS idx_asset_asset_number ON assets(asset_number);
      CREATE INDEX IF NOT EXISTS idx_asset_assigned_emp ON assets(assigned_employee_id);
      CREATE INDEX IF NOT EXISTS idx_alloc_emp ON allocations(employee_id);
      CREATE INDEX IF NOT EXISTS idx_alloc_asset ON allocations(asset_id);
      CREATE INDEX IF NOT EXISTS idx_srv_comp ON service_records(computer_id);
      CREATE INDEX IF NOT EXISTS idx_srv_emp ON service_records(employee_id);
      CREATE INDEX IF NOT EXISTS idx_req_emp ON asset_requests(employee_id);
      CREATE INDEX IF NOT EXISTS idx_req_status ON asset_requests(status);
      CREATE INDEX IF NOT EXISTS idx_purchases_sn ON purchases(serial_number);
    `);
    console.log('[Database] Cloud PostgreSQL tables & indices verified.');
  } catch (err) {
    console.error('[Database Error] Failed to connect to PostgreSQL from DATABASE_URL:', err.message);
    if (isProduction) {
      console.error('[Database Error] Production requires a valid PostgreSQL connection. Exiting to prevent ephemeral data loss.');
      throw new Error(`PostgreSQL Connection Failed: ${err.message}`);
    }
    console.warn('[Database] Falling back to local development database engine...');
    pgPool = null;
  }
} else if (isProduction) {
  console.error('[Database Error] Fatal: DATABASE_URL is not set in production environment.');
  throw new Error('DATABASE_URL environment variable is required in production mode for PostgreSQL persistence.');
}

// If PostgreSQL is not active (in local development only), initialize SQLite
if (!pgPool && !isProduction) {
  try {
    const sqlite = await import('node:sqlite');
    if (sqlite && sqlite.DatabaseSync) {
      sqliteDB = new sqlite.DatabaseSync(DB_PATH);
      sqliteDB.exec('PRAGMA journal_mode = WAL;');
      sqliteDB.exec('PRAGMA synchronous = NORMAL;');
      activeEngine = 'Native SQLite';
      console.log(`[Database] Native SQLite initialized at: ${DB_PATH}`);

      sqliteDB.exec(`
        CREATE TABLE IF NOT EXISTS employees (
          id TEXT PRIMARY KEY,
          employeeId TEXT UNIQUE,
          name TEXT,
          department TEXT,
          status TEXT,
          data TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS computers (
          id TEXT PRIMARY KEY,
          assetNumber TEXT UNIQUE,
          assignedEmployeeId TEXT,
          status TEXT,
          data TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS assets (
          id TEXT PRIMARY KEY,
          assetNumber TEXT UNIQUE,
          assetType TEXT,
          assignedEmployeeId TEXT,
          status TEXT,
          data TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS service_records (
          id TEXT PRIMARY KEY,
          computerId TEXT,
          employeeId TEXT,
          data TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS allocations (
          id TEXT PRIMARY KEY,
          employeeId TEXT,
          assetId TEXT,
          data TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
          id TEXT PRIMARY KEY,
          action TEXT,
          actor TEXT,
          timestamp TEXT,
          data TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS weekly_photos (
          id TEXT PRIMARY KEY,
          employeeId TEXT,
          weekStartDate TEXT,
          data TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS purchases (
          id TEXT PRIMARY KEY,
          purchaseNumber TEXT,
          deviceType TEXT NOT NULL,
          brand TEXT NOT NULL,
          modelName TEXT NOT NULL,
          serialNumber TEXT,
          purchaseDate TEXT NOT NULL,
          vendor TEXT NOT NULL,
          deviceCost REAL NOT NULL,
          totalAccessoriesCost REAL NOT NULL,
          grandTotalCost REAL NOT NULL,
          status TEXT NOT NULL,
          data TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS asset_requests (
          id TEXT PRIMARY KEY,
          employeeId TEXT,
          employeeName TEXT,
          department TEXT,
          urgency TEXT,
          status TEXT,
          data TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS system_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
    } else {
      useFallback = true;
    }
  } catch (err) {
    console.warn('[Database] Native SQLite unavailable, enabling persistent atomic JSON engine:', err.message);
    useFallback = true;
  }
}

// Fallback JSON in-memory store for local development without Node 22 SQLite
let fallbackState = {
  employees: [],
  computers: [],
  assets: [],
  service_records: [],
  allocations: [],
  audit_logs: [],
  weekly_photos: [],
  purchases: [],
  asset_requests: [],
  system_settings: {},
};

if (useFallback && !isProduction) {
  activeEngine = 'Atomic JSON Persistence';
  if (fs.existsSync(JSON_BACKUP_PATH)) {
    try {
      fallbackState = JSON.parse(fs.readFileSync(JSON_BACKUP_PATH, 'utf-8'));
    } catch (e) {
      console.error('[Database] Failed to read fallback JSON:', e);
    }
  }
}

const saveFallback = () => {
  if (useFallback && !isProduction) {
    try {
      fs.writeFileSync(JSON_BACKUP_PATH, JSON.stringify(fallbackState, null, 2), 'utf-8');
    } catch (e) {
      console.error('[Database] Failed to save fallback JSON:', e);
    }
  }
};

// Database Unified Abstraction Object
export const db = {
  get isPostgres() {
    return Boolean(pgPool);
  },
  get isSQLite() {
    return Boolean(sqliteDB);
  },
  get activeEngine() {
    return activeEngine;
  },
  get dbPath() {
    if (pgPool) return 'Cloud PostgreSQL (Render / Managed Database)';
    return useFallback ? JSON_BACKUP_PATH : DB_PATH;
  },

  // Get all items from a collection
  async getAll(collection) {
    // 1. PostgreSQL
    if (pgPool) {
      try {
        const query = `SELECT data FROM ${collection} ORDER BY updated_at DESC`;
        const res = await pgPool.query(query);
        return res.rows.map(r => (typeof r.data === 'string' ? JSON.parse(r.data) : r.data));
      } catch (err) {
        try {
          const res = await pgPool.query(`SELECT data FROM ${collection}`);
          return res.rows.map(r => (typeof r.data === 'string' ? JSON.parse(r.data) : r.data));
        } catch (e) {
          console.error(`[PostgreSQL Error] getAll(${collection}):`, e.message);
          return [];
        }
      }
    }

    // 2. SQLite
    if (sqliteDB) {
      try {
        const stmt = sqliteDB.prepare(`SELECT data FROM ${collection} ORDER BY updated_at DESC`);
        const rows = stmt.all();
        return rows.map(r => JSON.parse(r.data));
      } catch (err) {
        try {
          const stmt = sqliteDB.prepare(`SELECT data FROM ${collection}`);
          const rows = stmt.all();
          return rows.map(r => JSON.parse(r.data));
        } catch (e) {
          console.error(`[SQLite Error] getAll(${collection}):`, e.message);
          return [];
        }
      }
    }

    // 3. Fallback
    return [...(fallbackState[collection] || [])];
  },

  // Get item by ID
  async getById(collection, id) {
    if (pgPool) {
      try {
        const res = await pgPool.query(`SELECT data FROM ${collection} WHERE id = $1`, [id]);
        if (res.rows.length === 0) return null;
        const row = res.rows[0];
        return typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      } catch (err) {
        console.error(`[PostgreSQL Error] getById(${collection}, ${id}):`, err.message);
        return null;
      }
    }

    if (sqliteDB) {
      try {
        const stmt = sqliteDB.prepare(`SELECT data FROM ${collection} WHERE id = ?`);
        const row = stmt.get(id);
        return row ? JSON.parse(row.data) : null;
      } catch (err) {
        console.error(`[SQLite Error] getById(${collection}, ${id}):`, err.message);
        return null;
      }
    }

    return (fallbackState[collection] || []).find(item => item.id === id) || null;
  },

  // Insert or Replace item
  async upsert(collection, item) {
    const now = new Date().toISOString();
    const dataStr = JSON.stringify(item);

    // 1. PostgreSQL Upsert
    if (pgPool) {
      try {
        if (collection === 'employees') {
          const q = `
            INSERT INTO employees (id, employee_id, name, department, status, data, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE SET
              employee_id = EXCLUDED.employee_id,
              name = EXCLUDED.name,
              department = EXCLUDED.department,
              status = EXCLUDED.status,
              data = EXCLUDED.data,
              updated_at = EXCLUDED.updated_at
          `;
          await pgPool.query(q, [
            item.id,
            item.employeeId || item.id,
            item.name || '',
            item.department || '',
            item.status || 'Active',
            dataStr,
            now,
          ]);
        } else if (collection === 'computers') {
          const q = `
            INSERT INTO computers (id, asset_number, assigned_employee_id, status, data, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (id) DO UPDATE SET
              asset_number = EXCLUDED.asset_number,
              assigned_employee_id = EXCLUDED.assigned_employee_id,
              status = EXCLUDED.status,
              data = EXCLUDED.data,
              updated_at = EXCLUDED.updated_at
          `;
          await pgPool.query(q, [
            item.id,
            item.assetNumber || item.id,
            item.assignedEmployeeId || null,
            item.status || 'Available',
            dataStr,
            now,
          ]);
        } else if (collection === 'assets') {
          const q = `
            INSERT INTO assets (id, asset_number, asset_type, assigned_employee_id, status, data, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE SET
              asset_number = EXCLUDED.asset_number,
              asset_type = EXCLUDED.asset_type,
              assigned_employee_id = EXCLUDED.assigned_employee_id,
              status = EXCLUDED.status,
              data = EXCLUDED.data,
              updated_at = EXCLUDED.updated_at
          `;
          await pgPool.query(q, [
            item.id,
            item.assetNumber || item.id,
            item.assetType || '',
            item.assignedEmployeeId || null,
            item.status || 'Available',
            dataStr,
            now,
          ]);
        } else if (collection === 'service_records') {
          const q = `
            INSERT INTO service_records (id, computer_id, employee_id, data, updated_at)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO UPDATE SET
              computer_id = EXCLUDED.computer_id,
              employee_id = EXCLUDED.employee_id,
              data = EXCLUDED.data,
              updated_at = EXCLUDED.updated_at
          `;
          await pgPool.query(q, [item.id, item.computerId || '', item.employeeId || '', dataStr, now]);
        } else if (collection === 'allocations') {
          const q = `
            INSERT INTO allocations (id, employee_id, asset_id, data, updated_at)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO UPDATE SET
              employee_id = EXCLUDED.employee_id,
              asset_id = EXCLUDED.asset_id,
              data = EXCLUDED.data,
              updated_at = EXCLUDED.updated_at
          `;
          await pgPool.query(q, [item.id, item.employeeId || '', item.assetId || '', dataStr, now]);
        } else if (collection === 'audit_logs') {
          const q = `
            INSERT INTO audit_logs (id, action, actor, timestamp, data, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (id) DO UPDATE SET
              action = EXCLUDED.action,
              actor = EXCLUDED.actor,
              timestamp = EXCLUDED.timestamp,
              data = EXCLUDED.data,
              updated_at = EXCLUDED.updated_at
          `;
          await pgPool.query(q, [item.id, item.action || '', item.actor || '', item.timestamp || now, dataStr, now]);
        } else if (collection === 'weekly_photos') {
          const q = `
            INSERT INTO weekly_photos (id, employee_id, week_start_date, data, updated_at)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO UPDATE SET
              employee_id = EXCLUDED.employee_id,
              week_start_date = EXCLUDED.week_start_date,
              data = EXCLUDED.data,
              updated_at = EXCLUDED.updated_at
          `;
          await pgPool.query(q, [item.id, item.employeeId || '', item.weekStartDate || '', dataStr, now]);
        } else if (collection === 'purchases') {
          const q = `
            INSERT INTO purchases (id, purchase_number, device_type, brand, model_name, serial_number, purchase_date, vendor, device_cost, total_accessories_cost, grand_total_cost, status, data, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT (id) DO UPDATE SET
              purchase_number = EXCLUDED.purchase_number,
              device_type = EXCLUDED.device_type,
              brand = EXCLUDED.brand,
              model_name = EXCLUDED.model_name,
              serial_number = EXCLUDED.serial_number,
              purchase_date = EXCLUDED.purchase_date,
              vendor = EXCLUDED.vendor,
              device_cost = EXCLUDED.device_cost,
              total_accessories_cost = EXCLUDED.total_accessories_cost,
              grand_total_cost = EXCLUDED.grand_total_cost,
              status = EXCLUDED.status,
              data = EXCLUDED.data,
              updated_at = EXCLUDED.updated_at
          `;
          await pgPool.query(q, [
            item.id,
            item.purchaseNumber || item.id,
            item.deviceType || 'Laptop',
            item.brand || '',
            item.modelName || '',
            item.serialNumber || '',
            item.purchaseDate || '',
            item.vendor || '',
            Number(item.deviceCost) || 0,
            Number(item.totalAccessoriesCost) || 0,
            Number(item.grandTotalCost) || 0,
            item.status || 'In Stock',
            dataStr,
            now,
          ]);
        } else if (collection === 'asset_requests') {
          const q = `
            INSERT INTO asset_requests (id, employee_id, employee_name, department, urgency, status, data, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO UPDATE SET
              employee_id = EXCLUDED.employee_id,
              employee_name = EXCLUDED.employee_name,
              department = EXCLUDED.department,
              urgency = EXCLUDED.urgency,
              status = EXCLUDED.status,
              data = EXCLUDED.data,
              updated_at = EXCLUDED.updated_at
          `;
          await pgPool.query(q, [
            item.id,
            item.employeeId || '',
            item.employeeName || '',
            item.department || '',
            item.urgency || 'Normal',
            item.status || 'Pending',
            dataStr,
            now,
          ]);
        } else if (collection === 'system_settings') {
          const q = `
            INSERT INTO system_settings (key, value, updated_at)
            VALUES ($1, $2, $3)
            ON CONFLICT (key) DO UPDATE SET
              value = EXCLUDED.value,
              updated_at = EXCLUDED.updated_at
          `;
          await pgPool.query(q, [item.key, item.value || '', now]);
        }
        return item;
      } catch (err) {
        console.error(`[PostgreSQL Error] upsert(${collection}):`, err.message);
        throw err;
      }
    }

    // 2. SQLite Upsert
    if (sqliteDB) {
      try {
        if (collection === 'employees') {
          const stmt = sqliteDB.prepare(`
            INSERT INTO employees (id, employeeId, name, department, status, data, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              employeeId = excluded.employeeId,
              name = excluded.name,
              department = excluded.department,
              status = excluded.status,
              data = excluded.data,
              updated_at = excluded.updated_at
          `);
          stmt.run(item.id, item.employeeId, item.name || '', item.department || '', item.status || 'Active', dataStr, now);
        } else if (collection === 'computers') {
          const stmt = sqliteDB.prepare(`
            INSERT INTO computers (id, assetNumber, assignedEmployeeId, status, data, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              assetNumber = excluded.assetNumber,
              assignedEmployeeId = excluded.assignedEmployeeId,
              status = excluded.status,
              data = excluded.data,
              updated_at = excluded.updated_at
          `);
          stmt.run(item.id, item.assetNumber, item.assignedEmployeeId || null, item.status || 'Available', dataStr, now);
        } else if (collection === 'assets') {
          const stmt = sqliteDB.prepare(`
            INSERT INTO assets (id, assetNumber, assetType, assignedEmployeeId, status, data, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              assetNumber = excluded.assetNumber,
              assetType = excluded.assetType,
              assignedEmployeeId = excluded.assignedEmployeeId,
              status = excluded.status,
              data = excluded.data,
              updated_at = excluded.updated_at
          `);
          stmt.run(item.id, item.assetNumber, item.assetType || '', item.assignedEmployeeId || null, item.status || 'Available', dataStr, now);
        } else if (collection === 'service_records') {
          const stmt = sqliteDB.prepare(`
            INSERT INTO service_records (id, computerId, employeeId, data, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              computerId = excluded.computerId,
              employeeId = excluded.employeeId,
              data = excluded.data,
              updated_at = excluded.updated_at
          `);
          stmt.run(item.id, item.computerId || '', item.employeeId || '', dataStr, now);
        } else if (collection === 'allocations') {
          const stmt = sqliteDB.prepare(`
            INSERT INTO allocations (id, employeeId, assetId, data, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              employeeId = excluded.employeeId,
              assetId = excluded.assetId,
              data = excluded.data,
              updated_at = excluded.updated_at
          `);
          stmt.run(item.id, item.employeeId || '', item.assetId || '', dataStr, now);
        } else if (collection === 'audit_logs') {
          const stmt = sqliteDB.prepare(`
            INSERT INTO audit_logs (id, action, actor, timestamp, data)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              action = excluded.action,
              actor = excluded.actor,
              timestamp = excluded.timestamp,
              data = excluded.data
          `);
          stmt.run(item.id, item.action || '', item.actor || '', item.timestamp || now, dataStr);
        } else if (collection === 'weekly_photos') {
          const stmt = sqliteDB.prepare(`
            INSERT INTO weekly_photos (id, employeeId, weekStartDate, data, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              employeeId = excluded.employeeId,
              weekStartDate = excluded.weekStartDate,
              data = excluded.data,
              updated_at = excluded.updated_at
          `);
          stmt.run(item.id, item.employeeId || '', item.weekStartDate || '', dataStr, now);
        } else if (collection === 'purchases') {
          const stmt = sqliteDB.prepare(`
            INSERT INTO purchases (id, purchaseNumber, deviceType, brand, modelName, serialNumber, purchaseDate, vendor, deviceCost, totalAccessoriesCost, grandTotalCost, status, data, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              purchaseNumber = excluded.purchaseNumber,
              deviceType = excluded.deviceType,
              brand = excluded.brand,
              modelName = excluded.modelName,
              serialNumber = excluded.serialNumber,
              purchaseDate = excluded.purchaseDate,
              vendor = excluded.vendor,
              deviceCost = excluded.deviceCost,
              totalAccessoriesCost = excluded.totalAccessoriesCost,
              grandTotalCost = excluded.grandTotalCost,
              status = excluded.status,
              data = excluded.data,
              updated_at = excluded.updated_at
          `);
          stmt.run(
            item.id,
            item.purchaseNumber || item.id,
            item.deviceType || 'Laptop',
            item.brand || '',
            item.modelName || '',
            item.serialNumber || '',
            item.purchaseDate || '',
            item.vendor || '',
            Number(item.deviceCost) || 0,
            Number(item.totalAccessoriesCost) || 0,
            Number(item.grandTotalCost) || 0,
            item.status || 'In Stock',
            dataStr,
            now
          );
        } else if (collection === 'asset_requests') {
          const stmt = sqliteDB.prepare(`
            INSERT INTO asset_requests (id, employeeId, employeeName, department, urgency, status, data, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              employeeId = excluded.employeeId,
              employeeName = excluded.employeeName,
              department = excluded.department,
              urgency = excluded.urgency,
              status = excluded.status,
              data = excluded.data,
              updated_at = excluded.updated_at
          `);
          stmt.run(
            item.id,
            item.employeeId || '',
            item.employeeName || '',
            item.department || '',
            item.urgency || 'Normal',
            item.status || 'Pending',
            dataStr,
            now
          );
        }
        return item;
      } catch (err) {
        console.error(`[SQLite Error] upsert(${collection}):`, err.message);
        throw err;
      }
    }

    // 3. Fallback
    if (!fallbackState[collection]) fallbackState[collection] = [];
    const idx = fallbackState[collection].findIndex(i => i.id === item.id);
    if (idx >= 0) {
      fallbackState[collection][idx] = item;
    } else {
      fallbackState[collection].push(item);
    }
    saveFallback();
    return item;
  },

  // Delete an item permanently
  async delete(collection, id) {
    if (pgPool) {
      try {
        const res = await pgPool.query(`DELETE FROM ${collection} WHERE id = $1`, [id]);
        return (res.rowCount || 0) > 0;
      } catch (err) {
        console.error(`[PostgreSQL Error] delete(${collection}, ${id}):`, err.message);
        return false;
      }
    }

    if (sqliteDB) {
      try {
        const stmt = sqliteDB.prepare(`DELETE FROM ${collection} WHERE id = ?`);
        stmt.run(id);
        return true;
      } catch (err) {
        console.error(`[SQLite Error] delete(${collection}, ${id}):`, err.message);
        return false;
      }
    }

    if (fallbackState[collection]) {
      fallbackState[collection] = fallbackState[collection].filter(i => i.id !== id);
      saveFallback();
    }
    return true;
  },

  // Delete all items (Admin initiated purge / reset)
  async clear(collection) {
    if (pgPool) {
      try {
        await pgPool.query(`TRUNCATE TABLE ${collection}`);
        return true;
      } catch (err) {
        console.error(`[PostgreSQL Error] clear(${collection}):`, err.message);
        return false;
      }
    }

    if (sqliteDB) {
      try {
        sqliteDB.exec(`DELETE FROM ${collection}`);
        return true;
      } catch (err) {
        console.error(`[SQLite Error] clear(${collection}):`, err.message);
        return false;
      }
    }

    fallbackState[collection] = [];
    saveFallback();
    return true;
  },

  // Batch insert/upsert
  async batchUpsert(collection, items) {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      await this.upsert(collection, item);
    }
  },

  // System stats & telemetry
  async getStats() {
    const collections = ['employees', 'computers', 'assets', 'service_records', 'allocations', 'audit_logs', 'weekly_photos', 'purchases', 'asset_requests'];
    const counts = {};
    let total = 0;

    if (pgPool) {
      try {
        for (const c of collections) {
          const res = await pgPool.query(`SELECT COUNT(*) as count FROM ${c}`);
          const count = parseInt(res.rows[0].count, 10) || 0;
          counts[c] = count;
          total += count;
        }

        return {
          connected: true,
          engine: 'Cloud PostgreSQL (Production)',
          dbPath: 'Remote PostgreSQL Managed Cluster',
          totalRecords: total,
          counts,
          lastChecked: new Date().toISOString(),
        };
      } catch (err) {
        console.error('[PostgreSQL Error] getStats():', err.message);
        return {
          connected: false,
          engine: 'Cloud PostgreSQL (Error)',
          dbPath: 'PostgreSQL Error: ' + err.message,
          totalRecords: 0,
          counts: {},
          lastChecked: new Date().toISOString(),
        };
      }
    }

    for (const c of collections) {
      const items = await this.getAll(c);
      counts[c] = items.length;
      total += items.length;
    }

    let fileSize = 0;
    try {
      if (fs.existsSync(this.dbPath)) {
        fileSize = fs.statSync(this.dbPath).size;
      }
    } catch {}

    return {
      connected: true,
      engine: this.isSQLite ? 'Native SQLite (WAL Mode)' : 'Atomic JSON Persistence',
      dbPath: this.dbPath,
      fileSizeBytes: fileSize,
      totalRecords: total,
      counts,
      lastChecked: new Date().toISOString(),
    };
  }
};
