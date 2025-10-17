import { prisma } from "@/lib/prisma";
import { UsageAction, UserSubscriptionPlan } from "@/generated/prisma";

export interface UsageLimitConfig {
  monthlySearchLimit: number;
  monthlyBusinessLimit: number;
  monthlyContactLimit: number;
  apiCallLimit: number; // per hour
}

export interface UsageStatus {
  canProceed: boolean;
  remaining: {
    searches: number;
    businesses: number;
    contacts: number;
    apiCalls: number;
  };
  limits: {
    searches: number;
    businesses: number;
    contacts: number;
    apiCalls: number;
  };
  resetDate: Date;
  subscriptionPlan: UserSubscriptionPlan;
  isExpired: boolean;
}

export class UsageLimitService {
  private static readonly PLAN_LIMITS: Record<
    UserSubscriptionPlan,
    UsageLimitConfig
  > = {
    FREE: {
        monthlySearchLimit: 100,
        monthlyBusinessLimit: 1000,
        monthlyContactLimit: 500,
        apiCallLimit: 60, // 60 calls per hour
    },
    BASIC: {
        monthlySearchLimit: 500,
        monthlyBusinessLimit: 5000,
        monthlyContactLimit: 2000,
        apiCallLimit: 300, // 300 calls per hour
    },
    PRO: {
        monthlySearchLimit: 2000,
        monthlyBusinessLimit: 20000,
        monthlyContactLimit: 10000,
        apiCallLimit: 1000, // 1000 calls per hour
    },
    ENTERPRISE: {
        monthlySearchLimit: 10000,
        monthlyBusinessLimit: 100000,
        monthlyContactLimit: 50000,
        apiCallLimit: 5000, // 5000 calls per hour
    },
  };

