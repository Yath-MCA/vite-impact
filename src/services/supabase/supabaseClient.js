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
 * If credentials are missing, returns a dummy object to prevent application crashes.
 */
let supabase;

if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
  console.log('[supabaseClient] Initializing real Supabase client');
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // Dummy client to bypass "supabaseUrl is required" error when not configured
  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => { } } }
      }),
      signOut: async () => ({ error: null }),
    },
    storage: {
      from: () => ({
        list: async () => ({ data: [], error: null }),
        upload: async () => ({ data: null, error: new Error('Supabase not configured') }),
      })
    },
    from: () => ({
      select: () => ({
        order: () => ({
          limit: () => Promise.resolve({ data: [], error: null })
        }),
        eq: () => Promise.resolve({ data: [], error: null })
      }),
      insert: async () => ({ data: null, error: new Error('Supabase not configured') }),
      update: async () => ({ data: null, error: new Error('Supabase not configured') }),
      delete: async () => ({ data: null, error: new Error('Supabase not configured') }),
    })
  };
}

export default supabase;
