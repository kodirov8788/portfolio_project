/**
 * Sensitive Billing Authorization Middleware
 * Handles high-value transactions and sensitive billing operations
 */

import { authorize } from "./authorize_middleware";
import AuthService from "./auth_service";

export interface SensitiveBillingContext {
  amountCents: number;
  currency: string;
  transactionType: "charge" | "refund" | "adjustment";
  requiresApproval: boolean;
  approvalLevel: "single" | "dual";
}

/**
 * Require sensitive billing operations with enhanced security
 */
export function requireSensitiveBilling(_thresholdCents: number = 1000000) {
  // ¥10,000 default
  return authorize(["billing.charge", "billing.refund"], {
    requireAll: false,
    allowImpersonation: true,
    requireMFA: true,
  });
}

/**
 * Check if transaction requires sensitive billing controls
 */
export function isSensitiveTransaction(
  amountCents: number,
  transactionType: "charge" | "refund" | "adjustment",
  currency: string = "JPY"
): SensitiveBillingContext {
  const highValueThreshold = 1000000; // ¥10,000
  const criticalThreshold = 5000000; // ¥50,000

  const isHighValue = amountCents >= highValueThreshold;
  const isCritical = amountCents >= criticalThreshold;
  const isRefund = transactionType === "refund";
  const isAdjustment = transactionType === "adjustment";

  return {
    amountCents,
    currency,
    transactionType,
    requiresApproval: isHighValue || isRefund || isAdjustment,
    approvalLevel: isCritical ? "dual" : "single",
  };
}

/**
 * Validate sensitive billing operation
 */
export async function validateSensitiveBilling(
  userId: string,
  context: SensitiveBillingContext,
  actorUserId?: string
): Promise<{ valid: boolean; error?: string; requiresApproval?: boolean }> {
  try {
    const effectiveUserId = actorUserId || userId;

    // Check basic permissions
    const hasChargePermission = await AuthService.hasPermission(
        effectiveUserId,
        "billing.charge"
    );
    const hasRefundPermission = await AuthService.hasPermission(
        effectiveUserId,
        "billing.refund"
    );

    if (context.transactionType === "charge" && !hasChargePermission) {
        return {
          valid: false,
          error: "Insufficient permissions for billing charges",
        };
    }

    if (context.transactionType === "refund" && !hasRefundPermission) {
        return {
          valid: false,
          error: "Insufficient permissions for billing refunds",
        };
    }

    // Check high-value permissions
    if (context.amountCents >= 1000000) {
        // ¥10,000
        const hasHighValuePermission = await AuthService.hasPermission(
          effectiveUserId,
          "billing.charge_high_value"
        );
        if (!hasHighValuePermission) {
          return {
            valid: false,
            error: "Insufficient permissions for high-value transactions",
          };
        }
    }

    // Check monthly spending quota
    if (context.transactionType === "charge") {
        const quotaResult = await AuthService.checkQuota(
          userId,
          "monthly_spend_cents",
          context.amountCents
        );
        if (!quotaResult.allowed) {
          return {
            valid: false,
            error: `Monthly spending limit exceeded. Current: ¥${quotaResult.currentUsage}, Limit: ¥${quotaResult.limit}`,
          };
        }
    }

    // Check for existing pending approvals
    if (context.requiresApproval) {
        const pendingApproval = await checkPendingApproval(userId, context);
        if (pendingApproval) {
          return {
            valid: false,
            error: "Pending approval required for this transaction",
          };
        }
    }

    return {
        valid: true,
        requiresApproval: context.requiresApproval,
    };
  } catch (error) {
    console.error("Error validating sensitive billing:", error);
    return { valid: false, error: "Validation failed" };
  }
}

/**
 * Check for pending approval
 */
async function checkPendingApproval(
  userId: string,
  context: SensitiveBillingContext
): Promise<boolean> {
  try {
    // Check if there's a pending approval for similar transaction
    const pendingApproval = await prisma.approvalRequest?.findFirst({
        where: {
          userId,
          status: "pending",
          transactionType: context.transactionType,
          amountCents: context.amountCents,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Within last 24 hours
          },
        },
    });

    return !!pendingApproval;
  } catch (error) {
    console.error("Error checking pending approval:", error);
    return false;
  }
}

/**
 * Create approval request for sensitive transaction
 */
