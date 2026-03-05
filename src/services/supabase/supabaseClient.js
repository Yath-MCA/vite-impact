/**
 * @file supabaseClient.js
 * @description Supabase client initialization using @supabase/supabase-js.
 * Reads connection details from window.ENV (runtime config from env/env.*.js)
 * Falls back to import.meta.env for development flexibility.
 */

import { createClient } from '@supabase/supabase-js';

// Read from window.ENV (runtime config) or import.meta.env (Vite build-time)
const supabaseUrl = 
  (typeof window !== 'undefined' && window.ENV?.VITE_SUPABASE_URL) || 
  import.meta.env.VITE_SUPABASE_URL;

const supabaseAnonKey = 
  (typeof window !== 'undefined' && window.ENV?.VITE_SUPABASE_ANON_KEY) || 
  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[supabaseClient] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. ' +
    'Supabase features will not work until these environment variables are configured in env/env.*.js or .env.local'
  );
}

/**
 * Shared Supabase client instance.
 * Import this wherever Supabase functionality is needed.
 */
const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export default supabase;
