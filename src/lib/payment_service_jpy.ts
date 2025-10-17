/**
 * JPY Payment Processing Service with Stripe Integration
 * Handles payment processing with idempotency and comprehensive auditing
 */

import Stripe from "stripe";
import { prisma } from "./prisma";
import AuthService from "./auth_service";

// Initialize Stripe only if API key is available
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2024-12-18.acacia",
    })
  : null;

export interface PaymentMethod {
  id: string;
  type: "card" | "bank_account" | "wallet";
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
  isActive: boolean;
}

export interface Transaction {
  id: string;
  type: "charge" | "refund" | "adjustment" | "credit";
  amountCents: number;
  currency: string;
  status:
    | "pending"
    | "processing"
    | "succeeded"
    | "failed"
    | "cancelled"
    | "refunded";
  description?: string;
  processorTransactionId?: string;
  createdAt: Date;
  processedAt?: Date;
}

export interface CreateChargeRequest {
  amountCents: number;
  currency: string;
  paymentMethodId: string;
  description?: string;
  metadata?: Record<string, string>;
  idempotencyKey?: string;
}

export interface CreateChargeResponse {
  transaction: Transaction;
  clientSecret?: string; // For Stripe PaymentIntents
}

/**
 * JPY Payment Service
 */
export class PaymentService {
  private static readonly HIGH_VALUE_THRESHOLD_CENTS = 1000000; // ¥10,000
  private static readonly MAX_TRANSACTION_CENTS = 10000000; // ¥100,000

  /**
   * Convert display amount to minor units (JPY = cents)
   */
  static toMinorUnits(amountDisplay: number, currency: string = "JPY"): number {
    // JPY has no decimal places, so 1 JPY = 1 cent
    if (currency === "JPY") {
        return Math.round(amountDisplay);
    }

    // For other currencies, multiply by 100
    return Math.round(amountDisplay * 100);
  }

  /**
   * Convert minor units to display amount
   */
  static fromMinorUnits(amountCents: number, currency: string = "JPY"): number {
    // JPY has no decimal places
    if (currency === "JPY") {
        return amountCents;
    }

    // For other currencies, divide by 100
    return amountCents / 100;
  }

