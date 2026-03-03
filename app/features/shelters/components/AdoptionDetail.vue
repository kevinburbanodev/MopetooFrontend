<script setup lang="ts">
// AdoptionDetail — full adoption listing profile with adoption request form.
// Fetches the listing on mount using the listingId from the route.
//
// Adoption request form is shown only when:
//  - Rendered on the client (import.meta.client)
//  - User is authenticated
//  - Listing status is 'available'

const props = defineProps<{
  listingId: string
}>()

const { fetchAdoptionListingById, submitAdoptionRequest, error, sheltersStore } = useShelters()
const authStore = useAuthStore()
const { toastError, toastSuccess } = useToast()

// ── Listing data ──────────────────────────────────────────
const listing = computed(() => sheltersStore.selectedListing)

// ── Display maps ──────────────────────────────────────────
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

const STATUS_CONFIG = {
  available: { label: 'Disponible', badgeClass: 'bg-success' },
  pending: { label: 'En proceso de adopción', badgeClass: 'bg-warning text-dark' },
  adopted: { label: 'Ya adoptado', badgeClass: 'bg-secondary' },
} as const

// ── Age display ───────────────────────────────────────────
function formatAge(age: number | undefined): string {
  if (age === undefined || age === null) return 'Desconocida'
  if (age === 0) return 'Cachorro'
  return age === 1 ? '1 año' : `${age} años`
}

// ── URL safety guard ──────────────────────────────────────
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
  isSafeImageUrl(listing.value?.photo_url) ? listing.value?.photo_url : null,
)

const imgError = ref(false)
const showPhoto = computed(() => !!safePhotoUrl.value && !imgError.value)

// ── Shelter contact sanitization ────────────────────────
/**
 * Sanitizes phone: only digits, +, -, spaces, parens, and dots.
 * Prevents tel: href injection.
 */
const safeShelterPhone = computed<string | null>(() => {
  const phone = listing.value?.shelter?.phone
  if (!phone) return null
  return /^[+\d\s\-().]{4,25}$/.test(phone) ? phone : null
})

/**
 * Sanitizes email: must contain @ and no whitespace.
 * Prevents mailto: href injection.
 */
const safeShelterEmail = computed<string | null>(() => {
  const email = listing.value?.shelter?.email
  if (!email) return null
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
})

/**
 * WhatsApp URL for the shelter phone.
 * Strips non-digit chars (except leading +) to build wa.me link.
 */
const whatsappShelterUrl = computed<string | null>(() => {
  const phone = listing.value?.shelter?.phone
  if (!phone) return null
  const digits = phone.replace(/[^\d]/g, '')
  if (digits.length < 4) return null
  return `https://wa.me/${digits}`
})

function onImgError(): void {
  imgError.value = true
}

// ── Adoption request form ─────────────────────────────────
const MESSAGE_MIN = 20
const MESSAGE_MAX = 500

const adoptionMessage = ref('')
const submitted = ref(false)
const adoptionSuccess = ref(false)

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

  const trimmed = adoptionMessage.value.trim()
  if (trimmed.length < MESSAGE_MIN || trimmed.length > MESSAGE_MAX) return
  if (!listing.value) return

  const result = await submitAdoptionRequest(
    listing.value.id,
    trimmed,
  )

  if (result) {
    adoptionSuccess.value = true
    adoptionMessage.value = ''
    submitted.value = false
    toastSuccess('El refugio revisará tu mensaje y se pondrá en contacto contigo.', '¡Solicitud enviada!')
  }
  else {
    const msg = error.value ?? 'No se pudo enviar la solicitud. Intenta de nuevo.'
    toastError(msg)
  }
}

// ── Lifecycle ─────────────────────────────────────────────
onMounted(async () => {
  // Check if the listing is already cached in the store
  const id = Number(props.listingId)
  const cached = sheltersStore.adoptionListings.find(l => l.id === id) ?? null
  if (cached) {
    sheltersStore.setSelectedListing(cached)
    return
  }

  await fetchAdoptionListingById(id)
})
</script>

