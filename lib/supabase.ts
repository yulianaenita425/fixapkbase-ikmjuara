import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Deklarasikan tipe untuk global object agar TypeScript tidak protes
declare global {
  var supabase: ReturnType<typeof createClient> | undefined
}

// Gunakan instansi yang sudah ada jika tersedia, jika tidak baru buat baru
export const supabase = globalThis.supabase || createClient(supabaseUrl, supabaseAnonKey)

// Simpan ke globalThis hanya di mode development
if (process.env.NODE_ENV !== 'production') {
  globalThis.supabase = supabase
}