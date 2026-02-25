# Security Champion Memory — MopetooFrontend

## Auth Architecture (reviewed 2026-02-25)
- JWT stored in `localStorage` under key `mopetoo_token` — trade-off was explicitly accepted
- Auth store: `app/features/auth/stores/auth.store.ts` — canonical session state via `useAuthStore()`
- Client-only plugin: `app/plugins/auth.client.ts` — restores token from storage then calls `fetchCurrentUser`
- `useAuth()` in `app/features/auth/composables/useAuth.ts` — all auth operations go through here
- HTTP client: `app/features/shared/composables/useApi.ts` — reads token from `localStorage` (guarded by `import.meta.client`)
- Route middleware: `app/middleware/auth.ts` (protect) and `app/middleware/guest.ts` (redirect logged-in users)

## Known Findings (from first review)
- No CSP header configured yet — baseline security headers added to `nuxt.config.ts` routeRules `/**`
- `devtools: { enabled: true }` was hardcoded — fixed to `process.env.NODE_ENV !== 'production'`
- `useAuth.ts` `updateProfile` read `localStorage` directly instead of `authStore.token` — fixed
- Token key `'mopetoo_token'` is hardcoded as a string in `useApi.ts:78` — store exports `TOKEN_KEY` const but `useApi` does not import it. Low priority but worth unifying in a future pass.
- No CSRF protection — acceptable because auth uses JWT in Authorization header (not cookies)
- Password minimum length is 6 chars (client-side) — should align with backend policy; recommend 8+
- File MIME type validated client-side via `accept` attribute only — no JS validation before upload
- No Content-Security-Policy header — deferred until Bootstrap JS nonce strategy is decided
- `reset-password/[token]` page has no `guest` middleware — intentional (email link must work across devices)
- `isAuthenticated` is computed from store token ref — correctly reactive across navigations

## Recurring Patterns to Watch
- Any new `v-html` usage requires DOMPurify — none present in auth slice, but audit every PR
- Any new composable doing multipart upload must read token from `authStore.token`, NOT `localStorage` directly
- `runtimeConfig.public` contains `gaId` and `cdnBase` — these are intentionally public; no secrets there
- The `/**` routeRules security headers baseline is now in place; be careful not to override it in feature-specific rules

## Files to Always Re-check
- `app/features/shared/composables/useApi.ts` — token handling, header construction
- `app/features/auth/stores/auth.store.ts` — logout completeness (clearSession must clear all state)
- `nuxt.config.ts` — devtools flag, routeRules headers, runtimeConfig
