import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Role, Plan, SubStatus } from "@prisma/client";
import { createHash, randomInt, randomUUID } from "crypto";
import { prisma } from "../../config/database.ts";
import { env } from "../../config/env.ts";
import { logger } from "../../config/logger.ts";
import { AppError } from "../../utils/AppError.ts";
import type {
  AuthUser,
  LoginInput,
  LoginResponse,
  RegisterInput,
  GoogleAuthInput,
  GoogleAuthResponse,
  GoogleProfile,
  JwtPayload,
  ForgotPasswordInput,
  ResetPasswordInput,
  LinkGoogleInput,
  SetPasswordInput,
  VerifyEmailInput,
  ResendVerificationInput,
  AcceptAgreementInput,
  AgreementContent,
} from "./auth.types.ts";
import { resend } from "../../config/resend.ts";
import { getCache, setCache, deleteCache, cacheKeys, cacheTTL } from "../../config/cache.ts";
import { CURRENT_AGREEMENT } from "./agreement.content.ts";

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const INVALID_CREDENTIALS_MSG = "Invalid username or password";
const INVALID_VERIFICATION_MSG = "Invalid or expired verification code";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES,
  } as jwt.SignOptions);
}

function signRefreshToken(userId: string): string {
  // jti (JWT ID) ensures uniqueness even when two tokens are issued within the same second,
  // preventing a tokenHash collision on the @unique constraint in RefreshToken.
  return jwt.sign({ sub: userId, jti: randomUUID() }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES,
  } as jwt.SignOptions);
}

/** Signs an access+refresh pair and persists the refresh hash. No DB read — the
 *  caller supplies the identity fields it already holds. */
async function persistTokenPair(
  user: { id: string; username: string; email: string; role: Role },
): Promise<{ accessToken: string; refreshToken: string }> {
  const payload: JwtPayload = {
    sub: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  return { accessToken, refreshToken };
}

/** Convenience wrapper for callers that only have a userId (fetches identity first). */
async function issueTokenPair(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return persistTokenPair(user);
}

/**
 * Verify a Google ID token via Google's tokeninfo endpoint.
 * Returns the decoded profile on success, throws AppError(401) on failure.
 */
async function verifyGoogleToken(idToken: string): Promise<GoogleProfile> {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new AppError("Google OAuth is not configured on this server", 503);
  }

  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );

  if (!response.ok) {
    throw new AppError("Invalid Google ID token", 401);
  }

  const payload = await response.json() as Record<string, string>;

  // Ensure token was issued for THIS application
  if (payload["aud"] !== env.GOOGLE_CLIENT_ID) {
    throw new AppError("Google token was not issued for this application", 401);
  }

  // Ensure email is verified on the Google account
  if (payload["email_verified"] !== "true") {
    throw new AppError("Google account email is not verified", 401);
  }

  return {
    googleId: payload["sub"] ?? "",
    email: payload["email"] ?? "",
    displayName: payload["name"] ?? payload["email"] ?? "",
    avatarUrl: payload["picture"] ?? null,
  };
}

// ─── Agreement (Terms of Service) helpers ─────────────────────────────────────

/** Returns the current Terms-of-Service version + text for GET /auth/agreement. */
export function getCurrentAgreement(): AgreementContent {
  return CURRENT_AGREEMENT;
}

/** True if the user has accepted the *current* agreement version (exact match). */
async function hasAcceptedCurrentAgreement(userId: string): Promise<boolean> {
  const row = await prisma.userAgreement.findUnique({
    where: { userId_version: { userId, version: CURRENT_AGREEMENT.version } },
    select: { id: true },
  });
  return row !== null;
}

/**
 * Records acceptance of the current agreement version for a user. Idempotent —
 * upsert means re-accepting the same version is a no-op (the original acceptedAt
 * and ipAddress are preserved as the authoritative record).
 */
async function recordAgreementAcceptance(userId: string, ipAddress?: string | null): Promise<void> {
  await prisma.userAgreement.upsert({
    where: { userId_version: { userId, version: CURRENT_AGREEMENT.version } },
    create: { userId, version: CURRENT_AGREEMENT.version, ipAddress: ipAddress ?? null },
    update: {},
  });
}

