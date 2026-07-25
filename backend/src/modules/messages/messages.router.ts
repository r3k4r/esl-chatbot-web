import { Router } from "express";
import { sendMessageHandler, listMessagesHandler, sendVoiceMessageHandler } from "./messages.controller.ts";
import { authenticate } from "../../middlewares/authenticate.ts";
import { uploadAudio } from "../../middlewares/upload.ts";
import { sendMessageLimiter, sendVoiceMessageLimiter } from "../../middlewares/rateLimits.ts";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Send and retrieve messages within a conversation session
 */

// ─────────────────────────────────────────────────────────
// LIST MESSAGES
// ─────────────────────────────────────────────────────────
/**
 * @swagger
 * /sessions/{sessionId}/messages:
 *   get:
 *     summary: List messages in a session (paginated)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 50 }
 *     responses:
 *       200:
 *         description: Paginated list of messages with evaluations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, format: uuid }
 *                       role: { type: string, enum: [USER, ASSISTANT] }
 *                       type: { type: string, enum: [TEXT, VOICE] }
 *                       content: { type: string, description: For ASSISTANT rows this is sanitized lightweight HTML (p/strong/em/ul/ol/li/br only — render with v-html); USER rows are plain text. Rows stored before 2026-07 are plain text. }
 *                       wordCount: { type: integer, nullable: true }
 *                       audioUrl: { type: string, nullable: true }
 *                       audioDurationSec: { type: number, nullable: true }
 *                       createdAt: { type: string, format: date-time }
 *                       evaluation:
 *                         nullable: true
 *                         allOf:
 *                           - { $ref: '#/components/schemas/MessageEvaluation' }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 *                     totalPages: { type: integer }
 *       401: { description: Missing or invalid token, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       404: { description: Session not found, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 */
router.get("/:sessionId/messages", authenticate, listMessagesHandler);

// ─────────────────────────────────────────────────────────
// SEND MESSAGE
// ─────────────────────────────────────────────────────────
/**
 * @swagger
 * /sessions/{sessionId}/messages:
 *   post:
 *     summary: Send a message and get AI response with evaluation
 *     description: |
 *       Sends a user message in the session, triggers an AI response, and
 *       evaluates the user's message for grammar, vocabulary, and fluency.
 *
 *       Returns the user message, AI response, and evaluation in one call.
 *
 *       Per-session message limits (user messages only):
 *       - FREE plan: 20 messages (soft) + 10 buffer · 20 messages/day cap across all sessions · 10-message AI context
 *       - GOLD plan: 100 messages (soft) + 10 buffer · 20-message AI context
 *       - PREMIUM plan: 150 messages (soft) + 10 buffer · 20-message AI context
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 5000
 *               type:
 *                 type: string
 *                 enum: [TEXT, VOICE]
 *                 default: TEXT
 *     responses:
 *       201:
 *         description: Message sent, AI responded, evaluation generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     userMessage:
 *                       type: object
 *                       properties:
 *                         id: { type: string, format: uuid }
 *                         role: { type: string, example: USER }
 *                         type: { type: string, enum: [TEXT, VOICE] }
 *                         content: { type: string }
 *                         wordCount: { type: integer }
 *                         createdAt: { type: string, format: date-time }
 *                     assistantMessage:
 *                       type: object
 *                       properties:
 *                         id: { type: string, format: uuid }
 *                         role: { type: string, example: ASSISTANT }
 *                         type: { type: string, enum: [TEXT, VOICE] }
 *                         content: { type: string, description: AI tutor's reply as sanitized lightweight HTML (only p/strong/em/ul/ol/li/br tags, no attributes) — render with v-html }
 *                         wordCount: { type: integer }
 *                         createdAt: { type: string, format: date-time }
 *                     evaluation:
 *                       $ref: '#/components/schemas/MessageEvaluation'
 *       400: { description: Invalid body, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       401: { description: Missing or invalid token, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       404: { description: Session not found, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       409: { description: Session already ended, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       429: { description: Per-session or daily message cap reached, or rate limit exceeded (10 per minute per user), content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 */
router.post("/:sessionId/messages", authenticate, sendMessageLimiter, sendMessageHandler);

