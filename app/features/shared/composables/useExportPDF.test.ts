// ============================================================
// useExportPDF.test.ts
// Tests the useExportPDF shared composable.
//
// Mocking strategy:
//   - $fetch (global): hoisted stub so it exists before any module
//     import. Reset in beforeEach via mockReset().
//   - localStorage (global): hoisted stub so the auth.client.ts plugin
//     (which calls localStorage.getItem during Nuxt app init) does not
//     throw before beforeEach runs. This is the same pattern established
//     in useApi.test.ts.
//   - URL.createObjectURL / URL.revokeObjectURL: stubbed as spies on the
//     real URL object (vi.spyOn) — NOT replacing URL entirely. Replacing
//     the full URL global breaks Nuxt internals that use `new URL(...)`.
//   - document.createElement / document.body.appendChild / anchor.click:
//     the real happy-dom DOM is used; we spy on the anchor element that
//     the composable creates to assert the correct download attribute and
//     click call.
//   - useAuthStore (Pinia): isolated per test via createTestingPinia
//     (stubActions: false) and token set directly on the store.
//   - useRuntimeConfig: NOT mocked — NUXT_PUBLIC_API_BASE is provided by
//     vitest.config.ts env ('http://localhost:4000'). Mocking via
//     mockNuxtImport at module level breaks @nuxt/test-utils router init.
//
// import.meta.client in this environment:
//   The nuxt test environment with happy-dom runs with import.meta.client
//   evaluating to true. All downloadPDF client-side paths ARE exercised.
//
// What this suite intentionally does NOT cover:
//   - The SSR no-op path (import.meta.client = false) — there is no safe
//     way to flip this flag at runtime without patching compiled output.
//     The guard is a one-liner; the meaningful logic is in the client path.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'

// ── $fetch global stub ───────────────────────────────────────
// Must be hoisted so the mock reference exists before vi.stubGlobal()
// fires at module evaluation time (same reason as useApi.test.ts).
const fetchMock = vi.hoisted(() => vi.fn())
vi.stubGlobal('$fetch', fetchMock)

// ── localStorage global stub ─────────────────────────────────
// The auth.client.ts Nuxt plugin calls localStorage.getItem during app
// init — before any beforeEach hook runs. The stub must be installed at
// module level via vi.hoisted() so it is present at that point.
const localStorageMock = vi.hoisted(() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    key: vi.fn((_index: number) => null),
    get length() { return Object.keys(store).length },
  }
})
vi.stubGlobal('localStorage', localStorageMock)

// ── Suite ────────────────────────────────────────────────────

