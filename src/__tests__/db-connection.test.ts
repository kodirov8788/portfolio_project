/**
 * Database Connection Tests
 * Tests all database connections and validates functionality
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import {
  validateAllConnections,
  testConnection,
  quickConnectionCheck,
} from "../lib/db-connection-validator";
import { validateEnvironment } from "../lib/env-validator";
import { checkPrismaConnection } from "../lib/prisma";
import {
  checkSupabaseConnection,
  checkSupabaseAdminConnection,
  testSupabaseAuth,
} from "../lib/supabase-client";
import {
  checkSupabaseAuthConnection,
  testSupabaseAdminAuth,
} from "../lib/supabase-auth";

describe("Database Connection Tests", () => {
  beforeAll(async () => {
    // Validate environment before running tests
    const envValidation = validateEnvironment();
    if (!envValidation.isValid) {
      throw new Error(
        `Environment validation failed: ${envValidation.errors.join(", ")}`
      );
    }
  });

  describe("Environment Validation", () => {
    it("should validate all required environment variables", () => {
      const result = validateEnvironment();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should have valid Supabase configuration", () => {
      const result = validateEnvironment();
      expect(result.config?.supabase.url).toBeDefined();
      expect(result.config?.supabase.anonKey).toBeDefined();
      expect(result.config?.supabase.serviceRoleKey).toBeDefined();
      expect(result.config?.supabase.jwtSecret).toBeDefined();
    });

    it("should have valid PostgreSQL configuration", () => {
      const result = validateEnvironment();
      expect(result.config?.postgres.url).toBeDefined();
      expect(result.config?.postgres.prismaUrl).toBeDefined();
      expect(result.config?.postgres.directUrl).toBeDefined();
    });
  });

  describe("Individual Connection Tests", () => {
    it("should connect to Prisma database", async () => {
      const result = await checkPrismaConnection();
      expect(result.success).toBe(true);
      expect(result.latency).toBeDefined();
      expect(result.latency).toBeLessThan(5000); // Should be under 5 seconds
    });

    it("should connect to Supabase client", async () => {
      const result = await checkSupabaseConnection();
      expect(result.success).toBe(true);
      expect(result.latency).toBeDefined();
      expect(result.latency).toBeLessThan(5000);
    });

    it("should connect to Supabase admin", async () => {
      const result = await checkSupabaseAdminConnection();
      expect(result.success).toBe(true);
      expect(result.latency).toBeDefined();
      expect(result.latency).toBeLessThan(5000);
    });

    it("should connect to Supabase auth", async () => {
      const result = await checkSupabaseAuthConnection();
      expect(result.success).toBe(true);
      expect(result.latency).toBeDefined();
      expect(result.latency).toBeLessThan(5000);
    });

    it("should test Supabase auth functionality", async () => {
      const result = await testSupabaseAuth();
      expect(result.success).toBe(true);
    });

    it("should test Supabase admin auth functionality", async () => {
      const result = await testSupabaseAdminAuth();
      expect(result.success).toBe(true);
    });
  });

  describe("Connection Validator Tests", () => {
    it("should validate all connections", async () => {
      const report = await validateAllConnections();
      expect(report.overall.success).toBe(true);
      expect(report.overall.failedConnections).toBe(0);
      expect(report.connections.length).toBeGreaterThan(0);
    });

    it("should test specific connections", async () => {
      const prismaResult = await testConnection("prisma");
      expect(prismaResult.success).toBe(true);
      expect(prismaResult.name).toBe("Prisma Client");

      const supabaseResult = await testConnection("supabase");
      expect(supabaseResult.success).toBe(true);
      expect(supabaseResult.name).toBe("Supabase Client");
    });

    it("should handle unknown connection types", async () => {
      const result = await testConnection("unknown");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Unknown connection type");
    });

    it("should perform quick connection check", async () => {
      const result = await quickConnectionCheck();
      expect(result.success).toBe(true);
      expect(result.details).toBeDefined();
    });
  });

  describe("Connection Performance Tests", () => {
    it("should have reasonable connection latency", async () => {
      const report = await validateAllConnections();

      report.connections.forEach((connection) => {
        if (connection.latency) {
          expect(connection.latency).toBeLessThan(10000); // Under 10 seconds
        }
      });
    });

    it("should handle concurrent connection tests", async () => {
      const promises = [
        checkPrismaConnection(),
        checkSupabaseConnection(),
        checkSupabaseAdminConnection(),
        checkSupabaseAuthConnection(),
      ];

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe("Error Handling Tests", () => {
    it("should handle connection timeouts gracefully", async () => {
      // This test would require mocking network failures
      // For now, we'll just ensure the error handling structure exists
      const result = await checkPrismaConnection();
      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("error");
    });
  });
});
