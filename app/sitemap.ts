import { MetadataRoute } from "next";
import { allPosts } from "contentlayer/generated";
import { siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // Base routes
  const routes = ["", "/about", "/projects", "/blog", "/contact"].map(
    (route) => ({
      url: `${siteConfig.url}${route}`,
      lastModified: new Date().toISOString().split("T")[0],
    })
  );

  // Dynamic blog post routes
  const posts = allPosts.map((post) => ({
    url: `${siteConfig.url}/blog/${post.slug}`,
    lastModified: post.date, // Assumes date is in a standard format
  }));

  return [...routes, ...posts];
}
