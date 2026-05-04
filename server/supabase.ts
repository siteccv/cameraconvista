import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const isSupabaseAdminConfigured = !!(supabaseUrl && supabaseServiceRoleKey);
export const isSupabasePublicConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabaseAdmin = isSupabaseAdminConfigured
  ? createClient(supabaseUrl!, supabaseServiceRoleKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : (null as unknown as ReturnType<typeof createClient>);

export const supabasePublic = isSupabasePublicConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : (null as unknown as ReturnType<typeof createClient>);

export { supabaseUrl, supabaseAnonKey };