// ─── Login ───────────────────────────────────────────────────────────────────

type CredentialUser = {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: Role;
  avatarUrl: string | null;
  isActive: boolean;
  emailVerified: boolean;
  password: string | null;
  subscription: { plan: Plan; status: SubStatus } | null;
};

/**
 * Validates username + password and the account's login eligibility (active,
 * has a password, email verified). Throws the appropriate 400/403 on failure.
 * Shared by `login` and `acceptAgreement` so the re-accept flow re-checks
 * credentials exactly like a normal login. Does NOT run the agreement guard.
 */
async function verifyLoginCredentials(username: string, password: string): Promise<CredentialUser> {
  const user = await prisma.user.findUnique({
    where: { username },
    include: { subscription: { select: { plan: true, status: true } } },
  });

  // Same error for "not found" and "wrong password" — prevents username enumeration
  if (!user) {
    throw new AppError(INVALID_CREDENTIALS_MSG, 400);
  }

  if (!user.isActive) {
    throw new AppError("Your account has been deactivated. Please contact support.", 403);
  }

  // Google-only account: no password stored, must use Google sign-in
  if (!user.password) {
    throw new AppError(
      "This account was created with Google Sign-In. Please use the 'Sign in with Google' option.",
      400,
    );
  }

  const passwordValid = await bcryptjs.compare(password, user.password);
  if (!passwordValid) {
    throw new AppError(INVALID_CREDENTIALS_MSG, 400);
  }

  // Block login until the email is verified. Checked only after credentials are
  // confirmed valid, so we never reveal an account's verification state to someone
  // who doesn't know the password.
  if (!user.emailVerified) {
    throw new AppError(
      "Please verify your email before signing in. Check your inbox for the verification code.",
      403,
    );
  }

  return user;
}

function toAuthUser(user: CredentialUser): AuthUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    subscription: user.subscription
      ? { plan: user.subscription.plan, status: user.subscription.status }
      : null,
  };
}

export async function login(input: LoginInput): Promise<LoginResponse> {
  const user = await verifyLoginCredentials(input.username, input.password);

  // Re-accept guard: a user who has not accepted the current Terms of Service
  // version is blocked (403) and must re-accept via POST /auth/accept-agreement.
  // Bumping CURRENT_AGREEMENT.version invalidates every prior acceptance.
  if (!(await hasAcceptedCurrentAgreement(user.id))) {
    throw new AppError(
      "Please review and accept the updated Terms of Service to continue.",
      403,
      { needsAgreement: true, agreementVersion: CURRENT_AGREEMENT.version },
    );
  }

  const { accessToken, refreshToken } = await persistTokenPair(user);
  return { user: toAuthUser(user), accessToken, refreshToken };
}

/**
 * Re-accepts the current Terms of Service for a user whose login was blocked with
 * `needsAgreement`. Credentials are re-validated (the blocked user holds no token),
 * acceptance is recorded, and a token pair is issued — completing login in one call.
 */
export async function acceptAgreement(
  input: AcceptAgreementInput,
  ipAddress?: string | null,
): Promise<LoginResponse> {
  const user =
    input.idToken !== undefined
      ? await verifyGoogleCredentials(input.idToken)
      : await verifyLoginCredentials(input.username, input.password);
  await recordAgreementAcceptance(user.id, ipAddress);
  const { accessToken, refreshToken } = await persistTokenPair(user);
  return { user: toAuthUser(user), accessToken, refreshToken };
}

/**
 * Resolves the account behind a Google ID token for the re-accept flow (Google
 * accounts have no password to re-validate). Verifies the token, then finds the
 * user by googleId (falling back to the verified email for a not-yet-linked
 * LOCAL account). Throws the same 404/403 shape as a normal login.
 */
async function verifyGoogleCredentials(idToken: string): Promise<CredentialUser> {
  const profile = await verifyGoogleToken(idToken);
  const user =
    (await prisma.user.findUnique({
      where: { googleId: profile.googleId },
      include: { subscription: { select: { plan: true, status: true } } },
    })) ??
    (await prisma.user.findUnique({
      where: { email: profile.email },
      include: { subscription: { select: { plan: true, status: true } } },
    }));

  if (!user) {
    throw new AppError("No account is linked to this Google sign-in.", 404);
  }
  if (!user.isActive) {
    throw new AppError("Your account has been deactivated. Please contact support.", 403);
  }
  return user;
}