export async function createApprovalRequest(
  userId: string,
  context: SensitiveBillingContext,
  reason: string,
  actorUserId?: string
): Promise<{ approvalId: string; requiresDualApproval: boolean }> {
  try {
    const effectiveUserId = actorUserId || userId;

    // Create approval request
    const approvalRequest = await prisma.approvalRequest.create({
        data: {
          userId,
          requestedBy: effectiveUserId,
          transactionType: context.transactionType,
          amountCents: context.amountCents,
          currency: context.currency,
          reason,
          status: "pending",
          approvalLevel: context.approvalLevel,
          metadata: {
            context,
            createdAt: new Date().toISOString(),
          },
        },
    });

    // Log audit event
    await prisma.auditLog.create({
        data: {
          actorUserId: effectiveUserId,
          effectiveUserId: userId,
          action: "approval.request_created",
          resourceType: "approval_request",
          resourceId: approvalRequest.id,
          newValues: {
            transactionType: context.transactionType,
            amountCents: context.amountCents,
            currency: context.currency,
            approvalLevel: context.approvalLevel,
            reason,
          },
          reason: "Sensitive transaction requires approval",
          metadata: {
            context,
          },
        },
    });

    return {
        approvalId: approvalRequest.id,
        requiresDualApproval: context.approvalLevel === "dual",
    };
  } catch (error) {
    console.error("Error creating approval request:", error);
    throw error;
  }
}

/**
 * Approve sensitive transaction
 */
export async function approveTransaction(
  approvalId: string,
  approverId: string,
  approved: boolean,
  reason?: string
): Promise<{ success: boolean; requiresSecondApproval?: boolean }> {
  try {
    const approvalRequest = await prisma.approvalRequest.findUnique({
        where: { id: approvalId },
    });

    if (!approvalRequest) {
        throw new Error("Approval request not found");
    }

    if (approvalRequest.status !== "pending") {
        throw new Error("Approval request is not pending");
    }

    // Check if approver has permission
    const canApprove = await AuthService.hasPermission(
        approverId,
        "billing.approve"
    );
    if (!canApprove) {
        throw new Error("Insufficient permissions to approve transactions");
    }

    // Create approval record
    const approval = await prisma.approval.create({
        data: {
          approvalRequestId: approvalId,
          approverId,
          approved,
          reason,
          createdAt: new Date(),
        },
    });

    // Check if this is dual approval
    if (approvalRequest.approvalLevel === "dual") {
        const approvalCount = await prisma.approval.count({
          where: {
            approvalRequestId: approvalId,
            approved: true,
          },
        });

        if (approvalCount < 2) {
          // Still need second approval
          return { success: true, requiresSecondApproval: true };
        }
    }

    // Update approval request status
    await prisma.approvalRequest.update({
        where: { id: approvalId },
        data: {
          status: approved ? "approved" : "rejected",
          completedAt: new Date(),
        },
    });

    // Log audit event
    await prisma.auditLog.create({
        data: {
          actorUserId: approverId,
          effectiveUserId: approvalRequest.userId,
          action: "approval.completed",
          resourceType: "approval_request",
          resourceId: approvalId,
          oldValues: { status: "pending" },
          newValues: {
            status: approved ? "approved" : "rejected",
            approverId,
            reason,
          },
          reason: approved ? "Transaction approved" : "Transaction rejected",
          metadata: {
            approvalId: approval.id,
            approvalLevel: approvalRequest.approvalLevel,
          },
        },
    });

    return { success: true, requiresSecondApproval: false };
  } catch (error) {
    console.error("Error approving transaction:", error);
    throw error;
  }
}

/**
 * Get pending approvals
 */
export async function getPendingApprovals(
  userId?: string,
  limit: number = 50,
  offset: number = 0
): Promise<
  Array<{
    id: string;
    userId: string;
    requestedBy: string;
    transactionType: string;
    amountCents: number;
    currency: string;
    reason: string;
    approvalLevel: string;
    createdAt: Date;
    approvals: Array<{
        approverId: string;
        approved: boolean;
        reason?: string;
        createdAt: Date;
    }>;
  }>
> {
  try {
    const approvals = await prisma.approvalRequest.findMany({
        where: {
          status: "pending",
          ...(userId && { userId }),
        },
        include: {
          approvals: {
            include: {
              approver: {
                select: { id: true, email: true, name: true },
              },
            },
          },
          requester: {
            select: { id: true, email: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
    });

    return approvals.map((approval) => ({
        id: approval.id,
        userId: approval.userId,
        requestedBy: approval.requestedBy,
        transactionType: approval.transactionType,
        amountCents: Number(approval.amountCents),
        currency: approval.currency,
        reason: approval.reason,
        approvalLevel: approval.approvalLevel,
        createdAt: approval.createdAt,
        approvals: approval.approvals.map((a) => ({
          approverId: a.approverId,
          approved: a.approved,
          reason: a.reason || undefined,
          createdAt: a.createdAt,
        })),
    }));
  } catch (error) {
    console.error("Error getting pending approvals:", error);
    return [];
  }
}

export default {
  requireSensitiveBilling,
  isSensitiveTransaction,
  validateSensitiveBilling,
  createApprovalRequest,
  approveTransaction,
  getPendingApprovals,
};
