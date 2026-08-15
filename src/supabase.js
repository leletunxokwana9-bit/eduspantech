import { createClient } from '@supabase/supabase-js'; 
 
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL; 
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY; 
 
  console.error('? Missing Supabase credentials!'); 
  console.error('URL:', supabaseUrl); 
  console.error('Key exists:', !!supabaseAnonKey); 
} 
 
export const supabase = createClient(supabaseUrl, supabaseAnonKey); 
