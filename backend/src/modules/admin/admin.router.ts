import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.ts";
import { authorize } from "../../middlewares/authorize.ts";
import { patchUser, putSubscription, deleteSubscription, getDashboardHandler, adminPatchProfileHandler, adminUploadAvatarHandler, adminPatchLearnerProfileHandler } from "./admin.controller.ts";
import { avatarUpload } from "../../middlewares/upload.ts";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only user and subscription management
 */

/**
 * @swagger
 * /admin/users/{id}:
 *   patch:
 *     summary: Update a user's role and/or active status — Admin only
 *     tags: [Admin]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [STUDENT, TUTOR, ADMIN]
 *                 description: New role for the user
 *               isActive:
 *                 type: boolean
 *                 description: Set to false to deactivate (soft ban), true to re-activate
 *             minProperties: 1
 *     responses:
 *       200:
 *         description: User updated successfully
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
 *                   example: User updated successfully
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
 *                     role:
 *                       type: string
 *                       enum: [STUDENT, TUTOR, ADMIN]
 *                     isActive:
 *                       type: boolean
 *                     subscription:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         plan:
 *                           type: string
 *                           enum: [FREE, GOLD, PREMIUM]
 *                         status:
 *                           type: string
 *                           enum: [ACTIVE, INACTIVE, CANCELLED, PAST_DUE]
 *                         currentPeriodEnd:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
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
 *       409:
 *         description: |
 *           Blocked to prevent lockout — the admin tried to change their own role or
 *           deactivate their own account, or the change would remove the last active admin.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: Validation error — at least one field required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Platform-wide admin dashboard stats — Admin only
 *     description: |
 *       Returns a single aggregated snapshot of platform health:
 *       - Total users by role (STUDENT/TUTOR/ADMIN)
 *       - Active subscriptions by plan (FREE/GOLD/PREMIUM)
 *       - Daily active users (had a session today) and weekly active users (last 7 days)
 *       - Total sessions started today
 *       - Active paid subscriptions grouped by payment provider (CASH/FIB/STRIPE)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: object
 *                       properties:
 *                         total: { type: integer }
 *                         byRole:
 *                           type: object
 *                           properties:
 *                             STUDENT: { type: integer }
 *                             TUTOR: { type: integer }
 *                             ADMIN: { type: integer }
 *                     subscriptions:
 *                       type: object
 *                       properties:
 *                         FREE: { type: integer }
 *                         GOLD: { type: integer }
 *                         PREMIUM: { type: integer }
 *                     activeUsers:
 *                       type: object
 *                       properties:
 *                         daily: { type: integer, description: Users with a session today }
 *                         weekly: { type: integer, description: Users with a session in the last 7 days }
 *                     totalSessionsToday: { type: integer }
 *                     revenueByProvider:
 *                       type: object
 *                       description: Count of active paid subscriptions per payment provider
 *                       additionalProperties: { type: integer }
 *       401: { description: Missing or invalid token, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 *       403: { description: Not an admin, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 */
router.get("/dashboard", getDashboardHandler);

router.patch("/users/:id", patchUser);

/**
 * @swagger
 * /admin/users/{id}/subscription:
 *   put:
 *     summary: Assign or update a subscription for a user — Admin only
 *     description: >
 *       Sets the user's subscription to ACTIVE with the chosen plan.
 *       Provide either `durationMonths` (1, 3, 6, or 12) for a standard period,
 *       or a custom `endDate` (ISO datetime) for a non-standard deal.
 *       Existing subscriptions are overwritten. `currentPeriodStart` is always set to now.
 *     tags: [Admin]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plan]
 *             properties:
 *               plan:
 *                 type: string
 *                 enum: [FREE, GOLD, PREMIUM]
 *                 description: Subscription tier to assign. FREE is permanent (no period dates required).
 *               durationMonths:
 *                 type: integer
 *                 enum: [1, 3, 6, 12]
 *                 description: Duration in months (from today). Required for GOLD/PREMIUM unless endDate is provided.
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Custom end date — must be in the future (ISO 8601). Required for GOLD/PREMIUM unless durationMonths is provided.
 *               paymentProvider:
 *                 type: string
 *                 enum: [CASH, FIB, STRIPE]
 *                 description: Payment method used. Defaults to CASH (admin manual assignment for institute cash payments).
 *     responses:
 *       200:
 *         description: Subscription assigned successfully
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
 *                   example: Subscription assigned successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     plan:
 *                       type: string
 *                       enum: [FREE, GOLD, PREMIUM]
 *                     status:
 *                       type: string
 *                       enum: [ACTIVE, INACTIVE, CANCELLED, PAST_DUE]
 *                     currentPeriodStart:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     currentPeriodEnd:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     paymentProvider:
 *                       type: string
 *                       enum: [CASH, FIB, STRIPE]
 *                       nullable: true
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
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
 *       422:
 *         description: Validation error — plan required; provide durationMonths or endDate
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Cancel a user's subscription — Admin only
 *     description: >
 *       Downgrades the user to FREE ACTIVE. They retain AI access at FREE tier limits.
 *       To block all access, use PATCH /admin/users/:id with isActive=false instead.
 *     tags: [Admin]
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
 *         description: Subscription cancelled successfully
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
 *                   example: Subscription cancelled successfully
 *                 data:
 *                   nullable: true
 *                   example: null
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
 *         description: User not found or has no subscription
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/users/:id/subscription", putSubscription);
router.delete("/users/:id/subscription", deleteSubscription);

// ── Admin user profile & learner profile editing ──────────────────────────────
router.patch("/users/:id/profile", adminPatchProfileHandler);
router.post("/users/:id/avatar", avatarUpload.single("avatar"), adminUploadAvatarHandler);
router.patch("/users/:id/learner-profile", adminPatchLearnerProfileHandler);

export default router;
