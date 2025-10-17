import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST() {
  try {
    // In NextAuth.js v5, session refresh is handled automatically
    // This endpoint now just validates the current session
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: "No active session" }, { status: 401 });
    }

    return NextResponse.json({
        message: "Session is valid",
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
        },
    });
  } catch (error) {
    console.error("Session validation error:", error);
    return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
    );
  }
}