// ─── Register ────────────────────────────────────────────────────────────────

export async function register(input: RegisterInput, ipAddress?: string | null): Promise<AuthUser> {
  // Check uniqueness before the transaction to give a clear error message
  const existingByUsername = await prisma.user.findUnique({ where: { username: input.username } });
  if (existingByUsername) throw new AppError("Username is already taken", 409);

  const existingByEmail = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingByEmail) throw new AppError("Email is already registered", 409);

  const hashedPassword = await bcryptjs.hash(input.password, 12);

  // Create User + LearnerProfile + Subscription (FREE/INACTIVE) + UserMetrics +
  // Terms-of-Service acceptance atomically. The schema requires acceptAgreement:true,
  // so by this point the user has accepted the current agreement version.
  const newUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username: input.username,
        email: input.email,
        password: hashedPassword,
        displayName: input.displayName,
        authProvider: "LOCAL",
      },
    });

    await tx.learnerProfile.create({ data: { userId: user.id, weeklyGoalMinutes: 210 } });

    // INACTIVE until the user purchases a subscription
    await tx.subscription.create({
      data: { userId: user.id, plan: "FREE", status: "INACTIVE" },
    });

    await tx.userMetrics.create({ data: { userId: user.id } });

    await tx.userAgreement.create({
      data: { userId: user.id, version: CURRENT_AGREEMENT.version, ipAddress: ipAddress ?? null },
    });

    return user;
  });

  // Send the email-verification OTP. Best-effort: a missing email service (e.g.
  // local dev without RESEND_API_KEY) must NOT block account creation — the user
  // can request a fresh code later via POST /auth/resend-verification.
  try {
    const otp = await createEmailVerificationOtp(newUser.id);
    await sendVerificationEmail(newUser.email, newUser.displayName, otp);
  } catch (err) {
    logger.warn(`Could not send verification email to ${newUser.email}: ${(err as Error).message}`);
  }

  // No tokens are issued here. The account is created but cannot be used until the
  // email is verified (POST /auth/verify-email) — login() rejects unverified LOCAL
  // accounts. This prevents registering with someone else's email and using the
  // account without proving ownership.
  return {
    id: newUser.id,
    username: newUser.username,
    email: newUser.email,
    displayName: newUser.displayName,
    role: newUser.role,
    avatarUrl: newUser.avatarUrl,
    isActive: newUser.isActive,
    emailVerified: newUser.emailVerified,
    // We know exactly what was just created
    subscription: { plan: "FREE", status: "INACTIVE" },
  };
}

// ─── Google Auth ─────────────────────────────────────────────────────────────

