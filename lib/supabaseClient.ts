import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'URL_PROYEK_ANDA';
const supabaseKey = 'ANON_KEY_ANDA';
export const supabase = createClient(supabaseUrl, supabaseKey);