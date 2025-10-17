/**
 * Database Connection Validator
 * Tests all database connections and returns comprehensive status
 */

import { checkPrismaConnection } from "./prisma";
import {
  checkSupabaseConnection,
  checkSupabaseAdminConnection,
  testSupabaseAuth,
} from "./supabase-client";
import {
  checkSupabaseAuthConnection,
  testSupabaseAdminAuth,
} from "./supabase-auth";

export interface ConnectionStatus {
  name: string;
  success: boolean;
  error?: string;
  latency?: number;
  details?: string;
}

export interface DatabaseConnectionReport {
  overall: {
    success: boolean;
    totalConnections: number;
    successfulConnections: number;
    failedConnections: number;
  };
  connections: ConnectionStatus[];
  environment: {
    validated: boolean;
    warnings: string[];
  };
  timestamp: string;
}

/**
 * Validates all database connections
 */
export async function validateAllConnections(): Promise<DatabaseConnectionReport> {
  const connections: ConnectionStatus[] = [];
  const timestamp = new Date().toISOString();

  // Test Prisma connection
  console.log("Testing Prisma connection...");
  const prismaResult = await checkPrismaConnection();
  connections.push({
    name: "Prisma Client",
    success: prismaResult.success,
    error: prismaResult.error,
    latency: prismaResult.latency,
    details: "Main database connection via Prisma ORM",
  });

  // Test Supabase client connection
  console.log("Testing Supabase client connection...");
  const supabaseResult = await checkSupabaseConnection();
  connections.push({
    name: "Supabase Client",
    success: supabaseResult.success,
    error: supabaseResult.error,
    latency: supabaseResult.latency,
    details: "Client-side Supabase connection",
  });

  // Test Supabase admin connection
  console.log("Testing Supabase admin connection...");
  const supabaseAdminResult = await checkSupabaseAdminConnection();
  connections.push({
    name: "Supabase Admin",
    success: supabaseAdminResult.success,
    error: supabaseAdminResult.error,
    latency: supabaseAdminResult.latency,
    details: "Server-side Supabase admin connection",
  });

  // Test Supabase auth connection
  console.log("Testing Supabase auth connection...");
  const supabaseAuthResult = await checkSupabaseAuthConnection();
  connections.push({
    name: "Supabase Auth",
    success: supabaseAuthResult.success,
    error: supabaseAuthResult.error,
    latency: supabaseAuthResult.latency,
    details: "Supabase authentication service",
  });

  // Test Supabase auth functionality
  console.log("Testing Supabase auth functionality...");
  const supabaseAuthTest = await testSupabaseAuth();
  connections.push({
    name: "Supabase Auth Test",
    success: supabaseAuthTest.success,
    error: supabaseAuthTest.error,
    details: "Authentication flow test",
  });

  // Test Supabase admin auth functionality
  console.log("Testing Supabase admin auth functionality...");
  const supabaseAdminAuthTest = await testSupabaseAdminAuth();
  connections.push({
    name: "Supabase Admin Auth Test",
    success: supabaseAdminAuthTest.success,
    error: supabaseAdminAuthTest.error,
    details: "Admin authentication flow test",
  });

  // Calculate overall status
  const successfulConnections = connections.filter((c) => c.success).length;
  const failedConnections = connections.filter((c) => !c.success).length;
  const totalConnections = connections.length;
  const overallSuccess = failedConnections === 0;

  // Get environment validation status
  let envValidation;
  try {
    const { validateEnvironment } = await import("./env-validator");
    envValidation = validateEnvironment();
  } catch (error) {
    envValidation = {
      isValid: false,
      warnings: ["Environment validation failed"],
    };
  }

  return {
    overall: {
      success: overallSuccess,
      totalConnections,
      successfulConnections,
      failedConnections,
    },
    connections,
    environment: {
      validated: envValidation.isValid,
      warnings: envValidation.warnings,
    },
    timestamp,
  };
}

/**
 * Quick connection check for health endpoints
 */
export async function quickConnectionCheck(): Promise<{
  success: boolean;
  details: string;
}> {
  try {
    // Test the most critical connections
    const [prismaResult, supabaseResult] = await Promise.all([
      checkPrismaConnection(),
      checkSupabaseConnection(),
    ]);

    const criticalConnections = [prismaResult, supabaseResult];
    const allSuccess = criticalConnections.every((result) => result.success);

    if (allSuccess) {
      return {
        success: true,
        details: "All critical database connections are healthy",
      };
    } else {
      const failures = criticalConnections
        .filter((result) => !result.success)
        .map((result) => result.error)
        .join(", ");

      return {
        success: false,
        details: `Critical connection failures: ${failures}`,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      details: `Connection check failed: ${error.message}`,
    };
  }
}

/**
 * Test specific connection by name
 */
export async function testConnection(
  connectionName: string
): Promise<ConnectionStatus> {
  switch (connectionName.toLowerCase()) {
    case "prisma":
      const prismaResult = await checkPrismaConnection();
      return {
        name: "Prisma Client",
        success: prismaResult.success,
        error: prismaResult.error,
        latency: prismaResult.latency,
        details: "Main database connection via Prisma ORM",
      };

    case "supabase":
      const supabaseResult = await checkSupabaseConnection();
      return {
        name: "Supabase Client",
        success: supabaseResult.success,
        error: supabaseResult.error,
        latency: supabaseResult.latency,
        details: "Client-side Supabase connection",
      };

    case "supabase-admin":
      const supabaseAdminResult = await checkSupabaseAdminConnection();
      return {
        name: "Supabase Admin",
        success: supabaseAdminResult.success,
        error: supabaseAdminResult.error,
        latency: supabaseAdminResult.latency,
        details: "Server-side Supabase admin connection",
      };

    case "supabase-auth":
      const supabaseAuthResult = await checkSupabaseAuthConnection();
      return {
        name: "Supabase Auth",
        success: supabaseAuthResult.success,
        error: supabaseAuthResult.error,
        latency: supabaseAuthResult.latency,
        details: "Supabase authentication service",
      };

    default:
      return {
        name: connectionName,
        success: false,
        error: `Unknown connection type: ${connectionName}`,
        details: "Connection type not recognized",
      };
  }
}

/**
 * Log connection report to console
 */
export function logConnectionReport(report: DatabaseConnectionReport): void {
  console.log("\n" + "=".repeat(60));
  console.log("DATABASE CONNECTION REPORT");
  console.log("=".repeat(60));
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(
    `Overall Status: ${report.overall.success ? "✅ HEALTHY" : "❌ UNHEALTHY"}`
  );
  console.log(
    `Connections: ${report.overall.successfulConnections}/${report.overall.totalConnections} successful`
  );

  if (report.overall.failedConnections > 0) {
    console.log("\n❌ FAILED CONNECTIONS:");
    report.connections
      .filter((c) => !c.success)
      .forEach((c) => {
        console.log(`  - ${c.name}: ${c.error}`);
      });
  }

  console.log("\n📊 CONNECTION DETAILS:");
  report.connections.forEach((c) => {
    const status = c.success ? "✅" : "❌";
    const latency = c.latency ? ` (${c.latency}ms)` : "";
    console.log(`  ${status} ${c.name}${latency}`);
    if (c.details) {
      console.log(`    ${c.details}`);
    }
  });

  if (report.environment.warnings.length > 0) {
    console.log("\n⚠️ ENVIRONMENT WARNINGS:");
    report.environment.warnings.forEach((warning) => {
      console.log(`  - ${warning}`);
    });
  }

  console.log("=".repeat(60) + "\n");
}
