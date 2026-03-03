<script setup lang="ts">
// ShelterDetail — full shelter profile page.
// Fetches the shelter on mount and shows its adoption listings.

const props = defineProps<{
  shelterId: string
}>()

const { fetchShelterById, fetchAdoptionListings, error, sheltersStore } = useShelters()

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

const shelter = computed(() => sheltersStore.selectedShelter)

const safeLogoUrl = computed(() =>
  isSafeImageUrl(shelter.value?.logo_url) ? shelter.value?.logo_url : null,
)

const imgError = ref(false)
const showLogo = computed(() => !!safeLogoUrl.value && !imgError.value)

function onImgError(): void {
  imgError.value = true
}

// ── Contact safety guards ─────────────────────────────────

const safePhone = computed<string | null>(() => {
  const phone = shelter.value?.phone
  if (!phone) return null
  return /^[+\d\s\-().]{4,25}$/.test(phone) ? phone : null
})

const safeEmail = computed<string | null>(() => {
  const email = shelter.value?.email
  if (!email) return null
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
})

const safeWebsite = computed<string | null>(() =>
  isSafeUrl(shelter.value?.website) ? shelter.value?.website ?? null : null,
)

/**
 * WhatsApp URL combining phone_country_code + phone → digits for wa.me.
 */
const whatsappUrl = computed<string | null>(() => {
  const code = shelter.value?.phone_country_code
  const phone = shelter.value?.phone
  if (!code || !phone) return null
  const digits = (code + phone).replace(/[^\d]/g, '')
  if (digits.length < 4) return null
  return `https://wa.me/${digits}`
})

/**
 * Google Maps embed URL using the shelter address.
 */
