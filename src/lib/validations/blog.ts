import { z } from "zod";

export const blogPostSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters"),
  excerpt: z.string().optional(),
  content: z.string().min(50, "Content must be at least 50 characters"),
  featured_image: z.string().optional(),
  featured_image_alt: z.string().optional(),
  category_id: z.string().optional(),
  status: z
    .enum(["draft", "published", "scheduled", "archived"])
    .default("draft"),
  featured: z.boolean().default(false),
  allow_comments: z.boolean().default(true),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  seo_keywords: z.array(z.string()).optional(),
  published_at: z.string().optional(),
  scheduled_at: z.string().optional(),
});

export type BlogPostFormData = z.infer<typeof blogPostSchema>;
