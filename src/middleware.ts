import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/auth/signin",
  "/auth/signup",
  "/api/auth",
  "/api/health", // Health check endpoints
];

// Define API routes that should be protected
const PROTECTED_API_ROUTES = ["/api/user", "/api/settings"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is public
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Check if it's a protected API route
  const isProtectedApiRoute = PROTECTED_API_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Allow public routes to pass through
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For all other routes (pages and protected APIs), require authentication
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // If no token and it's a protected API route, return 401
  if (!token && isProtectedApiRoute) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  // If no token and it's a page route, redirect to signin
  if (!token && !isPublicRoute) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

// --------------------------
// ✅ Matcher config
// --------------------------
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (web app manifest)
     * - logo.svg and other static assets
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|logo.svg|logo-black.png|favicon.png|jp.svg|gemini-color.svg|globe.svg|file.svg|window.svg|next.svg|vercel.svg|public/).*)",
  ],
};
