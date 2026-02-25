// ============================================================
// guest middleware — applied to public auth pages (/login,
// /register, /forgot-password).
// Redirects already-authenticated users to /dashboard so they
// never see the login/register forms while logged in.
// ============================================================

export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore()

  if (authStore.isAuthenticated) {
    return navigateTo('/dashboard')
  }
})
