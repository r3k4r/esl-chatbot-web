import { Router } from "express";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { authenticate } from "../../middlewares/authenticate.ts";
import { env } from "../../config/env.ts";
import {
  initiateFibHandler,
  getPendingFibHandler,
  getFibStatusHandler,
  cancelFibHandler,
  cancelMyFibHandler,
  listMyFibPaymentsHandler,
  fibWebhookHandler,
} from "./subscriptions.controller.ts";

const router = Router();
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * @swagger
 * tags:
 *   name: Subscriptions
 *   description: FIB subscription billing (GOLD/PREMIUM plans)
 */

/**
 * @swagger
 * /subscriptions/initiate-fib:
 *   post:
 *     summary: Initiate a FIB subscription (returns QR code + app link)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plan, intervalMonths]
 *             properties:
 *               plan:
 *                 type: string
 *                 enum: [GOLD, PREMIUM]
 *               intervalMonths:
 *                 type: integer
 *                 enum: [1, 3, 6, 12]
 *     responses:
 *       201:
 *         description: FIB subscription created — show QR code to user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     fibSubscriptionId: { type: string }
 *                     readableCode: { type: string }
 *                     qrCode: { type: string, description: base64 PNG data URI }
 *                     appLink: { type: string }
 *                     validUntil: { type: string, format: date-time }
 *                     plan: { type: string, enum: [GOLD, PREMIUM] }
 *                     intervalMonths: { type: integer }
 *                     amountIQD: { type: integer }
 *                     changeType:
 *                       type: string
 *                       enum: [NEW, RENEWAL, UPGRADE, DOWNGRADE]
 *                       description: >
 *                         What this purchase does relative to the caller's current plan. NEW = no
 *                         paid plan right now; RENEWAL = same plan again (only offered once the
 *                         current one is cancelled or lapsing); UPGRADE/DOWNGRADE = switching tier
 *                         mid-period.
 *                     carryOverDays:
 *                       type: integer
 *                       description: >
 *                         Unused days on the current plan, converted to this plan's daily rate and
 *                         added on top when the payment activates. 0 when there is nothing to carry.
 *                     resumed:
 *                       type: boolean
 *                       description: >
 *                         True when an existing pending payment was handed back instead of a new
 *                         one being created (same plan + interval already awaiting payment).
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       409:
 *         description: >
 *           Active subscription conflict, or a pending payment for a DIFFERENT plan/interval
 *           exists. In the latter case the body carries `pendingFib` so the client can offer
 *           to resume or cancel it.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 pendingFib:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     fibSubscriptionId: { type: string }
 *                     plan: { type: string, enum: [GOLD, PREMIUM] }
 *                     intervalMonths: { type: integer }
 *                     amountIQD: { type: integer }
 *                     validUntil: { type: string, format: date-time, nullable: true }
 *       422: { $ref: '#/components/responses/ValidationError' }
 *       503: { description: FIB credentials not configured }
 */
router.post("/initiate-fib", authenticate, initiateFibHandler);

