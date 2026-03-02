// ============================================================
// useExportPDF — shared PDF export utility composable
// Provides a generic downloadPDF helper that fetches a PDF
// blob from a protected backend endpoint and triggers a
// browser file-download via a temporary <a> element.
//
// All operations are client-only — guarded by import.meta.client.
// ============================================================

export function useExportPDF() {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  /**
   * Fetch a PDF blob from a protected endpoint and trigger a
   * browser "Save As" download dialog.
   *
   * This is a client-only operation — it silently no-ops on the server.
   *
   * @param endpoint - API path relative to apiBase (e.g. `/api/pets/42/export`)
   * @param filename - Desired download filename including `.pdf` extension
   */
  async function downloadPDF(endpoint: string, filename: string): Promise<void> {
    if (!import.meta.client) return

    const baseURL = (config.public.apiBase as string) ?? ''
    const token = authStore.token

    const blob = await $fetch<Blob>(`${baseURL}${endpoint}`, {
      method: 'GET',
      responseType: 'blob',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      onResponse: onResponseCheck,
    })

    const objectUrl = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    window.URL.revokeObjectURL(objectUrl)
  }

  /**
   * Convert a display name to a URL-safe slug for use in filenames.
   * e.g. "Luna García" → "luna-garcia"
   */
  function slugify(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
  }

  return { downloadPDF, slugify }
}

// ── Helpers ─────────────────────────────────────────────────

/**
 * onResponse hook — mirrors the same maintenance detection in useApi.ts.
 * If the backend signals maintenance mode via `x-maintenance: true`,
 * update the store and redirect.
 */
function onResponseCheck({ response }: { response: Response }): void {
  if (!import.meta.client) return

  if (response.headers.get('x-maintenance') === 'true') {
    const maintenanceStore = useMaintenanceStore()
    maintenanceStore.setStatus({ is_active: true })
    navigateTo('/maintenance')
  }
}
