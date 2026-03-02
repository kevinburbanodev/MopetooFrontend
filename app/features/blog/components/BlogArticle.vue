<script setup lang="ts">
// BlogArticle — full article view for a single blog post.
// Reads the selected post from blogStore (set by the [slug].vue page).
//
// CONTENT SECURITY NOTE:
// Article body content is rendered as plain text — NOT via v-html.
// Rationale: even if the backend sanitises HTML, rendering server-sourced
// HTML client-side with v-html is an XSS vector.

import { BLOG_CATEGORIES } from '../types'

const blogStore = useBlogStore()
const post = computed(() => blogStore.selectedPost)

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

const safeHeroImage = computed(() =>
  isSafeImageUrl(post.value?.cover_image_url) ? post.value!.cover_image_url : null,
)

const heroImgError = ref(false)
const showHeroImage = computed(() => !!safeHeroImage.value && !heroImgError.value)

function onHeroImgError(): void {
  heroImgError.value = true
}

// ── Category label lookup ───────────────────────────────────────
const categoryLabel = computed(() => {
  if (!post.value) return ''
  return BLOG_CATEGORIES.find(c => c.value === post.value!.category)?.label ?? post.value.category
})

// ── Date formatting ────────────────────────────────────────────
function formatDate(isoString: string): string {
  try {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(isoString))
  }
  catch {
    return isoString
  }
}

const formattedPublished = computed(() =>
  post.value?.published_at ? formatDate(post.value.published_at) : '',
)

const formattedUpdated = computed(() =>
  post.value ? formatDate(post.value.updated_at) : '',
)
</script>

<template>
  <!-- Loading skeleton while the post is being fetched -->
  <div
    v-if="blogStore.isLoading && !post"
    class="blog-article-skeleton"
    aria-busy="true"
    aria-label="Cargando artículo"
  >
    <!-- Hero skeleton -->
    <div class="blog-article-skeleton__hero skeleton-pulse mb-4" aria-hidden="true" />
    <!-- Title -->
    <div class="skeleton-pulse rounded mb-3 blog-article-skeleton__title" aria-hidden="true" />
    <div class="skeleton-pulse rounded mb-4 blog-article-skeleton__title blog-article-skeleton__title--short" aria-hidden="true" />
    <!-- Meta -->
    <div class="d-flex gap-3 mb-4" aria-hidden="true">
      <div class="d-flex flex-column gap-2">
        <div class="skeleton-pulse rounded blog-article-skeleton__meta-line" />
        <div class="skeleton-pulse rounded blog-article-skeleton__meta-line blog-article-skeleton__meta-line--short" />
      </div>
    </div>
    <!-- Body lines -->
    <div class="d-flex flex-column gap-2" aria-hidden="true">
      <div v-for="n in 8" :key="n" class="skeleton-pulse rounded blog-article-skeleton__body-line" :style="n % 5 === 0 ? 'width:60%' : 'width:100%'" />
    </div>
  </div>

  <!-- Article content -->
  <article v-else-if="post" class="blog-article" :aria-label="`Artículo: ${post.title}`">
    <!-- Back navigation -->
    <nav aria-label="Navegación de vuelta" class="mb-4">
      <NuxtLink to="/blog" class="btn btn-sm btn-outline-secondary">
        ← Volver al blog
      </NuxtLink>
    </nav>

    <!-- Category badge -->
    <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
      <NuxtLink
        :to="`/blog`"
        class="badge bg-primary text-decoration-none blog-article__category-badge"
        :aria-label="`Categoría: ${categoryLabel}`"
      >
        {{ categoryLabel }}
      </NuxtLink>
    </div>

    <!-- Title -->
    <h1 class="blog-article__title mb-3">{{ post.title }}</h1>

    <!-- Date meta -->
    <div class="d-flex flex-wrap align-items-center gap-3 mb-4 pb-4 border-bottom">
      <div>
        <time v-if="post.published_at" :datetime="post.published_at" class="small text-muted">
          {{ formattedPublished }}
        </time>
      </div>

      <!-- Updated date (only show if meaningfully different from published) -->
      <p
        v-if="post.published_at && post.updated_at !== post.published_at"
        class="small text-muted mb-0 ms-auto"
      >
        Actualizado el
        <time :datetime="post.updated_at">{{ formattedUpdated }}</time>
      </p>
    </div>

    <!-- Hero image -->
    <figure v-if="showHeroImage" class="blog-article__hero-wrap mb-4">
      <img
        :src="safeHeroImage!"
        :alt="`Imagen de portada: ${post.title}`"
        class="blog-article__hero-image"
        width="1200"
        height="600"
        @error="onHeroImgError"
      />
    </figure>

    <!-- Article body — rendered as plain text paragraphs. -->
    <div class="blog-article__body">
      <p
        v-for="(paragraph, index) in post.content.split('\n').filter(Boolean)"
        :key="index"
        class="blog-article__paragraph"
      >
        {{ paragraph }}
      </p>
    </div>

    <!-- More articles CTA -->
    <div class="blog-article__more mt-5 pt-4 border-top text-center">
      <p class="text-muted mb-3">¿Te gustó este artículo? Explora más contenido.</p>
      <NuxtLink to="/blog" class="btn btn-primary">
        Ver más artículos
      </NuxtLink>
    </div>
  </article>

  <!-- Post not found state -->
  <div v-else class="text-center py-5">
    <div class="fs-1 mb-3" aria-hidden="true">📄</div>
    <h2 class="h5 fw-bold mb-2">Artículo no encontrado</h2>
    <p class="text-muted mb-4">
      El artículo que buscas no existe o ya no está disponible.
    </p>
    <NuxtLink to="/blog" class="btn btn-primary">
      Ir al blog
    </NuxtLink>
  </div>
</template>

<style scoped lang="scss">
.blog-article {
  // ── Category badge ────────────────────────────────────────
  &__category-badge {
    font-size: 0.75rem;
    letter-spacing: 0.03em;
    padding: 0.35em 0.65em;
  }

  // ── Title ─────────────────────────────────────────────────
  &__title {
    font-size: clamp(1.5rem, 4vw, 2.25rem);
    font-weight: 700;
    line-height: 1.25;
  }

  // ── Hero image ────────────────────────────────────────────
  &__hero-wrap {
    border-radius: var(--bs-border-radius-lg);
    overflow: hidden;
    margin-inline: 0;

    // Prevent CLS: reserve space before image loads
    aspect-ratio: 2 / 1;
    background-color: #dff0e8;
  }

  &__hero-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  // ── Body content ──────────────────────────────────────────
  &__body {
    font-size: 1.0625rem;
    line-height: 1.75;
    color: var(--bs-body-color);
  }

  &__paragraph {
    margin-bottom: 1.25rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  // ── More CTA ─────────────────────────────────────────────
  &__more {
    background-color: var(--bs-secondary-bg);
    border-radius: var(--bs-border-radius-lg);
    padding: 2rem;
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

.blog-article-skeleton {
  &__hero {
    height: 300px;
    border-radius: var(--bs-border-radius-lg);

    @media (min-width: 768px) {
      height: 400px;
    }
  }

  &__title {
    height: 2rem;
    width: 85%;

    &--short { width: 55%; }
  }

  &__meta-line {
    height: 0.75rem;
    width: 8rem;

    &--short { width: 5rem; }
  }

  &__body-line {
    height: 0.85rem;
  }
}
</style>
