<script setup lang="ts">
// BlogCard — compact card for a single blog post in the listing.
// Shows: featured image (with safe-URL guard + pet SVG fallback),
// category badge, title, 3-line-clamped excerpt, author (avatar or
// initial fallback), published date in Spanish, and reading time badge.
// Entire card links to /blog/:slug via NuxtLink.

import type { BlogPost } from '../types'

const props = defineProps<{
  post: BlogPost
}>()

// ── URL safety guard ──────────────────────────────────────────
// Rejects javascript:, data:, vbscript: and any other unexpected scheme.
// Mirrors the pattern established in ShelterCard.vue.
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

const safeFeaturedImage = computed(() =>
  isSafeImageUrl(props.post.featured_image) ? props.post.featured_image : null,
)

const imgError = ref(false)
const showImage = computed(() => !!safeFeaturedImage.value && !imgError.value)

function onImgError(): void {
  imgError.value = true
}

// Reset imgError when the prop changes (e.g. list re-renders with different posts)
watch(() => props.post.featured_image, () => {
  imgError.value = false
})

// ── Author avatar ──────────────────────────────────────────────
const safeAvatarUrl = computed(() =>
  isSafeImageUrl(props.post.author.avatar) ? props.post.author.avatar : null,
)

const avatarError = ref(false)
const showAvatar = computed(() => !!safeAvatarUrl.value && !avatarError.value)

function onAvatarError(): void {
  avatarError.value = true
}

/** Single initial character for the avatar fallback (always uppercase). */
const authorInitial = computed(() => props.post.author.name.charAt(0).toUpperCase())

// ── Date formatting ────────────────────────────────────────────
/**
 * Format ISO date string to Spanish long date, e.g. "14 de febrero de 2025".
 * Using `Intl.DateTimeFormat` is SSR-safe — no `window` / `document` access.
 */
function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString)
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
  }
  catch {
    return isoString
  }
}

const formattedDate = computed(() => formatDate(props.post.published_at))

// ── Reading time ───────────────────────────────────────────────
const readingTime = computed(() => {
  if (!props.post.reading_time_minutes) return null
  return props.post.reading_time_minutes === 1
    ? '1 min de lectura'
    : `${props.post.reading_time_minutes} min de lectura`
})
</script>

