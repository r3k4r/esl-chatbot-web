/**
 * One-shot script to run the renewal-reminder job manually.
 *
 * Usage:
 *   bun run job:renewal-reminder
 *
 * Sends to every ACTIVE paid FIB subscription whose period ends in exactly 3 days
 * (the same 24-hour window the daily cron uses). If nothing is in that window it
 * exits silently — that is normal, not a failure. To see it actually send, point a
 * test subscription's currentPeriodEnd at ~3 days out first.
 */
import { runRenewalReminderJob } from "../src/jobs/renewal-reminder.job.ts";

await runRenewalReminderJob();
process.exit(0);
