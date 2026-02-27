<script setup lang="ts">
// AdoptionDetail — full adoption pet profile with adoption request form.
// Fetches the pet on mount using the petId from the route.
// The shelter_id is retrieved from the fetched pet data so we can:
//  - provide a back link to the correct shelter
//  - submit the adoption request to the correct endpoint
//
// Adoption request form is shown only when:
//  - Rendered on the client (import.meta.client)
//  - User is authenticated
//  - Pet status is 'available'

const props = defineProps<{
  petId: string
}>()

const { fetchAdoptionPetById, submitAdoptionRequest, error, sheltersStore } = useShelters()
const authStore = useAuthStore()

// ── Pet data ─────────────────────────────────────────────
const pet = computed(() => sheltersStore.selectedAdoptionPet)

// ── Display maps ─────────────────────────────────────────
const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐕',
  cat: '🐱',
  bird: '🦜',
  rabbit: '🐰',
  other: '🐾',
}

const SPECIES_LABEL: Record<string, string> = {
  dog: 'Perro',
  cat: 'Gato',
  bird: 'Ave',
  rabbit: 'Conejo',
  other: 'Otro',
}

const GENDER_LABEL: Record<string, string> = {
  male: 'Macho',
  female: 'Hembra',
  unknown: 'Desconocido',
}

const SIZE_LABEL: Record<string, string> = {
  small: 'Pequeño',
  medium: 'Mediano',
  large: 'Grande',
}

const STATUS_CONFIG = {
  available: { label: 'Disponible', badgeClass: 'bg-success' },
  pending: { label: 'En proceso de adopción', badgeClass: 'bg-warning text-dark' },
  adopted: { label: 'Ya adoptado', badgeClass: 'bg-secondary' },
} as const

// ── Age from age_months ───────────────────────────────────
function formatAgeFromMonths(m: number | undefined): string {
  if (m === undefined || m === null) return 'Desconocida'
  if (m === 0) return 'Recién nacido'
  const years = Math.floor(m / 12)
  const months = m % 12
  if (years === 0) return months === 1 ? '1 mes' : `${months} meses`
  if (months === 0) return years === 1 ? '1 año' : `${years} años`
  const yearLabel = years === 1 ? '1 año' : `${years} años`
  const monthLabel = months === 1 ? '1 mes' : `${months} meses`
  return `${yearLabel} y ${monthLabel}`
}

// ── URL safety guard ─────────────────────────────────────
function isSafeImageUrl(url: string | undefined): boolean {
  if (!url) return false
  if (url.startsWith('blob:')) return true
  if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) return true
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  }
  catch {
    return false
  }
}

const safePhotoUrl = computed(() =>
  isSafeImageUrl(pet.value?.photo_url) ? pet.value?.photo_url : null,
)

const imgError = ref(false)
const showPhoto = computed(() => !!safePhotoUrl.value && !imgError.value)

function onImgError(): void {
  imgError.value = true
}

// ── Adoption request form ─────────────────────────────────
// The form is only rendered client-side so authStore.isAuthenticated
// is read after hydration — no SSR mismatch risk.
const MESSAGE_MIN = 20
const MESSAGE_MAX = 500

const adoptionMessage = ref('')
const submitted = ref(false)
const adoptionSuccess = ref(false)
const adoptionError = ref<string | null>(null)

const messageInvalid = computed(() =>
  submitted.value
  && (adoptionMessage.value.trim().length < MESSAGE_MIN
    || adoptionMessage.value.trim().length > MESSAGE_MAX),
)

const messageCharsLeft = computed(() =>
  MESSAGE_MAX - adoptionMessage.value.length,
)

async function handleAdoptionSubmit(): Promise<void> {
  submitted.value = true
  adoptionError.value = null

  const trimmed = adoptionMessage.value.trim()
  if (trimmed.length < MESSAGE_MIN || trimmed.length > MESSAGE_MAX) return
  if (!pet.value) return

  const result = await submitAdoptionRequest(
    pet.value.shelter_id,
    pet.value.id,
    trimmed,
  )

  if (result) {
    adoptionSuccess.value = true
    adoptionMessage.value = ''
    submitted.value = false
  }
  else {
    adoptionError.value = error.value ?? 'No se pudo enviar la solicitud. Intenta de nuevo.'
  }
}

