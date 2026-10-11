import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sjsgnooheqiuzwkfzhsi.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const dataPath = path.resolve(__dirname, '..', 'server', 'data', 'database.json');
if (!fs.existsSync(dataPath)) {
  console.error('database.json not found at:', dataPath);
  process.exit(1);
}

const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Mapping each collection to table columns & data
const collectionMap = {
  employees: (item) => ({
    id: String(item.id || item.employeeId),
    employee_id: String(item.employeeId || item.id || ''),
    name: item.name || '',
    department: item.department || '',
    designation: item.designation || '',
    status: item.status || 'Active',
    data: item,
  }),
  computers: (item) => ({
    id: String(item.id),
    asset_number: String(item.assetNumber || ''),
    assigned_employee_id: item.assignedEmployeeId ? String(item.assignedEmployeeId) : null,
    status: item.status || 'Available',
    data: item,
  }),
  assets: (item) => ({
    id: String(item.id),
    asset_number: String(item.assetNumber || ''),
    asset_type: item.assetType || '',
    assigned_employee_id: item.assignedEmployeeId ? String(item.assignedEmployeeId) : null,
    status: item.status || 'Available',
    data: item,
  }),
  service_records: (item) => ({
    id: String(item.id),
    computer_id: item.computerId ? String(item.computerId) : null,
    employee_id: item.employeeId ? String(item.employeeId) : null,
    data: item,
  }),
  allocations: (item) => ({
    id: String(item.id),
    employee_id: item.employeeId ? String(item.employeeId) : null,
    asset_id: item.assetId ? String(item.assetId) : null,
    data: item,
  }),
  audit_logs: (item) => ({
    id: String(item.id),
    action: item.action || '',
    actor: item.actor || '',
    timestamp: item.timestamp || new Date().toISOString(),
    data: item,
  }),
  weekly_photos: (item) => ({
    id: String(item.id),
    employee_id: item.employeeId ? String(item.employeeId) : null,
    week_start_date: item.weekStartDate || '',
    data: item,
  }),
  purchases: (item) => ({
    id: String(item.id),
    purchase_number: item.purchaseNumber || '',
    device_type: item.deviceType || '',
    brand: item.brand || '',
    model_name: item.modelName || '',
    serial_number: item.serialNumber || '',
    purchase_date: item.purchaseDate || '',
    vendor: item.vendor || '',
    device_cost: Number(item.deviceCost || 0),
    total_accessories_cost: Number(item.totalAccessoriesCost || 0),
    grand_total_cost: Number(item.grandTotalCost || 0),
    status: item.status || '',
    data: item,
  }),
  asset_requests: (item) => ({
    id: String(item.id),
    employee_id: item.employeeId ? String(item.employeeId) : null,
    employee_name: item.employeeName || '',
    department: item.department || '',
    urgency: item.urgency || '',
    status: item.status || '',
    data: item,
  }),
  sim_cards: (item) => ({
    id: String(item.id),
    contact_number: item.contactNumber || '',
    assigned_employee_id: item.assignedEmployeeId ? String(item.assignedEmployeeId) : null,
    status: item.status || 'Active',
    purpose: item.purpose || '',
    data: item,
  }),
  sim_recharges: (item) => ({
    id: String(item.id),
    sim_id: item.simId ? String(item.simId) : null,
    employee_id: item.employeeId ? String(item.employeeId) : null,
    recharge_date: item.rechargeDate || '',
    recharge_amount: Number(item.rechargeAmount || 0),
    total_amount: Number(item.totalAmount || 0),
    data: item,
  }),
  sim_requests: (item) => ({
    id: String(item.id),
    employee_id: item.employeeId ? String(item.employeeId) : null,
    request_type: item.requestType || '',
    status: item.status || '',
    urgency: item.urgency || '',
    data: item,
  }),
  service_providers: (item) => ({
    id: String(item.id),
    technician_name: item.technicianName || '',
    shop_name: item.shopName || '',
    phone_number: item.phoneNumber || '',
    service_type: item.serviceType || '',
    city: item.city || '',
    data: item,
  }),
  asset_queries: (item) => ({
    id: String(item.id),
    employee_id: item.employeeId ? String(item.employeeId) : null,
    asset_number: item.assetNumber || '',
    status: item.status || '',
    query_type: item.queryType || '',
    is_starred: Boolean(item.isStarred),
    data: item,
  }),
  removed_employees: (item) => ({
    id: String(item.id),
    employee_id: item.employeeId ? String(item.employeeId) : null,
    name: item.name || '',
    department: item.department || '',
    removed_date: item.removedDate || '',
    removed_by: item.removedBy || '',
    data: item,
  }),
  exit_clearances: (item) => ({
    id: String(item.id),
    employee_id: item.employeeId ? String(item.employeeId) : null,
    data: item,
  }),
};

async function migrate() {
  console.log('🚀 Starting sync from local database.json to Supabase...');
  for (const [table, mapper] of Object.entries(collectionMap)) {
    const list = rawData[table] || [];
    if (!list.length) continue;

    console.log(`Syncing ${list.length} rows to "${table}"...`);
    const records = list.map(mapper);

    // Upsert in batches of 50
    for (let i = 0; i < records.length; i += 50) {
      const batch = records.slice(i, i + 50);
      const { error } = await supabase.from(table).upsert(batch, { onConflict: 'id' });
      if (error) {
        console.error(`  ❌ Error syncing ${table}:`, error.message);
      } else {
        console.log(`  ✓ Synced batch ${i + 1} - ${i + batch.length} to ${table}`);
      }
    }
  }
  console.log('✨ Data sync completed!');
}

migrate().catch(console.error);
