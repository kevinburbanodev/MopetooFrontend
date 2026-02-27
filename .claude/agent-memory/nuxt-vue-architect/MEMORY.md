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

## Petshops slice — confirmed file locations (RF-700 to RF-709 complete)
- `app/features/petshops/types/index.ts` — PetshopCategory, PetshopHours, Petshop (categories:string[], hours?:PetshopHours, is_featured, is_verified, latitude?, longitude?), PetshopListFilters, PetshopListResponse
- `app/features/petshops/stores/petshops.store.ts` — usePetshopsStore: petshops[], selectedPetshop, isLoading, hasPetshops (computed), getFeaturedPetshops (computed filter is_featured), clearPetshops()
- `app/features/petshops/composables/usePetshops.ts` — error ref, petshopsStore ref, fetchPetshops(filters?), fetchPetshopById(id). Store-first lookup in fetchPetshopById. Dual API shapes (PetshopListResponse envelope or bare Petshop[])
- `app/features/petshops/components/PetshopCard.vue` — petshop prop, isSafeImageUrl, safePhone/safeEmail/safeWebsiteUrl guards, max 3 category badges + "+N" overflow, verified/featured badges overlaid, stretched-link to /stores/:id
- `app/features/petshops/components/PetshopList.vue` — fetches on mount, 3 client-side filters (search+category+city), "Tiendas Destacadas" section (hidden when filters active), skeleton (6 cards), two empty states, result counter
- `app/features/petshops/components/PetshopDetail.vue` — petshopId prop, route param validated /^[\w-]{1,64}$/, store-first via fetchPetshopById, 16:9 hero banner, business hours table (PetshopHours → HOURS_ROWS), map placeholder card when lat/lng present, onUnmounted clears selectedPetshop
- Pages: `app/pages/stores/index.vue`, `app/pages/stores/[id].vue` (both public, no middleware)
- AppNavbar: "Tiendas" added to publicLinks array pointing to /stores

## Petshops routes (public, no auth required)
- `/stores` → PetshopList (public)
- `/stores/[id]` → PetshopDetail (public)
- AppNavbar: "Tiendas" added to publicLinks array after "Adopciones"

## Petshops security patterns (same as shelters)
- safeWebsiteUrl: restricts to http/https only (prevents javascript: URI injection)
- safePhone: /^[+\d\s\-().]{4,25}$/ guard on tel: href
- safeEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ guard on mailto: href
- Route param guard: /^[\w-]{1,64}$/ on petshopId before API call
- No v-html anywhere; description rendered with white-space: pre-line
- clearPetshops() NOT called from clearSession (public data, same rule as blog/shelters)

## Pro slice — confirmed file locations (RF-800 to RF-809 complete)
- `app/features/pro/types/index.ts` — PlanInterval, SubscriptionStatus, DonationStatus, ProPlan, ProSubscription, CheckoutSession, SubscribeRequest, DonationRequest, DonationResponse
- `app/features/pro/stores/pro.store.ts` — useProStore: subscription, plans[], isLoading, isSubscribed (computed status==='active'), hasPlans, getMonthlyPlan, getAnnualPlan, setSubscription(), clearSubscription(), setPlans(), setLoading(), clearPro()
- `app/features/pro/composables/usePro.ts` — error ref, proStore/authStore refs, fetchPlans(), fetchSubscription() (404→null, not error), createCheckoutSession(planId) (client-only, HTTPS guard, navigateTo external), cancelSubscription() (optimistic store update), donate(DonationRequest)
- `app/features/pro/components/ProBanner.vue` — compact prop, featureName prop, emits upgrade/close. Shows upgrade prompt for authenticated non-PRO users; login CTA for unauthenticated users; nothing for PRO users
- `app/features/pro/components/ProUpgradeModal.vue` — v-model boolean, Bootstrap Modal instance via lazy import('bootstrap'), hidden.bs.modal event keeps v-model in sync, plan selection with savings% badge, calls createCheckoutSession on submit
- `app/features/pro/components/PricingTable.vue` — 3-column (Free/Monthly/Annual), fetches plans on mount, FREE_FEATURES hardcoded, emits select-plan(planId), isActivePlan() badge for PRO users, skeleton loading
- `app/features/pro/components/DonationForm.vue` — shelterId+shelterName props, PRESET_AMOUNTS [5000,10000,25000,50000] COP, custom amount input, 200-char message, ClientOnly wrapper, success state with reset
- `app/features/pro/components/PaymentCheckout.vue` — pure display, status:'success'|'canceled'|'pending' prop, no logic
- Pages: `app/pages/pricing/index.vue` (public, no middleware), `app/pages/dashboard/subscription/index.vue` (auth middleware)

## Pro routes
- `/pricing` → PricingTable + ProUpgradeModal (public)
- `/dashboard/subscription` → subscription management page (auth middleware)
  - ?checkout=success → shows PaymentCheckout success + re-fetches subscription
  - ?checkout=canceled → shows PaymentCheckout canceled
- AppNavbar: "Precios" added to publicLinks; "Hazte PRO" btn (warning) for non-PRO auth users; "PRO ✓" badge for PRO users

## Bootstrap Modal lazy-import pattern (confirmed)
- Import Bootstrap's `Modal` class lazily inside an async function: `const { Modal } = await import('bootstrap')`
- Always guard with `import.meta.client` before creating instance
- Listen to `hidden.bs.modal` event to sync v-model when modal is dismissed via Esc/backdrop
- `useTemplateRef<HTMLElement>('modalEl')` for the modal root element ref

## Stripe Checkout redirect security pattern
- `createCheckoutSession` validates returned URL with `new URL(url).protocol === 'https:'`
- Only redirect via `navigateTo(url, { external: true })` after HTTPS validation passes
- `window.location.origin` access always guarded by `import.meta.client`
- Function returns null + sets error.value if URL is not HTTPS (prevents open redirect)

## clearSession cross-store rule — current state
`auth.store.clearSession()` now resets: petsStore (setPets+clearSelectedPet), remindersStore (clearReminders), medicalStore (clearMedicalRecords), sheltersStore (clearShelters), proStore (clearPro). Blog posts and petshops are public data — their clear actions exist but are NOT called from clearSession. Add new user-specific stores here when implementing new slices.

## MedicalRecordForm pattern difference vs ReminderForm
- MedicalRecordForm calls the composable directly (no emit-to-parent pattern)
- ReminderForm emits a typed payload to the parent page which handles API calls
- Both are valid patterns; use whichever keeps the page thinner

## See also
- `docs/FDD.md` — full Frontend Development Document
- `docs/SRS.md` — Software Requirements Specification