export async function googleAuth(
  input: GoogleAuthInput,
  ipAddress?: string | null,
): Promise<GoogleAuthResponse> {
  const profile = await verifyGoogleToken(input.idToken);

  // Case A: existing Google user — direct login
  let user = await prisma.user.findUnique({
    where: { googleId: profile.googleId },
    include: { subscription: { select: { plan: true, status: true } } },
  });

  // Case B: existing LOCAL user with same email — merge (link Google to their account)
  if (!user) {
    const localUser = await prisma.user.findUnique({
      where: { email: profile.email },
      include: { subscription: { select: { plan: true, status: true } } },
    });

    if (localUser) {
      // Link Google + activate FREE subscription (if still INACTIVE) in one
      // transaction. Linking Google also verifies the email — Google has already
      // confirmed it (we reject unverified Google emails in verifyGoogleToken).
      user = await prisma.$transaction(async (tx) => {
        await tx.subscription.updateMany({
          where: { userId: localUser.id, status: "INACTIVE" },
          data: { status: "ACTIVE" },
        });
        return tx.user.update({
          where: { id: localUser.id },
          data: {
            googleId: profile.googleId,
            avatarUrl: localUser.avatarUrl ?? profile.avatarUrl,
            emailVerified: true,
            emailVerifiedAt: localUser.emailVerified ? undefined : new Date(),
          },
          include: { subscription: { select: { plan: true, status: true } } },
        });
      });
      await deleteCache(cacheKeys.authUser(localUser.id));
    }
  }

  // Case C/D: brand new Google user
  if (!user) {
    // Need a username before we can create the account
    if (!input.username) {
      // Tell the frontend to show a username input, then call this endpoint again with username
      return {
        needsRegistration: true,
        profile,
      };
    }

    const usernameExists = await prisma.user.findUnique({ where: { username: input.username } });
    if (usernameExists) throw new AppError("Username is already taken", 409);

    // Creating a brand-new account requires accepting the Terms of Service. The
    // frontend collects this checkbox on the same screen as the username.
    if (!input.acceptAgreement) {
      throw new AppError("You must accept the Terms of Service to create an account", 400);
    }

    // Create User + LearnerProfile + Subscription (FREE/ACTIVE) + UserMetrics +
    // Terms-of-Service acceptance atomically.
    // Google-authenticated users are verified immediately — FREE tier is active from day one
    const created = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username: input.username!,
          email: profile.email,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          authProvider: "GOOGLE",
          googleId: profile.googleId,
          // Google has already verified this email — mark it verified on creation
          emailVerified: true,
          emailVerifiedAt: new Date(),
          // password intentionally omitted — Google users have no password
        },
      });

      await tx.learnerProfile.create({ data: { userId: newUser.id, weeklyGoalMinutes: 210 } });
      await tx.subscription.create({
        data: { userId: newUser.id, plan: "FREE", status: "ACTIVE" },
      });
      await tx.userMetrics.create({ data: { userId: newUser.id } });
      await tx.userAgreement.create({
        data: { userId: newUser.id, version: CURRENT_AGREEMENT.version, ipAddress: ipAddress ?? null },
      });

      return newUser;
    });

    const { accessToken, refreshToken } = await issueTokenPair(created.id);

    return {
      needsRegistration: false,
      user: {
        id: created.id,
        username: created.username,
        email: created.email,
        displayName: created.displayName,
        role: created.role,
        avatarUrl: created.avatarUrl,
        isActive: created.isActive,
        emailVerified: created.emailVerified,
        subscription: { plan: "FREE", status: "ACTIVE" },
      },
      accessToken,
      refreshToken,
    };
  }

  if (!user.isActive) {
    throw new AppError("Your account has been deactivated. Please contact support.", 403);
  }

  // Same re-accept guard as password login — applies to existing Google logins and
  // to the LOCAL→Google merge above. Without this, bumping the agreement version
  // would force password users to re-accept but silently let Google users through.
  // Google users re-accept via POST /auth/accept-agreement with their idToken.
  if (!(await hasAcceptedCurrentAgreement(user.id))) {
    throw new AppError(
      "Please review and accept the updated Terms of Service to continue.",
      403,
      { needsAgreement: true, agreementVersion: CURRENT_AGREEMENT.version },
    );
  }

  const { accessToken, refreshToken } = await issueTokenPair(user.id);

  return {
    needsRegistration: false,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      subscription: user.subscription
        ? { plan: user.subscription.plan, status: user.subscription.status }
        : null,
    },
    accessToken,
    refreshToken,
  };
}

// ─── Token refresh & logout ───────────────────────────────────────────────────

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
  // Verify signature first
  try {
    jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: {
      user: { select: { id: true, username: true, email: true, role: true, isActive: true } },
    },
  });

  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  if (!stored.user.isActive) {
    throw new AppError("Your account has been deactivated. Please contact support.", 403);
  }

  const jwtPayload: JwtPayload = {
    sub: stored.user.id,
    username: stored.user.username,
    email: stored.user.email,
    role: stored.user.role,
  };

  return { accessToken: signAccessToken(jwtPayload) };
}

// ─── Current user (GET /auth/me) ──────────────────────────────────────────────

export async function getMe(userId: string): Promise<AuthUser> {
  const cached = await getCache<AuthUser>(cacheKeys.authUser(userId));
  if (cached) return cached;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: { select: { plan: true, status: true } } },
  });

  // Token was valid but the user no longer exists (deleted account)
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!user.isActive) {
    throw new AppError("Your account has been deactivated. Please contact support.", 403);
  }

  const result: AuthUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    subscription: user.subscription
      ? { plan: user.subscription.plan, status: user.subscription.status }
      : null,
  };

  await setCache(cacheKeys.authUser(userId), result, cacheTTL.authUser);

  return result;
}

