import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

/**
 * Singleton Pattern: Mencegah pembuatan instance Supabase client berulang kali
 * terutama saat development (Fast Refresh di Next.js).
 */
export const supabase = (globalThis as any).supabase || createClient(supabaseUrl, supabaseAnonKey);

if (process.env.NODE_ENV !== 'production') {
  (globalThis as any).supabase = supabase;
}

// --- LOGGING SYSTEM ---

export type LogAction = 'input' | 'edit' | 'hapus' | 'pencarian' | 'view' | 'login';

export const saveLog = async (description: string, action_type: LogAction) => {
  try {
    // Ambil user yang sedang login secara otomatis dari Supabase Auth
    const { data: { user } } = await supabase.auth.getUser();
    
    // Ambil metadata user (jika ada)
    const username = user?.user_metadata?.username || user?.email || 'Anonim';
    const role = user?.user_metadata?.role || 'user';

    // Insert ke tabel activity_logs
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