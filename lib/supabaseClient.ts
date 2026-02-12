import { createClient } from '@supabase/supabase-js';

// Pastikan penulisan NEXT_PUBLIC harus ada di depan agar bisa diakses di sisi browser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Logika cadangan agar build tidak crash
// Jika URL kosong, kita kasih URL palsu yang valid formatnya (http/https)
const finalUrl = supabaseUrl.startsWith('http') ? supabaseUrl : 'https://placeholder-project.supabase.co';
const finalKey = supabaseAnonKey || 'placeholder-key';

export const supabase = createClient(finalUrl, finalKey);

// Tambahkan tipe data untuk parameter agar lebih aman (optional)
export type LogAction = 'input' | 'edit' | 'hapus' | 'pencarian' | 'view' | 'login';

export const saveLog = async (description: string, action_type: LogAction) => {
  try {
    // Ambil user yang sedang login secara otomatis dari Supabase Auth
    const { data: { user } } = await supabase.auth.getUser();
    
    // Ambil role dari metadata atau table profile jika ada
    const username = user?.user_metadata?.username || user?.email || 'Anonim';
    const role = user?.user_metadata?.role || 'user';

    await supabase.from("activity_logs").insert([
      {
        username,
        role,
        description,
        action_type,
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (err) {
    console.error("Gagal save log:", err);
  }
};