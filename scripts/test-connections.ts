#!/usr/bin/env tsx

/**
 * Database Connection Test Script
 * Tests all database connections and displays detailed status
 */

import {
  validateAllConnections,
  logConnectionReport,
} from "../src/lib/db-connection-validator";
import {
  validateEnvironment,
  logEnvironmentValidation,
} from "../src/lib/env-validator";

async function main() {
  console.log("🔍 Starting Database Connection Tests...\n");

  try {
    // Step 1: Validate environment variables
    console.log("📋 Step 1: Validating Environment Variables");
    console.log("=".repeat(50));
    logEnvironmentValidation();

    const envValidation = validateEnvironment();
    if (!envValidation.isValid) {
      console.error(
        "❌ Environment validation failed. Please fix the errors above."
      );
      process.exit(1);
    }
    console.log("✅ Environment validation passed\n");

    // Step 2: Test all database connections
    console.log("🔌 Step 2: Testing Database Connections");
    console.log("=".repeat(50));
    const report = await validateAllConnections();

    // Step 3: Display results
    console.log("📊 Step 3: Connection Test Results");
    console.log("=".repeat(50));
    logConnectionReport(report);

    // Step 4: Determine exit status
    if (report.overall.success) {
      console.log("🎉 All database connections are healthy!");
      process.exit(0);
    } else {
      console.log(
        "💥 Some database connections failed. Please check the errors above."
      );
      process.exit(1);
    }
  } catch (error: any) {
    console.error("💥 Connection test failed:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// Run the main function
main();
