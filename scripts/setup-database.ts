#!/usr/bin/env tsx

/**
 * Enhanced Database Setup Script
 * Verifies environment variables, tests connections, runs migrations, and seeds data
 */

import { execSync } from "child_process";
import {
  validateEnvironment,
  logEnvironmentValidation,
} from "../src/lib/env-validator";
import {
  validateAllConnections,
  logConnectionReport,
} from "../src/lib/db-connection-validator";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🚀 Starting Enhanced Database Setup...\n");

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

    // Step 2: Test database connections
    console.log("🔌 Step 2: Testing Database Connections");
    console.log("=".repeat(50));
    const connectionReport = await validateAllConnections();

    if (!connectionReport.overall.success) {
      console.error(
        "❌ Database connection test failed. Please check the errors above."
      );
      process.exit(1);
    }
    console.log("✅ All database connections are healthy\n");

    // Step 3: Generate Prisma client
    console.log("⚙️ Step 3: Generating Prisma Client");
    console.log("=".repeat(50));
    try {
      execSync("npx prisma generate --schema=./prisma/schema.prisma", {
        stdio: "inherit",
        cwd: process.cwd(),
      });
      console.log("✅ Prisma client generated successfully\n");
    } catch (error) {
      console.error("❌ Failed to generate Prisma client:", error);
      process.exit(1);
    }

    // Step 4: Run database migrations
    console.log("🔄 Step 4: Running Database Migrations");
    console.log("=".repeat(50));
    try {
      execSync("npx prisma db push --schema=./prisma/schema.prisma", {
        stdio: "inherit",
        cwd: process.cwd(),
      });
      console.log("✅ Database migrations completed successfully\n");
    } catch (error) {
      console.error("❌ Database migration failed:", error);
      process.exit(1);
    }

    // Step 5: Verify database schema
    console.log("🔍 Step 5: Verifying Database Schema");
    console.log("=".repeat(50));
    try {
      // Test a simple query to verify schema
      const userCount = await prisma.user.count();
      console.log(`✅ Database schema verified - Found ${userCount} users\n`);
    } catch (error) {
      console.error("❌ Database schema verification failed:", error);
      process.exit(1);
    }

    // Step 6: Seed initial data
    console.log("🌱 Step 6: Seeding Initial Data");
    console.log("=".repeat(50));
    try {
      execSync("npm run db:seed", {
        stdio: "inherit",
        cwd: process.cwd(),
      });
      console.log("✅ Initial data seeded successfully\n");
    } catch (error) {
      console.error("❌ Data seeding failed:", error);
      process.exit(1);
    }

    // Step 7: Final verification
    console.log("✅ Step 7: Final Verification");
    console.log("=".repeat(50));
    const finalReport = await validateAllConnections();
    logConnectionReport(finalReport);

    if (finalReport.overall.success) {
      console.log("🎉 Database setup completed successfully!");
      console.log("📊 Setup Summary:");
      console.log(`   - Environment: ✅ Validated`);
      console.log(
        `   - Connections: ✅ ${finalReport.overall.successfulConnections}/${finalReport.overall.totalConnections} healthy`
      );
      console.log(`   - Schema: ✅ Migrated`);
      console.log(`   - Data: ✅ Seeded`);
      console.log("\n🚀 Your database is ready to use!");
      process.exit(0);
    } else {
      console.log(
        "💥 Final verification failed. Please check the errors above."
      );
      process.exit(1);
    }
  } catch (error: any) {
    console.error("💥 Database setup failed:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  } finally {
    // Disconnect Prisma client
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.warn("Warning: Failed to disconnect Prisma client:", error);
    }
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
