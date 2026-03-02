<script setup lang="ts">
// ClinicDetail — full clinic profile page.
// Fetches the clinic on mount via store-first lookup.
// Shows: hero banner, name + badges, specialties, services,
// address/country, contact info, social links, and schedules.

const props = defineProps<{
  clinicId: string
}>()

const { fetchClinicById, error, clinicsStore } = useClinics()

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

function isSafeUrl(url: string | undefined): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  }
  catch {
    return false
  }
}

const clinic = computed(() => clinicsStore.selectedClinic)

const safeCoverUrl = computed(() =>
  isSafeImageUrl(clinic.value?.cover_image_url) ? clinic.value?.cover_image_url : null,
)

/**
 * Sanitizes phone: only digits, +, -, spaces, parens, and dots.
 * Prevents tel: href injection.
 */
const safePhone = computed<string | null>(() => {
  const phone = clinic.value?.phone
  if (!phone) return null
  return /^[+\d\s\-().]{4,25}$/.test(phone) ? phone : null
})

/**
 * Sanitizes email: must contain @ and no whitespace.
 * Prevents mailto: href injection.
 */
const safeEmail = computed<string | null>(() => {
  const email = clinic.value?.email
  if (!email) return null
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
})

// ── Social media safety guards ────────────────────────────

const safeFacebookUrl = computed(() =>
  isSafeUrl(clinic.value?.facebook_url) ? clinic.value?.facebook_url : null,
)

const safeInstagramUrl = computed(() =>
  isSafeUrl(clinic.value?.instagram_url) ? clinic.value?.instagram_url : null,
)

const safeTwitterUrl = computed(() =>
  isSafeUrl(clinic.value?.twitter_url) ? clinic.value?.twitter_url : null,
)

const hasSocialLinks = computed(() =>
  !!safeFacebookUrl.value || !!safeInstagramUrl.value || !!safeTwitterUrl.value,
)

// ── Plan-based featured check ─────────────────────────────
const isFeatured = computed(() =>
  clinic.value != null && clinic.value.plan !== '' && clinic.value.plan !== 'free',
)

// ── Photo error handling ───────────────────────────────────
const imgError = ref(false)
const showPhoto = computed(() => !!safeCoverUrl.value && !imgError.value)

function onImgError(): void {
  imgError.value = true
}

// ── Location display ──────────────────────────────────────
const locationText = computed(() => {
  if (!clinic.value) return ''
  const parts: string[] = []
  if (clinic.value.address) parts.push(clinic.value.address)
  parts.push(clinic.value.city)
  parts.push(clinic.value.country)
  return parts.join(', ')
})

// ── Lifecycle ─────────────────────────────────────────────

onMounted(async () => {
  const numericId = Number(props.clinicId)
  if (Number.isNaN(numericId) || numericId <= 0) {
    return
  }

  // Clear stale selection from previous navigations
  clinicsStore.clearSelectedClinic()
  await fetchClinicById(numericId)
})

onUnmounted(() => {
  clinicsStore.clearSelectedClinic()
})
</script>

