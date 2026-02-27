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
- `useExportPDF.ts`: 24 tests — slugify (12: lowercase, spaces, multi-space, accents, special chars, apostrophes, digits, hyphens, clean slug, empty, all-stripped, real-world), downloadPDF (12: full URL, GET method, blob responseType, auth header, empty headers when no token, createObjectURL call, revokeObjectURL call, download attribute, href/blob, propagates errors, no createObjectURL on $fetch error, different endpoint)

## useExportPDF URL stub pattern
`vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:...')` and `vi.spyOn(URL, 'revokeObjectURL')` — MUST spy on the real URL object, NOT replace it with `vi.stubGlobal('URL', {...})`. Replacing URL entirely breaks Nuxt internals that use `new URL(href)` as a constructor ("URL is not a constructor").

## import.meta.client in nuxt test environment
`import.meta.client` evaluates to `true` in the nuxt test environment with happy-dom — NOT false. The client-side path (including $fetch, DOM manipulation) IS exercised in tests. The SSR guard can only be tested by patching compiled output, which is impractical. Document the SSR no-op as untested and rely on the guard being a trivial one-liner.

## RF-400 PDF export Coverage (completed)
- `useExportPDF.ts`: 24 tests (shared composable)
- `usePets.ts` `exportProfilePDF`: 12 new tests added to existing `usePets.test.ts` — endpoint construction, petName slugify, petId fallback, slugify call/skip, isLoading lifecycle, error handling (3 shapes + generic fallback), error cleared on success
- `useReminders.ts` `exportRemindersPDF`: 19 new tests added to existing `useReminders.test.ts` — endpoint selection (no petId/with petId/petId=0 edge), filename (no petName/petName suffix/petId-only/slugify call/no slugify call/combined), isLoading lifecycle, error handling (4 shapes)

## Pets Feature Coverage (completed — RF-100 to RF-109)
- `pets.store.ts`: 44 tests — initial state, setPets, addPet, updatePet (selectedPet sync), removePet (selectedPet clear), setSelectedPet, clearSelectedPet, setLoading, hasPets getter, getPetById getter
- `usePets.ts`: 64 tests — fetchPets (array/object/missing key/error), fetchPetById (success/404), createPet (JSON/FormData + auth header), updatePet (PATCH JSON/FormData), deletePet (success/failure/generic error), exportProfilePDF (12 tests — RF-400)
- `usePetAge.ts`: 17 tests — empty, invalid, today, months, years, combined, singular/plural
- `PetAvatar.vue`: 21 tests — photo/fallback rendering, image error fallback, size prop, a11y
- `PetCard.vue`: 22 tests — rendering all fields, event emissions, stopPropagation, a11y
- `PetList.vue`: 16 tests — loading skeleton (6 cards), empty state, pet grid, event forwarding, a11y
- `PetForm.vue`: 32 tests — create/edit mode field rendering, validation, submit payload, cancel, isLoading, photo upload
- `PetDetail.vue`: 29 tests — all fields, edit emit, two-step delete confirmation flow, fallback species

## Project Test Total: 937 passing, 1 skipped (24 test files)

