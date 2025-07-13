import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/ui/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthProvider } from "@/contexts/auth-context";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Portfolio - Full Stack Developer",
  description:
    "Professional portfolio showcasing web development projects, blog posts, and technical expertise.",
  keywords: [
    "portfolio",
    "web development",
    "full stack",
    "react",
    "next.js",
    "typescript",
  ],
  authors: [{ name: "Your Name" }],
  creator: "Your Name",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://your-portfolio.com",
    title: "Portfolio - Full Stack Developer",
    description:
      "Professional portfolio showcasing web development projects, blog posts, and technical expertise.",
    siteName: "Portfolio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Portfolio - Full Stack Developer",
    description:
      "Professional portfolio showcasing web development projects, blog posts, and technical expertise.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (typeof window !== "undefined") {
    console.log("[GLOBAL] SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log(
      "[GLOBAL] SUPABASE_ANON_KEY:",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    console.log(
      "[GLOBAL] SUPABASE_SERVICE_ROLE_KEY:",
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const supabase = createClient();
    supabase
      .from("user_profiles")
      .select("*")
      .limit(1)
      .then(({ error }) => {
        if (error) {
          console.error("[GLOBAL] Supabase connection error:", error);
        } else {
          console.log("[GLOBAL] Supabase connection successful!");
        }
      });
  }

  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.className} h-full bg-gray-50`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <div className="min-h-full">
            <Navigation />
            <main>{children}</main>
            <footer className="bg-white border-t border-gray-200">
              <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="col-span-1 md:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Portfolio
                    </h3>
                    <p className="mt-2 text-sm text-gray-600">
                      Full stack developer passionate about creating beautiful,
                      functional, and user-friendly web applications.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
                      Navigation
                    </h4>
                    <ul className="mt-4 space-y-2">
                      <li>
                        <a
                          href="/about"
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          About
                        </a>
                      </li>
                      <li>
                        <a
                          href="/projects"
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          Projects
                        </a>
                      </li>
                      <li>
                        <Link
                          href="/blog"
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          Blog
                        </Link>
                      </li>
                      <li>
                        <a
                          href="/contact"
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          Contact
                        </a>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
                      Connect
                    </h4>
                    <ul className="mt-4 space-y-2">
                      <li>
                        <a
                          href="https://github.com"
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          GitHub
                        </a>
                      </li>
                      <li>
                        <a
                          href="https://linkedin.com"
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          LinkedIn
                        </a>
                      </li>
                      <li>
                        <a
                          href="https://twitter.com"
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          Twitter
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="mt-8 border-t border-gray-200 pt-8">
                  <p className="text-sm text-gray-600 text-center">
                    © 2024 Portfolio. All rights reserved.
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
