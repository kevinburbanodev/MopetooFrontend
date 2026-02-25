# Nuxt-Vue-Architect Agent Memory — MopetooFrontend

## Project identity
- Nuxt 4, `app/` as srcDir, SSR enabled, TypeScript strict
- Bootstrap 5 + SCSS. Brand green `#4CAF82` (`$primary`). Variables in `app/assets/scss/_variables.scss`
- Pinia via `@pinia/nuxt`. Stores auto-imported from `features/*/stores`
- Components auto-imported from `app/features/**` with `pathPrefix: false`
- Composables auto-imported from `features/*/composables` and `features/shared/composables`

## Auth slice — confirmed file locations
- `app/features/auth/types/index.ts` — User, LoginPayload, LoginResponse, RegisterPayload, UpdateProfileDTO, ForgotPasswordPayload, ResetPasswordPayload
- `app/features/auth/stores/auth.store.ts` — useAuthStore: currentUser, token, isPending, isAuthenticated, isPro, isAdmin, setSession(LoginResponse), clearSession(), restoreFromStorage(), setUser(User)
- `app/features/auth/composables/useAuth.ts` — pending/error refs, login, register, logout, forgotPassword, resetPassword, fetchCurrentUser, updateProfile, deleteAccount
- `app/features/shared/composables/useApi.ts` — get, post, put, patch, del (all add Bearer token from localStorage)

## Auth routes (flat, not /auth/* prefixed)
- `/login` → AuthLoginForm (guest middleware)
- `/register` → AuthRegisterForm (guest middleware)
- `/forgot-password` → AuthForgotPasswordForm (guest middleware)
- `/reset-password/[token]` → AuthResetPasswordForm (no middleware — email link)
- `/dashboard` → protected (auth middleware)
- `/dashboard/profile` → UserProfile view (auth middleware)
- `/dashboard/profile/edit` → UserProfileForm (auth middleware)
- Old `/auth/login` and `/auth/register` redirect 301 to new flat routes

## Middleware
- `app/middleware/auth.ts` — redirects to /login if !isAuthenticated
- `app/middleware/guest.ts` — redirects to /dashboard if isAuthenticated
- Applied via `definePageMeta({ middleware: 'auth' })` — Nuxt resolves by filename

## Plugin
- `app/plugins/auth.client.ts` — client-only; restoreFromStorage() then fetchCurrentUser() on boot

## Multipart upload pattern
- `useApi()` always sets `Content-Type: application/json` — do NOT use it for FormData
- For multipart uploads use `$fetch` directly with FormData body and manual Authorization header
- Token for manual header: `import.meta.client ? localStorage.getItem('mopetoo_token') : null`

## Key conventions confirmed
- `pending` (not `loading`) is the reactive loading flag name in useAuth
- `setSession(response: LoginResponse)` takes a full LoginResponse object (not separate args)
- Form validation: `submitted` ref toggles after first submit; computed `xInvalid` drives `:class="{ 'is-invalid': xInvalid }"`
- Object URL lifecycle: always `URL.revokeObjectURL` in onUnmounted + before each new assignment
- `useTemplateRef<T>('refName')` for typed template refs (Nuxt 4 / Vue 3.5+ pattern)

## See also
- `docs/FDD.md` — full Frontend Development Document
- `docs/SRS.md` — Software Requirements Specification
