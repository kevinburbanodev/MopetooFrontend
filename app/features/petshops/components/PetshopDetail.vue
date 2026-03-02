<script setup lang="ts">
// PetshopDetail — full petshop profile page.
// Fetches the petshop on mount via store-first lookup.
// Shows: hero banner, name + badges, location, contact, WhatsApp,
// description, and a products section.

import type { StoreProduct } from '../types'

const props = defineProps<{
  petshopId: string
}>()

const { fetchPetshopById, fetchStoreProducts, error, petshopsStore } = usePetshops()

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
const products = computed(() => petshopsStore.storeProducts)

const safeLogoUrl = computed(() =>
  isSafeImageUrl(petshop.value?.logo_url) ? petshop.value?.logo_url : null,
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

/** Composed phone: phone_country_code + phone */
const composedPhone = computed<string | null>(() => {
  const phone = petshop.value?.phone
  if (!phone) return null
  const code = petshop.value?.phone_country_code || ''
  const full = code ? `${code} ${phone}` : phone
  return /^[+\d\s\-().]{4,30}$/.test(full) ? full : null
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

/**
 * Sanitizes WhatsApp link: must be http/https URL.
 */
const safeWhatsappUrl = computed<string | null>(() => {
  const url = petshop.value?.whatsapp_link
  if (!url) return null
  try {
    const parsed = new URL(url)
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') ? url : null
  }
  catch {
    return null
  }
})

// ── Photo error handling ───────────────────────────────────
const imgError = ref(false)
const showPhoto = computed(() => !!safeLogoUrl.value && !imgError.value)

function onImgError(): void {
  imgError.value = true
}

// ── Product image safety ───────────────────────────────────
function safeProductImageUrl(url: string | undefined): string | null {
  return isSafeImageUrl(url) ? url! : null
}

// ── Category label for products ────────────────────────────
const categoryLabels: Record<string, string> = {
  alimento: 'Alimentos',
  accesorios: 'Accesorios',
  salud: 'Salud',
  juguetes: 'Juguetes',
  higiene: 'Higiene',
  otros: 'Otros',
}

function getCategoryLabel(category: string): string {
  return categoryLabels[category] ?? category
}

// ── Lifecycle ─────────────────────────────────────────────

onMounted(async () => {
  // Guard: validate the route param — must be a numeric ID.
  const numericId = Number(props.petshopId)
  if (Number.isNaN(numericId) || numericId <= 0) {
    return
  }

  // Clear stale selection from previous navigations
  petshopsStore.clearSelectedPetshop()
  petshopsStore.clearStoreProducts()
  await fetchPetshopById(numericId)
  await fetchStoreProducts(numericId)
})

onUnmounted(() => {
  petshopsStore.clearSelectedPetshop()
  petshopsStore.clearStoreProducts()
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
          :src="safeLogoUrl!"
          :alt="`Logo de la tienda ${petshop.name}`"
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
              v-if="petshop.plan !== ''"
              class="badge bg-warning text-dark align-self-center"
              aria-label="Tienda destacada"
            >
              Destacado
            </span>
            <span
              v-if="petshop.verified"
              class="badge bg-success align-self-center"
              aria-label="Tienda verificada por Mopetoo"
            >
              Verificado
            </span>
          </div>

          <!-- City + country -->
          <p class="text-muted mb-3">
            <span aria-hidden="true">📍</span>
            {{ petshop.city }}, {{ petshop.country }}
          </p>

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
            <div v-if="composedPhone" class="col-12 col-sm-6">
              <p class="text-muted small mb-1 text-uppercase fw-semibold" style="letter-spacing: 0.04em;">
                Teléfono
              </p>
              <a
                :href="`tel:${composedPhone}`"
                class="fw-semibold text-decoration-none text-body"
              >
                <span aria-hidden="true">📞</span> {{ composedPhone }}
              </a>
            </div>

            <!-- WhatsApp -->
            <div v-if="safeWhatsappUrl" class="col-12 col-sm-6">
              <p class="text-muted small mb-1 text-uppercase fw-semibold" style="letter-spacing: 0.04em;">
                WhatsApp
              </p>
              <a
                :href="safeWhatsappUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="fw-semibold text-decoration-none text-body"
                :aria-label="`WhatsApp de ${petshop.name}`"
              >
                <span aria-hidden="true">💬</span> Enviar mensaje
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

      <!-- Products section -->
      <div v-if="products.length > 0" class="card border-0 shadow-sm mb-4">
        <div class="card-body p-4">
          <h2 class="h5 fw-bold mb-3" aria-label="Productos de la tienda">
            <span aria-hidden="true">🛍️</span> Productos
          </h2>
          <div class="row g-3">
            <div
              v-for="product in products"
              :key="product.id"
              class="col-12 col-sm-6 col-md-4"
            >
              <div class="card h-100 border petshop-detail__product-card">
                <!-- Product photo -->
                <div v-if="safeProductImageUrl(product.photo_url)" class="petshop-detail__product-img-wrap">
                  <img
                    :src="safeProductImageUrl(product.photo_url)!"
                    :alt="product.name"
                    class="petshop-detail__product-img"
                    width="300"
                    height="200"
                  />
                </div>
                <div class="card-body p-3 d-flex flex-column gap-1">
                  <h3 class="h6 fw-semibold mb-0">{{ product.name }}</h3>
                  <span class="badge bg-primary-subtle text-primary-emphasis fw-normal align-self-start">
                    {{ getCategoryLabel(product.category) }}
                  </span>
                  <p v-if="product.description" class="text-muted small mb-0 petshop-detail__product-desc">
                    {{ product.description }}
                  </p>
                  <div class="d-flex align-items-center justify-content-between mt-auto pt-2">
                    <span class="fw-bold">${{ product.price.toFixed(2) }}</span>
                    <span
                      :class="product.is_available ? 'text-success' : 'text-muted'"
                      class="small fw-semibold"
                    >
                      {{ product.is_available ? 'Disponible' : 'No disponible' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
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

  // ── Product cards ─────────────────────────────────────────
  &__product-card {
    border-radius: var(--bs-border-radius);
    transition: box-shadow 0.15s ease;

    &:hover {
      box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.1);
    }
  }

  &__product-img-wrap {
    height: 140px;
    overflow: hidden;
    border-radius: var(--bs-border-radius) var(--bs-border-radius) 0 0;
    background-color: var(--bs-secondary-bg);
  }

  &__product-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__product-desc {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
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
