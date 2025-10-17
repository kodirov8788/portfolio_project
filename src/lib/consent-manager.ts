import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

// Consent types and interfaces
export interface ConsentRequest {
  id: string;
  userId: string;
  origin: string;
  action: string;
  requestedAt: Date;
  expiresAt: Date;
  status: "pending" | "granted" | "denied" | "expired";
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    desktopAppId?: string;
    permissions?: string[];
  };
}

export interface ConsentGrant {
  id: string;
  userId: string;
  origin: string;
  action: string;
  grantedAt: Date;
  expiresAt: Date;
  permissions: string[];
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    desktopAppId?: string;
    sessionId?: string;
  };
}

export interface ConsentConfig {
  defaultExpirationMinutes: number;
  maxConsentRequests: number;
  requireExplicitConsent: boolean;
  allowedActions: string[];
  allowedPermissions: string[];
  logConsentActivity: boolean;
}

export const DEFAULT_CONSENT_CONFIG: ConsentConfig = {
  defaultExpirationMinutes: 10, // 10 minutes for consent requests
  maxConsentRequests: 5, // Max pending requests per user
  requireExplicitConsent: true,
  allowedActions: [
    "desktop-app-connection",
    "form-automation",
    "screenshot-capture",
    "browser-control",
    "data-access",
  ],
  allowedPermissions: ["read", "write", "execute", "control", "monitor"],
  logConsentActivity: true,
};

export class ConsentManager {
  private config: ConsentConfig;
  private consentRequests: Map<string, ConsentRequest> = new Map();
  private consentGrants: Map<string, ConsentGrant> = new Map();
  private activityLog: Array<{
    type: "request" | "grant" | "deny" | "expire";
    userId: string;
    origin: string;
    action: string;
    timestamp: Date;
    metadata?: any;
  }> = [];

  constructor(config: Partial<ConsentConfig> = {}) {
    this.config = { ...DEFAULT_CONSENT_CONFIG, ...config };
    this.startCleanupTimer();
    console.log("🔐 Consent Manager initialized");
  }

