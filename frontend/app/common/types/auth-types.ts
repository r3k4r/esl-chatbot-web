// Session/token shapes used by the auth store, useHttp and the session plugin.

/** Tokens plus their expiry (ISO-8601) as returned by login / verify-email / google / refresh. */
export interface TokenSet {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: string | null
  refreshTokenExpiresAt: string | null
}

/**
 * Result of a refresh attempt:
 *  - `refreshed`   new access token stored (and refresh token, if the backend rotated it)
 *  - `ended`       the refresh token was rejected or is gone — the session is over
 *  - `unavailable` no answer / 429 / 5xx — says nothing about the session, so keep it
 */
export type RefreshOutcome = 'refreshed' | 'ended' | 'unavailable'
