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

## Recurring Patterns to Watch
- Any new `v-html` usage requires DOMPurify — none in auth or pets slice; audit every PR
- Any composable doing multipart upload must read token from `authStore.token`, NOT `localStorage` directly
- Any API field bound to `:src` or `:href` must pass `isSafeImageUrl()` / scheme validation first
- Any new feature store holding user data must be added to `clearSession()` in `auth.store.ts`
- `runtimeConfig.public` contains `gaId` and `cdnBase` — intentionally public; no secrets there
- The `/**` routeRules security headers baseline is in place; do not override in feature-specific rules

## Files to Always Re-check
- `app/features/shared/composables/useApi.ts` — token handling, header construction
- `app/features/auth/stores/auth.store.ts` — logout completeness (clearSession must clear ALL feature stores)
- `nuxt.config.ts` — devtools flag, routeRules headers, runtimeConfig
- `app/features/pets/components/PetAvatar.vue` — `isSafeImageUrl` guard on photo_url
- `app/features/pets/components/PetForm.vue` — `isSafeImageUrl` guard on photo_url, MIME/size validation in onPhotoChange