export async function logout(refreshToken: string): Promise<void> {
  const tokenHash = hashToken(refreshToken);
  const token = await prisma.refreshToken.findFirst({
    where: { tokenHash },
    select: { userId: true },
  });
  await prisma.refreshToken.deleteMany({ where: { tokenHash } });
  if (token) {
    await deleteCache(cacheKeys.authUser(token.userId));
  }
}

// ─── Forgot password (send OTP) ───────────────────────────────────────────────

function generateOtp(): string {
  // 6-digit numeric OTP — uses CSPRNG (crypto.randomInt), not Math.random()
  return String(randomInt(100000, 1000000));
}

export async function forgotPassword(input: ForgotPasswordInput): Promise<void> {
  if (!resend || !env.RESEND_API_KEY) {
    throw new AppError("Email service is not configured on this server", 503);
  }

  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, displayName: true, password: true, authProvider: true },
  });

  // Never reveal whether an email exists — respond the same way regardless
  if (!user) return;

  // Google-only accounts have no password — direct them to Google login
  if (!user.password) {
    const { error } = await resend.emails.send({
      from: env.EMAIL_FROM ?? "noreply@resend.dev",
      to: input.email,
      subject: "Tutelage — Password reset not available",
      html: `
        <p>Hi ${user.displayName},</p>
        <p>Your Tutelage account was created with Google Sign-In and does not have a password.</p>
        <p>Simply use the <strong>"Sign in with Google"</strong> button to access your account — no password needed.</p>
        <p>If you'd like to set a password so you can also log in with email, you can do so from your account settings after signing in.</p>
        <p>— The Tutelage Team</p>
      `,
    });
    // The Resend SDK returns { data, error } instead of throwing — an unchecked
    // error here means the user waits for an email that was never accepted.
    if (error) throw new AppError(`Failed to send email: ${error.message}`, 502);
    return;
  }

  const otp = generateOtp();
  const otpHash = hashToken(otp);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Invalidate any previous unused OTPs for this user, then create a fresh one
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    prisma.passwordResetToken.create({ data: { userId: user.id, otpHash, expiresAt } }),
  ]);

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM ?? "noreply@resend.dev",
    to: input.email,
    subject: "Tutelage — Your password reset code",
    html: `
      <p>Hi ${user.displayName},</p>
      <p>Use the following code to reset your Tutelage password. It expires in <strong>15 minutes</strong>.</p>
      <h2 style="letter-spacing: 8px; font-size: 36px;">${otp}</h2>
      <p>If you did not request this, you can safely ignore this email.</p>
      <p>— The Tutelage Team</p>
    `,
  });
  if (error) throw new AppError(`Failed to send email: ${error.message}`, 502);
}

// ─── Reset password (verify OTP + set new password) ───────────────────────────

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, password: true },
  });

  if (!user) {
    throw new AppError("Invalid or expired reset code", 400);
  }

  if (!user.password) {
    throw new AppError(
      "This account uses Google Sign-In. Use 'Sign in with Google' to access your account.",
      400,
    );
  }

  const otpHash = hashToken(input.otp);
  const record = await prisma.passwordResetToken.findUnique({
    where: { otpHash },
  });

  if (!record || record.userId !== user.id) {
    throw new AppError("Invalid or expired reset code", 400);
  }

  if (record.usedAt) {
    throw new AppError("This reset code has already been used", 400);
  }

  if (record.expiresAt < new Date()) {
    throw new AppError("Reset code has expired. Please request a new one.", 400);
  }

  const hashedPassword = await bcryptjs.hash(input.newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword } }),
    prisma.passwordResetToken.update({ where: { otpHash }, data: { usedAt: new Date() } }),
  ]);
}

// ─── Link Google to an existing account ──────────────────────────────────────

