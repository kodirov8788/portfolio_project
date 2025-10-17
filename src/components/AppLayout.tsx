"use client";

import { ReactNode } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "./Sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { data: session } = useSession();

  // Always render - conditionally show sidebar based on session
  return (
    <>
        {!session ? (
          <>{children}</>
        ) : (
          <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        )}
    </>
  );
}
