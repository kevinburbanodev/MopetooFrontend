// ============================================================
// auth middleware — protects /admin/** routes only.
// Redirects to / when the user has no active session.
// Applied via definePageMeta({ middleware: 'auth' }) on each
// protected page; Nuxt resolves the name automatically.
// ============================================================

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  // Only protect /admin routes
  if (to.path.startsWith('/admin')) {
    if (!authStore.isAuthenticated) {
      return navigateTo('/')
    }
  }
})
