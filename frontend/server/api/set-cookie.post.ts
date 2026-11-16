import { setCookie } from 'h3'

const THIRTY_DAYS = 60 * 60 * 24 * 30

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { accessToken, refreshToken, expiresAt } = body;

  // The cookies live exactly as long as the refresh token: once it is gone, SSR
  // simply sees a guest instead of trying a refresh that is bound to fail.
  const msLeft = typeof expiresAt === 'string' ? Date.parse(expiresAt) - Date.now() : NaN;
  const maxAge = Number.isFinite(msLeft) && msLeft > 0 ? Math.ceil(msLeft / 1000) : THIRTY_DAYS;

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge,
  };

  if (accessToken) setCookie(event, 'accessToken', accessToken, options);
  if (refreshToken) setCookie(event, 'refreshToken', refreshToken, options);

  return { success: true };
});
