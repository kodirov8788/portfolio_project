"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "./Sidebar";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Always render - conditionally show sidebar based on session and loading state
  return (
    <div className="flex h-screen">
        {/* Mobile sidebar overlay */}
        {status !== "loading" && session && (
          <>
            {/* Mobile backdrop */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* Sidebar */}
            <div
              className={`
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
              fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
            `}
            >
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>
          </>
        )}

        <main className="flex-1 overflow-auto bg-[var(--color-bg-primary)] lg:ml-0">
          {/* Mobile header with hamburger menu */}
          {status !== "loading" && session && (
            <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
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
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          )}
          {children}
        </main>
    </div>
  );
}
