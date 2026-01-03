import { createClient } from '@supabase/supabase-js';

// Ensure the environment variables are loaded
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL and service key are required.');
}

// Create and export the Supabase client
// This client is for SERVER-SIDE use ONLY, as it uses the service role key.
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
