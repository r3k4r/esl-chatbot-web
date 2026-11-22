import { z } from 'zod'

// The profile page's one form (account + learning). Limits mirror the backend's users.schema.ts.
// Selects use 'NONE' for "not set" (Reka UI forbids an empty item value).
export const profileFormSchema = z.object({
  displayName: z.string().trim().min(1, 'Enter your name').max(100, 'Use 100 characters or fewer'),
  // Saved as "<code> <digits>", at most 20 characters on the backend.
  phoneCode: z.string(),
  phoneLocal: z.string().trim().regex(/^[0-9 ]*$/, 'Use digits only').max(15, 'Use 15 digits or fewer'),
  targetLevel: z.string(),
  learningPurpose: z.string().max(500, 'Use 500 characters or fewer'),
  topics: z.array(z.string().max(50)).max(20, 'Add up to 20 topics'),
  aiPersonality: z.string(),
  tutorAccent: z.enum(['US', 'GB']),
  tutorVoice: z.enum(['FEMALE', 'MALE']),
  dailyGoal: z.number({ message: 'Enter the minutes a day' }).int('Use whole minutes')
    .min(5, 'Set at least 5 minutes a day').max(120, 'Set at most 120 minutes a day'),
  emailDigestEnabled: z.boolean(),
})

export type ProfileFormValues = z.infer<typeof profileFormSchema>

// An admin editing someone's profile (users/[id]/profile): the same fields, plus their current
// level (students can't set their own). Voice and weekly email aren't on the admin endpoint.
export const adminUserFormSchema = profileFormSchema.extend({
  displayName: z.string().trim().min(1, 'Enter a name').max(100, 'Use 100 characters or fewer'),
  currentLevel: z.string(),
})

export type AdminUserFormValues = z.infer<typeof adminUserFormSchema>

// Change password (avatar menu → "Change password"). Same rules as POST /auth/change-password.
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: z.string().min(8, 'Use at least 8 characters'),
  confirmPassword: z.string().min(1, 'Repeat the new password'),
})
  .refine((d) => d.newPassword === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] })
  .refine((d) => d.newPassword !== d.currentPassword, { message: 'Choose a password different from the current one', path: ['newPassword'] })

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>
