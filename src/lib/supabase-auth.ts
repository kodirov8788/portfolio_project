import { createClient } from "@supabase/supabase-js";

// Client-side Supabase client for authentication
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key",
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

// Server-side Supabase client with service role for admin operations
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Connection health check for auth
export async function checkSupabaseAuthConnection(): Promise<{
  success: boolean;
  error?: string;
  latency?: number;
}> {
  try {
    const startTime = Date.now();
    const { data, error } = await supabase.auth.getSession();
    const latency = Date.now() - startTime;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, latency };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Test admin authentication
export async function testSupabaseAdminAuth(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export default supabase;
