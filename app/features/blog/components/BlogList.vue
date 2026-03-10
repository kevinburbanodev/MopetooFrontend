<script setup lang="ts">
// BlogList — Stitch-style blog listing.
// Hero featured article, category filter, 4-column card grid.
// All data fetching + client-side filtering unchanged.

import { BLOG_CATEGORIES } from '../types'

const { fetchPosts, error, blogStore } = useBlog()

// ── Filter state ───────────────────────────────────────────────
const activeCategory = ref<string | null>(null)
const searchQuery = ref('')

const SKELETON_COUNT = 8

// ── Computed ───────────────────────────────────────────────────

const categoryCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const post of blogStore.posts) {
    counts[post.category] = (counts[post.category] ?? 0) + 1
  }
  return counts
})

const filteredPosts = computed(() => {
  let result = blogStore.posts

  if (activeCategory.value) {
    result = result.filter(p => p.category === activeCategory.value)
  }

  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    result = result.filter(p =>
      p.title.toLowerCase().includes(q)
      || p.content.toLowerCase().includes(q),
    )
  }

  return result
})

// Hero = first post from filtered results
const heroPost = computed(() => filteredPosts.value[0] ?? null)
const gridPosts = computed(() => filteredPosts.value.slice(1))

// ── Read time helper ──────────────────────────────────────────
function readTime(content: string): string {
  const words = content.split(/\s+/).length
  const minutes = Math.max(1, Math.ceil(words / 200))
  return `${minutes} min lectura`
}

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

// ── Category label ────────────────────────────────────────────
function getCategoryLabel(category: string): string {
  return BLOG_CATEGORIES.find(c => c.value === category)?.label ?? category
}

// ── Date formatting ───────────────────────────────────────────
function formatDate(isoString: string): string {
  try {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(isoString))
  }
  catch {
    return isoString
  }
}

// ── Actions ────────────────────────────────────────────────────
function onCategorySelect(category: string | null): void {
  if (category === activeCategory.value) return
  activeCategory.value = category
  searchQuery.value = ''
}

function clearSearch(): void {
  searchQuery.value = ''
}

onMounted(async () => {
  await fetchPosts()
})
</script>

<template>
  <section class="blog-list" aria-label="Artículos del blog">
    <!-- ═══ HERO FEATURED ARTICLE ═══ -->
    <div
      v-if="!blogStore.isLoading && heroPost"
      class="blog-hero mb-5"
    >
      <NuxtLink :to="`/blog/${heroPost.slug}`" class="blog-hero__link">
        <div class="blog-hero__image-wrap">
          <img
            v-if="isSafeImageUrl(heroPost.cover_image_url)"
            :src="heroPost.cover_image_url!"
            :alt="heroPost.title"
            class="blog-hero__image"
            width="1200"
            height="514"
          />
          <div v-else class="blog-hero__placeholder" aria-hidden="true"></div>
          <div class="blog-hero__overlay">
            <div class="blog-hero__content">
              <span class="blog-hero__badge">{{ getCategoryLabel(heroPost.category) }}</span>
              <h2 class="blog-hero__title">{{ heroPost.title }}</h2>
              <div class="blog-hero__meta">
                <span>Mopetoo Blog</span>
                <span class="blog-hero__meta-dot"></span>
                <time v-if="heroPost.published_at" :datetime="heroPost.published_at">
                  {{ formatDate(heroPost.published_at) }}
                </time>
                <span class="blog-hero__meta-dot"></span>
                <span>{{ readTime(heroPost.content) }}</span>
              </div>
            </div>
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- ═══ CATEGORY FILTER SECTION ═══ -->
    <div class="mb-4">
      <h2 class="blog-list__section-title">Explorar Categorias</h2>
      <BlogCategoryFilter
        :categories="BLOG_CATEGORIES"
        :active-category="activeCategory"
        :category-counts="categoryCounts"
        @select="onCategorySelect"
      />
    </div>

    <!-- ═══ SEARCH INPUT ═══ -->
    <div class="blog-search mb-4">
      <div class="blog-search__wrapper">
        <svg class="blog-search__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
          <path d="M20 20l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
        <input
          v-model="searchQuery"
          type="search"
          class="blog-search__input"
          placeholder="Buscar articulos..."
          aria-label="Buscar articulos del blog"
        />
        <button
          v-if="searchQuery.trim()"
          type="button"
          class="blog-search__clear"
          aria-label="Limpiar busqueda"
          @click="clearSearch"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>

    <!-- ═══ ERROR ═══ -->
    <div
      v-if="error"
      class="alert alert-danger d-flex align-items-center gap-2 mb-4"
      role="alert"
    >
      <span aria-hidden="true">&#9888;</span>
      {{ error }}
    </div>

    <!-- ═══ LOADING SKELETON ═══ -->
    <div
      v-if="blogStore.isLoading && !blogStore.hasPosts"
      class="row g-4"
      aria-busy="true"
      aria-label="Cargando articulos"
    >
      <div
        v-for="n in SKELETON_COUNT"
        :key="n"
        class="col-12 col-md-6 col-xl-3"
      >
        <div class="blog-skeleton" aria-hidden="true">
          <div class="blog-skeleton__image skeleton-pulse" />
          <div class="blog-skeleton__body">
            <div class="skeleton-pulse blog-skeleton__badge" />
            <div class="skeleton-pulse blog-skeleton__title" />
            <div class="skeleton-pulse blog-skeleton__line" />
            <div class="skeleton-pulse blog-skeleton__line blog-skeleton__line--short" />
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ EMPTY — no posts ═══ -->
    <div
      v-else-if="!blogStore.isLoading && !blogStore.hasPosts"
      class="blog-empty text-center py-5"
    >
      <div class="blog-empty__icon" aria-hidden="true">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
          <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="#10B981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <h2 class="h5 fw-bold mt-4 mb-2">El blog esta en construccion</h2>
      <p class="text-muted mb-0">
        Pronto encontraras articulos y consejos para el cuidado de tus mascotas.
      </p>
    </div>

    <!-- ═══ EMPTY — no results ═══ -->
    <div
      v-else-if="!blogStore.isLoading && filteredPosts.length === 0"
      class="blog-empty text-center py-5"
    >
      <div class="blog-empty__icon" aria-hidden="true">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="#9ca3af" stroke-width="1.5" />
          <path d="M20 20l-4-4" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </div>
      <h2 class="h5 fw-bold mt-4 mb-2">Sin resultados</h2>
      <p class="text-muted mb-3">
        Ningun articulo coincide con tu busqueda actual.
      </p>
      <button type="button" class="btn btn-outline-primary" @click="clearSearch">
        Limpiar busqueda
      </button>
    </div>

    <!-- ═══ RESULTS GRID ═══ -->
    <template v-else-if="blogStore.hasPosts">
      <p class="text-muted small mb-3" role="status" aria-live="polite">
        {{ filteredPosts.length }}
        {{ filteredPosts.length === 1 ? 'articulo encontrado' : 'articulos encontrados' }}
      </p>

      <div class="row g-4">
        <div
          v-for="post in gridPosts"
          :key="post.id"
          class="col-12 col-md-6 col-xl-3"
        >
          <BlogCard :post="post" />
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped lang="scss">
// ── Section title ────────────────────────────────────────────
.blog-list__section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.75rem;
}

