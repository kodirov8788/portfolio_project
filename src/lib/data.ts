import { createClient } from "./supabase/client";
// import { createClient as createServerClient } from "./supabase/server";

export async function getProjects() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching projects:", error);
    return [];
  }

  return data || [];
}

export async function getFeaturedProjects() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("featured", true)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    console.error("Error fetching featured projects:", error);
    return [];
  }

  return data || [];
}

export async function getBlogPosts() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Error fetching blog posts:", error);
    return [];
  }

  return data || [];
}

export async function getFeaturedBlogPosts() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .eq("featured", true)
    .order("published_at", { ascending: false })
    .limit(3);

  if (error) {
    console.error("Error fetching featured blog posts:", error);
    return [];
  }

  return data || [];
}

export async function getContactMessages(options?: {
  page?: number;
  limit?: number;
  search?: string;
  read?: boolean;
  deleted?: boolean;
  dateFrom?: string;
  dateTo?: string;
}) {
  const supabase = createClient();
  const {
    page = 1,
    limit = 10,
    search,
    read,
    deleted = false, // By default, exclude deleted messages
    dateFrom,
    dateTo,
  } = options || {};

  let query = supabase.from("contact_messages").select("*", { count: "exact" });

  // Always filter by deleted status unless explicitly requested
  query = query.eq("deleted", deleted);

  // Apply search filter
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%,message.ilike.%${search}%`
    );
  }

  // Apply read/unread filter
  if (read !== undefined) {
    query = query.eq("read", read);
  }

  // Apply date range filter
  if (dateFrom) {
    query = query.gte("created_at", dateFrom);
  }
  if (dateTo) {
    query = query.lte("created_at", dateTo);
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  // Order by created_at descending
  query = query.order("created_at", { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching contact messages:", error);
    return { messages: [], total: 0, page, limit };
  }

  return {
    messages: data || [],
    total: count || 0,
    page,
    limit,
  };
}

export async function getUnreadMessages() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .eq("read", false)
    .eq("deleted", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching unread messages:", error);
    return [];
  }

  return data || [];
}

export async function getDashboardStats() {
  const supabase = createClient();
  // Get counts
  const [projectsResult, blogPostsResult, messagesResult] = await Promise.all([
    supabase.from("projects").select("*", { count: "exact", head: true }),
    supabase.from("blog_posts").select("*", { count: "exact", head: true }),
    supabase
      .from("contact_messages")
      .select("*", { count: "exact", head: true }),
  ]);

  return {
    totalProjects: projectsResult.count || 0,
    totalBlogPosts: blogPostsResult.count || 0,
    totalMessages: messagesResult.count || 0,
    unreadMessages: (await getUnreadMessages()).length,
  };
}

export async function createContactMessage(messageData: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .insert([messageData])
    .select();

  if (error) {
    console.error("Error creating contact message:", error);
    throw error;
  }

  return data?.[0];
}

export async function markMessageAsRead(messageId: number) {
  const supabase = createClient();
  const { error } = await supabase
    .from("contact_messages")
    .update({ read: true })
    .eq("id", messageId);

  if (error) {
    console.error("Error marking message as read:", error);
    throw error;
  }
}

export async function deleteMessage(messageId: number) {
  const supabase = createClient();
  const { error } = await supabase
    .from("contact_messages")
    .delete()
    .eq("id", messageId);

  if (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
}

export async function softDeleteMessage(messageId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("contact_messages")
    .update({ deleted: true })
    .eq("id", messageId);

  if (error) {
    console.error("Error soft deleting message:", error);
    throw error;
  }
}

export async function restoreMessage(messageId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("contact_messages")
    .update({ deleted: false })
    .eq("id", messageId);

  if (error) {
    console.error("Error restoring message:", error);
    throw error;
  }
}
