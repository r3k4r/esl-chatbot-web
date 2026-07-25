import { Router } from "express";
import {
  listClasses,
  getClass,
  createClassHandler,
  updateClassHandler,
  refreshCodeHandler,
  updateCodeSettingsHandler,
  setBlockedHandler,
  setArchivedHandler,
  joinByCodeHandler,
  listMyClassesHandler,
  listClassStudentsHandler,
  getClassStudentHandler,
  removeMemberHandler,
  setMemberRoleHandler,
  getClassAnalyticsHandler,
} from "./classes.controller.ts";
import { authenticate } from "../../middlewares/authenticate.ts";
import { authorize } from "../../middlewares/authorize.ts";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Classes
 *   description: Class management — create, join by code, manage code lifecycle
 *
 * components:
 *   schemas:
 *     ClassCodeInfo:
 *       type: object
 *       properties:
 *         classId:
 *           type: string
 *           format: uuid
 *         classCode:
 *           type: string
 *         classCodeBlocked:
 *           type: boolean
 *         classCodeExpiresAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Null means the code never expires automatically
 *         classCodeRefreshIntervalSeconds:
 *           type: integer
 *           nullable: true
 *           description: Auto-refresh interval in seconds. Null means no auto refresh.
 *         classCodeRefreshedAt:
 *           type: string
 *           format: date-time
 */

// ─────────────────────────────────────────────────────────
// LIST (admin)
// ─────────────────────────────────────────────────────────
/**
 * @swagger
 * /classes:
 *   get:
 *     summary: List all classes (paginated) — Admin only
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *       - in: query
 *         name: archived
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: "true = only archived classes; omitted/false = only non-archived (default)"
 *     responses:
 *       200:
 *         description: Paginated list of classes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Classes retrieved successfully }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, format: uuid }
 *                       className: { type: string }
 *                       classCode: { type: string }
 *                       classCategory: { type: string, nullable: true }
 *                       classStatus: { type: string, enum: [ACTIVE, INACTIVE] }
 *                       archived: { type: boolean }
 *                       archivedAt: { type: string, format: date-time, nullable: true }
 *                       classCodeBlocked: { type: boolean }
 *                       classCodeExpiresAt: { type: string, format: date-time, nullable: true }
 *                       classCodeRefreshIntervalSeconds: { type: integer, nullable: true }
 *                       createdAt: { type: string, format: date-time }
 *                       memberCount: { type: integer }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 *                     totalPages: { type: integer }
 *       400: { description: Invalid query, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       401: { description: Missing or invalid token, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       403: { description: Not an admin, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 */
router.get("/", authenticate, authorize("ADMIN"), listClasses);

// ─────────────────────────────────────────────────────────
// CREATE (tutor / admin)
// ─────────────────────────────────────────────────────────
/**
 * @swagger
 * /classes:
 *   post:
 *     summary: Create a new class (Tutor or Admin)
 *     description: |
 *       Creates a class and adds the caller to it as a TUTOR member.
 *       A fresh class code is generated immediately.
 *
 *       If `classCodeRefreshIntervalSeconds` is omitted or null, the code is
 *       permanent (no automatic expiry). The tutor can still rotate it manually.
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [className]
 *             properties:
 *               className:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               classCategory:
 *                 type: string
 *                 maxLength: 100
 *                 nullable: true
 *               classCodeRefreshIntervalSeconds:
 *                 type: integer
 *                 nullable: true
 *                 minimum: 60
 *                 description: |
 *                   Auto-refresh interval in seconds. Common presets:
 *                   86400 (daily), 604800 (weekly), 2592000 (monthly),
 *                   31536000 (yearly). Omit or null = no auto refresh.
 *     responses:
 *       201:
 *         description: Class created
 *       400:
 *         description: Invalid body
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: Missing or invalid token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: Not a tutor or admin
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post("/", authenticate, authorize("TUTOR", "ADMIN"), createClassHandler);

// ─────────────────────────────────────────────────────────
// JOIN BY CODE (any authenticated user)
// ─────────────────────────────────────────────────────────
/**
 * @swagger
 * /classes/join:
 *   post:
 *     summary: Join a class by entering its code
 *     description: |
 *       Joins the caller to the class identified by the supplied code.
 *       No tutor approval is required.
 *
 *       Codes are case-insensitive and trimmed before matching.
 *
 *       Possible failure reasons:
 *       - **404** — code does not match any class
 *       - **403** — code is currently blocked by the tutor
 *       - **409** — class is INACTIVE, or caller is already a member
 *       - **410** — code has expired (the system will have rotated it
 *         to a new value internally; ask the tutor for the new code)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [classCode]
 *             properties:
 *               classCode: { type: string, example: "XK7A9PQ2" }
 *     responses:
 *       201:
 *         description: Successfully joined the class
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
 *                     classId: { type: string, format: uuid }
 *                     className: { type: string }
 *                     classCode: { type: string }
 *                     role: { type: string, enum: [STUDENT, TUTOR] }
 *                     joinedAt: { type: string, format: date-time }
 *       400: { description: Validation error, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       401: { description: Missing or invalid token, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       403: { description: Code is blocked, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       404: { description: Code does not match a class, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       409: { description: Already a member or class inactive, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       410: { description: Code has expired, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 */
