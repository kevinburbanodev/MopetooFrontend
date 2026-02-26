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
| `navigateTo`, `useRouter`, `defineNuxtRouteMiddleware`, `useFetch`, `useAsyncData` | `mockNuxtImport` |
| `useRuntimeConfig` | Set via `vitest.config.ts env` (e.g. `NUXT_PUBLIC_API_BASE`) — do NOT use `mockNuxtImport` in composable tests; it breaks `@nuxt/test-utils` router init |
| `useApi`, `useAuth`, `useAuthStore`, `usePets`, `usePetsStore` (project composables) | `vi.mock` with relative path |
| `$fetch`, `localStorage`, `window.*` (globals) | `vi.stubGlobal` |

## 10. URL API in Component Tests (PetForm photo upload)

`URL.createObjectURL` is not implemented in happy-dom. Use `vi.spyOn` — NOT `vi.stubGlobal('URL', {...URL, ...})`.

**Why:** `{...URL}` creates a plain object, NOT a constructor. Any code calling `new URL(url)` (e.g. `isSafeImageUrl`) will throw, the catch returns `false`, and photo previews are never rendered.

```ts
beforeEach(() => {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/fake-object-url')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
})
afterEach(() => { vi.restoreAllMocks() })
```

## 11. Component Tests — useApi mock path from pets

From `app/features/pets/composables/usePets.test.ts`, the relative path to `useApi` is:

```ts
vi.mock('../../shared/composables/useApi', () => ({ ... }))
```

(two levels up from `pets/composables/`, not three as in `auth/composables/`)

## 12. vitest.config.ts env for stable runtime config

Rather than mocking `useRuntimeConfig` per-test (which interferes with `@nuxt/test-utils` router), set the env var globally:

```ts
// vitest.config.ts
test: {
  env: { NUXT_PUBLIC_API_BASE: 'http://localhost:4000' },
}
```

This makes the real `useRuntimeConfig()` return the correct value in all tests without any mocking.

## 13. vi.hoisted() for mockNuxtImport factory variables

Any variable referenced inside a `mockNuxtImport` factory MUST be declared with `vi.hoisted()`:

```ts
// WRONG — ReferenceError: Cannot access 'navigateToMock' before initialization
const navigateToMock = vi.fn((path: string) => ({ path }))
mockNuxtImport('navigateTo', () => navigateToMock)

// CORRECT — vi.hoisted() ensures the variable is available at hoist time
const navigateToMock = vi.hoisted(() => vi.fn((path: string) => ({ path })))
mockNuxtImport('navigateTo', () => navigateToMock)
```

Same rule applies to `routerPushMock` if referenced in a `mockNuxtImport('useRouter', ...)` factory.

## 14. useRouter mock must include ALL guard methods

`mockNuxtImport('useRouter', ...)` must return a router-like object with all guard hooks:

```ts
const routerPushMock = vi.hoisted(() => vi.fn())
mockNuxtImport('useRouter', () => () => ({
  push: routerPushMock,
  replace: vi.fn(), go: vi.fn(), back: vi.fn(), forward: vi.fn(),
  beforeEach: vi.fn(() => vi.fn()),
  afterEach: vi.fn(() => vi.fn()),   // REQUIRED — @nuxt/test-utils calls this in setup
  beforeResolve: vi.fn(() => vi.fn()),
  onError: vi.fn(() => vi.fn()),
  resolve: vi.fn(), addRoute: vi.fn(), removeRoute: vi.fn(),
  hasRoute: vi.fn(), getRoutes: vi.fn(() => []),
  currentRoute: { value: { path: '/', params: {}, query: {}, hash: '' } },
  options: {},
}))
```

Omitting `afterEach` causes: `TypeError: useRouter(...).afterEach is not a function`.

## 15. useApi vi.mock path from auth composables

From `app/features/auth/composables/useAuth.test.ts`, the correct relative path is TWO levels up:

```ts
vi.mock('../../shared/composables/useApi', () => ({ ... }))
// NOT '../../../shared/...' (which resolves to app/ not app/features/)
```

If the path is wrong, vi.mock silently does nothing and all API mock assertions get 0 calls.
