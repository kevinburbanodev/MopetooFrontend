<script setup lang="ts">
// PetshopDetail — full petshop profile page.
// Fetches the petshop on mount via store-first lookup.
// Shows: hero banner, name + badges, categories, address, contact,
// business hours table, and a coordinates card when lat/lng are present.

import type { PetshopHours } from '../types'

const props = defineProps<{
  petshopId: string
}>()

const { fetchPetshopById, error, petshopsStore } = usePetshops()

// ── URL safety guards ──────────────────────────────────────

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

const petshop = computed(() => petshopsStore.selectedPetshop)

const safePhotoUrl = computed(() =>
  isSafeImageUrl(petshop.value?.photo_url) ? petshop.value?.photo_url : null,
)

/**
 * Restricts website URL to http/https only.
 * Prevents javascript: URI injection. (HIGH — security)
 */
const safeWebsiteUrl = computed<string | null>(() => {
  const url = petshop.value?.website
  if (!url) return null
  try {
    const parsed = new URL(url)
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') ? url : null
  }
  catch {
    return null
  }
})

/**
 * Sanitizes phone: only digits, +, -, spaces, parens, and dots.
 * Prevents tel: href injection. (MEDIUM — security)
 */
const safePhone = computed<string | null>(() => {
  const phone = petshop.value?.phone
  if (!phone) return null
  return /^[+\d\s\-().]{4,25}$/.test(phone) ? phone : null
})

/**
 * Sanitizes email: must contain @ and no whitespace.
 * Prevents mailto: href injection. (MEDIUM — security)
 */
const safeEmail = computed<string | null>(() => {
  const email = petshop.value?.email
  if (!email) return null
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
})

// ── Photo error handling ───────────────────────────────────
const imgError = ref(false)
const showPhoto = computed(() => !!safePhotoUrl.value && !imgError.value)

function onImgError(): void {
  imgError.value = true
}

// ── Business hours table ───────────────────────────────────

interface HoursRow {
  day: string
  key: keyof PetshopHours
}

const HOURS_ROWS: HoursRow[] = [
  { day: 'Lunes', key: 'monday' },
  { day: 'Martes', key: 'tuesday' },
  { day: 'Miércoles', key: 'wednesday' },
  { day: 'Jueves', key: 'thursday' },
  { day: 'Viernes', key: 'friday' },
  { day: 'Sábado', key: 'saturday' },
  { day: 'Domingo', key: 'sunday' },
]

function getHours(key: keyof PetshopHours): string {
  return petshop.value?.hours?.[key] ?? 'Cerrado'
}

// Whether the hours object has any non-empty value
const hasHoursData = computed(() => {
  const hours = petshop.value?.hours
  if (!hours) return false
  return Object.values(hours).some(v => v && v.trim() !== '')
})

// ── Map availability ───────────────────────────────────────
const hasCoordinates = computed(() =>
  petshop.value?.latitude != null && petshop.value?.longitude != null,
)

// ── Lifecycle ─────────────────────────────────────────────

onMounted(async () => {
  // Guard: validate the route param before using it in an API path.
  // Prevents path traversal via malformed IDs.
  if (!/^[\w-]{1,64}$/.test(props.petshopId)) {
    return
  }

  // Clear stale selection from previous navigations
  petshopsStore.clearSelectedPetshop()
  await fetchPetshopById(props.petshopId)
})

onUnmounted(() => {
  petshopsStore.clearSelectedPetshop()
})
</script>

