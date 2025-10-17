import { NextRequest, NextResponse } from "next/server";
import {
  validateAllConnections,
  quickConnectionCheck,
  testConnection,
} from "@/lib/db-connection-validator";
import { validateEnvironment } from "@/lib/env-validator";

/**
 * Database Health Check API
 * GET /api/health/database
 *
 * Returns comprehensive database connection status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quick = searchParams.get("quick") === "true";
    const connection = searchParams.get("connection");

    // If specific connection requested
    if (connection) {
      const result = await testConnection(connection);
      return NextResponse.json({
        success: result.success,
        connection: result,
        timestamp: new Date().toISOString(),
      });
    }

    // Quick check for basic health
    if (quick) {
      const result = await quickConnectionCheck();
      return NextResponse.json({
        success: result.success,
        message: result.details,
        timestamp: new Date().toISOString(),
      });
    }

    // Full connection report
    const report = await validateAllConnections();

    return NextResponse.json({
      success: report.overall.success,
      report,
    });
  } catch (error: any) {
    console.error("Database health check failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Health check failed",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
