import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import pg from 'pg';

const { Pool: PgPool } = pg;

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {}
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure server/data directory exists for persistent local SQLite storage
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = process.env.SQLITE_PATH || path.join(DATA_DIR, 'assetcore.db');
const JSON_BACKUP_PATH = path.join(DATA_DIR, 'database_fallback.json');

// Support Cloud Database URLs (PostgreSQL or MySQL)
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.PG_URL || process.env.MYSQL_URL || null;
const isProduction = process.env.NODE_ENV === 'production';
const allowSqliteInProd = process.env.ALLOW_SQLITE_IN_PROD === 'true' || Boolean(process.env.SQLITE_PATH);

let pgPool = null;
let mysqlPool = null;
let sqliteDB = null;
let useFallback = false;
let activeEngine = 'initializing';

const isPostgresUrl = Boolean(
  DATABASE_URL && (
    DATABASE_URL.startsWith('postgres://') ||
    DATABASE_URL.startsWith('postgresql://') ||
    DATABASE_URL.includes('cockroachdb') ||
    Boolean(process.env.PGHOST)
  )
);

const isMySqlUrl = Boolean(
  DATABASE_URL && (
    DATABASE_URL.startsWith('mysql://') ||
    DATABASE_URL.startsWith('mysql2://') ||
    DATABASE_URL.includes('mysql') ||
    Boolean(process.env.MYSQL_HOST)
  )
);