// ── Lifecycle ─────────────────────────────────────────────
onMounted(async () => {
  // If we navigated from ShelterDetail, the pet may already be in the
  // adoption pets list — look it up in the store first to avoid a
  // redundant network request.
  const cached = sheltersStore.adoptionPets.find(p => p.id === props.petId) ?? null
  if (cached) {
    sheltersStore.setSelectedAdoptionPet(cached)
    return
  }

  // Pet not in store — we need to fetch it. The backend endpoint
  // requires /api/shelters/:shelterId/pets/:petId. Because this page
  // only has the petId, we need the shelterId from the URL if available.
  // We use the route's `shelterId` query param as a fallback (set by
  // AdoptionPetCard when navigating), or fall back to a shelter-agnostic
  // path if the backend supports it.
  const route = useRoute()
  // Validate shelterId from query to prevent path traversal — only allow
  // alphanumeric chars, hyphens and underscores (LOW security fix)
  const rawShelterId = route.query.shelterId as string | undefined
  const shelterId = (rawShelterId && /^[\w-]{1,64}$/.test(rawShelterId))
    ? rawShelterId
    : '_'

  await fetchAdoptionPetById(shelterId, props.petId)
})

const backLink = computed(() => {
  if (pet.value?.shelter_id) return `/shelter/${pet.value.shelter_id}`
  return '/shelter'
})
</script>

