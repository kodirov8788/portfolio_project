/**
 * Authorization Middleware for Next.js API Routes
 * Provides RBAC-based authorization with impersonation support
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import AuthService from "./auth_service";
import { prisma } from "./prisma";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface ImpersonationContext {
  isImpersonating: boolean;
  impersonatorId?: string;
  targetUserId?: string;
  mode?: "view" | "act";
  sessionToken?: string;
}

export interface AuthorizedRequest extends NextRequest {
  user: AuthenticatedUser;
  impersonation: ImpersonationContext;
  ip?: string; // Add IP property
}

/**
 * Authorization middleware factory
 */
export function authorize(
  requiredPermission: string | string[],
  options: {
    requireAll?: boolean;
    allowImpersonation?: boolean;
    requireMFA?: boolean;
  } = {}
) {
  return async function authorizationMiddleware(
    request: NextRequest,
    handler: (req: AuthorizedRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    try {
        // Get authentication context
        const authResult = await authenticateRequest(request);
        if ("error" in authResult) {
          return authResult.error;
        }

        const { user, impersonation } = authResult;

        // Check impersonation context
        if (impersonation.isImpersonating) {
          if (!options.allowImpersonation) {
            return NextResponse.json(
              { error: "Impersonation not allowed for this operation" },
              { status: 403 }
            );
          }

          // For act-mode impersonation, check if impersonator has required permissions
          if (impersonation.mode === "act") {
            const hasPermission = await checkImpersonatorPermission(
              impersonation.impersonatorId!,
              requiredPermission,
              options.requireAll
            );

            if (!hasPermission) {
              return NextResponse.json(
                { error: "Impersonator lacks required permissions" },
                { status: 403 }
              );
            }
          }
        }

        // Check user permissions
        const effectiveUserId = impersonation.isImpersonating
          ? impersonation.targetUserId!
          : user.id;

        const hasPermission = await checkUserPermission(
          effectiveUserId,
          requiredPermission,
          options.requireAll
        );

        if (!hasPermission) {
          return NextResponse.json(
            { error: "Insufficient permissions" },
            { status: 403 }
          );
        }

        // Check MFA requirement
        if (options.requireMFA && !(await checkMFA(user.id))) {
          return NextResponse.json(
            { error: "Multi-factor authentication required" },
            { status: 403 }
          );
        }

        // Create authorized request object
        const authorizedRequest = request as AuthorizedRequest;
        authorizedRequest.user = user;
        authorizedRequest.impersonation = impersonation;

        return await handler(authorizedRequest);
    } catch (error) {
        console.error("Authorization error:", error);
        return NextResponse.json(
          { error: "Authorization failed" },
          { status: 500 }
        );
    }
  };
}

/**
 * Authenticate request and get user context
 */
async function authenticateRequest(
  request: NextRequest
): Promise<
  | { user: AuthenticatedUser; impersonation: ImpersonationContext }
  | { error: NextResponse }
> {
  try {
    // Get NextAuth session
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return {
          error: NextResponse.json(
            { error: "Authentication required" },
            { status: 401 }
          ),
        };
    }

    // Get user from database
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
    });

    if (!user) {
        return {
          error: NextResponse.json({ error: "User not found" }, { status: 401 }),
        };
    }

    // Check for impersonation session
    const impersonationToken = request.headers.get("x-impersonation-token");
    let impersonation: ImpersonationContext = { isImpersonating: false };

    if (impersonationToken) {
        const impersonationSession = await AuthService.getImpersonationSession(
          impersonationToken
        );

        if (impersonationSession) {
          impersonation = {
            isImpersonating: true,
            impersonatorId: impersonationSession.impersonatorId,
            targetUserId: impersonationSession.targetUserId,
            mode: impersonationSession.mode,
            sessionToken: impersonationSession.sessionToken,
          };
        }
    }

    return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name || "Unknown User",
          role: user.role,
        },
        impersonation,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return {
        error: NextResponse.json(
          { error: "Authentication failed" },
          { status: 500 }
        ),
    };
  }
}

/**
 * Check if user has required permission(s)
 */
async function checkUserPermission(
  userId: string,
  permission: string | string[],
  requireAll: boolean = false
): Promise<boolean> {
  if (Array.isArray(permission)) {
    if (requireAll) {
        return await AuthService.hasAllPermissions(userId, permission);
    } else {
        return await AuthService.hasAnyPermission(userId, permission);
    }
  } else {
    // Support wildcard patterns
    if (permission.includes("*")) {
        return await AuthService.hasPermissionPattern(userId, permission);
    } else {
        return await AuthService.hasPermission(userId, permission);
    }
  }
}