<template>
  <section aria-label="Detalle de tienda">
    <!-- Back navigation -->
    <div class="mb-4">
      <NuxtLink
        to="/stores"
        class="btn btn-sm btn-link p-0 text-muted text-decoration-none"
      >
        &larr; Volver al directorio
      </NuxtLink>
    </div>

    <!-- Error alert -->
    <div
      v-if="error"
      class="alert alert-danger d-flex align-items-center gap-2 mb-4"
      role="alert"
    >
      <span aria-hidden="true">⚠</span>
      {{ error }}
    </div>

    <!-- Loading skeleton -->
    <div
      v-if="petshopsStore.isLoading && !petshop"
      aria-busy="true"
      aria-label="Cargando tienda"
    >
      <div class="card border-0 shadow-sm mb-4" aria-hidden="true">
        <div class="petshop-detail-skeleton__banner skeleton-pulse" />
        <div class="card-body p-4">
          <div class="skeleton-pulse rounded mb-2 petshop-detail-skeleton__title" />
          <div class="skeleton-pulse rounded mb-3 petshop-detail-skeleton__subtitle" />
          <div class="d-flex gap-2 mb-3">
            <div class="skeleton-pulse rounded petshop-detail-skeleton__badge" />
            <div class="skeleton-pulse rounded petshop-detail-skeleton__badge" />
          </div>
          <div class="skeleton-pulse rounded mb-2 petshop-detail-skeleton__line" />
          <div class="skeleton-pulse rounded mb-2 petshop-detail-skeleton__line" />
          <div class="skeleton-pulse rounded petshop-detail-skeleton__line petshop-detail-skeleton__line--short" />
        </div>
      </div>
    </div>

    <!-- Petshop profile -->
    <template v-else-if="petshop">
      <!-- Hero banner — 16:9 aspect ratio with photo or gradient fallback -->
      <div class="petshop-detail__banner mb-4">
        <img
          v-if="showPhoto"
          :src="safePhotoUrl!"
          :alt="`Foto de la tienda ${petshop.name}`"
          class="petshop-detail__banner-img"
          width="1200"
          height="675"
          @error="onImgError"
        />
        <div
          v-else
          class="petshop-detail__banner-fallback d-flex align-items-center justify-content-center"
          aria-hidden="true"
        >
          <span class="petshop-detail__banner-icon">🏪</span>
        </div>
      </div>

      <!-- Profile card -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body p-4">
          <!-- Name + badges -->
          <div class="d-flex flex-wrap align-items-start gap-2 mb-2">
            <h1 class="h3 fw-bold mb-0">{{ petshop.name }}</h1>
            <span
              v-if="petshop.is_featured"
              class="badge bg-warning text-dark align-self-center"
              aria-label="Tienda destacada"
            >
              ⭐ Destacado
            </span>
            <span
              v-if="petshop.is_verified"
              class="badge bg-success align-self-center"
              aria-label="Tienda verificada por Mopetoo"
            >
              Verificado ✓
            </span>
          </div>

          <!-- Address + city -->
          <p class="text-muted mb-3">
            <span aria-hidden="true">📍</span>
            {{ petshop.address ? `${petshop.address}, ${petshop.city}` : petshop.city }}
          </p>

          <!-- Category chips -->
          <div
            v-if="petshop.categories.length > 0"
            class="d-flex flex-wrap gap-2 mb-4"
            aria-label="Categorías"
          >
            <span
              v-for="cat in petshop.categories"
              :key="cat"
              class="badge bg-primary-subtle text-primary-emphasis fs-6 fw-normal px-3 py-2"
            >
              {{ cat }}
            </span>
          </div>

          <!-- Description -->
          <div v-if="petshop.description" class="mb-4">
            <h2
              class="h6 fw-bold text-muted text-uppercase mb-2"
              style="letter-spacing: 0.05em;"
            >
              Acerca de la tienda
            </h2>
            <!-- Not v-html — content is rendered as plain text to prevent XSS -->
            <p class="mb-0" style="white-space: pre-line;">{{ petshop.description }}</p>
          </div>

          <!-- Contact section -->
          <h2
            class="h6 fw-bold text-muted text-uppercase mb-3"
            style="letter-spacing: 0.05em;"
          >
            Contacto
          </h2>
          <div class="row g-3 mb-2">
            <!-- Phone -->
            <div v-if="safePhone" class="col-12 col-sm-6">
              <p class="text-muted small mb-1 text-uppercase fw-semibold" style="letter-spacing: 0.04em;">
                Teléfono
              </p>
              <a
                :href="`tel:${safePhone}`"
                class="fw-semibold text-decoration-none text-body"
              >
                <span aria-hidden="true">📞</span> {{ safePhone }}
              </a>
            </div>

            <!-- Email -->
            <div v-if="safeEmail" class="col-12 col-sm-6">
              <p class="text-muted small mb-1 text-uppercase fw-semibold" style="letter-spacing: 0.04em;">
                Correo electrónico
              </p>
              <a
                :href="`mailto:${safeEmail}`"
                class="fw-semibold text-decoration-none text-body"
              >
                <span aria-hidden="true">✉️</span> {{ safeEmail }}
              </a>
            </div>

            <!-- Website — only rendered when safeWebsiteUrl passes http/https check -->
            <div v-if="safeWebsiteUrl" class="col-12">
              <p class="text-muted small mb-1 text-uppercase fw-semibold" style="letter-spacing: 0.04em;">
                Sitio web
              </p>
              <a
                :href="safeWebsiteUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="fw-semibold"
              >
                <span aria-hidden="true">🌐</span> {{ petshop.website }}
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Business hours card -->
      <div v-if="hasHoursData" class="card border-0 shadow-sm mb-4">
        <div class="card-body p-4">
          <h2 class="h5 fw-bold mb-3">
            <span aria-hidden="true">🕐</span> Horarios de atención
          </h2>
          <table class="table table-borderless table-sm mb-0 petshop-detail__hours-table">
            <tbody>
              <tr
                v-for="row in HOURS_ROWS"
                :key="row.key"
                :class="{ 'petshop-detail__hours-row--closed': getHours(row.key) === 'Cerrado' }"
              >
                <th scope="row" class="fw-semibold ps-0" style="width: 35%;">
                  {{ row.day }}
                </th>
                <td
                  :class="getHours(row.key) === 'Cerrado' ? 'text-muted fst-italic' : 'fw-medium'"
                >
                  {{ getHours(row.key) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Map placeholder — shown only when coordinates are present -->
      <div v-if="hasCoordinates" class="card border-0 shadow-sm mb-4">
        <div class="card-body p-4">
          <h2 class="h5 fw-bold mb-3">
            <span aria-hidden="true">🗺️</span> Ubicación
          </h2>
          <div class="petshop-detail__map-placeholder d-flex flex-column align-items-center justify-content-center gap-2 rounded">
            <span class="fs-1" aria-hidden="true">📍</span>
            <p class="text-muted small mb-1">
              {{ petshop.latitude?.toFixed(6) }}, {{ petshop.longitude?.toFixed(6) }}
            </p>
            <p class="text-muted small mb-0 fst-italic">
              Mapa disponible próximamente
            </p>
          </div>
        </div>
      </div>
    </template>

    <!-- Petshop not found -->
    <div
      v-else-if="!petshopsStore.isLoading"
      class="text-center py-5"
    >
      <div class="fs-1" aria-hidden="true">🏪</div>
      <h2 class="h5 fw-bold mt-4 mb-2">Tienda no encontrada</h2>
      <p class="text-muted mb-4">
        La tienda que buscas no existe o ya no está disponible.
      </p>
      <NuxtLink to="/stores" class="btn btn-primary">
        Volver al directorio
      </NuxtLink>
    </div>
  </section>
</template>

<style scoped lang="scss">
// ── Banner / hero — 16:9 aspect ratio ─────────────────────────
.petshop-detail {
  &__banner {
    position: relative;
    overflow: hidden;
    border-radius: var(--bs-border-radius-lg);
    // 16:9 intrinsic ratio via padding-top trick
    aspect-ratio: 16 / 9;
    max-height: 400px;
    background-color: var(--bs-secondary-bg);
  }

  &__banner-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__banner-fallback {
    width: 100%;
    height: 100%;
    // Gradient fallback matching brand green
    background: linear-gradient(135deg, #dff0e8 0%, #b8dfc9 100%);
  }

  &__banner-icon {
    font-size: 5rem;
    line-height: 1;
  }

  // ── Hours table ───────────────────────────────────────────
  &__hours-table {
    th, td {
      padding-top: 0.35rem;
      padding-bottom: 0.35rem;
      vertical-align: middle;
    }
  }

  &__hours-row--closed {
    opacity: 0.6;
  }

  // ── Map placeholder ───────────────────────────────────────
  &__map-placeholder {
    background-color: var(--bs-secondary-bg);
    border: 2px dashed var(--bs-border-color);
    min-height: 140px;
    padding: 2rem;
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

.petshop-detail-skeleton {
  &__banner {
    height: 260px;
    border-radius: var(--bs-border-radius-lg) var(--bs-border-radius-lg) 0 0;

    @media (min-width: 768px) {
      height: 340px;
    }
  }

  &__title {
    height: 1.5rem;
    width: 55%;
  }

  &__subtitle {
    height: 0.875rem;
    width: 35%;
  }

  &__badge {
    height: 1.5rem;
    width: 5rem;
    border-radius: var(--bs-border-radius-pill) !important;
  }

  &__line {
    height: 0.875rem;
    width: 100%;

    &--short { width: 70%; }
  }
}
</style>
