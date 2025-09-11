import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  });
  throw new Error('Configurazione Supabase mancante. Controlla le variabili d\'ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
}

console.log('✅ Supabase client initialized successfully');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);