router.post("/join", authenticate, joinByCodeHandler);

// ─────────────────────────────────────────────────────────
// MY CLASSES (any authenticated user)
// ─────────────────────────────────────────────────────────
/**
 * @swagger
 * /classes/mine:
 *   get:
 *     summary: List the classes the authenticated user is a member of
 *     description: |
 *       Returns every class the caller belongs to, with their role per
 *       class (`myRole`) and the full code lifecycle fields.
 *
 *       **Refresh-on-read:** before returning, any class where the caller
 *       is a TUTOR and the code is currently expired is rotated to a new
 *       value. Student memberships do NOT trigger rotations — students
 *       cannot bump codes by listing their classes.
 *
 *       Pass `?archived=true` to list the caller's archived classes instead of
 *       their active ones (default is non-archived only).
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: archived
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: "true = only the caller's archived classes; omitted/false = only non-archived (default)"
 *     responses:
 *       200:
 *         description: Caller's class memberships
 *       401: { description: Missing or invalid token, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 */
router.get("/mine", authenticate, listMyClassesHandler);

// ─────────────────────────────────────────────────────────
// DETAIL (admin or member of the class)
// ─────────────────────────────────────────────────────────
/**
 * @swagger
 * /classes/{id}:
 *   get:
 *     summary: Get a single class by ID with members
 *     description: |
 *       Returns the class detail (including the current code value and
 *       lifecycle fields) plus all members.
 *
 *       **Access:**
 *       - Admins can read any class
 *       - Tutors and students who are members of the class can read it
 *       - Anyone else gets a 404 (class existence is not revealed)
 *
 *       **Refresh-on-read:** when the caller is an admin or a tutor of
 *       this class AND `classCodeExpiresAt` is in the past, the code is
 *       rotated to a new value before being returned. This means tutors
 *       can simply open the class to get a fresh code — no manual click
 *       required. Student callers do NOT trigger a rotation.
 *
 *       The response includes `myRole` — the caller's own class-membership
 *       role (`TUTOR`, `STUDENT`, or `null` for an admin who isn't a member).
 *       It is derived from a direct membership lookup, so it is correct even
 *       when the caller is excluded from the `members` array (internal
 *       accounts). Clients should gate tutor-only UI on `myRole`, not by
 *       searching `members` for themselves.
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Class detail with enrolled members and the caller's own `myRole`
 *       400: { description: Invalid UUID, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       401: { description: Missing or invalid token, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       404: { description: Class not found or caller not a member, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 */
router.get("/:id", authenticate, getClass);

