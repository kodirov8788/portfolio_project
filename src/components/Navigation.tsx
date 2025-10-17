"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Menu from "./Menu";
import { useTranslation } from "react-i18next";

interface NavItem {
  href: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "nav.dashboard",
  },
  {
    href: "/settings",
    label: "nav.settings",
  },
];

export default function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  const isActive = useCallback(
    (path: string) => {
      // For exact matches
      if (pathname === path) return true;

      // For dynamic routes, check if pathname starts with the path
      if (pathname.startsWith(path + "/")) return true;

      return false;
    },
    [pathname]
  );

  const navLinkClass = useCallback(
    (active: boolean) =>
      `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        active
          ? "bg-blue-100 text-blue-700 border border-blue-200"
          : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
      }`,
    []
  );

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const roleBadgeClass = useMemo(
    () =>
      `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
        session?.user.role === "ADMIN"
          ? "bg-red-100 text-red-800"
          : "bg-green-100 text-green-800"
      }`,
    [session?.user.role]
  );

  if (!session) {
    return null;
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="bg-white rounded-lg p-2 shadow-sm">
                <Image
                  src="/logo.svg"
                  alt="Auto Reach Pro"
                  width={60}
                  height={60}
                  className="h-12 w-auto"
                  priority
                />
              </div>
              <div className="hidden sm:block">
                <div className="text-xl font-bold text-gray-900">
                  Auto Reach Pro
                </div>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {/* Main Navigation Links */}
            <div className="hidden md:flex items-center space-x-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={navLinkClass(isActive(item.href))}
                >
                  {t(item.label)}
                </Link>
              ))}
            </div>

            {/* Menu Component */}
            <Menu />

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                type="button"
                className="text-gray-700 hover:text-gray-900 p-2 rounded-md"
                onClick={toggleMobileMenu}
                aria-expanded={isMobileMenuOpen}
                aria-label="Toggle mobile menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>

            {/* User Info and Sign Out */}
            <div className="flex items-center space-x-2">
              <span className={roleBadgeClass}>{session.user.role}</span>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              {t("ui.signOut")}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive(item.href)
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                  onClick={closeMobileMenu}
                >
                  {t(item.label)}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
