/**
 * @file supabaseClient.js
 * @description Supabase client initialization using @supabase/supabase-js.
 * Reads connection details from environment variables (VITE_SUPABASE_URL and
 * VITE_SUPABASE_ANON_KEY) so that no secrets are hard-coded in source code.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[supabaseClient] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. ' +
    'Supabase features will not work until these environment variables are configured.'
  );
}

/**
 * Shared Supabase client instance.
 * Import this wherever Supabase functionality is needed.
 */
const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export default supabase;
