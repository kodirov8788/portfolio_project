"use client";

import { getSession } from "next-auth/react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import MinimalSettings from "../../components/MinimalSettings";

export default function SettingsPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return; // Still loading
    if (!session) redirect("/auth/signin");
  }, [session, status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  return <MinimalSettings />;
}
