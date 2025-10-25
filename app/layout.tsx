import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { ThemeProvider } from "@/contexts/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Code & Coffee - Portfolio",
  description:
    "Full-stack developer passionate about creating amazing digital experiences",
  keywords: [
    "portfolio",
    "developer",
    "web development",
    "react",
    "nextjs",
    "code",
    "coffee",
  ],
  authors: [{ name: "Mukhammadali Kodirov" }],
  viewport: "width=device-width, initial-scale=1",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16", type: "image/x-icon" },
      { url: "/logo.png", sizes: "any", type: "image/png" },
    ],
    apple: { url: "/logo.png", type: "image/png" },
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
          <div className="flex min-h-screen bg-gray-50 dark:bg-dark-900">
            <Sidebar />
            <main className="flex-1 overflow-y-auto md:ml-80">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