  /**
   * Format JPY amount for display
   */
  static formatJPYAmount(amountCents: number): string {
    return new Intl.NumberFormat("ja-JP", {
        style: "currency",
        currency: "JPY",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amountCents);
  }

  /**
   * Create a charge
   */
  static async createCharge(
    userId: string,
    request: CreateChargeRequest,
    actorUserId?: string
  ): Promise<CreateChargeResponse> {
    const effectiveUserId = actorUserId || userId;

    try {
        // Validate amount
        if (request.amountCents <= 0) {
          throw new Error("Amount must be positive");
        }

        if (request.amountCents > this.MAX_TRANSACTION_CENTS) {
          throw new Error(
            `Amount exceeds maximum transaction limit of ${this.formatJPYAmount(
              this.MAX_TRANSACTION_CENTS
            )}`
          );
        }

        // Check permissions
        const hasChargePermission = await AuthService.hasPermission(
          effectiveUserId,
          "billing.charge"
        );
        if (!hasChargePermission) {
          throw new Error("Insufficient permissions to create charges");
        }

        // Check for high-value charges
        if (request.amountCents >= this.HIGH_VALUE_THRESHOLD_CENTS) {
          const hasHighValuePermission = await AuthService.hasPermission(
            effectiveUserId,
            "billing.charge_high_value"
          );
          if (!hasHighValuePermission) {
            throw new Error("Insufficient permissions for high-value charges");
          }
        }

        // Check monthly spending quota
        const quotaResult = await AuthService.checkQuota(
          userId,
          "monthly_spend_cents",
          request.amountCents
        );
        if (!quotaResult.allowed) {
          throw new Error(
            `Monthly spending limit exceeded. Current: ${this.formatJPYAmount(
              quotaResult.currentUsage
            )}, Limit: ${this.formatJPYAmount(quotaResult.limit)}`
          );
        }

        // Generate idempotency key if not provided
        const idempotencyKey =
          request.idempotencyKey ||
          `charge_${userId}_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;

        // Check for existing transaction with same idempotency key
        const existingTransaction = await prisma.transaction.findUnique({
          where: { idempotencyKey },
        });

        if (existingTransaction) {
          return {
            transaction: {
              id: existingTransaction.id,
              type: existingTransaction.type as any,
              amountCents: Number(existingTransaction.amountCents),
              currency: existingTransaction.currency,
              status: existingTransaction.status as any,
              description: existingTransaction.description || undefined,
              processorTransactionId:
                existingTransaction.processorTransactionId || undefined,
              createdAt: existingTransaction.createdAt,
              processedAt: existingTransaction.processedAt || undefined,
            },
          };
        }

        // Get user's billing account
        const billingAccount = await prisma.billingAccount.findFirst({
          where: { userId },
        });

        if (!billingAccount) {
          throw new Error("Billing account not found");
        }

        // Get payment method
        const paymentMethod = await prisma.paymentMethod.findFirst({
          where: {
            id: request.paymentMethodId,
            userId,
            isActive: true,
          },
        });

        if (!paymentMethod) {
          throw new Error("Payment method not found or inactive");
        }

        // Create pending transaction
        const transaction = await prisma.transaction.create({
          data: {
            userId,
            billingAccountId: billingAccount.id,
            paymentMethodId: paymentMethod.id,
            processor: "stripe",
            idempotencyKey,
            type: "charge",
            amountCents: request.amountCents,
            currency: request.currency || "JPY",
            status: "pending",
            description: request.description,
            metadata: request.metadata,
          },
        });

        // Process with Stripe
        if (!stripe) {
          throw new Error("Stripe is not configured");
        }

        let stripePaymentIntent: Stripe.PaymentIntent;
        let clientSecret: string | undefined;

        try {
          stripePaymentIntent = await stripe.paymentIntents.create(
            {
              amount: request.amountCents, // JPY amount in cents
              currency: request.currency || "jpy",
              payment_method: paymentMethod.processorPmId,
              confirmation_method: "automatic",
              confirm: true,
              description: request.description,
              metadata: {
                transactionId: transaction.id,
                userId,
                ...request.metadata,
              },
            },
            {
              idempotencyKey: idempotencyKey,
            }
          );

          clientSecret = stripePaymentIntent.client_secret || undefined;

          // Update transaction with Stripe response
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              processorTransactionId: stripePaymentIntent.id,
              status:
                stripePaymentIntent.status === "succeeded"
                  ? "succeeded"
                  : "processing",
              processedAt:
                stripePaymentIntent.status === "succeeded"
                  ? new Date()
                  : undefined,
            },
          });

          // Log payment audit
          await this.logPaymentAudit({
            actorUserId: effectiveUserId,
            effectiveUserId: userId,
            transactionId: transaction.id,
            action: "charge.created",
            amountCents: request.amountCents,
            currency: request.currency || "JPY",
            oldStatus: "pending",
            newStatus:
              stripePaymentIntent.status === "succeeded"
                ? "succeeded"
                : "processing",
            reason: "Charge created successfully",
            metadata: {
              stripePaymentIntentId: stripePaymentIntent.id,
              paymentMethodId: paymentMethod.id,
            },
          });

          return {
            transaction: {
              id: transaction.id,
              type: "charge",
              amountCents: request.amountCents,
              currency: request.currency || "JPY",
              status:
                stripePaymentIntent.status === "succeeded"
                  ? "succeeded"
                  : "processing",
              description: request.description,
              processorTransactionId: stripePaymentIntent.id,
              createdAt: transaction.createdAt,
              processedAt:
                stripePaymentIntent.status === "succeeded"
                  ? new Date()
                  : undefined,
            },
            clientSecret,
          };
        } catch (stripeError) {
          // Update transaction with failure
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: "failed",
              failureReason:
                stripeError instanceof Error
                  ? stripeError.message
                  : "Unknown Stripe error",
            },
          });

          // Log payment audit
          await this.logPaymentAudit({
            actorUserId: effectiveUserId,
            effectiveUserId: userId,
            transactionId: transaction.id,
            action: "charge.failed",
            amountCents: request.amountCents,
            currency: request.currency || "JPY",
            oldStatus: "pending",
            newStatus: "failed",
            reason:
              stripeError instanceof Error
                ? stripeError.message
                : "Unknown Stripe error",
            metadata: {
              stripeError:
                stripeError instanceof Error
                  ? stripeError.message
                  : "Unknown error",
            },
          });

          throw stripeError;
        }
    } catch (error) {
        console.error("Error creating charge:", error);
        throw error;
    }
  }

  /**
   * Process refund
   */
  static async processRefund(
    transactionId: string,
    amountCents: number,
    reason: string,
    actorUserId: string
  ): Promise<Transaction> {
    try {
        // Get original transaction
        const originalTransaction = await prisma.transaction.findUnique({
          where: { id: transactionId },
        });

        if (!originalTransaction) {
          throw new Error("Transaction not found");
        }

        // Check permissions
        const hasRefundPermission = await AuthService.hasPermission(
          actorUserId,
          "billing.refund"
        );
        if (!hasRefundPermission) {
          throw new Error("Insufficient permissions to process refunds");
        }

        // Validate refund amount
        if (amountCents <= 0) {
          throw new Error("Refund amount must be positive");
        }

        if (amountCents > Number(originalTransaction.amountCents)) {
          throw new Error(
            "Refund amount cannot exceed original transaction amount"
          );
        }

        // Check if transaction is eligible for refund
        if (originalTransaction.status !== "succeeded") {
          throw new Error("Only succeeded transactions can be refunded");
        }

        // Generate idempotency key
        const idempotencyKey = `refund_${transactionId}_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        // Create refund transaction
        const refundTransaction = await prisma.transaction.create({
          data: {
            userId: originalTransaction.userId,
            billingAccountId: originalTransaction.billingAccountId,
            paymentMethodId: originalTransaction.paymentMethodId,
            processor: "stripe",
            idempotencyKey,
            type: "refund",
            amountCents: amountCents,
            currency: originalTransaction.currency,
            status: "pending",
            description: `Refund: ${reason}`,
            metadata: {
              originalTransactionId: transactionId,
              refundReason: reason,
            },
          },
        });

        // Process refund with Stripe
        if (!stripe) {
          throw new Error("Stripe is not configured");
        }

        try {
          const refund = await stripe.refunds.create(
            {
              payment_intent: originalTransaction.processorTransactionId!,
              amount: amountCents,
              reason: "requested_by_customer",
              metadata: {
                refundTransactionId: refundTransaction.id,
                originalTransactionId: transactionId,
                reason,
              },
            },
            {
              idempotencyKey: idempotencyKey,
            }
          );

          // Update refund transaction
          await prisma.transaction.update({
            where: { id: refundTransaction.id },
            data: {
              processorTransactionId: refund.id,
              status: refund.status === "succeeded" ? "succeeded" : "processing",
              processedAt: refund.status === "succeeded" ? new Date() : undefined,
            },
          });

          // Update original transaction
          await prisma.transaction.update({
            where: { id: transactionId },
            data: {
              status: "refunded",
            },
          });

          // Log payment audit
          await this.logPaymentAudit({
            actorUserId,
            effectiveUserId: originalTransaction.userId,
            transactionId: refundTransaction.id,
            action: "refund.processed",
            amountCents,
            currency: originalTransaction.currency,
            oldStatus: "pending",
            newStatus: refund.status === "succeeded" ? "succeeded" : "processing",
            reason,
            metadata: {
              originalTransactionId: transactionId,
              stripeRefundId: refund.id,
            },
          });

          return {
            id: refundTransaction.id,
            type: "refund",
            amountCents,
            currency: originalTransaction.currency,
            status: refund.status === "succeeded" ? "succeeded" : "processing",
            description: `Refund: ${reason}`,
            processorTransactionId: refund.id,
            createdAt: refundTransaction.createdAt,
            processedAt: refund.status === "succeeded" ? new Date() : undefined,
          };
        } catch (stripeError) {
          // Update refund transaction with failure
          await prisma.transaction.update({
            where: { id: refundTransaction.id },
            data: {
              status: "failed",
              failureReason:
                stripeError instanceof Error
                  ? stripeError.message
                  : "Unknown Stripe error",
            },
          });

          throw stripeError;
        }
    } catch (error) {
        console.error("Error processing refund:", error);
        throw error;
    }
  }

  /**
   * Add payment method
   */
  static async addPaymentMethod(
    userId: string,
    processorPmId: string,
    type: "card" | "bank_account" | "wallet",
    brand?: string,
    last4?: string,
    expMonth?: number,
    expYear?: number
  ): Promise<PaymentMethod> {
    try {
        // Get user's billing account
        const billingAccount = await prisma.billingAccount.findFirst({
          where: { userId },
        });

        if (!billingAccount) {
          throw new Error("Billing account not found");
        }

        // Check if payment method already exists
        const existingPaymentMethod = await prisma.paymentMethod.findFirst({
          where: {
            userId,
            processorPmId,
            processor: "stripe",
          },
        });

        if (existingPaymentMethod) {
          return {
            id: existingPaymentMethod.id,
            type: existingPaymentMethod.type as any,
            brand: existingPaymentMethod.brand || undefined,
            last4: existingPaymentMethod.last4 || undefined,
            expMonth: existingPaymentMethod.expMonth || undefined,
            expYear: existingPaymentMethod.expYear || undefined,
            isDefault: existingPaymentMethod.isDefault,
            isActive: existingPaymentMethod.isActive,
          };
        }

        // Create payment method
        const paymentMethod = await prisma.paymentMethod.create({
          data: {
            userId,
            billingAccountId: billingAccount.id,
            processor: "stripe",
            processorPmId,
            type,
            brand,
            last4,
            expMonth,
            expYear,
            isDefault: false, // Will be set to true if it's the first payment method
            isActive: true,
          },
        });

        // If this is the first payment method, make it default
        const paymentMethodCount = await prisma.paymentMethod.count({
          where: { userId, isActive: true },
        });

        if (paymentMethodCount === 1) {
          await prisma.paymentMethod.update({
            where: { id: paymentMethod.id },
            data: { isDefault: true },
          });
          paymentMethod.isDefault = true;
        }

        return {
          id: paymentMethod.id,
          type: paymentMethod.type as any,
          brand: paymentMethod.brand || undefined,
          last4: paymentMethod.last4 || undefined,
          expMonth: paymentMethod.expMonth || undefined,
          expYear: paymentMethod.expYear || undefined,
          isDefault: paymentMethod.isDefault,
          isActive: paymentMethod.isActive,
        };
    } catch (error) {
        console.error("Error adding payment method:", error);
        throw error;
    }
  }

  /**
   * Log payment audit event
   */
  private static async logPaymentAudit(event: {
    actorUserId: string;
    effectiveUserId: string;
    transactionId?: string;
    invoiceId?: string;
    action: string;
    amountCents: number;
    currency: string;
    oldStatus?: string;
    newStatus?: string;
    reason?: string;
    metadata?: any;
  }) {
    try {
        await prisma.paymentAuditLog.create({
          data: {
            actorUserId: event.actorUserId,
            effectiveUserId: event.effectiveUserId,
            transactionId: event.transactionId,
            invoiceId: event.invoiceId,
            action: event.action,
            amountCents: event.amountCents,
            currency: event.currency,
            oldStatus: event.oldStatus,
            newStatus: event.newStatus,
            reason: event.reason,
            metadata: event.metadata,
          },
        });
    } catch (error) {
        console.error("Error logging payment audit:", error);
    }
  }
}

export default PaymentService;
