import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.ts";
import { sendSuccess } from "../../utils/apiResponse.ts";
import {
  initiateFibSchema,
  fibSubscriptionIdParamSchema,
  fibWebhookSchema,
} from "./subscriptions.schema.ts";
import {
  initiateFibSubscription,
  getPendingFibSubscription,
  getFibStatus,
  cancelFibSubscription,
  cancelMyFibSubscription,
  listMyFibPayments,
  handleFibWebhook,
} from "./subscriptions.service.ts";

export const initiateFibHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = initiateFibSchema.parse(req.body);
    const result = await initiateFibSubscription(req.user!.id, input);
    sendSuccess(res, result, "Subscription initiated successfully", 201);
  },
);

export const getPendingFibHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { pending, paymentConfirmed } = await getPendingFibSubscription(req.user!.id);
    // The exact "Payment confirmed" prefix is a contract with the frontend
    // (SubscriptionPanel.loadPending) — it triggers the success toast + plan refresh.
    sendSuccess(
      res,
      pending,
      paymentConfirmed
        ? "Payment confirmed — your plan is now active"
        : pending
          ? "Pending payment retrieved"
          : "No pending payment",
    );
  },
);

export const getFibStatusHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { subscriptionId } = fibSubscriptionIdParamSchema.parse(req.params);
    const result = await getFibStatus(req.user!.id, subscriptionId);
    sendSuccess(res, result, "Subscription status retrieved");
  },
);

export const cancelFibHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { subscriptionId } = fibSubscriptionIdParamSchema.parse(req.params);
    await cancelFibSubscription(req.user!.id, subscriptionId);
    sendSuccess(res, null, "Subscription cancelled successfully");
  },
);

// Cancels whatever the caller currently has — no id needed from the client, so a
// stale externalSubscriptionId can't leave them unable to cancel.
export const cancelMyFibHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await cancelMyFibSubscription(req.user!.id);
    sendSuccess(res, null, "Subscription cancelled successfully");
  },
);

export const listMyFibPaymentsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await listMyFibPayments(req.user!.id);
    sendSuccess(res, result, "Payment history retrieved");
  },
);

// Webhook is fire-and-forget: acknowledge FIB immediately, process async.
// Not wrapped in asyncHandler so that errors after res.sendStatus(202) don't
// trigger the error middleware (which would try to set headers already sent).
// FIB expects 202 Accepted (per pre-production checklist Section D).
export const fibWebhookHandler = (req: Request, res: Response): void => {
  res.sendStatus(202);
  const body = fibWebhookSchema.safeParse(req.body);
  if (!body.success) return;
  handleFibWebhook(body.data.subscriptionId).catch(() => {
    // Silent — errors are safe to swallow here; FIB will retry the webhook
  });
};
