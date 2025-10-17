import { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "../components/AuthProvider";
import TWEProvider from "../components/TWEProvider";
import { ThemeProvider } from "../contexts/ThemeContext";
import LayoutWrapper from "../components/LayoutWrapper";
import Script from "next/script";
import I18nProvider from "../components/I18nProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Auto Reach Pro",
  description:
    "Automate your business outreach with intelligent contact management",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <head>
        <Script
          src="https://cdn.jsdelivr.net/npm/tw-elements@2.0.0/dist/js/tw-elements.umd.min.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={inter.className}>
        <I18nProvider>
          <AuthProvider>
            <TWEProvider>
              <ThemeProvider>
                <LayoutWrapper>{children}</LayoutWrapper>
              </ThemeProvider>
            </TWEProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
