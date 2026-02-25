// ============================================================
// auth.client.ts — client-only plugin
// Runs once when the Vue app is mounted in the browser.
// 1. Restores the JWT from localStorage into the Pinia store.
// 2. If a token exists, fetches the current user profile from
//    the API so the store is hydrated with fresh user data.
//    A 401 response (expired/invalid token) clears the session.
// ============================================================

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()

  // Step 1 — synchronous: read token from localStorage
  authStore.restoreFromStorage()

  // Step 2 — async: validate token and hydrate user profile
  if (authStore.isAuthenticated) {
    const { fetchCurrentUser } = useAuth()
    await fetchCurrentUser()
  }
})
