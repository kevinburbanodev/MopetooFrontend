# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Development server at http://localhost:3000
npm run build        # Production build (Node server)
npm run generate     # Static site generation
npm run preview      # Preview production build locally
```

```bash
npm test                 # Run all tests in watch mode (Vitest)
npm run test:coverage    # Single run with coverage report
```

**Test stack:** Vitest + `@nuxt/test-utils` + `@pinia/testing`
**Config:** `vitest.config.ts` at project root (environment: `nuxt`, `globals: true`, `env.NUXT_PUBLIC_API_BASE` set to avoid `useRuntimeConfig` mock pitfalls)
**Colocation rule:** test files live next to the source file inside the feature slice.
**Status:**
- Auth feature slice (RF-001–RF-009): 85 tests (store 41, composable 36, auth middleware 4, guest middleware 4)
- Pets feature slice (RF-100–RF-109): 244 tests (store 44, usePets 63, usePetAge 17, PetAvatar 21, PetCard 22, PetList 16, PetForm 32, PetDetail 29)
- Reminders feature slice (RF-200–RF-209): 256 tests (store 44, useReminders 75, ReminderCard 26, ReminderList 29, ReminderForm 46) ✅
- Medical feature slice (RF-300–RF-309): 273 tests (store 44, useMedical 65, MedicalRecordCard 38, MedicalHistory 31, MedicalRecordForm 86) ✅
- Export/PDF slice (RF-400–RF-409): 24 tests (useExportPDF 24) ✅ — exportProfilePDF tests in usePets, exportRemindersPDF tests in useReminders
- Shelters slice (RF-500–RF-509): 157 tests (store 35, useShelters 35, ShelterList 22, AdoptionPetCard 25, AdoptionDetail 40) ✅
- Blog slice (RF-600–RF-609): 208 tests (store 44, useBlog 60, BlogCategoryFilter 18, BlogCard 24, BlogList 28, BlogArticle 34) ✅
- Petshops slice (RF-700–RF-709): 187 tests (store 44, usePetshops 60, PetshopCard 26, PetshopList 37, PetshopDetail 40) ✅
- Pro/Monetización slice (RF-800–RF-809): 216 tests (store 44, usePro 60, ProBanner 22, PricingTable 30, ProUpgradeModal 26, DonationForm 34) ✅
- Clinics slice (RF-900–RF-909): 178 tests (store 42, useClinics 37, ClinicCard 34, ClinicList 29, ClinicDetail 35) ✅
- Admin slice (RF-1000–RF-1009): 327 tests (store 75, useAdmin 76, AdminDashboard 27, AdminUserManager 31, AdminShelterManager 27, AdminStoreManager 27, AdminClinicManager 29, AdminTransactionLog 28, admin middleware 7) ✅
- Stats slice (RF-1100–RF-1109): 165 tests (store 37, useStats 45, StatsOverview 27, StatsChart 22, RevenueReport 20, ActivityLog 34) ✅
- Maintenance slice (RF-1200–RF-1209): 163 tests (store 32, useMaintenance 37, MaintenancePage 18, MaintenanceToggle 52, maintenance middleware 24) ✅

## Architecture

**Nuxt 4** app with `app/` as the source root (`srcDir`). All application code lives under `app/`.

### Feature-Based Vertical Slice

Each domain feature is self-contained under `app/features/<feature>/`:

```
app/features/
├── shared/          # Cross-feature kernel (useApi, useExportPDF, AppNavbar, api.types)
├── home/            # Landing page slice
├── auth/            # Login, register, password reset
├── pets/            # Pet profile CRUD
├── reminders/       # Reminder CRUD
├── medical/         # Medical record CRUD
├── shelters/        # Adoption listings directory & detail (public + auth)
├── blog/            # Blog editorial (public: listing + article detail)
├── petshops/        # Pet-friendly stores directory (public: listing + detail)
├── pro/             # Monetización: PRO subscriptions, pricing table, donations (RF-800–RF-809)
├── clinics/         # Veterinary clinics directory (public: listing + detail) (RF-900–RF-909)
├── admin/           # Admin panel: stats, user/shelter/store/clinic management, transactions (RF-1000–RF-1009)
├── stats/           # Statistics & metrics: KPI overview, revenue chart/table, activity log (RF-1100–RF-1109)
└── maintenance/     # Maintenance mode: toggle (admin), page, x-maintenance header detection (RF-1200–RF-1209)
```

Every slice follows the same internal structure:

| Folder | Purpose |
|---|---|
| `components/` | Vue components scoped to this feature |
| `composables/` | Business logic (`useX.ts`) |
| `stores/` | Pinia stores (`x.store.ts`) |
| `types/` | TypeScript domain types (`index.ts`) |

**`app/pages/` are thin wrappers only** — they set `<head>` metadata and render the feature component. All logic lives in the feature slice.

### Auto-imports (nuxt.config.ts)

Nuxt is configured to auto-import:
- **Components**: all `.vue` files under `app/features/**` (registered without path prefix — `LoginForm` not `AuthLoginForm`)
- **Composables**: `features/*/composables` and `features/shared/composables`
- **Stores**: `features/*/stores`

This means `useApi()`, `useAuth()`, `useAuthStore()`, etc. are available in any `.vue` file or composable without importing.

### State Management (Pinia)

| Store | State |
|---|---|
| `useAuthStore` | `currentUser`, `token`, `isAuthenticated`, `isPro` |
| `usePetsStore` | `pets[]`, `selectedPet`, `isLoading` |
| `useRemindersStore` | `reminders[]`, `selectedReminder`, `isLoading` |
| `useMedicalStore` | `records[]`, `selectedRecord`, `isLoading` |
| `useSheltersStore` | `adoptionListings[]`, `selectedListing`, `isLoading`, `hasAdoptionListings`, `getAvailableListings` |
| `useBlogStore` | `posts[]`, `selectedPost`, `categories[]`, `isLoading`, `currentPage`, `totalPages`, `total` |
| `usePetshopsStore` | `petshops[]`, `selectedPetshop`, `isLoading` |
| `useProStore` | `subscription`, `plans[]`, `isLoading`, `isSubscribed`, `getMonthlyPlan`, `getAnnualPlan` |
| `useClinicsStore` | `clinics[]`, `selectedClinic`, `isLoading`, `hasClinics`, `getFeaturedClinics` |
| `useAdminStore` | `stats`, `users[]`, `shelters[]`, `petshops[]`, `clinics[]`, `transactions[]`, `selectedUser`, `isLoading`, total-count refs, `hasStats`, `hasUsers` |
| `useStatsStore` | `overview`, `revenueData[]`, `activityEntries[]`, `totalActivity`, `isLoading`, `hasOverview`, `hasRevenueData`, `hasActivity` |
| `useMaintenanceStore` | `status` (MaintenanceStatus \| null), `isLoading`, `isEnabled` (computed), `hasStatus` (computed) |

Token is persisted to `localStorage` under key `mopetoo_token`. The auth store exposes `setSession()`, `clearSession()`, and `restoreFromStorage()`.

**Cross-store cleanup rule:** `clearSession()` in `auth.store.ts` MUST clear every user-specific store. Currently clears `petsStore`, `remindersStore`, `medicalStore`, `sheltersStore`, `proStore`, `adminStore`, and `statsStore`. When adding new feature slices with user-specific data, add their store reset calls to `clearSession()` to prevent data leakage on shared devices.

**Exception — `useMaintenanceStore` is NOT in `clearSession()`:** Maintenance status is a global platform flag (not user-specific). It persists across sessions intentionally so the app can redirect to `/maintenance` without an extra API call after logout/login.

### HTTP Client

`useApi()` (from `features/shared/composables/useApi.ts`) is the single HTTP wrapper. It reads the JWT from `localStorage` and prepends `runtimeConfig.public.apiBase` to every request. For multipart uploads (pet photos), `usePets.ts` calls `$fetch` directly with `FormData`.

**Backend API** (Go + Gin):
- Public endpoints: `POST /users`, `POST /login`, `POST /forgot-password`, `POST /reset-password`
- Protected endpoints: all under `/api/*` — require `Authorization: Bearer <token>`
- Pet create/update uses `multipart/form-data` (photo field)

To configure the backend URL, add to `nuxt.config.ts`:
```ts
runtimeConfig: {
  public: { apiBase: 'https://your-api-url' }
}
```

### Styling (Bootstrap 5 + SCSS)

Entry point: `app/assets/scss/main.scss`

- Brand variable overrides live in `app/assets/scss/_variables.scss` — edit this to change colors, typography, spacing.
- `main.scss` uses `@import` (not `@use`) — Bootstrap 5 uses the legacy Sass `@import` API. **Never mix `@use` and `@import` in the same SCSS file.**
- `silenceDeprecations` in `nuxt.config.ts` suppresses Bootstrap 5's internal Sass deprecation warnings (expected until Bootstrap 6).
- Bootstrap JS is loaded client-side via `app/plugins/bootstrap.client.ts`.

### Adding a new feature

1. Create `app/features/<name>/{components,composables,stores,types}/`
2. Add domain types to `types/index.ts`
3. Create a Pinia store in `stores/<name>.store.ts` using `defineStore`
4. Add business logic in `composables/use<Name>.ts`, calling `useApi()` and mutating the store
5. Build components in `components/`
6. Create a thin page in `app/pages/` that renders the feature component
7. Add the route link to `AppNavbar.vue`

No manual registration needed — auto-imports handle components, composables, and stores.

---

## Agent & Skill Routing

This workspace has four sub-agents (`.claude/agents/`) and four skills (`.agents/skills/`). Use the rules below to delegate the right work to the right specialist.

### Sub-agents

Sub-agents are invoked automatically via the Task tool. Each has persistent memory across sessions stored in `.claude/agent-memory/<agent-name>/`.

#### `nuxt-vue-architect` — Default frontend specialist

**Invoke for any of:**
- Implementing a new feature slice end-to-end (component + composable + store + types + page)
- Reviewing recently written Vue/Nuxt/TypeScript/SCSS code for quality, architecture, or correctness
- Deciding where code belongs: composable vs. store vs. plugin vs. Nuxt server route
- SSR hydration mismatch errors or `window`/`document` usage without `import.meta.client` guards
- Pinia store design, store coupling across slices, or store vs. composable trade-offs
- Core Web Vitals issues (LCP, CLS, INP), `<NuxtImg>` optimization, bundle analysis
- Accessibility: keyboard navigation, ARIA, color contrast, focus management
- SCSS architecture: Bootstrap variable overrides, `<style scoped>`, `:deep()`, design token questions
- Route middleware, Nuxt plugins, `useHead`, `useSeoMeta` for a single locale

**Do not use for:** security audits, i18n, test writing, or pure TypeScript type system design.

---

#### `nuxt-security-champion` — Security reviewer

**Invoke proactively (without being explicitly asked) after writing:**
- Any auth flow: login, register, logout, token refresh, password reset
- Any composable or component that handles user input, tokens, cookies, or environment variables
- Any `v-html` usage — must verify DOMPurify sanitization before delivery
- Third-party script integrations (analytics, chat, payment widgets)

**Invoke explicitly when asked to:**
- Audit security of a feature, PR, or the entire frontend
- Configure CSP headers, `routeRules`, or Nitro security middleware
- Evaluate JWT storage strategy (`localStorage` vs. `HttpOnly` cookie trade-offs for this project)
- Review `runtimeConfig` to check for secret leakage into the client bundle
- Add or evaluate `npm audit` findings

**Known project-specific concerns:**
- JWT is currently stored in `localStorage` (`mopetoo_token`) — accepted trade-off; XSS vectors minimized via no `v-html` usage. Consider `HttpOnly` cookie migration in future.
- CSP not yet implemented — planned sprint work. Currently protected by `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` headers.
- Devtools disabled in production.
Any change to token storage or auth flow warrants a security review.

---

#### `nuxt-i18n-engineer` — Internationalization specialist

**Invoke when:**
- Adding `@nuxtjs/i18n` to the project (not yet configured — hardcoded Spanish strings exist throughout)
- Reviewing any component or page for hardcoded user-visible strings before multi-locale launch
- Implementing locale-aware routing (`/es/`, `/en/` prefixes), `localePath()`, or `switchLocalePath()`
- Setting up `hreflang`, canonical URLs, or translated `useSeoMeta()` per locale
- Fixing hydration mismatches caused by locale-dependent date, number, or currency formatting
- Organizing translation files per feature slice (`features/auth/locales/es.json`, etc.)
- Auditing SCSS/Bootstrap for RTL-unsafe directional properties (`margin-left`, `text-align: left`)

**Current project state:** No i18n configured yet. UI is hardcoded in Spanish. Invoke this agent when multi-locale support is planned.

---

#### `nuxt-test-engineer` — Testing specialist

**Invoke when:**
- Writing a test suite for any new component, composable, Pinia store, or route middleware
- Reviewing an existing test file for coverage gaps, false confidence, or implementation testing
- Asking how to mock Nuxt auto-imports (`useRoute`, `useAsyncData`, `useCookie`, `useI18n`) in tests
- Setting up `vitest.config.ts` with `@nuxt/test-utils` for the first time
- Asking about `mountSuspended`, `mockNuxtImport`, `createTestingPinia`, or `registerEndpoint` patterns

**Test colocation rule:** Test files must live next to the code they test inside the feature slice (e.g., `features/auth/composables/useAuth.test.ts`). Never in a top-level `/tests` folder.

**Current project state:** Vitest is configured with `happy-dom`. Fully tested slices:
- **Auth (RF-001–RF-009):** `auth.store.test.ts` (41), `useAuth.test.ts` (36), `auth.test.ts` (4), `guest.test.ts` (4)
- **Pets (RF-100–RF-109):** `pets.store.test.ts` (44), `usePets.test.ts` (51), `usePetAge.test.ts` (17), `PetAvatar.test.ts` (21), `PetCard.test.ts` (22), `PetList.test.ts` (16), `PetForm.test.ts` (32), `PetDetail.test.ts` (29)

**Mocking notes for pro slice:**
- `usePro` composable: mock via `vi.mock('../composables/usePro', () => ({ usePro: () => ({ ... }) }))` with reactive refs for `error`, `proStore.*`
- Bootstrap `Modal` JS: stub with `vi.mock('bootstrap', () => ({ Modal: { getOrCreateInstance: vi.fn(() => ({ show: vi.fn(), hide: vi.fn() })) } }))` in `ProUpgradeModal` tests
- `createCheckoutSession` tests: mock `import.meta.client` as `true` (default in happy-dom); stub `navigateTo` via `mockNuxtImport('navigateTo', ...)`
- `DonationForm` auth gate: form is wrapped in `<ClientOnly>` — mount first with `isAuthenticated: true` in `createTestingPinia`, then `await nextTick()` to see form render
- Security fix: `donate()` in `usePro.ts` validates `shelter_id` against `/^[\w-]{1,64}$/` before API call — test invalid IDs return null with error

**Mocking notes for pets and reminders slices:**
- `useApi` is a project composable — mock via `vi.mock('../../shared/composables/useApi', ...)`, NOT `mockNuxtImport`
- `useExportPDF` is a project composable — mock via `vi.mock('../../shared/composables/useExportPDF', ...)`, NOT `mockNuxtImport`
- `useRuntimeConfig` is fed via `vitest.config.ts` `env.NUXT_PUBLIC_API_BASE` (not mocked) to avoid Vue Router init errors
- `URL.createObjectURL` / `URL.revokeObjectURL` must be spied on via `vi.spyOn(URL, 'createObjectURL')` — do NOT replace the entire `URL` global or Nuxt internals break
- `NuxtLink` should be stubbed via `global.stubs: { NuxtLink: true }` in component tests
- Resetting select filters to null: use clearFilters button click, not `setValue(null)` (happy-dom limitation)
- `Pet.id` is `string`; `Reminder.pet_id` is `number` — compare with `String(pet_id) === pet.id`
- `AdoptionDetail` adoption form is wrapped in `<ClientOnly>` — in tests, set `isAuthenticated: true` via `createTestingPinia` and verify the form renders after client hydration
- `AdoptionPetCard` link format is `/shelter/adoptions/${listing.id}` (no shelterId query param)
- **Auth store reset across tests (critical):** `setActivePinia(createPinia())` in `beforeEach` does NOT reset the Nuxt test env's auth store. Explicitly reset with: `const { useAuthStore } = await import('../../auth/stores/auth.store'); useAuthStore().token = null`
- **Mount-first, then set token:** Setting `useAuthStore().token` BEFORE `mountSuspended` does NOT work. Mount first, then set token, then `await nextTick()` to trigger re-render of auth-conditional DOM
- **Form submit in happy-dom:** `wrapper.find('button[type="submit"]').trigger('click')` does NOT propagate to `@submit.prevent`. Use `await wrapper.find('form').trigger('submit')` instead
- **NuxtLink href assertions:** `{ NuxtLink: false }` or `{ NuxtLink: true }` stubs do not produce plain `<a href>`. Use a custom stub: `{ NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] } }`

**Mocking notes for admin slice:**
- `useAdmin` composable: mock at module level with reactive refs (`mockStats`, `mockUsers`, `mockShelters`, `mockPetshops`, `mockClinics`, `mockTransactions`, `mockIsLoading`, `mockError`) — canonical pattern from clinics/petshops slices
- `admin.ts` middleware test: same `vi.hoisted()` + `mockNuxtImport('navigateTo', ...)` + `vi.resetModules()` pattern as `auth.test.ts`
- 2-step delete confirmation: `confirmingDeleteId` ref — first button click sets id, second click calls `deleteUser/deleteShelter/deletePetshop/deleteAdminClinic`. Test both steps independently.
- Toggle PRO/Admin: click "Dar PRO" → `updateUser(id, { is_pro: true })`; click "Quitar PRO" → `updateUser(id, { is_pro: false })`. Same for Admin/Verificado/Destacado toggles.
- Self-protection guard: "Quitar Admin" and "Eliminar" buttons are disabled when `user.id === authStore.currentUser.id`. Set `currentUser: { id: 1, is_admin: true }` in `createTestingPinia` and use `user.id = 1` to verify `disabled` attribute.
- KPI card skeleton: 8 skeleton cards with `aria-busy="true"` visible when `isLoading=true` and no stats loaded yet.
- Transaction type badges: `subscription` → `.bg-primary`; `donation` → `.bg-success`. Status badges: `completed` → `.bg-success`; `pending` → `.bg-warning`; `failed` → `.bg-danger`; `refunded` → `.bg-secondary`.
- Transaction log is read-only: assert no Eliminar, Verificar, or Destacar buttons rendered.

**Mocking notes for maintenance slice:**
- `useMaintenance` composable: mock at module level with reactive refs (`mockFetchStatus`, `mockToggleMaintenance`, `mockError = ref(null)`, `mockMaintenanceStore = reactive({...})`) — same canonical pattern as stats/clinics slices
- `maintenance.ts` middleware: same `vi.hoisted()` + `mockNuxtImport('navigateTo', ...)` + `vi.resetModules()` pattern as `admin.test.ts`
- **Critical**: `maintenanceStore.isEnabled` is a computed from `status.is_enabled`. In `createTestingPinia`, set `maintenance: { status: { is_enabled: true } }` (NOT `maintenance: { isEnabled: true }`) to control the state
- Middleware also reads `useAuthStore` — both stores must be set in `initialState` when testing the middleware: `{ auth: { token, currentUser }, maintenance: { status } }`
- `fetchStatus()` fails **silently** (no `error.value` set) — test that `error.value` stays `null` after API rejection
- `toggleMaintenance()` **surfaces** errors — test all three error shapes: `{ data: { error: 'msg' } }`, `{ message: 'msg' }`, and fallback generic message
- `MaintenancePage` is a pure presentational component — no composable mock needed; use `mountSuspended` with NuxtLink stub
- `MaintenanceToggle` calls `fetchStatus()` on mount — ensure `mockFetchStatus` is a `vi.fn()` that resolves immediately to prevent accidental store mutations

Invoke this agent for any new feature slice tests.

---

### Skills

Skills are invoked via the `/skill-name` slash command or the Skill tool. They inject specialized domain knowledge into the current context.

#### `/frontend-design` — Creative UI design

**Use when the primary goal is visual quality and aesthetic distinctiveness:**
- Building a landing page, hero section, marketing page, or public-facing UI where memorability matters
- Designing a UI component where Bootstrap defaults feel generic and a distinctive look is needed
- Creating posters, dashboards, or visual artifacts where aesthetic direction drives the output
- "Make this look professional / striking / distinctive" requests

**Do not use for:** routine feature implementation, architecture decisions, or debugging. This skill is about design intent and visual craft, not Nuxt/Vue correctness.

**Note:** This skill generates HTML/CSS/JS or Vue code with intentional, bold aesthetic choices — it deliberately avoids generic AI aesthetics (no Inter font, no purple gradients, no cookie-cutter layouts).

---

#### `/typescript-pro` — Advanced TypeScript type systems

**Use when the request involves TypeScript complexity beyond standard typed components:**
- Designing complex generics or conditional types for a shared utility or API layer
- Implementing type guards, discriminated unions, or assertion functions for domain state machines
- Creating branded types (e.g., `PetId`, `UserId`) to prevent ID mix-ups at the type level
- Configuring `tsconfig.json` with project references, incremental compilation, or path aliases
- Runtime type validation with Zod at API boundaries
- Questions about `satisfies`, `infer`, mapped types, or template literal types

**Do not use for:** routine `interface`/`type` definitions for components or stores — those are handled by `nuxt-vue-architect`.

---

#### `/nuxt-ui` — @nuxt/ui v4 component library

**Use only if `@nuxt/ui` is added to the project.**

Currently, this project uses **Bootstrap 5 for all UI**. This skill is not applicable unless the team decides to migrate or add `@nuxt/ui`.

**If adopted, invoke for:**
- Installing and configuring `@nuxt/ui` alongside or replacing Bootstrap
- Building forms with `UForm` + Standard Schema (Zod) validation
- Composing dashboard, docs, chat, or editor layouts with Nuxt UI layout components
- Customizing the `@nuxt/ui` theme (semantic color tokens, `app.config.ts` overrides)
- Using `useToast`, `useOverlay`, or `defineShortcuts` composables

---

#### `/skill-creator` — Create or update Claude skills

**Use only when the task is to build or improve a skill itself** (not to use an existing skill):
- Designing a new `.skill` file for a domain or workflow not currently covered
- Iterating on an existing skill after discovering gaps during real usage
- Packaging a skill for distribution (runs `package_skill.py`)

---

### Quick routing reference

| User request pattern | Route to |
|---|---|
| Build / implement a new feature | `nuxt-vue-architect` |
| Review this component / composable / store | `nuxt-vue-architect` |
| Hydration mismatch, SSR bug | `nuxt-vue-architect` |
| Auth flow, token handling, JWT storage | `nuxt-vue-architect` + `nuxt-security-champion` (proactive) |
| `v-html` anywhere in new code | `nuxt-security-champion` (proactive) |
| Env variable / runtimeConfig question | `nuxt-security-champion` |
| Security audit / CSP / headers | `nuxt-security-champion` |
| Add multi-language support | `nuxt-i18n-engineer` |
| Hardcoded strings review before i18n launch | `nuxt-i18n-engineer` |
| Write tests for new code | `nuxt-test-engineer` |
| Review test file quality | `nuxt-test-engineer` |
| Vitest / @nuxt/test-utils setup | `nuxt-test-engineer` |
| Landing page, hero, visual design | `/frontend-design` skill |
| Complex generics / type guards / branded types | `/typescript-pro` skill |
| @nuxt/ui components / theming | `/nuxt-ui` skill (only if adopted) |
| Build or improve a Claude skill | `/skill-creator` skill |