## Reminders Feature Coverage (completed — RF-200 to RF-209)
- `reminders.store.ts`: 44 tests — initial state, hasReminders, getReminderById, setReminders, addReminder, updateReminder (selectedReminder sync), removeReminder (selectedReminder clear), setSelectedReminder, clearSelectedReminder, setLoading, clearReminders
- `useReminders.ts`: 75 tests — fetchReminders (array/object/missing key/error/petId nested route/petId=0 edge), fetchReminderById (success/404/no setSelectedReminder on error), createReminder (success/failure/loading), updateReminder (PUT/failure/no store call on error), deleteReminder (success/failure/loading/generic error), error ref contract (null start, cleared on success, shape extraction), exportRemindersPDF (19 tests — RF-400)
- `ReminderCard.vue`: 26 tests — title/date/time element, petName show/hide, notes show/hide, type labels (5), type icons (5), recurrence labels (4) + hide when undefined, Vencido badge (past/future/CSS class), edit/delete emit, stopPropagation, a11y
- `ReminderList.vue`: 29 tests — loading skeleton (6 cards/aria-busy/no filter bar), empty state (heading/CTA link/no skeleton), reminder grid (count/names/no empty state), filter bar (Todas/pet options/Todos/5 types/no Limpiar when inactive), pet filter (by pet/Limpiar clears/shows Limpiar when active), type filter (by type/Limpiar), filter no-results (message/no articles/Ver todos button/clear via Ver todos), sort ascending, petName lookup (match/unknown pet), event forwarding (edit/delete), accessibility (section aria-label)
- `ReminderForm.vue`: 46 tests — create mode (all fields present/defaults/vacuna/first pet/no recurrence/Crear recordatorio), edit mode (pre-fill all fields/Guardar cambios), validation (no emit on empty/was-validated/is-invalid title/date/pet/short title), submit payload (required fields/pet_id as Number/trim title/omit recurrence when empty/include recurrence/omit notes when empty/include notes/trim notes/omit whitespace notes/different pet/different type), notes counter (0/500/count/edit prefill), cancel (emit/no submit), isLoading (disable submit/disable cancel/spinner/enabled when false/no spinner), no pets warning (show/hide), async pets (auto-select first/no override if already selected), type options (5 count/vacuna/medicina/visita), recurrence options (Sin recurrencia first/5 total)

## Happy-dom select null option pitfall
`setValue(null)` on a select bound to `:value="null"` does NOT work — happy-dom serializes it as `"null"` (string), not matching the `:value="null"` Vue binding. Use the "Limpiar filtros" button click or `setValue('')` instead of trying to reset a null-bound option via `setValue(null)`.

## NuxtLink in component tests
- `{ NuxtLink: true }` — stubs as `<nuxtlink-stub>` with NO slot content. Text inside the link is invisible to `wrapper.text()`.
- `{ NuxtLink: false }` — renders as a real router-link which does NOT produce a plain `<a href="...">` in happy-dom. Do NOT use for href assertions.
- `{ NuxtLink: { template: '<a><slot /></a>' } }` — renders slot content without a real router. Use when text inside NuxtLink must be visible AND href precision is not needed.
- `{ NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] } }` — renders as `<a>` with the `:to` prop forwarded to `href`. Use for ALL href assertions on NuxtLink elements (e.g. back links, login/register CTAs).

## Composable mock path for medical feature
- From `app/features/medical/components/`, mock `useMedical` as: `vi.mock('../composables/useMedical', ...)`.
- From `app/features/medical/composables/`, mock `useApi` as: `vi.mock('../../shared/composables/useApi', ...)`.

