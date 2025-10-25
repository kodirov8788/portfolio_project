import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { ThemeProvider } from "@/contexts/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Your Name - Portfolio",
  description:
    "Full-stack developer passionate about creating amazing digital experiences",
  keywords: [
    "portfolio",
    "developer",
    "web development",
    "react",
    "nextjs",
    "typescript",
  ],
  authors: [{ name: "Your Name" }],
  viewport: "width=device-width, initial-scale=1",
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
