// Test temporaneo per verificare connessione Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key prefix:', supabaseAnonKey?.substring(0, 10) + '...');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connessione
async function testConnection() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log('⚠️  Auth error (normal for no session):', error.message);
    } else {
      console.log('✅ Connection successful - no active session');
    }
    
    // Test basic query
    const { data: result, error: queryError } = await supabase
      .from('non_existent_table')
      .select('*')
      .limit(1);
      
    if (queryError && queryError.code === 'PGRST116') {
      console.log('✅ Database connection working (table not found is expected)');
    } else if (queryError) {
      console.log('🔍 Query response:', queryError.message);
    } else {
      console.log('✅ Query successful:', result);
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();