/**
 * Check if impersonator has required permission(s)
 */
async function checkImpersonatorPermission(
  impersonatorId: string,
  permission: string | string[],
  requireAll: boolean = false
): Promise<boolean> {
  return await checkUserPermission(impersonatorId, permission, requireAll);
}

/**
 * Check MFA status (placeholder - implement based on your MFA system)
 */
async function checkMFA(_userId: string): Promise<boolean> {
  // TODO: Implement MFA check based on your MFA system
  // This could check a database table, external service, or session data
  return true; // Placeholder - always return true for now
}

/**
 * Require sensitive billing operations middleware
 */
export function requireSensitiveBilling(_thresholdCents: number = 1000000) {
  // ¥10,000 default
  return authorize(["billing.charge", "billing.refund"], {
    requireAll: false,
    allowImpersonation: true,
    requireMFA: true,
  });
}

/**
 * Require admin permissions middleware
 */
export function requireAdmin() {
  return authorize(["system.admin"], {
    requireAll: true,
    allowImpersonation: false,
    requireMFA: true,
  });
}

/**
 * Require impersonation permissions middleware
 */
export function requireImpersonation(mode: "view" | "act" = "view") {
  const permission = mode === "act" ? "impersonate.act" : "impersonate.view";
  return authorize(permission, {
    requireAll: true,
    allowImpersonation: false,
    requireMFA: mode === "act",
  });
}

/**
 * Rate limiting middleware
 */
export function rateLimit(quotaType: string, limit: number = 1) {
  return async function rateLimitMiddleware(
    request: NextRequest,
    handler: (req: AuthorizedRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    try {
        // Get user from request (assuming it's already authenticated)
        const userId = request.headers.get("x-user-id");
        if (!userId) {
          return NextResponse.json(
            { error: "User ID required for rate limiting" },
            { status: 400 }
          );
        }

        // Check quota
        const quotaResult = await AuthService.checkQuota(
          userId,
          quotaType,
          limit
        );

        if (!quotaResult.allowed) {
          return NextResponse.json(
            {
              error: "Rate limit exceeded",
              quota: {
                current: quotaResult.currentUsage,
                limit: quotaResult.limit,
                remaining: quotaResult.remaining,
              },
            },
            { status: 429 }
          );
        }

        return await handler(request as AuthorizedRequest);
    } catch (error) {
        console.error("Rate limiting error:", error);
        return NextResponse.json(
          { error: "Rate limiting failed" },
          { status: 500 }
        );
    }
  };
}

/**
 * Audit logging middleware
 */
export function auditLog(action: string, resourceType?: string) {
  return async function auditLogMiddleware(
    request: AuthorizedRequest,
    handler: (req: AuthorizedRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const startTime = Date.now();

    try {
        const response = await handler(request);

        // Log successful action
        await logAuditEvent({
          actorUserId: request.user.id,
          effectiveUserId: request.impersonation.isImpersonating
            ? request.impersonation.targetUserId!
            : request.user.id,
          action,
          resourceType,
          resourceId: request.nextUrl.searchParams.get("id") || undefined,
          newValues: { status: "success", duration: Date.now() - startTime },
          reason: request.impersonation.isImpersonating
            ? `Impersonation: ${request.impersonation.reason}`
            : undefined,
          ipAddress:
            request.ip || request.headers.get("x-forwarded-for") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
        });

        return response;
    } catch (error) {
        // Log failed action
        await logAuditEvent({
          actorUserId: request.user.id,
          effectiveUserId: request.impersonation.isImpersonating
            ? request.impersonation.targetUserId!
            : request.user.id,
          action,
          resourceType,
          resourceId: request.nextUrl.searchParams.get("id") || undefined,
          newValues: {
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          reason: request.impersonation.isImpersonating
            ? `Impersonation: ${request.impersonation.reason}`
            : undefined,
          ipAddress:
            request.ip || request.headers.get("x-forwarded-for") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
        });

        throw error;
    }
  };
}

/**
 * Log audit event
 */
async function logAuditEvent(event: {
  actorUserId: string;
  effectiveUserId: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}) {
  try {
    await prisma.auditLog.create({
        data: {
          actorUserId: event.actorUserId,
          effectiveUserId: event.effectiveUserId,
          action: event.action,
          resourceType: event.resourceType,
          resourceId: event.resourceId,
          oldValues: event.oldValues,
          newValues: event.newValues,
          reason: event.reason,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          metadata: event.metadata,
        },
    });
  } catch (error) {
    console.error("Error logging audit event:", error);
  }
}

export default {
  authorize,
  requireSensitiveBilling,
  requireAdmin,
  requireImpersonation,
  rateLimit,
  auditLog,
};
