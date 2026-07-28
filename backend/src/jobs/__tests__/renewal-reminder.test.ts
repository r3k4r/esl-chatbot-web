import { describe, it, expect } from "bun:test";
import { buildRenewalReminderHtml } from "../renewal-reminder.email.ts";

// DB-free unit tests — these run even when TEST_DATABASE_URL is unavailable.

const base = {
  displayName: "Ali",
  plan: "GOLD",
  renewsOn: new Date("2026-08-15T00:00:00.000Z"),
  billingUrl: "https://ai.tutelage.krd/dashboard/billing",
};

describe("buildRenewalReminderHtml", () => {
  it("states the plan, the exact charge date and the amount", () => {
    const html = buildRenewalReminderHtml(base);

    expect(html).toContain("GOLD");
    expect(html).toContain("15 August 2026");
    expect(html).toContain("25,000 IQD"); // must match PLAN_AMOUNTS_IQD GOLD 1-month
    expect(html).toContain(base.billingUrl);
  });

  it("quotes the PREMIUM price for a PREMIUM plan", () => {
    const html = buildRenewalReminderHtml({ ...base, plan: "PREMIUM" });
    expect(html).toContain("45,000 IQD");
    expect(html).not.toContain("25,000 IQD");
  });

  it("falls back to a vague amount for an unknown plan rather than printing a wrong number", () => {
    const html = buildRenewalReminderHtml({ ...base, plan: "MYSTERY" });
    expect(html).toContain("usual amount");
    expect(html).not.toContain("IQD</strong>");
  });

  it("escapes user-controlled text (displayName comes from the DB)", () => {
    const html = buildRenewalReminderHtml({
      ...base,
      displayName: '<script>alert("x")</script>',
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("renders the date in UTC so the charge day never shifts by timezone", () => {
    // 23:30 UTC — a local-time formatter would render this as the 16th in most of
    // Asia and quote a date one day later than FIB actually charges.
    const html = buildRenewalReminderHtml({
      ...base,
      renewsOn: new Date("2026-08-15T23:30:00.000Z"),
    });
    expect(html).toContain("15 August 2026");
    expect(html).not.toContain("16 August 2026");
  });
});