export async function linkGoogle(userId: string, input: LinkGoogleInput): Promise<AuthUser> {
  const profile = await verifyGoogleToken(input.idToken);

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { googleId: true },
  });

  if (!currentUser) throw new AppError("User not found", 404);

  if (currentUser.googleId) {
    throw new AppError("A Google account is already linked to your profile", 409);
  }

  // Ensure this Google account isn't already linked to a different user
  const existingGoogleUser = await prisma.user.findUnique({
    where: { googleId: profile.googleId },
  });
  if (existingGoogleUser) {
    throw new AppError("This Google account is already linked to a different user", 409);
  }

  // Read current avatar + verification state before updating
  const existing = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { avatarUrl: true, emailVerified: true },
  });

  // Link Google + activate FREE subscription (if still INACTIVE) in one
  // transaction. Linking Google also verifies the email (Google has confirmed it).
  const updated = await prisma.$transaction(async (tx) => {
    await tx.subscription.updateMany({
      where: { userId, status: "INACTIVE" },
      data: { status: "ACTIVE" },
    });
    return tx.user.update({
      where: { id: userId },
      data: {
        googleId: profile.googleId,
        avatarUrl: existing.avatarUrl ?? profile.avatarUrl,
        emailVerified: true,
        emailVerifiedAt: existing.emailVerified ? undefined : new Date(),
      },
      include: { subscription: { select: { plan: true, status: true } } },
    });
  });

  await deleteCache(cacheKeys.authUser(userId));

  return {
    id: updated.id,
    username: updated.username,
    email: updated.email,
    displayName: updated.displayName,
    role: updated.role,
    avatarUrl: updated.avatarUrl,
    isActive: updated.isActive,
    emailVerified: updated.emailVerified,
    subscription: updated.subscription
      ? { plan: updated.subscription.plan, status: updated.subscription.status }
      : null,
  };
}

// ─── Set password (for Google-only accounts) ─────────────────────────────────

export async function setPassword(userId: string, input: SetPasswordInput): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (!user) throw new AppError("User not found", 404);

  if (user.password) {
    throw new AppError(
      "Your account already has a password. Use the forgot-password flow to change it.",
      409,
    );
  }

  const hashedPassword = await bcryptjs.hash(input.newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
}

// ─── Email verification (OTP) ─────────────────────────────────────────────────

/**
 * Creates a fresh single-use email-verification OTP for the user, invalidating
 * any previous unused codes. Returns the plaintext OTP (only the hash is stored).
 *
 * otpHash is globally unique; on the rare chance a generated OTP collides with an
 * existing token's hash, we regenerate and retry rather than surfacing a 500.
 */
async function createEmailVerificationOtp(userId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);

  for (let attempt = 0; attempt < 5; attempt++) {
    const otp = generateOtp();
    const otpHash = hashToken(otp);
    try {
      await prisma.$transaction([
        prisma.emailVerificationToken.deleteMany({ where: { userId } }),
        prisma.emailVerificationToken.create({ data: { userId, otpHash, expiresAt } }),
      ]);
      return otp;
    } catch (err) {
      // P2002 = unique constraint violation on otpHash → regenerate and retry
      if ((err as { code?: string }).code === "P2002") continue;
      throw err;
    }
  }

  throw new AppError("Could not generate a unique verification code. Please try again.", 500);
}

/** Sends the verification OTP email. Throws 503 if the email service is unconfigured, 502 if Resend rejects the send. */
async function sendVerificationEmail(email: string, displayName: string, otp: string): Promise<void> {
  if (!resend || !env.RESEND_API_KEY) {
    throw new AppError("Email service is not configured on this server", 503);
  }

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM ?? "noreply@resend.dev",
    to: email,
    subject: "Tutelage — Verify your email",
    html: `
      <p>Hi ${displayName},</p>
      <p>Welcome to Tutelage! Use the following code to verify your email and activate your free plan. It expires in <strong>24 hours</strong>.</p>
      <h2 style="letter-spacing: 8px; font-size: 36px;">${otp}</h2>
      <p>Verifying your email unlocks the AI tutor on the free plan. If you did not create this account, you can safely ignore this email.</p>
      <p>— The Tutelage Team</p>
    `,
  });
  if (error) throw new AppError(`Failed to send email: ${error.message}`, 502);
}

