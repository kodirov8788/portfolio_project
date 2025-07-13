import { createClient } from "@/lib/supabase/client";

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  role: string;
  is_active: boolean;
}

export class AuthService {
  // Sign in with email and password
  static async signInWithPassword(
    email: string,
    password: string
  ): Promise<{ user: AuthUser | null; error: string | null }> {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    if (!data.user) {
      return { user: null, error: "No user data received" };
    }

    // Get user profile with role
    const { data: profile } = await supabase
      .from("user_profiles")
      .select(
        `
        *,
        user_roles (
          name
        )
      `
      )
      .eq("id", data.user.id)
      .single();

    if (!profile) {
      return { user: null, error: "User profile not found" };
    }

    const user: AuthUser = {
      id: data.user.id,
      email: data.user.email!,
      username: profile.username,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      role: profile.user_roles?.name || "viewer",
      is_active: profile.is_active,
    };

    return { user, error: null };
  }

  // Sign up with email and password
  static async signUpWithPassword(
    email: string,
    password: string,
    userData: Partial<AuthUser>
  ): Promise<{ user: AuthUser | null; error: string | null }> {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: userData.username,
          full_name: userData.full_name,
        },
      },
    });

    if (error) {
      return { user: null, error: error.message };
    }

    if (!data.user) {
      return { user: null, error: "No user data received" };
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from("user_profiles")
      .insert({
        id: data.user.id,
        email: data.user.email!,
        username: userData.username,
        full_name: userData.full_name,
        role_id: userData.role || "viewer",
      });

    if (profileError) {
      return { user: null, error: profileError.message };
    }

    const user: AuthUser = {
      id: data.user.id,
      email: data.user.email!,
      username: userData.username ?? undefined,
      full_name: userData.full_name ?? undefined,
      avatar_url: undefined,
      role: userData.role || "viewer",
      is_active: true,
    };

    return { user, error: null };
  }

  // Sign out
  static async signOut(): Promise<{ error: string | null }> {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    return { error: error?.message || null };
  }

  // Get current user
  static async getCurrentUser(): Promise<AuthUser | null> {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Get user profile with role
    const { data: profile } = await supabase
      .from("user_profiles")
      .select(
        `
        *,
        user_roles (
          name
        )
      `
      )
      .eq("id", user.id)
      .single();

    if (!profile) {
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      username: profile.username,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      role: profile.user_roles?.name || "viewer",
      is_active: profile.is_active,
    };
  }

  // Get current session
  static async getCurrentSession() {
    const supabase = createClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw new Error(error.message);
    }

    return session;
  }
}
