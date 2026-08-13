// src/services/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Using environment variables with fallback to hardcoded values for production
// This ensures pricing works while we fix the environment variable issue
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://dokwmteucrhajourpthf.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRva3dtdGV1Y3JoYWpvdXJwdGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NTc2NzgsImV4cCI6MjA5OTQzMzY3OH0.R7hQVGrZTSdWeiyL3Ve6Wk00OuWKpZkCeWnZLbGY-hg';

console.log('🔍 Supabase URL:', supabaseUrl);
console.log('🔍 Supabase Key:', supabaseAnonKey ? '✅ Set' : '❌ Not set');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials missing!');
} else {
  console.log('✅ Supabase client created successfully');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;