<template>
  <section aria-label="Detalle de mascota en adopción">
    <!-- Back navigation -->
    <div class="mb-4">
      <NuxtLink
        :to="backLink"
        class="btn btn-sm btn-link p-0 text-muted text-decoration-none"
      >
        &larr; Volver al refugio
      </NuxtLink>
    </div>

    <!-- Error alert (fetch errors) -->
    <div
      v-if="error && !pet"
      class="alert alert-danger d-flex align-items-center gap-2 mb-4"
      role="alert"
    >
      <span aria-hidden="true">⚠</span>
      {{ error }}
    </div>

    <!-- Loading state -->
    <div v-if="sheltersStore.isLoading && !pet" aria-busy="true" aria-label="Cargando mascota">
      <div class="row g-4">
        <div class="col-12 col-md-6">
          <div class="adoption-detail-skeleton__photo skeleton-pulse rounded-3" aria-hidden="true" />
        </div>
        <div class="col-12 col-md-6">
          <div class="card border-0 shadow-sm p-4" aria-hidden="true">
            <div class="skeleton-pulse rounded mb-2 adoption-detail-skeleton__title" />
            <div class="skeleton-pulse rounded mb-3 adoption-detail-skeleton__subtitle" />
            <div class="skeleton-pulse rounded mb-2 adoption-detail-skeleton__line" />
            <div class="skeleton-pulse rounded mb-2 adoption-detail-skeleton__line" />
            <div class="skeleton-pulse rounded adoption-detail-skeleton__line--short" />
          </div>
        </div>
      </div>
    </div>

    <!-- Pet detail -->
    <template v-else-if="pet">
      <div class="row g-4 mb-4">
        <!-- Photo column -->
        <div class="col-12 col-md-6">
          <div class="adoption-detail__photo-wrap">
            <img
              v-if="showPhoto"
              :src="safePhotoUrl!"
              :alt="`Foto de ${pet.name}`"
              class="adoption-detail__photo"
              width="600"
              height="500"
              @error="onImgError"
            />
            <div
              v-else
              class="adoption-detail__fallback d-flex align-items-center justify-content-center"
              aria-hidden="true"
            >
              <span class="adoption-detail__fallback-icon">
                {{ SPECIES_EMOJI[pet.species] ?? '🐾' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Info column -->
        <div class="col-12 col-md-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body p-4 d-flex flex-column gap-3">
              <!-- Name + status -->
              <div>
                <div class="d-flex flex-wrap align-items-start gap-2 mb-1">
                  <h1 class="h3 fw-bold mb-0">{{ pet.name }}</h1>
                  <span
                    :class="['badge align-self-center', STATUS_CONFIG[pet.status].badgeClass]"
                    :aria-label="`Estado: ${STATUS_CONFIG[pet.status].label}`"
                  >
                    {{ STATUS_CONFIG[pet.status].label }}
                  </span>
                </div>
                <p class="text-muted mb-0">
                  <span aria-hidden="true">{{ SPECIES_EMOJI[pet.species] ?? '🐾' }}</span>
                  {{ SPECIES_LABEL[pet.species] ?? pet.species }}
                  <template v-if="pet.breed"> · {{ pet.breed }}</template>
                </p>
              </div>

              <!-- Info table -->
              <dl class="mb-0">
                <div class="adoption-detail__row">
                  <dt class="adoption-detail__label text-muted small">Edad</dt>
                  <dd class="adoption-detail__value fw-semibold mb-0">
                    {{ formatAgeFromMonths(pet.age_months) }}
                  </dd>
                </div>
                <div class="adoption-detail__row border-top pt-2">
                  <dt class="adoption-detail__label text-muted small">Sexo</dt>
                  <dd class="adoption-detail__value fw-semibold mb-0">
                    {{ GENDER_LABEL[pet.gender] ?? pet.gender }}
                  </dd>
                </div>
                <div class="adoption-detail__row border-top pt-2">
                  <dt class="adoption-detail__label text-muted small">Tamaño</dt>
                  <dd class="adoption-detail__value fw-semibold mb-0">
                    {{ SIZE_LABEL[pet.size] ?? pet.size }}
                  </dd>
                </div>
              </dl>

              <!-- Health chips -->
              <div>
                <p class="text-muted small text-uppercase fw-semibold mb-2" style="letter-spacing: 0.04em;">
                  Salud
                </p>
                <div class="d-flex gap-2 flex-wrap">
                  <span
                    :class="[
                      'badge fs-6 fw-normal px-3 py-2',
                      pet.vaccinated ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger-emphasis',
                    ]"
                  >
                    <span aria-hidden="true">{{ pet.vaccinated ? '✅' : '❌' }}</span>
                    {{ pet.vaccinated ? 'Vacunado' : 'Sin vacuna' }}
                  </span>
                  <span
                    :class="[
                      'badge fs-6 fw-normal px-3 py-2',
                      pet.neutered ? 'bg-success-subtle text-success-emphasis' : 'bg-secondary-subtle text-secondary-emphasis',
                    ]"
                  >
                    <span aria-hidden="true">{{ pet.neutered ? '✅' : '❌' }}</span>
                    {{ pet.neutered ? 'Esterilizado' : 'Sin esterilizar' }}
                  </span>
                </div>
              </div>

              <!-- Description -->
              <div v-if="pet.description">
                <p class="text-muted small text-uppercase fw-semibold mb-2" style="letter-spacing: 0.04em;">
                  Descripción
                </p>
                <p class="mb-0" style="white-space: pre-line;">{{ pet.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Adoption request section (client-only) ───────────── -->
      <ClientOnly>
        <div class="card border-0 shadow-sm mb-4">
          <div class="card-body p-4">
            <!-- Already adopted -->
            <template v-if="pet.status === 'adopted'">
              <div class="text-center py-3">
                <span class="fs-2" aria-hidden="true">🏡</span>
                <h2 class="h5 fw-bold mt-3 mb-2">Esta mascota ya tiene un hogar</h2>
                <p class="text-muted mb-0">
                  Pero hay muchas más esperando. Explora otras mascotas disponibles.
                </p>
              </div>
            </template>

            <!-- In process (pending) -->
            <template v-else-if="pet.status === 'pending'">
              <div class="text-center py-3">
                <span class="fs-2" aria-hidden="true">⏳</span>
                <h2 class="h5 fw-bold mt-3 mb-2">Solicitud en proceso</h2>
                <p class="text-muted mb-0">
                  Esta mascota ya tiene una solicitud de adopción pendiente. Si estás interesado,
                  contacta directamente al refugio.
                </p>
              </div>
            </template>

            <!-- Available — show form or login CTA -->
            <template v-else-if="pet.status === 'available'">
              <h2 class="h5 fw-bold mb-1">Solicitar adopción</h2>
              <p class="text-muted small mb-4">
                Cuéntanos por qué quieres adoptar a {{ pet.name }} y cómo sería su nuevo hogar.
              </p>

              <!-- Success state -->
              <div
                v-if="adoptionSuccess"
                class="alert alert-success d-flex align-items-center gap-2"
                role="alert"
              >
                <span aria-hidden="true">✓</span>
                <div>
                  <strong>¡Solicitud enviada!</strong>
                  El refugio revisará tu mensaje y se pondrá en contacto contigo.
                </div>
              </div>

              <!-- Not authenticated — CTA to log in -->
              <template v-else-if="!authStore.isAuthenticated">
                <div class="alert alert-info d-flex align-items-center gap-3 mb-0" role="note">
                  <span class="fs-3" aria-hidden="true">🔑</span>
                  <div>
                    <strong>Inicia sesión para solicitar adopción</strong>
                    <p class="mb-2 small text-muted">
                      Necesitas una cuenta para enviar solicitudes de adopción.
                    </p>
                    <NuxtLink to="/login" class="btn btn-primary btn-sm me-2">
                      Iniciar sesión
                    </NuxtLink>
                    <NuxtLink to="/register" class="btn btn-outline-primary btn-sm">
                      Registrarse
                    </NuxtLink>
                  </div>
                </div>
              </template>

              <!-- Authenticated — adoption request form -->
              <form
                v-else
                class="was-validated"
                :class="{ 'was-validated': submitted }"
                novalidate
                @submit.prevent="handleAdoptionSubmit"
              >
                <!-- Submission error -->
                <div
                  v-if="adoptionError"
                  class="alert alert-danger d-flex align-items-center gap-2 mb-3"
                  role="alert"
                >
                  <span aria-hidden="true">⚠</span>
                  {{ adoptionError }}
                </div>

                <div class="mb-3">
                  <label for="adoption-message" class="form-label fw-semibold">
                    Tu mensaje
                    <span class="text-danger" aria-hidden="true">*</span>
                  </label>
                  <textarea
                    id="adoption-message"
                    v-model="adoptionMessage"
                    class="form-control"
                    :class="{ 'is-invalid': messageInvalid }"
                    rows="5"
                    :minlength="MESSAGE_MIN"
                    :maxlength="MESSAGE_MAX"
                    placeholder="Cuéntanos sobre tu hogar, estilo de vida, experiencia con mascotas y por qué quieres adoptar..."
                    required
                    aria-required="true"
                    :aria-describedby="messageInvalid ? 'adoption-message-error' : 'adoption-message-hint'"
                  />
                  <!-- Char counter + hint -->
                  <div
                    id="adoption-message-hint"
                    class="d-flex justify-content-between mt-1"
                  >
                    <span class="form-text">
                      Mínimo {{ MESSAGE_MIN }} caracteres.
                    </span>
                    <span
                      class="form-text"
                      :class="{ 'text-danger': messageCharsLeft < 0 }"
                      aria-live="polite"
                    >
                      {{ messageCharsLeft >= 0 ? messageCharsLeft : 0 }} restantes
                    </span>
                  </div>
                  <div
                    v-if="messageInvalid"
                    id="adoption-message-error"
                    class="invalid-feedback"
                    role="alert"
                  >
                    El mensaje debe tener entre {{ MESSAGE_MIN }} y {{ MESSAGE_MAX }} caracteres.
                  </div>
                </div>

                <button
                  type="submit"
                  class="btn btn-primary"
                  :disabled="sheltersStore.isLoading"
                  :aria-busy="sheltersStore.isLoading"
                >
                  <span
                    v-if="sheltersStore.isLoading"
                    class="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  />
                  {{ sheltersStore.isLoading ? 'Enviando...' : 'Enviar solicitud' }}
                </button>
              </form>
            </template>
          </div>
        </div>
      </ClientOnly>
    </template>

    <!-- Pet not found -->
    <div
      v-else-if="!sheltersStore.isLoading"
      class="text-center py-5"
    >
      <div class="fs-1" aria-hidden="true">🐾</div>
      <h2 class="h5 fw-bold mt-4 mb-2">Mascota no encontrada</h2>
      <p class="text-muted mb-4">
        Esta mascota ya no está disponible o el enlace es incorrecto.
      </p>
      <NuxtLink to="/shelter" class="btn btn-primary">
        Explorar refugios
      </NuxtLink>
    </div>
  </section>
</template>

<style scoped lang="scss">
// ── Photo area ────────────────────────────────────────────────
.adoption-detail {
  &__photo-wrap {
    position: relative;
    overflow: hidden;
    border-radius: var(--bs-border-radius-lg);
    height: 360px;
    background-color: var(--bs-secondary-bg);

    @media (min-width: 768px) {
      height: 100%;
      min-height: 420px;
    }
  }

  &__photo {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__fallback {
    width: 100%;
    height: 100%;
    background-color: #dff0e8;
  }

  &__fallback-icon {
    font-size: 6rem;
    line-height: 1;
  }

  // ── Info dl ───────────────────────────────────────────────
  &__row {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    padding-bottom: 0.5rem;
    margin-bottom: 0.5rem;
  }

  &__label {
    min-width: 80px;
    flex-shrink: 0;
  }

  &__value {
    flex: 1;
  }
}

// ── Skeleton shimmer ──────────────────────────────────────────
.skeleton-pulse {
  background: linear-gradient(
    90deg,
    var(--bs-secondary-bg) 25%,
    var(--bs-tertiary-bg, #e8e8e8) 50%,
    var(--bs-secondary-bg) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background: var(--bs-secondary-bg);
  }
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.adoption-detail-skeleton {
  &__photo {
    height: 360px;
    width: 100%;
  }

  &__title {
    height: 1.5rem;
    width: 55%;
  }

  &__subtitle {
    height: 0.875rem;
    width: 35%;
  }

  &__line {
    height: 0.875rem;
    width: 100%;
  }

  &__line--short {
    height: 0.875rem;
    width: 70%;
  }
}
</style>
