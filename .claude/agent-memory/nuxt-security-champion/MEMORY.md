# Security Champion Memory — MopetooFrontend

## Auth Architecture (reviewed 2026-02-25)
- JWT stored in `localStorage` under key `mopetoo_token` — trade-off was explicitly accepted
- Auth store: `app/features/auth/stores/auth.store.ts` — canonical session state via `useAuthStore()`
- Client-only plugin: `app/plugins/auth.client.ts` — restores token from storage then calls `fetchCurrentUser`
- `useAuth()` in `app/features/auth/composables/useAuth.ts` — all auth operations go through here
- HTTP client: `app/features/shared/composables/useApi.ts` — reads token from `localStorage` (guarded by `import.meta.client`)
- Route middleware: `app/middleware/auth.ts` (protect) and `app/middleware/guest.ts` (redirect logged-in users)

## Known Findings (from auth review 2026-02-25)
- No CSP header configured yet — baseline security headers added to `nuxt.config.ts` routeRules `/**`
- `devtools: { enabled: true }` was hardcoded — fixed to `process.env.NODE_ENV !== 'production'`
- `useAuth.ts` `updateProfile` read `localStorage` directly instead of `authStore.token` — fixed
- Token key `'mopetoo_token'` is hardcoded as a string in `useApi.ts:78` — store exports `TOKEN_KEY` const but `useApi` does not import it. Low priority; unify in future pass.
- No CSRF protection — acceptable because auth uses JWT in Authorization header (not cookies)
- Password minimum length is 6 chars (client-side) — should align with backend policy; recommend 8+
- No Content-Security-Policy header — deferred until Bootstrap JS nonce strategy is decided
- `reset-password/[token]` page has no `guest` middleware — intentional (email link must work across devices)

