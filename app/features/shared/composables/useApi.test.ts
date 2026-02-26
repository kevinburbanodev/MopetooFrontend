// ============================================================
// useApi.test.ts
// Tests the useApi HTTP client wrapper composable.
//
// Mocking strategy:
//   - $fetch (global): stubbed at module level with vi.hoisted() so the
//     mock exists before any module is imported. Reset in beforeEach via
//     mockReset() — not mockClear() — so stale return values cannot bleed
//     between tests.
//   - localStorage (global): stubbed at module level with vi.hoisted() for
//     the same reason. The auth.client.ts Nuxt plugin calls
//     localStorage.getItem during app initialisation (before beforeEach
//     runs), so the stub must be available at that point. We use the
//     closure-based mock pattern established across this project (patterns.md #5).
//   - useRuntimeConfig: NOT mocked. NUXT_PUBLIC_API_BASE is provided by
//     vitest.config.ts env so the real useRuntimeConfig() returns
//     'http://localhost:4000'. Mocking it via mockNuxtImport breaks
//     @nuxt/test-utils router init (useRouter().afterEach becomes undefined).
//     This is a known project constraint — see patterns.md #12.
//   - No Pinia involvement: useApi has no store dependencies.
//
// What this suite intentionally does NOT cover:
//   - The "with token" branch of buildHeaders(): getToken() gates on
//     import.meta.client, which is false in the nuxt test environment (SSR
//     context). There is no safe way to flip import.meta.client at runtime
//     without patching compiled output. The token branch is covered
//     indirectly by usePets.test.ts and useAuth.test.ts, which assert that
//     multipart $fetch calls include 'Authorization: Bearer <token>'.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useApi } from './useApi'

// ── $fetch global stub ───────────────────────────────────────
// Must be hoisted so the mock reference is available before vi.stubGlobal()
// executes at module evaluation time.
const fetchMock = vi.hoisted(() => vi.fn())
vi.stubGlobal('$fetch', fetchMock)

// ── localStorage global stub ────────────────────────────────
// auth.client.ts (a Nuxt plugin) calls localStorage.getItem during app
// initialisation — before any beforeEach hook runs. The stub must therefore
// be installed at module level. We use a closure so state can be cleared
// per-test via localStorageMock.clear() in beforeEach.
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

// ── Helpers ──────────────────────────────────────────────────

/** Reads the headers argument from the first (and only) $fetch call. */
function capturedHeaders(): Record<string, string> {
  const callArgs = fetchMock.mock.calls[0]
  return (callArgs?.[1]?.headers ?? {}) as Record<string, string>
}

/** Reads the HTTP method from the first $fetch call. */
function capturedMethod(): string {
  const callArgs = fetchMock.mock.calls[0]
  return callArgs?.[1]?.method ?? ''
}

/** Reads the URL from the first $fetch call. */
function capturedUrl(): string {
  const callArgs = fetchMock.mock.calls[0]
  return (callArgs?.[0] as string) ?? ''
}

/** Reads the request body from the first $fetch call. */
function capturedBody(): unknown {
  const callArgs = fetchMock.mock.calls[0]
  return callArgs?.[1]?.body
}

// ── Suite ────────────────────────────────────────────────────

