// ============================================================
// useApi — HTTP client wrapper
// Automatically attaches JWT Authorization header from auth store
// and prefixes the base API URL from runtime config.
//
// x-maintenance header detection (RF-1200):
//   When the backend sends `x-maintenance: true` on any response,
//   the onResponseCheck hook updates the maintenance store and
//   redirects the user to /maintenance. This is client-side only
//   (guarded by import.meta.client) to prevent SSR hydration issues.
// ============================================================

export function useApi() {
  const config = useRuntimeConfig()
  const baseURL = (config.public.apiBase as string) ?? ''

  /**
   * Authenticated GET request
   */
  async function get<T>(path: string): Promise<T> {
    const token = getToken()
    return await $fetch<T>(`${baseURL}${path}`, {
      method: 'GET',
      headers: buildHeaders(token),
      onResponse: onResponseCheck,
    })
  }

  /**
   * Authenticated POST request
   */
  async function post<T>(path: string, body: unknown): Promise<T> {
    const token = getToken()
    return await $fetch<T>(`${baseURL}${path}`, {
      method: 'POST',
      headers: buildHeaders(token),
      body,
      onResponse: onResponseCheck,
    })
  }

  /**
   * Authenticated PUT request
   */
  async function put<T>(path: string, body: unknown): Promise<T> {
    const token = getToken()
    return await $fetch<T>(`${baseURL}${path}`, {
      method: 'PUT',
      headers: buildHeaders(token),
      body,
      onResponse: onResponseCheck,
    })
  }

  /**
   * Authenticated PATCH request
   */
  async function patch<T>(path: string, body: unknown): Promise<T> {
    const token = getToken()
    return await $fetch<T>(`${baseURL}${path}`, {
      method: 'PATCH',
      headers: buildHeaders(token),
      body,
      onResponse: onResponseCheck,
    })
  }

  /**
   * Authenticated DELETE request
   */
  async function del<T>(path: string): Promise<T> {
    const token = getToken()
    return await $fetch<T>(`${baseURL}${path}`, {
      method: 'DELETE',
      headers: buildHeaders(token),
      onResponse: onResponseCheck,
    })
  }

  return { get, post, put, patch, del }
}

// ── Helpers ─────────────────────────────────────────────────

function getToken(): string | null {
  if (import.meta.client) {
    return localStorage.getItem('mopetoo_token')
  }
  return null
}

function buildHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

/**
 * onResponse hook shared by all $fetch calls.
 *
 * If the backend signals maintenance mode via the `x-maintenance: true`
 * response header, we update the maintenance store and redirect the user.
 *
 * This hook only runs on the client (import.meta.client guard) to:
 *   a. Avoid accessing Pinia during SSR before hydration is complete.
 *   b. Prevent navigateTo() from firing on the server, which could
 *      cause unintended SSR redirect responses.
 *
 * The type annotation uses the FetchContext shape expected by ofetch's
 * `onResponse` option.
 */
function onResponseCheck({ response }: { response: Response }): void {
  if (!import.meta.client) return

  if (response.headers.get('x-maintenance') === 'true') {
    const maintenanceStore = useMaintenanceStore()
    // Update the store so the maintenance middleware and page
    // reflect the new state immediately.
    maintenanceStore.setStatus({ is_active: true })
    // Navigate to the maintenance page. navigateTo is a Nuxt auto-import
    // and is safe to call from within a $fetch hook on the client.
    navigateTo('/maintenance')
  }
}