<template>
  <section aria-label="Detalle de clínica">
    <!-- Back navigation -->
    <div class="mb-4">
      <NuxtLink
        to="/clinics"
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
      v-if="clinicsStore.isLoading && !clinic"
      aria-busy="true"
      aria-label="Cargando clínica"
    >
      <div class="card border-0 shadow-sm mb-4" aria-hidden="true">
        <div class="clinic-detail-skeleton__banner skeleton-pulse" />
        <div class="card-body p-4">
          <div class="skeleton-pulse rounded mb-2 clinic-detail-skeleton__title" />
          <div class="skeleton-pulse rounded mb-3 clinic-detail-skeleton__subtitle" />
          <div class="d-flex gap-2 mb-3">
            <div class="skeleton-pulse rounded clinic-detail-skeleton__badge" />
            <div class="skeleton-pulse rounded clinic-detail-skeleton__badge" />
          </div>
          <div class="skeleton-pulse rounded mb-2 clinic-detail-skeleton__line" />
          <div class="skeleton-pulse rounded mb-2 clinic-detail-skeleton__line" />
          <div class="skeleton-pulse rounded clinic-detail-skeleton__line clinic-detail-skeleton__line--short" />
        </div>
      </div>
    </div>

    <!-- Clinic profile -->
    <template v-else-if="clinic">
      <!-- Hero banner — 16:9 aspect ratio with photo or gradient fallback -->
      <div class="clinic-detail__banner mb-4">
        <img
          v-if="showPhoto"
          :src="safeCoverUrl!"
          :alt="`Foto de la clínica ${clinic.name}`"
          class="clinic-detail__banner-img"
          width="1200"
          height="675"
          @error="onImgError"
        />
        <div
          v-else
          class="clinic-detail__banner-fallback d-flex align-items-center justify-content-center"
          aria-hidden="true"
        >
          <span class="clinic-detail__banner-icon">🏥</span>
        </div>
      </div>

      <!-- Profile card -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body p-4">
          <!-- Name + badges -->
          <div class="d-flex flex-wrap align-items-start gap-2 mb-2">
            <h1 class="h3 fw-bold mb-0">{{ clinic.name }}</h1>
            <span
              v-if="isFeatured"
              class="badge bg-warning text-dark align-self-center"
              aria-label="Clínica destacada"
            >
              Destacado
            </span>
            <span
              v-if="clinic.verified"
              class="badge bg-success align-self-center"
              aria-label="Clínica verificada por Mopetoo"
            >
              Verificado
            </span>
          </div>

          <!-- Location -->
          <p class="text-muted mb-3">
            <span aria-hidden="true">📍</span>
            {{ locationText }}
          </p>

          <!-- Specialty chips -->
          <div
            v-if="clinic.specialties.length > 0"
            class="d-flex flex-wrap gap-2 mb-4"
            aria-label="Especialidades"
          >
            <span
              v-for="spec in clinic.specialties"
              :key="spec"
              class="badge bg-primary-subtle text-primary-emphasis fs-6 fw-normal px-3 py-2"
            >
              {{ spec }}
            </span>
          </div>

          <!-- Description -->
          <div v-if="clinic.description" class="mb-4">
            <h2
              class="h6 fw-bold text-muted text-uppercase mb-2"
              style="letter-spacing: 0.05em;"
            >
              Acerca de la clínica
            </h2>
            <!-- Not v-html — content is rendered as plain text to prevent XSS -->
            <p class="mb-0" style="white-space: pre-line;">{{ clinic.description }}</p>
          </div>

          <!-- Services section -->
          <div v-if="clinic.services && clinic.services.length > 0" class="mb-4">
            <h2
              class="h6 fw-bold text-muted text-uppercase mb-2"
              style="letter-spacing: 0.05em;"
            >
              Servicios
            </h2>
            <div class="d-flex flex-wrap gap-2" aria-label="Servicios de la clínica">
              <span
                v-for="service in clinic.services"
                :key="service"
                class="badge bg-info-subtle text-info-emphasis fw-normal px-3 py-2"
              >
                {{ service }}
              </span>
            </div>
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
          </div>

          <!-- Social media links -->
          <div v-if="hasSocialLinks" class="mt-3">
            <p class="text-muted small mb-2 text-uppercase fw-semibold" style="letter-spacing: 0.04em;">
              Redes sociales
            </p>
            <div class="d-flex flex-wrap gap-3">
              <a
                v-if="safeFacebookUrl"
                :href="safeFacebookUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="fw-semibold text-decoration-none"
                :aria-label="`Facebook de ${clinic.name}`"
              >
                <span aria-hidden="true">📘</span> Facebook
              </a>
              <a
                v-if="safeInstagramUrl"
                :href="safeInstagramUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="fw-semibold text-decoration-none"
                :aria-label="`Instagram de ${clinic.name}`"
              >
                <span aria-hidden="true">📷</span> Instagram
              </a>
              <a
                v-if="safeTwitterUrl"
                :href="safeTwitterUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="fw-semibold text-decoration-none"
                :aria-label="`Twitter de ${clinic.name}`"
              >
                <span aria-hidden="true">🐦</span> Twitter
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Schedules card -->
      <div v-if="clinic.schedules" class="card border-0 shadow-sm mb-4">
        <div class="card-body p-4">
          <h2 class="h5 fw-bold mb-3">
            <span aria-hidden="true">🕐</span> Horarios de atención
          </h2>
          <p class="mb-0" style="white-space: pre-line;">{{ clinic.schedules }}</p>
        </div>
      </div>
    </template>

    <!-- Clinic not found -->
    <div
      v-else-if="!clinicsStore.isLoading"
      class="text-center py-5"
    >
      <div class="fs-1" aria-hidden="true">🏥</div>
      <h2 class="h5 fw-bold mt-4 mb-2">Clínica no encontrada</h2>
      <p class="text-muted mb-4">
        La clínica que buscas no existe o ya no está disponible.
      </p>
      <NuxtLink to="/clinics" class="btn btn-primary">
        Volver al directorio
      </NuxtLink>
    </div>
  </section>
</template>

<style scoped lang="scss">
// ── Banner / hero — 16:9 aspect ratio ─────────────────────────
.clinic-detail {
  &__banner {
    position: relative;
    overflow: hidden;
    border-radius: var(--bs-border-radius-lg);
    // 16:9 intrinsic ratio via aspect-ratio property
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

.clinic-detail-skeleton {
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
