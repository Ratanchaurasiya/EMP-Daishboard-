// Supabase Configuration and Client for AssetCore & Service Management System
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_CONFIG = {
  projectId: import.meta.env.VITE_SUPABASE_PROJECT_ID || 'sjsgnooheqiuzwkfzhsi',
  url: import.meta.env.VITE_SUPABASE_URL || 'https://sjsgnooheqiuzwkfzhsi.supabase.co',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_mTKcwVIETZNpLhPSoHE--g_GOOR_K0s',
};

export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
