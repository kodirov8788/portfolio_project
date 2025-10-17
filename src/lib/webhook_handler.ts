/**
 * Stripe Webhook Handler
 * Handles Stripe webhook events for payment reconciliation
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "./prisma";

// Initialize Stripe only if API key is available
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2024-12-18.acacia",
    })
  : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(
  request: NextRequest
): Promise<NextResponse> {
  if (!stripe || !webhookSecret) {
    console.error("Stripe is not configured");
    return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
    );
  }

  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
        console.error("Missing Stripe signature");
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log("Received Stripe webhook:", event.type);

    // Handle different event types
    switch (event.type) {
        case "payment_intent.succeeded":
          await handlePaymentIntentSucceeded(
            event.data.object as Stripe.PaymentIntent
          );
          break;

        case "payment_intent.payment_failed":
          await handlePaymentIntentFailed(
            event.data.object as Stripe.PaymentIntent
          );
          break;

        case "payment_intent.canceled":
          await handlePaymentIntentCanceled(
            event.data.object as Stripe.PaymentIntent
          );
          break;

        case "charge.dispute.created":
          await handleChargeDisputeCreated(event.data.object as Stripe.Dispute);
          break;

        case "invoice.payment_succeeded":
          await handleInvoicePaymentSucceeded(
            event.data.object as Stripe.Invoice
          );
          break;

        case "invoice.payment_failed":
          await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
        { error: "Webhook handler failed" },
        { status: 500 }
    );
  }
}

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
) {
  try {
    const transactionId = paymentIntent.metadata?.transactionId;

    if (!transactionId) {
        console.error("No transaction ID in payment intent metadata");
        return;
    }

    // Update transaction status
    await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: "succeeded",
          processedAt: new Date(),
        },
    });

    // Log payment audit
    await prisma.paymentAuditLog.create({
        data: {
          actorUserId: paymentIntent.metadata?.userId || "system",
          effectiveUserId: paymentIntent.metadata?.userId || "system",
          transactionId,
          action: "charge.succeeded",
          amountCents: paymentIntent.amount,
          currency: paymentIntent.currency.toUpperCase(),
          oldStatus: "processing",
          newStatus: "succeeded",
          reason: "Payment succeeded via webhook",
          metadata: {
            stripePaymentIntentId: paymentIntent.id,
            stripeChargeId: paymentIntent.latest_charge,
          },
        },
    });

    console.log(`Payment succeeded for transaction ${transactionId}`);
  } catch (error) {
    console.error("Error handling payment intent succeeded:", error);
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const transactionId = paymentIntent.metadata?.transactionId;

    if (!transactionId) {
        console.error("No transaction ID in payment intent metadata");
        return;
    }

    // Update transaction status
    await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: "failed",
          failureReason:
            paymentIntent.last_payment_error?.message || "Payment failed",
        },
    });

    // Log payment audit
    await prisma.paymentAuditLog.create({
        data: {
          actorUserId: paymentIntent.metadata?.userId || "system",
          effectiveUserId: paymentIntent.metadata?.userId || "system",
          transactionId,
          action: "charge.failed",
          amountCents: paymentIntent.amount,
          currency: paymentIntent.currency.toUpperCase(),
          oldStatus: "processing",
          newStatus: "failed",
          reason: "Payment failed via webhook",
          metadata: {
            stripePaymentIntentId: paymentIntent.id,
            error: paymentIntent.last_payment_error,
          },
        },
    });

    console.log(`Payment failed for transaction ${transactionId}`);
  } catch (error) {
    console.error("Error handling payment intent failed:", error);
  }
}

/**
 * Handle canceled payment intent
 */
