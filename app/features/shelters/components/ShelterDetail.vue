<script setup lang="ts">
// ShelterDetail — full shelter profile with adoption pet list.
// Fetches the shelter and its adoption pets on mount.
// Embeds AdoptionList for the pets section.

const props = defineProps<{
  shelterId: string
}>()

const { fetchShelterById, fetchAdoptionPets, error, sheltersStore } = useShelters()

// ── Species display map ────────────────────────────────────
const SPECIES_EMOJI: Record<string, string> = {
  dogs: '🐕',
  cats: '🐱',
  birds: '🦜',
  rabbits: '🐰',
  other: '🐾',
}

const SPECIES_LABEL: Record<string, string> = {
  dogs: 'Perros',
  cats: 'Gatos',
  birds: 'Aves',
  rabbits: 'Conejos',
  other: 'Otros',
}

function getSpeciesEmoji(s: string): string {
  return SPECIES_EMOJI[s] ?? '🐾'
}

function getSpeciesLabel(s: string): string {
  return SPECIES_LABEL[s] ?? s
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

const shelter = computed(() => sheltersStore.selectedShelter)
const safePhotoUrl = computed(() =>
  isSafeImageUrl(shelter.value?.photo_url) ? shelter.value?.photo_url : null,
)

/**
 * Restricts website URL to http/https only — prevents javascript: URI injection.
 * (HIGH — security fix)
 */
const safeWebsiteUrl = computed<string | null>(() => {
  const url = shelter.value?.website
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
 * Sanitizes phone: only digits, +, -, spaces, and parentheses allowed.
 * (MEDIUM — prevents tel: href injection)
 */
const safePhone = computed<string | null>(() => {
  const phone = shelter.value?.phone
  if (!phone) return null
  return /^[+\d\s\-().]{4,25}$/.test(phone) ? phone : null
})

/**
 * Sanitizes email: must contain @ and no whitespace.
 * (MEDIUM — prevents mailto: href injection)
 */
const safeEmail = computed<string | null>(() => {
  const email = shelter.value?.email
  if (!email) return null
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
})

const imgError = ref(false)
const showPhoto = computed(() => !!safePhotoUrl.value && !imgError.value)

function onImgError(): void {
  imgError.value = true
}

onMounted(async () => {
  // Clear stale selection from previous navigations
  sheltersStore.clearSelectedShelter()
  await fetchShelterById(props.shelterId)
  await fetchAdoptionPets(props.shelterId)
})
</script>

<template>
  <section aria-label="Detalle de refugio">
    <!-- Back navigation -->
    <div class="mb-4">
      <NuxtLink
        to="/shelter"
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

    <!-- Loading skeleton — shelter profile -->
    <div v-if="sheltersStore.isLoading && !shelter" aria-busy="true" aria-label="Cargando refugio">
      <div class="card border-0 shadow-sm mb-4" aria-hidden="true">
        <div class="shelter-detail-skeleton__banner skeleton-pulse" />
        <div class="card-body p-4">
          <div class="skeleton-pulse rounded mb-2 shelter-detail-skeleton__title" />
          <div class="skeleton-pulse rounded mb-3 shelter-detail-skeleton__subtitle" />
          <div class="d-flex gap-2 mb-3">
            <div class="skeleton-pulse rounded shelter-detail-skeleton__badge" />
            <div class="skeleton-pulse rounded shelter-detail-skeleton__badge" />
          </div>
          <div class="skeleton-pulse rounded mb-2 shelter-detail-skeleton__line" />
          <div class="skeleton-pulse rounded mb-2 shelter-detail-skeleton__line" />
          <div class="skeleton-pulse rounded shelter-detail-skeleton__line shelter-detail-skeleton__line--short" />
        </div>
      </div>
    </div>

    <!-- Shelter profile -->
    <template v-else-if="shelter">
      <!-- Banner / hero photo -->
      <div class="shelter-detail__banner mb-4">
        <img
          v-if="showPhoto"
          :src="safePhotoUrl!"
          :alt="`Foto del refugio ${shelter.name}`"
          class="shelter-detail__banner-img"
          width="1200"
          height="400"
          @error="onImgError"
        />
        <div
          v-else
          class="shelter-detail__banner-fallback d-flex align-items-center justify-content-center"
          aria-hidden="true"
        >
          <span class="shelter-detail__banner-icon">🏠</span>
        </div>
      </div>

      <!-- Profile card -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body p-4">
          <!-- Name + verified badge -->
          <div class="d-flex flex-wrap align-items-start gap-2 mb-1">
            <h1 class="h3 fw-bold mb-0">{{ shelter.name }}</h1>
            <span
              v-if="shelter.is_verified"
              class="badge bg-success align-self-center"
              aria-label="Refugio verificado por Mopetoo"
            >
              Verificado
            </span>
          </div>

          <!-- Location -->
          <p class="text-muted mb-3">
            <span aria-hidden="true">📍</span>
            {{ shelter.address ? `${shelter.address}, ${shelter.city}` : shelter.city }}
          </p>

          <!-- Species accepted -->
          <div
            v-if="shelter.species.length > 0"
            class="d-flex flex-wrap gap-2 mb-4"
            aria-label="Especies aceptadas"
          >
            <span
              v-for="s in shelter.species"
              :key="s"
              class="badge bg-primary-subtle text-primary-emphasis fs-6 fw-normal px-3 py-2"
            >
              <span aria-hidden="true">{{ getSpeciesEmoji(s) }}</span>
              {{ getSpeciesLabel(s) }}
            </span>
          </div>

          <!-- Description -->
          <div v-if="shelter.description" class="mb-4">
            <h2 class="h6 fw-bold text-muted text-uppercase mb-2" style="letter-spacing: 0.05em;">
              Acerca del refugio
            </h2>
            <p class="mb-0" style="white-space: pre-line;">{{ shelter.description }}</p>
          </div>

          <!-- Contact info -->
          <div class="row g-3">
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
                <span aria-hidden="true">🌐</span> {{ shelter.website }}
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Adoption pets section -->
      <div class="mb-2">
        <h2 class="h4 fw-bold mb-1">Mascotas en adopción</h2>
        <p class="text-muted small mb-4">
          Conoce a los animales que buscan un hogar en este refugio.
        </p>
        <AdoptionList :shelter-id="shelterId" />
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
      <NuxtLink to="/shelter" class="btn btn-primary">
        Volver al directorio
      </NuxtLink>
    </div>
  </section>
</template>

<style scoped lang="scss">
// ── Banner / hero ─────────────────────────────────────────────
.shelter-detail {
  &__banner {
    position: relative;
    overflow: hidden;
    border-radius: var(--bs-border-radius-lg);
    height: 260px;
    background-color: var(--bs-secondary-bg);

    @media (min-width: 768px) {
      height: 340px;
    }
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
    background-color: #dff0e8;
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

.shelter-detail-skeleton {
  &__banner {
    height: 260px;
    border-radius: var(--bs-border-radius-lg) var(--bs-border-radius-lg) 0 0;
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