const mapsEmbedUrl = computed<string | null>(() => {
  const address = shelter.value?.address
  if (!address) return null
  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`
})

// ── Shelter's adoption listings ──────────────────────────

const shelterListings = computed(() => {
  if (!shelter.value) return []
  return sheltersStore.adoptionListings.filter(l => l.shelter_id === shelter.value!.id)
})

// ── Lifecycle ─────────────────────────────────────────────

onMounted(async () => {
  const numericId = Number(props.shelterId)
  if (Number.isNaN(numericId) || numericId <= 0) {
    return
  }

  sheltersStore.clearSelectedShelter()
  await fetchShelterById(numericId)
  // Also fetch adoption listings so we can show this shelter's pets
  if (sheltersStore.adoptionListings.length === 0) {
    await fetchAdoptionListings()
  }
})

onUnmounted(() => {
  sheltersStore.clearSelectedShelter()
})
</script>

<template>
  <section aria-label="Detalle de refugio">
    <!-- Back navigation -->
    <div class="mb-4">
      <NuxtLink
        to="/shelters"
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
      v-if="sheltersStore.isLoading && !shelter"
      aria-busy="true"
      aria-label="Cargando refugio"
    >
      <div class="card border-0 shadow-sm mb-4" aria-hidden="true">
        <div class="card-body p-4">
          <div class="skeleton-pulse rounded mb-2 shelter-detail-skeleton__title" />
          <div class="skeleton-pulse rounded mb-3 shelter-detail-skeleton__subtitle" />
          <div class="skeleton-pulse rounded mb-2 shelter-detail-skeleton__line" />
          <div class="skeleton-pulse rounded mb-2 shelter-detail-skeleton__line" />
          <div class="skeleton-pulse rounded shelter-detail-skeleton__line shelter-detail-skeleton__line--short" />
        </div>
      </div>
    </div>

    <!-- Shelter profile -->
    <template v-else-if="shelter">
      <!-- Profile card -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body p-4">
          <!-- Logo + name row -->
          <div class="d-flex align-items-start gap-3 mb-3">
            <div class="shelter-detail__logo-wrap">
              <img
                v-if="showLogo"
                :src="safeLogoUrl!"
                :alt="`Logo de ${shelter.organization_name}`"
                class="shelter-detail__logo"
                width="80"
                height="80"
                @error="onImgError"
              />
              <div
                v-else
                class="shelter-detail__logo-fallback d-flex align-items-center justify-content-center"
                aria-hidden="true"
              >
                <span class="fs-1">🏠</span>
              </div>
            </div>
            <div>
              <div class="d-flex flex-wrap align-items-start gap-2 mb-1">
                <h1 class="h3 fw-bold mb-0">{{ shelter.organization_name }}</h1>
                <span
                  v-if="shelter.verified"
                  class="badge bg-success align-self-center"
                  aria-label="Refugio verificado por Mopetoo"
                >
                  Verificado
                </span>
              </div>
              <p class="text-muted mb-0">
                <span aria-hidden="true">📍</span>
                {{ shelter.city }}, {{ shelter.country }}
              </p>
            </div>
          </div>

          <!-- Description -->
          <div v-if="shelter.description" class="mb-4">
            <h2
              class="h6 fw-bold text-muted text-uppercase mb-2"
              style="letter-spacing: 0.05em;"
            >
              Acerca del refugio
            </h2>
            <p class="mb-0" style="white-space: pre-line;">{{ shelter.description }}</p>
          </div>

          <!-- Contact section -->
          <h2
            class="h6 fw-bold text-muted text-uppercase mb-3"
            style="letter-spacing: 0.05em;"
          >
            Contacto
          </h2>
          <div class="row g-3 mb-2">
            <div v-if="safePhone" class="col-12 col-sm-6">
              <p class="text-muted small mb-1 text-uppercase fw-semibold" style="letter-spacing: 0.04em;">
                Teléfono
              </p>
              <div class="d-flex align-items-center gap-2">
                <a
                  :href="`tel:${safePhone}`"
                  class="fw-semibold text-decoration-none text-body"
                >
                  <span aria-hidden="true">📞</span> {{ safePhone }}
                </a>
                <a
                  v-if="whatsappUrl"
                  :href="whatsappUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn btn-success btn-sm"
                  aria-label="Contactar por WhatsApp"
                >
                  WhatsApp
                </a>
              </div>
            </div>

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

          <div v-if="safeWebsite" class="mt-3">
            <p class="text-muted small mb-1 text-uppercase fw-semibold" style="letter-spacing: 0.04em;">
              Sitio web
            </p>
            <a
              :href="safeWebsite"
              target="_blank"
              rel="noopener noreferrer"
              class="fw-semibold text-decoration-none"
            >
              <span aria-hidden="true">🌐</span> {{ safeWebsite }}
            </a>
          </div>

          <!-- Location / Google Maps -->
          <div v-if="shelter.address" class="mt-4">
            <h2
              class="h6 fw-bold text-muted text-uppercase mb-3"
              style="letter-spacing: 0.05em;"
            >
              Ubicación
            </h2>
            <p class="mb-2">
              <span aria-hidden="true">📍</span> {{ shelter.address }}
            </p>
            <div class="shelter-detail__map-wrap">
              <iframe
                v-if="mapsEmbedUrl"
                :src="mapsEmbedUrl"
                width="100%"
                height="300"
                style="border: 0; border-radius: var(--bs-border-radius-lg);"
                allowfullscreen
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
                :title="`Mapa de ${shelter.organization_name}`"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Shelter's adoption listings -->
      <div v-if="shelterListings.length > 0" class="mb-4">
        <h2 class="h5 fw-bold mb-3">
          <span aria-hidden="true">🐾</span> Sus mascotas en adopción
        </h2>
        <div class="row g-4">
          <div
            v-for="listing in shelterListings"
            :key="listing.id"
            class="col-12 col-md-6 col-lg-4"
          >
            <AdoptionPetCard :listing="listing" />
          </div>
        </div>
      </div>
    </template>

    <!-- Shelter not found -->
    <div
      v-else-if="!sheltersStore.isLoading"
      class="text-center py-5"
    >
      <div class="fs-1" aria-hidden="true">🏠</div>
      <h2 class="h5 fw-bold mt-4 mb-2">Refugio no encontrado</h2>
      <p class="text-muted mb-4">
        El refugio que buscas no existe o ya no está disponible.
      </p>
      <NuxtLink to="/shelters" class="btn btn-primary">
        Volver al directorio
      </NuxtLink>
    </div>
  </section>
</template>

<style scoped lang="scss">
.shelter-detail {
  &__logo-wrap {
    width: 80px;
    height: 80px;
    border-radius: var(--bs-border-radius-lg);
    overflow: hidden;
    flex-shrink: 0;
    background-color: var(--bs-secondary-bg);
  }

  &__logo {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__logo-fallback {
    width: 100%;
    height: 100%;
    background-color: #dff0e8;
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

.shelter-detail-skeleton {
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

    &--short { width: 70%; }
  }
}
</style>
