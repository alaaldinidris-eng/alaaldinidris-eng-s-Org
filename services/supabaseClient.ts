import { createClient } from '@supabase/supabase-js';

// In a Vercel serverless function (Node.js environment), environment variables
// are accessed via `process.env`. Vite's `import.meta.env` is for client-side code.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase environment variables (URL and service key) are required.');
}

// Create and export the Supabase client.
// This client is for SERVER-SIDE use ONLY, as it uses the service role key.
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
