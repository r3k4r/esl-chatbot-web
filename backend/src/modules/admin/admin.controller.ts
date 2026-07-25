import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.ts";
import { sendSuccess } from "../../utils/apiResponse.ts";
import {
  updateUserBodySchema,
  assignSubscriptionBodySchema,
  adminUserParamSchema,
  adminUpdateProfileSchema,
  adminUpdateLearnerProfileSchema,
} from "./admin.schema.ts";
import {
  updateUser,
  assignSubscription,
  cancelSubscription,
  getAdminDashboardStats,
  adminUpdateProfile,
  adminUploadAvatar,
  adminUpdateLearnerProfile,
} from "./admin.service.ts";
import { AppError } from "../../utils/AppError.ts";

export const patchUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const { id } = adminUserParamSchema.parse(req.params);
  const body = updateUserBodySchema.parse(req.body);
  const user = await updateUser(id, body, req.user.id);
  sendSuccess(res, user, "User updated successfully");
});

export const putSubscription = asyncHandler(async (req: Request, res: Response) => {
  const { id } = adminUserParamSchema.parse(req.params);
  const body = assignSubscriptionBodySchema.parse(req.body);
  const sub = await assignSubscription(id, body);
  sendSuccess(res, sub, "Subscription assigned successfully");
});

export const deleteSubscription = asyncHandler(async (req: Request, res: Response) => {
  const { id } = adminUserParamSchema.parse(req.params);
  await cancelSubscription(id);
  sendSuccess(res, null, "Subscription cancelled successfully");
});

export const getDashboardHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getAdminDashboardStats();
  sendSuccess(res, data, "Dashboard stats retrieved");
});

export const adminPatchProfileHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = adminUserParamSchema.parse(req.params);
  const body = adminUpdateProfileSchema.parse(req.body);
  const user = await adminUpdateProfile(id, body);
  sendSuccess(res, user, "Profile updated successfully");
});

export const adminUploadAvatarHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = adminUserParamSchema.parse(req.params);
  if (!req.file) throw new AppError("No file uploaded", 400);
  const result = await adminUploadAvatar(id, req.file.buffer, req.file.mimetype);
  sendSuccess(res, result, "Avatar updated successfully");
});

export const adminPatchLearnerProfileHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = adminUserParamSchema.parse(req.params);
  const body = adminUpdateLearnerProfileSchema.parse(req.body);
  const profile = await adminUpdateLearnerProfile(id, body);
  sendSuccess(res, profile, "Learner profile updated successfully");
});
