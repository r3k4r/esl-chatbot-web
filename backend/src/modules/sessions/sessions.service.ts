import type { Prisma, SessionMode } from "@prisma/client";
import { prisma } from "../../config/database.ts";
import { deleteCache, cacheKeys } from "../../config/cache.ts";
import { AppError } from "../../utils/AppError.ts";
import { createNotification } from "../notifications/notifications.service.ts";
import { upsertSessionVocabulary } from "../vocabulary/vocabulary.service.ts";
import type { NewVocabularyWord } from "../ai/ai.types.ts";
import type {
  SessionListItem,
  SessionDetail,
  SessionEvaluationData,
  SessionStatsData,
} from "./sessions.types.ts";

// ── Constants ─────────────────────────────────────────────

const FREE_MAX_SESSIONS_PER_DAY = 3;
const GOLD_MAX_SESSIONS_PER_DAY = 15;
const PREMIUM_MAX_SESSIONS_PER_DAY = 50;

const FREE_MAX_MESSAGES_PER_SESSION = 20;   // soft limit — warning shown
const GOLD_MAX_MESSAGES_PER_SESSION = 100;
const PREMIUM_MAX_MESSAGES_PER_SESSION = 150;

const FREE_MAX_MESSAGES_PER_DAY = 20;       // hard daily cap across all sessions

const SOFT_LIMIT_BUFFER = 10;               // extra messages allowed after soft limit before hard cutoff
const FREE_LLM_CONTEXT_MESSAGES = 10;       // last N messages sent as context to LLM
const DEFAULT_LLM_CONTEXT_MESSAGES = 20;    // GOLD + PREMIUM context window

export {
  FREE_MAX_MESSAGES_PER_SESSION,
  GOLD_MAX_MESSAGES_PER_SESSION,
  PREMIUM_MAX_MESSAGES_PER_SESSION,
  FREE_MAX_MESSAGES_PER_DAY,
  SOFT_LIMIT_BUFFER,
  FREE_LLM_CONTEXT_MESSAGES,
  DEFAULT_LLM_CONTEXT_MESSAGES,
};

// ── Create session ────────────────────────────────────────

export async function createSession(
  userId: string,
  mode: SessionMode,
  topic?: string | null,
): Promise<SessionListItem> {
  // Check subscription — AI chatbot access requires ACTIVE subscription
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { status: true, plan: true, currentPeriodEnd: true },
  });

  if (!subscription || subscription.status !== "ACTIVE") {
    throw new AppError("Active subscription required to start a conversation", 403);
  }

  // Lazy expiry: downgrade GOLD/PREMIUM to FREE ACTIVE when the period has ended
  let plan = subscription.plan;
  if (
    subscription.currentPeriodEnd &&
    subscription.currentPeriodEnd < new Date() &&
    (plan === "GOLD" || plan === "PREMIUM")
  ) {
    await prisma.subscription.update({
      where: { userId },
      data: {
        plan: "FREE",
        currentPeriodEnd: null,
        currentPeriodStart: null,
        paymentProvider: null,
        externalCustomerId: null,
        externalSubscriptionId: null,
        // Mirrors subscription-expiry.job.ts — the cancellation has taken effect.
        cancelAtPeriodEnd: false,
      },
    });
    plan = "FREE";
  }

  // Enforce daily session cap
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const sessionsToday = await prisma.conversationSession.count({
    where: {
      userId,
      startedAt: { gte: todayStart },
    },
  });

  const maxSessions =
    plan === "PREMIUM"
      ? PREMIUM_MAX_SESSIONS_PER_DAY
      : plan === "GOLD"
        ? GOLD_MAX_SESSIONS_PER_DAY
        : FREE_MAX_SESSIONS_PER_DAY;

  if (sessionsToday >= maxSessions) {
    throw new AppError(
      `Daily session limit reached (${maxSessions}). Upgrade your plan for more sessions.`,
      429,
    );
  }

  const session = await prisma.conversationSession.create({
    data: {
      userId,
      mode,
      topic: topic ?? null,
    },
    select: SESSION_LIST_SELECT,
  });

  return session;
}

// ── List sessions ─────────────────────────────────────────

const SESSION_LIST_SELECT = {
  id: true,
  mode: true,
  topic: true,
  summary: true,
  startedAt: true,
  endedAt: true,
  durationSeconds: true,
  messageCount: true,
  createdAt: true,
} satisfies Prisma.ConversationSessionSelect;

