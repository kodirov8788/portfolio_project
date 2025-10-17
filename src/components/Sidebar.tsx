"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useTranslation } from "react-i18next";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "nav.dashboard",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"
        />
      </svg>
    ),
    description: "nav.dashboard.description",
  },
  {
    href: "/settings",
    label: "nav.settings",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
    description: "nav.settings.description",
  },
];

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { t } = useTranslation();

  const isActive = (href: string) => {
    // For exact matches
    if (pathname === href) return true;

    // For dynamic routes, check if pathname starts with the href
    if (pathname.startsWith(href + "/")) return true;

    return false;
  };

  // Always render - conditionally show sidebar based on session
  return session ? (
    <div className="bg-white border-r border-gray-200 h-screen w-80">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-white">
          <div className="flex items-center space-x-3 animate-fade-in">
            <div className="relative bg-white rounded-lg p-2 shadow-sm">
              <Image
                src="/logo.svg"
                alt="Auto Reach Pro"
                width={80}
                height={60}
                className="h-12 w-20 drop-shadow-sm"
              />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                Auto Reach Pro
              </div>
              <div className="text-xs text-gray-500 font-medium">
                {t("nav.businessOutreach")}
              </div>
            </div>
          </div>

          {/* Mobile close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 py-8 space-y-3 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] ${
                isActive(item.href)
                  ? "bg-primary-50 text-primary-700 shadow-soft transform scale-[1.02]"
                  : "text-gray-700 hover:bg-primary-50 hover:text-primary-700 hover:shadow-soft"
              }`}
            >
              {/* Active indicator */}
              {isActive(item.href) && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 rounded-r-full shadow-sm"></div>
              )}

              <div
                className={`flex-shrink-0 transition-all duration-200 ${
                  isActive(item.href)
                    ? "text-primary-600"
                    : "text-gray-500 group-hover:text-primary-600"
                }`}
              >
                <div className="w-6 h-6">{item.icon}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-base">{t(item.label)}</div>
                {item.description && (
                  <div className="text-sm text-gray-500 group-hover:text-primary-500 truncate">
                    {t(item.description)}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {session.user?.name?.charAt(0) || "U"}
                </span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {session.user?.name || t("ui.user")}
                </div>
                <div className="text-xs text-gray-500">
                  {session.user?.email || "user@example.com"}
                </div>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
              title={t("ui.signOut")}
            >
              <svg
                className="w-5 h-5 text-gray-600 group-hover:text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;
}
