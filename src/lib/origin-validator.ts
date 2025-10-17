import { NextRequest, NextResponse } from "next/server";

// Centralized origin validation configuration
export interface OriginConfig {
  allowedOrigins: string[];
  allowedProtocols: string[];
  allowedPorts: number[];
  strictMode: boolean;
  logViolations: boolean;
}

export const DEFAULT_ORIGIN_CONFIG: OriginConfig = {
  allowedOrigins: [
    // Production domains
    "https://autoreachpro.com",
    "https://www.autoreachpro.com",
    "https://autoreach-pro.vercel.app",

    // Development domains
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",

    // Staging domains (if any)
    "https://staging.autoreachpro.com",
  ],
  allowedProtocols: ["http:", "https:"],
  allowedPorts: [3000, 3001, 3002, 3003, 3004, 3005],
  strictMode: true,
  logViolations: true,
};

export class OriginValidator {
  private config: OriginConfig;
  private violationLog: Array<{
    origin: string;
    timestamp: Date;
    reason: string;
    userAgent?: string;
  }> = [];

  constructor(config: Partial<OriginConfig> = {}) {
    this.config = { ...DEFAULT_ORIGIN_CONFIG, ...config };
  }

  // Validate origin with comprehensive checks
  validateOrigin(
    origin: string,
    userAgent?: string
  ): { valid: boolean; reason?: string; normalizedOrigin?: string } {
    try {
        // Basic format validation
        if (!origin || typeof origin !== "string") {
          this.logViolation(origin, "Empty or invalid origin format", userAgent);
          return { valid: false, reason: "Invalid origin format" };
        }

        // Parse URL to extract components
        const url = new URL(origin);

        // Protocol validation
        if (!this.config.allowedProtocols.includes(url.protocol)) {
          this.logViolation(
            origin,
            `Invalid protocol: ${url.protocol}`,
            userAgent
          );
          return { valid: false, reason: "Protocol not allowed" };
        }

        // Port validation (if specified)
        if (url.port && !this.config.allowedPorts.includes(parseInt(url.port))) {
          this.logViolation(origin, `Invalid port: ${url.port}`, userAgent);
          return { valid: false, reason: "Port not allowed" };
        }

        // Exact origin match
        if (this.config.allowedOrigins.includes(origin)) {
          return { valid: true, normalizedOrigin: origin };
        }

        // Wildcard subdomain matching for production domains
        if (this.config.strictMode) {
          this.logViolation(origin, "Origin not in strict allowlist", userAgent);
          return { valid: false, reason: "Origin not allowed" };
        }

        // Check for wildcard patterns (e.g., *.autoreachpro.com)
        const wildcardMatch = this.config.allowedOrigins.find((allowed) => {
          if (allowed.startsWith("*.")) {
            const domain = allowed.substring(2);
            return url.hostname.endsWith(domain);
          }
          return false;
        });

        if (wildcardMatch) {
          return { valid: true, normalizedOrigin: origin };
        }

        this.logViolation(origin, "Origin not in allowlist", userAgent);
        return { valid: false, reason: "Origin not allowed" };
    } catch (error) {
        this.logViolation(origin, `URL parsing error: ${error}`, userAgent);
        return { valid: false, reason: "Invalid URL format" };
    }
  }

  // Validate origin from request headers
  validateRequestOrigin(request: NextRequest): {
    valid: boolean;
    reason?: string;
    origin?: string;
  } {
    const origin = request.headers.get("origin");
    const userAgent = request.headers.get("user-agent") || undefined;

    if (!origin) {
        return { valid: false, reason: "Missing origin header" };
    }

    const validation = this.validateOrigin(origin, userAgent);
    return {
        valid: validation.valid,
        reason: validation.reason,
        origin: validation.normalizedOrigin,
    };
  }

