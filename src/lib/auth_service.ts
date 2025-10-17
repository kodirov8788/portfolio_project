/**
 * Authentication and Permission Caching Service
 * Handles RBAC permission resolution with Redis caching for performance
 */

import { prisma } from "./prisma";
// import { Redis } from "ioredis";

// Redis client configuration (disabled for now)
// const redis = new Redis({
//   host: process.env.REDIS_HOST || "localhost",
//   port: parseInt(process.env.REDIS_PORT || "6379"),
//   password: process.env.REDIS_PASSWORD,
//   db: parseInt(process.env.REDIS_DB || "0"),
//   retryDelayOnFailover: 100,
//   maxRetriesPerRequest: 3,
// });

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  grant_type: "GRANT" | "DENY";
  source: "role" | "direct";
}

export interface UserPermissions {
  userId: string;
  permissions: Permission[];
  roles: string[];
  cachedAt: Date;
  expiresAt: Date;
}

export interface ImpersonationSession {
  id: string;
  impersonatorId: string;
  targetUserId: string;
  mode: "view" | "act";
  sessionToken: string;
  reason: string;
  startedAt: Date;
  expiresAt: Date;
}

/**
 * Permission caching service with Redis backend
 */
export class AuthService {
  private static readonly CACHE_TTL = 60; // 60 seconds
  private static readonly CACHE_PREFIX = "user_permissions:";
  private static readonly IMPERSONATION_PREFIX = "impersonation:";

  /**
   * Get cached permissions for a user
   */
  static async getCachedPermissions(
    userId: string
  ): Promise<UserPermissions | null> {
    try {
        const cacheKey = `${this.CACHE_PREFIX}${userId}`;
        // const cached = await redis.get(cacheKey);
        const cached = null; // Redis disabled

        if (cached) {
          const parsed = JSON.parse(cached);
          return {
            ...parsed,
            cachedAt: new Date(parsed.cachedAt),
            expiresAt: new Date(parsed.expiresAt),
          };
        }

        return null;
    } catch (error) {
        console.error("Error getting cached permissions:", error);
        return null;
    }
  }

  /**
   * Cache permissions for a user
   */
  static async cachePermissions(
    userId: string,
    permissions: UserPermissions
  ): Promise<void> {
    try {
        const cacheKey = `${this.CACHE_PREFIX}${userId}`;
        const expiresAt = new Date(Date.now() + this.CACHE_TTL * 1000);

        const cacheData = {
          ...permissions,
          cachedAt: permissions.cachedAt.toISOString(),
          expiresAt: expiresAt.toISOString(),
        };

        // await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(cacheData));
        // Redis disabled
    } catch (error) {
        console.error("Error caching permissions:", error);
    }
  }

  /**
   * Invalidate user permissions cache
   */
  static async invalidateUserPermsCache(userId: string): Promise<void> {
    try {
        const cacheKey = `${this.CACHE_PREFIX}${userId}`;
        // await redis.del(cacheKey);
        // Redis disabled
    } catch (error) {
        console.error("Error invalidating permissions cache:", error);
    }
  }

  /**
   * Get effective permissions for a user (from DB or cache)
   */
  static async getUserPermissions(userId: string): Promise<UserPermissions> {
    // Try cache first
    const cached = await this.getCachedPermissions(userId);
    if (cached && cached.expiresAt > new Date()) {
        return cached;
    }

    // Fetch from database
    const permissions = await this.fetchUserPermissionsFromDB(userId);

    // Cache the result
    await this.cachePermissions(userId, permissions);

    return permissions;
  }

  /**
   * Fetch permissions directly from database
   */
  private static async fetchUserPermissionsFromDB(
    userId: string
  ): Promise<UserPermissions> {
    // Get user roles
    const userRoles = await prisma.userRoleAssignment.findMany({
        where: {
          userId,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
    });

    // Extract all permissions from user's roles
    const permissions: Permission[] = [];
    const roles: string[] = [];

    for (const userRole of userRoles) {
        roles.push(userRole.role.name);
        for (const rolePermission of userRole.role.rolePermissions) {
          const permission = rolePermission.permission;
          // Avoid duplicates
          if (!permissions.find((p) => p.id === permission.id)) {
            permissions.push({
              id: permission.id,
              name: permission.name,
              resource: permission.resource,
              action: permission.action,
              grant_type: "GRANT", // All role permissions are granted
              source: "role",
            });
          }
        }
    }

    return {
        userId,
        permissions,
        roles,
        cachedAt: new Date(),
        expiresAt: new Date(Date.now() + this.CACHE_TTL * 1000),
    };
  }

  /**
   * Check if user has specific permission
   */
  static async hasPermission(
    userId: string,
    permissionName: string
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);

    return userPermissions.permissions.some(
        (p) => p.name === permissionName && p.grant_type === "GRANT"
    );
  }

