import { createClient } from '@supabase/supabase-js';

// 從環境變量獲取 Supabase URL 和 Key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 創建 Supabase 客戶端
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 數據庫表名
export const TABLES = {
  SIGNAL_HISTORY: 'signal_history',
};