describe('useExportPDF', () => {
  beforeEach(async () => {
    // Isolate Pinia per test — stubActions: false so real store logic runs.
    setActivePinia(
      createTestingPinia({ stubActions: false, createSpy: vi.fn }),
    )

    // Set a known token on the auth store so header assertions are
    // deterministic.
    const { useAuthStore } = await import('../../auth/stores/auth.store')
    const authStore = useAuthStore()
    authStore.token = 'jwt.test.token'

    // Reset all mocks — prevents return values from bleeding between tests.
    fetchMock.mockReset()
    localStorageMock.clear()

    // Stub URL.createObjectURL and revokeObjectURL as spies on the real URL
    // object. Replacing URL entirely breaks Nuxt internals (new URL(href)).
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/fake-url')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
  })

  // ── slugify() ─────────────────────────────────────────────

  describe('slugify()', () => {
    it('lowercases the input', async () => {
      const { useExportPDF } = await import('./useExportPDF')
      const { slugify } = useExportPDF()

      expect(slugify('LUNA')).toBe('luna')
    })

    it('replaces spaces with hyphens', async () => {
      const { useExportPDF } = await import('./useExportPDF')
      const { slugify } = useExportPDF()

      expect(slugify('mi mascota')).toBe('mi-mascota')
    })

    it('collapses multiple consecutive spaces into a single hyphen', async () => {
      const { useExportPDF } = await import('./useExportPDF')
      const { slugify } = useExportPDF()

      expect(slugify('mi  mascota')).toBe('mi-mascota')
    })

    it('removes accented characters (stripped, not transliterated)', async () => {
      const { useExportPDF } = await import('./useExportPDF')
      const { slugify } = useExportPDF()

      // The regex strips non-[a-z0-9-] characters — accents are removed,
      // not converted. "luna garcía" → "luna-garca" (no 'í').
      expect(slugify('luna garcía')).toBe('luna-garca')
    })

    it('removes special characters — parentheses, dots, commas', async () => {
      const { useExportPDF } = await import('./useExportPDF')
      const { slugify } = useExportPDF()

      expect(slugify('mascota (gato)')).toBe('mascota-gato')
    })

    it('removes apostrophes and quotation marks', async () => {
      const { useExportPDF } = await import('./useExportPDF')
      const { slugify } = useExportPDF()

      expect(slugify("d'artagnan")).toBe('dartagnan')
    })

    it('preserves digits', async () => {
      const { useExportPDF } = await import('./useExportPDF')
      const { slugify } = useExportPDF()

      expect(slugify('mascota 2')).toBe('mascota-2')
    })

    it('preserves hyphens that already exist in the name', async () => {
      const { useExportPDF } = await import('./useExportPDF')
      const { slugify } = useExportPDF()

      expect(slugify('already-slugified')).toBe('already-slugified')
    })

    it('returns an already-clean slug unchanged', async () => {
      const { useExportPDF } = await import('./useExportPDF')
      const { slugify } = useExportPDF()

      expect(slugify('max-el-perro')).toBe('max-el-perro')
    })

    it('returns an empty string for empty input without throwing', async () => {
      const { useExportPDF } = await import('./useExportPDF')
      const { slugify } = useExportPDF()

      expect(slugify('')).toBe('')
    })

    it('returns an empty string when all characters are stripped', async () => {
      const { useExportPDF } = await import('./useExportPDF')
      const { slugify } = useExportPDF()

      expect(slugify('!@#$%')).toBe('')
    })

    it('handles a mixed-case name with spaces and special chars (real-world example)', async () => {
      const { useExportPDF } = await import('./useExportPDF')
      const { slugify } = useExportPDF()

      // "Max el Perro!" → lowercased → "max el perro!" → spaces to hyphens
      // → "max-el-perro!" → special chars stripped → "max-el-perro"
      expect(slugify('Max el Perro!')).toBe('max-el-perro')
    })
  })

  // ── downloadPDF() ─────────────────────────────────────────

  describe('downloadPDF()', () => {
    it('calls $fetch with the full URL (baseURL + endpoint)', async () => {
      fetchMock.mockResolvedValueOnce(new Blob(['%PDF'], { type: 'application/pdf' }))
      const { useExportPDF } = await import('./useExportPDF')
      const { downloadPDF } = useExportPDF()

      await downloadPDF('/api/pets/42/export', 'perfil-max.pdf')

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/api/pets/42/export',
        expect.any(Object),
      )
    })

    it('calls $fetch with method GET', async () => {
      fetchMock.mockResolvedValueOnce(new Blob(['%PDF'], { type: 'application/pdf' }))
      const { useExportPDF } = await import('./useExportPDF')
      const { downloadPDF } = useExportPDF()

      await downloadPDF('/api/pets/42/export', 'perfil-max.pdf')

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'GET' }),
      )
    })

    it('calls $fetch with responseType blob', async () => {
      fetchMock.mockResolvedValueOnce(new Blob(['%PDF'], { type: 'application/pdf' }))
      const { useExportPDF } = await import('./useExportPDF')
      const { downloadPDF } = useExportPDF()

      await downloadPDF('/api/pets/42/export', 'perfil-max.pdf')

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ responseType: 'blob' }),
      )
    })

    it('sends the Authorization header when the store has a token', async () => {
      fetchMock.mockResolvedValueOnce(new Blob(['%PDF'], { type: 'application/pdf' }))
      const { useExportPDF } = await import('./useExportPDF')
      const { downloadPDF } = useExportPDF()

      await downloadPDF('/api/pets/42/export', 'perfil-max.pdf')

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: { Authorization: 'Bearer jwt.test.token' },
        }),
      )
    })

    it('sends empty headers when the store has no token', async () => {
      // Override the token set in beforeEach to simulate an unauthenticated state.
      const { useAuthStore } = await import('../../auth/stores/auth.store')
      const authStore = useAuthStore()
      authStore.token = null

      fetchMock.mockResolvedValueOnce(new Blob(['%PDF'], { type: 'application/pdf' }))
      const { useExportPDF } = await import('./useExportPDF')
      const { downloadPDF } = useExportPDF()

      await downloadPDF('/api/pets/42/export', 'perfil-max.pdf')

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ headers: {} }),
      )
    })

    it('calls URL.createObjectURL with the blob returned by $fetch', async () => {
      const blob = new Blob(['%PDF'], { type: 'application/pdf' })
      fetchMock.mockResolvedValueOnce(blob)
      const { useExportPDF } = await import('./useExportPDF')
      const { downloadPDF } = useExportPDF()

      await downloadPDF('/api/pets/42/export', 'perfil-max.pdf')

      expect(URL.createObjectURL).toHaveBeenCalledWith(blob)
    })

    it('calls URL.revokeObjectURL after the anchor click to release memory', async () => {
      fetchMock.mockResolvedValueOnce(new Blob(['%PDF'], { type: 'application/pdf' }))
      const { useExportPDF } = await import('./useExportPDF')
      const { downloadPDF } = useExportPDF()

      await downloadPDF('/api/pets/42/export', 'perfil-max.pdf')

      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/fake-url')
    })

    it('sets the correct download attribute on the anchor element', async () => {
      fetchMock.mockResolvedValueOnce(new Blob(['%PDF'], { type: 'application/pdf' }))

      // Spy on createElement to capture the anchor the composable creates.
      let createdAnchor: HTMLAnchorElement | null = null
      const originalCreateElement = document.createElement.bind(document)
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = originalCreateElement(tag)
        if (tag === 'a') {
          createdAnchor = el as HTMLAnchorElement
        }
        return el
      })

      const { useExportPDF } = await import('./useExportPDF')
      const { downloadPDF } = useExportPDF()

      await downloadPDF('/api/pets/42/export', 'perfil-max.pdf')

      expect(createdAnchor).not.toBeNull()
      expect((createdAnchor as HTMLAnchorElement).download).toBe('perfil-max.pdf')

      vi.restoreAllMocks()
    })

    it('sets the correct href (object URL) on the anchor element', async () => {
      fetchMock.mockResolvedValueOnce(new Blob(['%PDF'], { type: 'application/pdf' }))

      let createdAnchor: HTMLAnchorElement | null = null
      const originalCreateElement = document.createElement.bind(document)
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = originalCreateElement(tag)
        if (tag === 'a') {
          createdAnchor = el as HTMLAnchorElement
        }
        return el
      })

      const { useExportPDF } = await import('./useExportPDF')
      const { downloadPDF } = useExportPDF()

      await downloadPDF('/api/pets/42/export', 'perfil-max.pdf')

      // href is set to the object URL returned by the mocked createObjectURL.
      expect((createdAnchor as HTMLAnchorElement).href).toContain('blob:')

      vi.restoreAllMocks()
    })

    it('propagates errors thrown by $fetch without swallowing them', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'))
      const { useExportPDF } = await import('./useExportPDF')
      const { downloadPDF } = useExportPDF()

      await expect(downloadPDF('/api/pets/42/export', 'perfil-max.pdf')).rejects.toThrow('Network error')
    })

    it('does NOT call URL.createObjectURL when $fetch rejects', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Server error'))
      const { useExportPDF } = await import('./useExportPDF')
      const { downloadPDF } = useExportPDF()

      try {
        await downloadPDF('/api/pets/42/export', 'perfil-max.pdf')
      }
      catch {
        // Expected — we only care that createObjectURL was not called.
      }

      expect(URL.createObjectURL).not.toHaveBeenCalled()
    })

    it('correctly handles a different endpoint in the full URL', async () => {
      fetchMock.mockResolvedValueOnce(new Blob(['%PDF'], { type: 'application/pdf' }))
      const { useExportPDF } = await import('./useExportPDF')
      const { downloadPDF } = useExportPDF()

      await downloadPDF('/api/reminders/export', 'recordatorios.pdf')

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/api/reminders/export',
        expect.any(Object),
      )
    })

    it('passes an onResponse callback to $fetch for maintenance detection', async () => {
      fetchMock.mockResolvedValueOnce(new Blob(['%PDF'], { type: 'application/pdf' }))
      const { useExportPDF } = await import('./useExportPDF')
      const { downloadPDF } = useExportPDF()

      await downloadPDF('/api/pets/42/export', 'perfil-max.pdf')

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          onResponse: expect.any(Function),
        }),
      )
    })
  })
})
