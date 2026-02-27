// ============================================================
// admin middleware — protects all /admin/** routes.
// Checks BOTH authentication AND admin role.
// - Not authenticated → redirect to /login
// - Authenticated but not admin → redirect to / (403 equivalent)
// Applied via definePageMeta({ middleware: 'admin' }) on each
// admin page; Nuxt resolves the filename automatically.
// ============================================================

export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }

  if (!authStore.isAdmin) {
    return navigateTo('/')
  }
})
