-- Persist the FIB payment artifacts (QR code, readable code, app deep link) so a
-- pending DRAFT subscription can be shown to the user again after a page reload
-- or an accidental navigation. FIB's GET /subscriptions/:id does not return them.
--
-- Written with IF NOT EXISTS because dev is kept in sync with `db push` while prod
-- runs `migrate deploy` — this makes the migration idempotent on both.
ALTER TABLE "fib_subscriptions" ADD COLUMN IF NOT EXISTS "qrCode" TEXT;
ALTER TABLE "fib_subscriptions" ADD COLUMN IF NOT EXISTS "readableCode" TEXT;
ALTER TABLE "fib_subscriptions" ADD COLUMN IF NOT EXISTS "appLink" TEXT;