<template>
  <section aria-label="Detalle de mascota en adopción">
    <!-- Back navigation -->
    <div class="mb-4">
      <NuxtLink
        to="/shelter"
        class="btn btn-sm btn-link p-0 text-muted text-decoration-none"
      >
        &larr; Volver a adopciones
      </NuxtLink>
    </div>

    <!-- Error alert (fetch errors) -->
    <div
      v-if="error && !listing"
      class="alert alert-danger d-flex align-items-center gap-2 mb-4"
      role="alert"
    >
      <span aria-hidden="true">⚠</span>
      {{ error }}
    </div>

    <!-- Loading state -->
    <div v-if="sheltersStore.isLoading && !listing" aria-busy="true" aria-label="Cargando mascota">
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

    <!-- Listing detail -->
    <template v-else-if="listing">
      <div class="row g-4 mb-4">
        <!-- Photo column -->
        <div class="col-12 col-md-6">
          <div class="adoption-detail__photo-wrap">
            <img
              v-if="showPhoto"
              :src="safePhotoUrl!"
              :alt="`Foto de ${listing.name}`"
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
                {{ SPECIES_EMOJI[listing.species] ?? '🐾' }}
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
                  <h1 class="h3 fw-bold mb-0">{{ listing.name }}</h1>
                  <span
                    :class="['badge align-self-center', STATUS_CONFIG[listing.status].badgeClass]"
                    :aria-label="`Estado: ${STATUS_CONFIG[listing.status].label}`"
                  >
                    {{ STATUS_CONFIG[listing.status].label }}
                  </span>
                </div>
                <p class="text-muted mb-0">
                  <span aria-hidden="true">{{ SPECIES_EMOJI[listing.species] ?? '🐾' }}</span>
                  {{ SPECIES_LABEL[listing.species] ?? listing.species }}
                  <template v-if="listing.breed"> · {{ listing.breed }}</template>
                </p>
              </div>

              <!-- Info table -->
              <dl class="mb-0">
                <div class="adoption-detail__row">
                  <dt class="adoption-detail__label text-muted small">Edad</dt>
                  <dd class="adoption-detail__value fw-semibold mb-0">
                    {{ formatAge(listing.age) }}
                  </dd>
                </div>
                <div class="adoption-detail__row border-top pt-2">
                  <dt class="adoption-detail__label text-muted small">Sexo</dt>
                  <dd class="adoption-detail__value fw-semibold mb-0">
                    {{ GENDER_LABEL[listing.gender] ?? listing.gender }}
                  </dd>
                </div>
                <div v-if="listing.weight" class="adoption-detail__row border-top pt-2">
                  <dt class="adoption-detail__label text-muted small">Peso</dt>
                  <dd class="adoption-detail__value fw-semibold mb-0">
                    {{ listing.weight }} kg
                  </dd>
                </div>
                <div class="adoption-detail__row border-top pt-2">
                  <dt class="adoption-detail__label text-muted small">Ubicación</dt>
                  <dd class="adoption-detail__value fw-semibold mb-0">
                    {{ listing.city }}<template v-if="listing.country">, {{ listing.country }}</template>
                  </dd>
                </div>
              </dl>

              <!-- Story -->
              <div v-if="listing.story">
                <p class="text-muted small text-uppercase fw-semibold mb-2" style="letter-spacing: 0.04em;">
                  Historia
                </p>
                <p class="mb-0" style="white-space: pre-line;">{{ listing.story }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Shelter info card ──────────────────────────────────── -->
      <div v-if="listing.shelter" class="adoption-detail__shelter-card card border-0 shadow-sm mb-4">
        <div class="card-body p-4">
          <h5 class="fw-bold mb-2">
            <NuxtLink :to="`/shelters/${listing.shelter.id}`" class="text-decoration-none text-body">
              {{ listing.shelter.name }}
            </NuxtLink>
          </h5>
          <p v-if="listing.shelter.city" class="text-muted small mb-2">
            <span aria-hidden="true">📍</span> {{ listing.shelter.city }}
          </p>
          <p v-if="safeShelterPhone" class="mb-2 d-flex align-items-center gap-2">
            <span>
              <span aria-hidden="true">📞</span>
              <a :href="`tel:${safeShelterPhone}`">{{ safeShelterPhone }}</a>
            </span>
            <a
              v-if="whatsappShelterUrl"
              :href="whatsappShelterUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-success btn-sm"
              aria-label="Contactar por WhatsApp"
            >
              WhatsApp
            </a>
          </p>
          <p v-if="safeShelterEmail" class="mb-0">
            <span aria-hidden="true">✉</span>
            <a :href="`mailto:${safeShelterEmail}`">{{ safeShelterEmail }}</a>
          </p>
        </div>
      </div>

      <!-- ── Adoption request section (client-only) ───────────── -->
      <ClientOnly>
        <div class="card border-0 shadow-sm mb-4">
          <div class="card-body p-4">
            <!-- Already adopted -->
            <template v-if="listing.status === 'adopted'">
              <div class="text-center py-3">
                <span class="fs-2" aria-hidden="true">🏡</span>
                <h2 class="h5 fw-bold mt-3 mb-2">Esta mascota ya tiene un hogar</h2>
                <p class="text-muted mb-0">
                  Pero hay muchas más esperando. Explora otras mascotas disponibles.
                </p>
              </div>
            </template>

            <!-- In process (pending) -->
            <template v-else-if="listing.status === 'pending'">
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
            <template v-else-if="listing.status === 'available'">
              <h2 class="h5 fw-bold mb-1">Solicitar adopción</h2>
              <p class="text-muted small mb-4">
                Cuéntanos por qué quieres adoptar a {{ listing.name }} y cómo sería su nuevo hogar.
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

    <!-- Listing not found -->
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
        Explorar adopciones
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

  // ── Shelter info card ──────────────────────────────────
  &__shelter-card {
    background-color: var(--bs-light, #f8f9fa);
    border-left: 4px solid var(--bs-primary, #0d6efd) !important;
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
