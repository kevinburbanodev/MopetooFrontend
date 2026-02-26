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
- `useApi` is a project composable (not a Nuxt built-in) — mock with `vi.mock('../../shared/composables/useApi')`, NOT `mockNuxtImport`
- `navigateTo`, `useRouter`, `defineNuxtRouteMiddleware` — mock with `mockNuxtImport`
- `useRuntimeConfig` — DO NOT mock with `mockNuxtImport` in composable tests. Set `NUXT_PUBLIC_API_BASE` via `vitest.config.ts env` instead. Mocking it at module level breaks `@nuxt/test-utils` router init (`useRouter().afterEach` becomes undefined).
- `useRouter` via `mockNuxtImport` — MUST include ALL router guard methods (`afterEach`, `beforeEach`, `beforeResolve`, `onError`) in the stub. A stub returning only `{ push }` causes `useRouter().afterEach is not a function` during `@nuxt/test-utils` setup.
- `vi.mock` paths for `useApi` in composable tests: from `app/features/auth/composables/`, the correct relative path is `../../shared/composables/useApi` (NOT `../../../shared/...`). Wrong path = 0 mock calls silently.
- `$fetch` global — stub with `vi.stubGlobal('$fetch', fetchMock)` for multipart paths
- `localStorage` — MUST be stubbed at MODULE LEVEL (not in `beforeEach`) when the test file targets the nuxt environment. `auth.client.ts` plugin runs during Nuxt app init before any `beforeEach` hook. Use `vi.hoisted()` to create the mock and `vi.stubGlobal` at the top level. Stubbing in `beforeEach` causes `localStorage.getItem is not a function` during plugin init.

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
- All auth tests now PASS (328 total across 12 files). Hoisting fix applied: `navigateToMock` wrapped in `vi.hoisted(() => vi.fn(...))`.
- `mockNuxtImport` factory hoisting pattern: any variable referenced inside a `mockNuxtImport` factory MUST be declared with `vi.hoisted(() => vi.fn())`, not plain `vi.fn()`.
- `updateProfile` auth-header test: `authStore.token` must be set directly (`authStore.token = 'stored.jwt'`) before calling the composable — `localStorage` stubs do NOT retroactively populate the store state.

## Shared Feature Coverage (completed)
- `useApi.ts`: 45 tests (1 skipped) — URL construction (6), get/post/put/patch/del HTTP methods (4 each), headers without token (9), $fetch call shape (5), return value contract (5)
- Token branch (`import.meta.client = true`) is unreachable in nuxt SSR test environment — explicitly skipped with `it.skip` and explanation. Covered indirectly by usePets and useAuth multipart tests.

## Pets Feature Coverage (completed — RF-100 to RF-109)
- `pets.store.ts`: 44 tests — initial state, setPets, addPet, updatePet (selectedPet sync), removePet (selectedPet clear), setSelectedPet, clearSelectedPet, setLoading, hasPets getter, getPetById getter
- `usePets.ts`: 51 tests — fetchPets (array/object/missing key/error), fetchPetById (success/404), createPet (JSON/FormData + auth header), updatePet (PATCH JSON/FormData), deletePet (success/failure/generic error)
- `usePetAge.ts`: 17 tests — empty, invalid, today, months, years, combined, singular/plural
- `PetAvatar.vue`: 21 tests — photo/fallback rendering, image error fallback, size prop, a11y
- `PetCard.vue`: 22 tests — rendering all fields, event emissions, stopPropagation, a11y
- `PetList.vue`: 16 tests — loading skeleton (6 cards), empty state, pet grid, event forwarding, a11y
- `PetForm.vue`: 32 tests — create/edit mode field rendering, validation, submit payload, cancel, isLoading, photo upload
- `PetDetail.vue`: 29 tests — all fields, edit emit, two-step delete confirmation flow, fallback species

## localStorage TOKEN KEY
`mopetoo_token` — used in store and useApi. Assertions must use this exact string.

## Details
See `patterns.md` for full pattern documentation.
