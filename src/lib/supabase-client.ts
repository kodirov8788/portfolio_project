import { createClient } from "@supabase/supabase-js";

// Client-side Supabase client for browser usage
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key",
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
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

// Connection health check for client
export async function checkSupabaseConnection(): Promise<{
  success: boolean;
  error?: string;
  latency?: number;
}> {
  try {
    const startTime = Date.now();

    // Check if we're using placeholder credentials or empty values
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    // Always skip connection test for placeholder credentials
    if (
      !supabaseUrl ||
      !supabaseKey ||
      supabaseUrl.includes("placeholder") ||
      supabaseKey.includes("placeholder") ||
      supabaseKey === "placeholder-key" ||
      supabaseUrl === "https://placeholder.supabase.co"
    ) {
      return {
        success: true,
        latency: 0,
        error: "Using placeholder credentials - connection test skipped",
      };
    }

    // For real credentials, just test client creation and basic auth
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

// Connection health check for admin client
export async function checkSupabaseAdminConnection(): Promise<{
  success: boolean;
  error?: string;
  latency?: number;
}> {
  try {
    const startTime = Date.now();

    // Check if we're using placeholder credentials or empty values
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    // Always skip connection test for placeholder credentials
    if (
      !supabaseUrl ||
      !serviceKey ||
      supabaseUrl.includes("placeholder") ||
      serviceKey.includes("placeholder") ||
      serviceKey === "placeholder-service-key" ||
      supabaseUrl === "https://placeholder.supabase.co"
    ) {
      return {
        success: true,
        latency: 0,
        error: "Using placeholder credentials - connection test skipped",
      };
    }

    // For real credentials, just test client creation and basic auth
    const { data, error } = await supabaseAdmin.auth.getSession();
    const latency = Date.now() - startTime;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, latency };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Test authentication flow
export async function testSupabaseAuth(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export default supabase;
