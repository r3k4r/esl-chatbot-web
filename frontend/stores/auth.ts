import { defineStore } from "pinia";
import type { User } from "@/common/model/user";
import { inApp } from "~/lib/utils";
import type { RefreshOutcome, TokenSet } from "~/common/types/auth-types";
import type {
  SignInSchema,
  SignUpSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  VerifyEmailSchema,
  AcceptAgreementInput,
} from "~/common/schemas/AuthSchema";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  /** ISO-8601, from the backend. Drives the proactive refresh in plugins/auth-session.client.ts. */
  accessTokenExpiresAt: string | null;
  refreshTokenExpiresAt: string | null;
  isCheckedUser: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type NuxtAppOrNull = ReturnType<typeof tryUseNuxtApp>;

const STORAGE_KEYS = ["accessToken", "refreshToken", "accessTokenExpiresAt", "refreshTokenExpiresAt"] as const;

// Nuxt composables (useCookie, useRuntimeConfig) need the Nuxt context. During SSR it
// is gone after the first `await` inside an action, so each action captures the app
// up front and runs composables through `inApp`. (This is what used to break SSR refresh:
// users were signed out on any reload once their access token had expired.)

// One refresh at a time per store (per request on the server): parallel 401s all
// wait for the same answer instead of racing — or signing each other out.
const inflightRefresh = new WeakMap<object, Promise<RefreshOutcome>>();

/** `exp` of a JWT as ISO — fallback for sessions stored before the backend sent expiries. */
function jwtExpiry(token: string | null): string | null {
  try {
    const payload = JSON.parse(atob(token!.split(".")[1]!.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? new Date(payload.exp * 1000).toISOString() : null;
  } catch {
    return null;
  }
}

/** Picks the token fields out of a login / verify / google response. */
function tokensFrom(data: any): TokenSet {
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    accessTokenExpiresAt: data.accessTokenExpiresAt ?? jwtExpiry(data.accessToken),
    refreshTokenExpiresAt: data.refreshTokenExpiresAt ?? jwtExpiry(data.refreshToken),
  };
}

/** Cookie options matching server/api/set-cookie.post.ts; they live as long as the refresh token. */
function cookieOptions(refreshTokenExpiresAt: string | null) {
  const msLeft = refreshTokenExpiresAt ? Date.parse(refreshTokenExpiresAt) - Date.now() : NaN;
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: Number.isFinite(msLeft) && msLeft > 0 ? Math.ceil(msLeft / 1000) : 60 * 60 * 24 * 30,
  };
}