  /**
   * Check if user has any of the specified permissions
   */
  static async hasAnyPermission(
    userId: string,
    permissionNames: string[]
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);

    return permissionNames.some((permissionName) =>
        userPermissions.permissions.some(
          (p) => p.name === permissionName && p.grant_type === "GRANT"
        )
    );
  }

  /**
   * Check if user has all of the specified permissions
   */
  static async hasAllPermissions(
    userId: string,
    permissionNames: string[]
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);

    return permissionNames.every((permissionName) =>
        userPermissions.permissions.some(
          (p) => p.name === permissionName && p.grant_type === "GRANT"
        )
    );
  }

  /**
   * Check if user has permission with wildcard support
   */
  static async hasPermissionPattern(
    userId: string,
    pattern: string
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);

    // Convert wildcard pattern to regex
    const regexPattern = pattern.replace(/\*/g, ".*");
    const regex = new RegExp(`^${regexPattern}$`);

    return userPermissions.permissions.some(
        (p) => regex.test(p.name) && p.grant_type === "GRANT"
    );
  }

  /**
   * Assign role to user
   */
  static async assignRole(
    userId: string,
    roleName: string,
    assignedBy?: string,
    expiresAt?: Date
  ): Promise<boolean> {
    try {
        // Find the role by name
        const role = await prisma.role.findUnique({
          where: { name: roleName },
        });

        if (!role) {
          console.error(`Role ${roleName} not found`);
          return false;
        }

        // Check if user already has this role
        const existingAssignment = await prisma.userRoleAssignment.findFirst({
          where: {
            userId,
            roleId: role.id,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        });

        if (existingAssignment) {
          console.log(`User ${userId} already has role ${roleName}`);
          return true; // Already assigned
        }

        // Create new role assignment
        await prisma.userRoleAssignment.create({
          data: {
            userId,
            roleId: role.id,
            assignedBy: assignedBy || null,
            assignedAt: new Date(),
            expiresAt: expiresAt || null,
          },
        });

        // Invalidate cache
        await this.invalidateUserPermsCache(userId);

        return true;
    } catch (error) {
        console.error("Error assigning role:", error);
        return false;
    }
  }

  /**
   * Revoke role from user
   */
  static async revokeRole(userId: string, roleName: string): Promise<boolean> {
    try {
        await prisma.$executeRaw`
          SELECT revoke_role_from_user(${userId}, ${roleName})
        `;

        // Invalidate cache
        await this.invalidateUserPermsCache(userId);

        return true;
    } catch (error) {
        console.error("Error revoking role:", error);
        return false;
    }
  }

  /**
   * Grant direct permission to user
   */
  static async grantPermission(
    userId: string,
    permissionName: string,
    grantType: "GRANT" | "DENY" = "GRANT",
    grantedBy?: string,
    expiresAt?: Date,
    reason?: string
  ): Promise<boolean> {
    try {
        await prisma.$executeRaw`
          SELECT grant_user_permission(${userId}, ${permissionName}, ${grantType}, ${
          grantedBy || null
        }, ${expiresAt || null}, ${reason || null})
        `;

        // Invalidate cache
        await this.invalidateUserPermsCache(userId);

        return true;
    } catch (error) {
        console.error("Error granting permission:", error);
        return false;
    }
  }

  /**
   * Start impersonation session
   */
  static async startImpersonation(
    impersonatorId: string,
    targetUserId: string,
    mode: "view" | "act",
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ImpersonationSession | null> {
    try {
        console.log(
          `Starting impersonation: ${impersonatorId} -> ${targetUserId}, mode: ${mode}`
        );

        // Check if impersonator is admin (admin can impersonate without specific permissions)
        const impersonator = await prisma.user.findUnique({
          where: { id: impersonatorId },
          select: { role: true },
        });

        if (!impersonator || impersonator.role !== "ADMIN") {
          throw new Error("Only admin users can impersonate");
        }

        console.log(`Admin impersonation allowed for user: ${impersonatorId}`);

        // Generate session token
        const sessionToken = `imp_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Create impersonation session
        const session = await prisma.impersonationSession.create({
          data: {
            impersonatorId,
            targetUserId,
            mode,
            sessionToken,
            reason,
            ipAddress,
            userAgent,
            expiresAt,
          },
        });

        // Cache the session (optional - Redis might not be available)
        try {
          const cacheKey = `${this.IMPERSONATION_PREFIX}${sessionToken}`;
          // await redis.setex(
          //   cacheKey,
          //   15 * 60,
          //   JSON.stringify({
          //     id: session.id,
          //     impersonatorId,
          //     targetUserId,
          //     mode,
          //     sessionToken,
          //     reason,
          //     startedAt: session.startedAt.toISOString(),
          //     expiresAt: session.expiresAt.toISOString(),
          //   })
          // );
          // Redis disabled
        } catch (redisError) {
          console.warn(
            "Redis caching failed, continuing without cache:",
            redisError
          );
        }

        return {
          id: session.id,
          impersonatorId: session.impersonatorId,
          targetUserId: session.targetUserId,
          mode: session.mode as "view" | "act",
          sessionToken: session.sessionToken,
          reason: session.reason,
          startedAt: session.startedAt,
          expiresAt: session.expiresAt,
        };
    } catch (error) {
        console.error("Error starting impersonation:", error);
        console.error("Error details:", {
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          impersonatorId,
          targetUserId,
          mode,
          reason,
        });
        return null;
    }
  }

  /**
   * End impersonation session
   */
  static async endImpersonation(
    sessionToken: string,
    endedBy?: string
  ): Promise<boolean> {
    try {
        // Update database
        await prisma.impersonationSession.updateMany({
          where: {
            sessionToken,
            endedAt: null,
          },
          data: {
            endedAt: new Date(),
            endedBy,
          },
        });

        // Remove from cache
        const cacheKey = `${this.IMPERSONATION_PREFIX}${sessionToken}`;
        // await redis.del(cacheKey);
        // Redis disabled

        return true;
    } catch (error) {
        console.error("Error ending impersonation:", error);
        return false;
    }
  }

  /**
   * Get active impersonation session
   */
  static async getImpersonationSession(
    sessionToken: string
  ): Promise<ImpersonationSession | null> {
    try {
        // Try cache first
        const cacheKey = `${this.IMPERSONATION_PREFIX}${sessionToken}`;
        // const cached = await redis.get(cacheKey);
        const cached = null; // Redis disabled

        if (cached) {
          const parsed = JSON.parse(cached);
          return {
            ...parsed,
            startedAt: new Date(parsed.startedAt),
            expiresAt: new Date(parsed.expiresAt),
          };
        }

        // Fetch from database
        const session = await prisma.impersonationSession.findFirst({
          where: {
            sessionToken,
            endedAt: null,
            expiresAt: { gt: new Date() },
          },
        });

        if (session) {
          const impersonationSession: ImpersonationSession = {
            id: session.id,
            impersonatorId: session.impersonatorId,
            targetUserId: session.targetUserId,
            mode: session.mode as "view" | "act",
            sessionToken: session.sessionToken,
            reason: session.reason,
            startedAt: session.startedAt,
            expiresAt: session.expiresAt,
          };

          // Cache the result
          // await redis.setex(
          //   cacheKey,
          //   15 * 60,
          //   JSON.stringify({
          //     ...impersonationSession,
          //     startedAt: impersonationSession.startedAt.toISOString(),
          //     expiresAt: impersonationSession.expiresAt.toISOString(),
          //   })
          // );
          // Redis disabled

          return impersonationSession;
        }

        return null;
    } catch (error) {
        console.error("Error getting impersonation session:", error);
        return null;
    }
  }

  /**
   * Check user quota
   */
  static async checkQuota(
    userId: string,
    quotaType: string,
    incrementBy: number = 1
  ): Promise<{
    allowed: boolean;
    currentUsage: number;
    limit: number;
    remaining: number;
  }> {
    try {
        const result = await prisma.$queryRaw<
          Array<{
            allowed: boolean;
            current_usage: bigint;
            limit_value: bigint;
            remaining: bigint;
          }>
        >`
          SELECT * FROM check_user_quota(${userId}, ${quotaType}, ${incrementBy})
        `;

        if (result.length === 0) {
          return { allowed: true, currentUsage: 0, limit: 0, remaining: 0 };
        }

        const quota = result[0];
        return {
          allowed: quota.allowed,
          currentUsage: Number(quota.current_usage),
          limit: Number(quota.limit_value),
          remaining: Number(quota.remaining),
        };
    } catch (error) {
        console.error("Error checking quota:", error);
        return { allowed: false, currentUsage: 0, limit: 0, remaining: 0 };
    }
  }
}

export default AuthService;
