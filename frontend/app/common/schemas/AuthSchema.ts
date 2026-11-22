import zod from "zod"

// Messages are i18n keys (auth.validation.*) — <FormError> translates them, so the same
// schema speaks English or Kurdish. The shared <Form> shows the LAST failing rule of a
// field, so "required" is listed last: an empty field says "required", not a format rule.
const V = 'auth.validation.'

const username = zod.string()
    .regex(/^[a-zA-Z0-9_]*$/, `${V}usernameChars`)
    .max(30, `${V}usernameMax`)
    .min(3, `${V}usernameMin`)
    .min(1, `${V}usernameRequired`)

const email = zod.string().email(`${V}emailInvalid`).min(1, `${V}emailRequired`)
const otp = zod.string().regex(/^\d*$/, `${V}otpNumeric`).length(6, `${V}otpLength`)
const newPassword = zod.string().min(8, `${V}passwordMin`)

export const signInSchema = zod.object({
    username: zod.string().min(1, `${V}usernameRequired`),
    password: zod.string().min(1, `${V}passwordRequired`),
})

export const signUpSchema = zod.object({
    username,
    email,
    password: newPassword,
    confirmPassword: newPassword,
    // Trimmed: a name of only spaces is no name.
    displayName: zod.string().trim().max(100, `${V}displayNameMax`).min(1, `${V}displayNameRequired`),
    acceptAgreement: zod.literal(true, { message: `${V}termsRequired` }),
}).refine((data: { password: string; confirmPassword: string }) => data.password === data.confirmPassword, {
    message: `${V}passwordsMatch`,
    path: ['confirmPassword'],
})

export const forgotPasswordSchema = zod.object({
    email,
})

export const verifyOtpSchema = zod.object({
    email: zod.string().email(`${V}emailInvalid`),
    otp,
})

export const resetPasswordSchema = zod.object({
    email: zod.string().email(`${V}emailInvalid`),
    otp,
    newPassword,
    confirmPassword: newPassword,
}).refine((data: { newPassword: string; confirmPassword: string }) => data.newPassword === data.confirmPassword, {
    message: `${V}passwordsMatch`,
    path: ['confirmPassword'],
})

export const setPasswordSchema = zod.object({
    newPassword,
    confirmPassword: newPassword,
}).refine((data: { newPassword: string; confirmPassword: string }) => data.newPassword === data.confirmPassword, {
    message: `${V}passwordsMatch`,
    path: ['confirmPassword'],
})

export const verifyEmailSchema = zod.object({
    email: zod.string().email(`${V}emailInvalid`),
    otp,
})

export const googleUsernameSchema = zod.object({
    username,
    acceptAgreement: zod.literal(true, { message: `${V}termsRequired` }),
})

export type SignInSchema = zod.infer<typeof signInSchema>
export type SignUpSchema = zod.infer<typeof signUpSchema>
export type ForgotPasswordSchema = zod.infer<typeof forgotPasswordSchema>
export type VerifyOtpSchema = zod.infer<typeof verifyOtpSchema>
export type ResetPasswordSchema = zod.infer<typeof resetPasswordSchema>
export type SetPasswordSchema = zod.infer<typeof setPasswordSchema>
export type GoogleUsernameSchema = zod.infer<typeof googleUsernameSchema>
export type VerifyEmailSchema = zod.infer<typeof verifyEmailSchema>
export type AcceptAgreementInput =
    | { username: string; password: string; idToken?: undefined }
    | { idToken: string; username?: undefined; password?: undefined }