## Known Findings (from pets review 2026-02-26)
- FIXED: `photo_url` from API was bound to `:src` without URL scheme validation — `isSafeImageUrl()` guard added to `PetAvatar.vue` and `PetForm.vue`. Rejects javascript:, data:, vbscript: schemes.
- FIXED: No file MIME type or size check in `PetForm.vue` `onPhotoChange` — JS-side validation added (5 MB limit, ALLOWED_PHOTO_TYPES set). `accept` attribute alone is not a security control.
- FIXED: `clearSession()` in `auth.store.ts` did not clear `petsStore` — added `petsStore.setPets([])` + `petsStore.clearSelectedPet()` inside the client guard. Pattern: every new feature store that holds user-specific data MUST be cleared here on logout.
- OPEN (LOW): `extractErrorMessage` in `usePets.ts` surfaces raw backend error strings to the UI — acceptable for Spanish error messages but backend must not leak stack traces or internal details in the error field.
- OPEN (INFO): `petId` from `route.params.id` is passed directly into API path strings — no frontend sanitization; backend is the authority and must enforce ownership.
- OPEN (INFO): `useApi.ts` still reads `localStorage` directly (not `authStore.token`) — creates a subtle inconsistency with the multipart path; noted previously, low priority.
- ACCEPTED: No frontend IDOR protection — ownership is enforced by backend (GET/PATCH/DELETE /api/pets/:id returns 403/404 for other users' pets). Frontend correctly redirects on null response.
- ACCEPTED: No v-html anywhere in the pets slice — all user content rendered via safe {{ }} interpolation.

## Known Findings (from shelters review 2026-02-27)
- OPEN (HIGH): `shelter.website` bound to `<a :href>` WITHOUT scheme validation in `ShelterDetail.vue:211` — javascript: URI XSS vector. `isSafeImageUrl` pattern was applied to all photo_url fields but missed the website href. Fix: add `safeWebsiteUrl` computed with URL() parser, allow only https:/http:.
- OPEN (MEDIUM): `shelter.phone` and `shelter.email` interpolated into `tel:` and `mailto:` hrefs without format validation in `ShelterDetail.vue:185,199`. Low exploitability but inconsistent with validation posture.
- OPEN (LOW): `shelterId` from `route.query` passed unvalidated into API path string in `AdoptionDetail.vue:159`. Add UUID/alphanumeric regex guard before use.
- PASS: No v-html anywhere in shelters slice.
- PASS: photo_url validated with `isSafeImageUrl()` in ShelterCard, ShelterDetail, AdoptionPetCard, AdoptionDetail.
- PASS: `rel="noopener noreferrer"` present on website `target="_blank"` link.
- PASS: `ClientOnly` wrapper correctly gates `authStore.isAuthenticated` check in AdoptionDetail form.
- PASS: `submitAdoptionRequest` uses `post()` via `useApi()` — Bearer token attached, no token logged.
- PASS: `clearSession()` in auth.store.ts calls `sheltersStore.clearShelters()` — correctly integrated.
- PASS: `backLink` computed uses `pet.value.shelter_id` (API data) with hardcoded `/shelter/` prefix — no open redirect.
- INFO: AppNavbar reads `authStore.isAuthenticated` in SSR template — pre-existing hydration mismatch, no token leak. Affects all nav items, not just the shelter link.
- INFO: `extractErrorMessage` surfaces raw backend error strings — same accepted pattern as all previous slices.

## Known Findings (from blog review 2026-02-27)
- OPEN (LOW): `route.params.slug` passed unvalidated into API path `/api/blog/posts/${slug}` in `[slug].vue` + `useBlog.ts:100`. Add `SLUG_RE = /^[\w-]{1,100}$/` guard in `[slug].vue` `onMounted` before calling `fetchPostBySlug`. Same pattern as shelters `shelterId` finding.
- OPEN (LOW/TECH DEBT): `isSafeImageUrl` is now duplicated in 11 files (BlogCard.vue, BlogArticle.vue, ShelterCard.vue, ShelterDetail.vue, AdoptionPetCard.vue, AdoptionDetail.vue, PetForm.vue, PetAvatar.vue + test files). Extract to `app/features/shared/utils/url.ts` and add `features/shared/utils` to `nuxt.config.ts` imports.dirs. Dedicated refactor PR.
- PASS: No v-html anywhere in blog slice — article body rendered via `{{ paragraph }}` safe interpolation (content.split('\n') loop).
- PASS: `featured_image` and `author.avatar` guarded by local `isSafeImageUrl()` in both BlogCard.vue and BlogArticle.vue.
- PASS: `ogImage` in `useSeoMeta` validated via `new URL()` parser, http/https only — correctly handles SSR meta injection.
- PASS: `useSeoMeta` title/description/ogTitle/ogDescription use `{{ }}` equivalents — Nuxt/unhead escapes attribute values; no reflected XSS in meta tags.
- PASS: `searchQuery` is client-side only filter — never sent to backend; no server-side injection concern.
- PASS: `blogStore` holds public data only — correctly NOT added to `clearSession()`.
- PASS: `<time :datetime>` binds ISO string to non-executable attribute — safe.
- INFO: `useApi()` sends Bearer token on public blog requests — harmless; token in header not URL. Would be a concern if CDN logs request headers; currently Nitro-level cache only.
- INFO: Blog slice is the cleanest slice reviewed to date — fewest findings, all low severity.

## Recurring Patterns to Watch
- Any new `v-html` usage requires DOMPurify — none in auth, pets, reminders, medical, shelters, or blog slice; audit every PR
- Any composable doing multipart upload must read token from `authStore.token`, NOT `localStorage` directly
- Any API field bound to `:src` OR `:href` must pass scheme validation — photo_url uses `isSafeImageUrl()`; website/external URLs need URL() parser guard allowing only https:/http:
- RECURRING MISS: `isSafeImageUrl` is consistently applied to `:src` but the same pattern was NOT applied to `:href="shelter.website"` in shelters. Watch every `<a :href>` that binds API data.
- Any new feature store holding user data must be added to `clearSession()` in `auth.store.ts`
- Route path params (`route.params.*`) AND query params (`route.query.*`) used in API path construction must be validated against a format regex before use
- `runtimeConfig.public` contains `gaId` and `cdnBase` — intentionally public; no secrets there
- The `/**` routeRules security headers baseline is in place; do not override in feature-specific rules
- `isSafeImageUrl` duplication is now at 11 files — extraction to shared utils is overdue; flag on every new slice PR until resolved

## Known Findings (from pro/monetization review 2026-02-27)
- FIXED (HIGH): `data.shelter_id` was interpolated directly into `/api/shelters/${data.shelter_id}/donations` path string in `usePro.ts:donate()` without format validation. Fixed: added `/^[\w-]{1,64}$/` guard before path construction — returns early with error message if malformed.
- OPEN (LOW): `checkout` query param from `route.query.checkout` in subscription page is compared with strict equality (`=== 'success'` / `=== 'canceled'`) — value is never rendered into the DOM; no XSS risk but worth documenting as a reviewed/safe pattern.
- PASS: `createCheckoutSession` validates `checkout_url` via `new URL()` + protocol check (`https:` only) before calling `navigateTo({ external: true })` — correctly mitigates open redirect from a compromised backend response.
- PASS: No v-html anywhere in the pro slice — all user-sourced content rendered via safe `{{ }}` interpolation.
- PASS: No raw card data handled client-side — checkout delegates entirely to Stripe-hosted page via redirect.
- PASS: Token access in `usePro.ts` uses `useAuthStore()` (via `useApi()` internally) — no direct `localStorage` reads.
- PASS: `window.location.origin` access in `createCheckoutSession` is correctly guarded with `if (!import.meta.client) return null`.
- PASS: Bootstrap Modal instantiation in `ProUpgradeModal.vue` guarded with `if (!import.meta.client) return` — no SSR `window` access.
- PASS: `proStore.clearPro()` is called in `auth.store.ts:clearSession()` — subscription state correctly cleared on logout.
- PASS: `pro.store.ts` exposes no sensitive payment data (no card numbers, no raw Stripe keys, only subscription metadata).
- PASS: `isPro` derived from `currentUser.is_pro` (server-authoritative JWT claim via user object) — not from `proStore.isSubscribed` alone. Correct trust boundary.
- PASS: `DonationForm.vue` wraps auth-sensitive UI in `<ClientOnly>` — auth state never read server-side.
- INFO: `authStore` and `proStore` are both exposed in `usePro()` return value — callers could mutate store state directly. Low risk (internal use only) but consider exposing only what callers need in a future cleanup.
- INFO: `planId` passed to `createCheckoutSession` is a store-derived plan ID from API response — not user input; no validation needed.

## Files to Always Re-check
- `app/features/shared/composables/useApi.ts` — token handling, header construction
- `app/features/auth/stores/auth.store.ts` — logout completeness (clearSession must clear ALL feature stores)
- `nuxt.config.ts` — devtools flag, routeRules headers, runtimeConfig
- `app/features/pets/components/PetAvatar.vue` — `isSafeImageUrl` guard on photo_url
- `app/features/pets/components/PetForm.vue` — `isSafeImageUrl` guard on photo_url, MIME/size validation in onPhotoChange
- `app/features/shelters/components/ShelterDetail.vue` — `safeWebsiteUrl` computed (HIGH fix needed), `tel:`/`mailto:` format validation
- `app/pages/blog/[slug].vue` — slug format validation before `fetchPostBySlug` (LOW, pending)
- `app/features/pro/composables/usePro.ts` — `shelter_id` path param guard (FIXED), `checkout_url` HTTPS guard
