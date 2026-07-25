-- Catch-up migration: the `data Json?` field on Notification (schema.prisma) was
-- only ever applied to the dev DB via `prisma db push`, so it was never captured in
-- a migration and never reached prod (which is built via `migrate deploy`). Prod was
-- throwing `column notifications.data does not exist` on notification queries.
--
-- IF NOT EXISTS makes this safe to run everywhere: it ADDs the column on prod (which
-- lacks it) and is a no-op on dev (which already has it via the earlier db push).
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "data" JSONB;