/** Sends the post-verification welcome email. Best-effort — silently skips if unconfigured; throws on a rejected send so the caller can log it. */
async function sendWelcomeEmail(email: string, displayName: string): Promise<void> {
  if (!resend || !env.RESEND_API_KEY) return;

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM ?? "noreply@resend.dev",
    to: email,
    subject: "Welcome to Tutelage 🎉",
    html: `
      <p>Hi ${displayName},</p>
      <p>Your email is verified and your <strong>free plan is now active</strong> — the AI tutor is ready whenever you are.</p>
      <p>A few things to try first:</p>
      <ul>
        <li>Start a conversation with the AI tutor</li>
        <li>Set your learning level and goals in your profile</li>
        <li>Join a class with a class code from your tutor</li>
      </ul>
      <p>Tip: link your Google account from settings for one-tap sign-in next time.</p>
      <p>Happy learning,<br/>— The Tutelage Team</p>
    `,
  });
  if (error) throw new AppError(`Failed to send email: ${error.message}`, 502);
}

/**
 * Verifies an email-verification OTP. On success: marks the email verified,
 * activates the FREE subscription (INACTIVE→ACTIVE; never downgrades a paid plan),
 * and issues a token pair so the user is logged in immediately — this is the first
 * point at which a LOCAL account receives tokens (register no longer hands them out).
 *
 * Possession of the valid OTP is the proof of email ownership, so tokens are only
 * issued on a fresh verification. An already-verified email is rejected (the caller
 * must sign in normally) — otherwise anyone could replay the email to mint tokens.
 */
export async function verifyEmail(input: VerifyEmailInput): Promise<LoginResponse> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, email: true, displayName: true, emailVerified: true, isActive: true },
  });

  if (!user) {
    throw new AppError(INVALID_VERIFICATION_MSG, 400);
  }

  if (!user.isActive) {
    throw new AppError("Your account has been deactivated. Please contact support.", 403);
  }

  // Already verified → no tokens; the caller has shown no proof of ownership here.
  // Direct them to sign in normally instead.
  if (user.emailVerified) {
    throw new AppError("This email is already verified. Please sign in.", 409);
  }

  const otpHash = hashToken(input.otp);
  const record = await prisma.emailVerificationToken.findUnique({ where: { otpHash } });

  if (!record || record.userId !== user.id) {
    throw new AppError(INVALID_VERIFICATION_MSG, 400);
  }

  if (record.usedAt) {
    throw new AppError("This verification code has already been used", 400);
  }

  if (record.expiresAt < new Date()) {
    throw new AppError("Verification code has expired. Please request a new one.", 400);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifiedAt: new Date() },
    }),
    // Activate the FREE tier. updateMany with status:INACTIVE only flips inactive
    // free accounts — it never touches an already-active or paid subscription.
    prisma.subscription.updateMany({
      where: { userId: user.id, status: "INACTIVE" },
      data: { status: "ACTIVE" },
    }),
    prisma.emailVerificationToken.update({ where: { otpHash }, data: { usedAt: new Date() } }),
  ]);

  // Welcome email — best-effort, must not fail the request
  try {
    await sendWelcomeEmail(user.email, user.displayName);
  } catch (err) {
    logger.warn(`Could not send welcome email to ${user.email}: ${(err as Error).message}`);
  }

  // Invalidate before getMe so the next call re-fetches the updated emailVerified + subscription
  await deleteCache(cacheKeys.authUser(user.id));

  const verifiedUser = await getMe(user.id);
  const { accessToken, refreshToken } = await issueTokenPair(user.id);

  return {
    user: verifiedUser,
    accessToken,
    refreshToken,
  };
}

/**
 * Resends a verification OTP. Always succeeds at the controller level (200) to
 * prevent account enumeration — silently does nothing for unknown or already-verified
 * emails. Throws 503 only when the email service itself is unconfigured.
 */
export async function resendVerification(input: ResendVerificationInput): Promise<void> {
  if (!resend || !env.RESEND_API_KEY) {
    throw new AppError("Email service is not configured on this server", 503);
  }

  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, email: true, displayName: true, emailVerified: true },
  });

  // Never reveal whether the email exists or is already verified
  if (!user || user.emailVerified) return;

  const otp = await createEmailVerificationOtp(user.id);
  await sendVerificationEmail(user.email, user.displayName, otp);
}
