import { prisma } from "../../config/database.ts";
import { AppError } from "../../utils/AppError.ts";
import {
  FREE_MAX_MESSAGES_PER_SESSION,
  GOLD_MAX_MESSAGES_PER_SESSION,
  PREMIUM_MAX_MESSAGES_PER_SESSION,
  FREE_MAX_MESSAGES_PER_DAY,
  SOFT_LIMIT_BUFFER,
  FREE_LLM_CONTEXT_MESSAGES,
  DEFAULT_LLM_CONTEXT_MESSAGES,
} from "../sessions/sessions.service.ts";
import { generateAIResponse } from "../ai/ai.service.ts";
import { countAiReplyWords } from "../../utils/aiReplyFormat.ts";
import type { SendMessageResult } from "./messages.types.ts";
import type { MessageType, Plan } from "@prisma/client";

// ── Send message (user → AI → evaluate → store) ──────────

export async function sendMessage(
  userId: string,
  sessionId: string,
  content: string,
  type: MessageType,
): Promise<SendMessageResult> {
  // Verify session ownership and status
  const session = await prisma.conversationSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      userId: true,
      endedAt: true,
      messageCount: true,
      mode: true,
    },
  });

  if (!session || session.userId !== userId) {
    throw new AppError("Session not found", 404);
  }

  if (session.endedAt) {
    throw new AppError("Cannot send messages to an ended session", 409);
  }

  // Check message limits
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true },
  });

  const plan = (subscription?.plan ?? "FREE") as Plan;
  const maxMessages =
    plan === "PREMIUM"
      ? PREMIUM_MAX_MESSAGES_PER_SESSION
      : plan === "GOLD"
        ? GOLD_MAX_MESSAGES_PER_SESSION
        : FREE_MAX_MESSAGES_PER_SESSION;

  // Count only USER messages for the per-session limit
  const userMessageCount = await prisma.message.count({
    where: { sessionId, role: "USER" },
  });

  if (userMessageCount >= maxMessages + SOFT_LIMIT_BUFFER) {
    throw new AppError(
      "Session message limit reached. Please end this session and start a new one.",
      429,
    );
  }

  // FREE tier: enforce daily message cap across all sessions
  if (plan === "FREE") {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const messagesToday = await prisma.message.count({
      where: { userId, role: "USER", createdAt: { gte: todayStart } },
    });
    if (messagesToday >= FREE_MAX_MESSAGES_PER_DAY) {
      throw new AppError(
        `Daily message limit reached (${FREE_MAX_MESSAGES_PER_DAY}). Upgrade to GOLD for more messages.`,
        429,
      );
    }
  }

  // Get learner profile for AI context
  const learnerProfile = await prisma.learnerProfile.findUnique({
    where: { userId },
    select: {
      currentLevel: true,
      targetLevel: true,
      learningPurpose: true,
      aiPersonality: true,
    },
  });

  // Get recent conversation history — FREE tier gets shorter context to reduce token cost
  const contextLimit = plan === "FREE" ? FREE_LLM_CONTEXT_MESSAGES : DEFAULT_LLM_CONTEXT_MESSAGES;
  const recentMessages = await prisma.message.findMany({
    where: { sessionId },
    select: { role: true, content: true },
    orderBy: { createdAt: "desc" },
    take: contextLimit,
  });
  recentMessages.reverse();

  // Call AI for response + evaluation (real OpenAI or heuristic fallback)
  const aiResult = await generateAIResponse(
    content,
    recentMessages,
    learnerProfile,
    plan,
  );

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  // Reply is HTML — count visible words only, never tags/entities
  const aiWordCount = countAiReplyWords(aiResult.reply);

  // Store user message, AI response, and evaluation in a single transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create user message
    const userMsg = await tx.message.create({
      data: {
        userId,
        sessionId,
        role: "USER",
        type,
        content,
        wordCount,
      },
      select: {
        id: true,
        role: true,
        type: true,
        content: true,
        wordCount: true,
        createdAt: true,
      },
    });

    // 2. Create message evaluation for the user message
    const evaluation = await tx.messageEvaluation.create({
      data: {
        messageId: userMsg.id,
        grammarScore: aiResult.evaluation.grammarScore,
        grammarErrors: aiResult.evaluation.grammarErrors as unknown as object[],
        vocabularyScore: aiResult.evaluation.vocabularyScore,
        vocabularyLevel: aiResult.evaluation.vocabularyLevel,
        fluencyScore: aiResult.evaluation.fluencyScore,
        overallScore: aiResult.evaluation.overallScore,
        detectedCefrLevel: aiResult.evaluation.detectedCefrLevel,
        corrections: aiResult.evaluation.corrections as unknown as object[],
        feedback: aiResult.evaluation.feedback,
        newWords: (aiResult.evaluation.newWords ?? []) as unknown as object[],
      },
      select: {
        grammarScore: true,
        grammarErrors: true,
        vocabularyScore: true,
        vocabularyLevel: true,
        fluencyScore: true,
        overallScore: true,
        detectedCefrLevel: true,
        corrections: true,
        feedback: true,
      },
    });

    // 3. Create assistant message
    const assistantMsg = await tx.message.create({
      data: {
        userId,
        sessionId,
        role: "ASSISTANT",
        type: "TEXT",
        content: aiResult.reply,
        wordCount: aiWordCount,
      },
      select: {
        id: true,
        role: true,
        type: true,
        content: true,
        wordCount: true,
        createdAt: true,
      },
    });

    // 4. Update session message count
    const totalMessages = await tx.message.count({ where: { sessionId } });
    await tx.conversationSession.update({
      where: { id: sessionId },
      data: { messageCount: totalMessages },
    });

    return {
      userMessage: userMsg as SendMessageResult["userMessage"],
      assistantMessage: assistantMsg as SendMessageResult["assistantMessage"],
      evaluation,
    };
  });

  return result;
}

// ── List messages for a session ───────────────────────────

export async function listMessages(
  userId: string,
  sessionId: string,
  page: number,
  limit: number,
) {
  const session = await prisma.conversationSession.findUnique({
    where: { id: sessionId },
    select: { userId: true },
  });

  if (!session || session.userId !== userId) {
    throw new AppError("Session not found", 404);
  }

  const skip = (page - 1) * limit;

  const [messages, total] = await prisma.$transaction([
    prisma.message.findMany({
      where: { sessionId },
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
      skip,
      take: limit,
    }),
    prisma.message.count({ where: { sessionId } }),
  ]);

  return { messages, total };
}