describe('useApi', () => {
  beforeEach(() => {
    // mockReset clears recorded calls AND removes configured return values.
    // mockClear alone would preserve stale resolved/rejected values from the
    // previous test, which can cause false positives.
    fetchMock.mockReset()
    fetchMock.mockResolvedValue({})

    // Clear localStorage state and mock call history between tests.
    localStorageMock.clear()
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
  })

  // ── URL construction ────────────────────────────────────────

  describe('URL construction', () => {
    it('prepends the configured base URL to the path for GET requests', async () => {
      const { get } = useApi()
      await get('/api/pets')
      expect(capturedUrl()).toBe('http://localhost:4000/api/pets')
    })

    it('prepends the configured base URL to the path for POST requests', async () => {
      const { post } = useApi()
      await post('/api/pets', {})
      expect(capturedUrl()).toBe('http://localhost:4000/api/pets')
    })

    it('prepends the configured base URL to the path for PUT requests', async () => {
      const { put } = useApi()
      await put('/api/users/1', {})
      expect(capturedUrl()).toBe('http://localhost:4000/api/users/1')
    })

    it('prepends the configured base URL to the path for PATCH requests', async () => {
      const { patch } = useApi()
      await patch('/api/pets/pet-1', {})
      expect(capturedUrl()).toBe('http://localhost:4000/api/pets/pet-1')
    })

    it('prepends the configured base URL to the path for DELETE requests', async () => {
      const { del } = useApi()
      await del('/api/pets/pet-1')
      expect(capturedUrl()).toBe('http://localhost:4000/api/pets/pet-1')
    })

    it('handles deeply nested path segments correctly', async () => {
      const { get } = useApi()
      await get('/api/users/42/pets/7/medical')
      expect(capturedUrl()).toBe('http://localhost:4000/api/users/42/pets/7/medical')
    })
  })

  // ── HTTP methods ─────────────────────────────────────────────

  describe('get()', () => {
    it('calls $fetch with method GET', async () => {
      const { get } = useApi()
      await get('/api/pets')
      expect(capturedMethod()).toBe('GET')
    })

    it('calls $fetch exactly once per invocation', async () => {
      const { get } = useApi()
      await get('/api/pets')
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('returns the resolved value from $fetch', async () => {
      const pets = [{ id: 'pet-1', name: 'Max' }]
      fetchMock.mockResolvedValueOnce(pets)
      const { get } = useApi()
      const result = await get('/api/pets')
      expect(result).toEqual(pets)
    })

    it('propagates a rejection from $fetch', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'))
      const { get } = useApi()
      await expect(get('/api/pets')).rejects.toThrow('Network error')
    })
  })

  describe('post()', () => {
    it('calls $fetch with method POST', async () => {
      const { post } = useApi()
      await post('/api/pets', { name: 'Max' })
      expect(capturedMethod()).toBe('POST')
    })

    it('passes the body argument to $fetch', async () => {
      const body = { name: 'Max', species: 'dog' }
      const { post } = useApi()
      await post('/api/pets', body)
      expect(capturedBody()).toEqual(body)
    })

    it('returns the resolved value from $fetch', async () => {
      const created = { id: 'pet-1', name: 'Max' }
      fetchMock.mockResolvedValueOnce(created)
      const { post } = useApi()
      const result = await post('/api/pets', { name: 'Max' })
      expect(result).toEqual(created)
    })

    it('propagates a rejection from $fetch', async () => {
      fetchMock.mockRejectedValueOnce({ statusCode: 422, data: { error: 'Validation failed' } })
      const { post } = useApi()
      await expect(post('/api/pets', {})).rejects.toMatchObject({ statusCode: 422 })
    })
  })

  describe('put()', () => {
    it('calls $fetch with method PUT', async () => {
      const { put } = useApi()
      await put('/api/users/1', { email: 'new@example.com' })
      expect(capturedMethod()).toBe('PUT')
    })

    it('passes the body argument to $fetch', async () => {
      const body = { email: 'updated@example.com' }
      const { put } = useApi()
      await put('/api/users/1', body)
      expect(capturedBody()).toEqual(body)
    })

    it('returns the resolved value from $fetch', async () => {
      const updated = { id: '1', email: 'updated@example.com' }
      fetchMock.mockResolvedValueOnce(updated)
      const { put } = useApi()
      const result = await put('/api/users/1', { email: 'updated@example.com' })
      expect(result).toEqual(updated)
    })

    it('propagates a rejection from $fetch', async () => {
      fetchMock.mockRejectedValueOnce({ statusCode: 404 })
      const { put } = useApi()
      await expect(put('/api/users/missing', {})).rejects.toMatchObject({ statusCode: 404 })
    })
  })

  describe('patch()', () => {
    it('calls $fetch with method PATCH', async () => {
      const { patch } = useApi()
      await patch('/api/pets/pet-1', { name: 'Luna' })
      expect(capturedMethod()).toBe('PATCH')
    })

    it('passes the body argument to $fetch', async () => {
      const body = { name: 'Luna', gender: 'female' }
      const { patch } = useApi()
      await patch('/api/pets/pet-1', body)
      expect(capturedBody()).toEqual(body)
    })

    it('returns the resolved value from $fetch', async () => {
      const updated = { id: 'pet-1', name: 'Luna' }
      fetchMock.mockResolvedValueOnce(updated)
      const { patch } = useApi()
      const result = await patch('/api/pets/pet-1', { name: 'Luna' })
      expect(result).toEqual(updated)
    })

    it('propagates a rejection from $fetch', async () => {
      fetchMock.mockRejectedValueOnce({ statusCode: 403, data: { error: 'Forbidden' } })
      const { patch } = useApi()
      await expect(patch('/api/pets/pet-1', {})).rejects.toMatchObject({ statusCode: 403 })
    })
  })

  describe('del()', () => {
    it('calls $fetch with method DELETE', async () => {
      const { del } = useApi()
      await del('/api/pets/pet-1')
      expect(capturedMethod()).toBe('DELETE')
    })

    it('calls $fetch exactly once per invocation', async () => {
      const { del } = useApi()
      await del('/api/pets/pet-1')
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('returns the resolved value from $fetch (undefined for 204 No Content)', async () => {
      fetchMock.mockResolvedValueOnce(undefined)
      const { del } = useApi()
      const result = await del('/api/pets/pet-1')
      expect(result).toBeUndefined()
    })

    it('propagates a rejection from $fetch', async () => {
      fetchMock.mockRejectedValueOnce({ statusCode: 404, data: { error: 'Not found' } })
      const { del } = useApi()
      await expect(del('/api/pets/missing')).rejects.toMatchObject({ statusCode: 404 })
    })
  })

  // ── Headers — no token (SSR / import.meta.client = false) ───

  describe('headers — without token (SSR context, import.meta.client is false)', () => {
    // In the nuxt test environment, import.meta.client compiles to false.
    // getToken() therefore always returns null, so buildHeaders(null) produces
    // only Content-Type. This is the only header branch reachable in tests.

    it('includes Content-Type: application/json on GET', async () => {
      const { get } = useApi()
      await get('/api/pets')
      expect(capturedHeaders()).toMatchObject({ 'Content-Type': 'application/json' })
    })

    it('does NOT include an Authorization header on GET when no token is stored', async () => {
      const { get } = useApi()
      await get('/api/pets')
      expect(capturedHeaders()).not.toHaveProperty('Authorization')
    })

    it('includes Content-Type: application/json on POST', async () => {
      const { post } = useApi()
      await post('/api/pets', {})
      expect(capturedHeaders()).toMatchObject({ 'Content-Type': 'application/json' })
    })

    it('does NOT include an Authorization header on POST when no token is stored', async () => {
      const { post } = useApi()
      await post('/api/pets', {})
      expect(capturedHeaders()).not.toHaveProperty('Authorization')
    })

    it('includes Content-Type: application/json on PUT', async () => {
      const { put } = useApi()
      await put('/api/users/1', {})
      expect(capturedHeaders()).toMatchObject({ 'Content-Type': 'application/json' })
    })

    it('includes Content-Type: application/json on PATCH', async () => {
      const { patch } = useApi()
      await patch('/api/pets/pet-1', {})
      expect(capturedHeaders()).toMatchObject({ 'Content-Type': 'application/json' })
    })

    it('includes Content-Type: application/json on DELETE', async () => {
      const { del } = useApi()
      await del('/api/pets/pet-1')
      expect(capturedHeaders()).toMatchObject({ 'Content-Type': 'application/json' })
    })

    it('does NOT include an Authorization header on DELETE when no token is stored', async () => {
      const { del } = useApi()
      await del('/api/pets/pet-1')
      expect(capturedHeaders()).not.toHaveProperty('Authorization')
    })

    it('sends exactly one header key (Content-Type only) when no token is present', async () => {
      const { get } = useApi()
      await get('/api/pets')
      // buildHeaders(null) must not add any extra headers beyond Content-Type
      const headers = capturedHeaders()
      expect(Object.keys(headers)).toHaveLength(1)
      expect(Object.keys(headers)[0]).toBe('Content-Type')
    })
  })

  // ── Headers — with token (import.meta.client = true branch) ─

  describe('headers — with token (import.meta.client = true branch)', () => {
    // import.meta.client compiles to false in the nuxt test environment (SSR
    // context). The getToken() branch that reads localStorage and builds the
    // Authorization header is therefore unreachable through useApi() calls.
    //
    // The Authorization header IS exercised in cross-composable tests:
    //   - usePets.test.ts: multipart $fetch calls assert
    //     'Authorization: Bearer jwt.test.token'
    //   - useAuth.test.ts: multipart $fetch calls assert
    //     'Authorization: Bearer <token>'
    //
    // Patching import.meta.client at runtime (via vi.stubGlobal or module
    // patching) is fragile and not supported by Vitest's nuxt environment.
    //
    // If the team wants isolated unit coverage of buildHeaders(token), the
    // recommended fix is to export buildHeaders as a named export from
    // useApi.ts and test it directly — that refactor is a separate decision.
    it.skip('Authorization header is included when import.meta.client is true and a token is stored — unreachable in SSR test environment; see usePets.test.ts for indirect coverage', () => {})
  })

  // ── Full $fetch call shape ───────────────────────────────────

  describe('$fetch call shape', () => {
    it('passes method, headers, and body to $fetch on post()', async () => {
      const { post } = useApi()
      await post('/api/pets', { name: 'Max' })
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/api/pets',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: { name: 'Max' },
        }),
      )
    })

    it('passes method and headers but no body on get()', async () => {
      const { get } = useApi()
      await get('/api/pets')
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/api/pets',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        }),
      )
      // A body on GET can cause unexpected 400 errors on strict HTTP servers
      expect(capturedBody()).toBeUndefined()
    })

    it('passes method and headers but no body on del()', async () => {
      const { del } = useApi()
      await del('/api/pets/pet-1')
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/api/pets/pet-1',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        }),
      )
      expect(capturedBody()).toBeUndefined()
    })

    it('passes method, headers, and body to $fetch on put()', async () => {
      const body = { email: 'user@example.com' }
      const { put } = useApi()
      await put('/api/users/1', body)
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/api/users/1',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body,
        }),
      )
    })

    it('passes method, headers, and body to $fetch on patch()', async () => {
      const body = { name: 'Luna' }
      const { patch } = useApi()
      await patch('/api/pets/pet-1', body)
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/api/pets/pet-1',
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body,
        }),
      )
    })
  })

  // ── Return contract ──────────────────────────────────────────

  describe('return value', () => {
    it('useApi() returns an object with all five HTTP method functions', () => {
      const api = useApi()
      expect(typeof api.get).toBe('function')
      expect(typeof api.post).toBe('function')
      expect(typeof api.put).toBe('function')
      expect(typeof api.patch).toBe('function')
      expect(typeof api.del).toBe('function')
    })

    it('get() returns the exact value resolved by $fetch', async () => {
      const responseData = { id: 'pet-1', name: 'Max', species: 'dog' }
      fetchMock.mockResolvedValueOnce(responseData)
      const { get } = useApi()
      const result = await get<typeof responseData>('/api/pets/pet-1')
      expect(result).toStrictEqual(responseData)
    })

    it('post() returns the exact value resolved by $fetch', async () => {
      const responseData = { id: 'new-pet', name: 'Luna' }
      fetchMock.mockResolvedValueOnce(responseData)
      const { post } = useApi()
      const result = await post<typeof responseData>('/api/pets', { name: 'Luna' })
      expect(result).toStrictEqual(responseData)
    })

    it('del() returns undefined when $fetch resolves with no body (204 No Content)', async () => {
      fetchMock.mockResolvedValueOnce(undefined)
      const { del } = useApi()
      const result = await del('/api/pets/pet-1')
      expect(result).toBeUndefined()
    })

    it('each call to useApi() returns a fresh closure — no shared state between instances', () => {
      const apiA = useApi()
      const apiB = useApi()
      // Each call to useApi() creates new function closures over a fresh baseURL
      // binding — the function references must be distinct objects.
      expect(apiA.get).not.toBe(apiB.get)
    })
  })
})
