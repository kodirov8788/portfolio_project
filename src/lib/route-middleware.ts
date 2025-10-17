import { NextRequest, NextResponse } from "next/server";
// Removed getServerSession import
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UsageLimitService } from "@/lib/usage-limits";
import { UserRole, UsageAction } from "@/generated/prisma";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  subscriptionPlan: string;
  isActive: boolean;
}

export interface AuthenticatedRequest extends NextRequest {
  user: AuthenticatedUser;
}

export interface RouteConfig {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  usageAction?: UsageAction;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

export async function authenticateRequest(): Promise<{
  user?: AuthenticatedUser;
  error?: NextResponse;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return {
          error: NextResponse.json(
            { success: false, error: "Unauthorized" },
            { status: 401 }
          ),
        };
    }

    // Verify user exists in database and get current data
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          email: true,
          role: true,
          subscriptionPlan: true,
          isActive: true,
        },
    });

    if (!user) {
        return {
          error: NextResponse.json(
            { success: false, error: "User not found" },
            { status: 404 }
          ),
        };
    }

    if (!user.isActive) {
        return {
          error: NextResponse.json(
            { success: false, error: "Account is deactivated" },
            { status: 403 }
          ),
        };
    }

    return { user };
  } catch (error) {
    console.error("Authentication error:", error);
    return {
        error: NextResponse.json(
          { success: false, error: "Authentication failed" },
          { status: 500 }
        ),
    };
  }
}

// ============================================================================
// AUTHORIZATION MIDDLEWARE
// ============================================================================

export async function authorizeAdmin(
  user: AuthenticatedUser
): Promise<NextResponse | null> {
  if (user.role !== "ADMIN") {
    return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
    );
  }
  return null;
}

// ============================================================================
// USAGE LIMIT MIDDLEWARE
// ============================================================================

export async function checkUsageLimits(
  user: AuthenticatedUser,
  action: UsageAction
): Promise<NextResponse | null> {
  try {
    const canProceed = await UsageLimitService.checkUsageLimit(user.id, action);

    if (!canProceed.canProceed) {
        return NextResponse.json(
          {
            success: false,
            error: "Usage limit exceeded",
            details: {
              reason: canProceed.reason,
            },
          },
          { status: 429 }
        );
    }

    return null;
  } catch (error) {
    console.error("Usage limit check error:", error);
    return NextResponse.json(
        { success: false, error: "Usage limit check failed" },
        { status: 500 }
    );
  }
}

// ============================================================================
// RATE LIMITING MIDDLEWARE
// ============================================================================

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  user: AuthenticatedUser,
  config: { maxRequests: number; windowMs: number }
): NextResponse | null {
  const key = `rate_limit:${user.id}`;
  const now = Date.now();

  const current = rateLimitStore.get(key);
  if (current && current.resetTime > now) {
    if (current.count >= config.maxRequests) {
        return NextResponse.json(
          {
            success: false,
            error: "Rate limit exceeded",
            details: {
              limit: config.maxRequests,
              windowMs: config.windowMs,
              resetTime: current.resetTime,
            },
          },
          { status: 429 }
        );
    }
    current.count++;
  } else {
    rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
    });
  }

  return null;
}

// ============================================================================
// MAIN ROUTE HANDLER WRAPPER
// ============================================================================

export function withRouteProtection(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>,
  config: RouteConfig = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
        // Authentication check
        if (config.requireAuth !== false) {
          const authResult = await authenticateRequest();
          if (authResult.error) {
            return authResult.error;
          }

          // Add user to request
          (request as AuthenticatedRequest).user = authResult.user!;
        }

        // Admin authorization check
        if (config.requireAdmin) {
          const adminError = await authorizeAdmin(
            (request as AuthenticatedRequest).user
          );
          if (adminError) {
            return adminError;
          }
        }

        // Rate limiting check
        if (config.rateLimit) {
          const rateLimitError = checkRateLimit(
            (request as AuthenticatedRequest).user,
            config.rateLimit
          );
          if (rateLimitError) {
            return rateLimitError;
          }
        }

        // Usage limit check
        if (config.usageAction) {
          const usageError = await checkUsageLimits(
            (request as AuthenticatedRequest).user,
            config.usageAction
          );
          if (usageError) {
            return usageError;
          }
        }

        // Execute the actual handler
        return await handler(request as AuthenticatedRequest);
    } catch (error) {
        console.error("Route handler error:", error);
        return NextResponse.json(
          {
            success: false,
            error: "Internal server error",
            details: process.env.NODE_ENV === "development" ? error : undefined,
          },
          { status: 500 }
        );
    }
  };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateRequestBody<T>(
  body: unknown,
  schema: Record<keyof T, "required" | "optional">
): { data: T; error?: NextResponse } {
  const errors: string[] = [];
  const data: Record<string, unknown> = {};
  const bodyObj = body as Record<string, unknown>;

  for (const [key, requirement] of Object.entries(schema)) {
    if (
        requirement === "required" &&
        (bodyObj[key] === undefined || bodyObj[key] === null)
    ) {
        errors.push(`${key} is required`);
    } else if (bodyObj[key] !== undefined) {
        data[key] = bodyObj[key];
    }
  }

  if (errors.length > 0) {
    return {
        data: {} as T,
        error: NextResponse.json(
          {
            success: false,
            error: "Validation failed",
            details: errors,
          },
          { status: 400 }
        ),
    };
  }

  return { data: data as T };
}

export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: Record<keyof T, "required" | "optional">
): { data: T; error?: NextResponse } {
  const errors: string[] = [];
  const data: Record<string, unknown> = {};

  for (const [key, requirement] of Object.entries(schema)) {
    const value = searchParams.get(key);
    if (requirement === "required" && !value) {
        errors.push(`${key} is required`);
    } else if (value) {
        data[key] = value;
    }
  }

  if (errors.length > 0) {
    return {
        data: {} as T,
        error: NextResponse.json(
          {
            success: false,
            error: "Invalid query parameters",
            details: errors,
          },
          { status: 400 }
        ),
    };
  }

  return { data: data as T };
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
        success: true,
        data,
        ...(message && { message }),
    },
    { status }
  );
}

export function errorResponse(
  error: string,
  status: number = 400,
  details?: unknown
): NextResponse {
  return NextResponse.json(
    {
        success: false,
        error,
        ...(typeof details === "object" && details !== null ? { details } : {}),
    },
    { status }
  );
}

export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
    },
  });
}

// ============================================================================
// LOGGING HELPERS
// ============================================================================

export function logUserAction(
  userId: string,
  action: string,
  details?: unknown,
  ipAddress?: string
) {
  try {
    prisma.userAction.create({
        data: {
          userId,
          action,
          details: details || {},
          ipAddress,
        },
    });
  } catch (error) {
    console.error("Failed to log user action:", error);
  }
}

export function logUsage(
  userId: string,
  action: UsageAction,
  resource: string,
  quantity: number = 1,
  metadata?: unknown
) {
  try {
    prisma.usageLog.create({
        data: {
          userId,
          action,
          resource,
          quantity,
          metadata: metadata || {},
        },
    });
  } catch (error) {
    console.error("Failed to log usage:", error);
  }
}
