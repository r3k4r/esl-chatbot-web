import { prisma } from "../../config/database.ts";
import { AppError } from "../../utils/AppError.ts";
import { Prisma, type PaymentProvider } from "@prisma/client";
import type { SubscriptionResult, AdminDashboardData } from "./admin.types.ts";
import type { UpdateUserBody, AssignSubscriptionBody, AdminUpdateProfileInput, AdminUpdateLearnerProfileInput } from "./admin.schema.ts";
import { uploadAvatar, deleteAvatar } from "../../config/storage.ts";
import { getMyProfile } from "../users/users.service.ts";
import { deleteCache, cacheKeys } from "../../config/cache.ts";

function computeEndDate(durationMonths: number): Date {
  // setUTCMonth avoids local-timezone overflow (e.g. Jan 31 + 1 month = Mar 3 in setMonth)
  const end = new Date();
  end.setUTCMonth(end.getUTCMonth() + durationMonths);
  return end;
}

// Maps validated string from schema to Prisma PaymentProvider enum value
function toPaymentProvider(value: PaymentProvider | undefined): PaymentProvider {
  return value ?? "CASH";
}

function isP2025(err: unknown): boolean {
  return (err as { code?: string }).code === "P2025";
}

// Internal (stealth) accounts must be indistinguishable from nonexistent users,
// even to admins — every admin mutation targeting one returns 404.
async function assertTargetNotInternal(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isInternal: true },
  });
  if (!user || user.isInternal) throw new AppError("User not found", 404);
}

export async function updateUser(id: string, data: UpdateUserBody, actorUserId: string) {
  const target = await prisma.user.findUnique({
    where: { id },
    select: { isInternal: true, role: true, isActive: true },
  });
  // Internal (stealth) targets are indistinguishable from nonexistent users.
  if (!target || target.isInternal) throw new AppError("User not found", 404);

  const demotingRole = data.role !== undefined && data.role !== "ADMIN";
  const deactivating = data.isActive === false;

  // Self-lockout guard: an admin must not be able to strip their own access,
  // which would instantly lock them out mid-request.
  if (actorUserId === id) {
    if (target.role === "ADMIN" && demotingRole) {
      throw new AppError("You cannot change your own admin role", 409);
    }
    if (deactivating) {
      throw new AppError("You cannot deactivate your own account", 409);
    }
  }

  // Last-admin guard: never let the final active (non-internal) admin be demoted
  // or deactivated — that would leave the platform with no usable admin and force
  // another raw-SQL bootstrap. Stealth admins are intentionally not counted here,
  // so the org always keeps at least one visible admin.
  if (target.role === "ADMIN" && (demotingRole || deactivating)) {
    const otherActiveAdmins = await prisma.user.count({
      where: { role: "ADMIN", isActive: true, isInternal: false, id: { not: id } },
    });
    if (otherActiveAdmins === 0) {
      throw new AppError("Cannot remove the last active admin", 409);
    }
  }

  try {
    const result = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        isActive: true,
        role: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
        subscription: { select: { plan: true, status: true, currentPeriodEnd: true } },
      },
    });
    // role or isActive change must be visible immediately on next page load
    await deleteCache(cacheKeys.authUser(id));
    return result;
  } catch (err) {
    if (isP2025(err)) throw new AppError("User not found", 404);
    throw err;
  }
}

export async function assignSubscription(
  userId: string,
  data: AssignSubscriptionBody,
): Promise<SubscriptionResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isInternal: true },
  });
  if (!user || user.isInternal) throw new AppError("User not found", 404);

  const now = new Date();
  const isPaidPlan = data.plan !== "FREE";

  // FREE plan is permanent — no period dates needed
  const currentPeriodStart = isPaidPlan ? now : null;
  const currentPeriodEnd = isPaidPlan
    ? (data.endDate ? new Date(data.endDate) : computeEndDate(data.durationMonths!))
    : null;

  const paymentProvider = toPaymentProvider(data.paymentProvider);

  const result = await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan: data.plan,
      status: "ACTIVE",
      currentPeriodStart,
      currentPeriodEnd,
      paymentProvider,
    },
    update: {
      plan: data.plan,
      status: "ACTIVE",
      currentPeriodStart,
      currentPeriodEnd,
      paymentProvider,
      externalCustomerId: null,
      externalSubscriptionId: null,
    },
    select: {
      id: true,
      plan: true,
      status: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      paymentProvider: true,
      updatedAt: true,
    },
  });

  await deleteCache(cacheKeys.authUser(userId));
  return result;
}

