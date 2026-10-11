-- ==============================================================================
-- ASSETCORE HRMS & IT ASSET MANAGEMENT - SUPABASE POSTGRESQL SCHEMA
-- Project: sjsgnooheqiuzwkfzhsi
-- ==============================================================================

-- 1. Employees Table
CREATE TABLE IF NOT EXISTS public.employees (
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  employee_id VARCHAR(100) NULL,
  name VARCHAR(255) NULL,
  department VARCHAR(255) NULL,
  designation VARCHAR(255) NULL,
  status VARCHAR(100) NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pg_emp_code ON public.employees (employee_id);
CREATE INDEX IF NOT EXISTS idx_pg_emp_status ON public.employees (status);

-- 2. Computers / Laptops Table
CREATE TABLE IF NOT EXISTS public.computers (
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  asset_number VARCHAR(100) NULL,
  assigned_employee_id VARCHAR(100) NULL,
  status VARCHAR(100) NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pg_comp_asset_number ON public.computers (asset_number);
CREATE INDEX IF NOT EXISTS idx_pg_comp_assigned_emp ON public.computers (assigned_employee_id);

-- 3. Assets Table (Peripherals & Mobile Phones)
CREATE TABLE IF NOT EXISTS public.assets (
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  asset_number VARCHAR(100) NULL,
  asset_type VARCHAR(100) NULL,
  assigned_employee_id VARCHAR(100) NULL,
  status VARCHAR(100) NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pg_asset_asset_number ON public.assets (asset_number);
CREATE INDEX IF NOT EXISTS idx_pg_asset_assigned_emp ON public.assets (assigned_employee_id);

-- 4. Service Records Table
CREATE TABLE IF NOT EXISTS public.service_records (
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  computer_id VARCHAR(100) NULL,
  employee_id VARCHAR(100) NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pg_srv_comp ON public.service_records (computer_id);
CREATE INDEX IF NOT EXISTS idx_pg_srv_emp ON public.service_records (employee_id);

-- 5. Allocations Table
CREATE TABLE IF NOT EXISTS public.allocations (
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  employee_id VARCHAR(100) NULL,
  asset_id VARCHAR(100) NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pg_alloc_emp ON public.allocations (employee_id);
CREATE INDEX IF NOT EXISTS idx_pg_alloc_asset ON public.allocations (asset_id);

-- 6. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  action VARCHAR(255) NULL,
  actor VARCHAR(255) NULL,
  timestamp VARCHAR(100) NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Weekly Photos Table
CREATE TABLE IF NOT EXISTS public.weekly_photos (
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  employee_id VARCHAR(100) NULL,
  week_start_date VARCHAR(50) NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pg_photo_emp ON public.weekly_photos (employee_id);

-- 8. Purchases & Accessories Table
CREATE TABLE IF NOT EXISTS public.purchases (
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
CREATE INDEX IF NOT EXISTS idx_pg_purchases_sn ON public.purchases (serial_number);

-- 9. Asset Requests (Requisitions) Table
CREATE TABLE IF NOT EXISTS public.asset_requests (
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  employee_id VARCHAR(100) NULL,
  employee_name VARCHAR(255) NULL,
  department VARCHAR(255) NULL,
  urgency VARCHAR(100) NULL,
  status VARCHAR(100) NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pg_req_emp ON public.asset_requests (employee_id);
CREATE INDEX IF NOT EXISTS idx_pg_req_status ON public.asset_requests (status);

-- 10. System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
  key VARCHAR(255) NOT NULL PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. SIM Cards Table
CREATE TABLE IF NOT EXISTS public.sim_cards (
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  contact_number VARCHAR(100) NULL,
  assigned_employee_id VARCHAR(100) NULL,
  status VARCHAR(100) NULL,
  purpose VARCHAR(100) NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pg_sim_contact ON public.sim_cards (contact_number);
CREATE INDEX IF NOT EXISTS idx_pg_sim_assigned_emp ON public.sim_cards (assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_pg_sim_status ON public.sim_cards (status);

-- 12. SIM Recharges Table
CREATE TABLE IF NOT EXISTS public.sim_recharges (
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  sim_id VARCHAR(100) NULL,
  employee_id VARCHAR(100) NULL,
  recharge_date VARCHAR(50) NULL,
  recharge_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pg_rec_sim ON public.sim_recharges (sim_id);
CREATE INDEX IF NOT EXISTS idx_pg_rec_emp ON public.sim_recharges (employee_id);

-- 13. SIM Requests Table
CREATE TABLE IF NOT EXISTS public.sim_requests (
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  employee_id VARCHAR(100) NULL,
  request_type VARCHAR(100) NULL,
  status VARCHAR(100) NULL,
  urgency VARCHAR(100) NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pg_simreq_emp ON public.sim_requests (employee_id);
CREATE INDEX IF NOT EXISTS idx_pg_simreq_status ON public.sim_requests (status);

-- 14. Service Providers Table
CREATE TABLE IF NOT EXISTS public.service_providers (
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  technician_name VARCHAR(255) NULL,
  shop_name VARCHAR(255) NULL,
  phone_number VARCHAR(100) NULL,
  service_type VARCHAR(255) NULL,
  city VARCHAR(100) NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pg_prov_type ON public.service_providers (service_type);

-- 15. Asset Queries Table
CREATE TABLE IF NOT EXISTS public.asset_queries (
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  employee_id VARCHAR(100) NULL,
  asset_number VARCHAR(100) NULL,
  status VARCHAR(100) NULL,
  query_type VARCHAR(100) NULL,
  is_starred BOOLEAN DEFAULT FALSE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pg_qry_emp ON public.asset_queries (employee_id);
CREATE INDEX IF NOT EXISTS idx_pg_qry_status ON public.asset_queries (status);

-- 16. Removed Employees Table
CREATE TABLE IF NOT EXISTS public.removed_employees (
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  employee_id VARCHAR(100) NULL,
  name VARCHAR(255) NULL,
  department VARCHAR(255) NULL,
  removed_date VARCHAR(100) NULL,
  removed_by VARCHAR(255) NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pg_rem_emp ON public.removed_employees (employee_id);

-- 17. Exit Clearances Table
CREATE TABLE IF NOT EXISTS public.exit_clearances (
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  employee_id VARCHAR(100) NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pg_exit_emp ON public.exit_clearances (employee_id);

-- Enable Row Level Security (RLS) and grant public read/write via Service Role / Anon
DO $$ 
DECLARE
  tbl text;
BEGIN
  FOR tbl IN 
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Public access policy" ON public.%I;', tbl);
    EXECUTE format('CREATE POLICY "Public access policy" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl);
  END LOOP;
END $$;
