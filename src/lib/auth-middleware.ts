import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function authenticateRequest(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _request: NextRequest
): Promise<AuthenticatedUser | null> {
  try {
    // Get session from NextAuth
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        console.log("🔍 [DEBUG] No authenticated session found");
        return null;
    }

    // Get user from database
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
    });

    if (!user) {
        console.log("🔍 [DEBUG] User not found in database:", session.user.id);
        return null;
    }

    console.log("🔍 [DEBUG] Using authenticated user:", user.id);
    return {
        id: user.id,
        email: user.email,
        name: user.name || "User",
        role: user.role,
    };

    // Original authentication logic (commented out for now)
    /*
    const session = await getServerSession(authOptions);
    console.log("🔍 [DEBUG] Session in middleware:", session);
    console.log("🔍 [DEBUG] Session user:", session?.user);

    if (session?.user?.email) {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        });
        console.log("🔍 [DEBUG] User found in DB:", user);
        if (user) {
          return {
            id: user.id,
            email: user.email,
            name: user.name || "Unknown User",
            role: user.role,
          };
        }
    }
    */

    return null;
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
}

export async function requireAuth(
  request: NextRequest
): Promise<{ user: AuthenticatedUser } | { error: NextResponse }> {
  const user = await authenticateRequest(request);

  if (!user) {
    return {
        error: NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        ),
    };
  }

  return { user };
}