/**
 * @swagger
 * /subscriptions/fib/pending:
 *   get:
 *     summary: Get the caller's pending (unpaid) FIB payment, if any
 *     description: >
 *       Recovers an in-progress payment — the QR code, manual code and app link of a DRAFT
 *       subscription that is still valid. The draft is LIVE-VERIFIED against FIB first:
 *       if it turns out to be paid, the plan is activated on the spot and the response is
 *       `data: null` with the message "Payment confirmed — your plan is now active" (exact
 *       prefix is a frontend contract). Expired DRAFTs are swept. Returns `data: null` when
 *       there is nothing to resume.
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending payment, or null
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     fibSubscriptionId: { type: string }
 *                     readableCode: { type: string }
 *                     qrCode: { type: string, description: base64 PNG data URI }
 *                     appLink: { type: string }
 *                     validUntil: { type: string, format: date-time }
 *                     plan: { type: string, enum: [GOLD, PREMIUM] }
 *                     intervalMonths: { type: integer }
 *                     amountIQD: { type: integer }
 *                     changeType:
 *                       type: string
 *                       enum: [NEW, RENEWAL, UPGRADE, DOWNGRADE]
 *                       description: >
 *                         What this purchase does relative to the caller's current plan. NEW = no
 *                         paid plan right now; RENEWAL = same plan again (only offered once the
 *                         current one is cancelled or lapsing); UPGRADE/DOWNGRADE = switching tier
 *                         mid-period.
 *                     carryOverDays:
 *                       type: integer
 *                       description: >
 *                         Unused days on the current plan, converted to this plan's daily rate and
 *                         added on top when the payment activates. 0 when there is nothing to carry.
 *                     resumed: { type: boolean }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/fib/pending", authenticate, getPendingFibHandler);

/**
 * @swagger
 * /subscriptions/fib/payments:
 *   get:
 *     summary: The caller's FIB payment history (most recent 50)
 *     description: >
 *       Every FIB subscription the user has started, so they can see what they were
 *       actually charged. `wasCharged` is true only when the subscription activated.
 *       `awaitingConfirmation` marks a record that never activated but is still being
 *       polled against FIB — settlement can take one to two days, so "not activated"
 *       must not be shown to the user as "not paid" until that window has passed.
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       fibSubscriptionId: { type: string }
 *                       plan: { type: string, enum: [GOLD, PREMIUM] }
 *                       intervalMonths: { type: integer }
 *                       amountIQD: { type: integer }
 *                       fibStatus: { type: string, enum: [DRAFT, TRIAL, ACTIVE, REJECTED, CANCELLED] }
 *                       wasCharged: { type: boolean }
 *                       awaitingConfirmation:
 *                         type: boolean
 *                         description: >
 *                           Never activated, but still inside the reconciliation window and
 *                           therefore still being checked against FIB. Render as "checking",
 *                           never as "not paid".
 *                       createdAt: { type: string, format: date-time }
 *                       activatedAt: { type: string, format: date-time, nullable: true }
 *                       cancelledAt: { type: string, format: date-time, nullable: true }
 *                       validUntil: { type: string, format: date-time, nullable: true }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/fib/payments", authenticate, listMyFibPaymentsHandler);

/**
 * @swagger
 * /subscriptions/fib:
 *   delete:
 *     summary: Cancel the caller's current FIB subscription (no id required)
 *     description: >
 *       Resolves the subscription server-side, so a stale `externalSubscriptionId` can
 *       never leave a user unable to cancel. Prefers a live ACTIVE/TRIAL subscription
 *       over an unpaid DRAFT. Cancelling a paid plan keeps access until
 *       `currentPeriodEnd` (no refunds); cancelling an unpaid DRAFT just discards it,
 *       and re-checks with FIB first so a payment in flight is never thrown away.
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Cancelled }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { description: Nothing to cancel }
 *       409: { description: Already cancelled, or the payment landed first and the plan was activated instead }
 *       503: { description: FIB unreachable — refused rather than risk discarding a payment }
 */
router.delete("/fib", authenticate, cancelMyFibHandler);

/**
 * @swagger
 * /subscriptions/fib/{subscriptionId}/status:
 *   get:
 *     summary: Get FIB subscription status (also syncs to DB if status changed)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Current FIB subscription status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     fibStatus:
 *                       type: string
 *                       enum: [DRAFT, TRIAL, ACTIVE, REJECTED, CANCELLED]
 *                     plan: { type: string, enum: [GOLD, PREMIUM] }
 *                     intervalMonths: { type: integer }
 *                     amountIQD: { type: integer }
 *                     activeUntil: { type: string, format: date-time, nullable: true }
 *                     lastPaymentAt: { type: string, format: date-time, nullable: true }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { description: Subscription not found }
 */
router.get("/fib/:subscriptionId/status", authenticate, getFibStatusHandler);

/**
 * @swagger
 * /subscriptions/fib/{subscriptionId}:
 *   delete:
 *     summary: Cancel an active or pending FIB subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Subscription cancelled — plan downgraded to FREE ACTIVE
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { description: Subscription not found }
 *       409: { description: Already cancelled }
 */
router.delete("/fib/:subscriptionId", authenticate, cancelFibHandler);

/**
 * @swagger
 * /subscriptions/webhook/fib:
 *   post:
 *     summary: FIB status callback (called by FIB — not for direct use)
 *     tags: [Subscriptions]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subscriptionId: { type: string }
 *               status:
 *                 type: string
 *                 enum: [DRAFT, TRIAL, ACTIVE, REJECTED, CANCELLED]
 *     responses:
 *       202:
 *         description: Acknowledged (FIB requires 202 Accepted per pre-production spec)
 */
router.post("/webhook/fib", fibWebhookHandler);

// Dev-only: browser test interface for the FIB subscription flow
if (env.NODE_ENV !== "production") {
  router.get("/fib-test", (_req, res) => {
    const html = readFileSync(join(__dirname, "fib-test.html"), "utf-8");
    res.setHeader("Content-Type", "text/html");
    res.setHeader(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data:",
        "connect-src 'self'",
      ].join("; "),
    );
    res.send(html);
  });
}

export default router;
