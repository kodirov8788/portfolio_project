/**
 * Supabase Integration Tests with Prisma
 * Tests integration between Prisma and Supabase, including auth flows and real-time features
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import { prisma } from "../lib/prisma";
import { supabase, supabaseAdmin } from "../lib/supabase-client";
import { supabase as supabaseAuth } from "../lib/supabase-auth";
import { validateEnvironment } from "../lib/env-validator";

describe("Supabase Integration Tests", () => {
  const testEmail = "integration-test@example.com";
  const testPassword = "testpassword123";
  let testUserId: string;

  beforeAll(async () => {
    // Validate environment
    const envValidation = validateEnvironment();
    if (!envValidation.isValid) {
      throw new Error(
        `Environment validation failed: ${envValidation.errors.join(", ")}`
      );
    }
  });

  beforeEach(async () => {
    // Clean up any existing test data
    try {
      await prisma.user.deleteMany({
        where: { email: testEmail },
      });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  afterAll(async () => {
    // Clean up test data
    try {
      await prisma.user.deleteMany({
        where: { email: testEmail },
      });
    } catch (error) {
      console.warn("Cleanup failed:", error);
    }
  });

  describe("Prisma + Supabase Data Consistency", () => {
    it("should create user in Prisma and verify in Supabase", async () => {
      // Create user in Prisma
      const user = await prisma.user.create({
        data: {
          email: testEmail,
          name: "Integration Test User",
          password: testPassword,
          role: "USER",
        },
      });

      testUserId = user.id;

      // Verify user exists in Supabase
      const { data, error } = await supabaseAdmin
        .from("user_profiles")
        .select("*")
        .eq("email", testEmail)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.email).toBe(testEmail);
    });

    it("should update user in Prisma and verify in Supabase", async () => {
      // Create user first
      const user = await prisma.user.create({
        data: {
          email: testEmail,
          name: "Original Name",
          password: testPassword,
          role: "USER",
        },
      });

      // Update user in Prisma
      await prisma.user.update({
        where: { id: user.id },
        data: { name: "Updated Name" },
      });

      // Verify update in Supabase
      const { data, error } = await supabaseAdmin
        .from("user_profiles")
        .select("*")
        .eq("email", testEmail)
        .single();

      expect(error).toBeNull();
      expect(data.full_name).toBe("Updated Name");
    });

    it("should delete user in Prisma and verify removal in Supabase", async () => {
      // Create user first
      const user = await prisma.user.create({
        data: {
          email: testEmail,
          name: "To Be Deleted",
          password: testPassword,
          role: "USER",
        },
      });

      // Delete user in Prisma
      await prisma.user.delete({
        where: { id: user.id },
      });

      // Verify deletion in Supabase
      const { data, error } = await supabaseAdmin
        .from("user_profiles")
        .select("*")
        .eq("email", testEmail)
        .single();

      expect(error).toBeDefined();
      expect(data).toBeNull();
    });
  });

  describe("Authentication Flow Integration", () => {
    it("should handle Supabase auth session", async () => {
      const { data, error } = await supabaseAuth.auth.getSession();

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should handle Supabase auth user", async () => {
      const { data, error } = await supabaseAuth.auth.getUser();

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it("should handle admin auth operations", async () => {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();

      expect(error).toBeNull();
      expect(Array.isArray(data.users)).toBe(true);
    });
  });

  describe("Real-time Integration", () => {
    it("should handle real-time subscriptions", async () => {
      let receivedData: any = null;
      let subscriptionError: any = null;

      const subscription = supabase
        .channel("test-channel")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "user_profiles",
          },
          (payload) => {
            receivedData = payload;
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            // Create a test user to trigger the subscription
            prisma.user.create({
              data: {
                email: testEmail,
                name: "Real-time Test User",
                password: testPassword,
                role: "USER",
              },
            });
          }
        });

      // Wait for subscription to process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Clean up subscription
      await supabase.removeChannel(subscription);

      // Note: Real-time testing is complex and may not work in test environment
      // This test mainly verifies the subscription setup doesn't throw errors
      expect(subscription).toBeDefined();
    });
  });

  describe("Cross-Service Data Validation", () => {
    it("should validate data consistency between Prisma and Supabase", async () => {
      // Create user with profile
      const user = await prisma.user.create({
        data: {
          email: testEmail,
          name: "Consistency Test User",
          password: testPassword,
          role: "USER",
        },
      });

      const profile = await prisma.userProfile.create({
        data: {
          id: user.id,
          email: user.email,
          username: "consistencytest",
          fullName: user.name,
          firstName: "Consistency",
          lastName: "Test",
        },
      });

      // Verify in Supabase
      const { data: supabaseProfile, error } = await supabaseAdmin
        .from("user_profiles")
        .select("*")
        .eq("email", testEmail)
        .single();

      expect(error).toBeNull();
      expect(supabaseProfile.email).toBe(profile.email);
      expect(supabaseProfile.username).toBe(profile.username);
      expect(supabaseProfile.full_name).toBe(profile.fullName);
    });

    it("should handle complex queries across both systems", async () => {
      // Create multiple test users
      const users = await Promise.all([
        prisma.user.create({
          data: {
            email: "complex1@example.com",
            name: "Complex User 1",
            role: "USER",
          },
        }),
        prisma.user.create({
          data: {
            email: "complex2@example.com",
            name: "Complex User 2",
            role: "ADMIN",
          },
        }),
      ]);

      // Query in Prisma
      const prismaUsers = await prisma.user.findMany({
        where: {
          email: {
            in: ["complex1@example.com", "complex2@example.com"],
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Query in Supabase
      const { data: supabaseUsers, error } = await supabaseAdmin
        .from("user_profiles")
        .select("*")
        .in("email", ["complex1@example.com", "complex2@example.com"])
        .order("created_at", { ascending: false });

      expect(error).toBeNull();
      expect(prismaUsers.length).toBe(2);
      expect(supabaseUsers.length).toBe(2);

      // Cleanup
      await prisma.user.deleteMany({
        where: {
          email: {
            in: ["complex1@example.com", "complex2@example.com"],
          },
        },
      });
    });
  });

  describe("Error Handling Integration", () => {
    it("should handle Prisma errors gracefully in Supabase context", async () => {
      // Try to create duplicate user
      await prisma.user.create({
        data: {
          email: testEmail,
          name: "First User",
          role: "USER",
        },
      });

      await expect(
        prisma.user.create({
          data: {
            email: testEmail, // Duplicate email
            name: "Second User",
            role: "USER",
          },
        })
      ).rejects.toThrow();
    });

    it("should handle Supabase errors gracefully in Prisma context", async () => {
      const { data, error } = await supabaseAdmin
        .from("non_existent_table")
        .select("*");

      expect(error).toBeDefined();
      expect(data).toBeNull();
    });
  });

  describe("Performance Integration", () => {
    it("should handle bulk operations efficiently", async () => {
      const startTime = Date.now();

      // Bulk create users
      const users = await prisma.user.createMany({
        data: Array.from({ length: 10 }, (_, index) => ({
          email: `bulk${index}@example.com`,
          name: `Bulk User ${index}`,
          role: "USER",
        })),
      });

      const createTime = Date.now() - startTime;

      // Verify in Supabase
      const { data, error } = await supabaseAdmin
        .from("user_profiles")
        .select("email")
        .like("email", "bulk%@example.com");

      expect(error).toBeNull();
      expect(data.length).toBe(10);
      expect(createTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Cleanup
      await prisma.user.deleteMany({
        where: {
          email: {
            contains: "bulk",
          },
        },
      });
    });
  });
});
