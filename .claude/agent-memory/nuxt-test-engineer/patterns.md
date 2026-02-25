# Testing Patterns — Mopetoo Frontend

## 1. Pinia Store Tests (no Nuxt environment needed)

Use `createPinia()` directly — not `createTestingPinia` — when testing the real store logic.
`createTestingPinia` stubs actions by default, which defeats the purpose of testing store actions.

```ts
beforeEach(() => {
  setActivePinia(createPinia())
  vi.stubGlobal('localStorage', localStorageMock)
})
```

## 2. Pinia in Composable / Middleware Tests

Use `createTestingPinia({ stubActions: false, createSpy: vi.fn })` to get a real reactive
store without stubbing actions, while still being able to spy on them:

```ts
setActivePinia(createTestingPinia({ stubActions: false, createSpy: vi.fn }))
const { useAuthStore } = await import('../stores/auth.store')
authStore = useAuthStore()
const setSessionSpy = vi.spyOn(authStore, 'setSession')
```

## 3. Mocking useApi (project composable, not Nuxt built-in)

useApi lives at `app/features/shared/composables/useApi.ts`. Use `vi.mock` with a relative
path from the test file's location:

```ts
const apiPostMock = vi.fn()
vi.mock('../../../shared/composables/useApi', () => ({
  useApi: () => ({ post: apiPostMock, get: apiGetMock, patch: apiPatchMock, del: apiDelMock }),
}))
```

Reset ALL mock functions in `beforeEach` with `.mockReset()` — not `.mockClear()`.
`.mockReset()` clears calls AND removes any configured return values, which prevents
stale mock implementations from bleeding between tests.

## 4. Middleware Testing Pattern

Middleware functions use `defineNuxtRouteMiddleware`, a Nuxt auto-import.
Mock it to be a passthrough so the handler is testable as a plain function:

```ts
mockNuxtImport('defineNuxtRouteMiddleware', () => (handler: Function) => handler)
```

Then in each test group, set up pinia state, then dynamically import the middleware:

```ts
beforeEach(() => {
  vi.resetModules() // CRITICAL: forces fresh module resolution with current pinia
})

it('redirects unauthenticated users', async () => {
  setActivePinia(createTestingPinia({ initialState: { auth: { token: null } } }))
  const middleware = (await import('./auth')).default as Function
  middleware({}, {})
  expect(navigateToMock).toHaveBeenCalledWith('/login')
})
```

`vi.resetModules()` MUST be called before the dynamic import. Without it, the module
is cached and picks up the wrong pinia instance.

## 5. localStorage Mock

Create a closure-based mock at the top of the test file. Recreate it per test by calling
`.mockClear()` and `.clear()` in `beforeEach`:

```ts
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()
```

## 6. $fetch Global Stub for Multipart Paths

useAuth and useApi bypass the shared wrapper for FormData uploads:

```ts
const fetchMock = vi.fn()
vi.stubGlobal('$fetch', fetchMock)
```

Assert the body is FormData without asserting field values (FormData internals are opaque):

```ts
expect(fetchMock).toHaveBeenCalledWith(
  'http://localhost:4000/users',
  expect.objectContaining({ method: 'POST', body: expect.any(FormData) }),
)
```

## 7. Pending State Testing

Capture `pending.value` mid-flight by using a deferred promise in the mock:

```ts
apiPostMock.mockImplementationOnce(() =>
  new Promise<LoginResponse>(resolve => setTimeout(() => resolve(mockLoginResponse), 0))
)
const loginPromise = login('ana@example.com', 'Secret123!')
const pendingDuringCall = pending.value  // captured before awaiting
await loginPromise
expect(pendingDuringCall).toBe(true)
expect(pending.value).toBe(false)
```

## 8. Error Extraction (ofetch shape)

The backend returns `{ error: string }` inside the `data` field of ofetch errors.
Test errors must match this shape so `extractErrorMessage` parses correctly:

```ts
apiPostMock.mockRejectedValueOnce({ data: { error: 'Credenciales inválidas' } })
```

## 9. mockNuxtImport vs vi.mock Decision

| Target | Tool |
|---|---|
| `navigateTo`, `useRouter`, `useRuntimeConfig`, `defineNuxtRouteMiddleware`, `useFetch`, `useAsyncData` | `mockNuxtImport` |
| `useApi`, `useAuth`, `useAuthStore` (project composables) | `vi.mock` with relative path |
| `$fetch`, `localStorage`, `window.*` (globals) | `vi.stubGlobal` |
