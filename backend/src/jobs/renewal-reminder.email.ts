import { esc } from "./weekly-digest.email.ts";

// Prices must match PLAN_AMOUNTS_IQD in subscriptions.service.ts. Only the 1-month
// figure is quoted — the renewal charge is always one interval, and the vast
// majority of subscriptions are monthly. Shown as "about" so a 3/6/12-month
// subscriber is never told a precise figure that is wrong for their interval.
const MONTHLY_IQD: Record<string, number> = { GOLD: 25_000, PREMIUM: 45_000 };

export interface RenewalReminderInput {
  displayName: string;
  plan: string;
  renewsOn: Date;
  billingUrl: string;
}

export function buildRenewalReminderHtml(input: RenewalReminderInput): string {
  const { displayName, plan, renewsOn, billingUrl } = input;

  const date = renewsOn.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const amount = MONTHLY_IQD[plan];
  const amountLine = amount
    ? `about <strong>${amount.toLocaleString("en-US")} IQD</strong>`
    : "your plan's usual amount";

  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f6f7f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1c1e21;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e6e8eb;border-radius:16px;overflow:hidden;">
      <div style="padding:24px 28px 8px;">
        <p style="margin:0 0 4px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#8a8f98;">Tutelage</p>
        <h1 style="margin:0;font-size:22px;line-height:1.3;">Your ${esc(plan)} plan renews in 3 days</h1>
      </div>

      <div style="padding:8px 28px 4px;font-size:15px;line-height:1.6;color:#3c4149;">
        <p style="margin:0 0 16px;">Hi ${esc(displayName)},</p>
        <p style="margin:0 0 16px;">
          This is a heads-up that your <strong>${esc(plan)}</strong> subscription renews automatically on
          <strong>${esc(date)}</strong>, and FIB will charge you ${amountLine} for the next period.
        </p>
        <p style="margin:0 0 16px;">
          You don't need to do anything if you want to keep learning — this email is just so the
          charge is never a surprise.
        </p>
        <p style="margin:0 0 20px;">
          If you'd rather not renew, you can turn renewal off any time before that date. You'll
          keep full ${esc(plan)} access until ${esc(date)}, and then move to the free plan.
        </p>
      </div>

      <div style="padding:0 28px 28px;">
        <a href="${esc(billingUrl)}"
           style="display:inline-block;background:#f59e0b;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 20px;border-radius:10px;">
          Manage your subscription
        </a>
      </div>

      <div style="padding:16px 28px;background:#fafbfc;border-top:1px solid #eef0f2;font-size:13px;line-height:1.6;color:#8a8f98;">
        You're receiving this because you have an active paid subscription. It is a billing
        notice, not a marketing email.
      </div>
    </div>
  </body>
</html>`;
}
