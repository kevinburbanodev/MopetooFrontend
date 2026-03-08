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
**Status (v2 — reduced scope: Landing + Blog + Pet Public Profile + Admin):**
- Auth feature slice: tests updated — removed register/forgot/reset tests, login redirects to `/admin`, logout to `/`, auth middleware rewritten for `/admin/**` only, guest middleware updated
- Blog slice (RF-600–RF-609): 147 tests ✅ — blog article page now uses `useAsyncData` for SSR (was client-side `onMounted`)
- Pet-profile slice: new — public pet profile for QR scanning (SSR), `usePetProfile` composable, `PetProfileCard` component
- Admin slice (RF-1000–RF-1009): expanded — `AdminVerificationManager`, `AdminEventStats`, verification requests page
- Stats slice (RF-1100–RF-1109): 117 tests ✅
- Maintenance slice (RF-1200–RF-1209): 187 tests ✅
- Home slice: landing page updated — `/register` links changed to `#download`, new `DownloadSection` component with app store badges

**Removed slices (moved to Flutter mobile app):** pets, reminders, medical, export/PDF, shelters, petshops, pro, clinics — test suites for these no longer exist.

## Architecture

**Nuxt 4** app with `app/` as the source root (`srcDir`). All application code lives under `app/`.

**Scope (v2):** The web frontend handles Landing + Blog SEO + Pet Public Profile (QR/SSR) + Admin Panel only. The Flutter mobile app handles the full user experience (pet CRUD, reminders, medical records, subscriptions, clinic/store/shelter navigation).

### Feature-Based Vertical Slice

Each domain feature is self-contained under `app/features/<feature>/`:

