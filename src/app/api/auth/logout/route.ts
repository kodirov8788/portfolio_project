import { NextResponse } from "next/server";

export async function POST() {
  try {
    // In a real application, you might want to add the token to a blacklist
    // For now, we'll just return a success message
    // The client should remove the token from storage

    return NextResponse.json(
        {
          message: "Logout successful",
        },
        { status: 200 }
    );
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
    );
  }
}