// ── Hero Featured Article ────────────────────────────────────
.blog-hero {
  &__link {
    text-decoration: none;
    color: inherit;
    display: block;
  }

  &__image-wrap {
    position: relative;
    border-radius: 1.5rem;
    overflow: hidden;
    aspect-ratio: 21 / 9;
    background-color: #dff0e8;
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.5s ease;
  }

  &__link:hover &__image {
    transform: scale(1.03);
  }

  &__placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #10B981 0%, #065f46 100%);
  }

  &__overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.1) 60%, transparent 100%);
    display: flex;
    align-items: flex-end;
    padding: 2rem;

    @media (max-width: 767.98px) {
      padding: 1.25rem;
    }
  }

  &__content {
    max-width: 700px;
  }

  &__badge {
    display: inline-block;
    background-color: #F97316;
    color: #fff;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    padding: 0.3em 0.75em;
    border-radius: 0.5rem;
    margin-bottom: 0.75rem;
  }

  &__title {
    font-size: clamp(1.25rem, 3vw, 2rem);
    font-weight: 800;
    color: #fff;
    line-height: 1.2;
    margin: 0 0 0.75rem;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.85rem;
    flex-wrap: wrap;
  }

  &__meta-dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.5);
    flex-shrink: 0;
  }
}

// ── Search ───────────────────────────────────────────────────
.blog-search {
  &__wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  &__icon {
    position: absolute;
    left: 1rem;
    color: #9ca3af;
    pointer-events: none;
  }

  &__input {
    width: 100%;
    padding: 0.75rem 2.75rem 0.75rem 2.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 9999px;
    font-size: 0.9rem;
    background: #fff;
    color: #111827;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &::placeholder {
      color: #9ca3af;
    }

    &:focus {
      outline: none;
      border-color: #10B981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
    }
  }

  &__clear {
    position: absolute;
    right: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border: none;
    border-radius: 50%;
    background: #f3f4f6;
    color: #6b7280;
    cursor: pointer;
    transition: background-color 0.15s ease;

    &:hover {
      background: #e5e7eb;
    }
  }
}

// ── Empty state ──────────────────────────────────────────────
.blog-empty {
  &__icon {
    display: inline-block;
    animation: blog-bounce 2s ease-in-out infinite;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  }
}

@keyframes blog-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

// ── Skeleton ─────────────────────────────────────────────────
.skeleton-pulse {
  background: linear-gradient(
    90deg,
    #e5e7eb 25%,
    #f3f4f6 50%,
    #e5e7eb 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background: #e5e7eb;
  }
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.blog-skeleton {
  background: #fff;
  border-radius: 1rem;
  overflow: hidden;

  &__image {
    aspect-ratio: 4 / 3;
  }

  &__body {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__badge {
    height: 1.25rem;
    width: 5rem;
    border-radius: 9999px;
  }

  &__title {
    height: 1rem;
    width: 80%;
    border-radius: 0.25rem;
  }

  &__line {
    height: 0.75rem;
    width: 100%;
    border-radius: 0.25rem;

    &--short { width: 65%; }
  }
}
</style>
