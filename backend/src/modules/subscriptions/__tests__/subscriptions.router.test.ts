import { describe, it, expect, beforeEach, afterEach, afterAll, spyOn } from "bun:test";
import type { Mock } from "bun:test";
import {
  app,
  request,
  prisma,
  createTestUser,
  deleteTestUsers,
  uniqueId,
  type TestUser,
} from "../../../test/helpers.ts";
import { fib } from "../../../config/fib.ts";
import { FibSubscribeError } from "../../../lib/fib-client.ts";
import type { SubscriptionDetails } from "../../../lib/fib-client.ts";

// ─────────────────────────────────────────────────────────────────────────────
// FIB Subscription routes
//   POST   /api/v1/subscriptions/initiate-fib
//   GET    /api/v1/subscriptions/fib/:subscriptionId/status
//   DELETE /api/v1/subscriptions/fib/:subscriptionId
//   POST   /api/v1/subscriptions/webhook/fib
//
// The fib singleton is a real FibClient (non-null) because setup.ts preloads
// FIB_CLIENT_ID + FIB_CLIENT_SECRET. Every test spies on the three public
// methods so no actual HTTP call to fib-stage.fib.iq is ever made.
// ─────────────────────────────────────────────────────────────────────────────

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_CREATE_RESULT = {
  subscriptionId: "fib-sub-test-001",
  readableCode: "GOLD-AB12",
  qrCode: "data:image/png;base64,iVBORw0KGgoAAAANS",
  appLink: "https://fib-stage.fib.iq/app/pay/fib-sub-test-001",
  validUntil: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
};

function mockDetails(
  status: SubscriptionDetails["status"],
  activeUntil: number | null = null,
): SubscriptionDetails {
  return {
    id: "fib-sub-test-001",
    readableCode: "GOLD-AB12",
    title: "Tutelage GOLD",
    monetaryValue: { amount: 25_000, currency: "IQD" },
    interval: "P1M",
    status,
    activeUntil,
    lastPaymentAt: null,
  };
}

function makeFibError(message: string, statusCode = 400): FibSubscribeError {
  return new FibSubscribeError(message, statusCode, { error: message });
}

// ── DB helpers ────────────────────────────────────────────────────────────────

async function makeFibRecord(
  userId: string,
  overrides: Record<string, unknown> = {},
) {
  return prisma.fibSubscription.create({
    data: {
      userId,
      fibSubscriptionId: `fib-${uniqueId()}`,
      plan: "GOLD",
      intervalMonths: 1,
      amountIQD: 25_000,
      fibStatus: "DRAFT",
      validUntil: new Date(Date.now() + 36 * 60 * 60 * 1000),
      // Payment artifacts — a DRAFT without these is a pre-migration row and is
      // treated as unresumable (see the "legacy row" test below)
      qrCode: MOCK_CREATE_RESULT.qrCode,
      readableCode: MOCK_CREATE_RESULT.readableCode,
      appLink: MOCK_CREATE_RESULT.appLink,
      ...overrides,
    },
  });
}

async function getSubscription(userId: string) {
  return prisma.subscription.findUnique({ where: { userId } });
}

// ── Spy management ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMock = Mock<any>;

let createSpy: AnyMock;
let getSpy: AnyMock;
let cancelSpy: AnyMock;

beforeEach(() => {
  // Replace all three public FibClient methods with spies. The service imports
  // the same fib singleton so these intercept every call — no network hit.
  //
  // createSubscription uses mockImplementation (not mockResolvedValue) so that
  // each call gets a unique subscriptionId — prevents unique-constraint collisions
  // when multiple initiate-fib tests run against the same test DB.
  createSpy = spyOn(fib!, "createSubscription").mockImplementation(async () => ({
    ...MOCK_CREATE_RESULT,
    subscriptionId: `fib-mock-${uniqueId()}`,
  }));
  getSpy    = spyOn(fib!, "getSubscription").mockResolvedValue(mockDetails("DRAFT"));
  cancelSpy = spyOn(fib!, "cancelSubscription").mockResolvedValue(null);
});

afterEach(() => {
  createSpy.mockRestore();
  getSpy.mockRestore();
  cancelSpy.mockRestore();
});

// ── Cleanup ───────────────────────────────────────────────────────────────────

const createdUserIds: string[] = [];
const track = (u: TestUser) => (createdUserIds.push(u.id), u);
const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

afterAll(async () => {
  await deleteTestUsers(createdUserIds);
  await prisma.$disconnect();
});

// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/v1/subscriptions/initiate-fib", () => {
  it("201 — GOLD/1mo: FIB called, DB row created, response has all 5 fields", async () => {
    const u = track(await createTestUser({ plan: "FREE", status: "ACTIVE" }));

    const res = await request(app)
      .post("/api/v1/subscriptions/initiate-fib")
      .set(auth(u.token))
      .send({ plan: "GOLD", intervalMonths: 1 });

    expect(res.status).toBe(201);
    // Shape check — subscriptionId is unique per call so we only verify the other fields
    expect(res.body.data).toMatchObject({
      readableCode: MOCK_CREATE_RESULT.readableCode,
      qrCode: MOCK_CREATE_RESULT.qrCode,
      appLink: MOCK_CREATE_RESULT.appLink,
      validUntil: MOCK_CREATE_RESULT.validUntil,
    });
    expect(typeof res.body.data.fibSubscriptionId).toBe("string");

    // Correct amount and interval forwarded to FIB
    expect(createSpy).toHaveBeenCalledTimes(1);
    const callArg = createSpy.mock.calls[0]![0] as { amount: number; interval: string };
    expect(callArg.amount).toBe(25_000);
    expect(callArg.interval).toBe("P1M");

    // FibSubscription row persisted (query by the ID returned in the response)
    const createdId: string = res.body.data.fibSubscriptionId;
    const record = await prisma.fibSubscription.findUnique({
      where: { fibSubscriptionId: createdId },
    });
    expect(record).not.toBeNull();
    expect(record!.userId).toBe(u.id);
    expect(record!.plan).toBe("GOLD");
    expect(record!.amountIQD).toBe(25_000);
    expect(record!.fibStatus).toBe("DRAFT");
  });

  it("201 — PREMIUM/12mo: correct amountIQD=440,000 and interval=P1Y forwarded", async () => {
    const u = track(await createTestUser({ plan: "FREE", status: "ACTIVE" }));

    const res = await request(app)
      .post("/api/v1/subscriptions/initiate-fib")
      .set(auth(u.token))
      .send({ plan: "PREMIUM", intervalMonths: 12 });

    expect(res.status).toBe(201);
    const callArg = createSpy.mock.calls[0]![0] as { amount: number; interval: string };
    expect(callArg.amount).toBe(440_000);
    expect(callArg.interval).toBe("P1Y");
  });

  it("201 — FREE/INACTIVE user (unverified) can initiate a subscription", async () => {
    const u = track(await createTestUser({ plan: "FREE", status: "INACTIVE" }));

    const res = await request(app)
      .post("/api/v1/subscriptions/initiate-fib")
      .set(auth(u.token))
      .send({ plan: "GOLD", intervalMonths: 1 });

    expect(res.status).toBe(201);
  });

  it("409 — pending DRAFT for a DIFFERENT plan: blocked, but returns pendingFib so the UI can resume/cancel it", async () => {
    const u = track(await createTestUser({ plan: "FREE", status: "ACTIVE" }));
    const draft = await makeFibRecord(u.id, { fibStatus: "DRAFT" }); // GOLD/1mo pending

    const res = await request(app)
      .post("/api/v1/subscriptions/initiate-fib")
      .set(auth(u.token))
      .send({ plan: "PREMIUM", intervalMonths: 1 });

    expect(res.status).toBe(409);
    expect(createSpy).not.toHaveBeenCalled(); // must not reach FIB
    // Without this the user is dead-ended: the QR is gone and nothing identifies
    // the payment that is blocking them.
    expect(res.body.pendingFib).toMatchObject({
      fibSubscriptionId: draft.fibSubscriptionId,
      plan: "GOLD",
      intervalMonths: 1,
    });
  });

  it("201 — pending DRAFT for the SAME plan/interval: hands back the existing payment, no second FIB subscription", async () => {
    const u = track(await createTestUser({ plan: "FREE", status: "ACTIVE" }));
    const draft = await makeFibRecord(u.id, { fibStatus: "DRAFT" }); // GOLD/1mo

    const res = await request(app)
      .post("/api/v1/subscriptions/initiate-fib")
      .set(auth(u.token))
      .send({ plan: "GOLD", intervalMonths: 1 });

    expect(res.status).toBe(201);
    expect(createSpy).not.toHaveBeenCalled(); // idempotent — never a 2nd payable subscription
    expect(res.body.data).toMatchObject({
      fibSubscriptionId: draft.fibSubscriptionId,
      qrCode: MOCK_CREATE_RESULT.qrCode,
      plan: "GOLD",
      intervalMonths: 1,
      amountIQD: 25_000,
      resumed: true,
    });
  });

  it("201 — expired DRAFT is swept and a fresh payment is created", async () => {
    const u = track(await createTestUser({ plan: "FREE", status: "ACTIVE" }));
    const stale = await makeFibRecord(u.id, {
      fibStatus: "DRAFT",
      validUntil: new Date(Date.now() - 60 * 60 * 1000), // died at FIB an hour ago
    });

    const res = await request(app)
      .post("/api/v1/subscriptions/initiate-fib")
      .set(auth(u.token))
      .send({ plan: "GOLD", intervalMonths: 1 });

    expect(res.status).toBe(201);
    expect(res.body.data.resumed).toBe(false);
    expect(createSpy).toHaveBeenCalledTimes(1);

    const swept = await prisma.fibSubscription.findUnique({
      where: { fibSubscriptionId: stale.fibSubscriptionId },
    });
    expect(swept!.fibStatus).toBe("CANCELLED");
  });

  it("201 — DRAFT with no stored QR (pre-migration row) is discarded, not left blocking forever", async () => {
    const u = track(await createTestUser({ plan: "FREE", status: "ACTIVE" }));
    const legacy = await makeFibRecord(u.id, {
      fibStatus: "DRAFT",
      qrCode: null,
      readableCode: null,
      appLink: null,
    });

    const res = await request(app)
      .post("/api/v1/subscriptions/initiate-fib")
      .set(auth(u.token))
      .send({ plan: "PREMIUM", intervalMonths: 1 });

    expect(res.status).toBe(201);
    expect(createSpy).toHaveBeenCalledTimes(1);

    const discarded = await prisma.fibSubscription.findUnique({
      where: { fibSubscriptionId: legacy.fibSubscriptionId },
    });
    expect(discarded!.fibStatus).toBe("CANCELLED");
  });

  it("409 — already has ACTIVE FIB subscription", async () => {
    const u = track(
      await createTestUser({ plan: "GOLD", status: "ACTIVE", paymentProvider: "FIB" }),
    );

    const res = await request(app)
      .post("/api/v1/subscriptions/initiate-fib")
      .set(auth(u.token))
      .send({ plan: "PREMIUM", intervalMonths: 1 });

    expect(res.status).toBe(409);
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("409 — already has ACTIVE CASH subscription (admin-managed)", async () => {
    const u = track(
      await createTestUser({ plan: "GOLD", status: "ACTIVE", paymentProvider: "CASH" }),
    );

    const res = await request(app)
      .post("/api/v1/subscriptions/initiate-fib")
      .set(auth(u.token))
      .send({ plan: "PREMIUM", intervalMonths: 1 });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/admin/i);
  });

  it("409 — already has ACTIVE STRIPE subscription", async () => {
    const u = track(
      await createTestUser({ plan: "PREMIUM", status: "ACTIVE", paymentProvider: "STRIPE" }),
    );

    const res = await request(app)
      .post("/api/v1/subscriptions/initiate-fib")
      .set(auth(u.token))
      .send({ plan: "GOLD", intervalMonths: 1 });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/stripe/i);
  });

  it("422 — invalid plan value", async () => {
    const u = track(await createTestUser());

    const res = await request(app)
      .post("/api/v1/subscriptions/initiate-fib")
      .set(auth(u.token))
      .send({ plan: "BASIC", intervalMonths: 1 });

    expect(res.status).toBe(422);
  });

  it("422 — invalid intervalMonths (2 is not in [1,3,6,12])", async () => {
    const u = track(await createTestUser());

    const res = await request(app)
      .post("/api/v1/subscriptions/initiate-fib")
      .set(auth(u.token))
      .send({ plan: "GOLD", intervalMonths: 2 });

    expect(res.status).toBe(422);
  });

  it("422 — missing body fields", async () => {
    const u = track(await createTestUser());

    const res = await request(app)
      .post("/api/v1/subscriptions/initiate-fib")
      .set(auth(u.token))
      .send({});

    expect(res.status).toBe(422);
  });

  it("502 — FIB createSubscription throws FibSubscribeError → mapped to 502", async () => {
    const u = track(await createTestUser({ plan: "FREE", status: "ACTIVE" }));
    createSpy.mockRejectedValue(makeFibError("INVALID_REQUEST", 400));

    const res = await request(app)
      .post("/api/v1/subscriptions/initiate-fib")
      .set(auth(u.token))
      .send({ plan: "GOLD", intervalMonths: 1 });

    expect(res.status).toBe(502);
  });

  it("401 — no token", async () => {
    const res = await request(app)
      .post("/api/v1/subscriptions/initiate-fib")
      .send({ plan: "GOLD", intervalMonths: 1 });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/v1/subscriptions/fib/pending", () => {
  it("200 — returns the pending payment so a closed QR dialog can be reopened", async () => {
    const u = track(await createTestUser({ plan: "FREE", status: "ACTIVE" }));
    const draft = await makeFibRecord(u.id, { fibStatus: "DRAFT" });

    const res = await request(app)
      .get("/api/v1/subscriptions/fib/pending")
      .set(auth(u.token));

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      fibSubscriptionId: draft.fibSubscriptionId,
      qrCode: MOCK_CREATE_RESULT.qrCode,
      readableCode: MOCK_CREATE_RESULT.readableCode,
      plan: "GOLD",
      resumed: true,
    });
  });

  it("200 — null when there is nothing pending", async () => {
    const u = track(await createTestUser({ plan: "FREE", status: "ACTIVE" }));

    const res = await request(app)
      .get("/api/v1/subscriptions/fib/pending")
      .set(auth(u.token));

    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });

  it("200 — an expired DRAFT is swept and reported as nothing pending", async () => {
    const u = track(await createTestUser({ plan: "FREE", status: "ACTIVE" }));
    const stale = await makeFibRecord(u.id, {
      fibStatus: "DRAFT",
      validUntil: new Date(Date.now() - 60 * 60 * 1000),
    });

    const res = await request(app)
      .get("/api/v1/subscriptions/fib/pending")
      .set(auth(u.token));

    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();

    const swept = await prisma.fibSubscription.findUnique({
      where: { fibSubscriptionId: stale.fibSubscriptionId },
    });
    expect(swept!.fibStatus).toBe("CANCELLED");
  });

  it("200 — never leaks another user's pending payment", async () => {
    const owner = track(await createTestUser({ plan: "FREE", status: "ACTIVE" }));
    const other = track(await createTestUser({ plan: "FREE", status: "ACTIVE" }));
    await makeFibRecord(owner.id, { fibStatus: "DRAFT" });

    const res = await request(app)
      .get("/api/v1/subscriptions/fib/pending")
      .set(auth(other.token));

    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });

  it("401 — unauthenticated", async () => {
    const res = await request(app).get("/api/v1/subscriptions/fib/pending");
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/v1/subscriptions/fib/:subscriptionId/status", () => {
  it("200 — DRAFT: correct fields returned, user subscription unchanged", async () => {
    const u = track(await createTestUser({ plan: "FREE", status: "ACTIVE" }));
    const record = await makeFibRecord(u.id);
    getSpy.mockResolvedValue(mockDetails("DRAFT"));

    const res = await request(app)
      .get(`/api/v1/subscriptions/fib/${record.fibSubscriptionId}/status`)
      .set(auth(u.token));

    expect(res.status).toBe(200);
    expect(res.body.data.fibStatus).toBe("DRAFT");
    expect(res.body.data.plan).toBe("GOLD");
    expect(res.body.data.intervalMonths).toBe(1);
    expect(res.body.data.amountIQD).toBe(25_000);

    // Subscription not yet upgraded
    const sub = await getSubscription(u.id);
    expect(sub?.plan).toBe("FREE");
    expect(sub?.paymentProvider).toBeNull();
  });

  it("200 — DRAFT→ACTIVE: subscription upgraded (plan=GOLD, paymentProvider=FIB)", async () => {
    const u = track(await createTestUser({ plan: "FREE", status: "ACTIVE" }));
    const record = await makeFibRecord(u.id);
    const activeUntilMs = Date.now() + 30 * 24 * 60 * 60 * 1000;
    getSpy.mockResolvedValue(mockDetails("ACTIVE", activeUntilMs));

    const res = await request(app)
      .get(`/api/v1/subscriptions/fib/${record.fibSubscriptionId}/status`)
      .set(auth(u.token));

    expect(res.status).toBe(200);
    expect(res.body.data.fibStatus).toBe("ACTIVE");

    const sub = await getSubscription(u.id);
    expect(sub?.plan).toBe("GOLD");
    expect(sub?.status).toBe("ACTIVE");
    expect(sub?.paymentProvider).toBe("FIB");
    expect(sub?.externalSubscriptionId).toBe(record.fibSubscriptionId);
  });

  it("200 — activeUntil propagated to subscription.currentPeriodEnd", async () => {
    const u = track(await createTestUser({ plan: "FREE", status: "ACTIVE" }));
    const record = await makeFibRecord(u.id);
    const activeUntilMs = Date.now() + 30 * 24 * 60 * 60 * 1000;
    getSpy.mockResolvedValue(mockDetails("ACTIVE", activeUntilMs));

    await request(app)
      .get(`/api/v1/subscriptions/fib/${record.fibSubscriptionId}/status`)
      .set(auth(u.token));

    const sub = await getSubscription(u.id);
    expect(sub?.currentPeriodEnd).not.toBeNull();
    expect(Math.abs(sub!.currentPeriodEnd!.getTime() - activeUntilMs)).toBeLessThan(2000);
  });

  it("200 — ACTIVE→ACTIVE (same status): idempotent, plan stays GOLD", async () => {
    const u = track(
      await createTestUser({ plan: "GOLD", status: "ACTIVE", paymentProvider: "FIB" }),
    );
    const record = await makeFibRecord(u.id, { fibStatus: "ACTIVE" });
    getSpy.mockResolvedValue(mockDetails("ACTIVE"));

    const res = await request(app)
      .get(`/api/v1/subscriptions/fib/${record.fibSubscriptionId}/status`)
      .set(auth(u.token));

    expect(res.status).toBe(200);
    const sub = await getSubscription(u.id);
    expect(sub?.plan).toBe("GOLD"); // unchanged — early return in applyFibStatusChange
  });

  it("200 — ACTIVE→CANCELLED: subscription downgraded to FREE", async () => {
    const u = track(
      await createTestUser({ plan: "GOLD", status: "ACTIVE", paymentProvider: "FIB" }),
    );
    const record = await makeFibRecord(u.id, { fibStatus: "ACTIVE" });
    getSpy.mockResolvedValue(mockDetails("CANCELLED"));

    await request(app)
      .get(`/api/v1/subscriptions/fib/${record.fibSubscriptionId}/status`)
      .set(auth(u.token));

    const sub = await getSubscription(u.id);
    expect(sub?.plan).toBe("FREE");
    expect(sub?.status).toBe("ACTIVE");
    expect(sub?.paymentProvider).toBeNull();
    expect(sub?.externalSubscriptionId).toBeNull();
  });

  it("404 — FibSubscription not in DB", async () => {
    const u = track(await createTestUser());

    const res = await request(app)
      .get("/api/v1/subscriptions/fib/nonexistent-sub-id/status")
      .set(auth(u.token));

    expect(res.status).toBe(404);
    expect(getSpy).not.toHaveBeenCalled();
  });

  it("404 — FibSubscription belongs to another user (ownership check)", async () => {
    const owner = track(await createTestUser({ plan: "FREE", status: "ACTIVE" }));
    const attacker = track(await createTestUser());
    const record = await makeFibRecord(owner.id);

    const res = await request(app)
      .get(`/api/v1/subscriptions/fib/${record.fibSubscriptionId}/status`)
      .set(auth(attacker.token));

    expect(res.status).toBe(404);
    expect(getSpy).not.toHaveBeenCalled();
  });

  it("502 — FIB getSubscription throws FibSubscribeError", async () => {
    const u = track(await createTestUser({ plan: "FREE", status: "ACTIVE" }));
    const record = await makeFibRecord(u.id);
    getSpy.mockRejectedValue(makeFibError("FIB_UNAVAILABLE", 503));

    const res = await request(app)
      .get(`/api/v1/subscriptions/fib/${record.fibSubscriptionId}/status`)
      .set(auth(u.token));

    expect(res.status).toBe(502);
  });

  it("401 — no token", async () => {
    const res = await request(app).get("/api/v1/subscriptions/fib/any-id/status");
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Recurring FIB charges (status unchanged, activeUntil moves)", () => {
  it("200 — does not revert a plan an admin has taken over", async () => {
    // An admin assigned CASH PREMIUM on top of a live FIB GOLD sub. A renewal poll
    // used to force plan/provider back to GOLD/FIB, silently undoing that decision.
    const end = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const u = track(
      await createTestUser({
        plan: "PREMIUM",
        status: "ACTIVE",
        paymentProvider: "CASH",
        currentPeriodEnd: end,
      }),
    );
    const record = await makeFibRecord(u.id, { fibStatus: "ACTIVE" }); // GOLD at FIB

    getSpy.mockResolvedValue(mockDetails("ACTIVE", Date.now() + 40 * 24 * 60 * 60 * 1000));

    await request(app)
      .get(`/api/v1/subscriptions/fib/${record.fibSubscriptionId}/status`)
      .set(auth(u.token));

    const sub = await getSubscription(u.id);
    expect(sub?.plan).toBe("PREMIUM");            // admin's decision intact
    expect(sub?.paymentProvider).toBe("CASH");
    expect(sub?.currentPeriodEnd?.getTime()).toBe(end.getTime());
  });

  // FIB subscriptions recur, and a renewal charge extends activeUntil WITHOUT changing
  // the status. applyFibStatusChange used to early-return on an unchanged status, so
  // currentPeriodEnd went stale while FIB kept charging — and the expiry sweep then
  // downgraded a paying customer to FREE.
  it("200 — ACTIVE→ACTIVE with a later activeUntil extends currentPeriodEnd", async () => {
    const oldEnd = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const u = track(
      await createTestUser({
        plan: "GOLD",
        status: "ACTIVE",
        paymentProvider: "FIB",
        currentPeriodEnd: oldEnd,
      }),
    );
    const record = await makeFibRecord(u.id, { fibStatus: "ACTIVE" });

    const renewedUntil = Date.now() + 32 * 24 * 60 * 60 * 1000;
    getSpy.mockResolvedValue(mockDetails("ACTIVE", renewedUntil));

    const res = await request(app)
      .get(`/api/v1/subscriptions/fib/${record.fibSubscriptionId}/status`)
      .set(auth(u.token));

    expect(res.status).toBe(200);

    const sub = await getSubscription(u.id);
    expect(sub?.plan).toBe("GOLD");
    expect(sub?.status).toBe("ACTIVE");
    expect(sub?.currentPeriodEnd?.getTime()).toBe(renewedUntil); // renewal applied
  });

  it("200 — does not extend a subscription the user has cancelled", async () => {
    // We already told FIB to stop charging; a stale activeUntil must not resurrect it.
    const end = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const u = track(
      await createTestUser({
        plan: "GOLD",
        status: "ACTIVE",
        paymentProvider: "FIB",
        currentPeriodEnd: end,
      }),
    );
    await prisma.subscription.update({
      where: { userId: u.id },
      data: { cancelAtPeriodEnd: true },
    });
    const record = await makeFibRecord(u.id, { fibStatus: "ACTIVE" });

    getSpy.mockResolvedValue(mockDetails("ACTIVE", Date.now() + 40 * 24 * 60 * 60 * 1000));

    await request(app)
      .get(`/api/v1/subscriptions/fib/${record.fibSubscriptionId}/status`)
      .set(auth(u.token));

    const sub = await getSubscription(u.id);
    expect(sub?.currentPeriodEnd?.getTime()).toBe(end.getTime()); // unchanged
  });

  it("200 — never pulls currentPeriodEnd backwards on a stale read", async () => {
    const end = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000);
    const u = track(
      await createTestUser({
        plan: "GOLD",
        status: "ACTIVE",
        paymentProvider: "FIB",
        currentPeriodEnd: end,
      }),
    );
    const record = await makeFibRecord(u.id, { fibStatus: "ACTIVE" });

    getSpy.mockResolvedValue(mockDetails("ACTIVE", Date.now() + 5 * 24 * 60 * 60 * 1000));

    await request(app)
      .get(`/api/v1/subscriptions/fib/${record.fibSubscriptionId}/status`)
      .set(auth(u.token));

    const sub = await getSubscription(u.id);
    expect(sub?.currentPeriodEnd?.getTime()).toBe(end.getTime()); // not shortened
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("DELETE /api/v1/subscriptions/fib/:subscriptionId", () => {
  it("200 — cancel ACTIVE sub: FIB cancel called, fibStatus=CANCELLED, plan→FREE", async () => {
    const u = track(
      await createTestUser({ plan: "GOLD", status: "ACTIVE", paymentProvider: "FIB" }),
    );
    const record = await makeFibRecord(u.id, { fibStatus: "ACTIVE" });

    const res = await request(app)
      .delete(`/api/v1/subscriptions/fib/${record.fibSubscriptionId}`)
      .set(auth(u.token));

    expect(res.status).toBe(200);
    expect(cancelSpy).toHaveBeenCalledTimes(1);
    expect(cancelSpy).toHaveBeenCalledWith(record.fibSubscriptionId);

    const fibRecord = await prisma.fibSubscription.findUnique({ where: { id: record.id } });
    expect(fibRecord?.fibStatus).toBe("CANCELLED");
    expect(fibRecord?.cancelledAt).not.toBeNull();

    const sub = await getSubscription(u.id);
    expect(sub?.plan).toBe("FREE");
    expect(sub?.paymentProvider).toBeNull();
  });

  it("200 — cancel TRIAL sub: FIB cancel called (same path as ACTIVE)", async () => {
    const u = track(
      await createTestUser({ plan: "GOLD", status: "ACTIVE", paymentProvider: "FIB" }),
    );
    const record = await makeFibRecord(u.id, { fibStatus: "TRIAL" });

    const res = await request(app)
      .delete(`/api/v1/subscriptions/fib/${record.fibSubscriptionId}`)
      .set(auth(u.token));

    expect(res.status).toBe(200);
    expect(cancelSpy).toHaveBeenCalledTimes(1);
  });

  it("200 — cancel unpaid DRAFT: verifies with FIB, no cancel call, user plan unchanged", async () => {
    // DRAFT = not paid yet — calling FIB's cancel on a DRAFT is an illegal status
    // transition (FIB returns 400). We verify with FIB, then discard locally.
    const u = track(await createTestUser({ plan: "FREE", status: "ACTIVE" }));
    const record = await makeFibRecord(u.id, { fibStatus: "DRAFT" });
    getSpy.mockResolvedValue(mockDetails("DRAFT")); // FIB confirms still unpaid

    const res = await request(app)
      .delete(`/api/v1/subscriptions/fib/${record.fibSubscriptionId}`)
      .set(auth(u.token));

    expect(res.status).toBe(200);
    expect(getSpy).toHaveBeenCalled();          // must confirm it really is unpaid
    expect(cancelSpy).not.toHaveBeenCalled();   // critical — no illegal FIB cancel

    const fibRecord = await prisma.fibSubscription.findUnique({ where: { id: record.id } });
    expect(fibRecord?.fibStatus).toBe("CANCELLED");

    const sub = await getSubscription(u.id);
    expect(sub?.plan).toBe("FREE"); // DRAFT never activated plan — unchanged
  });

  it("409 — cancelling a DRAFT that was paid in the meantime activates it instead of discarding the payment", async () => {
    // The race that used to eat a real payment: user scans the QR, pays, then hits
    // Cancel before FIB's callback lands. Discarding locally would leave FIB holding
    // the money with no plan granted and no DRAFT left for the reconcile job to fix.
    const u = track(await createTestUser({ plan: "FREE", status: "ACTIVE" }));
    const record = await makeFibRecord(u.id, { fibStatus: "DRAFT" });
    const activeUntil = Date.now() + 30 * 24 * 60 * 60 * 1000;
    getSpy.mockResolvedValue(mockDetails("ACTIVE", activeUntil)); // paid just now

    const res = await request(app)
      .delete(`/api/v1/subscriptions/fib/${record.fibSubscriptionId}`)
      .set(auth(u.token));

    expect(res.status).toBe(409);
    expect(cancelSpy).not.toHaveBeenCalled();

    const fibRecord = await prisma.fibSubscription.findUnique({ where: { id: record.id } });
    expect(fibRecord?.fibStatus).toBe("ACTIVE"); // activated, NOT cancelled

    const sub = await getSubscription(u.id);
    expect(sub?.plan).toBe("GOLD");
    expect(sub?.status).toBe("ACTIVE");
    expect(sub?.paymentProvider).toBe("FIB");
  });

  it("503 — refuses to cancel a DRAFT when FIB is unreachable (never discards a possible payment)", async () => {
    const u = track(await createTestUser({ plan: "FREE", status: "ACTIVE" }));
    const record = await makeFibRecord(u.id, { fibStatus: "DRAFT" });
    getSpy.mockRejectedValue(makeFibError("FIB unavailable", 500));

    const res = await request(app)
      .delete(`/api/v1/subscriptions/fib/${record.fibSubscriptionId}`)
      .set(auth(u.token));

    expect(res.status).toBe(503);

    const fibRecord = await prisma.fibSubscription.findUnique({ where: { id: record.id } });
    expect(fibRecord?.fibStatus).toBe("DRAFT"); // untouched — safe to retry
  });

  it("200 — cancelling an ACTIVE plan keeps it until currentPeriodEnd (no refund, no instant downgrade)", async () => {
    // Policy: cancelling stops future charges but the user keeps what they paid for.
    // This used to set plan=FREE + currentPeriodEnd=now immediately, silently taking
    // away days already paid for — and contradicting the UI's "you'll keep access
    // until <date>" copy.
    const periodEnd = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
    const u = track(
      await createTestUser({
        plan: "GOLD",
        status: "ACTIVE",
        paymentProvider: "FIB",
        currentPeriodEnd: periodEnd,
      }),
    );
    const record = await makeFibRecord(u.id, { fibStatus: "ACTIVE" });

    const res = await request(app)
      .delete(`/api/v1/subscriptions/fib/${record.fibSubscriptionId}`)
      .set(auth(u.token));

    expect(res.status).toBe(200);
    expect(cancelSpy).toHaveBeenCalledTimes(1); // renewal stopped at FIB

    const sub = await getSubscription(u.id);
    expect(sub?.plan).toBe("GOLD");             // still paid up
    expect(sub?.status).toBe("ACTIVE");
    expect(sub?.cancelAtPeriodEnd).toBe(true);  // will drop to FREE at period end
    expect(sub?.currentPeriodEnd?.getTime()).toBe(periodEnd.getTime()); // not shortened
  });

  it("200 — cancelling with no paid time left downgrades immediately", async () => {
    // Guards the null/expired currentPeriodEnd case: without this the plan would stay
    // ACTIVE forever, since the expiry sweep keys off currentPeriodEnd.
    const u = track(
      await createTestUser({
        plan: "GOLD",
        status: "ACTIVE",
        paymentProvider: "FIB",
        currentPeriodEnd: null,
      }),
    );
    const record = await makeFibRecord(u.id, { fibStatus: "ACTIVE" });

    const res = await request(app)
      .delete(`/api/v1/subscriptions/fib/${record.fibSubscriptionId}`)
      .set(auth(u.token));

    expect(res.status).toBe(200);
    const sub = await getSubscription(u.id);
    expect(sub?.plan).toBe("FREE");
    expect(sub?.cancelAtPeriodEnd).toBe(false);
  });

  it("409 — already CANCELLED", async () => {
    const u = track(await createTestUser({ plan: "FREE", status: "ACTIVE" }));
    const record = await makeFibRecord(u.id, {
      fibStatus: "CANCELLED",
      cancelledAt: new Date(),
    });

    const res = await request(app)
      .delete(`/api/v1/subscriptions/fib/${record.fibSubscriptionId}`)
      .set(auth(u.token));

    expect(res.status).toBe(409);
    expect(cancelSpy).not.toHaveBeenCalled();
  });

  it("409 — already REJECTED", async () => {
    const u = track(await createTestUser({ plan: "FREE", status: "ACTIVE" }));
    const record = await makeFibRecord(u.id, { fibStatus: "REJECTED" });

    const res = await request(app)
      .delete(`/api/v1/subscriptions/fib/${record.fibSubscriptionId}`)
      .set(auth(u.token));

    expect(res.status).toBe(409);
  });

  it("404 — FibSubscription not in DB", async () => {
    const u = track(await createTestUser());

    const res = await request(app)
      .delete("/api/v1/subscriptions/fib/nonexistent-id")
      .set(auth(u.token));

    expect(res.status).toBe(404);
  });

  it("404 — FibSubscription belongs to another user (ownership check)", async () => {
    const owner = track(
      await createTestUser({ plan: "GOLD", status: "ACTIVE", paymentProvider: "FIB" }),
    );
    const attacker = track(await createTestUser());
    const record = await makeFibRecord(owner.id, { fibStatus: "ACTIVE" });

    const res = await request(app)
      .delete(`/api/v1/subscriptions/fib/${record.fibSubscriptionId}`)
      .set(auth(attacker.token));

    expect(res.status).toBe(404);
    expect(cancelSpy).not.toHaveBeenCalled();
  });

  it("502 — FIB cancelSubscription throws FibSubscribeError (ACTIVE path)", async () => {
    const u = track(
      await createTestUser({ plan: "GOLD", status: "ACTIVE", paymentProvider: "FIB" }),
    );
    const record = await makeFibRecord(u.id, { fibStatus: "ACTIVE" });
    cancelSpy.mockRejectedValue(makeFibError("CANCEL_FAILED", 500));

    const res = await request(app)
      .delete(`/api/v1/subscriptions/fib/${record.fibSubscriptionId}`)
      .set(auth(u.token));

    expect(res.status).toBe(502);
  });

  it("401 — no token", async () => {
    const res = await request(app).delete("/api/v1/subscriptions/fib/any-id");
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/v1/subscriptions/webhook/fib", () => {
  // Webhook handler: sends 202 immediately, processes async in background.
  // We poll the DB (up to 5s, every 100ms) instead of using a fixed timeout — this
  // handles variable Neon network latency without making the suite artificially slow.
  async function waitForFibStatus(
    recordId: string,
    expected: string,
    timeoutMs = 5000,
  ): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const rec = await prisma.fibSubscription.findUnique({ where: { id: recordId } });
      if (rec?.fibStatus === expected) return;
      await new Promise<void>((r) => setTimeout(r, 100));
    }
    throw new Error(`waitForFibStatus: timed out waiting for fibStatus=${expected}`);
  }

  async function waitForPlan(userId: string, expected: string, timeoutMs = 5000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const sub = await prisma.subscription.findUnique({ where: { userId } });
      if (sub?.plan === expected) return;
      await new Promise<void>((r) => setTimeout(r, 100));
    }
    throw new Error(`waitForPlan: timed out waiting for plan=${expected}`);
  }

  // For no-op tests (where nothing should change), a short fixed wait is enough.
  const shortSettle = () => new Promise<void>((r) => setTimeout(r, 200));

  it("202 — DRAFT→ACTIVE: subscription upgraded after async processing", async () => {
    const u = track(await createTestUser({ plan: "FREE", status: "ACTIVE" }));
    const record = await makeFibRecord(u.id);
    const activeUntilMs = Date.now() + 30 * 24 * 60 * 60 * 1000;
    getSpy.mockResolvedValue(mockDetails("ACTIVE", activeUntilMs));

    const res = await request(app)
      .post("/api/v1/subscriptions/webhook/fib")
      .send({ subscriptionId: record.fibSubscriptionId, status: "ACTIVE" });

    expect(res.status).toBe(202);
    await waitForFibStatus(record.id, "ACTIVE");

    const sub = await getSubscription(u.id);
    expect(sub?.plan).toBe("GOLD");
    expect(sub?.status).toBe("ACTIVE");
    expect(sub?.paymentProvider).toBe("FIB");

    const fibRecord = await prisma.fibSubscription.findUnique({ where: { id: record.id } });
    expect(fibRecord?.fibStatus).toBe("ACTIVE");
    expect(fibRecord?.activatedAt).not.toBeNull();
  });

  it("202 — activates even when the user has NO Subscription row (payment must never be lost)", async () => {
    // Regression: applyFibStatusChange used prisma.subscription.update, which throws
    // P2025 when the row is missing and rolled back the WHOLE transaction — so the
    // FibSubscription stayed DRAFT while FIB had already taken the money, and the
    // reconcile cron then failed identically every 15 minutes forever.
    // A Subscription row is only created at registration, so any gap loses a payment.
    const u = track(await createTestUser({ plan: "FREE", status: "ACTIVE" }));
    await prisma.subscription.delete({ where: { userId: u.id } });

    const record = await makeFibRecord(u.id);
    const activeUntilMs = Date.now() + 30 * 24 * 60 * 60 * 1000;
    getSpy.mockResolvedValue(mockDetails("ACTIVE", activeUntilMs));

    const res = await request(app)
      .post("/api/v1/subscriptions/webhook/fib")
      .send({ subscriptionId: record.fibSubscriptionId, status: "ACTIVE" });

    expect(res.status).toBe(202);
    await waitForFibStatus(record.id, "ACTIVE");

    // The row is recreated by the upsert, with the paid plan applied
    const sub = await getSubscription(u.id);
    expect(sub).not.toBeNull();
    expect(sub?.plan).toBe("GOLD");
    expect(sub?.status).toBe("ACTIVE");
    expect(sub?.paymentProvider).toBe("FIB");
  });

  it("202 — DRAFT→CANCELLED: fibStatus updated, user plan stays FREE (was never activated)", async () => {
    const u = track(await createTestUser({ plan: "FREE", status: "ACTIVE" }));
    const record = await makeFibRecord(u.id);
    getSpy.mockResolvedValue(mockDetails("CANCELLED"));

    const res = await request(app)
      .post("/api/v1/subscriptions/webhook/fib")
      .send({ subscriptionId: record.fibSubscriptionId, status: "CANCELLED" });

    expect(res.status).toBe(202);
    await waitForFibStatus(record.id, "CANCELLED");

    const fibRecord = await prisma.fibSubscription.findUnique({ where: { id: record.id } });
    expect(fibRecord?.fibStatus).toBe("CANCELLED");

    const sub = await getSubscription(u.id);
    expect(sub?.plan).toBe("FREE"); // DRAFT never activated it
  });

  it("202 — ACTIVE→CANCELLED with no paid time left: downgraded to FREE immediately", async () => {
    // No currentPeriodEnd → nothing left to preserve, so the downgrade is immediate.
    // The complementary case (paid time remaining) is the test below.
    const u = track(
      await createTestUser({ plan: "GOLD", status: "ACTIVE", paymentProvider: "FIB" }),
    );
    const record = await makeFibRecord(u.id, { fibStatus: "ACTIVE" });
    getSpy.mockResolvedValue(mockDetails("CANCELLED"));

    const res = await request(app)
      .post("/api/v1/subscriptions/webhook/fib")
      .send({ subscriptionId: record.fibSubscriptionId, status: "CANCELLED" });

    expect(res.status).toBe(202);
    await waitForPlan(u.id, "FREE");

    const sub = await getSubscription(u.id);
    expect(sub?.plan).toBe("FREE");
    expect(sub?.paymentProvider).toBeNull();
    expect(sub?.cancelAtPeriodEnd).toBe(false);
  });

  it("202 — ACTIVE→CANCELLED with paid time left: keeps the plan until currentPeriodEnd", async () => {
    // Regression for the P1: the cancellation policy used to live ONLY in
    // cancelFibSubscription, so a CANCELLED arriving from FIB's side (user cancels in
    // the FIB app, or a recurring charge is REJECTED) still ran the old immediate
    // downgrade. The same user action wiped the remaining paid days depending purely
    // on which button they pressed. Both paths now share buildCancellationData.
    const periodEnd = new Date(Date.now() + 18 * 24 * 60 * 60 * 1000);
    const u = track(
      await createTestUser({
        plan: "GOLD",
        status: "ACTIVE",
        paymentProvider: "FIB",
        currentPeriodEnd: periodEnd,
      }),
    );
    const record = await makeFibRecord(u.id, { fibStatus: "ACTIVE" });
    getSpy.mockResolvedValue(mockDetails("CANCELLED"));

    const res = await request(app)
      .post("/api/v1/subscriptions/webhook/fib")
      .send({ subscriptionId: record.fibSubscriptionId, status: "CANCELLED" });

    expect(res.status).toBe(202);
    await waitForFibStatus(record.id, "CANCELLED");

    const sub = await getSubscription(u.id);
    expect(sub?.plan).toBe("GOLD");             // paid days preserved
    expect(sub?.status).toBe("ACTIVE");
    expect(sub?.cancelAtPeriodEnd).toBe(true);
    expect(sub?.currentPeriodEnd?.getTime()).toBe(periodEnd.getTime());
  });

  it("202 — unknown subscriptionId: silent no-op, FIB not queried", async () => {
    const res = await request(app)
      .post("/api/v1/subscriptions/webhook/fib")
      .send({ subscriptionId: "unknown-sub-xyz", status: "ACTIVE" });

    expect(res.status).toBe(202);
    await shortSettle();
    expect(getSpy).not.toHaveBeenCalled();
  });

  it("202 — FIB getSubscription throws: 202 still returned, DB unchanged", async () => {
    const u = track(await createTestUser({ plan: "FREE", status: "ACTIVE" }));
    const record = await makeFibRecord(u.id);
    getSpy.mockRejectedValue(new Error("network error"));

    const res = await request(app)
      .post("/api/v1/subscriptions/webhook/fib")
      .send({ subscriptionId: record.fibSubscriptionId, status: "ACTIVE" });

    expect(res.status).toBe(202);
    await shortSettle();

    // DB unchanged — error swallowed; reconcile job will retry
    const fibRecord = await prisma.fibSubscription.findUnique({ where: { id: record.id } });
    expect(fibRecord?.fibStatus).toBe("DRAFT");
  });

  it("202 — invalid body (missing subscriptionId): safeParse fails, silent no-op", async () => {
    const res = await request(app)
      .post("/api/v1/subscriptions/webhook/fib")
      .send({ status: "ACTIVE" }); // subscriptionId absent

    expect(res.status).toBe(202);
    await shortSettle();
    expect(getSpy).not.toHaveBeenCalled();
  });

  it("202 — empty body: silent no-op", async () => {
    const res = await request(app)
      .post("/api/v1/subscriptions/webhook/fib")
      .send({});

    expect(res.status).toBe(202);
    await shortSettle();
    expect(getSpy).not.toHaveBeenCalled();
  });
});
