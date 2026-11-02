import { defineStore } from "pinia";
import type { User } from "@/common/model/user";
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
  isCheckedUser: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  _isRefreshing: boolean; // true while a refresh request is in-flight
}

export const useAuthStore = defineStore("useAuthStore", {
  state: (): AuthState => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isCheckedUser: false,
    isAuthenticated: false,
    isLoading: false,
    _isRefreshing: false,
  }),
  actions: {
    async signIn(credentials: SignInSchema) {
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
        await this._persistTokens(
          response.data.data.accessToken,
          response.data.data.refreshToken
        );
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

    // SSR-safe user fetch — keeps useFetch for server-side rendering.
    // Cache key uses a stable value so it isn't stuck on "null" from SSR startup.
    async fetchUser(): Promise<void> {
      const config = useRuntimeConfig();
      this.getTokenFromStorage();

      const token = this.accessToken;

      if (!token) {
        this.isCheckedUser = true;
        this.user = null;
        this.isAuthenticated = false;
        return;
      }

      const { data, status } = await useFetch<any>("/auth/me", {
        method: "GET",
        baseURL: (config.public.baseUrl as string) || (config.BASE_URL as string) || "http://localhost:8000/api/v1",
        // Stable key: avoids a stale "user-account-null" cache entry from SSR
        key: "user-account",
        cache: "no-cache",
        headers: token
          ? {
              "Content-Type": "application/json",
              "Accept-Language": "en",
              Authorization: `Bearer ${token}`,
            }
          : {
              "Content-Type": "application/json",
              "Accept-Language": "en",
            },
      });

      this.isCheckedUser = true;

      if (status.value === "error") {
        // useFetch surfaces 401 as an error status
        const refreshed = await this.refreshTokens();
        if (!refreshed) {
          await this._clearSession();
          return;
        }
        // Retry once after refresh — clear the cache key so useFetch re-runs
        clearNuxtData("user-account");
        return this.fetchUser();
      }

      const user = (data.value as any)?.data;
      if (user) {
        this.setUserFromResponse(user);
      } else {
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
        await this._persistTokens(
          response.data.data.accessToken,
          response.data.data.refreshToken
        );
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
      this.isLoading = true;
      const response = await useHttp({
        method: "POST",
        url: "/auth/accept-agreement",
        body: creds,
        showToast: false,
      });
      if (response.success && response.data?.data?.accessToken) {
        await this._persistTokens(
          response.data.data.accessToken,
          response.data.data.refreshToken
        );
        this.setUserFromResponse(response.data.data.user);
      }
      this.isLoading = false;
      return response;
    },

    async googleAuth(idToken: string, username?: string, acceptAgreement?: boolean) {
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
        await this._persistTokens(
          response.data.data.accessToken,
          response.data.data.refreshToken
        );
        this.setUserFromResponse(response.data.data.user);
      }

      this.isLoading = false;
      return response;
    },

    async signOut() {
      const refreshTokenForLogout = this.refreshToken;
      await this._clearSession();

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

    // Returns true if new tokens were obtained, false if the session must end.
    async refreshTokens(): Promise<boolean> {
      // Prevent concurrent refresh races
      if (this._isRefreshing) return false;

      // Recover tokens from storage in case Pinia state was lost (page reload / SSR hydration)
      this.getTokenFromStorage();

      if (!this.refreshToken) return false;

      this._isRefreshing = true;

      const response = await useHttp({
        method: "POST",
        url: "/auth/refresh",
        body: { refreshToken: this.refreshToken },
        requireAuth: false,
        showToast: false,
      });

      this._isRefreshing = false;

      if (!response.success || !response.data) {
        await this._clearSession();
        return false;
      }

      // /auth/refresh only returns a new accessToken — refresh token stays the same
      await this._persistTokens(response.data.data.accessToken, this.refreshToken!);
      return true;
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
        subscription: {
          plan: user.subscription?.plan,
          status: user.subscription?.status,
        },
      };
      this.isAuthenticated = true;
      this.isCheckedUser = true;
    },

    getTokenFromStorage() {
      if (import.meta.server) {
        const accessTokenCookie = useCookie("accessToken");
        const refreshTokenCookie = useCookie("refreshToken");
        this.accessToken = accessTokenCookie.value ?? null;
        this.refreshToken = refreshTokenCookie.value ?? null;
      } else {
        this.accessToken =
          localStorage.getItem("accessToken") ||
          useCookie("accessToken").value ||
          null;
        this.refreshToken =
          localStorage.getItem("refreshToken") ||
          useCookie("refreshToken").value ||
          null;
      }
    },

    // ── Private helpers ─────────────────────────────────────────────────────

    async _persistTokens(accessToken: string, refreshToken: string) {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;

      if (import.meta.client) {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
      }

      // httpOnly server cookie — SSR reads tokens from here
      await fetch("/api/set-cookie", {
        method: "POST",
        body: JSON.stringify({ accessToken, refreshToken }),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
    },

    async _clearSession() {
      this.$reset();

      if (import.meta.client) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      }

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
