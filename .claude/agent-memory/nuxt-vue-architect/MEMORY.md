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

## Medical slice — confirmed file locations (RF-300 to RF-309 complete)
- `app/features/medical/types/index.ts` — MedicalRecord (id/pet_id:string, date, veterinarian, diagnosis, treatment, notes?, weight?, next_visit?), CreateMedicalRecordDTO, UpdateMedicalRecordDTO
- `app/features/medical/stores/medical.store.ts` — useMedicalStore: records[], selectedRecord, isLoading, setRecords(), addRecord(), updateRecord(), removeRecord(), setSelectedRecord(), clearSelectedRecord(), setLoading(), clearMedicalRecords()
- `app/features/medical/composables/useMedical.ts` — error ref, medicalStore ref, fetchMedicalHistory(petId), fetchMedicalRecord(petId, recordId), createMedicalRecord(petId, dto), updateMedicalRecord(petId, recordId, dto), deleteMedicalRecord(petId, recordId), exportPDF(petId, petName?) — exportPDF uses $fetch with responseType:'blob' + authStore.token, guarded by import.meta.client
- `app/features/medical/components/MedicalRecordCard.vue` — petId+record props, delete-record emit, two-step inline confirm, NuxtLink edit button, overdue next_visit badge (bg-danger vs bg-warning)
- `app/features/medical/components/MedicalHistory.vue` — petId+petName props, fetches on mount, export PDF button (isExporting flag separate from store isLoading), skeleton (3 cards), empty state CTA
- `app/features/medical/components/MedicalRecordForm.vue` — petId+record? props, calls composable directly (not emit-to-parent pattern), navigateTo on success
- Pages: `app/pages/dashboard/medical/[petId]/index.vue`, `record/new.vue`, `record/[recordId]/edit.vue`

## Medical routes
- `/dashboard/medical/[petId]` → MedicalHistory (auth middleware)
- `/dashboard/medical/[petId]/record/new` → MedicalRecordForm create (auth middleware)
- `/dashboard/medical/[petId]/record/[recordId]/edit` → MedicalRecordForm edit (auth middleware)
- Medical is accessed from PetDetail "Ver historial médico" button — no top-level navbar link

## Shelters slice — confirmed file locations (RF-500 to RF-509 complete)
- `app/features/shelters/types/index.ts` — Shelter, AdoptionPet (age_months: number|undefined), AdoptionRequest, ShelterFilters, AdoptionPetFilters
- `app/features/shelters/stores/shelters.store.ts` — useSheltersStore: shelters[], selectedShelter, adoptionPets[], selectedAdoptionPet, isLoading, getAvailablePets (computed), clearShelters()
- `app/features/shelters/composables/useShelters.ts` — fetchShelters(filters?), fetchShelterById(id), fetchAdoptionPets(shelterId, filters?), fetchAdoptionPetById(shelterId, petId), submitAdoptionRequest(shelterId, petId, message). Dual API shapes handled (array or wrapped object)
- `app/features/shelters/components/ShelterCard.vue` — shelter prop, photo with isSafeImageUrl, species badges, verified badge, "Ver refugio" NuxtLink
- `app/features/shelters/components/ShelterList.vue` — fetches on mount, client-side search+species filter, skeleton (6 cards), result count
- `app/features/shelters/components/ShelterDetail.vue` — shelterId prop, fetches shelter + adoptionPets on mount, embeds AdoptionList
- `app/features/shelters/components/AdoptionPetCard.vue` — age from age_months (inline math, not usePetAge), status badge overlay, "Ver detalles" hidden for adopted pets
- `app/features/shelters/components/AdoptionList.vue` — reads from store (parent already fetched), 4 client-side filters, skeleton (3 cards)
- `app/features/shelters/components/AdoptionDetail.vue` — petId prop, ClientOnly for adoption form, authStore check, 20-500 char textarea, success/error states
- Pages: `app/pages/shelter/index.vue`, `[id].vue`, `adoptions/[id].vue` (all public, no middleware)

## Shelters routes (public, no auth required)
- `/shelter` → ShelterList (public)
- `/shelter/[id]` → ShelterDetail (public)
- `/shelter/adoptions/[id]` → AdoptionDetail (public; adoption form requires auth, shown client-side only)
- AppNavbar: "Adopciones" added to publicLinks array → always visible

## Blog slice — confirmed file locations (RF-600 to RF-609 complete)
- `app/features/blog/types/index.ts` — BlogPost, BlogAuthor, BlogCategory, BlogListFilters, BlogListResponse
- `app/features/blog/stores/blog.store.ts` — useBlogStore: posts[], selectedPost, categories[], isLoading, currentPage, totalPages, total; getters: hasPosts, hasCategories, getPostBySlug(slug); actions: setPosts, appendPosts, setSelectedPost, clearSelectedPost, setCategories, setLoading, setPagination, clearBlog
- `app/features/blog/composables/useBlog.ts` — error ref, blogStore ref, fetchPosts(filters?, append?), fetchPostBySlug(slug), fetchCategories(). Dual API shapes (BlogListResponse envelope or bare array). Store-first cache check in fetchPostBySlug.
- `app/features/blog/components/BlogCategoryFilter.vue` — horizontal scrollable pill buttons, emits 'select' with slug|null, role=tablist pattern
- `app/features/blog/components/BlogCard.vue` — post prop, isSafeImageUrl guard, SVG paw placeholder, 3-line excerpt clamp, author avatar with initial fallback, Intl date formatting in Spanish, reading time badge, NuxtLink stretched-link to /blog/:slug
- `app/features/blog/components/BlogList.vue` — fetches posts+categories on mount in parallel, BlogCategoryFilter + search input, skeleton (6 cards), two empty states, "Cargar más" append pagination
- `app/features/blog/components/BlogArticle.vue` — reads blogStore.selectedPost, hero image, author meta, tags, content as plain text paragraphs (NOT v-html — security note in file), "Ver más artículos" CTA, skeleton + not-found states
- Pages: `app/pages/blog/index.vue`, `[slug].vue` (both public, no middleware)

## Blog routes (public, no auth required)
- `/blog` → BlogList (public)
- `/blog/[slug]` → BlogArticle via BlogArticle component (public)
- AppNavbar: "Blog" added to publicLinks array between "Inicio" and "Adopciones"

## Blog content security decision
- Article `content` field rendered as plain text (paragraph split on `\n`), NOT v-html
- Rationale: v-html is an XSS surface even with backend sanitisation; plain text is safe
- If future requirement needs HTML rendering, add DOMPurify as client-only guard first
- `featured_image` and `author.avatar` both pass through isSafeImageUrl before binding

## clearSession cross-store rule — current state
`auth.store.clearSession()` now resets: petsStore (setPets+clearSelectedPet), remindersStore (clearReminders), medicalStore (clearMedicalRecords), sheltersStore (clearShelters). Blog posts are public data — useBlogStore.clearBlog() is exported but NOT called from clearSession (no user-specific data). Add new user-specific stores here when implementing new slices.

## MedicalRecordForm pattern difference vs ReminderForm
- MedicalRecordForm calls the composable directly (no emit-to-parent pattern)
- ReminderForm emits a typed payload to the parent page which handles API calls
- Both are valid patterns; use whichever keeps the page thinner

## See also
- `docs/FDD.md` — full Frontend Development Document
- `docs/SRS.md` — Software Requirements Specification