// ─────────────────────────────────────────────────────────
// UPDATE CLASS (tutor in class / admin)
// ─────────────────────────────────────────────────────────
/**
 * @swagger
 * /classes/{id}:
 *   patch:
 *     summary: Update class name, category, or status (Tutor in class or Admin)
 *     description: |
 *       Updates one or more class fields. At least one field must be provided.
 *
 *       Setting `classStatus` to `INACTIVE` prevents new join attempts via the class code
 *       (join returns 409). Existing members are not removed.
 *
 *       Authorization: tutor of the class or admin. Students cannot update class details.
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               className:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: New class name
 *               classCategory:
 *                 type: string
 *                 maxLength: 100
 *                 nullable: true
 *                 description: Category label (null clears it)
 *               classStatus:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 description: INACTIVE prevents new joins; existing members are kept
 *     responses:
 *       200:
 *         description: Updated class detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   description: Full class detail including updated members list
 *       400: { description: Invalid body or no fields provided, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       401: { description: Missing or invalid token, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       403: { description: Caller is not a tutor of this class, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       404: { description: Class not found, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       422: { description: Validation error, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 */
router.patch("/:id", authenticate, authorize("TUTOR", "ADMIN"), updateClassHandler);

// ─────────────────────────────────────────────────────────
// REFRESH CODE (tutor in class / admin)
// ─────────────────────────────────────────────────────────
/**
 * @swagger
 * /classes/{id}/code/refresh:
 *   post:
 *     summary: Manually rotate the class code (Tutor in class or Admin)
 *     description: |
 *       Generates a new random code and resets the expiry window using
 *       the class's current refresh interval. Does not unblock a blocked code.
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: New code information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { $ref: '#/components/schemas/ClassCodeInfo' }
 *       401: { description: Missing or invalid token, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       403: { description: Not a tutor of this class, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       404: { description: Class not found, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 */
router.post("/:id/code/refresh", authenticate, authorize("TUTOR", "ADMIN"), refreshCodeHandler);

// ─────────────────────────────────────────────────────────
// UPDATE CODE SETTINGS (tutor in class / admin)
// ─────────────────────────────────────────────────────────
/**
 * @swagger
 * /classes/{id}/code/settings:
 *   patch:
 *     summary: Update the class code auto-refresh interval (Tutor in class or Admin)
 *     description: |
 *       Sets how often the class code auto-refreshes. The new schedule
 *       takes effect immediately, computed from the last refresh timestamp.
 *
 *       Pass `null` to make the code permanent (no automatic refresh).
 *
 *       Common presets (in seconds):
 *       - daily: 86400
 *       - weekly: 604800
 *       - monthly: 2592000
 *       - yearly: 31536000
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [classCodeRefreshIntervalSeconds]
 *             properties:
 *               classCodeRefreshIntervalSeconds:
 *                 type: integer
 *                 nullable: true
 *                 minimum: 60
 *     responses:
 *       200:
 *         description: Updated code information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { $ref: '#/components/schemas/ClassCodeInfo' }
 *       400: { description: Invalid body, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       401: { description: Missing or invalid token, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       403: { description: Not a tutor of this class, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       404: { description: Class not found, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 */
router.patch(
  "/:id/code/settings",
  authenticate,
  authorize("TUTOR", "ADMIN"),
  updateCodeSettingsHandler,
);

// ─────────────────────────────────────────────────────────
// BLOCK / UNBLOCK CODE (tutor in class / admin)
// ─────────────────────────────────────────────────────────
/**
 * @swagger
 * /classes/{id}/code/block:
 *   patch:
 *     summary: Block or unblock the class code (Tutor in class or Admin)
 *     description: |
 *       Blocking does not change the code value or its expiry — it only
 *       prevents new join attempts. Pass `{ blocked: false }` to unblock.
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [blocked]
 *             properties:
 *               blocked: { type: boolean }
 *     responses:
 *       200:
 *         description: Updated code information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { $ref: '#/components/schemas/ClassCodeInfo' }
 *       400: { description: Invalid body, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       401: { description: Missing or invalid token, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       403: { description: Not a tutor of this class, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       404: { description: Class not found, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 */
router.patch("/:id/code/block", authenticate, authorize("TUTOR", "ADMIN"), setBlockedHandler);