export async function getAdminDashboardStats(): Promise<AdminDashboardData> {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [usersByRole, subsByPlan, dailyUsers, weeklyUsers, totalSessionsToday, paymentByProvider] =
    await Promise.all([
      prisma.user.groupBy({ by: ["role"], where: { isInternal: false }, _count: { _all: true } }),
      prisma.subscription.groupBy({
        by: ["plan"],
        where: { status: "ACTIVE", user: { isInternal: false } },
        _count: { _all: true },
      }),
      prisma.conversationSession.findMany({
        where: { startedAt: { gte: todayStart }, user: { isInternal: false } },
        distinct: ["userId"],
        select: { userId: true },
      }),
      prisma.conversationSession.findMany({
        where: { startedAt: { gte: weekAgo }, user: { isInternal: false } },
        distinct: ["userId"],
        select: { userId: true },
      }),
      prisma.conversationSession.count({
        where: { startedAt: { gte: todayStart }, user: { isInternal: false } },
      }),
      prisma.subscription.groupBy({
        by: ["paymentProvider"],
        where: {
          status: "ACTIVE",
          plan: { not: "FREE" },
          paymentProvider: { not: null },
          user: { isInternal: false },
        },
        _count: { _all: true },
      }),
    ]);

  const roleMap = new Map(usersByRole.map((r) => [r.role, (r._count as { _all: number })._all]));
  const planMap = new Map(subsByPlan.map((s) => [s.plan, (s._count as { _all: number })._all]));
  const providerMap = Object.fromEntries(
    paymentByProvider
      .filter((p) => p.paymentProvider != null)
      .map((p) => [p.paymentProvider!, (p._count as { _all: number })._all]),
  );

  return {
    users: {
      total: Array.from(roleMap.values()).reduce((a, b) => a + b, 0),
      byRole: {
        STUDENT: roleMap.get("STUDENT") ?? 0,
        TUTOR: roleMap.get("TUTOR") ?? 0,
        ADMIN: roleMap.get("ADMIN") ?? 0,
      },
    },
    subscriptions: {
      FREE: planMap.get("FREE") ?? 0,
      GOLD: planMap.get("GOLD") ?? 0,
      PREMIUM: planMap.get("PREMIUM") ?? 0,
    },
    activeUsers: { daily: dailyUsers.length, weekly: weeklyUsers.length },
    totalSessionsToday,
    revenueByProvider: providerMap,
  };
}

export async function cancelSubscription(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isInternal: true, subscription: { select: { id: true } } },
  });
  if (!user || user.isInternal) throw new AppError("User not found", 404);
  if (!user.subscription) throw new AppError("User has no subscription to cancel", 404);

  // Downgrade to FREE ACTIVE — user retains AI access at FREE limits.
  // To block all access, use PATCH /admin/users/:id with isActive=false instead.
  await prisma.subscription.update({
    where: { userId },
    data: {
      plan: "FREE",
      status: "ACTIVE",
      currentPeriodEnd: null,
      currentPeriodStart: null,
      paymentProvider: null,
      externalCustomerId: null,
      externalSubscriptionId: null,
    },
  });

  await deleteCache(cacheKeys.authUser(userId));
}

export async function adminUpdateProfile(userId: string, input: AdminUpdateProfileInput) {
  await assertTargetNotInternal(userId);
  await prisma.user.update({ where: { id: userId }, data: input });
  await deleteCache(cacheKeys.authUser(userId));
  return getMyProfile(userId);
}

export async function adminUploadAvatar(userId: string, buffer: Buffer, mimeType: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isInternal: true, avatarUrl: true },
  });
  if (!user || user.isInternal) throw new AppError("User not found", 404);
  if (user.avatarUrl) {
    try { await deleteAvatar(user.avatarUrl); } catch {}
  }
  const avatarUrl = await uploadAvatar(buffer, userId, mimeType);
  await prisma.user.update({ where: { id: userId }, data: { avatarUrl } });
  await deleteCache(cacheKeys.authUser(userId));
  return { avatarUrl };
}

export async function adminUpdateLearnerProfile(userId: string, input: AdminUpdateLearnerProfileInput) {
  await assertTargetNotInternal(userId);

  // Prisma requires Prisma.JsonNull (not plain null) for nullable JSON fields
  const topicsOfInterest =
    input.topicsOfInterest === null
      ? Prisma.JsonNull
      : input.topicsOfInterest;

  const data = { ...input, topicsOfInterest };

  const profile = await prisma.learnerProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
  await deleteCache(cacheKeys.dashboard(userId));
  return profile;
}
