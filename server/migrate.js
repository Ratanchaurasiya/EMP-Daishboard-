// Standalone Database Migration Script for MySQL / MariaDB
import mysql from 'mysql2/promise';

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {}
}

const DATABASE_URL = process.env.DATABASE_URL || process.env.MYSQL_URL;

export async function runMigrations() {
  console.log('====================================================');
  console.log('🚀 Running AssetCore MySQL / MariaDB Migrations');
  console.log('====================================================');

  if (!DATABASE_URL) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Migration Error] Fatal: DATABASE_URL / MYSQL_URL environment variable is not defined.');
      process.exit(1);
    } else {
      console.log('[Migration] No DATABASE_URL found. Skipping MySQL migration in local mode.');
      return;
    }
  }

  const isLocalhost = DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1');
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

    connection.release();
    await pool.end();

    console.log('✅ MySQL / MariaDB Schema migrations completed successfully.');
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
