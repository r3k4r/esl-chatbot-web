# Gemini API — Business Account Restriction & Iraq Billing Wall

> Last updated: 2026-11-03
> Purpose: Why `tutelage.it.team@gmail.com` cannot use the Gemini API, and the ordered plan to fix it

---

## Current State

Both AI Studio projects on the business account show **Status: Restricted** and
**Billing Tier: "Free tier unavailable"**:

| Project | Project ID | Keys | Created |
|---|---|---|---|
| new tutelage ai | `new-tutelage-ai` | 1 | 2026-07-17 |
| Tutelage-AI-Project | `gen-lang-client-0660218243` | 2 | 2026-06-07 |

Every key from these projects returns `403 PERMISSION_DENIED — Your project has been
denied access`. This dates back to the July 2–10 account suspension and has not cleared
on its own in ~4 months.

**Production is unaffected today.** `GEMINI_API_KEY` on Render is Aland's *personal*
account key, which works on the free tier. This is migration debt tracked in `TASK.md`
Task 4 — the handover cannot complete while prod depends on a personal account.

---

## Two Separate Problems — Do Not Conflate Them

1. **The account restriction** (above) — blocks the *free* tier. Nothing to do with money.
2. **The Iraq billing wall** — blocks the *paid* tier. Google Cloud Billing's country
   selector does not list Iraq at all.

Fixing #1 restores free-tier Gemini and needs **no billing account whatsoever**. That is
why it is step one. #2 only matters the day free-tier rate limits are actually exceeded.

### Also not related: Google Sign-In

OAuth client IDs are free and never require a billing account. A restricted *Gemini*
project cannot break Google Sign-In. If Sign-In is failing, it is a client-ID or
authorized-origin problem — see `docs/handover/deployment-runbook.md`, not this file.

---

## Plan, In Order

### Step 1 — Harden the account (free, ~5 min, do this first)

Google support's standard guidance for `403 PERMISSION_DENIED` on a restricted project:

1. On `tutelage.it.team@gmail.com`: complete **phone verification**.
2. Enable **2-Step Verification**.
3. Create a **new API key** in AI Studio and retry.

This resolves a meaningful share of restriction cases on its own, because the restriction
is often an anti-abuse signal on an under-verified account rather than a deliberate ban.
Given the July suspension was itself a fraud-pattern flag, an under-verified account is a
plausible root cause here.

Also check the AI Studio **Projects** and **Billing** pages for an inline banner — when
Google does offer a self-serve appeal path, it appears there and nowhere else. Check the
business account's inbox too; next steps are sometimes emailed rather than shown in UI.

### Step 2 — Request manual review on the developer forum

**The dedicated 403 appeal form is closed.** The working route is a manual-review post on
the [Google AI Developers Forum](https://discuss.ai.google.dev/c/gemini-api/) under the
Gemini API category, where Googlers respond to these threads. Draft below.

### Step 3 — Only if paid tier is genuinely needed

The Iraq billing wall, with what is now known:

- **Payoneer virtual card — downgraded, do not lead with this.** Google Cloud's payment
  docs now state plainly that *"prepaid cards aren't accepted for payment."* A Payoneer
  virtual card is a prepaid instrument, so the July plan is a long shot, and a declined or
  flagged card on an account that was already suspended once carries real risk.
- **Wise — ruled out.** Does not serve Iraq residents.
- **Never fake a billing country** on the business account. That is the exact pattern that
  triggered the July suspension.
- **Realistic routes:** a Google Cloud reseller/partner that invoices in a supported
  country, or a genuine registered entity/bank account in a supported country.

### The pressure valve

Step 3 is unlikely to be needed soon. `ai.service.ts` now falls back to **OpenAI** for
FREE/GOLD when Gemini fails (logged loudly to Winston + Sentry), PREMIUM already runs on
OpenAI, and **OpenAI billing already works on the Iraqi business card**. So Google billing
is no longer on the critical path for uptime — only for cost.

---

## Draft — Forum Manual Review Request

> Post to https://discuss.ai.google.dev/c/gemini-api/ **from the business account**.
> Replace the bracketed values. Do not post the API keys themselves.

**Title:** Request for manual review — Gemini API projects restricted, 403 PERMISSION_DENIED

```
Hello,

I am requesting a manual review of two projects on my account that are marked
"Restricted" with "Free tier unavailable" in AI Studio. Every API key from them
returns 403 PERMISSION_DENIED, "Your project has been denied access."

Account:      tutelage.it.team@gmail.com
Projects:     new-tutelage-ai
              gen-lang-client-0660218243
First seen:   2026-07-17 (ongoing, ~4 months)
Error:        403 PERMISSION_DENIED — "Your project has been denied access.
              Please contact support."

What the account is used for:
We run Tutelage (https://ai.tutelage.krd), an English-as-a-second-language
tutoring platform for students in the Kurdistan Region of Iraq. The Gemini API
powers the conversational tutor. Usage is ordinary chat-completion traffic
within free-tier rate limits — no automation, resale, scraping, or redistribution
of model output.

Context I think is relevant:
This account had a suspension in early July 2026 which was subsequently lifted.
The project restrictions appear to date from that period and have not cleared
since, including on a project created fresh afterwards with no requests ever
sent from it.

Steps already taken:
- Completed phone verification and enabled 2-Step Verification on the account
- Created new API keys in AI Studio after doing so — still 403
- Confirmed the same code and request shape works on a different Google account,
  so this is account/project-scoped rather than a client bug

I am not asking to enable paid billing; I am asking for a review of the free-tier
access restriction on these projects. Note that Google Cloud Billing does not
offer Iraq as a billing country, so enabling billing is not available to me as a
self-serve remedy.

Happy to provide any identifying details privately. Thank you.
```

**Before posting:** actually complete Step 1, so the "steps already taken" section is
true. If phone/2SV verification alone clears the 403, no post is needed.
