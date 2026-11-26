
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "[supabaseClient] Missing server-side Supabase configuration."
  );
}

if (supabaseServiceRoleKey) {
  console.warn(
    "[supabaseClient] Using server-side service role credentials."
  );
}

const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

module.exports = supabase;
