// Lokasi: src/lib/supabase.ts (atau @/lib/supabase)
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// PASTIKAN TIDAK ADA properti 'global: { headers: ... }' di sini
export const supabase = createClient(supabaseUrl, supabaseAnonKey)