  // Create a new consent request
  createConsentRequest(
    userId: string,
    origin: string,
    action: string,
    metadata?: ConsentRequest["metadata"]
  ): { success: boolean; requestId?: string; error?: string } {
    try {
        // Validate action
        if (!this.config.allowedActions.includes(action)) {
          return { success: false, error: "Action not allowed" };
        }

        // Check for existing pending requests
        const existingRequests = Array.from(this.consentRequests.values()).filter(
          (req) =>
            req.userId === userId &&
            req.status === "pending" &&
            req.expiresAt > new Date()
        );

        if (existingRequests.length >= this.config.maxConsentRequests) {
          return { success: false, error: "Too many pending consent requests" };
        }

        // Create new request
        const requestId = this.generateRequestId();
        const now = new Date();
        const expiresAt = new Date(
          now.getTime() + this.config.defaultExpirationMinutes * 60 * 1000
        );

        const consentRequest: ConsentRequest = {
          id: requestId,
          userId,
          origin,
          action,
          requestedAt: now,
          expiresAt,
          status: "pending",
          metadata,
        };

        this.consentRequests.set(requestId, consentRequest);
        this.logActivity("request", userId, origin, action, { requestId });

        console.log(
          `🔐 Consent request created: ${requestId} for user ${userId}`
        );

        return { success: true, requestId };
    } catch (error) {
        console.error("Failed to create consent request:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
    }
  }

  // Grant consent
  grantConsent(
    requestId: string,
    permissions: string[] = ["read", "write"]
  ): { success: boolean; grantId?: string; error?: string } {
    try {
        const request = this.consentRequests.get(requestId);

        if (!request) {
          return { success: false, error: "Consent request not found" };
        }

        if (request.status !== "pending") {
          return { success: false, error: "Consent request is not pending" };
        }

        if (new Date() > request.expiresAt) {
          request.status = "expired";
          this.logActivity(
            "expire",
            request.userId,
            request.origin,
            request.action,
            { requestId }
          );
          return { success: false, error: "Consent request expired" };
        }

        // Validate permissions
        const validPermissions = permissions.filter((p) =>
          this.config.allowedPermissions.includes(p)
        );

        if (validPermissions.length === 0) {
          return { success: false, error: "No valid permissions provided" };
        }

        // Create consent grant
        const grantId = this.generateGrantId();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes

        const consentGrant: ConsentGrant = {
          id: grantId,
          userId: request.userId,
          origin: request.origin,
          action: request.action,
          grantedAt: now,
          expiresAt,
          permissions: validPermissions,
          metadata: {
            ...request.metadata,
            sessionId: grantId,
          },
        };

        this.consentGrants.set(grantId, consentGrant);
        request.status = "granted";
        this.logActivity(
          "grant",
          request.userId,
          request.origin,
          request.action,
          {
            requestId,
            grantId,
            permissions: validPermissions,
          }
        );

        console.log(`✅ Consent granted: ${grantId} for request ${requestId}`);

        return { success: true, grantId };
    } catch (error) {
        console.error("Failed to grant consent:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
    }
  }

  // Deny consent
  denyConsent(requestId: string): { success: boolean; error?: string } {
    try {
        const request = this.consentRequests.get(requestId);

        if (!request) {
          return { success: false, error: "Consent request not found" };
        }

        if (request.status !== "pending") {
          return { success: false, error: "Consent request is not pending" };
        }

        request.status = "denied";
        this.logActivity("deny", request.userId, request.origin, request.action, {
          requestId,
        });

        console.log(`❌ Consent denied for request: ${requestId}`);

        return { success: true };
    } catch (error) {
        console.error("Failed to deny consent:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
    }
  }

  // Validate consent grant
  validateConsent(
    grantId: string,
    origin: string,
    action: string,
    requiredPermissions: string[] = []
  ): { valid: boolean; grant?: ConsentGrant; error?: string } {
    try {
        const grant = this.consentGrants.get(grantId);

        if (!grant) {
          return { valid: false, error: "Consent grant not found" };
        }

        if (new Date() > grant.expiresAt) {
          this.consentGrants.delete(grantId);
          return { valid: false, error: "Consent grant expired" };
        }

        if (grant.origin !== origin) {
          return { valid: false, error: "Origin mismatch" };
        }

        if (grant.action !== action) {
          return { valid: false, error: "Action mismatch" };
        }

        // Check required permissions
        const hasRequiredPermissions = requiredPermissions.every((permission) =>
          grant.permissions.includes(permission)
        );

        if (!hasRequiredPermissions) {
          return { valid: false, error: "Insufficient permissions" };
        }

        return { valid: true, grant };
    } catch (error) {
        console.error("Failed to validate consent:", error);
        return {
          valid: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
    }
  }

  // Get user's consent requests
  getUserConsentRequests(userId: string): ConsentRequest[] {
    return Array.from(this.consentRequests.values())
        .filter((req) => req.userId === userId)
        .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
  }

  // Get user's active consent grants
  getUserConsentGrants(userId: string): ConsentGrant[] {
    const now = new Date();
    return Array.from(this.consentGrants.values())
        .filter((grant) => grant.userId === userId && grant.expiresAt > now)
        .sort((a, b) => b.grantedAt.getTime() - a.grantedAt.getTime());
  }

  // Revoke consent grant
  revokeConsent(grantId: string): { success: boolean; error?: string } {
    try {
        const grant = this.consentGrants.get(grantId);

        if (!grant) {
          return { success: false, error: "Consent grant not found" };
        }

        this.consentGrants.delete(grantId);
        this.logActivity("revoke", grant.userId, grant.origin, grant.action, {
          grantId,
        });

        console.log(`🔒 Consent revoked: ${grantId}`);

        return { success: true };
    } catch (error) {
        console.error("Failed to revoke consent:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
    }
  }

  // Get consent statistics
  getConsentStats(): {
    totalRequests: number;
    pendingRequests: number;
    grantedRequests: number;
    deniedRequests: number;
    activeGrants: number;
    expiredGrants: number;
    recentActivity: number;
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const requests = Array.from(this.consentRequests.values());
    const grants = Array.from(this.consentGrants.values());

    return {
        totalRequests: requests.length,
        pendingRequests: requests.filter((r) => r.status === "pending").length,
        grantedRequests: requests.filter((r) => r.status === "granted").length,
        deniedRequests: requests.filter((r) => r.status === "denied").length,
        activeGrants: grants.filter((g) => g.expiresAt > now).length,
        expiredGrants: grants.filter((g) => g.expiresAt <= now).length,
        recentActivity: this.activityLog.filter((a) => a.timestamp > oneHourAgo)
          .length,
    };
  }

  // Log consent activity
  private logActivity(
    type: "request" | "grant" | "deny" | "expire" | "revoke",
    userId: string,
    origin: string,
    action: string,
    metadata?: any
  ): void {
    if (!this.config.logConsentActivity) return;

    this.activityLog.push({
        type,
        userId,
        origin,
        action,
        timestamp: new Date(),
        metadata,
    });

    // Keep only last 10000 activities to prevent memory leaks
    if (this.activityLog.length > 10000) {
        this.activityLog = this.activityLog.slice(-10000);
    }
  }

  // Cleanup expired requests and grants
  private cleanupExpired(): void {
    const now = new Date();
    let cleanedRequests = 0;
    let cleanedGrants = 0;

    // Clean expired requests
    for (const [id, request] of this.consentRequests) {
        if (request.expiresAt <= now && request.status === "pending") {
          request.status = "expired";
          this.logActivity(
            "expire",
            request.userId,
            request.origin,
            request.action,
            { requestId: id }
          );
          cleanedRequests++;
        }
    }

    // Clean expired grants
    for (const [id, grant] of this.consentGrants) {
        if (grant.expiresAt <= now) {
          this.consentGrants.delete(id);
          cleanedGrants++;
        }
    }

    if (cleanedRequests > 0 || cleanedGrants > 0) {
        console.log(
          `🧹 Cleaned up ${cleanedRequests} expired requests and ${cleanedGrants} expired grants`
        );
    }
  }

  // Start cleanup timer
  private startCleanupTimer(): void {
    setInterval(() => {
        this.cleanupExpired();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  // Utility methods
  private generateRequestId(): string {
    return `consent_req_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
  }

  private generateGrantId(): string {
    return `consent_grant_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
  }

  // Update configuration
  updateConfig(newConfig: Partial<ConsentConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log("🔐 Consent configuration updated");
  }

  // Get current configuration
  getConfig(): ConsentConfig {
    return { ...this.config };
  }
}

// Global consent manager instance
export const consentManager = new ConsentManager();

// Middleware function for consent validation
export function withConsentValidation(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    action: string;
    requiredPermissions?: string[];
    strictMode?: boolean;
  }
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
          return NextResponse.json(
            { success: false, error: "Authentication required" },
            { status: 401 }
          );
        }

        const origin = request.headers.get("origin");
        const grantId = request.headers.get("x-consent-grant-id");

        if (!origin) {
          return NextResponse.json(
            { success: false, error: "Origin header required" },
            { status: 400 }
          );
        }

        if (!grantId && options.strictMode) {
          return NextResponse.json(
            { success: false, error: "Consent grant required" },
            { status: 403 }
          );
        }

        if (grantId) {
          const validation = consentManager.validateConsent(
            grantId,
            origin,
            options.action,
            options.requiredPermissions || []
          );

          if (!validation.valid) {
            return NextResponse.json(
              { success: false, error: validation.error },
              { status: 403 }
            );
          }
        }

        const response = await handler(request);
        response.headers.set("X-Consent-Validated", "true");

        return response;
    } catch (error) {
        console.error("Consent validation error:", error);
        return NextResponse.json(
          { success: false, error: "Consent validation failed" },
          { status: 500 }
        );
    }
  };
}
