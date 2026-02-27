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

**CRITICAL**: In the `nuxt` test environment, the `auth.client.ts` plugin runs during Nuxt
app initialisation — BEFORE any `beforeEach` hook fires. If `localStorage` is not stubbed
at module level, the plugin throws `localStorage.getItem is not a function` and all tests
in the file fail before they even start.

The fix: use `vi.hoisted()` to create the mock, then call `vi.stubGlobal` at the top level:

```ts
// CORRECT — stubbed at module level, available during Nuxt app init
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

// Then reset in beforeEach (not re-stub — it's already in place):
beforeEach(() => {
  localStorageMock.clear()
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
})
```

The older pattern (stubbing in `beforeEach`) works ONLY for test files where the Nuxt
plugin layer doesn't trigger during init — e.g., pure store tests that use `createPinia()`
directly and don't boot the full Nuxt app. For composable tests in the `nuxt` environment,
always use the module-level pattern above.

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

## 9. Admin Feature — Transacción plural form (accented)

The AdminTransactionLog component uses:
```vue
{{ adminStore.totalTransactions }} transacción{{ adminStore.totalTransactions !== 1 ? 'es' : '' }}
```
This appends 'es' to 'transacción', producing 'transacciónes' (with accent on ó) for plurals.
Test assertions must use `toContain('transacción')` (present in both singular and plural forms) rather than trying to match the exact plural string 'transacciones' (without accent).

## 10. Admin middleware test — 3-branch coverage

The admin middleware has THREE branches (not two like auth middleware):
1. Not authenticated → navigateTo('/login')
2. Authenticated + isAdmin=false → navigateTo('/')
3. Authenticated + isAdmin=true → undefined (pass-through)

isAdmin is a computed: `currentUser?.is_admin ?? false`
Set via `createTestingPinia({ initialState: { auth: { token: 'jwt', currentUser: { id: 1, is_admin: true } } } })`

Test file: `app/middleware/admin.test.ts` (7 tests — 2 per branch for the redirect cases, 2 for the pass-through)

## 11. Admin slice — Coverage (RF-1000 to RF-1009)

- `admin.store.ts`: 75 tests — initial state (11), hasStats getter (3), hasUsers getter (3), setStats (3), setUsers (5), updateUser (4), removeUser (4), setSelectedUser/clearSelectedUser (3), setShelters (2), updateShelter (2), removeShelter (3), setPetshops (1), updatePetshop (2), removePetshop (3), setAdminClinics (2), updateAdminClinic (3), removeAdminClinic (3), setTransactions (2), setLoading (4), clearAdmin (13)
- `useAdmin.ts`: 76 tests — fetchStats (6), fetchUsers (10), updateUser (6), deleteUser (5), fetchShelters (6), updateShelter (4), deleteShelter (4), fetchPetshops (4), updatePetshop (4), deletePetshop (3), fetchAdminClinics (5), updateAdminClinic (4), deleteAdminClinic (4), fetchTransactions (6), error extraction (4)
- `AdminDashboard.vue`: 27 tests — section structure, lifecycle (fetchStats on mount), loading skeleton (8 cards/aria-busy/no KPIs), KPI cards (8 labels/revenue section), quick nav links (5 links), empty state (heading/reintentar button/reintentar calls fetchStats), error alert (show/hide)
- `AdminUserManager.vue`: 31 tests — section/lifecycle, loading skeleton (5 rows), empty state, user rows (name/email/city/PRO badge/Admin badge), toggle PRO (Dar/Quitar × 2), toggle Admin (Dar/Quitar × 2), 2-step delete (6 tests), result count (singular/plural), error alert, no pagination footer when ≤20
- `AdminShelterManager.vue`: 27 tests — section/lifecycle, skeleton, empty state, shelter rows (name/city/verified badge/unverified/"No"/featured badge/email), toggle Verificado (2), toggle Destacado (2), 2-step delete (6), result count (singular/plural), error alert, no pagination footer
- `AdminStoreManager.vue`: 27 tests — same pattern as ShelterManager but for petshops
- `AdminClinicManager.vue`: 29 tests — same pattern + specialty chips (2 visible max, +N overflow badge, dash for empty specialties)
- `AdminTransactionLog.vue`: 28 tests — section/lifecycle, skeleton, empty state, rows (user_name/email/id truncated/currency/description), type badges (subscription=bg-primary/"Suscripción"/donation=bg-success/"Donación"), status badges (completed/pending/failed/refunded with correct CSS classes and Spanish labels), read-only (no Eliminar/Verificar/Destacar buttons), result count, error alert, no pagination footer
- `admin.ts` middleware: 7 tests — unauthenticated→/login (2), authenticated non-admin→/ (3), authenticated admin→pass-through (2)
