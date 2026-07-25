import { Router } from "express";
import {
  listUsers,
  getUser,
  getDashboardHandler,
  getMe,
  getMySubscriptionHandler,
  updateMe,
  updateLearnerProfile,
  uploadAvatarHandler,
} from "./users.controller.ts";
import { authenticate } from "../../middlewares/authenticate.ts";
import { authorize } from "../../middlewares/authorize.ts";
import { avatarUpload } from "../../middlewares/upload.ts";
import { avatarUploadLimiter } from "../../middlewares/rateLimits.ts";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile and management
 */

// ─── Self-profile routes (any authenticated user) ─────────────────────────────

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get own profile (full, including learner settings)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Own profile with learner settings and subscription
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Profile retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/MyProfile'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
/**
 * @swagger
 * /users/me/dashboard:
 *   get:
 *     summary: Get aggregated dashboard data for the authenticated user
 *     description: |
 *       Returns all data needed to render the student dashboard in a single request,
 *       avoiding 5+ separate API calls on page load.
 *
 *       Includes:
 *       - **todayProgress** — today's session count, study minutes, messages, words typed, vocab practiced, goals advanced
 *       - **metrics** — lifetime skill scores (grammar/vocab/fluency/speaking), current streak, total study time, estimated CEFR level
 *       - **activeGoalsCount** — number of goals with status ACTIVE
 *       - **vocabDueTodayCount** — SRS cards due for review today
 *       - **lastSession** — most recent session with its evaluation summary (null if no sessions yet)
 *
 *       This endpoint is safe to call for any role. All values default to zero when no data exists yet.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     todayProgress:
 *                       type: object
 *                       properties:
 *                         sessionsCount: { type: integer }
 *                         studyMinutes: { type: integer }
 *                         messagesCount: { type: integer }
 *                         wordsTyped: { type: integer }
 *                         vocabularyPracticed: { type: integer }
 *                         goalsAdvanced: { type: integer }
 *                     metrics:
 *                       type: object
 *                       properties:
 *                         currentStreak: { type: integer }
 *                         longestStreak: { type: integer }
 *                         totalStudyTimeMinutes: { type: integer }
 *                         estimatedLevel: { type: string, nullable: true }
 *                         grammarSkill: { type: number }
 *                         vocabularySkill: { type: number }
 *                         fluencySkill: { type: number }
 *                         speakingSkill: { type: number }
 *                     activeGoalsCount: { type: integer }
 *                     vocabDueTodayCount: { type: integer }
 *                     lastSession:
 *                       nullable: true
 *                       type: object
 *                       properties:
 *                         id: { type: string, format: uuid }
 *                         topic: { type: string, nullable: true }
 *                         endedAt: { type: string, format: date-time, nullable: true }
 *                         durationSeconds: { type: integer, nullable: true }
 *                         evaluation:
 *                           nullable: true
 *                           type: object
 *                           properties:
 *                             avgOverallScore: { type: number }
 *                             detectedCefrLevel: { type: string }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/me/dashboard", authenticate, getDashboardHandler);

/**
 * @swagger
 * /users/me/subscription:
 *   get:
 *     summary: Get own subscription details
 *     description: |
 *       Returns the full subscription record for the authenticated user:
 *       plan, status, period dates, and payment provider.
 *       Returns 404 if the user somehow has no subscription row.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     plan: { type: string, enum: [FREE, GOLD, PREMIUM] }
 *                     status: { type: string, enum: [ACTIVE, INACTIVE, CANCELLED, PAST_DUE] }
 *                     currentPeriodStart: { type: string, format: date-time, nullable: true }
 *                     currentPeriodEnd: { type: string, format: date-time, nullable: true }
 *                     paymentProvider: { type: string, enum: [CASH, FIB, STRIPE], nullable: true }
 *                     updatedAt: { type: string, format: date-time }
 *       401: { description: Missing or invalid token, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       404: { description: No subscription found, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 */
