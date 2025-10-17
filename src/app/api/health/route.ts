import { NextRequest, NextResponse } from "next/server";
import {
  validateAllConnections,
  quickConnectionCheck,
} from "@/lib/db-connection-validator";
import { validateEnvironment } from "@/lib/env-validator";

/**
 * System Health Check API
 * GET /api/health
 *
 * Returns comprehensive system health status including:
 * - Database connections
 * - Environment variables
 * - System status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quick = searchParams.get("quick") === "true";

    const startTime = Date.now();

    // Environment validation
    const envValidation = validateEnvironment();

    // Database connections
    let dbReport;
    if (quick) {
      const dbResult = await quickConnectionCheck();
      dbReport = {
        success: dbResult.success,
        message: dbResult.details,
      };
    } else {
      dbReport = await validateAllConnections();
    }

    const responseTime = Date.now() - startTime;

    // Overall system health
    const systemHealthy = envValidation.isValid && dbReport.success;

    const healthReport = {
      success: systemHealthy,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      environment: {
        validated: envValidation.isValid,
        errors: envValidation.errors,
        warnings: envValidation.warnings,
      },
      database: dbReport,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
      },
    };

    // Return appropriate status code
    const statusCode = systemHealthy ? 200 : 503;

    return NextResponse.json(healthReport, { status: statusCode });
  } catch (error: any) {
    console.error("System health check failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "System health check failed",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
