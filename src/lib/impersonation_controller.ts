/**
 * Impersonation Controller
 * Handles impersonation session management with security controls
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import AuthService from "./auth_service";
import { prisma } from "./prisma";
import { requireImpersonation } from "./authorize_middleware";

export interface StartImpersonationRequest {
  targetUserId: string;
  mode: "view" | "act";
  reason: string;
  mfaCode?: string; // For act-mode impersonation
}

export interface StopImpersonationRequest {
  sessionToken: string;
}

export interface ForceEndImpersonationRequest {
  sessionToken: string;
  reason?: string;
}

export interface ImpersonationResponse {
  sessionToken: string;
  expiresAt: string;
  mode: "view" | "act";
  targetUser: {
    id: string;
    email: string;
    name: string;
  };
}

/**
 * Start impersonation session
 */
export async function startImpersonation(
  request: NextRequest
): Promise<NextResponse> {
  try {
    // Get session from NextAuth
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin (for now, allow admin to impersonate)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required for impersonation" },
        { status: 403 }
      );
    }

    const body: StartImpersonationRequest = await request.json();
    const { targetUserId, mode, reason, mfaCode } = body;

    // Validate input with proper error messages
    if (!targetUserId) {
      return NextResponse.json(
        { error: "Target user ID is required" },
        { status: 400 }
      );
    }

    if (!mode || !["view", "act"].includes(mode)) {
      return NextResponse.json(
        { error: "Mode must be either 'view' or 'act'" },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: "Reason is required and cannot be empty" },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      );
    }

    // For act-mode, require MFA (admin can impersonate in both modes)
    if (mode === "act") {
      // TODO: Implement MFA check for act-mode
      console.log(
        "Act-mode impersonation requested - MFA check would be implemented here"
      );
    }

    // MFA verification for act-mode (currently disabled for testing)
    if (process.env.NODE_ENV === "production" && mode === "act" && !mfaCode) {
      return NextResponse.json(
        {
          error:
            "MFA code is required for act-mode impersonation in production",
        },
        { status: 400 }
      );
    }

    // TODO: Implement MFA verification when ready
    // const mfaValid = await verifyMFA(session.user.id, mfaCode);
    // if (!mfaValid) {
    //   return NextResponse.json(
    //     { error: 'Invalid MFA code' },
    //     { status: 403 }
    //   );
    // }

    // Clean up expired sessions first with better error handling
    try {
      const cleanupResult = await prisma.impersonationSession.updateMany({
        where: {
          impersonatorId: session.user.id,
          endedAt: null,
          expiresAt: { lt: new Date() },
        },
        data: {
          endedAt: new Date(),
        },
      });

      if (cleanupResult.count > 0) {
        console.log(
          `Cleaned up ${cleanupResult.count} expired impersonation sessions for user ${session.user.id}`
        );
      }
    } catch (cleanupError) {
      console.error("Error cleaning up expired sessions:", cleanupError);
      // Continue with the request even if cleanup fails
    }

    // Check if there's already an active impersonation session with better logging
    const existingSession = await prisma.impersonationSession.findFirst({
      where: {
        impersonatorId: session.user.id,
        endedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { startedAt: "desc" },
    });

    if (existingSession) {
      console.log(
        `Active impersonation session found for user ${session.user.id}:`,
        {
          sessionId: existingSession.id,
          targetUserId: existingSession.targetUserId,
          mode: existingSession.mode,
          startedAt: existingSession.startedAt,
          expiresAt: existingSession.expiresAt,
          timeRemaining: Math.max(
            0,
            existingSession.expiresAt.getTime() - Date.now()
          ),
        }
      );

      return NextResponse.json(
        {
          error: "Active impersonation session already exists",
          existingSession: {
            id: existingSession.id,
            targetUserId: existingSession.targetUserId,
            mode: existingSession.mode,
            startedAt: existingSession.startedAt,
            expiresAt: existingSession.expiresAt,
            timeRemainingSeconds: Math.max(
              0,
              Math.floor(
                (existingSession.expiresAt.getTime() - Date.now()) / 1000
              )
            ),
          },
        },
        { status: 409 }
      );
    }

    // Start impersonation session
    const impersonationSession = await AuthService.startImpersonation(
      session.user.id,
      targetUserId,
      mode,
      reason,
      request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      request.headers.get("user-agent") || "unknown"
    );

    if (!impersonationSession) {
      return NextResponse.json(
        { error: "Failed to start impersonation session" },
        { status: 500 }
      );
    }

    // Log the impersonation start
    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        effectiveUserId: session.user.id,
        action: "impersonation.start",
        resourceType: "user",
        resourceId: targetUserId,
        newValues: {
          mode,
          reason,
          targetUser: {
            id: targetUser.id,
            email: targetUser.email,
            name: targetUser.name,
          },
        },
        reason,
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    const response: ImpersonationResponse = {
      sessionToken: impersonationSession.sessionToken,
      expiresAt: impersonationSession.expiresAt.toISOString(),
      mode: impersonationSession.mode,
      targetUser: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name || "Unknown User",
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error starting impersonation:", error);
    return NextResponse.json(
      { error: "Failed to start impersonation" },
      { status: 500 }
    );
  }
}

