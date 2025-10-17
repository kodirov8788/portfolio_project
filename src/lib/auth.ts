import NextAuth, { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const resolveNextAuthSecret = (): string => {
  const explicitSecret = process.env.NEXTAUTH_SECRET?.trim();
  if (explicitSecret) {
    return explicitSecret;
  }

  const fallbackSecret = process.env.NEXTAUTH_FALLBACK_SECRET?.trim();
  if (fallbackSecret) {
    console.warn(
      "[NextAuth] Using NEXTAUTH_FALLBACK_SECRET. Set NEXTAUTH_SECRET in production."
    );
    return fallbackSecret;
  }

  if (process.env.DATABASE_URL) {
    console.warn(
      "[NextAuth] NEXTAUTH_SECRET not provided. Deriving deterministic fallback from DATABASE_URL."
    );
    return crypto
      .createHash("sha256")
      .update(process.env.DATABASE_URL)
      .digest("hex");
  }

  console.warn(
    "[NextAuth] No NEXTAUTH_SECRET or fallback environment variables found. Using static development secret."
  );
  return "autoreach-pro-development-secret-please-set";
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("🔍 [DEBUG] Authorize called with:", {
          email: credentials?.email,
        });

        if (!credentials?.email || !credentials?.password) {
          console.log("🔍 [DEBUG] Missing credentials");
          return null;
        }

        try {
          // Simple test authentication first (fallback)
          if (
            credentials?.email === "admin@muhammadali.pro" &&
            credentials?.password === "admin123!"
          ) {
            console.log(
              "🔍 [DEBUG] Simple auth successful - fetching user from database"
            );
            const adminUser = await prisma.user.findUnique({
              where: { email: "admin@muhammadali.pro" },
            });

            if (adminUser) {
              return {
                id: adminUser.id, // Use actual database user ID
                email: adminUser.email,
                name:
                  adminUser.fullName || adminUser.firstName || adminUser.email,
                role: adminUser.role?.name || "admin",
              };
            }
          }

          // Database authentication
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
            include: {
              role: true,
            },
          });

          console.log("🔍 [DEBUG] User found:", user ? "YES" : "NO");

          if (!user || !user.password) {
            console.log("🔍 [DEBUG] User not found or no password");
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          console.log("🔍 [DEBUG] Password valid:", isPasswordValid);

          if (!isPasswordValid) {
            console.log("🔍 [DEBUG] Invalid password");
            return null;
          }

          console.log(
            "🔍 [DEBUG] Authentication successful for user:",
            user.email
          );

          return {
            id: user.id,
            email: user.email,
            name: user.fullName || user.firstName || user.email,
            role: user.role?.name || "user",
          };
        } catch (error) {
          console.error("🔍 [DEBUG] Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: resolveNextAuthSecret(),
};

const handler = NextAuth(authOptions);

export { handler as default };
