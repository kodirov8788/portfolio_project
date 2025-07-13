export interface Database {
  public: {
    Tables: {
      user_roles: {
        Row: {
          id: string;
          name: "admin" | "editor" | "viewer";
          description: string | null;
          permissions: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: "admin" | "editor" | "viewer";
          description?: string | null;
          permissions?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: "admin" | "editor" | "viewer";
          description?: string | null;
          permissions?: Record<string, unknown>;
          created_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          username: string | null;
          email: string;
          full_name: string | null;
          first_name: string | null;
          last_name: string | null;
          bio: string | null;
          avatar_url: string | null;
          phone: string | null;
          website: string | null;
          location: string | null;
          github_url: string | null;
          linkedin_url: string | null;
          twitter_url: string | null;
          instagram_url: string | null;
          role_id: string;
          is_active: boolean;
          email_verified: boolean;
          last_login_at: string | null;
          login_count: number;
          preferences: Record<string, unknown>;
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          email: string;
          full_name?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          website?: string | null;
          location?: string | null;
          github_url?: string | null;
          linkedin_url?: string | null;
          twitter_url?: string | null;
          instagram_url?: string | null;
          role_id?: string;
          is_active?: boolean;
          email_verified?: boolean;
          last_login_at?: string | null;
          login_count?: number;
          preferences?: Record<string, unknown>;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          email?: string;
          full_name?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          website?: string | null;
          location?: string | null;
          github_url?: string | null;
          linkedin_url?: string | null;
          twitter_url?: string | null;
          instagram_url?: string | null;
          role_id?: string;
          is_active?: boolean;
          email_verified?: boolean;
          last_login_at?: string | null;
          login_count?: number;
          preferences?: Record<string, unknown>;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
      };
      blog_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          color: string;
          icon: string | null;
          parent_id: string | null;
          sort_order: number;
          is_active: boolean;
          seo_title: string | null;
          seo_description: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          color?: string;
          icon?: string | null;
          parent_id?: string | null;
          sort_order?: number;
          is_active?: boolean;
          seo_title?: string | null;
          seo_description?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          color?: string;
          icon?: string | null;
          parent_id?: string | null;
          sort_order?: number;
          is_active?: boolean;
          seo_title?: string | null;
          seo_description?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      blog_posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          excerpt: string | null;
          content: string;
          featured_image: string | null;
          featured_image_alt: string | null;
          category_id: string | null;
          author_id: string;
          status: "draft" | "published" | "scheduled" | "archived";
          featured: boolean;
          reading_time: number | null;
          views: number;
          likes: number;
          shares: number;
          allow_comments: boolean;
          seo_title: string | null;
          seo_description: string | null;
          seo_keywords: string[] | null;
          published_at: string | null;
          scheduled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          excerpt?: string | null;
          content: string;
          featured_image?: string | null;
          featured_image_alt?: string | null;
          category_id?: string | null;
          author_id: string;
          status?: "draft" | "published" | "scheduled" | "archived";
          featured?: boolean;
          reading_time?: number | null;
          views?: number;
          likes?: number;
          shares?: number;
          allow_comments?: boolean;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[] | null;
          published_at?: string | null;
          scheduled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          excerpt?: string | null;
          content?: string;
          featured_image?: string | null;
          featured_image_alt?: string | null;
          category_id?: string | null;
          author_id?: string;
          status?: "draft" | "published" | "scheduled" | "archived";
          featured?: boolean;
          reading_time?: number | null;
          views?: number;
          likes?: number;
          shares?: number;
          allow_comments?: boolean;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[] | null;
          published_at?: string | null;
          scheduled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          title: string;
          slug: string;
          short_description: string | null;
          full_description: string | null;
          featured_image: string | null;
          featured_image_alt: string | null;
          category_id: string | null;
          github_url: string | null;
          live_url: string | null;
          demo_url: string | null;
          documentation_url: string | null;
          status:
            | "planning"
            | "in_progress"
            | "completed"
            | "on_hold"
            | "archived";
          priority: "low" | "medium" | "high" | "critical";
          featured: boolean;
          complexity: "beginner" | "intermediate" | "advanced" | "expert";
          start_date: string | null;
          end_date: string | null;
          duration_months: number | null;
          team_size: number;
          client_name: string | null;
          budget_range: string | null;
          views: number;
          likes: number;
          sort_order: number;
          seo_title: string | null;
          seo_description: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          short_description?: string | null;
          full_description?: string | null;
          featured_image?: string | null;
          featured_image_alt?: string | null;
          category_id?: string | null;
          github_url?: string | null;
          live_url?: string | null;
          demo_url?: string | null;
          documentation_url?: string | null;
          status?:
            | "planning"
            | "in_progress"
            | "completed"
            | "on_hold"
            | "archived";
          priority?: "low" | "medium" | "high" | "critical";
          featured?: boolean;
          complexity?: "beginner" | "intermediate" | "advanced" | "expert";
          start_date?: string | null;
          end_date?: string | null;
          duration_months?: number | null;
          team_size?: number;
          client_name?: string | null;
          budget_range?: string | null;
          views?: number;
          likes?: number;
          sort_order?: number;
          seo_title?: string | null;
          seo_description?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          short_description?: string | null;
          full_description?: string | null;
          featured_image?: string | null;
          featured_image_alt?: string | null;
          category_id?: string | null;
          github_url?: string | null;
          live_url?: string | null;
          demo_url?: string | null;
          documentation_url?: string | null;
          status?:
            | "planning"
            | "in_progress"
            | "completed"
            | "on_hold"
            | "archived";
          priority?: "low" | "medium" | "high" | "critical";
          featured?: boolean;
          complexity?: "beginner" | "intermediate" | "advanced" | "expert";
          start_date?: string | null;
          end_date?: string | null;
          duration_months?: number | null;
          team_size?: number;
          client_name?: string | null;
          budget_range?: string | null;
          views?: number;
          likes?: number;
          sort_order?: number;
          seo_title?: string | null;
          seo_description?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      contact_messages: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          email: string;
          phone: string | null;
          company: string | null;
          subject: string | null;
          message: string;
          status:
            | "unread"
            | "read"
            | "replied"
            | "in_progress"
            | "resolved"
            | "archived";
          priority: "low" | "medium" | "high" | "urgent";
          source: "website" | "email" | "linkedin" | "other";
          ip_address: string | null;
          user_agent: string | null;
          referrer: string | null;
          assigned_to: string | null;
          replied_at: string | null;
          resolved_at: string | null;
          follow_up_date: string | null;
          attachments: Record<string, unknown>[] | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          name: string;
          email: string;
          phone?: string | null;
          company?: string | null;
          subject?: string | null;
          message: string;
          status?:
            | "unread"
            | "read"
            | "replied"
            | "in_progress"
            | "resolved"
            | "archived";
          priority?: "low" | "medium" | "high" | "urgent";
          source?: "website" | "email" | "linkedin" | "other";
          ip_address?: string | null;
          user_agent?: string | null;
          referrer?: string | null;
          assigned_to?: string | null;
          replied_at?: string | null;
          resolved_at?: string | null;
          follow_up_date?: string | null;
          attachments?: Record<string, unknown>[] | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          name?: string;
          email?: string;
          phone?: string | null;
          company?: string | null;
          subject?: string | null;
          message?: string;
          status?:
            | "unread"
            | "read"
            | "replied"
            | "in_progress"
            | "resolved"
            | "archived";
          priority?: "low" | "medium" | "high" | "urgent";
          source?: "website" | "email" | "linkedin" | "other";
          ip_address?: string | null;
          user_agent?: string | null;
          referrer?: string | null;
          assigned_to?: string | null;
          replied_at?: string | null;
          resolved_at?: string | null;
          follow_up_date?: string | null;
          attachments?: Record<string, unknown>[] | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type UserProfile = Tables<"user_profiles">;
export type BlogPost = Tables<"blog_posts">;
export type Project = Tables<"projects">;
export type ContactMessage = Tables<"contact_messages">;
export type BlogCategory = Tables<"blog_categories">;
