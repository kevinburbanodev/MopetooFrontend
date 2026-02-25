// ============================================================
// auth middleware — protects all /dashboard/** routes.
// Redirects to /login when the user has no active session.
// Applied via definePageMeta({ middleware: 'auth' }) on each
// protected page; Nuxt resolves the name automatically.
// ============================================================

export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }
})
