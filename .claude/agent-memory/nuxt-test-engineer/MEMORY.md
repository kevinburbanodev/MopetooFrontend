# nuxt-test-engineer — Project Memory

## Test Stack
- Vitest + `@nuxt/test-utils` + `@pinia/testing`
- Config: `vitest.config.ts` at project root — `environment: 'nuxt'`, `globals: true`
- Scripts: `npm test` (watch), `npm run test:coverage` (single run)
- See `patterns.md` for detailed patterns established in this project.

## Colocation Rule (enforced)
Test files live next to the source file inside the feature slice:
- `app/features/auth/stores/auth.store.test.ts`
- `app/features/auth/composables/useAuth.test.ts`
- `app/middleware/auth.test.ts`
- `app/middleware/guest.test.ts`
Never in a top-level `/tests` folder.

## Mocking Boundaries (established)
- `useApi` is a project composable (not a Nuxt built-in) — mock with `vi.mock('../../../shared/composables/useApi')`, NOT `mockNuxtImport`
- `navigateTo`, `useRouter`, `useRuntimeConfig`, `defineNuxtRouteMiddleware` — mock with `mockNuxtImport`
- `$fetch` global — stub with `vi.stubGlobal('$fetch', fetchMock)` for multipart paths
- `localStorage` — stub with `vi.stubGlobal('localStorage', localStorageMock)` in `beforeEach`

## Key Patterns
- Pinia isolation: `setActivePinia(createTestingPinia({ stubActions: false, createSpy: vi.fn }))` in `beforeEach`
- Store tests: use `setActivePinia(createPinia())` directly (no `createTestingPinia`) — tests the real store
- Middleware tests: mock `defineNuxtRouteMiddleware` to return `(handler) => handler`; dynamic import the middleware after setting pinia; call the default export as a plain function
- `vi.resetModules()` in `beforeEach` for middleware tests — forces fresh module with correct pinia instance

## Auth Feature Coverage (completed)
- `auth.store.ts`: initial state, setSession, clearSession, setUser, isPro, isAdmin, restoreFromStorage
- `useAuth.ts`: login (success/failure/pending), register (json/multipart), logout, forgotPassword, resetPassword, fetchCurrentUser (success/401/other error), updateProfile (json/multipart/auth-header), deleteAccount
- `auth.ts` middleware: authenticated pass-through, unauthenticated redirect to /login
- `guest.ts` middleware: authenticated redirect to /dashboard, unauthenticated pass-through

## localStorage TOKEN KEY
`mopetoo_token` — used in store and useApi. Assertions must use this exact string.

## Details
See `patterns.md` for full pattern documentation.