<template>
  <article
    class="card h-100 border-0 shadow-sm blog-card"
    :aria-label="`Artículo: ${post.title}`"
  >
    <!-- Featured image / SVG fallback -->
    <div class="blog-card__image-wrap">
      <img
        v-if="showImage"
        :src="safeFeaturedImage!"
        :alt="`Imagen de portada: ${post.title}`"
        class="blog-card__image"
        width="600"
        height="300"
        loading="lazy"
        @error="onImgError"
      />

      <!-- SVG placeholder — inline, no external request, no XSS surface -->
      <div
        v-else
        class="blog-card__placeholder d-flex align-items-center justify-content-center"
        aria-hidden="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 80 80"
          class="blog-card__placeholder-svg"
          aria-hidden="true"
          focusable="false"
        >
          <!-- Paw print illustration -->
          <circle cx="40" cy="48" r="18" fill="#c8e6d4" />
          <circle cx="24" cy="30" r="8" fill="#c8e6d4" />
          <circle cx="56" cy="30" r="8" fill="#c8e6d4" />
          <circle cx="15" cy="42" r="6" fill="#c8e6d4" />
          <circle cx="65" cy="42" r="6" fill="#c8e6d4" />
        </svg>
      </div>

      <!-- Category badge — overlaid on image -->
      <span
        class="badge bg-primary blog-card__category-badge"
        :aria-label="`Categoría: ${post.category.name}`"
      >
        {{ post.category.name }}
      </span>
    </div>

    <div class="card-body d-flex flex-column gap-2 p-3">
      <!-- Title -->
      <h3 class="h6 fw-bold mb-0 blog-card__title">
        <NuxtLink
          :to="`/blog/${post.slug}`"
          class="stretched-link text-body text-decoration-none blog-card__title-link"
        >
          {{ post.title }}
        </NuxtLink>
      </h3>

      <!-- Excerpt — 3-line clamp -->
      <p class="blog-card__excerpt text-muted small mb-0">
        {{ post.excerpt }}
      </p>

      <!-- Tags -->
      <div
        v-if="post.tags.length > 0"
        class="d-flex flex-wrap gap-1"
        aria-label="Etiquetas"
      >
        <span
          v-for="tag in post.tags.slice(0, 3)"
          :key="tag"
          class="badge bg-secondary-subtle text-secondary-emphasis fw-normal"
        >
          {{ tag }}
        </span>
        <span
          v-if="post.tags.length > 3"
          class="badge bg-secondary-subtle text-secondary-emphasis fw-normal"
          :title="`${post.tags.length - 3} etiquetas más`"
        >
          +{{ post.tags.length - 3 }}
        </span>
      </div>

      <!-- Spacer -->
      <div class="mt-auto pt-2 border-top d-flex align-items-center justify-content-between gap-2">
        <!-- Author -->
        <div class="d-flex align-items-center gap-2">
          <!-- Avatar -->
          <img
            v-if="showAvatar"
            :src="safeAvatarUrl!"
            :alt="`Avatar de ${post.author.name}`"
            class="blog-card__avatar rounded-circle"
            width="28"
            height="28"
            loading="lazy"
            @error="onAvatarError"
          />
          <span
            v-else
            class="blog-card__avatar-fallback d-flex align-items-center justify-content-center rounded-circle"
            aria-hidden="true"
          >
            {{ authorInitial }}
          </span>
          <span class="small text-muted text-truncate blog-card__author-name">
            {{ post.author.name }}
          </span>
        </div>

        <!-- Reading time badge -->
        <span
          v-if="readingTime"
          class="badge bg-light text-secondary fw-normal flex-shrink-0"
          :aria-label="readingTime"
        >
          {{ readingTime }}
        </span>
      </div>
    </div>

    <!-- Published date footer -->
    <div class="card-footer bg-transparent border-top-0 px-3 pb-3 pt-0">
      <time
        :datetime="post.published_at"
        class="text-muted small"
      >
        {{ formattedDate }}
      </time>
    </div>
  </article>
</template>

<style scoped lang="scss">
.blog-card {
  border-radius: var(--bs-border-radius-lg);
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.12) !important;
  }

  // ── Image area ─────────────────────────────────────────────
  &__image-wrap {
    position: relative;
    overflow: hidden;
    border-radius: var(--bs-border-radius-lg) var(--bs-border-radius-lg) 0 0;
    height: 180px;
    background-color: var(--bs-secondary-bg);
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__placeholder {
    width: 100%;
    height: 100%;
    background-color: #dff0e8; // brand-green tint — matches ShelterCard pattern
  }

  &__placeholder-svg {
    width: 4rem;
    height: 4rem;
    opacity: 0.6;
  }

  // ── Category badge ─────────────────────────────────────────
  &__category-badge {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    font-size: 0.7rem;
    letter-spacing: 0.03em;
  }

  // ── Title ──────────────────────────────────────────────────
  &__title {
    // Allow up to 2 lines then ellipsis
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__title-link {
    &:hover {
      color: var(--bs-primary) !important;
    }
  }

  // ── Excerpt — 3-line clamp ─────────────────────────────────
  &__excerpt {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.5;
  }

  // ── Author ─────────────────────────────────────────────────
  &__avatar {
    width: 28px;
    height: 28px;
    object-fit: cover;
    flex-shrink: 0;
  }

  &__avatar-fallback {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    background-color: var(--bs-primary);
    color: #fff;
    font-size: 0.75rem;
    font-weight: 700;
  }

  &__author-name {
    max-width: 9rem;
  }
}
</style>