```
app/features/
├── shared/          # Cross-feature kernel (useApi, AppNavbar, api.types)
├── home/            # Landing page (public, DownloadSection with app store badges)
├── auth/            # Admin-only login + email verification
├── pet-profile/     # Public pet profile for QR scanning (SSR, usePetProfile, PetProfileCard)
├── blog/            # Blog editorial (public: listing + article detail, SSR/SEO)
├── admin/           # Admin panel: stats, user/shelter/store/clinic management, transactions, verification (RF-1000–RF-1009)
├── stats/           # Statistics & metrics: KPI overview (nested), revenue chart/table (RF-1100–RF-1109)
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

**Pages (v2):**
- `/` — Landing page (public, no middleware)
- `/login` — Admin-only login
- `/blog/**` — Blog listing + article detail (SSR/SEO)
- `/pet/[slug]` — Pet public profile (SSR for QR scanning)
- `/admin` — Admin dashboard
- `/admin/users` — User management
- `/admin/shelters` — Shelter management
- `/admin/stores` — Store management
- `/admin/clinics` — Clinic management
- `/admin/stats` — Statistics & metrics
- `/admin/verifications` — Verification requests
- `/admin/donations` — Donation log (Wompi)
- `/admin/events` — Shelter event monitor
- `/maintenance` — Maintenance page

**Removed pages:** `/dashboard/**`, `/pricing`, `/clinics/**`, `/stores/**`, `/shelters/**`, `/shelter/**`, `/register`, `/forgot-password`, `/reset-password/**`

### Auto-imports (nuxt.config.ts)

Nuxt is configured to auto-import:
- **Components**: all `.vue` files under `app/features/**` (registered without path prefix — `LoginForm` not `AuthLoginForm`)
- **Composables**: `features/*/composables` and `features/shared/composables`
- **Stores**: `features/*/stores`

This means `useApi()`, `useAuth()`, `useAuthStore()`, etc. are available in any `.vue` file or composable without importing.

### State Management (Pinia)

| Store | State |
|---|---|
| `useAuthStore` | `currentUser`, `token`, `isAuthenticated` |
| `useBlogStore` | `posts[]`, `selectedPost`, `isLoading`, `hasPosts`, `getPostBySlug` |
| `useAdminStore` | `users[]`, `selectedUser`, `shelters[]`, `petshops[]`, `clinics[]`, `transactions[]`, `donations[]`, `isLoading`, total-count refs, `hasUsers` |
| `useStatsStore` | `overview`, `revenueData[]`, `revenueStats`, `isLoading`, `hasOverview`, `hasRevenueData`, `hasRevenueStats` |
| `useMaintenanceStore` | `status` (MaintenanceStatus \| null), `isLoading`, `isEnabled` (computed from `status.is_active`), `hasStatus` (computed) |

**Removed stores (v2):** `petsStore`, `remindersStore`, `medicalStore`, `sheltersStore`, `proStore`, `petshopsStore`, `clinicsStore` — moved to Flutter.

Token is persisted to `localStorage` under key `mopetoo_token`. The auth store exposes `setSession()`, `clearSession()`, and `restoreFromStorage()`.

**Cross-store cleanup rule:** `clearSession()` in `auth.store.ts` MUST clear every user-specific store. Currently clears `adminStore` and `statsStore`. When adding new feature slices with user-specific data, add their store reset calls to `clearSession()` to prevent data leakage on shared devices.

**Exception — `useMaintenanceStore` is NOT in `clearSession()`:** Maintenance status is a global platform flag (not user-specific). It persists across sessions intentionally so the app can redirect to `/maintenance` without an extra API call after logout/login.

### Auth Changes (v2)

- Login redirects to `/admin` (not `/dashboard`)
- Logout redirects to `/` (not `/login`)
- Guest middleware redirects authenticated users to `/admin` (not `/dashboard`)
- Auth middleware protects only `/admin/**` routes, redirects unauthenticated users to `/`
- Removed: `register()`, `registerShelter()`, `registerStore()`, `registerClinic()`, `forgotPassword()`, `resetPassword()`
- Auth slice now only handles: login (admin) + email verification

### HTTP Client

`useApi()` (from `features/shared/composables/useApi.ts`) is the single HTTP wrapper. It reads the JWT from `localStorage` and prepends `runtimeConfig.public.apiBase` to every request.

**Backend API** (Go + Gin):
- Public endpoints: `POST /login`, `POST /verify-email`, `POST /resend-verification`, `GET /blog/posts`, `GET /blog/posts/:slug`, `GET /pets/:slug/public`
- Protected endpoints: all under `/api/*` — require `Authorization: Bearer <token>`

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

### Route Rules (v2)

- `/pet/**` — 15 min ISR cache for QR scan performance
- Removed stale rules: `/shelter/**`, `/stores/**`, `/clinics/**`

### Adding a new feature

**Scope reminder (v2):** This web frontend is limited to Landing, Blog SEO, Pet Public Profile (QR/SSR), and Admin Panel. User-facing features (pet CRUD, reminders, medical records, subscriptions, clinic/store/shelter navigation) belong in the Flutter mobile app.

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
- Any auth flow: login, register, logout, token refresh, password reset, email verification
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

**Current project state:** Vitest is configured with `happy-dom`. Test suites for removed slices (pets, reminders, medical, shelters, petshops, pro, clinics) no longer exist. Remaining tested slices:
- **Auth:** tests updated — removed register/forgot/reset tests, updated redirect paths (`/admin` not `/dashboard`), auth middleware rewritten, guest middleware updated
- **Blog:** tests intact
- **Admin:** tests expanded (added `AdminVerificationManager`, `AdminEventStats`)
- **Stats / Maintenance:** tests intact

**General mocking notes:**
- `useApi` is a project composable — mock via `vi.mock('../../shared/composables/useApi', ...)`, NOT `mockNuxtImport`
- `useRuntimeConfig` is fed via `vitest.config.ts` `env.NUXT_PUBLIC_API_BASE` (not mocked) to avoid Vue Router init errors
- `NuxtLink` should be stubbed via `global.stubs: { NuxtLink: true }` in component tests
- **Auth store reset across tests (critical):** `setActivePinia(createPinia())` in `beforeEach` does NOT reset the Nuxt test env's auth store. Explicitly reset with: `const { useAuthStore } = await import('../../auth/stores/auth.store'); useAuthStore().token = null`
- **Mount-first, then set token:** Setting `useAuthStore().token` BEFORE `mountSuspended` does NOT work. Mount first, then set token, then `await nextTick()` to trigger re-render of auth-conditional DOM
- **Form submit in happy-dom:** `wrapper.find('button[type="submit"]').trigger('click')` does NOT propagate to `@submit.prevent`. Use `await wrapper.find('form').trigger('submit')` instead
- **NuxtLink href assertions:** Use a custom stub: `{ NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] } }`

**Mocking notes for admin slice:**
- `useAdmin` composable: mock at module level with `reactive()` for store state and `ref()` for error
- `admin.ts` middleware test: same `vi.hoisted()` + `mockNuxtImport('navigateTo', ...)` + `vi.resetModules()` pattern as `auth.test.ts`
- **AdminDashboard uses `useStats`**: mock `../../stats/composables/useStats` (not `useAdmin`) for KPIs. Stub `MaintenanceToggle` component.
- **No DELETE/PUT endpoints in backend**: All mutations use specific PATCH endpoints (grant-pro, revoke-pro, grant-admin, revoke-admin, activate, deactivate, verify, plan).
- All entity IDs are `number` (not string). All pagination uses `limit` (not `per_page`).

**Mocking notes for maintenance slice:**
- `useMaintenance` composable: mock at module level with reactive refs — same canonical pattern as stats slices
- `maintenance.ts` middleware: same `vi.hoisted()` + `mockNuxtImport('navigateTo', ...)` + `vi.resetModules()` pattern as `admin.test.ts`
- **Critical**: `maintenanceStore.isEnabled` is a computed from `status.is_active` (NOT `is_enabled`). In `createTestingPinia`, set `maintenance: { status: { is_active: true } }` to control the state
- Middleware also reads `useAuthStore` — both stores must be set in `initialState` when testing the middleware: `{ auth: { token, currentUser }, maintenance: { status } }`

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
