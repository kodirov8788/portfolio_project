"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { memo } from "react";

interface SessionProviderProps {
  children: React.ReactNode;
}

export const SessionProvider = memo(function SessionProvider({
  children,
}: SessionProviderProps) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
});