## Medical Feature Coverage (completed — RF-300 to RF-309)
- `medical.store.ts`: 44 tests — initial state, hasRecords getter, getRecordById getter, setRecords, addRecord (prepend/unshift), updateRecord (selectedRecord sync), removeRecord (selectedRecord clear), setSelectedRecord, clearSelectedRecord, setLoading, clearMedicalRecords
- `useMedical.ts`: 65 tests — fetchMedicalHistory (array/object/missing key/error/bare array shape), fetchMedicalRecord (success/404/no setSelected on error), createMedicalRecord (success/failure/loading/no addRecord on error), updateMedicalRecord (PUT/failure/no store call on error/URL correctness), deleteMedicalRecord (success/failure/loading/generic error/no removeRecord on error), exportPDF (function exists/SSR no-op), error ref contract (null start/cleared on success/3 error shapes)
- `MedicalRecordCard.vue`: 38 tests — required fields (date/vet/diagnosis/treatment/labels), optional weight (show/hide/0 boundary/title), optional notes (show/hide), optional next_visit (show/hide/bg-warning future), overdue badge (Vencida text/bg-danger/no bg-danger future/aria-label), edit link (Editar text/href/aria-label), two-step delete (initial state/show confirmation/Sí+Cancelar/no emit on first click/emit on confirm/cancel resets state/no emit on cancel), accessibility (article aria-label/delete button aria-label/aria-hidden emojis)
- `MedicalHistory.vue`: 31 tests — header (heading/petName show/hide/subtitle/Agregar registro/Volver link), loading skeleton (aria-busy/aria-label/3 cards/no empty state/no articles), empty state (Sin registros/CTA/description/no skeleton/no articles/no Export PDF), records grid (article count/diagnoses/no empty state/no skeleton/Export PDF visible), Export PDF (not disabled/calls exportPDF with petId/with petName/hidden when no records), fetchMedicalHistory on mount (correct petId), error alert (shown/hidden), section aria-label
- `MedicalRecordForm.vue`: 86 tests — create mode (7 fields rendered/all start empty/Guardar registro button), edit mode (pre-fill all 9 fields/Guardar cambios button/empty weight/notes when undefined), validation (was-validated/no call on empty/is-invalid date+vet+diagnosis+treatment/short vet/diagnosis/treatment/weight >200/<0/optional empty weight/boundary 0/200), create payload (petId+fields/trim vet+diagnosis+treatment/omit/include notes+trim/omit whitespace notes/omit/include weight as float/omit/include next_visit/no updateMedicalRecord), edit payload (updateMedicalRecord with petId+recordId+payload/no createMedicalRecord/updated vet/clear weight), navigation (navigate on success/no navigate on null/correct petId), cancel (navigate back/no createMedicalRecord/correct petId), isLoading (disable submit+cancel/spinner/enabled false/no spinner), counters (0/1000 diagnosis+treatment/0/500 notes/edit pre-fill lengths), error alert (shown/hidden), required labels (7 labels rendered)

## localStorage TOKEN KEY
`mopetoo_token` — used in store and useApi. Assertions must use this exact string.

## Auth-conditional component tests (useAuthStore accessed directly in component)
When a component reads `useAuthStore()` directly (not via a prop or composable), the Nuxt test env activates its own pinia. Two critical rules:
1. **Set token AFTER `mountSuspended`**, then `await nextTick()`. Setting token BEFORE mount does not work because the Nuxt env pinia is activated at mount time, not before.
   ```ts
   const wrapper = await mountSuspended(MyComponent, { props, global })
   const { useAuthStore } = await import('../../auth/stores/auth.store')
   useAuthStore().token = 'test-jwt-token'
   await nextTick()
   // now auth-conditional DOM is rendered
   ```
2. **Reset token in `beforeEach`** using the same dynamic import pattern. `setActivePinia(createPinia())` does NOT reset the Nuxt env pinia's store state — token from a previous test persists into the next test. Always reset explicitly:
   ```ts
   beforeEach(async () => {
     const { useAuthStore } = await import('../../auth/stores/auth.store')
     useAuthStore().token = null
   })
   ```

## Form submit in happy-dom: trigger 'submit' on the <form>, not click on the button
`wrapper.find('button[type="submit"]').trigger('click')` does NOT fire the form's `@submit.prevent` handler in happy-dom. Always trigger `submit` directly on the form element:
```ts
await wrapper.find('form').trigger('submit')
await nextTick()  // wait for any async submit handler to resolve
```

