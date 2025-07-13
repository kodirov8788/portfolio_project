"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: string;
  featured: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export default function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("draft");
  const [featured, setFeatured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  useEffect(() => {
    const loadBlogPost = async () => {
      const resolvedParams = await params;
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("id", resolvedParams.id)
          .single();

        if (error) {
          console.error("Error fetching blog post:", error);
          setError("Failed to load blog post");
          setFetching(false);
          return;
        }

        if (data) {
          setBlogPost(data);
          setTitle(data.title || "");
          setSlug(data.slug || "");
          setExcerpt(data.excerpt || "");
          setContent(data.content || "");
          setStatus(data.status || "draft");
          setFeatured(data.featured || false);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        setError("An unexpected error occurred");
      } finally {
        setFetching(false);
      }
    };

    loadBlogPost();
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const supabase = createClient();
      const updateData: {
        title: string;
        slug: string;
        excerpt: string;
        content: string;
        status: string;
        featured: boolean;
        updated_at: string;
        published_at?: string;
      } = {
        title,
        slug,
        excerpt,
        content,
        status,
        featured,
        updated_at: new Date().toISOString(),
      };

      // Set published_at if status is published and it wasn't published before
      if (status === "published" && blogPost?.status !== "published") {
        updateData.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("blog_posts")
        .update(updateData)
        .eq("id", blogPost?.id);

      if (error) {
        console.error("Error updating blog post:", error);
        setError(error.message);
      } else {
        setSuccess("Blog post updated successfully!");
        setTimeout(() => router.push("/admin/blogs"), 1200);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Blog Post</h1>
            <p className="mt-2 text-gray-600">Loading blog post...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error && !blogPost) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Blog Post</h1>
            <p className="mt-2 text-gray-600">Error loading blog post</p>
          </div>
          <Link href="/admin/blogs">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blogs
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <Link href="/admin/blogs">
                <Button>Back to Blogs</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/blogs">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blogs
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Blog Post</h1>
            <p className="mt-2 text-gray-600">Update your blog post</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Blog Post Details</CardTitle>
          <CardDescription>
            Update the content and settings for your blog post
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter blog post title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="blog-post-slug"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief description of the blog post"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your blog post content here..."
                rows={12}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="featured">Featured</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">
                    Mark as featured post
                  </span>
                </div>
              </div>
            </div>

            {blogPost && (
              <div className="text-sm text-gray-500 space-y-1">
                <p>Created: {new Date(blogPost.created_at).toLocaleString()}</p>
                <p>
                  Last updated: {new Date(blogPost.updated_at).toLocaleString()}
                </p>
                {blogPost.published_at && (
                  <p>
                    Published:{" "}
                    {new Date(blogPost.published_at).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center space-x-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{loading ? "Saving..." : "Update Post"}</span>
              </Button>
              <Link href="/admin/blogs">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-green-600">{success}</p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
