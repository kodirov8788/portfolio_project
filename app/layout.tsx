import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Background from "@/components/Background";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { siteConfig } from "@/config/site";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "portfolio",
    "backend engineer",
    "distributed systems",
    "AWS",
    "Go",
    "Technical Leadership",
  ],
  authors: [{ name: siteConfig.author }],
  viewport: "width=device-width, initial-scale=1",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16", type: "image/x-icon" },
      { url: "/logo.png", sizes: "any", type: "image/png" },
    ],
    apple: { url: "/logo.png", type: "image/png" },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: "/logo.png", // Fallback image
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: ["/logo.png"],
    creator: "@kodirovdev", // Optional, replace with your actual handle
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth dark" suppressHydrationWarning>
      <head>
        {/* Prevent white flash — apply theme class before paint */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var stored = localStorage.getItem('portfolio-theme');
              var theme = stored || 'dark';
              var resolved = theme === 'system'
                ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                : theme;
              document.documentElement.classList.remove('light','dark');
              document.documentElement.classList.add(resolved);
            } catch(e){}
          })();
        `}} />
      </head>
      <body className={`${inter.className} bg-white dark:bg-[#0a0a0f] transition-colors duration-300`}>
        <ThemeProvider defaultTheme="dark" storageKey="portfolio-theme">
          <div className="relative flex min-h-screen w-full overflow-hidden bg-white dark:bg-[#0a0a0f]">
            <Background />
            <Sidebar />
            <main className="relative z-10 flex-1 w-full min-w-0 md:ml-80 bg-white/50 dark:bg-transparent backdrop-blur-[2px]">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
