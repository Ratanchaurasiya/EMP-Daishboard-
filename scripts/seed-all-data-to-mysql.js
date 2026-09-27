import mysql from 'mysql2/promise';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectDir = path.resolve(__dirname, '..');

// 1. Load Environment
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {}
}

const DATABASE_URL = process.env.DATABASE_URL || 'mysql://root:Ratan@localhost:3306/assetcore';

async function seedAllDataToMySQL() {
  console.log('================================================================');
  console.log('🚀 AssetCore / EASH: Full Data Population & MySQL Workbench Setup');
  console.log('================================================================\n');

  // Verify connection
  const connection = await mysql.createConnection({
    uri: DATABASE_URL,
    multipleStatements: true,
  });

  console.log('✅ Connected successfully to MySQL at localhost:3306 database "assetcore"');

  // Ensure all tables exist
  console.log('📦 Verifying / creating all 17 database tables...');
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

    CREATE TABLE IF NOT EXISTS service_records (
      id VARCHAR(100) NOT NULL PRIMARY KEY,
      computer_id VARCHAR(100) NULL,
      employee_id VARCHAR(100) NULL,
      data JSON NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_srv_comp (computer_id),
      INDEX idx_srv_emp (employee_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS allocations (
      id VARCHAR(100) NOT NULL PRIMARY KEY,
      employee_id VARCHAR(100) NULL,
      asset_id VARCHAR(100) NULL,
      data JSON NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_alloc_emp (employee_id),
      INDEX idx_alloc_asset (asset_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(100) NOT NULL PRIMARY KEY,
      action VARCHAR(255) NULL,
      actor VARCHAR(255) NULL,
      timestamp VARCHAR(100) NULL,
      data JSON NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS weekly_photos (
      id VARCHAR(100) NOT NULL PRIMARY KEY,
      employee_id VARCHAR(100) NULL,
      week_start_date VARCHAR(50) NULL,
      data JSON NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_photo_emp (employee_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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

    CREATE TABLE IF NOT EXISTS system_settings (
      \`key\` VARCHAR(255) NOT NULL PRIMARY KEY,
      \`value\` LONGTEXT NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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

    CREATE TABLE IF NOT EXISTS removed_employees (
      id VARCHAR(100) NOT NULL PRIMARY KEY,
      employee_id VARCHAR(100) NULL,
      name VARCHAR(255) NULL,
      department VARCHAR(255) NULL,
      removed_date VARCHAR(100) NULL,
      removed_by VARCHAR(255) NULL,
      data JSON NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_rem_emp (employee_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS exit_clearances (
      id VARCHAR(100) NOT NULL PRIMARY KEY,
      employee_id VARCHAR(100) NULL,
      employee_name VARCHAR(255) NULL,
      department VARCHAR(255) NULL,
      exit_date VARCHAR(50) NULL,
      status VARCHAR(100) NULL,
      data JSON NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_clr_emp (employee_id),
      INDEX idx_clr_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  console.log('✅ All 17 tables confirmed in MySQL.\n');

  // Load Seed Data
  console.log('📥 Loading initial seed dataset...');
  const seedMod = await import('../server/data/initialSeedData.mjs');

  const mapping = [
    { collection: 'employees', data: seedMod.INITIAL_EMPLOYEES },
    { collection: 'computers', data: seedMod.INITIAL_COMPUTERS },
    { collection: 'assets', data: seedMod.INITIAL_COMPANY_ASSETS },
    { collection: 'allocations', data: seedMod.INITIAL_ALLOCATION_RECORDS },
    { collection: 'service_records', data: seedMod.INITIAL_SERVICE_RECORDS },
    { collection: 'audit_logs', data: seedMod.INITIAL_AUDIT_LOGS },
    { collection: 'weekly_photos', data: seedMod.INITIAL_WEEKLY_PHOTO_RECORDS },
    { collection: 'purchases', data: seedMod.INITIAL_PURCHASES },
    { collection: 'sim_cards', data: seedMod.INITIAL_SIM_CARDS },
    { collection: 'sim_recharges', data: seedMod.INITIAL_SIM_RECHARGES },
    { collection: 'sim_requests', data: seedMod.INITIAL_SIM_REQUESTS },
    { collection: 'service_providers', data: seedMod.INITIAL_SERVICE_PROVIDERS },
    { collection: 'asset_queries', data: seedMod.INITIAL_ASSET_QUERIES },
  ];

  for (const item of mapping) {
    if (item.data && Array.isArray(item.data)) {
      console.log(`  ⏳ Populating "${item.collection}" (${item.data.length} records)...`);
      for (const record of item.data) {
        await db.upsert(item.collection, record);
      }
      console.log(`  ✅ "${item.collection}" populated.`);
    }
  }

  // Also import from migration-backup if any records exist
  const backupDir = path.join(projectDir, 'server/data/migration-backup');
  if (fs.existsSync(backupDir)) {
    console.log('\n📥 Merging existing backup files from server/data/migration-backup...');
    const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json') && f !== 'backup-manifest.json');
    for (const f of files) {
      const coll = f.replace('.json', '');
      try {
        const content = JSON.parse(fs.readFileSync(path.join(backupDir, f), 'utf8'));
        const rows = content.rows || (Array.isArray(content) ? content : []);
        if (rows.length > 0) {
          console.log(`  ⏳ Merging "${coll}" (${rows.length} rows)...`);
          for (const r of rows) {
            const rowData = r.data ? (typeof r.data === 'string' ? JSON.parse(r.data) : r.data) : r;
            if (rowData && rowData.id) {
              await db.upsert(coll, rowData);
            }
          }
          console.log(`  ✅ "${coll}" merged.`);
        }
      } catch (err) {
        console.warn(`  ⚠️ Could not read ${f}:`, err.message);
      }
    }
  }

  // Create MySQL Views for MySQL Workbench convenience
  console.log('\n📊 Creating / updating SQL Views for MySQL Workbench...');
  await connection.query(`
    -- View: v_employees
    CREATE OR REPLACE VIEW v_employees AS
    SELECT
      id,
      employee_id,
      name,
      department,
      status,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.companyEmployeeNumber')) AS company_employee_number,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.designation')) AS designation,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.team')) AS team,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.email')) AS email,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.phone')) AS phone,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.joiningDate')) AS joining_date,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.remarks')) AS remarks,
      updated_at
    FROM employees;

    -- View: v_computers
    CREATE OR REPLACE VIEW v_computers AS
    SELECT
      id,
      asset_number,
      assigned_employee_id,
      status,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.deviceName')) AS device_name,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.manufacturer')) AS manufacturer,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.model')) AS model,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.deviceType')) AS device_type,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.serialNumber')) AS serial_number,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.condition')) AS \`condition\`,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.processor.name')) AS processor,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.memory.installedRAM')) AS ram,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.storage.total')) AS storage,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.system.os')) AS operating_system,
      updated_at
    FROM computers;

    -- View: v_assets
    CREATE OR REPLACE VIEW v_assets AS
    SELECT
      id,
      asset_number,
      asset_type,
      assigned_employee_id,
      status,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.brand')) AS brand,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.model')) AS model,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.serialNumber')) AS serial_number,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.condition')) AS \`condition\`,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.assignedDate')) AS assigned_date,
      updated_at
    FROM assets;

    -- View: v_purchases
    CREATE OR REPLACE VIEW v_purchases AS
    SELECT
      id,
      purchase_number,
      device_type,
      brand,
      model_name,
      serial_number,
      purchase_date,
      vendor,
      device_cost,
      total_accessories_cost,
      grand_total_cost,
      status,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.invoiceNumber')) AS invoice_number,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.invoiceDate')) AS invoice_date,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.assignedEmployeeName')) AS assigned_to,
      updated_at
    FROM purchases;

    -- View: v_service_records
    CREATE OR REPLACE VIEW v_service_records AS
    SELECT
      id,
      computer_id,
      employee_id,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.serviceDate')) AS service_date,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.issueDescription')) AS issue_description,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.actionTaken')) AS action_taken,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.repairCost')) AS repair_cost,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.status')) AS status,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.vendor')) AS vendor,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.technicianName')) AS technician_name,
      updated_at
    FROM service_records;

    -- View: v_sim_cards
    CREATE OR REPLACE VIEW v_sim_cards AS
    SELECT
      id,
      contact_number,
      assigned_employee_id,
      status,
      purpose,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.carrier')) AS carrier,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.simType')) AS sim_type,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.planType')) AS plan_type,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.assignedEmployeeName')) AS employee_name,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.monthlyCost')) AS monthly_cost,
      updated_at
    FROM sim_cards;

    -- View: v_sim_recharges
    CREATE OR REPLACE VIEW v_sim_recharges AS
    SELECT
      id,
      sim_id,
      employee_id,
      recharge_date,
      recharge_amount,
      total_amount,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.planName')) AS plan_name,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.validityDays')) AS validity_days,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.paymentMode')) AS payment_mode,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.status')) AS status,
      updated_at
    FROM sim_recharges;

    -- View: v_service_providers
    CREATE OR REPLACE VIEW v_service_providers AS
    SELECT
      id,
      technician_name,
      shop_name,
      phone_number,
      service_type,
      city,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.address')) AS address,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.rating')) AS rating,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.status')) AS status,
      updated_at
    FROM service_providers;

    -- View: v_asset_queries
    CREATE OR REPLACE VIEW v_asset_queries AS
    SELECT
      id,
      employee_id,
      asset_number,
      status,
      query_type,
      is_starred,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.title')) AS title,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.description')) AS description,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.priority')) AS priority,
      JSON_UNQUOTE(JSON_EXTRACT(data, '$.createdAt')) AS created_at,
      updated_at
    FROM asset_queries;
  `);

  console.log('✅ MySQL Workbench Views created successfully (v_employees, v_computers, v_purchases, etc.).\n');

  // Print final statistics
  console.log('================================================================');
  console.log('📊 Final Verified MySQL Database Table Statistics');
  console.log('================================================================');

  const [tablesResult] = await connection.query(`SHOW FULL TABLES FROM assetcore WHERE Table_Type = 'BASE TABLE';`);
  const tables = tablesResult.map(r => Object.values(r)[0]);

  let grandTotal = 0;
  for (const t of tables) {
    const [cntRes] = await connection.query(`SELECT COUNT(*) as count FROM \`${t}\`;`);
    const count = cntRes[0].count;
    grandTotal += count;
    console.log(`  📁 Table: ${t.padEnd(20)} => ${count} rows`);
  }

  console.log('----------------------------------------------------------------');
  console.log(`  🌟 TOTAL RECORDS IN MYSQL: ${grandTotal} rows`);
  console.log('================================================================\n');

  console.log('================================================================');
  console.log('🔌 MySQL Workbench Connection Details');
  console.log('================================================================');
  console.log('  • Hostname / IP  : 127.0.0.1 (or localhost)');
  console.log('  • Port           : 3306');
  console.log('  • Username       : root');
  console.log('  • Password       : Ratan');
  console.log('  • Default Schema : assetcore');
  console.log('================================================================');
  console.log('👉 In MySQL Workbench, connect to this instance and expand:');
  console.log('   - Schemas -> assetcore -> Tables (17 tables)');
  console.log('   - Schemas -> assetcore -> Views (9 relational convenience views)');
  console.log('================================================================\n');

  await connection.end();
}

seedAllDataToMySQL().catch(err => {
  console.error('\n❌ Error during MySQL setup and seed:', err);
  process.exit(1);
});
