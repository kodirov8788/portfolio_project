/**
 * Database CRUD Operation Tests
 * Tests Create, Read, Update, Delete operations across all database connections
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
import { validateEnvironment } from "../lib/env-validator";

// Test data
const testUser = {
  email: "test@example.com",
  name: "Test User",
  password: "testpassword123",
};

const testUserProfile = {
  email: "test-profile@example.com",
  username: "testuser",
  fullName: "Test Profile User",
  firstName: "Test",
  lastName: "Profile",
};

describe("Database CRUD Operations", () => {
  let createdUserId: string;
  let createdProfileId: string;

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
        where: {
          email: {
            in: [testUser.email, testUserProfile.email],
          },
        },
      });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  afterAll(async () => {
    // Clean up test data
    try {
      await prisma.user.deleteMany({
        where: {
          email: {
            in: [testUser.email, testUserProfile.email],
          },
        },
      });
    } catch (error) {
      console.warn("Cleanup failed:", error);
    }
  });

  describe("Prisma CRUD Operations", () => {
    describe("CREATE Operations", () => {
      it("should create a new user", async () => {
        const user = await prisma.user.create({
          data: {
            email: testUser.email,
            name: testUser.name,
            password: testUser.password,
            role: "USER",
          },
        });

        expect(user).toBeDefined();
        expect(user.email).toBe(testUser.email);
        expect(user.name).toBe(testUser.name);
        expect(user.role).toBe("USER");

        createdUserId = user.id;
      });

      it("should create a user profile", async () => {
        // First create a user
        const user = await prisma.user.create({
          data: {
            email: testUserProfile.email,
            name: testUserProfile.fullName,
            role: "USER",
          },
        });

        // Then create a profile
        const profile = await prisma.userProfile.create({
          data: {
            id: user.id,
            email: testUserProfile.email,
            username: testUserProfile.username,
            fullName: testUserProfile.fullName,
            firstName: testUserProfile.firstName,
            lastName: testUserProfile.lastName,
          },
        });

        expect(profile).toBeDefined();
        expect(profile.email).toBe(testUserProfile.email);
        expect(profile.username).toBe(testUserProfile.username);

        createdProfileId = profile.id;
      });
    });

    describe("READ Operations", () => {
      beforeEach(async () => {
        // Create test user for read operations
        const user = await prisma.user.create({
          data: {
            email: testUser.email,
            name: testUser.name,
            password: testUser.password,
            role: "USER",
          },
        });
        createdUserId = user.id;
      });

      it("should read user by ID", async () => {
        const user = await prisma.user.findUnique({
          where: { id: createdUserId },
        });

        expect(user).toBeDefined();
        expect(user?.email).toBe(testUser.email);
        expect(user?.name).toBe(testUser.name);
      });

      it("should read user by email", async () => {
        const user = await prisma.user.findUnique({
          where: { email: testUser.email },
        });

        expect(user).toBeDefined();
        expect(user?.id).toBe(createdUserId);
      });

      it("should read multiple users", async () => {
        const users = await prisma.user.findMany({
          where: {
            role: "USER",
          },
          take: 10,
        });

        expect(Array.isArray(users)).toBe(true);
        expect(users.length).toBeGreaterThan(0);
      });

      it("should perform complex queries", async () => {
        const users = await prisma.user.findMany({
          where: {
            AND: [{ role: "USER" }, { email: { contains: "@" } }],
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        expect(Array.isArray(users)).toBe(true);
      });
    });

    describe("UPDATE Operations", () => {
      beforeEach(async () => {
        const user = await prisma.user.create({
          data: {
            email: testUser.email,
            name: testUser.name,
            password: testUser.password,
            role: "USER",
          },
        });
        createdUserId = user.id;
      });

      it("should update user data", async () => {
        const updatedUser = await prisma.user.update({
          where: { id: createdUserId },
          data: {
            name: "Updated Test User",
            role: "ADMIN",
          },
        });

        expect(updatedUser.name).toBe("Updated Test User");
        expect(updatedUser.role).toBe("ADMIN");
      });

      it("should update multiple records", async () => {
        const result = await prisma.user.updateMany({
          where: {
            email: testUser.email,
          },
          data: {
            role: "ADMIN",
          },
        });

        expect(result.count).toBeGreaterThan(0);
      });
    });

    describe("DELETE Operations", () => {
      beforeEach(async () => {
        const user = await prisma.user.create({
          data: {
            email: testUser.email,
            name: testUser.name,
            password: testUser.password,
            role: "USER",
          },
        });
        createdUserId = user.id;
      });

      it("should delete user by ID", async () => {
        const deletedUser = await prisma.user.delete({
          where: { id: createdUserId },
        });

        expect(deletedUser.id).toBe(createdUserId);

        // Verify deletion
        const user = await prisma.user.findUnique({
          where: { id: createdUserId },
        });
        expect(user).toBeNull();
      });

      it("should delete multiple records", async () => {
        // Create additional test users
        await prisma.user.createMany({
          data: [
            {
              email: "test1@example.com",
              name: "Test User 1",
              role: "USER",
            },
            {
              email: "test2@example.com",
              name: "Test User 2",
              role: "USER",
            },
          ],
        });

        const result = await prisma.user.deleteMany({
          where: {
            email: {
              in: ["test1@example.com", "test2@example.com"],
            },
          },
        });

        expect(result.count).toBe(2);
      });
    });

    describe("Transaction Operations", () => {
      it("should perform successful transaction", async () => {
        const result = await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              email: "transaction@example.com",
              name: "Transaction User",
              role: "USER",
            },
          });

          const profile = await tx.userProfile.create({
            data: {
              id: user.id,
              email: user.email,
              username: "transactionuser",
              fullName: user.name,
            },
          });

          return { user, profile };
        });

        expect(result.user).toBeDefined();
        expect(result.profile).toBeDefined();
        expect(result.user.id).toBe(result.profile.id);

        // Cleanup
        await prisma.user.delete({
          where: { id: result.user.id },
        });
      });

      it("should rollback failed transaction", async () => {
        await expect(
          prisma.$transaction(async (tx) => {
            await tx.user.create({
              data: {
                email: "rollback@example.com",
                name: "Rollback User",
                role: "USER",
              },
            });

            // This should cause the transaction to fail
            throw new Error("Intentional transaction failure");
          })
        ).rejects.toThrow("Intentional transaction failure");

        // Verify rollback - user should not exist
        const user = await prisma.user.findUnique({
          where: { email: "rollback@example.com" },
        });
        expect(user).toBeNull();
      });
    });
  });

  describe("Supabase CRUD Operations", () => {
    describe("Client Operations", () => {
      it("should perform Supabase client query", async () => {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .limit(5);

        expect(error).toBeNull();
        expect(Array.isArray(data)).toBe(true);
      });

      it("should handle Supabase client errors gracefully", async () => {
        const { data, error } = await supabase
          .from("non_existent_table")
          .select("*");

        expect(error).toBeDefined();
        expect(data).toBeNull();
      });
    });

    describe("Admin Operations", () => {
      it("should perform Supabase admin query", async () => {
        const { data, error } = await supabaseAdmin
          .from("user_profiles")
          .select("*")
          .limit(5);

        expect(error).toBeNull();
        expect(Array.isArray(data)).toBe(true);
      });

      it("should handle Supabase admin errors gracefully", async () => {
        const { data, error } = await supabaseAdmin
          .from("non_existent_table")
          .select("*");

        expect(error).toBeDefined();
        expect(data).toBeNull();
      });
    });
  });

  describe("Concurrent Operations", () => {
    it("should handle concurrent reads", async () => {
      const promises = Array.from({ length: 10 }, () =>
        prisma.user.findMany({
          take: 5,
        })
      );

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(Array.isArray(result)).toBe(true);
      });
    });

    it("should handle concurrent writes", async () => {
      const promises = Array.from({ length: 5 }, (_, index) =>
        prisma.user.create({
          data: {
            email: `concurrent${index}@example.com`,
            name: `Concurrent User ${index}`,
            role: "USER",
          },
        })
      );

      const results = await Promise.all(promises);

      results.forEach((result, index) => {
        expect(result.email).toBe(`concurrent${index}@example.com`);
      });

      // Cleanup
      await prisma.user.deleteMany({
        where: {
          email: {
            in: results.map((r) => r.email),
          },
        },
      });
    });
  });
});
