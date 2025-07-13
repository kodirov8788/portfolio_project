import { supabase } from "@/lib/supabase/client";

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
  // Sign up with email and password
  static async signUp(
    email: string,
    password: string,
    userData: {
      username?: string;
      full_name?: string;
      first_name?: string;
      last_name?: string;
    }
  ) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  // Sign in with email and password
  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  // Sign in with OAuth provider
  static async signInWithProvider(provider: "google" | "github") {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  // Sign out
  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<AuthUser | null> {
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
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw new Error(error.message);
    }

    return session;
  }

  // Update user profile
  static async updateProfile(
    userId: string,
    updates: {
      username?: string;
      full_name?: string;
      first_name?: string;
      last_name?: string;
      bio?: string;
      avatar_url?: string;
      phone?: string;
      website?: string;
      location?: string;
      github_url?: string;
      linkedin_url?: string;
      twitter_url?: string;
      instagram_url?: string;
    }
  ) {
    const { data, error } = await supabase
      .from("user_profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  // Upload avatar
  static async uploadAvatar(userId: string, file: File) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    // Update user profile with new avatar URL
    await this.updateProfile(userId, { avatar_url: publicUrl });

    return publicUrl;
  }

  // Reset password
  static async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  // Update password
  static async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  // Check if user is admin
  static async isAdmin(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("user_profiles")
      .select(
        `
        user_roles (
          name
        )
      `
      )
      .eq("id", userId)
      .single();

    if (error || !data) {
      return false;
    }

    return (
      Array.isArray(data.user_roles) &&
      data.user_roles.some((role) => role.name === "admin")
    );
  }

  // Get user permissions
  static async getUserPermissions(userId: string) {
    const { data, error } = await supabase
      .from("user_profiles")
      .select(
        `
        user_roles (
          permissions
        )
      `
      )
      .eq("id", userId)
      .single();

    if (error || !data) {
      return {};
    }

    return data.user_roles?.[0]?.permissions || {};
  }

  // Listen to auth state changes
  static onAuthStateChange(
    callback: (event: string, session: unknown) => void
  ) {
    return supabase.auth.onAuthStateChange(callback);
  }
}