export async function listSessions(
  userId: string,
  page: number,
  limit: number,
  mode?: SessionMode,
  active?: boolean,
): Promise<{ sessions: SessionListItem[]; total: number }> {
  const where: Prisma.ConversationSessionWhereInput = { userId };
  if (mode) where.mode = mode;
  if (active === true) where.endedAt = null;
  if (active === false) where.endedAt = { not: null };

  const skip = (page - 1) * limit;

  const [sessions, total] = await prisma.$transaction([
    prisma.conversationSession.findMany({
      where,
      select: SESSION_LIST_SELECT,
      orderBy: { startedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.conversationSession.count({ where }),
  ]);

  return { sessions, total };
}

// ── Get session detail ────────────────────────────────────

export async function getSessionById(
  sessionId: string,
  userId: string,
): Promise<SessionDetail> {
  const session = await prisma.conversationSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      userId: true,
      mode: true,
      topic: true,
      summary: true,
      aiContextSnapshot: true,
      startedAt: true,
      endedAt: true,
      durationSeconds: true,
      messageCount: true,
      createdAt: true,
      messages: {
        select: {
          id: true,
          role: true,
          type: true,
          content: true,
          wordCount: true,
          audioUrl: true,
          audioDurationSec: true,
          createdAt: true,
          evaluation: {
            select: {
              grammarScore: true,
              grammarErrors: true,
              vocabularyScore: true,
              vocabularyLevel: true,
              fluencyScore: true,
              pronunciationScore: true,
              pronunciationIssues: true,
              overallScore: true,
              detectedCefrLevel: true,
              corrections: true,
              feedback: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      evaluation: {
        select: {
          topicsCovered: true,
          avgGrammarScore: true,
          avgVocabularyScore: true,
          avgFluencyScore: true,
          avgOverallScore: true,
          avgPronunciationScore: true,
          detectedCefrLevel: true,
          strengths: true,
          weaknesses: true,
          recommendations: true,
          newVocabulary: true,
          totalUserMessages: true,
          totalUserWords: true,
        },
      },
    },
  });

  if (!session || session.userId !== userId) {
    throw new AppError("Session not found", 404);
  }

  return session;
}

// ── End session ───────────────────────────────────────────

export async function endSession(
  sessionId: string,
  userId: string,
): Promise<SessionDetail> {
  const session = await prisma.conversationSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      userId: true,
      startedAt: true,
      endedAt: true,
      messages: {
        where: { role: "USER" },
        select: {
          wordCount: true,
          evaluation: {
            select: {
              grammarScore: true,
              vocabularyScore: true,
              fluencyScore: true,
              overallScore: true,
              pronunciationScore: true,
              newWords: true,
            },
          },
        },
      },
    },
  });

  if (!session || session.userId !== userId) {
    throw new AppError("Session not found", 404);
  }

  if (session.endedAt) {
    throw new AppError("Session is already ended", 409);
  }

  const endedAt = new Date();
  const rawDurationSeconds = Math.round(
    (endedAt.getTime() - session.startedAt.getTime()) / 1000,
  );
  // Cap at 4 hours — a tab left open for days should not inflate practice time
  const durationSeconds = Math.min(rawDurationSeconds, 4 * 60 * 60);

  // Compute averages from message evaluations
  const evaluatedMessages = session.messages.filter((m) => m.evaluation);

  const totalMessages = await prisma.message.count({
    where: { sessionId },
  });

  await prisma.conversationSession.update({
    where: { id: sessionId },
    data: {
      endedAt,
      durationSeconds,
      messageCount: totalMessages,
    },
  });

  // Generate a session evaluation summary from individual message evaluations
  const totalUserMessages = evaluatedMessages.length;
  const totalUserWords = session.messages.reduce((sum, m) => sum + (m.wordCount ?? 0), 0);
  const studyMinutes = Math.max(1, Math.round(durationSeconds / 60));

  if (evaluatedMessages.length > 0) {
    const avgGrammar =
      evaluatedMessages.reduce((s, m) => s + (m.evaluation?.grammarScore ?? 0), 0) /
      totalUserMessages;
    const avgVocab =
      evaluatedMessages.reduce((s, m) => s + (m.evaluation?.vocabularyScore ?? 0), 0) /
      totalUserMessages;
    const avgFluency =
      evaluatedMessages.reduce((s, m) => s + (m.evaluation?.fluencyScore ?? 0), 0) /
      totalUserMessages;
    const avgOverall =
      evaluatedMessages.reduce((s, m) => s + (m.evaluation?.overallScore ?? 0), 0) /
      totalUserMessages;

    const cefrLevel = scoreTocefrLevel(avgOverall);

    const scores = { grammar: avgGrammar, vocabulary: avgVocab, fluency: avgFluency };
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    for (const [skill, score] of Object.entries(scores)) {
      if (score >= 75) strengths.push(`Strong ${skill} skills`);
      else if (score < 50) weaknesses.push(`${skill} needs improvement`);
    }

    const pronouncedMessages = evaluatedMessages.filter(
      (m) => m.evaluation?.pronunciationScore != null,
    );
    const avgPronunciation =
      pronouncedMessages.length > 0
        ? pronouncedMessages.reduce((s, m) => s + (m.evaluation?.pronunciationScore ?? 0), 0) /
          pronouncedMessages.length
        : null;

    // Collect new vocabulary from all message evaluations, upsert to vocabulary table
    const rawVocab = evaluatedMessages.flatMap(
      (m) => ((m.evaluation?.newWords ?? []) as unknown as NewVocabularyWord[]),
    );
    const sessionVocabulary = await upsertSessionVocabulary(userId, rawVocab);

    await prisma.sessionEvaluation.create({
      data: {
        sessionId,
        topicsCovered: [],
        avgGrammarScore: Math.round(avgGrammar * 10) / 10,
        avgVocabularyScore: Math.round(avgVocab * 10) / 10,
        avgFluencyScore: Math.round(avgFluency * 10) / 10,
        avgOverallScore: Math.round(avgOverall * 10) / 10,
        avgPronunciationScore: avgPronunciation !== null ? Math.round(avgPronunciation * 10) / 10 : null,
        detectedCefrLevel: cefrLevel,
        strengths,
        weaknesses,
        recommendations: weaknesses.map(
          (w) => `Focus on improving ${w.replace(" needs improvement", "")}`,
        ),
        newVocabulary: sessionVocabulary as unknown as object[],
        totalUserMessages,
        totalUserWords,
      },
    });

    // Update progress and metrics after session ends
    await updateProgressAndMetrics(
      userId,
      studyMinutes,
      totalUserMessages,
      totalUserWords,
      cefrLevel,
      avgGrammar,
      avgVocab,
      avgFluency,
    );
  } else {
    // Session with no evaluated messages still counts toward progress
    await updateProgressAndMetrics(userId, studyMinutes, 0, totalUserWords, null, 0, 0, 0);
  }

  // Streak, study time, recent sessions, and due vocab can all change — bust the dashboard cache
  void deleteCache(cacheKeys.dashboard(userId));

  return getSessionById(sessionId, userId);
}

// ── Progress + metrics upsert ─────────────────────────────────

async function updateProgressAndMetrics(
  userId: string,
  studyMinutes: number,
  messagesCount: number,
  wordsTyped: number,
  cefrLevel: string | null,
  avgGrammar: number,
  avgVocab: number,
  avgFluency: number,
): Promise<void> {
  // Use the user's timezone so progress rows land on the correct local calendar day
  const learnerProfile = await prisma.learnerProfile.findUnique({
    where: { userId },
    select: { timezone: true },
  });
  let timezone = learnerProfile?.timezone ?? 'UTC';
  // Guard against invalid IANA strings stored in the DB — toLocaleDateString would throw RangeError
  try { new Intl.DateTimeFormat(undefined, { timeZone: timezone }); } catch { timezone = 'UTC'; }

  // 'en-CA' always returns YYYY-MM-DD, then Date.UTC pins it to UTC midnight
  const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: timezone });
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const today = new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, Number(dayStr)));

  const skillSnapshot =
    avgGrammar > 0 || avgVocab > 0 || avgFluency > 0
      ? { grammar: Math.round(avgGrammar), vocabulary: Math.round(avgVocab), fluency: Math.round(avgFluency) }
      : undefined;

  // Upsert today's progress row
  await prisma.progress.upsert({
    where: { userId_date: { userId, date: today } },
    create: {
      userId,
      date: today,
      sessionsCount: 1,
      studyMinutes,
      messagesCount,
      wordsTyped,
      ...(skillSnapshot && { skillSnapshot }),
    },
    update: {
      sessionsCount: { increment: 1 },
      studyMinutes: { increment: studyMinutes },
      messagesCount: { increment: messagesCount },
      wordsTyped: { increment: wordsTyped },
      ...(skillSnapshot && { skillSnapshot }),
    },
  });

  // Update lifetime metrics
  const existingMetrics = await prisma.userMetrics.findUnique({
    where: { userId },
    select: {
      currentStreak: true,
      longestStreak: true,
      lastStudyDate: true,
      grammarSkill: true,
      vocabularySkill: true,
      fluencySkill: true,
    },
  });

  if (!existingMetrics) return;

  // Streak calculation
  const lastStudy = existingMetrics.lastStudyDate;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const studiedYesterday = lastStudy && lastStudy >= yesterday && lastStudy < today;
  const studiedToday = lastStudy && lastStudy >= today;
  const newStreak = studiedToday
    ? existingMetrics.currentStreak
    : studiedYesterday
      ? existingMetrics.currentStreak + 1
      : 1;
  const longestStreak = Math.max(existingMetrics.longestStreak, newStreak);

  // Exponential moving average for skills (85% old + 15% new session)
  const ema = (old: number, newVal: number) =>
    newVal > 0 ? Math.round((old * 0.85 + newVal * 0.15) * 10) / 10 : old;

  await prisma.userMetrics.update({
    where: { userId },
    data: {
      totalStudyTimeMinutes: { increment: studyMinutes },
      totalWordsTyped: { increment: wordsTyped },
      currentStreak: newStreak,
      longestStreak,
      lastStudyDate: today,
      ...(cefrLevel && { estimatedLevel: cefrLevel }),
      ...(avgGrammar > 0 && { grammarSkill: ema(existingMetrics.grammarSkill, avgGrammar) }),
      ...(avgVocab > 0 && { vocabularySkill: ema(existingMetrics.vocabularySkill, avgVocab) }),
      ...(avgFluency > 0 && { fluencySkill: ema(existingMetrics.fluencySkill, avgFluency) }),
    },
  });

  // Fire streak milestone notifications (7-day and 30-day)
  const prevStreak = existingMetrics.currentStreak;
  for (const milestone of [7, 30]) {
    if (prevStreak < milestone && newStreak >= milestone) {
      await createNotification(
        userId,
        "STREAK_MILESTONE",
        `Amazing! You've reached a ${milestone}-day study streak!`,
      ).catch(() => {});
    }
  }
}