async function handlePaymentIntentCanceled(
  paymentIntent: Stripe.PaymentIntent
) {
  try {
    const transactionId = paymentIntent.metadata?.transactionId;

    if (!transactionId) {
        console.error("No transaction ID in payment intent metadata");
        return;
    }

    // Update transaction status
    await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: "cancelled",
          failureReason: "Payment canceled",
        },
    });

    // Log payment audit
    await prisma.paymentAuditLog.create({
        data: {
          actorUserId: paymentIntent.metadata?.userId || "system",
          effectiveUserId: paymentIntent.metadata?.userId || "system",
          transactionId,
          action: "charge.canceled",
          amountCents: paymentIntent.amount,
          currency: paymentIntent.currency.toUpperCase(),
          oldStatus: "processing",
          newStatus: "cancelled",
          reason: "Payment canceled via webhook",
          metadata: {
            stripePaymentIntentId: paymentIntent.id,
          },
        },
    });

    console.log(`Payment canceled for transaction ${transactionId}`);
  } catch (error) {
    console.error("Error handling payment intent canceled:", error);
  }
}

/**
 * Handle charge dispute created
 */
async function handleChargeDisputeCreated(dispute: Stripe.Dispute) {
  try {
    // Find transaction by Stripe charge ID
    const transaction = await prisma.transaction.findFirst({
        where: {
          processorTransactionId: dispute.charge,
        },
    });

    if (!transaction) {
        console.error(`No transaction found for charge ${dispute.charge}`);
        return;
    }

    // Log payment audit
    await prisma.paymentAuditLog.create({
        data: {
          actorUserId: "system",
          effectiveUserId: transaction.userId,
          transactionId: transaction.id,
          action: "charge.dispute_created",
          amountCents: dispute.amount,
          currency: dispute.currency.toUpperCase(),
          reason: "Charge dispute created",
          metadata: {
            stripeDisputeId: dispute.id,
            stripeChargeId: dispute.charge,
            disputeReason: dispute.reason,
            disputeStatus: dispute.status,
          },
        },
    });

    console.log(`Dispute created for transaction ${transaction.id}`);
  } catch (error) {
    console.error("Error handling charge dispute created:", error);
  }
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const invoiceId = invoice.metadata?.invoiceId;

    if (!invoiceId) {
        console.error("No invoice ID in invoice metadata");
        return;
    }

    // Update invoice status
    await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: "paid",
          paidAt: new Date(),
        },
    });

    // Log payment audit
    await prisma.paymentAuditLog.create({
        data: {
          actorUserId: invoice.metadata?.userId || "system",
          effectiveUserId: invoice.metadata?.userId || "system",
          invoiceId,
          action: "invoice.payment_succeeded",
          amountCents: invoice.amount_paid,
          currency: invoice.currency.toUpperCase(),
          oldStatus: "sent",
          newStatus: "paid",
          reason: "Invoice payment succeeded via webhook",
          metadata: {
            stripeInvoiceId: invoice.id,
            stripePaymentIntentId: invoice.payment_intent,
          },
        },
    });

    console.log(`Invoice payment succeeded for invoice ${invoiceId}`);
  } catch (error) {
    console.error("Error handling invoice payment succeeded:", error);
  }
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const invoiceId = invoice.metadata?.invoiceId;

    if (!invoiceId) {
        console.error("No invoice ID in invoice metadata");
        return;
    }

    // Update invoice status
    await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: "overdue",
        },
    });

    // Log payment audit
    await prisma.paymentAuditLog.create({
        data: {
          actorUserId: invoice.metadata?.userId || "system",
          effectiveUserId: invoice.metadata?.userId || "system",
          invoiceId,
          action: "invoice.payment_failed",
          amountCents: invoice.amount_due,
          currency: invoice.currency.toUpperCase(),
          oldStatus: "sent",
          newStatus: "overdue",
          reason: "Invoice payment failed via webhook",
          metadata: {
            stripeInvoiceId: invoice.id,
            stripePaymentIntentId: invoice.payment_intent,
          },
        },
    });

    console.log(`Invoice payment failed for invoice ${invoiceId}`);
  } catch (error) {
    console.error("Error handling invoice payment failed:", error);
  }
}

export default {
  handleStripeWebhook,
};
