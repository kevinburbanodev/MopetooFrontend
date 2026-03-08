// ============================================================
// guest middleware — applied to the login page.
// Redirects already-authenticated users to /admin so they
// never see the login form while logged in.
// ============================================================

export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore()

  if (authStore.isAuthenticated) {
    return navigateTo('/admin')
  }
})