// ─────────────────────────────────────────────────────────
// SEND VOICE MESSAGE
// ─────────────────────────────────────────────────────────
/**
 * @swagger
 * /sessions/{sessionId}/voice-message:
 *   post:
 *     summary: Send a voice message — audio → STT → LLM → TTS
 *     description: |
 *       Accepts a multipart audio upload, transcribes it (STT), generates an AI response
 *       (same evaluation pipeline as text messages), synthesises TTS audio, and returns
 *       everything in one response.
 *
 *       **STT routing by plan:**
 *       - Dev + FREE → Deepgram Nova-3 (`DEEPGRAM_API_KEY`)
 *       - GOLD + PREMIUM → Azure Speech + Pronunciation Assessment (`AZURE_SPEECH_KEY`)
 *         - GOLD: accuracy + fluency + completeness
 *         - PREMIUM: + prosody score
 *
 *       **TTS routing by plan:**
 *       - Dev → Edge TTS (no key)
 *       - FREE + GOLD → Azure Neural TTS (`AZURE_SPEECH_KEY`)
 *       - PREMIUM → OpenAI TTS-1-HD (`OPENAI_API_KEY`)
 *
 *       **Accepted audio formats:**
 *       - `audio/webm` — Chrome, Edge, Firefox (default MediaRecorder output)
 *       - `audio/ogg` — Firefox alternative
 *       - `audio/mp4` — Safari (AAC codec; no pronunciation assessment — falls back to Deepgram)
 *       - `audio/mpeg` — MP3
 *       - `audio/wav` — WAV
 *
 *       Same per-session and per-day limits as text messages apply.
 *
 *       Both `userMessage.audioUrl` (student recording) and `assistantMessage.audioUrl` (TTS MP3)
 *       are populated when Cloudflare R2 is configured (`R2_*` env vars). `null` otherwise.
 *       `audioBase64` always contains the TTS audio for immediate playback (when TTS is configured).
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [audio]
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: Audio recording (WebM/OGG/MP4/WAV/MP3, max 10MB)
 *               audioDurationSec:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 600
 *                 description: Optional recording duration in seconds (used to store on the message)
 *     responses:
 *       201:
 *         description: Voice message processed — transcript, AI reply, evaluation, and TTS audio returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     userMessage:
 *                       type: object
 *                       properties:
 *                         id: { type: string, format: uuid }
 *                         role: { type: string, example: USER }
 *                         type: { type: string, example: VOICE }
 *                         content: { type: string, description: Transcript of the student's speech }
 *                         wordCount: { type: integer, nullable: true }
 *                         audioDurationSec: { type: number, nullable: true }
 *                         audioUrl: { type: string, nullable: true, description: R2 URL of the student recording. Null if R2 not configured. }
 *                         createdAt: { type: string, format: date-time }
 *                     assistantMessage:
 *                       type: object
 *                       properties:
 *                         id: { type: string, format: uuid }
 *                         role: { type: string, example: ASSISTANT }
 *                         type: { type: string, example: VOICE }
 *                         content: { type: string, description: AI tutor's reply as sanitized lightweight HTML (only p/strong/em/ul/ol/li/br tags, no attributes) — render with v-html }
 *                         wordCount: { type: integer, nullable: true }
 *                         audioUrl: { type: string, nullable: true, description: R2 URL of the TTS MP3. Null if R2 or TTS not configured. }
 *                         createdAt: { type: string, format: date-time }
 *                     evaluation:
 *                       allOf:
 *                         - { $ref: '#/components/schemas/MessageEvaluation' }
 *                         - type: object
 *                           properties:
 *                             pronunciationScore: { type: integer, nullable: true, description: 0-100 overall pronunciation score (GOLD+PREMIUM only) }
 *                             pronunciationIssues: { type: array, nullable: true, items: { type: object } }
 *                     audioBase64:
 *                       type: string
 *                       nullable: true
 *                       description: Base64-encoded MP3 audio of the AI reply. Null if TTS not configured.
 *                     pronunciation:
 *                       nullable: true
 *                       description: Pronunciation assessment detail (GOLD+PREMIUM only; null for Dev/FREE or MP4 audio)
 *                       type: object
 *                       properties:
 *                         accuracyScore: { type: integer }
 *                         fluencyScore: { type: integer }
 *                         completenessScore: { type: integer }
 *                         prosodyScore: { type: integer, nullable: true }
 *                         overallScore: { type: integer }
 *                         issues: { type: array, items: { type: object } }
 *       400: { description: No audio file or unsupported format, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       401: { description: Missing or invalid token, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       404: { description: Session not found, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       409: { description: Session already ended, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       422: { description: No speech detected in audio, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       429: { description: Per-session or daily message cap reached, or rate limit exceeded (5 per minute per user), content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       503: { description: STT service not configured, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 */
router.post("/:sessionId/voice-message", authenticate, sendVoiceMessageLimiter, uploadAudio.single("audio"), sendVoiceMessageHandler);

export default router;
