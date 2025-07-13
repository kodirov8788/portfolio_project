import { supabaseAdmin } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { format } from "date-fns";

interface BlogPostProps {
  params: { slug: string };
}

export default async function BlogPostPage({ params }: BlogPostProps) {
  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .select("id, title, excerpt, content, published_at")
    .eq("slug", params.slug)
    .eq("status", "published")
    .single();

  if (error || !data) return notFound();

  return (
    <main className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-2">{data.title}</h1>
      {data.excerpt && <p className="text-gray-500 mb-4">{data.excerpt}</p>}
      {data.published_at && (
        <div className="text-sm text-gray-400 mb-6">
          {format(new Date(data.published_at), "MMMM d, yyyy")}
        </div>
      )}
      <article className="prose prose-neutral">{data.content}</article>
    </main>
  );
}