// ── Session stats ─────────────────────────────────────────

export async function getSessionStats(
  targetUserId: string,
  days: number,
  actorUserId: string,
  actorRole: string,
): Promise<SessionStatsData> {
  // When viewing another user's stats, enforce class-membership (same pattern as metrics)
  if (targetUserId !== actorUserId) {
    if (actorRole === "TUTOR") {
      const sharedClass = await prisma.classUser.findFirst({
        where: {
          userId: actorUserId,
          role: "TUTOR",
          class: { users: { some: { userId: targetUserId } } },
        },
        select: { id: true },
      });
      if (!sharedClass) throw new AppError("Student not found or not in your class", 404);
    } else if (actorRole !== "ADMIN") {
      throw new AppError("Access denied", 403);
    }
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);
  startDate.setHours(0, 0, 0, 0);

  const sessions = await prisma.conversationSession.findMany({
    where: { userId: targetUserId, startedAt: { gte: startDate } },
    select: { startedAt: true, durationSeconds: true, endedAt: true },
    orderBy: { startedAt: "asc" },
  });

  // Build a zero-filled map for every day in the range
  const dayMap = new Map<string, { count: number; totalDuration: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    dayMap.set(d.toISOString().split("T")[0]!, { count: 0, totalDuration: 0 });
  }

  for (const s of sessions) {
    const key = s.startedAt.toISOString().split("T")[0]!;
    const entry = dayMap.get(key);
    if (entry) {
      entry.count += 1;
      entry.totalDuration += s.durationSeconds ?? 0;
    }
  }

  const dailyStats = Array.from(dayMap.entries()).map(([date, { count, totalDuration }]) => ({
    date,
    sessionCount: count,
    totalDurationSeconds: totalDuration,
  }));

  const endedSessions = sessions.filter((s) => s.endedAt && s.durationSeconds != null);
  const averageDurationSeconds =
    endedSessions.length > 0
      ? Math.round(
          endedSessions.reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0) /
            endedSessions.length,
        )
      : 0;

  return { days, totalSessions: sessions.length, averageDurationSeconds, dailyStats };
}

// ── Helpers ───────────────────────────────────────────────

function scoreTocefrLevel(score: number): string {
  if (score >= 90) return "C2";
  if (score >= 80) return "C1";
  if (score >= 70) return "B2";
  if (score >= 60) return "B1";
  if (score >= 45) return "A2";
  return "A1";
}