router.get("/me/subscription", authenticate, getMySubscriptionHandler);

router.get("/me", authenticate, getMe);

/**
 * @swagger
 * /users/me/avatar:
 *   post:
 *     summary: Upload a new avatar image
 *     description: |
 *       Replaces the authenticated user's avatar with an uploaded image.
 *       Accepts JPEG, PNG, WebP, or GIF — maximum 5 MB.
 *
 *       If Cloudflare R2 is configured the image is stored there and a public CDN URL is returned.
 *       In development without R2 credentials the file is saved locally and served under `/uploads/`.
 *
 *       The previous avatar is deleted automatically after the DB is updated:
 *       - Own-hosted avatars (R2 or local) are deleted.
 *       - External URLs (e.g. Google profile picture) are left untouched.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [avatar]
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Image file (jpeg, png, webp, gif) — max 5 MB
 *     responses:
 *       200:
 *         description: Avatar updated — returns the new public URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Avatar updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     avatarUrl:
 *                       type: string
 *                       format: uri
 *                       example: https://pub-xxxx.r2.dev/avatars/user-id/uuid.jpg
 *       400:
 *         description: No file uploaded or unsupported file type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       413:
 *         description: File exceeds the 5 MB limit
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/me/avatar", authenticate, avatarUploadLimiter, avatarUpload.single("avatar"), uploadAvatarHandler);

/**
 * @swagger
 * /users/me:
 *   patch:
 *     summary: Update own basic profile (displayName, phoneNumber)
 *     description: To update avatar image use POST /users/me/avatar instead.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               phoneNumber:
 *                 type: string
 *                 maxLength: 20
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Updated profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/MyProfile'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.patch("/me", authenticate, updateMe);

/**
 * @swagger
 * /users/me/learner-profile:
 *   patch:
 *     summary: Update learner settings (levels, topics, AI preferences, app settings)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentLevel:
 *                 type: string
 *                 enum: [A1, A2, B1, B2, C1, C2]
 *                 nullable: true
 *               targetLevel:
 *                 type: string
 *                 enum: [A1, A2, B1, B2, C1, C2]
 *                 nullable: true
 *               learningPurpose:
 *                 type: string
 *                 maxLength: 500
 *                 nullable: true
 *               topicsOfInterest:
 *                 type: array
 *                 items:
 *                   type: string
 *                 nullable: true
 *               aiPersonality:
 *                 type: string
 *                 enum: [FRIENDLY, FORMAL, CASUAL, ENCOURAGING, STRICT, PATIENT]
 *                 nullable: true
 *               voiceSpeed:
 *                 type: number
 *                 minimum: 0.5
 *                 maximum: 2.0
 *               autoSpeak:
 *                 type: boolean
 *               uiLanguage:
 *                 type: string
 *                 example: en
 *               theme:
 *                 type: string
 *                 enum: [light, dark]
 *               weeklyGoalMinutes:
 *                 type: integer
 *                 minimum: 5
 *                 maximum: 840
 *               timezone:
 *                 type: string
 *                 example: Asia/Baghdad
 *               emailDigestEnabled:
 *                 type: boolean
 *                 description: Opt out of the weekly progress digest email
 *     responses:
 *       200:
 *         description: Updated learner profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/LearnerProfile'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.patch("/me/learner-profile", authenticate, updateLearnerProfile);

// ─── Admin-only routes ────────────────────────────────────────────────────────

/**
 * @swagger
 * /users:
 *   get:
 *     summary: List all users (paginated) — Admin only
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of users per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [STUDENT, TUTOR, ADMIN]
 *         description: Filter by role
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by username, email, or display name (case-insensitive)
 *       - in: query
 *         name: subscriptionStatus
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, CANCELLED, PAST_DUE]
 *         description: Filter by subscription status
 *       - in: query
 *         name: plan
 *         schema:
 *           type: string
 *           enum: [FREE, GOLD, PREMIUM]
 *         description: Filter by subscription plan
 *       - in: query
 *         name: createdAfter
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter users created after this date (ISO 8601)
 *       - in: query
 *         name: createdBefore
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter users created before this date (ISO 8601)
 *     responses:
 *       200:
 *         description: Paginated list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Users retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       username:
 *                         type: string
 *                       email:
 *                         type: string
 *                       displayName:
 *                         type: string
 *                       avatarUrl:
 *                         type: string
 *                         nullable: true
 *                       isActive:
 *                         type: boolean
 *                       role:
 *                         type: string
 *                         enum: [STUDENT, TUTOR, ADMIN]
 *                       phoneNumber:
 *                         type: string
 *                         nullable: true
 *                       subscription:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           plan:
 *                             type: string
 *                             enum: [FREE, GOLD, PREMIUM]
 *                           status:
 *                             type: string
 *                             enum: [ACTIVE, INACTIVE, CANCELLED, PAST_DUE]
 *                           currentPeriodEnd:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Authenticated but not an admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", authenticate, authorize("ADMIN"), listUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a single user by ID (full profile) — Admin only
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User UUID
 *     responses:
 *       200:
 *         description: Full user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     displayName:
 *                       type: string
 *                     avatarUrl:
 *                       type: string
 *                       nullable: true
 *                     isActive:
 *                       type: boolean
 *                     role:
 *                       type: string
 *                       enum: [STUDENT, TUTOR, ADMIN]
 *                     phoneNumber:
 *                       type: string
 *                       nullable: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     learnerProfile:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         currentLevel:
 *                           type: string
 *                           nullable: true
 *                         targetLevel:
 *                           type: string
 *                           nullable: true
 *                         learningPurpose:
 *                           type: string
 *                           nullable: true
 *                         weeklyGoalMinutes:
 *                           type: integer
 *                         timezone:
 *                           type: string
 *                         uiLanguage:
 *                           type: string
 *                         theme:
 *                           type: string
 *                         emailDigestEnabled:
 *                           type: boolean
 *                     subscription:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         plan:
 *                           type: string
 *                           enum: [FREE, GOLD, PREMIUM]
 *                         status:
 *                           type: string
 *                           enum: [ACTIVE, INACTIVE, CANCELLED, PAST_DUE]
 *                         currentPeriodStart:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                         currentPeriodEnd:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                         paymentProvider:
 *                           type: string
 *                           enum: [CASH, FIB, STRIPE]
 *                           nullable: true
 *                         monthlyTtsUsage:
 *                           type: integer
 *                     metrics:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         totalStudyTimeMinutes:
 *                           type: integer
 *                         totalWordsTyped:
 *                           type: integer
 *                         currentStreak:
 *                           type: integer
 *                         longestStreak:
 *                           type: integer
 *                         lastStudyDate:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                         estimatedLevel:
 *                           type: string
 *                           nullable: true
 *                         grammarSkill:
 *                           type: number
 *                         vocabularySkill:
 *                           type: number
 *                         fluencySkill:
 *                           type: number
 *                         speakingSkill:
 *                           type: number
 *                     authProvider:
 *                       type: string
 *                       enum: [LOCAL, GOOGLE]
 *                     emailVerified:
 *                       type: boolean
 *                     emailVerifiedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     classUsers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           role:
 *                             type: string
 *                             enum: [STUDENT, TUTOR, ADMIN]
 *                           class:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 format: uuid
 *                               className:
 *                                 type: string
 *                               classCode:
 *                                 type: string
 *                               classStatus:
 *                                 type: string
 *                                 enum: [ACTIVE, INACTIVE]
 *                     goals:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: string, format: uuid }
 *                           type: { type: string, enum: [VOCABULARY, SPEAKING, GRAMMAR, CONVERSATION, STUDY_TIME] }
 *                           description: { type: string }
 *                           target: { type: integer }
 *                           difficulty: { type: string, nullable: true, enum: [EASY, MEDIUM, HARD, EXPERT] }
 *                           status: { type: string, enum: [ACTIVE, COMPLETED, PAUSED, CANCELLED] }
 *                           progress: { type: integer }
 *                           startDate: { type: string, format: date-time }
 *                           targetDate: { type: string, format: date-time, nullable: true }
 *                           completedDate: { type: string, format: date-time, nullable: true }
 *                           createdAt: { type: string, format: date-time }
 *                           assignedByTutor:
 *                             nullable: true
 *                             type: object
 *                             properties:
 *                               id: { type: string, format: uuid }
 *                               displayName: { type: string }
 *                     vocabularies:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: string, format: uuid }
 *                           word: { type: string }
 *                           definition: { type: string }
 *                           partOfSpeech: { type: string, nullable: true }
 *                           masteryLevel: { type: integer }
 *                           source: { type: string, enum: [MANUAL, SESSION, ASSIGNED] }
 *                           srsInterval: { type: integer }
 *                           srsDue: { type: string, format: date-time, nullable: true }
 *                           reviewCount: { type: integer }
 *                           correctCount: { type: integer }
 *                           incorrectCount: { type: integer }
 *                           lastPracticed: { type: string, format: date-time, nullable: true }
 *                           createdAt: { type: string, format: date-time }
 *                           assignedByTutor:
 *                             nullable: true
 *                             type: object
 *                             properties:
 *                               id: { type: string, format: uuid }
 *                               displayName: { type: string }
 *                     sessions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: string, format: uuid }
 *                           mode: { type: string, enum: [TEXT, VOICE] }
 *                           topic: { type: string, nullable: true }
 *                           startedAt: { type: string, format: date-time }
 *                           endedAt: { type: string, format: date-time, nullable: true }
 *                           durationSeconds: { type: integer, nullable: true }
 *                           messageCount: { type: integer }
 *                           evaluation:
 *                             nullable: true
 *                             type: object
 *                             properties:
 *                               avgOverallScore: { type: number }
 *                               avgGrammarScore: { type: number }
 *                               avgVocabularyScore: { type: number }
 *                               avgFluencyScore: { type: number }
 *                               detectedCefrLevel: { type: string }
 *                               strengths: { type: array, items: { type: string } }
 *                               weaknesses: { type: array, items: { type: string } }
 *                     progress:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date: { type: string, format: date-time }
 *                           sessionsCount: { type: integer }
 *                           studyMinutes: { type: integer }
 *                           messagesCount: { type: integer }
 *                           wordsTyped: { type: integer }
 *                           vocabularyPracticed: { type: integer }
 *                           goalsAdvanced: { type: integer }
 *                     taskSubmissions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: string, format: uuid }
 *                           content: { type: string, nullable: true }
 *                           feedback: { type: string, nullable: true }
 *                           feedbackAt: { type: string, format: date-time, nullable: true }
 *                           createdAt: { type: string, format: date-time }
 *                           task:
 *                             type: object
 *                             properties:
 *                               id: { type: string, format: uuid }
 *                               title: { type: string }
 *                               description: { type: string }
 *                               deadline: { type: string, format: date-time, nullable: true }
 *                               status: { type: string, enum: [OPEN, CLOSED] }
 *                               class:
 *                                 type: object
 *                                 properties:
 *                                   id: { type: string, format: uuid }
 *                                   className: { type: string }
 *                     fibSubscriptions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: string, format: uuid }
 *                           plan: { type: string, enum: [FREE, GOLD, PREMIUM] }
 *                           intervalMonths: { type: integer }
 *                           amountIQD: { type: integer }
 *                           fibStatus: { type: string }
 *                           activatedAt: { type: string, format: date-time, nullable: true }
 *                           cancelledAt: { type: string, format: date-time, nullable: true }
 *                           createdAt: { type: string, format: date-time }
 *       400:
 *         description: Invalid UUID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Authenticated but not an admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", authenticate, authorize("ADMIN"), getUser);

export default router;