  // Log origin violations
  private logViolation(
    origin: string,
    reason: string,
    userAgent?: string
  ): void {
    if (!this.config.logViolations) return;

    this.violationLog.push({
        origin,
        timestamp: new Date(),
        reason,
        userAgent,
    });

    // Keep only last 1000 violations to prevent memory leaks
    if (this.violationLog.length > 1000) {
        this.violationLog = this.violationLog.slice(-1000);
    }

    console.warn(`🚨 Origin violation: ${origin} - ${reason}`, {
        userAgent: userAgent?.substring(0, 100), // Truncate for privacy
        timestamp: new Date().toISOString(),
    });
  }

  // Get violation statistics
  getViolationStats(): {
    totalViolations: number;
    recentViolations: number;
    topOrigins: Array<{ origin: string; count: number }>;
    topReasons: Array<{ reason: string; count: number }>;
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentViolations = this.violationLog.filter(
        (v) => v.timestamp > oneHourAgo
    ).length;

    // Count violations by origin
    const originCounts = new Map<string, number>();
    this.violationLog.forEach((v) => {
        originCounts.set(v.origin, (originCounts.get(v.origin) || 0) + 1);
    });

    const topOrigins = Array.from(originCounts.entries())
        .map(([origin, count]) => ({ origin, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    // Count violations by reason
    const reasonCounts = new Map<string, number>();
    this.violationLog.forEach((v) => {
        reasonCounts.set(v.reason, (reasonCounts.get(v.reason) || 0) + 1);
    });

    const topReasons = Array.from(reasonCounts.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    return {
        totalViolations: this.violationLog.length,
        recentViolations,
        topOrigins,
        topReasons,
    };
  }

  // Update configuration
  updateConfig(newConfig: Partial<OriginConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log("🔒 Origin validation configuration updated");
  }

  // Get current configuration
  getConfig(): OriginConfig {
    return { ...this.config };
  }

  // Clear violation log
  clearViolationLog(): void {
    this.violationLog = [];
    console.log("🧹 Origin violation log cleared");
  }
}

// Global origin validator instance
export const originValidator = new OriginValidator();

// Middleware function for origin validation
export function withOriginValidation(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    strict?: boolean;
    customValidator?: OriginValidator;
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const validator = options.customValidator || originValidator;

    const validation = validator.validateRequestOrigin(request);

    if (!validation.valid) {
        console.warn(`🚨 Origin validation failed: ${validation.reason}`, {
          origin: request.headers.get("origin"),
          userAgent: request.headers.get("user-agent")?.substring(0, 100),
          ip:
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip"),
          timestamp: new Date().toISOString(),
        });

        return NextResponse.json(
          {
            success: false,
            error: "Origin validation failed",
            details: options.strict ? validation.reason : "Access denied",
          },
          {
            status: 403,
            headers: {
              "X-Origin-Validation": "failed",
              "X-Origin-Reason": validation.reason || "unknown",
            },
          }
        );
    }

    // Add validated origin to response headers for debugging
    const response = await handler(request);
    response.headers.set("X-Origin-Validation", "passed");
    response.headers.set("X-Origin-Validated", validation.origin || "unknown");

    return response;
  };
}

// Utility function for manual origin validation
export function validateOrigin(origin: string): boolean {
  return originValidator.validateOrigin(origin).valid;
}

// API endpoint for origin validation management
export async function handleOriginValidationAPI(
  request: NextRequest,
  action: string
): Promise<NextResponse> {
  try {
    switch (action) {
        case "stats":
          return NextResponse.json({
            success: true,
            stats: originValidator.getViolationStats(),
            config: originValidator.getConfig(),
          });

        case "config":
          if (request.method === "PUT") {
            const newConfig = await request.json();
            originValidator.updateConfig(newConfig);
            return NextResponse.json({
              success: true,
              config: originValidator.getConfig(),
              message: "Configuration updated successfully",
            });
          }
          return NextResponse.json({
            success: true,
            config: originValidator.getConfig(),
          });

        case "clear-log":
          originValidator.clearViolationLog();
          return NextResponse.json({
            success: true,
            message: "Violation log cleared successfully",
          });

        default:
          return NextResponse.json(
            { success: false, error: "Invalid action" },
            { status: 400 }
          );
    }
  } catch (error) {
    console.error("Origin validation API error:", error);
    return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
    );
  }
}
