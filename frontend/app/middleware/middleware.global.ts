import { useAuthStore } from "~~/stores/auth";

export default defineNuxtRouteMiddleware(async (to) => {
    // Captured before the await: on the server the Nuxt context is gone after it
    // (and the try/catch), so later composables are re-entered through the app.
    const nuxtApp = useNuxtApp();
    const authStore = useAuthStore();

    if (!authStore.isCheckedUser) {
        try {
            await authStore.fetchUser();
        } catch {
            // fetchUser handles its own failures; never block navigation on it.
        }
    }

    return nuxtApp.runWithContext(() => {
        const isAuthenticated = authStore.getIsAuthenticated;
        const requiresAuth = to.meta.requiresAuth || false;
        const guestOnly = to.meta.guestOnly || false;
        const requiresAdmin = to.meta.requiresAdmin || false;

        if (!isAuthenticated && requiresAuth) {
            return navigateTo('/signin');
        }

        if (isAuthenticated && guestOnly) {
            return navigateTo('/dashboard');
        }

        // Admin-only routes: non-admins get bounced to the dashboard.
        const { isAdmin } = useRole();
        if (requiresAdmin && !isAdmin.value) {
            return navigateTo('/dashboard');
        }
    });
});