/**
 * Stop impersonation session
 */
export async function stopImpersonation(
  request: NextRequest
): Promise<NextResponse> {
  return requireImpersonation("view")(request, async (req) => {
    try {
      const body: StopImpersonationRequest = await request.json();
      const { sessionToken } = body;

      if (!sessionToken || sessionToken.trim().length === 0) {
        return NextResponse.json(
          { error: "Session token is required and cannot be empty" },
          { status: 400 }
        );
      }

      // Get current session to log details
      const currentSession = await AuthService.getImpersonationSession(
        sessionToken
      );

      if (!currentSession) {
        return NextResponse.json(
          { error: "Impersonation session not found or expired" },
          { status: 404 }
        );
      }

      // Verify the impersonator owns this session
      if (currentSession.impersonatorId !== req.user.id) {
        return NextResponse.json(
          { error: "Unauthorized to end this impersonation session" },
          { status: 403 }
        );
      }

      // End the session
      const success = await AuthService.endImpersonation(
        sessionToken,
        req.user.id
      );

      if (!success) {
        return NextResponse.json(
          { error: "Failed to end impersonation session" },
          { status: 500 }
        );
      }

      // Log the impersonation end
      await prisma.auditLog.create({
        data: {
          actorUserId: req.user.id,
          effectiveUserId: req.user.id,
          action: "impersonation.end",
          resourceType: "user",
          resourceId: currentSession.targetUserId,
          oldValues: {
            mode: currentSession.mode,
            reason: currentSession.reason,
            startedAt: currentSession.startedAt.toISOString(),
          },
          reason: "Impersonation session ended",
          ipAddress: req.ip || req.headers.get("x-forwarded-for") || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
        },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error stopping impersonation:", error);
      return NextResponse.json(
        { error: "Failed to stop impersonation" },
        { status: 500 }
      );
    }
  });
}

/**
 * Get active impersonation sessions
 */
export async function getActiveImpersonationSessions(
  request: NextRequest
): Promise<NextResponse> {
  const authorizationMiddleware = requireImpersonation("view");

  return authorizationMiddleware(request, async (req) => {
    try {
      // Use the proper sessions endpoint logic
      const sessions = await prisma.impersonationSession.findMany({
        where: {
          endedAt: null,
          expiresAt: { gt: new Date() },
        },
        include: {
          impersonator: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          targetUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { startedAt: "desc" },
      });

      const sessionsWithTimeRemaining = sessions.map((session) => ({
        id: session.id,
        sessionToken: session.sessionToken, // Add session token for DELETE requests
        impersonator: session.impersonator,
        targetUser: session.targetUser,
        mode: session.mode,
        reason: session.reason,
        startedAt: session.startedAt,
        expiresAt: session.expiresAt,
        timeRemainingSeconds: Math.max(
          0,
          Math.floor((session.expiresAt.getTime() - Date.now()) / 1000)
        ),
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      }));

      return NextResponse.json({
        sessions: sessionsWithTimeRemaining,
        total: sessionsWithTimeRemaining.length,
      });
    } catch (error) {
      console.error("Error getting active impersonation sessions:", error);
      return NextResponse.json(
        { error: "Failed to get active sessions" },
        { status: 500 }
      );
    }
  });
}

/**
 * Get impersonation history for a user
 */
export async function getImpersonationHistory(
  request: NextRequest
): Promise<NextResponse> {
  const authorizationMiddleware = requireImpersonation("view");

  return authorizationMiddleware(request, async (req) => {
    try {
      const { searchParams } = new URL(request.url);
      const userId = searchParams.get("userId") || req.user.id;
      const limit = parseInt(searchParams.get("limit") || "50");
      const offset = parseInt(searchParams.get("offset") || "0");

      // Check if user can view history for other users
      if (userId !== req.user.id) {
        const canViewOthers = await AuthService.hasPermission(
          req.user.id,
          "system.audit"
        );
        if (!canViewOthers) {
          return NextResponse.json(
            {
              error:
                "Insufficient permissions to view other users' impersonation history",
            },
            { status: 403 }
          );
        }
      }

      const history = await prisma.impersonationSession.findMany({
        where: {
          OR: [{ impersonatorId: userId }, { targetUserId: userId }],
        },
        include: {
          impersonator: {
            select: { id: true, email: true, name: true },
          },
          targetUser: {
            select: { id: true, email: true, name: true },
          },
        },
        orderBy: { startedAt: "desc" },
        take: limit,
        skip: offset,
      });

      return NextResponse.json({ history });
    } catch (error) {
      console.error("Error getting impersonation history:", error);
      return NextResponse.json(
        { error: "Failed to get impersonation history" },
        { status: 500 }
      );
    }
  });
}

/**
 * Force end impersonation session (admin only)
 */
export async function forceEndImpersonation(
  request: NextRequest
): Promise<NextResponse> {
  const authorizationMiddleware = requireImpersonation("act");

  return authorizationMiddleware(request, async (req) => {
    try {
      const body: ForceEndImpersonationRequest = await request.json();
      const { sessionToken, reason } = body;

      if (!sessionToken || sessionToken.trim().length === 0) {
        return NextResponse.json(
          { error: "Session token is required and cannot be empty" },
          { status: 400 }
        );
      }

      // Get current session
      const currentSession = await AuthService.getImpersonationSession(
        sessionToken
      );

      if (!currentSession) {
        return NextResponse.json(
          { error: "Impersonation session not found or expired" },
          { status: 404 }
        );
      }

      // End the session
      const success = await AuthService.endImpersonation(
        sessionToken,
        req.user.id
      );

      if (!success) {
        return NextResponse.json(
          { error: "Failed to force end impersonation session" },
          { status: 500 }
        );
      }

      // Log the forced end
      await prisma.auditLog.create({
        data: {
          actorUserId: req.user.id,
          effectiveUserId: currentSession.impersonatorId,
          action: "impersonation.force_end",
          resourceType: "user",
          resourceId: currentSession.targetUserId,
          oldValues: {
            mode: currentSession.mode,
            reason: currentSession.reason,
            startedAt: currentSession.startedAt.toISOString(),
          },
          reason: reason || "Impersonation session force ended by admin",
          ipAddress: req.ip || req.headers.get("x-forwarded-for") || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
        },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error force ending impersonation:", error);
      return NextResponse.json(
        { error: "Failed to force end impersonation" },
        { status: 500 }
      );
    }
  });
}

const impersonationController = {
  startImpersonation,
  stopImpersonation,
  getActiveImpersonationSessions,
  getImpersonationHistory,
  forceEndImpersonation,
};

export default impersonationController;