  /**
   * Check if user can perform an action based on their usage limits
   */
  static async checkUsageLimit(
    userId: string,
    action: UsageAction,
    quantity: number = 1
  ): Promise<{ canProceed: boolean; reason?: string }> {
    try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            role: true,
            subscriptionPlan: true,
            subscriptionExpiresAt: true,
            currentMonthSearches: true,
            currentMonthBusinesses: true,
            currentMonthContacts: true,
            lastApiCall: true,
            apiCallCount: true,
            apiCallResetTime: true,
            usageResetDate: true,
          },
        });

        if (!user) {
          return { canProceed: false, reason: "User not found" };
        }

        // ADMIN users have unlimited access - no restrictions
        if (user.role === "ADMIN") {
          return { canProceed: true };
        }

        // Check if subscription is expired
        if (
          user.subscriptionExpiresAt &&
          user.subscriptionExpiresAt < new Date()
        ) {
          return { canProceed: false, reason: "Subscription expired" };
        }

        // Reset monthly usage if needed
        await this.resetMonthlyUsageIfNeeded(userId, user.usageResetDate);

        // Reset API call count if needed
        await this.resetApiCallCountIfNeeded(userId, user.apiCallResetTime);

        // Get current limits for user's plan
        const limits = this.PLAN_LIMITS[user.subscriptionPlan];

        // Check specific action limits
        switch (action) {
          case UsageAction.SEARCH:
            const canSearch =
              user.currentMonthSearches + quantity <= limits.monthlySearchLimit;
            return {
              canProceed: canSearch,
              reason: canSearch ? undefined : "Monthly search limit exceeded",
            };

          case UsageAction.BUSINESS_CREATE:
          case UsageAction.BUSINESS_UPDATE:
            const canBusiness =
              user.currentMonthBusinesses + quantity <=
              limits.monthlyBusinessLimit;
            return {
              canProceed: canBusiness,
              reason: canBusiness ? undefined : "Monthly business limit exceeded",
            };

          case UsageAction.CONTACT_DETECTION:
          case UsageAction.CONTACT_FORM_SUBMIT:
            const canContact =
              user.currentMonthContacts + quantity <= limits.monthlyContactLimit;
            return {
              canProceed: canContact,
              reason: canContact ? undefined : "Monthly contact limit exceeded",
            };

          case UsageAction.API_CALL:
            const canApiCall =
              user.apiCallCount + quantity <= limits.apiCallLimit;
            return {
              canProceed: canApiCall,
              reason: canApiCall ? undefined : "Hourly API call limit exceeded",
            };

          default:
            return { canProceed: true };
        }
    } catch (error) {
        console.error("Error checking usage limit:", error);
        return { canProceed: false, reason: "Error checking usage limits" };
    }
  }

  /**
   * Record usage for a specific action
   */
  static async recordUsage(
    userId: string,
    action: UsageAction,
    quantity: number = 1,
    metadata?: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
        // Log the usage
        await prisma.usageLog.create({
          data: {
            userId,
            action,
            resource: action.toLowerCase(),
            quantity,
            metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
            ipAddress,
            userAgent,
          },
        });

        // Update user's current usage counts based on action
        const updateData: {
          currentMonthSearches?: { increment: number };
          currentMonthBusinesses?: { increment: number };
          currentMonthContacts?: { increment: number };
          apiCallCount?: { increment: number };
          lastApiCall?: Date;
        } = {};

        switch (action) {
          case UsageAction.SEARCH:
            updateData.currentMonthSearches = { increment: quantity };
            break;
          case UsageAction.BUSINESS_CREATE:
          case UsageAction.BUSINESS_UPDATE:
            updateData.currentMonthBusinesses = { increment: quantity };
            break;
          case UsageAction.CONTACT_DETECTION:
          case UsageAction.CONTACT_FORM_SUBMIT:
            updateData.currentMonthContacts = { increment: quantity };
            break;
          case UsageAction.API_CALL:
            updateData.apiCallCount = { increment: quantity };
            updateData.lastApiCall = new Date();
            break;
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.user.update({
            where: { id: userId },
            data: updateData,
          });
        }
    } catch (error) {
        console.error("Error recording usage:", error);
    }
  }

  /**
   * Get current usage status for a user
   */
  static async getUsageStatus(userId: string): Promise<UsageStatus> {
    try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            role: true,
            subscriptionPlan: true,
            subscriptionExpiresAt: true,
            currentMonthSearches: true,
            currentMonthBusinesses: true,
            currentMonthContacts: true,
            lastApiCall: true,
            apiCallCount: true,
            apiCallResetTime: true,
            usageResetDate: true,
          },
        });

        if (!user) {
          throw new Error("User not found");
        }

        // ADMIN users have unlimited access
        if (user.role === "ADMIN") {
          return {
            canProceed: true,
            remaining: {
              searches: -1, // -1 indicates unlimited
              businesses: -1,
              contacts: -1,
              apiCalls: -1,
            },
            limits: {
              searches: -1, // -1 indicates unlimited
              businesses: -1,
              contacts: -1,
              apiCalls: -1,
            },
            resetDate: user.usageResetDate,
            subscriptionPlan: user.subscriptionPlan,
            isExpired: false,
          };
        }

        const limits = this.PLAN_LIMITS[user.subscriptionPlan];
        const isExpired = user.subscriptionExpiresAt
          ? user.subscriptionExpiresAt < new Date()
          : false;

        return {
          canProceed: !isExpired,
          remaining: {
            searches: Math.max(
              0,
              limits.monthlySearchLimit - user.currentMonthSearches
            ),
            businesses: Math.max(
              0,
              limits.monthlyBusinessLimit - user.currentMonthBusinesses
            ),
            contacts: Math.max(
              0,
              limits.monthlyContactLimit - user.currentMonthContacts
            ),
            apiCalls: Math.max(0, limits.apiCallLimit - user.apiCallCount),
          },
          limits: {
            searches: limits.monthlySearchLimit,
            businesses: limits.monthlyBusinessLimit,
            contacts: limits.monthlyContactLimit,
            apiCalls: limits.apiCallLimit,
          },
          resetDate: user.usageResetDate,
          subscriptionPlan: user.subscriptionPlan,
          isExpired,
        };
    } catch (error) {
        console.error("Error getting usage status:", error);
        throw error;
    }
  }

  /**
   * Reset monthly usage if the month has changed
   */
  private static async resetMonthlyUsageIfNeeded(
    userId: string,
    lastResetDate: Date
  ): Promise<void> {
    const now = new Date();
    const lastReset = new Date(lastResetDate);

    // Check if we're in a new month
    if (
        now.getFullYear() !== lastReset.getFullYear() ||
        now.getMonth() !== lastReset.getMonth()
    ) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            currentMonthSearches: 0,
            currentMonthBusinesses: 0,
            currentMonthContacts: 0,
            usageResetDate: now,
          },
        });
    }
  }

  /**
   * Reset API call count if an hour has passed
   */
  private static async resetApiCallCountIfNeeded(
    userId: string,
    lastResetTime: Date
  ): Promise<void> {
    const now = new Date();
    const lastReset = new Date(lastResetTime);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    if (lastReset < oneHourAgo) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            apiCallCount: 0,
            apiCallResetTime: now,
          },
        });
    }
  }

  /**
   * Upgrade user subscription
   */
  static async upgradeSubscription(
    userId: string,
    newPlan: UserSubscriptionPlan,
    expiresAt?: Date
  ): Promise<void> {
    try {
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionPlan: newPlan,
            subscriptionExpiresAt: expiresAt,
            // Reset usage when upgrading
            currentMonthSearches: 0,
            currentMonthBusinesses: 0,
            currentMonthContacts: 0,
            usageResetDate: new Date(),
          },
        });
    } catch (error) {
        console.error("Error upgrading subscription:", error);
        throw error;
    }
  }

  /**
   * Get usage statistics for admin dashboard
   */
  static async getUsageStatistics(): Promise<{
    actionStats: Array<{
        action: UsageAction;
        _count: { id: number };
        _sum: { quantity: number | null };
    }>;
    subscriptionStats: Array<{
        subscriptionPlan: UserSubscriptionPlan;
        _count: { id: number };
    }>;
  }> {
    try {
        const stats = await prisma.usageLog.groupBy({
          by: ["action"],
          _count: {
            id: true,
          },
          _sum: {
            quantity: true,
          },
          where: {
            createdAt: {
              gte: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        });

        const userStats = await prisma.user.groupBy({
          by: ["subscriptionPlan"],
          _count: {
            id: true,
          },
        });

        return {
          actionStats: stats,
          subscriptionStats: userStats,
        };
    } catch (error) {
        console.error("Error getting usage statistics:", error);
        throw error;
    }
  }

  /**
   * Clean up old usage logs (keep last 90 days)
   */
  static async cleanupOldUsageLogs(): Promise<void> {
    try {
        const cutoffDate = new Date(
          new Date().getTime() - 90 * 24 * 60 * 60 * 1000
        );

        await prisma.usageLog.deleteMany({
          where: {
            createdAt: {
              lt: cutoffDate,
            },
          },
        });
    } catch (error) {
        console.error("Error cleaning up old usage logs:", error);
    }
  }
}

// Middleware function for API routes
export async function withUsageLimit<T>(
  userId: string,
  action: UsageAction,
  quantity: number = 1,
  callback: () => Promise<T>
): Promise<T> {
  const { canProceed, reason } = await UsageLimitService.checkUsageLimit(
    userId,
    action,
    quantity
  );

  if (!canProceed) {
    throw new Error(reason || "Usage limit exceeded");
  }

  try {
    const result = await callback();

    // Record the usage after successful operation
    await UsageLimitService.recordUsage(userId, action, quantity);

    return result;
  } catch (error) {
    // Don't record usage if the operation failed
    throw error;
  }
}
