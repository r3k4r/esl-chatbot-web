-- Cancellation policy: cancelling a paid plan stops future charges but keeps access
-- until currentPeriodEnd (no refunds — FIB's 1% commission is non-refundable and the
-- Subscription API has no refund endpoint). Replaces the old behaviour of downgrading
-- to FREE immediately, which silently took away days the user had already paid for.
--
-- IF NOT EXISTS because dev is kept in sync with `db push` while prod runs
-- `migrate deploy` — this keeps the migration idempotent on both.
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;
