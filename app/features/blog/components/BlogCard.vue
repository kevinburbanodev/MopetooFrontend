<script setup lang="ts">
// BlogCard — compact card for a single blog post in the listing.
// Shows: cover image (with safe-URL guard + pet SVG fallback),
// category badge, title, excerpt (derived from content),
// and published date in Spanish.
// Entire card links to /blog/:slug via NuxtLink.

import type { BlogPost } from '../types'
import { BLOG_CATEGORIES } from '../types'

const props = defineProps<{
  post: BlogPost
}>()

// ── URL safety guard ──────────────────────────────────────────
// Rejects javascript:, data:, vbscript: and any other unexpected scheme.
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

const safeCoverUrl = computed(() =>
  isSafeImageUrl(props.post.cover_image_url) ? props.post.cover_image_url : null,
)

const imgError = ref(false)
const showImage = computed(() => !!safeCoverUrl.value && !imgError.value)

function onImgError(): void {
  imgError.value = true
}

// Reset imgError when the prop changes (e.g. list re-renders with different posts)
watch(() => props.post.cover_image_url, () => {
  imgError.value = false
})

// ── Category label lookup ───────────────────────────────────────
const categoryLabel = computed(() =>
  BLOG_CATEGORIES.find(c => c.value === props.post.category)?.label ?? props.post.category,
)

// ── Excerpt derived from content ────────────────────────────────
const excerpt = computed(() => {
  const raw = props.post.content
  if (raw.length <= 150) return raw
  return raw.substring(0, 150).trim() + '...'
})

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

const formattedDate = computed(() => {
  if (!props.post.published_at) return ''
  return formatDate(props.post.published_at)
})
</script>

<template>
  <article
    class="card h-100 border-0 shadow-sm blog-card"
    :aria-label="`Artículo: ${post.title}`"
  >
    <!-- Cover image / SVG fallback -->
    <div class="blog-card__image-wrap">
      <img
        v-if="showImage"
        :src="safeCoverUrl!"
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
        :aria-label="`Categoría: ${categoryLabel}`"
      >
        {{ categoryLabel }}
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

      <!-- Excerpt — derived from content, 3-line clamp -->
      <p class="blog-card__excerpt text-muted small mb-0">
        {{ excerpt }}
      </p>
    </div>

    <!-- Published date footer -->
    <div class="card-footer bg-transparent border-top-0 px-3 pb-3 pt-0">
      <time
        v-if="post.published_at"
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
    background-color: #dff0e8; // brand-green tint
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
}
</style>
