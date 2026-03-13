import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.warn(
        '[AU Quiz] Supabase env vars are missing. Copy .env.example to .env and fill in your credentials.\n' +
        'The app will load but authentication will not work.'
    )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
