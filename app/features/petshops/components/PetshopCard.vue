<script setup lang="ts">
// PetshopCard — compact card for a single petshop in the directory.
// Shows: photo (with fallback), name, city/address, category chips,
// contact icons, and verified/featured badges.
// "Ver tienda" navigates to /stores/:id via a stretched-link.

import type { Petshop } from '../types'

const props = defineProps<{
  petshop: Petshop
}>()

// ── URL safety guard ──────────────────────────────────────
// Rejects javascript:, data:, vbscript: and other unexpected schemes.
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
  isSafeImageUrl(props.petshop.photo_url) ? props.petshop.photo_url : null,
)

// Reset img error when the petshop prop changes (e.g. list refresh)
const imgError = ref(false)
const showPhoto = computed(() => !!safePhotoUrl.value && !imgError.value)

function onImgError(): void {
  imgError.value = true
}

watch(() => props.petshop.photo_url, () => {
  imgError.value = false
})

// ── Contact safety guards ─────────────────────────────────

/**
 * Sanitizes phone: only digits, +, -, spaces, parens, and dots allowed.
 * Prevents tel: href injection.
 */
const safePhone = computed<string | null>(() => {
  const phone = props.petshop.phone
  if (!phone) return null
  return /^[+\d\s\-().]{4,25}$/.test(phone) ? phone : null
})

/**
 * Sanitizes email: must contain @ and no whitespace.
 * Prevents mailto: href injection.
 */
const safeEmail = computed<string | null>(() => {
  const email = props.petshop.email
  if (!email) return null
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
})

/**
 * Restricts website URL to http/https only.
 * Prevents javascript: URI injection.
 */
const safeWebsiteUrl = computed<string | null>(() => {
  const url = props.petshop.website
  if (!url) return null
  try {
    const parsed = new URL(url)
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') ? url : null
  }
  catch {
    return null
  }
})

// ── Category display — max 3 visible, overflow as "+N" ────
const MAX_VISIBLE_CATEGORIES = 3

const visibleCategories = computed(() =>
  props.petshop.categories.slice(0, MAX_VISIBLE_CATEGORIES),
)

const hiddenCategoryCount = computed(() =>
  Math.max(0, props.petshop.categories.length - MAX_VISIBLE_CATEGORIES),
)
</script>

<template>
  <article
    class="card h-100 border-0 shadow-sm petshop-card"
    :aria-label="`Tienda ${petshop.name}`"
  >
    <!-- Photo / fallback header -->
    <div class="petshop-card__photo-wrap">
      <img
        v-if="showPhoto"
        :src="safePhotoUrl!"
        :alt="`Foto de la tienda ${petshop.name}`"
        class="petshop-card__photo"
        width="400"
        height="200"
        @error="onImgError"
      />
      <div
        v-else
        class="petshop-card__fallback d-flex align-items-center justify-content-center"
        aria-hidden="true"
      >
        <span class="petshop-card__fallback-icon">🏪</span>
      </div>

      <!-- Badges overlaid on photo -->
      <div class="petshop-card__badges">
        <span
          v-if="petshop.is_featured"
          class="badge bg-warning text-dark petshop-card__badge"
          aria-label="Tienda destacada"
        >
          ⭐ Destacado
        </span>
        <span
          v-if="petshop.is_verified"
          class="badge bg-success petshop-card__badge"
          aria-label="Tienda verificada"
        >
          Verificado ✓
        </span>
      </div>
    </div>

    <div class="card-body d-flex flex-column gap-2 p-3">
      <!-- Name -->
      <h3 class="h6 fw-bold mb-0 petshop-card__name">{{ petshop.name }}</h3>

      <!-- City + address -->
      <p class="text-muted small mb-0 petshop-card__location">
        <span aria-hidden="true">📍</span>
        {{ petshop.address ? `${petshop.address}, ${petshop.city}` : petshop.city }}
      </p>

      <!-- Category chips — max 3 + overflow badge -->
      <div
        v-if="petshop.categories.length > 0"
        class="d-flex flex-wrap gap-1"
        aria-label="Categorías de la tienda"
      >
        <span
          v-for="cat in visibleCategories"
          :key="cat"
          class="badge bg-secondary bg-opacity-10 text-secondary fw-normal petshop-card__category"
        >
          {{ cat }}
        </span>
        <span
          v-if="hiddenCategoryCount > 0"
          class="badge bg-secondary bg-opacity-10 text-secondary fw-normal"
          :aria-label="`${hiddenCategoryCount} categorías más`"
        >
          +{{ hiddenCategoryCount }}
        </span>
      </div>

      <!-- Contact row: phone, email, website icons -->
      <div
        v-if="safePhone || safeEmail || safeWebsiteUrl"
        class="d-flex flex-wrap gap-3 mt-auto"
        aria-label="Información de contacto"
      >
        <a
          v-if="safePhone"
          :href="`tel:${safePhone}`"
          class="text-muted small text-decoration-none"
          :aria-label="`Llamar a ${petshop.name}`"
          @click.stop
        >
          <span aria-hidden="true">📞</span>
          <span class="visually-hidden">Teléfono</span>
        </a>
        <a
          v-if="safeEmail"
          :href="`mailto:${safeEmail}`"
          class="text-muted small text-decoration-none"
          :aria-label="`Enviar correo a ${petshop.name}`"
          @click.stop
        >
          <span aria-hidden="true">✉️</span>
          <span class="visually-hidden">Correo</span>
        </a>
        <a
          v-if="safeWebsiteUrl"
          :href="safeWebsiteUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="text-muted small text-decoration-none"
          :aria-label="`Visitar sitio web de ${petshop.name}`"
          @click.stop
        >
          <span aria-hidden="true">🌐</span>
          <span class="visually-hidden">Sitio web</span>
        </a>
      </div>
    </div>

    <!-- CTA footer with stretched-link so the whole card is clickable -->
    <div class="card-footer bg-transparent border-top-0 px-3 pb-3 pt-0">
      <NuxtLink
        :to="`/stores/${petshop.id}`"
        class="btn btn-primary btn-sm w-100 stretched-link"
        :aria-label="`Ver tienda ${petshop.name}`"
      >
        Ver tienda
      </NuxtLink>
    </div>
  </article>
</template>

<style scoped lang="scss">
.petshop-card {
  border-radius: var(--bs-border-radius-lg);
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.12) !important;
  }

  // ── Photo area ─────────────────────────────────────────────
  &__photo-wrap {
    position: relative;
    overflow: hidden;
    border-radius: var(--bs-border-radius-lg) var(--bs-border-radius-lg) 0 0;
    height: 160px;
    background-color: var(--bs-secondary-bg);
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
    background-color: #dff0e8; // brand-green tint
  }

  &__fallback-icon {
    font-size: 3rem;
    line-height: 1;
  }

  // ── Badges ─────────────────────────────────────────────────
  &__badges {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &__badge {
    font-size: 0.7rem;
    letter-spacing: 0.03em;
  }

  // ── Text clamping ──────────────────────────────────────────
  &__name {
    // 2-line clamp for long names
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__location {
    // 1-line truncation for address
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__category {
    // Ensure category badges wrap gracefully
    max-width: 8rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
