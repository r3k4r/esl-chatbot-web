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
import { generateAIResponse, generateTTS, transcribeAudio } from "../ai/ai.service.ts";
import { uploadToR2, deleteFromR2, audioExtFromMime } from "../../lib/r2-upload.ts";
import { countAiReplyWords } from "../../utils/aiReplyFormat.ts";
import type { VoiceMessageResult } from "./messages.types.ts";
import type { Plan } from "@prisma/client";

// ── Send voice message (audio upload → STT → LLM → TTS → store) ──────────────
//
// Flow:
//   1. Validate session (same ownership/status checks as sendMessage)
//   2. Check subscription limits (same caps as sendMessage)
//   3. STT: transcribe audio buffer → transcript text (BEFORE R2 upload to avoid orphans)
//   4. Upload recording to R2 — keyed by pre-generated userMsgId
//   5. LLM: generateAIResponse with transcript
//   6. TTS: generateTTS with AI reply → MP3 audio buffer
//   7. Upload TTS to R2 — keyed by pre-generated assistantMsgId
//   8. DB: store user message + evaluation + AI message (with audioUrl on both)
//   9. Return: messages + evaluation + audioBase64 + pronunciation scores
//
// R2 cleanup: any file uploaded before a failure (LLM throw or DB error) is deleted
// so no orphaned objects accumulate in the bucket.

export async function sendVoiceMessage(
  userId: string,
  sessionId: string,
  audioBuffer: Buffer,
  mimeType: string,
  audioDurationSec?: number,
): Promise<VoiceMessageResult> {
  // ── 1. Verify session ──────────────────────────────────────────────────────
  const session = await prisma.conversationSession.findUnique({
    where: { id: sessionId },
    select: { id: true, userId: true, endedAt: true, messageCount: true },
  });

  if (!session || session.userId !== userId) {
    throw new AppError("Session not found", 404);
  }
  if (session.endedAt) {
    throw new AppError("Cannot send messages to an ended session", 409);
  }

  // ── 2. Check subscription & message limits ─────────────────────────────────
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

  const userMessageCount = await prisma.message.count({
    where: { sessionId, role: "USER" },
  });

  if (userMessageCount >= maxMessages + SOFT_LIMIT_BUFFER) {
    throw new AppError(
      "Session message limit reached. Please end this session and start a new one.",
      429,
    );
  }

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

  // Pre-generate IDs so R2 keys can be derived before the DB transaction
  const userMsgId = crypto.randomUUID();
  const assistantMsgId = crypto.randomUUID();
  const recordingKey = `audio/recordings/${sessionId}/${userMsgId}${audioExtFromMime(mimeType)}`;
  const ttsKey = `audio/tts/${sessionId}/${assistantMsgId}.mp3`;

  // Track successfully uploaded keys so they can be deleted if a later step fails
  const uploadedKeys: string[] = [];

  // ── 3. STT — transcribe first so an empty transcript never orphans an R2 file
  const sttResult = await transcribeAudio(audioBuffer, mimeType, plan);
  const transcript = sttResult.transcript.trim();

  if (!transcript) {
    throw new AppError("No speech detected in audio. Please speak clearly and try again.", 422);
  }

  // ── 3b. Upload recording (transcript is valid — safe to persist now) ───────
  const recordingUrl = await uploadToR2(recordingKey, audioBuffer, mimeType).catch((err) => {
    console.error("[R2] Recording upload failed:", err instanceof Error ? err.message : err);
    return null;
  });
  if (recordingUrl) uploadedKeys.push(recordingKey);

  try {
    // ── 4. LLM — AI response + evaluation ───────────────────────────────────
    const learnerProfile = await prisma.learnerProfile.findUnique({
      where: { userId },
      select: {
        currentLevel: true,
        targetLevel: true,
        learningPurpose: true,
        aiPersonality: true,
      },
    });

    const contextLimit = plan === "FREE" ? FREE_LLM_CONTEXT_MESSAGES : DEFAULT_LLM_CONTEXT_MESSAGES;
    const recentMessages = await prisma.message.findMany({
      where: { sessionId },
      select: { role: true, content: true },
      orderBy: { createdAt: "desc" },
      take: contextLimit,
    });
    recentMessages.reverse();

    const aiResult = await generateAIResponse(transcript, recentMessages, learnerProfile, plan);

    // ── 5. TTS — synthesize AI reply ─────────────────────────────────────────
    let ttsBuffer: Buffer;
    try {
      ttsBuffer = await generateTTS(aiResult.reply, plan); // generateTTS strips HTML internally
    } catch (err) {
      console.error("[TTS] Failed, continuing without audio:", err instanceof Error ? err.message : err);
      ttsBuffer = Buffer.alloc(0);
    }

    // ── 5b. Upload TTS audio to R2 ───────────────────────────────────────────
    let ttsUrl: string | null = null;
    if (ttsBuffer.length > 0) {
      ttsUrl = await uploadToR2(ttsKey, ttsBuffer, "audio/mpeg").catch((err) => {
        console.error("[R2] TTS upload failed:", err instanceof Error ? err.message : err);
        return null;
      });
      if (ttsUrl) uploadedKeys.push(ttsKey);
    }

    const wordCount = transcript.split(/\s+/).filter(Boolean).length;
    // Reply is HTML — count visible words only, never tags/entities
    const aiWordCount = countAiReplyWords(aiResult.reply);
    const pronunciation = sttResult.pronunciation ?? null;
    const pronScore = pronunciation ? pronunciation.overallScore : null;
    const pronIssues = pronunciation?.issues.length ? pronunciation.issues : null;

    // ── 6. Persist in a single transaction ──────────────────────────────────
    const result = await prisma.$transaction(async (tx) => {
      const userMsg = await tx.message.create({
        data: {
          id: userMsgId,
          userId,
          sessionId,
          role: "USER",
          type: "VOICE",
          content: transcript,
          wordCount,
          audioDurationSec: audioDurationSec ?? null,
          audioUrl: recordingUrl,
        },
        select: {
          id: true,
          role: true,
          type: true,
          content: true,
          wordCount: true,
          audioDurationSec: true,
          audioUrl: true,
          createdAt: true,
        },
      });

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
          pronunciationScore: pronScore,
          pronunciationIssues: pronIssues !== null ? (pronIssues as unknown as object[]) : undefined,
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
          pronunciationScore: true,
          pronunciationIssues: true,
        },
      });

      const assistantMsg = await tx.message.create({
        data: {
          id: assistantMsgId,
          userId,
          sessionId,
          role: "ASSISTANT",
          type: "VOICE",
          content: aiResult.reply,
          wordCount: aiWordCount,
          audioUrl: ttsUrl,
        },
        select: {
          id: true,
          role: true,
          type: true,
          content: true,
          wordCount: true,
          audioUrl: true,
          createdAt: true,
        },
      });

      const totalMessages = await tx.message.count({ where: { sessionId } });
      await tx.conversationSession.update({
        where: { id: sessionId },
        data: { messageCount: totalMessages },
      });

      return {
        userMessage: userMsg as VoiceMessageResult["userMessage"],
        assistantMessage: assistantMsg as VoiceMessageResult["assistantMessage"],
        evaluation,
      };
    });

    const audioBase64 = ttsBuffer.length > 0 ? ttsBuffer.toString("base64") : null;

    return {
      ...result,
      audioBase64,
      pronunciation: sttResult.pronunciation ?? null,
    };
  } catch (err) {
    // Delete any R2 objects uploaded before the failure so the bucket stays clean
    await Promise.allSettled(uploadedKeys.map((k) => deleteFromR2(k).catch(() => {})));
    throw err;
  }
}
