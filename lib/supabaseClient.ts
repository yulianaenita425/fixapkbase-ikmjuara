import { createClient } from '@supabase/supabase-js';

// Pastikan penulisan NEXT_PUBLIC harus ada di depan agar bisa diakses di sisi browser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Logika cadangan agar build tidak crash
// Jika URL kosong, kita kasih URL palsu yang valid formatnya (http/https)
const finalUrl = supabaseUrl.startsWith('http') ? supabaseUrl : 'https://placeholder-project.supabase.co';
const finalKey = supabaseAnonKey || 'placeholder-key';

export const supabase = createClient(finalUrl, finalKey);