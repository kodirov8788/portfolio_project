import { createClient } from "@supabase/supabase-js";
import { Database } from "./client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Helper function to get user profile with role
export async function getUserProfile(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_profiles")
    .select(
      `
      *,
      user_roles (
        name,
        permissions
      )
    `
    )
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }

  return data;
}

// Helper function to check if user has admin role
export async function isUserAdmin(userId: string) {
  const profile = await getUserProfile(userId);
  return profile?.user_roles?.name === "admin";
}

// Helper function to get user permissions
export async function getUserPermissions(userId: string) {
  const profile = await getUserProfile(userId);
  return profile?.user_roles?.permissions || {};
}