export const useAuthStore = defineStore("useAuthStore", {
  state: (): AuthState => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    accessTokenExpiresAt: null,
    refreshTokenExpiresAt: null,
    isCheckedUser: false,
    isAuthenticated: false,
    isLoading: false,
  }),
  actions: {
    async signIn(credentials: SignInSchema) {
      const app = tryUseNuxtApp();
      this.isLoading = true;

      const response = await useHttp({
        method: "POST",
        url: "/auth/login",
        body: {
          username: credentials.username,
          password: credentials.password,
        },
        showToast: true,
        toastDelayMs: 1500,
      });

      if (response.success) {
        await this._persistTokens(tokensFrom(response.data.data), app);
        this.setUserFromResponse(response.data.data.user);
      }
      this.isLoading = false;
      return response;
    },

    async signUp(credentials: SignUpSchema) {
      this.isLoading = true;
      const response = await useHttp({
        method: "POST",
        url: "/auth/register",
        body: {
          username: credentials.username,
          email: credentials.email,
          password: credentials.password,
          displayName: credentials.displayName,
          acceptAgreement: true,
        },
        showToast: false,
      });

      // Register no longer returns tokens or logs the user in — the account is
      // created but unverified. The user MUST verify their email (which logs them
      // in) before they can sign in. Do not persist anything here.
      this.isLoading = false;
      return response;
    },

    /**
     * Loads the signed-in user (SSR-safe). An expired access token is refreshed and
     * the request retried by useHttp, so a reload keeps the session for as long as
     * the refresh token lives.
     */
    async fetchUser(): Promise<void> {
      const app = tryUseNuxtApp();
      this.getTokenFromStorage(app);

      // A guest has nothing to check — skip the round trip.
      if (!this.accessToken && !this.refreshToken) {
        this.isCheckedUser = true;
        this.isAuthenticated = false;
        this.user = null;
        return;
      }

      const res = await inApp(app, () => useHttp<any>({
        method: "GET",
        url: "/auth/me",
        requireAuth: true,
        showToast: false,
      }));

      this.isCheckedUser = true;
      const user = res.success ? res.data?.data : null;
      if (user) {
        this.setUserFromResponse(user);
      } else if (res.status === 401 || res.status === 403 || res.status === 404) {
        // Rejected (expired session, deactivated, deleted): sign out locally.
        await this._clearSession(app);
      } else {
        // No answer (offline / 5xx): the session may well be fine — don't destroy it.
        this.user = null;
        this.isAuthenticated = false;
      }
    },

    async forgotPassword(input: ForgotPasswordSchema) {
      this.isLoading = true;
      const response = await useHttp({
        method: "POST",
        url: "/auth/forgot-password",
        body: { email: input.email },
      });
      this.isLoading = false;
      return response;
    },

    async resetPassword(input: ResetPasswordSchema) {
      this.isLoading = true;
      const response = await useHttp({
        method: "POST",
        url: "/auth/reset-password",
        body: {
          email: input.email,
          otp: input.otp,
          newPassword: input.newPassword,
        },
      });
      this.isLoading = false;
      return response;
    },

    async verifyEmail(input: VerifyEmailSchema) {
      const app = tryUseNuxtApp();
      this.isLoading = true;
      const response = await useHttp({
        method: "POST",
        url: "/auth/verify-email",
        body: { email: input.email, otp: input.otp },
        showToast: false,
      });

      // Verifying the email logs the user in — the backend returns a token pair
      // here (the verified OTP is the proof of ownership). Persist it.
      if (response.success && response.data?.data?.accessToken) {
        await this._persistTokens(tokensFrom(response.data.data), app);
        this.setUserFromResponse(response.data.data.user);
      }
      this.isLoading = false;
      return response;
    },

    async resendVerification(email: string) {
      this.isLoading = true;
      const response = await useHttp({
        method: "POST",
        url: "/auth/resend-verification",
        body: { email },
        showToast: false,
      });
      this.isLoading = false;
      return response;
    },

    async acceptAgreement(creds: AcceptAgreementInput) {
      const app = tryUseNuxtApp();
      this.isLoading = true;
      const response = await useHttp({
        method: "POST",
        url: "/auth/accept-agreement",
        body: creds,
        showToast: false,
      });
      if (response.success && response.data?.data?.accessToken) {
        await this._persistTokens(tokensFrom(response.data.data), app);
        this.setUserFromResponse(response.data.data.user);
      }
      this.isLoading = false;
      return response;
    },

    async googleAuth(idToken: string, username?: string, acceptAgreement?: boolean) {
      const app = tryUseNuxtApp();
      this.isLoading = true;
      const body = username
        ? { idToken, username, acceptAgreement }
        : { idToken };
      const response = await useHttp({
        method: "POST",
        url: "/auth/google",
        body,
      });

      if (response.success && response.data?.data?.accessToken) {
        await this._persistTokens(tokensFrom(response.data.data), app);
        this.setUserFromResponse(response.data.data.user);
      }

      this.isLoading = false;
      return response;
    },

    async signOut() {
      const app = tryUseNuxtApp();
      const refreshTokenForLogout = this.refreshToken;
      await this._clearSession(app);

      if (refreshTokenForLogout) {
        // fire-and-forget — don't block navigation on a logout API call
        useHttp({
          method: "POST",
          url: "/auth/logout",
          body: { refreshToken: refreshTokenForLogout },
          showToast: false,
        });
      }
    },

    /**
     * Swaps the refresh token for a new access token (and a new refresh token when the
     * backend rotates it). Concurrent callers share one request. Only a rejected
     * refresh ends the session; a network blip / 429 / 5xx returns `unavailable`.
     */
    refreshTokens(app: NuxtAppOrNull = tryUseNuxtApp()): Promise<RefreshOutcome> {
      const pending = inflightRefresh.get(this);
      if (pending) return pending;
      const run = this._refresh(app).finally(() => inflightRefresh.delete(this));
      inflightRefresh.set(this, run);
      return run;
    },

    setUserFromResponse(user: User) {
      if (!user) return;
      this.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        guideSeenAt: user.guideSeenAt ?? null,
        subscription: {
          plan: user.subscription?.plan,
          status: user.subscription?.status,
        },
      };
      this.isAuthenticated = true;
      this.isCheckedUser = true;
    },

    /**
     * Fills missing tokens from storage. In-memory values win: after an SSR refresh
     * the hydrated state is newer than what the browser had stored.
     * Server: the httpOnly cookies. Browser: localStorage.
     */
    getTokenFromStorage(app: NuxtAppOrNull = tryUseNuxtApp()) {
      if (import.meta.server) {
        this.accessToken ||= inApp(app, () => useCookie("accessToken").value) ?? null;
        this.refreshToken ||= inApp(app, () => useCookie("refreshToken").value) ?? null;
      } else {
        for (const key of STORAGE_KEYS) this[key] ||= localStorage.getItem(key);
      }
      this.accessTokenExpiresAt ||= jwtExpiry(this.accessToken);
      this.refreshTokenExpiresAt ||= jwtExpiry(this.refreshToken);
    },

    /** Browser only: writes the in-memory tokens (possibly refreshed during SSR) to localStorage. */
    syncClientStorage() {
      if (!import.meta.client) return;
      this.getTokenFromStorage();
      for (const key of STORAGE_KEYS) {
        const value = this[key];
        if (value) localStorage.setItem(key, value);
      }
    },

    // ── Private helpers ─────────────────────────────────────────────────────

    async _refresh(app: NuxtAppOrNull): Promise<RefreshOutcome> {
      this.getTokenFromStorage(app);
      const refreshToken = this.refreshToken;
      const expired = this.refreshTokenExpiresAt && Date.parse(this.refreshTokenExpiresAt) <= Date.now();
      if (!refreshToken || expired) {
        await this._clearSession(app);
        return "ended";
      }

      const response = await inApp(app, () => useHttp<any>({
        method: "POST",
        url: "/auth/refresh",
        body: { refreshToken },
        requireAuth: false,
        showToast: false,
      }));

      const data = response.data?.data;
      if (response.success && data?.accessToken) {
        await this._persistTokens({
          accessToken: data.accessToken,
          accessTokenExpiresAt: data.accessTokenExpiresAt ?? jwtExpiry(data.accessToken),
          // Present only when the backend rotated the refresh token.
          refreshToken: data.refreshToken ?? refreshToken,
          refreshTokenExpiresAt: data.refreshToken
            ? data.refreshTokenExpiresAt ?? jwtExpiry(data.refreshToken)
            : this.refreshTokenExpiresAt,
        }, app);
        return "refreshed";
      }

      if (response.status === 401 || response.status === 403) {
        await this._clearSession(app);
        return "ended";
      }
      return "unavailable";
    },

    async _persistTokens(tokens: TokenSet, app: NuxtAppOrNull = tryUseNuxtApp()) {
      this.accessToken = tokens.accessToken;
      this.refreshToken = tokens.refreshToken;
      this.accessTokenExpiresAt = tokens.accessTokenExpiresAt;
      this.refreshTokenExpiresAt = tokens.refreshTokenExpiresAt;

      if (import.meta.server) {
        // During SSR, write the httpOnly cookies straight onto the response.
        inApp(app, () => {
          const options = cookieOptions(tokens.refreshTokenExpiresAt);
          useCookie("accessToken", options).value = tokens.accessToken;
          useCookie("refreshToken", options).value = tokens.refreshToken;
        });
        return;
      }

      for (const key of STORAGE_KEYS) {
        const value = tokens[key];
        if (value) localStorage.setItem(key, value);
        else localStorage.removeItem(key);
      }

      // httpOnly server cookie — SSR reads tokens from here
      await fetch("/api/set-cookie", {
        method: "POST",
        body: JSON.stringify({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.refreshTokenExpiresAt,
        }),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
    },

    async _clearSession(app: NuxtAppOrNull = tryUseNuxtApp()) {
      this.$reset();
      // The user is now known to be signed out — don't re-check on the next navigation.
      this.isCheckedUser = true;

      if (import.meta.server) {
        inApp(app, () => {
          useCookie("accessToken").value = null;
          useCookie("refreshToken").value = null;
        });
        return;
      }

      for (const key of STORAGE_KEYS) localStorage.removeItem(key);

      // Clear httpOnly server cookie
      fetch("/api/clear-cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
    },
  },

  getters: {
    getUser: (state) => state.user as User,
    getIsAuthenticated: (state) => state.isAuthenticated,
    getIsLoading: (state) => state.isLoading,
    getAccessToken: (state) => state.accessToken,
    getRefreshToken: (state) => state.refreshToken,
    userCurrentRole: (state) => state.user?.role || null,
  },
});
