import { z } from "zod";

export const projectSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters"),
  short_description: z.string().optional(),
  full_description: z.string().optional(),
  featured_image: z.string().optional(),
  featured_image_alt: z.string().optional(),
  category_id: z.string().optional(),
  github_url: z.string().url().optional().or(z.literal("")),
  live_url: z.string().url().optional().or(z.literal("")),
  demo_url: z.string().url().optional().or(z.literal("")),
  documentation_url: z.string().url().optional().or(z.literal("")),
  status: z
    .enum(["planning", "in_progress", "completed", "on_hold", "archived"])
    .default("completed"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  featured: z.boolean().default(false),
  complexity: z
    .enum(["beginner", "intermediate", "advanced", "expert"])
    .default("intermediate"),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  duration_months: z.number().optional(),
  team_size: z.number().min(1).default(1),
  client_name: z.string().optional(),
  budget_range: z.string().optional(),
  sort_order: z.number().default(0),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;
