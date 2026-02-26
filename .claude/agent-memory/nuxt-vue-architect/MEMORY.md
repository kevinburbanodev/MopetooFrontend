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

## Pets slice — confirmed file locations (RF-100 to RF-109 complete)
- `app/features/pets/types/index.ts` — Pet (id:string, species/gender use backend enum strings), CreatePetDTO, UpdatePetDTO, PetFormSubmitPayload
- `app/features/pets/stores/pets.store.ts` — usePetsStore: pets[], selectedPet, isLoading, setLoading(), setPets(), addPet(), updatePet(), removePet(), setSelectedPet(), clearSelectedPet()
- `app/features/pets/composables/usePets.ts` — pending/error refs, fetchPets, fetchPetById, createPet, updatePet, deletePet; multipartRequest helper uses authStore.token
- `app/features/pets/composables/usePetAge.ts` — formatAge(birthDate) returns Spanish age string ("2 años y 3 meses")
- `app/features/pets/components/PetAvatar.vue` — size: 'sm'|'md'|'lg', species emoji fallback, handles img onError
- `app/features/pets/components/PetCard.vue` — uses PetAvatar + usePetAge, emits select-pet/edit-pet/delete-pet
- `app/features/pets/components/PetList.vue` — loading skeleton (6 cards), empty state with CTA, delegates all events up
- `app/features/pets/components/PetForm.vue` — create+edit mode, photo upload with object URL, Bootstrap `was-validated` pattern, emits PetFormSubmitPayload
- `app/features/pets/components/PetDetail.vue` — two-step inline delete confirm, dl/dt/dd for detail rows
- Pages: `app/pages/dashboard/pets/index.vue`, `new.vue`, `[id].vue`, `[id]/edit.vue`

## Auth routes (flat, not /auth/* prefixed)
- `/login` → AuthLoginForm (guest middleware)
- `/register` → AuthRegisterForm (guest middleware)
- `/forgot-password` → AuthForgotPasswordForm (guest middleware)
- `/reset-password/[token]` → AuthResetPasswordForm (no middleware)
- `/dashboard` → protected (auth middleware)
- `/dashboard/profile` → UserProfile view (auth middleware)
- `/dashboard/profile/edit` → UserProfileForm (auth middleware)
- `/dashboard/pets` → PetList (auth middleware)
- `/dashboard/pets/new` → PetForm create (auth middleware)
- `/dashboard/pets/[id]` → PetDetail (auth middleware)
- `/dashboard/pets/[id]/edit` → PetForm edit (auth middleware)

## Middleware
- `app/middleware/auth.ts` — redirects to /login if !isAuthenticated
- `app/middleware/guest.ts` — redirects to /dashboard if isAuthenticated
- Applied via `definePageMeta({ middleware: 'auth' })` — Nuxt resolves by filename

## Plugin
- `app/plugins/auth.client.ts` — client-only; restoreFromStorage() then fetchCurrentUser() on boot

## Multipart upload pattern
- `useApi()` always sets `Content-Type: application/json` — do NOT use it for FormData
- For multipart uploads use `$fetch` directly with FormData body and manual Authorization header
- Token for multipart: read from `authStore.token` (reactive, avoids stale localStorage reads)

## Key conventions confirmed
- `pending` is the reactive loading flag in composables; stores use `isLoading` + `setLoading()`
- `setSession(response: LoginResponse)` takes a full LoginResponse object (not separate args)
- Form validation: `submitted` ref after first submit; computed `xInvalid` drives `:class="{ 'is-invalid': xInvalid }"`
- Object URL lifecycle: always `URL.revokeObjectURL` in onUnmounted + before each new assignment
- `useTemplateRef<T>('refName')` for typed template refs (Nuxt 4 / Vue 3.5+ pattern)
- Pet species backend values: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'
- Pet gender backend values: 'male' | 'female'
- AppNavbar uses `authStore.isAuthenticated` to show/hide authenticated nav links

## See also
- `docs/FDD.md` — full Frontend Development Document
- `docs/SRS.md` — Software Requirements Specification