// -------------------------------------------------------------
// 1. Initialize PostgreSQL Connection Pool if PostgreSQL URL is supplied
// -------------------------------------------------------------
if (isPostgresUrl) {
  try {
    const isLocalhost = DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1');
    pgPool = new PgPool({
      connectionString: DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
    });

    // Test connection synchronously on startup
    const client = await pgPool.connect();
    activeEngine = 'Cloud PostgreSQL (Production)';
    console.log('[Database] Connected successfully to Cloud PostgreSQL managed production database.');
    client.release();

    // Verify & Initialize PostgreSQL Tables Idempotently
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        employee_id VARCHAR(100) NULL,
        name VARCHAR(255) NULL,
        department VARCHAR(255) NULL,
        status VARCHAR(100) NULL,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_pg_emp_employee_id ON employees (employee_id);

      CREATE TABLE IF NOT EXISTS computers (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        asset_number VARCHAR(100) NULL,
        assigned_employee_id VARCHAR(100) NULL,
        status VARCHAR(100) NULL,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_pg_comp_asset_number ON computers (asset_number);
      CREATE INDEX IF NOT EXISTS idx_pg_comp_assigned_emp ON computers (assigned_employee_id);

      CREATE TABLE IF NOT EXISTS assets (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        asset_number VARCHAR(100) NULL,
        asset_type VARCHAR(100) NULL,
        assigned_employee_id VARCHAR(100) NULL,
        status VARCHAR(100) NULL,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_pg_asset_asset_number ON assets (asset_number);
      CREATE INDEX IF NOT EXISTS idx_pg_asset_assigned_emp ON assets (assigned_employee_id);

      CREATE TABLE IF NOT EXISTS service_records (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        computer_id VARCHAR(100) NULL,
        employee_id VARCHAR(100) NULL,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_pg_srv_comp ON service_records (computer_id);
      CREATE INDEX IF NOT EXISTS idx_pg_srv_emp ON service_records (employee_id);

      CREATE TABLE IF NOT EXISTS allocations (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        employee_id VARCHAR(100) NULL,
        asset_id VARCHAR(100) NULL,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_pg_alloc_emp ON allocations (employee_id);
      CREATE INDEX IF NOT EXISTS idx_pg_alloc_asset ON allocations (asset_id);

      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        action VARCHAR(255) NULL,
        actor VARCHAR(255) NULL,
        timestamp VARCHAR(100) NULL,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS weekly_photos (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        employee_id VARCHAR(100) NULL,
        week_start_date VARCHAR(50) NULL,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_pg_photo_emp ON weekly_photos (employee_id);

      CREATE TABLE IF NOT EXISTS purchases (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        purchase_number VARCHAR(100) NULL,
        device_type VARCHAR(100) NULL,
        brand VARCHAR(100) NULL,
        model_name VARCHAR(255) NULL,
        serial_number VARCHAR(100) NULL,
        purchase_date VARCHAR(50) NULL,
        vendor VARCHAR(255) NULL,
        device_cost NUMERIC(12,2) DEFAULT 0,
        total_accessories_cost NUMERIC(12,2) DEFAULT 0,
        grand_total_cost NUMERIC(12,2) DEFAULT 0,
        status VARCHAR(100) NULL,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_pg_purchases_sn ON purchases (serial_number);

      CREATE TABLE IF NOT EXISTS asset_requests (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        employee_id VARCHAR(100) NULL,
        employee_name VARCHAR(255) NULL,
        department VARCHAR(255) NULL,
        urgency VARCHAR(100) NULL,
        status VARCHAR(100) NULL,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_pg_req_emp ON asset_requests (employee_id);
      CREATE INDEX IF NOT EXISTS idx_pg_req_status ON asset_requests (status);

      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(255) NOT NULL PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sim_cards (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        contact_number VARCHAR(100) NULL,
        assigned_employee_id VARCHAR(100) NULL,
        status VARCHAR(100) NULL,
        purpose VARCHAR(100) NULL,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_pg_sim_contact ON sim_cards (contact_number);
      CREATE INDEX IF NOT EXISTS idx_pg_sim_assigned_emp ON sim_cards (assigned_employee_id);
      CREATE INDEX IF NOT EXISTS idx_pg_sim_status ON sim_cards (status);

      CREATE TABLE IF NOT EXISTS sim_recharges (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        sim_id VARCHAR(100) NULL,
        employee_id VARCHAR(100) NULL,
        recharge_date VARCHAR(50) NULL,
        recharge_amount NUMERIC(12,2) DEFAULT 0,
        total_amount NUMERIC(12,2) DEFAULT 0,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_pg_rec_sim ON sim_recharges (sim_id);
      CREATE INDEX IF NOT EXISTS idx_pg_rec_emp ON sim_recharges (employee_id);

      CREATE TABLE IF NOT EXISTS sim_requests (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        employee_id VARCHAR(100) NULL,
        request_type VARCHAR(100) NULL,
        status VARCHAR(100) NULL,
        urgency VARCHAR(100) NULL,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_pg_simreq_emp ON sim_requests (employee_id);
      CREATE INDEX IF NOT EXISTS idx_pg_simreq_status ON sim_requests (status);

      CREATE TABLE IF NOT EXISTS service_providers (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        technician_name VARCHAR(255) NULL,
        shop_name VARCHAR(255) NULL,
        phone_number VARCHAR(100) NULL,
        service_type VARCHAR(255) NULL,
        city VARCHAR(100) NULL,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_pg_prov_type ON service_providers (service_type);

      CREATE TABLE IF NOT EXISTS asset_queries (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        employee_id VARCHAR(100) NULL,
        asset_number VARCHAR(100) NULL,
        status VARCHAR(100) NULL,
        query_type VARCHAR(100) NULL,
        is_starred BOOLEAN DEFAULT FALSE,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_pg_qry_emp ON asset_queries (employee_id);
      CREATE INDEX IF NOT EXISTS idx_pg_qry_status ON asset_queries (status);
    `);

    console.log('[Database] Cloud PostgreSQL tables & indices verified.');
  } catch (err) {
    console.error('[Database Error] Failed to connect to PostgreSQL from DATABASE_URL:', err.message);
    if (isProduction) {
      console.error('[Database Error] Production requires a valid persistent database connection. Exiting to prevent ephemeral data loss.');
      throw new Error(`PostgreSQL Connection Failed: ${err.message}`);
    }
    console.warn('[Database] Falling back to local development SQLite engine...');
    pgPool = null;
  }
}

// -------------------------------------------------------------
// 2. Initialize MySQL / MariaDB Connection Pool if MySQL URL is supplied
// -------------------------------------------------------------
if (!pgPool && isMySqlUrl) {
  try {
    const isLocalhost = DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1');
    const poolConfig = {
      uri: DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 20,
      queueLimit: 0,
      connectTimeout: 15000,
      multipleStatements: true,
      ssl: isLocalhost ? undefined : { rejectUnauthorized: false },
    };

    mysqlPool = mysql.createPool(poolConfig);

    const connection = await mysqlPool.getConnection();
    activeEngine = 'Cloud MySQL / MariaDB (Production)';
    console.log('[Database] Connected successfully to Cloud MySQL / MariaDB production database.');
    connection.release();

    // Verify & Initialize MySQL Tables Idempotently
    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        employee_id VARCHAR(100) NULL,
        name VARCHAR(255) NULL,
        department VARCHAR(255) NULL,
        status VARCHAR(100) NULL,
        data JSON NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_emp_employee_id (employee_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS computers (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        asset_number VARCHAR(100) NULL,
        assigned_employee_id VARCHAR(100) NULL,
        status VARCHAR(100) NULL,
        data JSON NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_comp_asset_number (asset_number),
        INDEX idx_comp_assigned_emp (assigned_employee_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS assets (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        asset_number VARCHAR(100) NULL,
        asset_type VARCHAR(100) NULL,
        assigned_employee_id VARCHAR(100) NULL,
        status VARCHAR(100) NULL,
        data JSON NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_asset_asset_number (asset_number),
        INDEX idx_asset_assigned_emp (assigned_employee_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS service_records (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        computer_id VARCHAR(100) NULL,
        employee_id VARCHAR(100) NULL,
        data JSON NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_srv_comp (computer_id),
        INDEX idx_srv_emp (employee_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS allocations (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        employee_id VARCHAR(100) NULL,
        asset_id VARCHAR(100) NULL,
        data JSON NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_alloc_emp (employee_id),
        INDEX idx_alloc_asset (asset_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        action VARCHAR(255) NULL,
        actor VARCHAR(255) NULL,
        timestamp VARCHAR(100) NULL,
        data JSON NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS weekly_photos (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        employee_id VARCHAR(100) NULL,
        week_start_date VARCHAR(50) NULL,
        data JSON NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_photo_emp (employee_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        purchase_number VARCHAR(100) NULL,
        device_type VARCHAR(100) NULL,
        brand VARCHAR(100) NULL,
        model_name VARCHAR(255) NULL,
        serial_number VARCHAR(100) NULL,
        purchase_date VARCHAR(50) NULL,
        vendor VARCHAR(255) NULL,
        device_cost DECIMAL(12,2) DEFAULT 0,
        total_accessories_cost DECIMAL(12,2) DEFAULT 0,
        grand_total_cost DECIMAL(12,2) DEFAULT 0,
        status VARCHAR(100) NULL,
        data JSON NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_purchases_sn (serial_number)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS asset_requests (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        employee_id VARCHAR(100) NULL,
        employee_name VARCHAR(255) NULL,
        department VARCHAR(255) NULL,
        urgency VARCHAR(100) NULL,
        status VARCHAR(100) NULL,
        data JSON NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_req_emp (employee_id),
        INDEX idx_req_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        \`key\` VARCHAR(255) NOT NULL PRIMARY KEY,
        \`value\` LONGTEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS sim_cards (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        contact_number VARCHAR(100) NULL,
        assigned_employee_id VARCHAR(100) NULL,
        status VARCHAR(100) NULL,
        purpose VARCHAR(100) NULL,
        data JSON NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_sim_contact (contact_number),
        INDEX idx_sim_assigned_emp (assigned_employee_id),
        INDEX idx_sim_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS sim_recharges (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        sim_id VARCHAR(100) NULL,
        employee_id VARCHAR(100) NULL,
        recharge_date VARCHAR(50) NULL,
        recharge_amount DECIMAL(12,2) DEFAULT 0,
        total_amount DECIMAL(12,2) DEFAULT 0,
        data JSON NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_rec_sim (sim_id),
        INDEX idx_rec_emp (employee_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS sim_requests (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        employee_id VARCHAR(100) NULL,
        request_type VARCHAR(100) NULL,
        status VARCHAR(100) NULL,
        urgency VARCHAR(100) NULL,
        data JSON NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_simreq_emp (employee_id),
        INDEX idx_simreq_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

      CREATE TABLE IF NOT EXISTS service_providers (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        technician_name VARCHAR(255) NULL,
        shop_name VARCHAR(255) NULL,
        phone_number VARCHAR(100) NULL,
        service_type VARCHAR(255) NULL,
        city VARCHAR(100) NULL,
        data JSON NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_prov_type (service_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

      CREATE TABLE IF NOT EXISTS asset_queries (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        employee_id VARCHAR(100) NULL,
        asset_number VARCHAR(100) NULL,
        status VARCHAR(100) NULL,
        query_type VARCHAR(100) NULL,
        is_starred BOOLEAN DEFAULT FALSE,
        data JSON NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_qry_emp (employee_id),
        INDEX idx_qry_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('[Database] Cloud MySQL / MariaDB tables & indices verified.');
  } catch (err) {
    console.error('[Database Error] Failed to connect to MySQL from DATABASE_URL:', err.message);
    if (isProduction) {
      console.error('[Database Error] Production requires a valid MySQL connection. Exiting to prevent ephemeral data loss.');
      throw new Error(`MySQL Connection Failed: ${err.message}`);
    }
    console.warn('[Database] Falling back to local development SQLite engine...');
    mysqlPool = null;
  }
}

// In production / Vercel serverless deployment, ensure a persistent cloud database is configured
const isVercelServerless = Boolean(process.env.VERCEL) || Boolean(process.env.VERCEL_ENV);

if ((isProduction || isVercelServerless) && !pgPool && !mysqlPool && !allowSqliteInProd) {
  console.error('[Database Error] Fatal: DATABASE_URL environment variable is missing or invalid in Production.');
  console.error('[Database Error] Ephemeral SQLite files cannot be used on Vercel serverless platform as data will be lost across cold starts.');
  console.error('[Database Error] Please set DATABASE_URL in Vercel Project Settings with your Cloud MySQL or PostgreSQL connection string.');
  throw new Error('DATABASE_URL environment variable is required in production mode for database persistence.');
}

// -------------------------------------------------------------
// 3. Initialize Native SQLite (WAL mode) for disk persistence (Local Dev Only)
// -------------------------------------------------------------
if (!pgPool && !mysqlPool) {
  try {
    const sqlite = await import('node:sqlite');
    if (sqlite && sqlite.DatabaseSync) {
      sqliteDB = new sqlite.DatabaseSync(DB_PATH);
      sqliteDB.exec('PRAGMA journal_mode = WAL;');
      sqliteDB.exec('PRAGMA synchronous = NORMAL;');
      activeEngine = 'Native SQLite (WAL Mode)';
      console.log(`[Database] Native SQLite initialized at persistent path: ${DB_PATH}`);

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
          data TEXT NOT NULL
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
          value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sim_cards (
          id TEXT PRIMARY KEY,
          contactNumber TEXT,
          assignedEmployeeId TEXT,
          status TEXT,
          purpose TEXT,
          data TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sim_recharges (
          id TEXT PRIMARY KEY,
          simId TEXT,
          employeeId TEXT,
          rechargeDate TEXT,
          data TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sim_requests (
          id TEXT PRIMARY KEY,
          employeeId TEXT,
          requestType TEXT,
          status TEXT,
          data TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS service_providers (
          id TEXT PRIMARY KEY,
          technicianName TEXT,
          shopName TEXT,
          phoneNumber TEXT,
          serviceType TEXT,
          city TEXT,
          data TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS asset_queries (
          id TEXT PRIMARY KEY,
          employeeId TEXT,
          assetNumber TEXT,
          status TEXT,
          queryType TEXT,
          isStarred INTEGER,
          data TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
    } else {
      if (isProduction) {
        throw new Error('Native SQLite is unavailable and in-memory fallback is forbidden in production mode.');
      }
      useFallback = true;
    }
  } catch (err) {
    if (isProduction) {
      console.error('[Database Error] Fatal SQLite failure in production:', err.message);
      throw new Error(`Persistent SQLite Failure in production: ${err.message}`);
    }
    console.warn('[Database] Native SQLite unavailable, enabling persistent atomic JSON engine:', err.message);
    useFallback = true;
  }
}

// Fallback JSON in-memory store for local development ONLY without Node 22 SQLite
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
  sim_cards: [],
  sim_recharges: [],
  sim_requests: [],
  service_providers: [],
  asset_queries: [],
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

// -------------------------------------------------------------
// Database Unified Abstraction Object (ACID Persistent Layer)
// -------------------------------------------------------------
export const db = {
  get isPostgres() {
    return Boolean(pgPool);
  },
  get isMySQL() {
    return Boolean(mysqlPool);
  },
  get isSQLite() {
    return Boolean(sqliteDB);
  },
  get activeEngine() {
    return activeEngine;
  },
  get dbPath() {
    if (pgPool) return 'Cloud PostgreSQL (Managed Database Cluster)';
    if (mysqlPool) return 'Cloud MySQL / MariaDB (Managed Database Cluster)';
    return useFallback ? JSON_BACKUP_PATH : DB_PATH;
  },

  // Flushes WAL journal to main SQLite file on demand
  checkpoint() {
    if (sqliteDB) {
      try {
        sqliteDB.exec('PRAGMA wal_checkpoint(PASSIVE);');
      } catch {}
    }
  },

  // Get all items from a collection
  async getAll(collection) {
    // 1. PostgreSQL
    if (pgPool) {
      try {
        const orderCol = collection === 'audit_logs' ? 'timestamp' : 'updated_at';
        const query = `SELECT data FROM "${collection}" ORDER BY ${orderCol} DESC`;
        const res = await pgPool.query(query);
        return res.rows.map(r => (typeof r.data === 'string' ? JSON.parse(r.data) : r.data));
      } catch (err) {
        try {
          const res = await pgPool.query(`SELECT data FROM "${collection}"`);
          return res.rows.map(r => (typeof r.data === 'string' ? JSON.parse(r.data) : r.data));
        } catch (e) {
          console.error(`[PostgreSQL Error] getAll(${collection}):`, e.message);
          return [];
        }
      }
    }

    // 2. MySQL
    if (mysqlPool) {
      try {
        const orderCol = collection === 'audit_logs' ? 'timestamp' : 'updated_at';
        const query = `SELECT data FROM \`${collection}\` ORDER BY ${orderCol} DESC`;
        const [rows] = await mysqlPool.query(query);
        return rows.map(r => (typeof r.data === 'string' ? JSON.parse(r.data) : r.data));
      } catch (err) {
        try {
          const [rows] = await mysqlPool.query(`SELECT data FROM \`${collection}\``);
          return rows.map(r => (typeof r.data === 'string' ? JSON.parse(r.data) : r.data));
        } catch (e) {
          console.error(`[MySQL Error] getAll(${collection}):`, e.message);
          return [];
        }
      }
    }

    // 3. SQLite
    if (sqliteDB) {
      try {
        const orderCol = collection === 'audit_logs' ? 'timestamp' : 'updated_at';
        const stmt = sqliteDB.prepare(`SELECT data FROM ${collection} ORDER BY ${orderCol} DESC`);
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

    // 4. Fallback (local dev only)
    return [...(fallbackState[collection] || [])];
  },

  // Get item by ID
  async getById(collection, id) {
    if (pgPool) {
      try {
        const res = await pgPool.query(`SELECT data FROM "${collection}" WHERE id = $1`, [id]);
        if (res.rows.length === 0) return null;
        const row = res.rows[0];
        return typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      } catch (err) {
        console.error(`[PostgreSQL Error] getById(${collection}, ${id}):`, err.message);
        return null;
      }
    }

    if (mysqlPool) {
      try {
        const [rows] = await mysqlPool.query(`SELECT data FROM \`${collection}\` WHERE id = ?`, [id]);
        if (rows.length === 0) return null;
        const row = rows[0];
        return typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      } catch (err) {
        console.error(`[MySQL Error] getById(${collection}, ${id}):`, err.message);
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

  // Insert or Update (Atomic Upsert)
  async upsert(collection, item) {
    const now = new Date().toISOString();
    const dataStr = JSON.stringify(item);

    // 1. PostgreSQL Upsert
    if (pgPool) {
      try {
        if (collection === 'employees') {
          const q = `
            INSERT INTO employees (id, employee_id, name, department, status, data, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (id) DO UPDATE SET
              employee_id = EXCLUDED.employee_id,
              name = EXCLUDED.name,
              department = EXCLUDED.department,
              status = EXCLUDED.status,
              data = EXCLUDED.data,
              updated_at = NOW()
          `;
          await pgPool.query(q, [
            item.id,
            item.employeeId || item.id,
            item.name || '',
            item.department || '',
            item.status || 'Active',
            dataStr,
          ]);
        } else if (collection === 'computers') {
          const q = `
            INSERT INTO computers (id, asset_number, assigned_employee_id, status, data, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            ON CONFLICT (id) DO UPDATE SET
              asset_number = EXCLUDED.asset_number,
              assigned_employee_id = EXCLUDED.assigned_employee_id,
              status = EXCLUDED.status,
              data = EXCLUDED.data,
              updated_at = NOW()
          `;
          await pgPool.query(q, [
            item.id,
            item.assetNumber || item.id,
            item.assignedEmployeeId || null,
            item.status || 'Available',
            dataStr,
          ]);
        } else if (collection === 'assets') {
          const q = `
            INSERT INTO assets (id, asset_number, asset_type, assigned_employee_id, status, data, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (id) DO UPDATE SET
              asset_number = EXCLUDED.asset_number,
              asset_type = EXCLUDED.asset_type,
              assigned_employee_id = EXCLUDED.assigned_employee_id,
              status = EXCLUDED.status,
              data = EXCLUDED.data,
              updated_at = NOW()
          `;
          await pgPool.query(q, [
            item.id,
            item.assetNumber || item.id,
            item.assetType || '',
            item.assignedEmployeeId || null,
            item.status || 'Available',
            dataStr,
          ]);
        } else if (collection === 'service_records') {
          const q = `
            INSERT INTO service_records (id, computer_id, employee_id, data, updated_at)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (id) DO UPDATE SET
              computer_id = EXCLUDED.computer_id,
              employee_id = EXCLUDED.employee_id,
              data = EXCLUDED.data,
              updated_at = NOW()
          `;
          await pgPool.query(q, [item.id, item.computerId || '', item.employeeId || '', dataStr]);
        } else if (collection === 'allocations') {
          const q = `
            INSERT INTO allocations (id, employee_id, asset_id, data, updated_at)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (id) DO UPDATE SET
              employee_id = EXCLUDED.employee_id,
              asset_id = EXCLUDED.asset_id,
              data = EXCLUDED.data,
              updated_at = NOW()
          `;
          await pgPool.query(q, [item.id, item.employeeId || '', item.assetId || '', dataStr]);
        } else if (collection === 'audit_logs') {
          const q = `
            INSERT INTO audit_logs (id, action, actor, timestamp, data, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            ON CONFLICT (id) DO UPDATE SET
              action = EXCLUDED.action,
              actor = EXCLUDED.actor,
              timestamp = EXCLUDED.timestamp,
              data = EXCLUDED.data,
              updated_at = NOW()
          `;
          await pgPool.query(q, [item.id, item.action || '', item.actor || '', item.timestamp || now, dataStr]);
        } else if (collection === 'weekly_photos') {
          const q = `
            INSERT INTO weekly_photos (id, employee_id, week_start_date, data, updated_at)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (id) DO UPDATE SET
              employee_id = EXCLUDED.employee_id,
              week_start_date = EXCLUDED.week_start_date,
              data = EXCLUDED.data,
              updated_at = NOW()
          `;
          await pgPool.query(q, [item.id, item.employeeId || '', item.weekStartDate || '', dataStr]);
        } else if (collection === 'purchases') {
          const q = `
            INSERT INTO purchases (id, purchase_number, device_type, brand, model_name, serial_number, purchase_date, vendor, device_cost, total_accessories_cost, grand_total_cost, status, data, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
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
              updated_at = NOW()
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
          ]);
        } else if (collection === 'asset_requests') {
          const q = `
            INSERT INTO asset_requests (id, employee_id, employee_name, department, urgency, status, data, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            ON CONFLICT (id) DO UPDATE SET
              employee_id = EXCLUDED.employee_id,
              employee_name = EXCLUDED.employee_name,
              department = EXCLUDED.department,
              urgency = EXCLUDED.urgency,
              status = EXCLUDED.status,
              data = EXCLUDED.data,
              updated_at = NOW()
          `;
          await pgPool.query(q, [
            item.id,
            item.employeeId || '',
            item.employeeName || '',
            item.department || '',
            item.urgency || 'Normal',
            item.status || 'Pending',
            dataStr,
          ]);
        } else if (collection === 'sim_cards') {
          const q = `
            INSERT INTO sim_cards (id, contact_number, assigned_employee_id, status, purpose, data, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (id) DO UPDATE SET
              contact_number = EXCLUDED.contact_number,
              assigned_employee_id = EXCLUDED.assigned_employee_id,
              status = EXCLUDED.status,
              purpose = EXCLUDED.purpose,
              data = EXCLUDED.data,
              updated_at = NOW()
          `;
          await pgPool.query(q, [
            item.id,
            item.contactNumber || '',
            item.assignedEmployeeId || null,
            item.status || 'Available',
            item.purpose || 'Holding',
            dataStr,
          ]);
        } else if (collection === 'sim_recharges') {
          const q = `
            INSERT INTO sim_recharges (id, sim_id, employee_id, recharge_date, recharge_amount, total_amount, data, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            ON CONFLICT (id) DO UPDATE SET
              sim_id = EXCLUDED.sim_id,
              employee_id = EXCLUDED.employee_id,
              recharge_date = EXCLUDED.recharge_date,
              recharge_amount = EXCLUDED.recharge_amount,
              total_amount = EXCLUDED.total_amount,
              data = EXCLUDED.data,
              updated_at = NOW()
          `;
          await pgPool.query(q, [
            item.id,
            item.simId || '',
            item.employeeId || null,
            item.rechargeDate || '',
            Number(item.rechargeAmount) || 0,
            Number(item.totalAmount) || 0,
            dataStr,
          ]);
        } else if (collection === 'sim_requests') {
          const q = `
            INSERT INTO sim_requests (id, employee_id, request_type, status, urgency, data, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (id) DO UPDATE SET
              employee_id = EXCLUDED.employee_id,
              request_type = EXCLUDED.request_type,
              status = EXCLUDED.status,
              urgency = EXCLUDED.urgency,
              data = EXCLUDED.data,
              updated_at = NOW()
          `;
          await pgPool.query(q, [
            item.id,
            item.employeeId || '',
            item.requestType || 'Additional SIM',
            item.status || 'Pending',
            item.urgency || 'Normal',
            dataStr,
          ]);
        } else if (collection === 'service_providers') {
          const q = `
            INSERT INTO service_providers (id, technician_name, shop_name, phone_number, service_type, city, data, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            ON CONFLICT (id) DO UPDATE SET
              technician_name = EXCLUDED.technician_name,
              shop_name = EXCLUDED.shop_name,
              phone_number = EXCLUDED.phone_number,
              service_type = EXCLUDED.service_type,
              city = EXCLUDED.city,
              data = EXCLUDED.data,
              updated_at = NOW()
          `;
          await pgPool.query(q, [
            item.id,
            item.technicianName || '',
            item.shopName || '',
            item.phoneNumber || '',
            item.serviceType || 'Other',
            item.city || '',
            dataStr,
          ]);
        } else if (collection === 'asset_queries') {
          const q = `
            INSERT INTO asset_queries (id, employee_id, asset_number, status, query_type, is_starred, data, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            ON CONFLICT (id) DO UPDATE SET
              employee_id = EXCLUDED.employee_id,
              asset_number = EXCLUDED.asset_number,
              status = EXCLUDED.status,
              query_type = EXCLUDED.query_type,
              is_starred = EXCLUDED.is_starred,
              data = EXCLUDED.data,
              updated_at = NOW()
          `;
          await pgPool.query(q, [
            item.id,
            item.employeeId || '',
            item.assetNumber || '',
            item.status || 'Open',
            item.queryType || 'Fault',
            Boolean(item.isStarred),
            dataStr,
          ]);
        } else if (collection === 'system_settings') {
          const q = `
            INSERT INTO system_settings (key, value, updated_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (key) DO UPDATE SET
              value = EXCLUDED.value,
              updated_at = NOW()
          `;
          await pgPool.query(q, [item.key, item.value || '']);
        }
        return item;
      } catch (err) {
        console.error(`[PostgreSQL Error] upsert(${collection}):`, err.message);
        throw err;
      }
    }

    // 2. MySQL Upsert
    if (mysqlPool) {
      try {
        if (collection === 'employees') {
          const q = `
            INSERT INTO employees (id, employee_id, name, department, status, data, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
              employee_id = VALUES(employee_id),
              name = VALUES(name),
              department = VALUES(department),
              status = VALUES(status),
              data = VALUES(data),
              updated_at = NOW()
          `;
          await mysqlPool.query(q, [
            item.id,
            item.employeeId || item.id,
            item.name || '',
            item.department || '',
            item.status || 'Active',
            dataStr,
          ]);
        } else if (collection === 'computers') {
          const q = `
            INSERT INTO computers (id, asset_number, assigned_employee_id, status, data, updated_at)
            VALUES (?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
              asset_number = VALUES(asset_number),
              assigned_employee_id = VALUES(assigned_employee_id),
              status = VALUES(status),
              data = VALUES(data),
              updated_at = NOW()
          `;
          await mysqlPool.query(q, [
            item.id,
            item.assetNumber || item.id,
            item.assignedEmployeeId || null,
            item.status || 'Available',
            dataStr,
          ]);
        } else if (collection === 'assets') {
          const q = `
            INSERT INTO assets (id, asset_number, asset_type, assigned_employee_id, status, data, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
              asset_number = VALUES(asset_number),
              asset_type = VALUES(asset_type),
              assigned_employee_id = VALUES(assigned_employee_id),
              status = VALUES(status),
              data = VALUES(data),
              updated_at = NOW()
          `;
          await mysqlPool.query(q, [
            item.id,
            item.assetNumber || item.id,
            item.assetType || '',
            item.assignedEmployeeId || null,
            item.status || 'Available',
            dataStr,
          ]);
        } else if (collection === 'service_records') {
          const q = `
            INSERT INTO service_records (id, computer_id, employee_id, data, updated_at)
            VALUES (?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
              computer_id = VALUES(computer_id),
              employee_id = VALUES(employee_id),
              data = VALUES(data),
              updated_at = NOW()
          `;
          await mysqlPool.query(q, [item.id, item.computerId || '', item.employeeId || '', dataStr]);
        } else if (collection === 'allocations') {
          const q = `
            INSERT INTO allocations (id, employee_id, asset_id, data, updated_at)
            VALUES (?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
              employee_id = VALUES(employee_id),
              asset_id = VALUES(asset_id),
              data = VALUES(data),
              updated_at = NOW()
          `;
          await mysqlPool.query(q, [item.id, item.employeeId || '', item.assetId || '', dataStr]);
        } else if (collection === 'audit_logs') {
          const q = `
            INSERT INTO audit_logs (id, action, actor, timestamp, data, updated_at)
            VALUES (?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
              action = VALUES(action),
              actor = VALUES(actor),
              timestamp = VALUES(timestamp),
              data = VALUES(data),
              updated_at = NOW()
          `;
          await mysqlPool.query(q, [item.id, item.action || '', item.actor || '', item.timestamp || now, dataStr]);
        } else if (collection === 'weekly_photos') {
          const q = `
            INSERT INTO weekly_photos (id, employee_id, week_start_date, data, updated_at)
            VALUES (?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
              employee_id = VALUES(employee_id),
              week_start_date = VALUES(week_start_date),
              data = VALUES(data),
              updated_at = NOW()
          `;
          await mysqlPool.query(q, [item.id, item.employeeId || '', item.weekStartDate || '', dataStr]);
        } else if (collection === 'purchases') {
          const q = `
            INSERT INTO purchases (id, purchase_number, device_type, brand, model_name, serial_number, purchase_date, vendor, device_cost, total_accessories_cost, grand_total_cost, status, data, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
              purchase_number = VALUES(purchase_number),
              device_type = VALUES(device_type),
              brand = VALUES(brand),
              model_name = VALUES(model_name),
              serial_number = VALUES(serial_number),
              purchase_date = VALUES(purchase_date),
              vendor = VALUES(vendor),
              device_cost = VALUES(device_cost),
              total_accessories_cost = VALUES(total_accessories_cost),
              grand_total_cost = VALUES(grand_total_cost),
              status = VALUES(status),
              data = VALUES(data),
              updated_at = NOW()
          `;
          await mysqlPool.query(q, [
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
          ]);
        } else if (collection === 'asset_requests') {
          const q = `
            INSERT INTO asset_requests (id, employee_id, employee_name, department, urgency, status, data, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
              employee_id = VALUES(employee_id),
              employee_name = VALUES(employee_name),
              department = VALUES(department),
              urgency = VALUES(urgency),
              status = VALUES(status),
              data = VALUES(data),
              updated_at = NOW()
          `;
          await mysqlPool.query(q, [
            item.id,
            item.employeeId || '',
            item.employeeName || '',
            item.department || '',
            item.urgency || 'Normal',
            item.status || 'Pending',
            dataStr,
          ]);
        } else if (collection === 'sim_cards') {
          const q = `
            INSERT INTO sim_cards (id, contact_number, assigned_employee_id, status, purpose, data, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
              contact_number = VALUES(contact_number),
              assigned_employee_id = VALUES(assigned_employee_id),
              status = VALUES(status),
              purpose = VALUES(purpose),
              data = VALUES(data),
              updated_at = NOW()
          `;
          await mysqlPool.query(q, [
            item.id,
            item.contactNumber || '',
            item.assignedEmployeeId || null,
            item.status || 'Available',
            item.purpose || 'Holding',
            dataStr,
          ]);
        } else if (collection === 'sim_recharges') {
          const q = `
            INSERT INTO sim_recharges (id, sim_id, employee_id, recharge_date, recharge_amount, total_amount, data, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
              sim_id = VALUES(sim_id),
              employee_id = VALUES(employee_id),
              recharge_date = VALUES(recharge_date),
              recharge_amount = VALUES(recharge_amount),
              total_amount = VALUES(total_amount),
              data = VALUES(data),
              updated_at = NOW()
          `;
          await mysqlPool.query(q, [
            item.id,
            item.simId || '',
            item.employeeId || null,
            item.rechargeDate || '',
            Number(item.rechargeAmount) || 0,
            Number(item.totalAmount) || 0,
            dataStr,
          ]);
        } else if (collection === 'sim_requests') {
          const q = `
            INSERT INTO sim_requests (id, employee_id, request_type, status, urgency, data, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
              employee_id = VALUES(employee_id),
              request_type = VALUES(request_type),
              status = VALUES(status),
              urgency = VALUES(urgency),
              data = VALUES(data),
              updated_at = NOW()
          `;
          await mysqlPool.query(q, [
            item.id,
            item.employeeId || '',
            item.requestType || 'Additional SIM',
            item.status || 'Pending',
            item.urgency || 'Normal',
            dataStr,
          ]);
        } else if (collection === 'service_providers') {
          const q = `
            INSERT INTO service_providers (id, technician_name, shop_name, phone_number, service_type, city, data, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
              technician_name = VALUES(technician_name),
              shop_name = VALUES(shop_name),
              phone_number = VALUES(phone_number),
              service_type = VALUES(service_type),
              city = VALUES(city),
              data = VALUES(data),
              updated_at = NOW()
          `;
          await mysqlPool.query(q, [
            item.id,
            item.technicianName || '',
            item.shopName || '',
            item.phoneNumber || '',
            item.serviceType || 'Other',
            item.city || '',
            dataStr,
          ]);
        } else if (collection === 'asset_queries') {
          const q = `
            INSERT INTO asset_queries (id, employee_id, asset_number, status, query_type, is_starred, data, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
              employee_id = VALUES(employee_id),
              asset_number = VALUES(asset_number),
              status = VALUES(status),
              query_type = VALUES(query_type),
              is_starred = VALUES(is_starred),
              data = VALUES(data),
              updated_at = NOW()
          `;
          await mysqlPool.query(q, [
            item.id,
            item.employeeId || '',
            item.assetNumber || '',
            item.status || 'Open',
            item.queryType || 'Fault',
            Boolean(item.isStarred),
            dataStr,
          ]);
        } else if (collection === 'system_settings') {
          const q = `
            INSERT INTO system_settings (\`key\`, \`value\`, updated_at)
            VALUES (?, ?, NOW())
            ON DUPLICATE KEY UPDATE
              \`value\` = VALUES(\`value\`),
              updated_at = NOW()
          `;
          await mysqlPool.query(q, [item.key, item.value || '']);
        }
        return item;
      } catch (err) {
        console.error(`[MySQL Error] upsert(${collection}):`, err.message);
        throw err;
      }
    }

    // 3. SQLite Upsert
    if (sqliteDB) {
      try {
        if (collection === 'employees') {
          try {
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
            stmt.run(item.id, item.employeeId || item.id, item.name || '', item.department || '', item.status || 'Active', dataStr, now);
          } catch {
            const delStmt = sqliteDB.prepare('DELETE FROM employees WHERE id = ? OR employeeId = ?');
            delStmt.run(item.id, item.employeeId || item.id);
            const stmt2 = sqliteDB.prepare(`
              INSERT INTO employees (id, employeeId, name, department, status, data, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            stmt2.run(item.id, item.employeeId || item.id, item.name || '', item.department || '', item.status || 'Active', dataStr, now);
          }
        } else if (collection === 'computers') {
          try {
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
            stmt.run(item.id, item.assetNumber || item.id, item.assignedEmployeeId || null, item.status || 'Assigned', dataStr, now);
          } catch {
            const delStmt = sqliteDB.prepare('DELETE FROM computers WHERE id = ? OR assetNumber = ?');
            delStmt.run(item.id, item.assetNumber || item.id);
            const stmt2 = sqliteDB.prepare(`
              INSERT INTO computers (id, assetNumber, assignedEmployeeId, status, data, updated_at)
              VALUES (?, ?, ?, ?, ?, ?)
            `);
            stmt2.run(item.id, item.assetNumber || item.id, item.assignedEmployeeId || null, item.status || 'Assigned', dataStr, now);
          }
        } else if (collection === 'assets') {
          try {
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
            stmt.run(item.id, item.assetNumber || item.id, item.assetType || 'Other', item.assignedEmployeeId || null, item.status || 'In Stock', dataStr, now);
          } catch {
            const delStmt = sqliteDB.prepare('DELETE FROM assets WHERE id = ? OR assetNumber = ?');
            delStmt.run(item.id, item.assetNumber || item.id);
            const stmt2 = sqliteDB.prepare(`
              INSERT INTO assets (id, assetNumber, assetType, assignedEmployeeId, status, data, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            stmt2.run(item.id, item.assetNumber || item.id, item.assetType || 'Other', item.assignedEmployeeId || null, item.status || 'In Stock', dataStr, now);
          }
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
        } else if (collection === 'sim_cards') {
          const stmt = sqliteDB.prepare(`
            INSERT INTO sim_cards (id, contactNumber, assignedEmployeeId, status, purpose, data, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              contactNumber = excluded.contactNumber,
              assignedEmployeeId = excluded.assignedEmployeeId,
              status = excluded.status,
              purpose = excluded.purpose,
              data = excluded.data,
              updated_at = excluded.updated_at
          `);
          stmt.run(
            item.id,
            item.contactNumber || '',
            item.assignedEmployeeId || null,
            item.status || 'Available',
            item.purpose || 'Holding',
            dataStr,
            now
          );
        } else if (collection === 'sim_recharges') {
          const stmt = sqliteDB.prepare(`
            INSERT INTO sim_recharges (id, simId, employeeId, rechargeDate, data, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              simId = excluded.simId,
              employeeId = excluded.employeeId,
              rechargeDate = excluded.rechargeDate,
              data = excluded.data,
              updated_at = excluded.updated_at
          `);
          stmt.run(
            item.id,
            item.simId || '',
            item.employeeId || null,
            item.rechargeDate || '',
            dataStr,
            now
          );
        } else if (collection === 'sim_requests') {
          const stmt = sqliteDB.prepare(`
            INSERT INTO sim_requests (id, employeeId, requestType, status, data, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              employeeId = excluded.employeeId,
              requestType = excluded.requestType,
              status = excluded.status,
              data = excluded.data,
              updated_at = excluded.updated_at
          `);
          stmt.run(
            item.id,
            item.employeeId || '',
            item.requestType || 'Additional SIM',
            item.status || 'Pending',
            dataStr,
            now
          );
        } else if (collection === 'service_providers') {
          const stmt = sqliteDB.prepare(`
            INSERT INTO service_providers (id, technicianName, shopName, phoneNumber, serviceType, city, data, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              technicianName = excluded.technicianName,
              shopName = excluded.shopName,
              phoneNumber = excluded.phoneNumber,
              serviceType = excluded.serviceType,
              city = excluded.city,
              data = excluded.data,
              updated_at = excluded.updated_at
          `);
          stmt.run(
            item.id,
            item.technicianName || '',
            item.shopName || '',
            item.phoneNumber || '',
            item.serviceType || 'Other',
            item.city || '',
            dataStr,
            now
          );
        } else if (collection === 'asset_queries') {
          const stmt = sqliteDB.prepare(`
            INSERT INTO asset_queries (id, employeeId, assetNumber, status, queryType, isStarred, data, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              employeeId = excluded.employeeId,
              assetNumber = excluded.assetNumber,
              status = excluded.status,
              queryType = excluded.queryType,
              isStarred = excluded.isStarred,
              data = excluded.data,
              updated_at = excluded.updated_at
          `);
          stmt.run(
            item.id,
            item.employeeId || '',
            item.assetNumber || '',
            item.status || 'Open',
            item.queryType || 'Fault',
            item.isStarred ? 1 : 0,
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

    // 4. Fallback (local dev only)
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
        const res = await pgPool.query(`DELETE FROM "${collection}" WHERE id = $1`, [id]);
        return (res.rowCount || 0) > 0;
      } catch (err) {
        console.error(`[PostgreSQL Error] delete(${collection}, ${id}):`, err.message);
        return false;
      }
    }

    if (mysqlPool) {
      try {
        const [res] = await mysqlPool.query(`DELETE FROM \`${collection}\` WHERE id = ?`, [id]);
        return (res.affectedRows || 0) > 0;
      } catch (err) {
        console.error(`[MySQL Error] delete(${collection}, ${id}):`, err.message);
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
        await pgPool.query(`TRUNCATE TABLE "${collection}"`);
        return true;
      } catch (err) {
        console.error(`[PostgreSQL Error] clear(${collection}):`, err.message);
        return false;
      }
    }

    if (mysqlPool) {
      try {
        await mysqlPool.query(`TRUNCATE TABLE \`${collection}\``);
        return true;
      } catch (err) {
        console.error(`[MySQL Error] clear(${collection}):`, err.message);
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
    const collections = [
      'employees',
      'computers',
      'assets',
      'service_records',
      'allocations',
      'audit_logs',
      'weekly_photos',
      'purchases',
      'asset_requests',
      'sim_cards',
      'sim_recharges',
      'sim_requests',
      'service_providers',
      'asset_queries',
    ];
    const counts = {};
    let total = 0;

    if (pgPool) {
      try {
        for (const c of collections) {
          const res = await pgPool.query(`SELECT COUNT(*) as count FROM "${c}"`);
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

    if (mysqlPool) {
      try {
        for (const c of collections) {
          const [rows] = await mysqlPool.query(`SELECT COUNT(*) as count FROM \`${c}\``);
          const count = parseInt(rows[0].count, 10) || 0;
          counts[c] = count;
          total += count;
        }

        return {
          connected: true,
          engine: 'Cloud MySQL / MariaDB (Production)',
          dbPath: 'Remote MySQL Managed Cluster',
          totalRecords: total,
          counts,
          lastChecked: new Date().toISOString(),
        };
      } catch (err) {
        console.error('[MySQL Error] getStats():', err.message);
        return {
          connected: false,
          engine: 'Cloud MySQL (Error)',
          dbPath: 'MySQL Error: ' + err.message,
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
