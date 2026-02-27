<script setup lang="ts">
// ShelterCard — compact card for a single shelter in the directory.
// Shows: photo (with emoji fallback), name, city, truncated description,
// species badges, and a verified checkmark.
// "Ver refugio" navigates to /shelter/:id.

import type { Shelter } from '../types'

const props = defineProps<{
  shelter: Shelter
}>()

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
  isSafeImageUrl(props.shelter.photo_url) ? props.shelter.photo_url : null,
)

// Fall back to emoji when the image fails to load
const imgError = ref(false)
const showPhoto = computed(() => !!safePhotoUrl.value && !imgError.value)

function onImgError(): void {
  imgError.value = true
}

watch(() => props.shelter.photo_url, () => {
  imgError.value = false
})
</script>

<template>
  <article
    class="card h-100 border-0 shadow-sm shelter-card"
    :aria-label="`Refugio ${shelter.name}`"
  >
    <!-- Photo / fallback header -->
    <div class="shelter-card__photo-wrap">
      <img
        v-if="showPhoto"
        :src="safePhotoUrl!"
        :alt="`Foto del refugio ${shelter.name}`"
        class="shelter-card__photo"
        width="400"
        height="200"
        @error="onImgError"
      />
      <div
        v-else
        class="shelter-card__fallback d-flex align-items-center justify-content-center"
        aria-hidden="true"
      >
        <span class="shelter-card__fallback-icon">🏠</span>
      </div>

      <!-- Verified badge — overlaid on photo -->
      <span
        v-if="shelter.is_verified"
        class="badge bg-success shelter-card__verified"
        aria-label="Refugio verificado"
      >
        Verificado
      </span>
    </div>

    <div class="card-body d-flex flex-column gap-2 p-3">
      <!-- Name + city -->
      <div>
        <h3 class="h6 fw-bold mb-0 shelter-card__name">{{ shelter.name }}</h3>
        <p class="text-muted small mb-0">
          <span aria-hidden="true">📍</span> {{ shelter.city }}
        </p>
      </div>

      <!-- Description — 2-line clamp -->
      <p
        v-if="shelter.description"
        class="shelter-card__description text-body small mb-0"
      >
        {{ shelter.description }}
      </p>

      <!-- Species accepted -->
      <div
        v-if="shelter.species.length > 0"
        class="d-flex flex-wrap gap-1"
        aria-label="Especies aceptadas"
      >
        <span
          v-for="s in shelter.species"
          :key="s"
          class="badge bg-primary-subtle text-primary-emphasis fw-normal"
          :title="getSpeciesLabel(s)"
        >
          <span aria-hidden="true">{{ getSpeciesEmoji(s) }}</span>
          {{ getSpeciesLabel(s) }}
        </span>
      </div>
    </div>

    <!-- CTA footer -->
    <div class="card-footer bg-transparent border-top-0 px-3 pb-3 pt-0">
      <NuxtLink
        :to="`/shelter/${shelter.id}`"
        class="btn btn-primary btn-sm w-100"
        :aria-label="`Ver refugio ${shelter.name}`"
      >
        Ver refugio
      </NuxtLink>
    </div>
  </article>
</template>

<style scoped lang="scss">
.shelter-card {
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

  // ── Verified badge ─────────────────────────────────────────
  &__verified {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    font-size: 0.7rem;
    letter-spacing: 0.03em;
  }

  // ── Text clamping ──────────────────────────────────────────
  &__name {
    // Prevent very long names from breaking the card layout
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__description {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
</style>
