// Standalone Enterprise Database Migration Script for PostgreSQL & MySQL / MariaDB
import mysql from 'mysql2/promise';
import pg from 'pg';

const { Pool: PgPool } = pg;

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {}
}

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.PG_URL || process.env.MYSQL_URL;

export async function runMigrations() {
  console.log('====================================================');
  console.log('🚀 Running AssetCore Production Database Migrations');
  console.log('====================================================');

  if (!DATABASE_URL) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Migration Error] Fatal: DATABASE_URL environment variable is not defined.');
      process.exit(1);
    } else {
      console.log('[Migration] No DATABASE_URL found. Skipping cloud migration in local SQLite mode.');
      return;
    }
  }

  const isPostgres = DATABASE_URL.startsWith('postgres://') || DATABASE_URL.startsWith('postgresql://') || Boolean(process.env.PGHOST);
  const isLocalhost = DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1');

  // -------------------------------------------------------------
  // 1. PostgreSQL Migration
  // -------------------------------------------------------------
  if (isPostgres) {
    console.log('[Migration] Target Engine: Cloud PostgreSQL');
    const pgPool = new PgPool({
      connectionString: DATABASE_URL,
      max: 5,
      connectionTimeoutMillis: 15000,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
    });

    try {
      const client = await pgPool.connect();
      console.log('[Migration] Connected to PostgreSQL successfully.');

      await client.query(`
        -- 1. Employees Table
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

        -- 2. Computers Table
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

        -- 3. Assets Table (Peripherals & Phones)
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

        -- 4. Service Records Table
        CREATE TABLE IF NOT EXISTS service_records (
          id VARCHAR(100) NOT NULL PRIMARY KEY,
          computer_id VARCHAR(100) NULL,
          employee_id VARCHAR(100) NULL,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_pg_srv_comp ON service_records (computer_id);
        CREATE INDEX IF NOT EXISTS idx_pg_srv_emp ON service_records (employee_id);

        -- 5. Allocations Table
        CREATE TABLE IF NOT EXISTS allocations (
          id VARCHAR(100) NOT NULL PRIMARY KEY,
          employee_id VARCHAR(100) NULL,
          asset_id VARCHAR(100) NULL,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_pg_alloc_emp ON allocations (employee_id);
        CREATE INDEX IF NOT EXISTS idx_pg_alloc_asset ON allocations (asset_id);

        -- 6. Audit Logs Table
        CREATE TABLE IF NOT EXISTS audit_logs (
          id VARCHAR(100) NOT NULL PRIMARY KEY,
          action VARCHAR(255) NULL,
          actor VARCHAR(255) NULL,
          timestamp VARCHAR(100) NULL,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- 7. Weekly Photos Table
        CREATE TABLE IF NOT EXISTS weekly_photos (
          id VARCHAR(100) NOT NULL PRIMARY KEY,
          employee_id VARCHAR(100) NULL,
          week_start_date VARCHAR(50) NULL,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_pg_photo_emp ON weekly_photos (employee_id);

        -- 8. Purchases & Accessories Table
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

        -- 9. Asset Requests Table
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

        -- 10. System Settings Table
        CREATE TABLE IF NOT EXISTS system_settings (
          key VARCHAR(255) NOT NULL PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- 11. SIM Cards Table
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

        -- 12. SIM Recharges Table
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

        -- 13. SIM Requests Table
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

        -- 14. Service Providers Table
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

        -- 15. Asset Queries Table
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

      client.release();
      await pgPool.end();
      console.log('✅ PostgreSQL Schema migrations completed successfully (15 tables verified).');
    } catch (err) {
      console.error('[Migration Error] PostgreSQL migration failed:', err.message);
      await pgPool.end();
      process.exit(1);
    }
    return;
  }

  // -------------------------------------------------------------
  // 2. MySQL / MariaDB Migration
  // -------------------------------------------------------------
  console.log('[Migration] Target Engine: Cloud MySQL / MariaDB');
  const pool = mysql.createPool({
    uri: DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    connectTimeout: 15000,
    ssl: isLocalhost ? undefined : { rejectUnauthorized: false },
  });

  try {
    const connection = await pool.getConnection();
    console.log('[Migration] Connected to MySQL database successfully.');

    // 1. Employees Table
    await connection.query(`
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

    // 2. Computers Table (Laptops & Desktops)
    await connection.query(`
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

    // 3. Assets Table (Peripherals, Phones, Monitors, etc.)
    await connection.query(`
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

    // 4. Service Records Table
    await connection.query(`
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

    // 5. Allocations Table
    await connection.query(`
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

    // 6. Audit Logs Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        action VARCHAR(255) NULL,
        actor VARCHAR(255) NULL,
        timestamp VARCHAR(100) NULL,
        data JSON NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 7. Weekly Photo Documentation Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS weekly_photos (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        employee_id VARCHAR(100) NULL,
        week_start_date VARCHAR(50) NULL,
        data JSON NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_photo_emp (employee_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 8. Purchases & Accessories Table
    await connection.query(`
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

    // 9. Asset Requests (Requisitions) Table
    await connection.query(`
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

    // 10. System Settings Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        \`key\` VARCHAR(255) NOT NULL PRIMARY KEY,
        \`value\` LONGTEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 11. SIM Cards Table
    await connection.query(`
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

    // 12. SIM Recharges Table
    await connection.query(`
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

    // 13. SIM Requests Table
    await connection.query(`
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
    `);

    // 14. Service Providers Table
    await connection.query(`
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
    `);

    // 15. Asset Queries Table
    await connection.query(`
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

    connection.release();
    await pool.end();

    console.log('✅ MySQL / MariaDB Schema migrations completed successfully (15 tables verified).');
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
