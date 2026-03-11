import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
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
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="system" storageKey="portfolio-theme">
          <div className="flex min-h-screen w-full bg-gray-50 dark:bg-dark-900 overflow-hidden">
            <Sidebar />
            <main className="flex-1 w-full min-w-0 md:ml-80">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