// ─────────────────────────────────────────────────────────
// ARCHIVE / UNARCHIVE (tutor in class / admin)
// ─────────────────────────────────────────────────────────
/**
 * @swagger
 * /classes/{id}/archive:
 *   patch:
 *     summary: Archive or unarchive a class (Tutor in class or Admin)
 *     description: |
 *       Archiving hides the class from the default class lists and makes it
 *       **read-only** — while archived, the class cannot be edited, its code
 *       cannot be rotated/blocked, and no one can join it (these all return 409).
 *       Members, code, and all data are preserved; archiving is fully reversible.
 *
 *       Archived classes still appear when listing with `?archived=true`. Unarchive
 *       (`{ archived: false }`) to restore full functionality.
 *
 *       Authorization: tutor of the class or admin.
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [archived]
 *             properties:
 *               archived: { type: boolean }
 *     responses:
 *       200:
 *         description: Updated class detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   description: Full class detail including the archived/archivedAt fields
 *       400: { description: Invalid body, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       401: { description: Missing or invalid token, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       403: { description: Not a tutor of this class, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       404: { description: Class not found, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 */
router.patch("/:id/archive", authenticate, authorize("TUTOR", "ADMIN"), setArchivedHandler);

// ─────────────────────────────────────────────────────────
// STUDENT LIST (tutor in class / admin)
// ─────────────────────────────────────────────────────────
/**
 * @swagger
 * /classes/{id}/students:
 *   get:
 *     summary: List students in a class with progress data (Tutor in class or Admin)
 *     description: |
 *       Returns all STUDENT members of the class along with a progress snapshot:
 *       current English level, estimated CEFR level from AI evaluations, study
 *       streak, study time, and vocabulary counts (total + due for SRS review today).
 *
 *       Only tutors of the class and admins can call this endpoint.
 *       Students cannot view other students' progress data.
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: List of students with progress snapshots
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId: { type: string, format: uuid }
 *                       username: { type: string }
 *                       displayName: { type: string }
 *                       avatarUrl: { type: string, nullable: true }
 *                       joinedAt: { type: string, format: date-time }
 *                       currentLevel: { type: string, nullable: true, description: Self-reported English level from learner profile }
 *                       targetLevel: { type: string, nullable: true }
 *                       currentStreak: { type: integer }
 *                       estimatedLevel: { type: string, nullable: true, description: AI-estimated CEFR level from session evaluations }
 *                       totalStudyTimeMinutes: { type: integer }
 *                       grammarSkill: { type: number, description: 0–100 skill score }
 *                       vocabularySkill: { type: number, description: 0–100 skill score }
 *                       vocabTotal: { type: integer, description: Total vocabulary cards saved }
 *                       vocabDueToday: { type: integer, description: SRS cards due for review today }
 *       401: { description: Missing or invalid token, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       403: { description: Caller is a student (not tutor or admin), content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       404: { description: Class not found or caller not a member, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 */
// ─────────────────────────────────────────────────────────
// CLASS ANALYTICS (tutor in class / admin)
// ─────────────────────────────────────────────────────────
/**
 * @swagger
 * /classes/{id}/analytics:
 *   get:
 *     summary: Aggregated analytics for a class (Tutor in class or Admin)
 *     description: |
 *       Returns class-wide aggregated analytics:
 *       - Average grammar/vocabulary/fluency skill scores across all students
 *       - Most common grammar error types from the last 30 days of message evaluations (top 5)
 *       - Average vocabulary coverage (average word count per student)
 *
 *       Only tutors of the class and admins can call this endpoint.
 *       Returns zero values if the class has no student members yet.
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Class analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     classId: { type: string, format: uuid }
 *                     className: { type: string }
 *                     studentCount: { type: integer }
 *                     averageSkills:
 *                       type: object
 *                       properties:
 *                         grammar: { type: number, description: 0–100 }
 *                         vocabulary: { type: number, description: 0–100 }
 *                         fluency: { type: number, description: 0–100 }
 *                     mostCommonGrammarErrors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           error: { type: string }
 *                           count: { type: integer }
 *                     vocabularyCoverage:
 *                       type: integer
 *                       description: Average number of vocabulary words per student
 *       401: { description: Missing or invalid token, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       403: { description: Caller is a student (not tutor or admin), content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       404: { description: Class not found, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 */
router.get("/:id/analytics", authenticate, getClassAnalyticsHandler);

router.get("/:id/students", authenticate, listClassStudentsHandler);

