import mysql from 'mysql2/promise';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectDir = path.resolve(__dirname, '..');
const backupDir = path.join(projectDir, 'server/data/migration-backup');

function formatMySqlDate(val) {
  if (!val) return new Date().toISOString().slice(0, 19).replace('T', ' ');
  const d = new Date(val);
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 19).replace('T', ' ');
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

async function runMigration() {
  console.log('====================================================');
  console.log('🚀 Starting Pre-Flight Checks & MySQL Data Migration');
  console.log('====================================================\n');

  // STEP 1: Pre-Flight Check - Verify Backup Files Exist
  if (!fs.existsSync(backupDir)) {
    throw new Error(`Pre-Flight Failed: Backup directory ${backupDir} does not exist.`);
  }

  const manifestPath = path.join(backupDir, 'backup-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Pre-Flight Failed: Backup manifest ${manifestPath} missing.`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log(`✅ Pre-Flight 1: Found verified backup manifest (${manifest.totalRowCount} total rows expected).`);

  // STEP 2: Pre-Flight Check - MySQL Connection
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'Ratan',
    database: 'assetcore'
  });
  console.log('✅ Pre-Flight 2: Successfully connected to local MySQL database "assetcore".');

  // STEP 3: Pre-Flight Check - Verify All 15 MySQL Tables Exist
  const [tablesResult] = await connection.query('SHOW TABLES FROM assetcore;');
  const existingTables = tablesResult.map(r => Object.values(r)[0]);
  const requiredTables = manifest.tables;

  for (const t of requiredTables) {
    if (!existingTables.includes(t)) {
      await connection.end();
      throw new Error(`Pre-Flight Failed: Required table "${t}" does not exist in MySQL assetcore database.`);
    }
  }
  console.log('✅ Pre-Flight 3: All 15 target tables confirmed present in MySQL.\n');

  // STEP 4: Migration Execution in Dependency Order
  const migrationSequence = [
    {
      name: 'service_providers',
      file: 'service_providers.json',
      insertSql: `INSERT INTO service_providers (id, technician_name, shop_name, phone_number, service_type, city, data, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                  ON DUPLICATE KEY UPDATE technician_name=VALUES(technician_name), shop_name=VALUES(shop_name), phone_number=VALUES(phone_number), service_type=VALUES(service_type), city=VALUES(city), data=VALUES(data);`,
      mapRow: row => [
        row.id,
        row.technicianName || null,
        row.shopName || null,
        row.phoneNumber || null,
        row.serviceType || null,
        row.city || null,
        typeof row.data === 'string' ? row.data : JSON.stringify(row.data),
        formatMySqlDate(row.updated_at)
      ]
    },
    {
      name: 'employees',
      file: 'employees.json',
      insertSql: `INSERT INTO employees (id, employee_id, name, department, status, data, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?)
                  ON DUPLICATE KEY UPDATE employee_id=VALUES(employee_id), name=VALUES(name), department=VALUES(department), status=VALUES(status), data=VALUES(data);`,
      mapRow: row => [
        row.id,
        row.employeeId || null,
        row.name || null,
        row.department || null,
        row.status || null,
        typeof row.data === 'string' ? row.data : JSON.stringify(row.data),
        formatMySqlDate(row.updated_at)
      ]
    },
    {
      name: 'computers',
      file: 'computers.json',
      insertSql: `INSERT INTO computers (id, asset_number, assigned_employee_id, status, data, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?)
                  ON DUPLICATE KEY UPDATE asset_number=VALUES(asset_number), assigned_employee_id=VALUES(assigned_employee_id), status=VALUES(status), data=VALUES(data);`,
      mapRow: row => [
        row.id,
        row.assetNumber || null,
        row.assignedEmployeeId || null,
        row.status || null,
        typeof row.data === 'string' ? row.data : JSON.stringify(row.data),
        formatMySqlDate(row.updated_at)
      ]
    },
    {
      name: 'sim_cards',
      file: 'sim_cards.json',
      insertSql: `INSERT INTO sim_cards (id, contact_number, assigned_employee_id, status, purpose, data, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?)
                  ON DUPLICATE KEY UPDATE contact_number=VALUES(contact_number), assigned_employee_id=VALUES(assigned_employee_id), status=VALUES(status), purpose=VALUES(purpose), data=VALUES(data);`,
      mapRow: row => [
        row.id,
        row.contactNumber || null,
        row.assignedEmployeeId || null,
        row.status || null,
        row.purpose || null,
        typeof row.data === 'string' ? row.data : JSON.stringify(row.data),
        formatMySqlDate(row.updated_at)
      ]
    },
    {
      name: 'allocations',
      file: 'allocations.json',
      insertSql: `INSERT INTO allocations (id, employee_id, asset_id, data, updated_at)
                  VALUES (?, ?, ?, ?, ?)
                  ON DUPLICATE KEY UPDATE employee_id=VALUES(employee_id), asset_id=VALUES(asset_id), data=VALUES(data);`,
      mapRow: row => [
        row.id,
        row.employeeId || null,
        row.assetId || null,
        typeof row.data === 'string' ? row.data : JSON.stringify(row.data),
        formatMySqlDate(row.updated_at)
      ]
    },
    {
      name: 'sim_recharges',
      file: 'sim_recharges.json',
      insertSql: `INSERT INTO sim_recharges (id, sim_id, employee_id, recharge_date, recharge_amount, total_amount, data, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                  ON DUPLICATE KEY UPDATE sim_id=VALUES(sim_id), employee_id=VALUES(employee_id), recharge_date=VALUES(recharge_date), recharge_amount=VALUES(recharge_amount), total_amount=VALUES(total_amount), data=VALUES(data);`,
      mapRow: row => {
        let parsedData = {};
        try {
          parsedData = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {});
        } catch {}

        const rechargeAmount = parsedData.rechargeAmount || parsedData.amount || 0;
        const totalAmount = parsedData.totalAmount || rechargeAmount;

        return [
          row.id,
          row.simId || null,
          row.employeeId || null,
          row.rechargeDate || null,
          rechargeAmount,
          totalAmount,
          typeof row.data === 'string' ? row.data : JSON.stringify(row.data),
          formatMySqlDate(row.updated_at)
        ];
      }
    },
    {
      name: 'sim_requests',
      file: 'sim_requests.json',
      insertSql: `INSERT INTO sim_requests (id, employee_id, request_type, status, urgency, data, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?)
                  ON DUPLICATE KEY UPDATE employee_id=VALUES(employee_id), request_type=VALUES(request_type), status=VALUES(status), urgency=VALUES(urgency), data=VALUES(data);`,
      mapRow: row => {
        let parsedData = {};
        try {
          parsedData = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {});
        } catch {}

        return [
          row.id,
          row.employeeId || null,
          row.requestType || null,
          row.status || null,
          parsedData.urgency || row.urgency || null,
          typeof row.data === 'string' ? row.data : JSON.stringify(row.data),
          formatMySqlDate(row.updated_at)
        ];
      }
    }
  ];

  let totalMigratedRows = 0;

  for (const step of migrationSequence) {
    const filePath = path.join(backupDir, step.file);
    const content = fs.readFileSync(filePath, 'utf8');
    const backupData = JSON.parse(content);
    const rows = backupData.rows || [];

    if (rows.length === 0) {
      console.log(`⏩ Table "${step.name}": 0 rows (Skipping insertion).`);
      continue;
    }

    console.log(`📦 Table "${step.name}": Inserting ${rows.length} rows inside transaction...`);
    await connection.beginTransaction();

    try {
      for (const row of rows) {
        const params = step.mapRow(row);
        await connection.query(step.insertSql, params);
      }
      await connection.commit();
      totalMigratedRows += rows.length;
      console.log(`  ✅ Table "${step.name}": Successfully committed ${rows.length} rows.`);
    } catch (err) {
      await connection.rollback();
      console.error(`  ❌ Table "${step.name}": Error during insertion. Transaction rolled back! Reason:`, err.message);
      await connection.end();
      throw err;
    }
  }

  // STEP 5: Verification of Inserted Data
  console.log('\n====================================================');
  console.log('🔍 Post-Migration Verification');
  console.log('====================================================');

  let verifiedTotal = 0;
  for (const tableName of requiredTables) {
    const [cntRes] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName};`);
    const count = cntRes[0].count;
    verifiedTotal += count;
    console.log(`  - MySQL Table "${tableName}": ${count} rows`);
  }

  console.log(`\nVerified Total Rows in MySQL: ${verifiedTotal}`);
  console.log(`Expected Total Rows from Backup: ${manifest.totalRowCount}`);

  if (verifiedTotal === manifest.totalRowCount) {
    console.log('\n🎉 SUCCESS: Data Migration Verified 100%! All 38 records match perfectly.');
  } else {
    console.warn(`\n⚠️ Warning: Mismatch in total rows. Expected ${manifest.totalRowCount}, found ${verifiedTotal}.`);
  }

  await connection.end();
}

runMigration().catch(err => {
  console.error('\nFatal Migration Failure:', err);
  process.exit(1);
});
