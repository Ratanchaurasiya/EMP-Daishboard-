// Standalone Database Migration Script for Render Cloud PostgreSQL
import pg from 'pg';

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {}
}

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

export async function runMigrations() {
  console.log('====================================================');
  console.log('🚀 Running AssetCore PostgreSQL Production Migrations');
  console.log('====================================================');

  if (!DATABASE_URL) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Migration Error] Fatal: DATABASE_URL environment variable is not defined.');
      process.exit(1);
    } else {
      console.log('[Migration] No DATABASE_URL found. Skipping PostgreSQL migration in local mode.');
      return;
    }
  }

  const isLocalhost = DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1');
  const pool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: isLocalhost ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    const client = await pool.connect();
    console.log('[Migration] Connected to PostgreSQL successfully.');

    await client.query('BEGIN');

    // 1. Employees Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(100) PRIMARY KEY,
        employee_id VARCHAR(100) UNIQUE,
        name VARCHAR(255),
        department VARCHAR(255),
        status VARCHAR(100),
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Computers Table (Laptops & Desktops)
    await client.query(`
      CREATE TABLE IF NOT EXISTS computers (
        id VARCHAR(100) PRIMARY KEY,
        asset_number VARCHAR(100) UNIQUE,
        assigned_employee_id VARCHAR(100),
        status VARCHAR(100),
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 3. Assets Table (Peripherals, Phones, Monitors, etc.)
    await client.query(`
      CREATE TABLE IF NOT EXISTS assets (
        id VARCHAR(100) PRIMARY KEY,
        asset_number VARCHAR(100) UNIQUE,
        asset_type VARCHAR(100),
        assigned_employee_id VARCHAR(100),
        status VARCHAR(100),
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 4. Service Records Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS service_records (
        id VARCHAR(100) PRIMARY KEY,
        computer_id VARCHAR(100),
        employee_id VARCHAR(100),
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 5. Allocations Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS allocations (
        id VARCHAR(100) PRIMARY KEY,
        employee_id VARCHAR(100),
        asset_id VARCHAR(100),
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 6. Audit Logs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(100) PRIMARY KEY,
        action VARCHAR(255),
        actor VARCHAR(255),
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 7. Weekly Photo Documentation Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS weekly_photos (
        id VARCHAR(100) PRIMARY KEY,
        employee_id VARCHAR(100),
        week_start_date VARCHAR(50),
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 8. Purchases & Accessories Table
    await client.query(`
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
    `);

    // 9. Asset Requests (Requisitions) Table
    await client.query(`
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
    `);

    // 10. System Settings Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Indices for High Performance Lookups & Relations
    await client.query(`
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

    await client.query('COMMIT');
    client.release();
    await pool.end();

    console.log('✅ PostgreSQL Schema migrations completed successfully.');
  } catch (err) {
    console.error('[Migration Error] Migration failed:', err.message);
    await pool.end();
    process.exit(1);
  }
}

// Run when executed directly
if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  runMigrations();
}
