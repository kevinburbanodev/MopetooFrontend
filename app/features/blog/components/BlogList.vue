<script setup lang="ts">
// BlogList — public blog post listing.
// Fetches all posts on mount, provides client-side search
// + category filter pill bar, skeleton loading, and empty states.
// All data fetching happens in this component via useBlog.

import { BLOG_CATEGORIES } from '../types'

const { fetchPosts, error, blogStore } = useBlog()

// ── Filter state ───────────────────────────────────────────────
const activeCategory = ref<string | null>(null)
const searchQuery = ref('')

const SKELETON_COUNT = 6

// ── Computed ───────────────────────────────────────────────────

/** Post counts per category for badge display */
const categoryCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const post of blogStore.posts) {
    counts[post.category] = (counts[post.category] ?? 0) + 1
  }
  return counts
})

/**
 * Client-side filter applied on top of the fetched posts.
 * Both category and search are client-side — all posts are loaded at once.
 */
const filteredPosts = computed(() => {
  let result = blogStore.posts

  // Category filter
  if (activeCategory.value) {
    result = result.filter(p => p.category === activeCategory.value)
  }

  // Text search filter
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    result = result.filter(p =>
      p.title.toLowerCase().includes(q)
      || p.content.toLowerCase().includes(q),
    )
  }

  return result
})

// ── Actions ────────────────────────────────────────────────────

function onCategorySelect(category: string | null): void {
  if (category === activeCategory.value) return
  activeCategory.value = category
  searchQuery.value = '' // reset text search when switching category
}

function clearSearch(): void {
  searchQuery.value = ''
}

onMounted(async () => {
  await fetchPosts()
})
</script>

<template>
  <section aria-label="Artículos del blog">
    <!-- Page header -->
    <div class="mb-4">
      <h1 class="h3 fw-bold mb-1">Blog Mopetoo</h1>
      <p class="text-muted mb-0">
        Consejos, curiosidades y noticias sobre el mundo de las mascotas.
      </p>
    </div>

    <!-- Category filter — always visible (hardcoded categories) -->
    <div class="mb-3">
      <BlogCategoryFilter
        :categories="BLOG_CATEGORIES"
        :active-category="activeCategory"
        :category-counts="categoryCounts"
        @select="onCategorySelect"
      />
    </div>

    <!-- Search input -->
    <div class="mb-4">
      <div class="input-group">
        <span class="input-group-text bg-transparent border-end-0" aria-hidden="true">
          🔍
        </span>
        <input
          v-model="searchQuery"
          type="search"
          class="form-control border-start-0"
          placeholder="Buscar artículos..."
          aria-label="Buscar artículos del blog"
        />
        <button
          v-if="searchQuery.trim()"
          type="button"
          class="btn btn-outline-secondary"
          aria-label="Limpiar búsqueda"
          @click="clearSearch"
        >
          Limpiar
        </button>
      </div>
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

    <!-- Loading skeleton — shown on initial load only -->
    <div
      v-if="blogStore.isLoading && !blogStore.hasPosts"
      class="row g-4"
      aria-busy="true"
      aria-label="Cargando artículos"
    >
      <div
        v-for="n in SKELETON_COUNT"
        :key="n"
        class="col-12 col-md-6 col-lg-4"
      >
        <div class="card border-0 shadow-sm h-100 blog-skeleton" aria-hidden="true">
          <div class="blog-skeleton__image skeleton-pulse" />
          <div class="card-body p-3 d-flex flex-column gap-2">
            <div class="skeleton-pulse rounded blog-skeleton__badge" />
            <div class="skeleton-pulse rounded blog-skeleton__title" />
            <div class="skeleton-pulse rounded blog-skeleton__line" />
            <div class="skeleton-pulse rounded blog-skeleton__line" />
            <div class="skeleton-pulse rounded blog-skeleton__line blog-skeleton__line--short" />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state — no posts at all -->
    <div
      v-else-if="!blogStore.isLoading && !blogStore.hasPosts"
      class="blog-empty text-center py-5"
    >
      <div class="blog-empty__illustration" aria-hidden="true">📝</div>
      <h2 class="h5 fw-bold mt-4 mb-2">El blog está en construcción</h2>
      <p class="text-muted mb-0">
        Pronto encontrarás artículos y consejos para el cuidado de tus mascotas.
      </p>
    </div>

    <!-- Empty state — search / category filter returned nothing -->
    <div
      v-else-if="!blogStore.isLoading && filteredPosts.length === 0"
      class="blog-empty text-center py-5"
    >
      <div class="blog-empty__illustration" aria-hidden="true">🔍</div>
      <h2 class="h5 fw-bold mt-4 mb-2">Sin resultados</h2>
      <p class="text-muted mb-3">
        Ningún artículo coincide con tu búsqueda actual.
      </p>
      <button type="button" class="btn btn-outline-primary" @click="clearSearch">
        Limpiar búsqueda
      </button>
    </div>

    <!-- Results -->
    <template v-else-if="blogStore.hasPosts">
      <!-- Result count -->
      <p class="text-muted small mb-3" role="status" aria-live="polite">
        {{ filteredPosts.length }}
        {{ filteredPosts.length === 1 ? 'artículo encontrado' : 'artículos encontrados' }}
      </p>

      <div class="row g-4">
        <div
          v-for="post in filteredPosts"
          :key="post.id"
          class="col-12 col-md-6 col-lg-4"
        >
          <BlogCard :post="post" />
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped lang="scss">
// ── Empty state ───────────────────────────────────────────────
.blog-empty {
  &__illustration {
    font-size: 4rem;
    line-height: 1;
    display: block;
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

.blog-skeleton {
  border-radius: var(--bs-border-radius-lg);

  &__image {
    height: 180px;
    border-radius: var(--bs-border-radius-lg) var(--bs-border-radius-lg) 0 0;
  }

  &__badge {
    height: 1.25rem;
    width: 5rem;
    border-radius: var(--bs-border-radius-pill) !important;
  }

  &__title {
    height: 1rem;
    width: 80%;
  }

  &__line {
    height: 0.75rem;
    width: 100%;

    &--short { width: 65%; }
  }
}
</style>