// ─────────────────────────────────────────────────────────
// STUDENT DETAIL (tutor in class / admin)
// ─────────────────────────────────────────────────────────
/**
 * @swagger
 * /classes/{id}/students/{userId}:
 *   get:
 *     summary: Get full progress detail for a single student (Tutor in class or Admin)
 *     description: |
 *       Returns the student's full learner profile, all metric skill scores, and
 *       vocabulary stats. The `userId` must be a STUDENT member of this class.
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Class ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Student's user ID
 *     responses:
 *       200:
 *         description: Full student detail
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
 *                     userId: { type: string, format: uuid }
 *                     username: { type: string }
 *                     displayName: { type: string }
 *                     avatarUrl: { type: string, nullable: true }
 *                     joinedAt: { type: string, format: date-time }
 *                     learnerProfile: { type: object, nullable: true, description: Student's learner profile settings and preferences }
 *                     metrics: { type: object, nullable: true, description: Aggregated skill metrics }
 *                     vocabTotal: { type: integer }
 *                     vocabDueToday: { type: integer }
 *       400: { description: Target user is not a student, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       401: { description: Missing or invalid token, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       403: { description: Caller is a student, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       404: { description: Class or student not found, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 */
router.get("/:id/students/:userId", authenticate, getClassStudentHandler);

// ─────────────────────────────────────────────────────────
// REMOVE MEMBER (self-leave / tutor / admin)
// ─────────────────────────────────────────────────────────
/**
 * @swagger
 * /classes/{id}/members/{userId}:
 *   delete:
 *     summary: Remove a member from the class (or self-leave)
 *     description: |
 *       **Self-leave:** any member can remove themselves from any class they belong to.
 *
 *       **Tutor:** can remove STUDENT members of their own class. Cannot remove other tutors.
 *
 *       **Admin:** can remove any member from any class.
 *
 *       **Guard:** the last tutor of a class cannot be removed. If a class has only one
 *       tutor, that tutor must first add another tutor before leaving or being removed.
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Class ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the member to remove (use own ID to leave)
 *     responses:
 *       200:
 *         description: Member removed (or left) successfully
 *       401: { description: Missing or invalid token, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       403: { description: Insufficient permissions to remove this member, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       404: { description: Class or member not found, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       409: { description: Cannot remove the last tutor, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 */
router.delete("/:id/members/:userId", authenticate, removeMemberHandler);

// ─────────────────────────────────────────────────────────
// SET MEMBER ROLE (assign / demote a class tutor)
// ─────────────────────────────────────────────────────────
/**
 * @swagger
 * /classes/{id}/members/{userId}/role:
 *   patch:
 *     summary: Set a member's class role (assign or demote a class tutor)
 *     description: |
 *       Changes an existing member's **class-membership role** (`TUTOR` or `STUDENT`).
 *       This is the only way — besides creating a class — to make someone a class-tutor;
 *       joining by code always enters as a STUDENT. Only the per-class role changes; the
 *       user's global account role (`User.role`) is untouched.
 *
 *       **Authorization:** a tutor of the class, or an admin. (A STUDENT-role account is
 *       rejected at the route guard; a TUTOR-role account that is only a STUDENT member of
 *       this class is rejected by the service with 403.)
 *
 *       **Guard:** the last tutor of a class cannot be demoted to STUDENT — promote another
 *       member to tutor first.
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Class ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: ID of the member whose role is being changed
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [STUDENT, TUTOR]
 *                 description: New class-membership role for the member
 *     responses:
 *       200:
 *         description: Member role updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     classId: { type: string, format: uuid }
 *                     userId: { type: string, format: uuid }
 *                     role: { type: string, enum: [STUDENT, TUTOR] }
 *                     user:
 *                       type: object
 *                       properties:
 *                         id: { type: string, format: uuid }
 *                         displayName: { type: string }
 *                         avatarUrl: { type: string, nullable: true }
 *       401: { description: Missing or invalid token, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       403: { description: Caller is not a tutor of this class or an admin, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       404: { description: Class not found, or user is not a member of the class, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       409: { description: Cannot demote the last tutor of a class, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       422: { description: Validation error, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 */
router.patch(
  "/:id/members/:userId/role",
  authenticate,
  authorize("TUTOR", "ADMIN"),
  setMemberRoleHandler,
);

export default router;
