<script setup lang="ts">
// BlogCard — Stitch-style card for a single blog post.
// Image with 4:3 aspect ratio, orange category badge, title (2-line clamp),
// excerpt (2-line clamp), date + read time. Hover: translateY + shadow.

import type { BlogPost } from '../types'
import { BLOG_CATEGORIES } from '../types'

const props = defineProps<{
  post: BlogPost
}>()

// ── URL safety guard ──────────────────────────────────────────
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
  if (raw.length <= 120) return raw
  return raw.substring(0, 120).trim() + '...'
})

// ── Read time estimate ─────────────────────────────────────────
const readTime = computed(() => {
  const words = props.post.content.split(/\s+/).length
  const minutes = Math.max(1, Math.ceil(words / 200))
  return `${minutes} min lectura`
})

// ── Date formatting ────────────────────────────────────────────
function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString)
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
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
    class="blog-card"
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
        height="450"
        loading="lazy"
        @error="onImgError"
      />

      <!-- SVG placeholder -->
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
          <circle cx="40" cy="48" r="18" fill="#c8e6d4" />
          <circle cx="24" cy="30" r="8" fill="#c8e6d4" />
          <circle cx="56" cy="30" r="8" fill="#c8e6d4" />
          <circle cx="15" cy="42" r="6" fill="#c8e6d4" />
          <circle cx="65" cy="42" r="6" fill="#c8e6d4" />
        </svg>
      </div>

      <!-- Category badge — orange overlay -->
      <span
        class="blog-card__category-badge"
        :aria-label="`Categoría: ${categoryLabel}`"
      >
        {{ categoryLabel }}
      </span>
    </div>

    <div class="blog-card__body">
      <!-- Title -->
      <h3 class="blog-card__title">
        <NuxtLink
          :to="`/blog/${post.slug}`"
          class="blog-card__title-link"
        >
          {{ post.title }}
        </NuxtLink>
      </h3>

      <!-- Excerpt -->
      <p class="blog-card__excerpt">
        {{ excerpt }}
      </p>

      <!-- Meta: date + read time -->
      <div class="blog-card__meta">
        <time
          v-if="post.published_at"
          :datetime="post.published_at"
        >
          {{ formattedDate }}
        </time>
        <span class="blog-card__meta-dot"></span>
        <span>{{ readTime }}</span>
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
.blog-card {
  background: #fff;
  border-radius: 1rem;
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  }

  // ── Image area ─────────────────────────────────────────────
  &__image-wrap {
    position: relative;
    overflow: hidden;
    aspect-ratio: 4 / 3;
    background-color: #dff0e8;
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.4s ease;
  }

  &:hover &__image {
    transform: scale(1.1);
  }

  &__placeholder {
    width: 100%;
    height: 100%;
    background-color: #dff0e8;
  }

  &__placeholder-svg {
    width: 4rem;
    height: 4rem;
    opacity: 0.6;
  }

  // ── Category badge — orange ────────────────────────────────
  &__category-badge {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    background-color: #F97316;
    color: #fff;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding: 0.3em 0.7em;
    border-radius: 0.5rem;
  }

  // ── Body ───────────────────────────────────────────────────
  &__body {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 0.5rem;
  }

  // ── Title ──────────────────────────────────────────────────
  &__title {
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.4;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__title-link {
    color: #111827;
    text-decoration: none;
    transition: color 0.2s ease;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
    }

    &:hover {
      color: #10B981;
    }
  }

  // ── Excerpt ────────────────────────────────────────────────
  &__excerpt {
    font-size: 0.875rem;
    line-height: 1.6;
    color: #6b7280;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    flex: 1;
  }

  // ── Meta ───────────────────────────────────────────────────
  &__meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: #9ca3af;
    margin-top: auto;
    padding-top: 0.5rem;
  }

  &__meta-dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background-color: #d1d5db;
    flex-shrink: 0;
  }

  // Make the whole card clickable via stretched link
  position: relative;
}
</style>
