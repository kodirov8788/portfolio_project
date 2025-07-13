async function seed() {
  // Dynamically import createClient for ESM compatibility
  const { createClient } = await import("../src/lib/supabase/server");
  const supabase = await createClient();

  // Example projects
  const projects = [
    {
      title: "Portfolio Website",
      slug: "portfolio-website",
      short_description: "A modern portfolio site.",
      full_description:
        "A full-featured portfolio built with Next.js, Supabase, and Tailwind CSS.",
      featured: true,
      status: "published",
      created_by: "00000000-0000-0000-0000-000000000000",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      title: "Blog Platform",
      slug: "blog-platform",
      short_description: "A simple blog platform.",
      full_description: "A blog platform with markdown support and comments.",
      featured: false,
      status: "published",
      created_by: "00000000-0000-0000-0000-000000000000",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // Example blog posts
  const blogPosts = [
    {
      title: "Welcome to My Blog",
      slug: "welcome-to-my-blog",
      content: "This is the first post on my new blog!",
      status: "published",
      author_id: "00000000-0000-0000-0000-000000000000",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      title: "Building with Supabase",
      slug: "building-with-supabase",
      content: "How to use Supabase in your Next.js projects.",
      status: "published",
      author_id: "00000000-0000-0000-0000-000000000000",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // Insert projects
  const { error: projectError } = await supabase
    .from("projects")
    .insert(projects);
  if (projectError) {
    console.error("Error inserting projects:", projectError);
  } else {
    console.log("Inserted example projects.");
  }

  // Insert blog posts
  const { error: blogError } = await supabase
    .from("blog_posts")
    .insert(blogPosts);
  if (blogError) {
    console.error("Error inserting blog posts:", blogError);
  } else {
    console.log("Inserted example blog posts.");
  }
}

seed().then(() => process.exit(0));