## Shelters Feature Coverage (completed — RF-500 to RF-509)
- `shelters.store.ts`: 65 tests — initial state, hasShelters getter, hasAdoptionPets getter, getAvailablePets getter, setShelters, addShelter (prepend/unshift), setSelectedShelter, clearSelectedShelter, setAdoptionPets, addAdoptionPet (prepend/unshift), setSelectedAdoptionPet, clearSelectedAdoptionPet, setLoading, clearShelters
- `useShelters.ts`: 67 tests — fetchShelters (success/array-only shape/missing key/error), fetchShelters with filters (query string construction), fetchShelterById (success/404/error), fetchAdoptionPets (success/array-only shape/missing key/error/petId nested route), fetchAdoptionPets with filters, fetchAdoptionPetById (success/404/error), submitAdoptionRequest (success/failure/null result/loading/call shape/error extraction), error ref contract
- `ShelterCard.vue`: 21 tests — name/city/description, photo (https/http/undefined/data: URI/javascript: URI/alt text), verified badge (show/hide/aria-label), species badges (multiple/dogs/cats/rabbits/empty array), CTA (text/href/aria-label)
- `ShelterList.vue`: 25 tests — on mount, loading skeleton (6 cards/aria-busy/no empty state), empty state, shelter grid (count/no empty state/result count plural/singular), search filter (name/city/description/no-results/Limpiar button), species filter (cats/dogs/Limpiar button), combined filters, clear filters (no button when inactive/reset query/reset from no-results panel), result count (filtered count/role="status")
- `AdoptionPetCard.vue`: 35 tests — content (name/Perro/Gato/breed/aria-label on article), photo (https URL/dog fallback/cat fallback/reptile fallback/data: URI rejected), status badge (Disponible/En proceso/Adoptado/bg-success/bg-warning/bg-secondary), health chips (Vacunado/Sin vacuna/Esterilizado/Sin esterilizar), age display (0/1m/6m/12m/24m/18m/27m/undefined), CTA (available/pending shows link/adopted hides link/Ya fue adoptada/id in path/aria-label)
- `AdoptionDetail.vue`: 39 tests — pet detail (name/species/breed/description/Vacunado/Sin vacuna/Esterilizado/Sin esterilizar/not-found state), adoption form authenticated (textarea/heading/submit button/char counter/min chars hint), login CTA unauthenticated (CTA text/no textarea/login link/register link), pending section (heading/no form when authenticated), adopted section (heading/no form when authenticated), validation (error div/#adoption-message-error/mentions 20/no submit call/is-invalid class), success state (alert/call shape/null result error alert), back navigation (text/shelter_id/fallback), fetch on mount (calls fetchAdoptionPetById/passes shelterId from query), error alert (shown/hidden), accessibility (section aria-label/textarea aria-required/status badge aria-label)
- Composable mock path from components: `vi.mock('../composables/useShelters', ...)`

## Project Test Total: 1800 passing, 1 skipped (47 test files)

## Petshops Feature Coverage (completed — RF-700 to RF-709)
- `petshops.store.ts`: 44 tests — initial state (5), hasPetshops getter (4), getFeaturedPetshops getter (7: empty/featured only/excludes non-featured/all featured/none featured/reactive update/cleared), setPetshops (5), addPetshop (4: unshift/prepend/hasPetshops/no mutate), setSelectedPetshop (4), clearSelectedPetshop (3), setLoading (4), clearPetshops (5)
- `usePetshops.ts`: 60 tests — fetchPetshops (array/envelope/missing key/undefined key/isLoading/error on fail/clear error/error null on success/generic fallback), fetchPetshops with filters (search/city/category/empty omitted/combined/empty object/undefined), fetchPetshopById (no-cache API call/store-first cache hit/cache setSelectedPetshop/API fallback/API setSelected/return value/null on fail/error on fail/no setSelected on fail/isLoading true/false/no isLoading on cache/different id/clear prev error), error ref contract (null start/fail-then-success/3 error shapes)
- `PetshopCard.vue`: 26 tests — core content (name/city/article aria-label/address+city combined/city-only without address), photo (https/http/undefined fallback/data: URI/javascript: URI/alt text), verified badge (show/hide/aria-label), featured badge (show/hide/aria-label), category chips (<=3 all shown/max 3 when >3/+N overflow/no overflow at 3/hidden when empty), contact links (phone tel: href/phone null/phone unsafe injection/email mailto: href/email null/email invalid/website https/website javascript: blocked/website undefined), CTA (text/"Ver tienda"/href /stores/:id/aria-label with name)
- `PetshopList.vue`: 37 tests — lifecycle (fetchPetshops on mount/no args), loading (skeleton/aria-busy/Cargando tiendas/6 cards/no PetshopCard/no empty state), empty state (No hay tiendas/no skeleton/no PetshopCard), results grid (PetshopCards rendered/no empty state/plural tiendas/singular tienda/correct count), featured section (show when featured+no filters/Tiendas Destacadas heading/hide when no featured/hide on search/hide on category/hide on city), search filter (by name/by city/by description/Limpiar shown/hidden when inactive), category filter (by category/Limpiar clears), city filter (by city), filtered no-results (Sin resultados/Limpiar in no-results/clears filters/no PetshopCard), error alert (shown/hidden), accessibility (section aria-label/role="status"/aria-live)
- `PetshopDetail.vue`: 40 tests — lifecycle (fetchPetshopById called/once/path traversal rejected/empty string rejected/slash rejected/hyphen valid), loading (skeleton/aria-busy/Cargando tienda/no profile content), not-found (Tienda no encontrada/Volver link), profile (name/description/city/Verificado badge show/hide/all categories), contact (phone tel:/phone null/phone unsafe/email mailto:/email null/website https/website javascript: blocked/website undefined hidden), hours table (show with data/hide without/Cerrado for absent days/correct day text/Domingo row), map (show when lat+lng/coordinates toFixed(6)/hide when absent), back nav (Volver al directorio/href /stores), error alert (shown/hidden), accessibility (section aria-label)
- Composable mock path from components: `vi.mock('../composables/usePetshops', ...)`

## Blog Feature Coverage (completed — RF-600 to RF-609)
- `blog.store.ts`: 44 tests — initial state (7), hasPosts getter (4), hasCategories getter (3), getPostBySlug factory getter (6), setPosts (5), appendPosts (5), setSelectedPost (4), clearSelectedPost (3), setCategories (4), setLoading (4), setPagination (5), clearBlog (9)
- `useBlog.ts`: 60 tests — fetchPosts (16: no-filters/query params/pagination/envelope/bare array/append/isLoading/error shapes/reset/no store call on fail), fetchPostBySlug (12: cache hit/cache sets selectedPost/API call/setSelectedPost/return value/null on error/error set/isLoading/finally/reset/no setSelectedPost on fail), fetchCategories (12: GET call/envelope/bare array/missing key/non-critical failure/error set/no isLoading/reset/no setCategories on fail)
- `BlogCategoryFilter.vue`: 18 tests — Todos button (always/btn-primary when null/btn-outline-secondary when non-null/emit null), category buttons (count/names/btn-primary active/btn-outline-secondary inactive/emit slug/different slug/empty array), post_count badge (show/hide/active contrast/inactive contrast), accessibility (role=tablist/role=tab count/aria-selected Todos true/Todos false/active/inactive)
- `BlogCard.vue`: 24 tests — core content (title/excerpt/category badge/article aria-label), featured image (https/undefined/javascript:/data:/error fallback), author (avatar img/initial fallback/uppercase/error fallback), date formatting (Spanish format/datetime attr), reading time (show/hide/singular), tags (3 shown/no overflow <=3/+N overflow/>3/empty section), title NuxtLink (href /blog/:slug/text)
- `BlogList.vue`: 28 tests — on mount (fetchCategories/fetchPosts/parallel), loading skeleton (6 cards/aria-busy/no empty/no BlogCard), empty state (heading/no skeleton/no BlogCard), posts loaded (BlogCard count/plural count/singular count/no empty state), BlogCategoryFilter (show/hide), client-side search (all/title/excerpt/author/tag/sin-resultados/not shown on results), Limpiar button (show/hide/click clears), Cargar más (show/hide/hide with search/click fetchPosts), error alert (shown/hidden), accessibility (section aria-label/input aria-label)
- `BlogArticle.vue`: 28 tests — loading skeleton (shown/aria-busy/no article/no not-found), not-found state (heading/no article/no skeleton), article rendering (title/aria-label/Spanish date/category badge/reading time show/hide), hero image (https/undefined/javascript:/error fallback), author (avatar img/initial fallback/error fallback), content paragraphs (2 lines/3 lines/filter empty), tags (badges/empty section), updated-at (shown when differs/hidden when same), nav links (Volver href /blog/Ver más href /blog)

## Vue Test Utils stub naming (critical for multi-word components)
- `BlogCard: true` creates `<blog-card-stub>` (NOT `<blogcard-stub>`) — use `findAll('blog-card-stub')` OR use a custom template stub with a known CSS class (preferred): `{ template: '<div class="blog-card-stub" />' }`
- `BlogCategoryFilter: true` creates `<blog-category-filter-stub>` (NOT `<blogcategoryfilter-stub>`)
- `ShelterCard: true` creates `<shelter-card-stub>` (single-word compound — verified working in ShelterList tests)
- Always use custom template stubs with CSS classes for count-based assertions: `{ BlogCard: { template: '<div class="blog-card-stub" />' } }`. This is the pattern established in ShelterList and now confirmed for BlogList.
- NuxtLink slot content critical: ALWAYS use `{ NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] } }` when any test needs to see text that lives inside a NuxtLink element (e.g. category badges in BlogArticle, title links in BlogCard).

## Composable mock path for blog feature
- From `app/features/blog/components/`, mock `useBlog` as: `vi.mock('../composables/useBlog', ...)`
- From `app/features/blog/composables/`, mock `useApi` as: `vi.mock('../../shared/composables/useApi', ...)`

## Reactive-ref mock pattern for List/Detail components (canonical)
The correct pattern for mocking a composable that returns a reactive store in component tests is module-level reactive refs — NOT `createTestingPinia` initialState and NOT `vi.mocked(...).mockReturnValueOnce` (which requires the mock factory to be a `vi.fn()`, not a plain arrow function).
```ts
// At module level (outside describe/beforeEach)
const mockFetchItems = vi.fn()
const mockError = ref<string | null>(null)
const mockItems = ref<MyType[]>([])
const mockIsLoading = ref(false)

vi.mock('../composables/useMyFeature', () => ({
  useMyFeature: () => ({
    fetchItems: mockFetchItems,
    error: mockError,
    myStore: {
      get items() { return mockItems.value },
      get isLoading() { return mockIsLoading.value },
      get getFilteredItems() { return mockItems.value.filter(...) }, // replicate getters
    },
  }),
}))

// In beforeEach: reset ALL reactive refs to clean state
beforeEach(() => {
  mockFetchItems.mockReset()
  mockError.value = null
  mockItems.value = []
  mockIsLoading.value = false
})
```
Setting `mockItems.value = [...]` before mounting controls what the component sees. This pattern avoids Pinia symbol conflicts and vi.mocked type errors. Confirmed working in: ShelterList, PetshopList, PetshopDetail.

## Pro Feature Coverage (completed — RF-800 to RF-809)
- `pro.store.ts`: 44 tests — initial state (5), setSubscription (4: set/replace/null/fields), clearSubscription (3), setPlans (4), setLoading (4), clearPro (6: sub/plans/isLoading/hasPlans/isSubscribed/safe on initial), isSubscribed getter (6: active/canceled/past_due/inactive/null/transition), hasPlans getter (4), getMonthlyPlan getter (4), getAnnualPlan getter (5: +is_popular preservation)
- `usePro.ts`: 60 tests — fetchPlans (13: GET call/bare array/envelope/undefined key/isLoading/error on fail/clear error/error null on success/string data/err.message/generic fallback/err.data.error), fetchSubscription (10: GET call/set on success/null on 404/no error on 404/statusCode 404/500 error/isLoading/finally 404/finally 500/clear prev error/null on success), createCheckoutSession (9: POST call/navigateTo on HTTPS/returns session/HTTP rejected/invalid URL rejected/API error/isLoading/finally on fail/clear prev error/success+cancel URL in body), cancelSubscription (8: DELETE call/returns true/optimistic cancel_at_period_end/no mutation when null sub/returns false on error/sets error/isLoading/finally on fail), donate (10: POST endpoint/returns response/amount in body/omit empty message/omit absent message/include message/null+error on fail/clear prev error/no store mutation/string data error/err.message fallback)
- `ProBanner.vue`: 22 tests — PRO user (renders nothing), non-PRO authenticated (banner/PRO badge/featureName/default featureName/Ver planes button/upgrade emit/close button/close emit/aria-label/no login CTA/alert-warning class), compact (pro-banner--compact class/no close button/featureName visible), unauthenticated (login CTA/Inicia sesión heading/link to /login/link to /register/featureName/no upgrade banner/no close button)
- `PricingTable.vue`: 30 tests — lifecycle (fetchPlans on mount/skip when loaded), loading (skeleton/3 skeleton cols/aria-label/no Free column while loading), plans loaded (Plan Gratuito/Comenzar gratis /register link/monthly name/annual name/no skeleton/no empty state), features (monthly features/annual extra feature), select-plan emit (monthly planId/annual planId), Más popular badge (show for annual/only one badge/aria-label), savings badge (show with %/hide when one plan), Plan activo badge (show for PRO user with active sub/hide for non-PRO), empty state (message when no plans/Free column still present), section structure (aria-label/heading)
- `ProUpgradeModal.vue`: 26 tests — initial state (modal DOM present/no createCheckoutSession on render), plans loading (fetchPlans on open when no plans/no fetchPlans when already loaded — watcher fires on CHANGE not initial render, use setProps to trigger), plan cards (monthly name/annual name/monthly features/annual extra feature), default selection (popular plan pre-selected/first plan when no popular), plan switching (click monthly/click annual), Más popular badge, savings badge (show/hide), checkout (createCheckoutSession called with planId/Procesando... spinner text/spinner-border/error alert on null return/CTA disabled when no plan), close (btn-close emits update:modelValue=false/Cancelar emits same), loading skeleton (aria-busy/aria-label), no plans state (error message), header (PRO badge/title text)
- `DonationForm.vue`: 35 tests — unauthenticated (login CTA/heading "Inicia sesión para donar"/link /login/link /register/shelter name/no donate call), authenticated (form shown/shelter name/4 preset buttons/custom amount input/message textarea/no login CTA), preset selection (btn-success on click/deactivate previous/aria-pressed true/false), custom amount (deselects preset on focus), validation (no donate on no amount/was-validated class/amount error div/0 amount guard/over limit guard/is-invalid class/message >200 text-danger/message error div), valid submit (correct shelterId+amount via preset/message included/message omitted when blank/message omitted when whitespace), success state (thank you heading/shelter name/hide form/reset button/"Hacer otra donación"/returns to form), error state (alert-danger when null return/no success state), message counter (200 chars display/decrement), section aria-label
- Composable mock path from components: `vi.mock('../composables/usePro', ...)`

## isPro via createTestingPinia initialState
`useAuthStore.isPro` is a `computed` from `currentUser.is_pro` — it cannot be set via `createTestingPinia({ initialState: { auth: { isPro: true } } })`. To make `isPro === true` in a component test, set `currentUser` with `is_pro: true` in initialState:
```ts
createTestingPinia({
  initialState: { auth: { token: 'test-jwt', currentUser: { id: '1', is_pro: true } } }
})
```

## Bootstrap lazy-import in component tests
When a component does `const { Modal } = await import('bootstrap')` inside a watcher or async function, mock the entire module with `vi.mock('bootstrap', () => ({ Modal: vi.fn(() => mockInstance) }))`. Vitest's `vi.mock` intercepts dynamic imports too.

## Vue watcher (non-immediate) and setProps pattern
A `watch(() => props.modelValue, handler)` WITHOUT `{ immediate: true }` does NOT fire on initial mount — only on subsequent prop changes. To test a watcher-driven behavior in tests: mount with the initial value, then call `await wrapper.setProps({ prop: newValue })`, then `await flushPromises()` to drain all async microtasks (especially if the watcher calls async functions with internal `await`).

## input[type="number"] v-model coercion in happy-dom
`wrapper.find('input[type="number"]').setValue('15000')` coerces the ref value to a number in happy-dom, breaking any `.replace()` calls on the string ref. Work around this by:
1. Testing custom-input amount logic via preset buttons (which use a numeric ref directly) instead of `setValue` on the number input.
2. OR: `el.value = '15000'; await input.trigger('input')` — but this also coerces.
This is a known happy-dom limitation for `<input type="number">` bindings.

## Details
See `patterns.md` for full pattern documentation.
