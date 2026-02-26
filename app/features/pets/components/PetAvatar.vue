<script setup lang="ts">
// PetAvatar — circular avatar that shows the pet photo when available,
// or a species emoji on a coloured background as a graceful fallback.
// Uses explicit width/height on the img to prevent CLS.

import type { Pet } from '../types'

const props = defineProps<{
  pet: Pet
  /** Visual size of the avatar */
  size?: 'sm' | 'md' | 'lg'
}>()

// ── Species emoji map ────────────────────────────────────────
const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐶',
  cat: '🐱',
  bird: '🐦',
  rabbit: '🐰',
  other: '🐾',
}

// ── Species background colour map — one per species for visual variety
const SPECIES_BG: Record<string, string> = {
  dog: '#dff0e8',
  cat: '#fde8d8',
  bird: '#ddeeff',
  rabbit: '#f0e8fd',
  other: '#f0f0f0',
}

const SPECIES_FG: Record<string, string> = {
  dog: '#2d7a55',
  cat: '#a85b2d',
  bird: '#2d5f9a',
  rabbit: '#6a3d9a',
  other: '#555555',
}

const emoji = computed(() => SPECIES_EMOJI[props.pet.species] ?? '🐾')
const bgColor = computed(() => SPECIES_BG[props.pet.species] ?? '#f0f0f0')
const fgColor = computed(() => SPECIES_FG[props.pet.species] ?? '#555555')

// ── Size map ─────────────────────────────────────────────────
const SIZE_MAP = {
  sm: { px: 40, fontSize: '1rem' },
  md: { px: 64, fontSize: '1.5rem' },
  lg: { px: 100, fontSize: '2.25rem' },
}

const sizeKey = computed(() => props.size ?? 'md')
const pxSize = computed(() => SIZE_MAP[sizeKey.value].px)
const fontSize = computed(() => SIZE_MAP[sizeKey.value].fontSize)

const altText = computed(() => `Foto de ${props.pet.name}`)

// ── URL safety guard ─────────────────────────────────────────
// Only allow https://, http://, blob: (local preview), and relative URLs.
// Rejects javascript:, data:, vbscript: and any other unexpected schemes
// that could be injected via a malicious API response.
function isSafeImageUrl(url: string | null | undefined): boolean {
  if (!url) return false
  // blob: is always safe — created locally by URL.createObjectURL
  if (url.startsWith('blob:')) return true
  // Relative URLs are safe
  if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) return true
  // Allow only http and https absolute URLs
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  }
  catch {
    return false
  }
}

const safePhotoUrl = computed(() =>
  isSafeImageUrl(props.pet.photo_url) ? props.pet.photo_url : null,
)

// ── Image error fallback ─────────────────────────────────────
// If the photo URL returns a 404 or fails to load, fall back to the emoji.
const imgError = ref(false)
const showPhoto = computed(() => !!safePhotoUrl.value && !imgError.value)

function onImgError(): void {
  imgError.value = true
}

// Reset error flag if the photo_url prop changes
watch(() => props.pet.photo_url, () => {
  imgError.value = false
})
</script>

<template>
  <div
    class="pet-avatar"
    :class="`pet-avatar--${sizeKey}`"
    :style="{ width: `${pxSize}px`, height: `${pxSize}px` }"
    role="img"
    :aria-label="altText"
  >
    <img
      v-if="showPhoto"
      :src="safePhotoUrl!"
      :alt="altText"
      class="pet-avatar__img"
      :width="pxSize"
      :height="pxSize"
      @error="onImgError"
    />
    <span
      v-else
      class="pet-avatar__fallback"
      :style="{ backgroundColor: bgColor, color: fgColor, fontSize }"
      aria-hidden="true"
    >
      {{ emoji }}
    </span>
  </div>
</template>

<style scoped lang="scss">
.pet-avatar {
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  // Prevent CLS — dimensions are always set via inline style
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--bs-border-color);

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__fallback {
    display: flex;
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: center;
    user-select: none;
    line-height: 1;
    border-radius: 50%;
  }

  // Size variant modifiers — only used for border thickness
  &--sm { border-width: 1px; }
  &--md { border-width: 2px; }
  &--lg { border-width: 3px; }
}
</style>
