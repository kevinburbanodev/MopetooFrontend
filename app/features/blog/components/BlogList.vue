<script setup lang="ts">
// BlogList — public blog post listing.
// Fetches posts and categories on mount, provides client-side search
// + category filter pill bar, skeleton loading, empty states,
// and a "Cargar más" pagination button (append pattern).
// All data fetching happens in this component via useBlog.

const { fetchPosts, fetchCategories, error, blogStore } = useBlog()

// ── Filter state ───────────────────────────────────────────────
const activeCategorySlug = ref<string | null>(null)
const searchQuery = ref('')
// Track what we last fetched so we can diff on filter change
const lastFetchedCategory = ref<string | null | undefined>(undefined)

const POSTS_PER_PAGE = 9
const SKELETON_COUNT = 6

// ── Computed ───────────────────────────────────────────────────
/**
 * Client-side search filter applied on top of the server-fetched posts.
 * Category filtering is server-side (passed as query param); search is
 * kept client-side to avoid a round-trip on every keystroke.
 */
const filteredPosts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return blogStore.posts

  return blogStore.posts.filter(p =>
    p.title.toLowerCase().includes(q)
    || p.excerpt.toLowerCase().includes(q)
    || p.author.name.toLowerCase().includes(q)
    || p.tags.some(t => t.toLowerCase().includes(q)),
  )
})

const hasMore = computed(() =>
  blogStore.currentPage < blogStore.totalPages,
)

// ── Actions ────────────────────────────────────────────────────

async function loadPosts(append = false): Promise<void> {
  const nextPage = append ? blogStore.currentPage + 1 : 1
  await fetchPosts({
    category_slug: activeCategorySlug.value ?? undefined,
    page: nextPage,
    limit: POSTS_PER_PAGE,
  }, append)
}

async function onCategorySelect(slug: string | null): Promise<void> {
  if (slug === activeCategorySlug.value) return
  activeCategorySlug.value = slug
  searchQuery.value = '' // reset text search when switching category
  await loadPosts(false)
}

async function loadMore(): Promise<void> {
  await loadPosts(true)
}

function clearSearch(): void {
  searchQuery.value = ''
}

onMounted(async () => {
  // Fetch categories and first page of posts in parallel
  await Promise.all([fetchCategories(), loadPosts(false)])
  lastFetchedCategory.value = activeCategorySlug.value
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

    <!-- Category filter -->
    <div v-if="blogStore.hasCategories" class="mb-3">
      <BlogCategoryFilter
        :categories="blogStore.categories"
        :active-category-slug="activeCategorySlug"
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
          <div class="card-footer bg-transparent px-3 pb-3 pt-0 border-top-0">
            <div class="d-flex align-items-center gap-2">
              <div class="skeleton-pulse rounded-circle blog-skeleton__avatar" />
              <div class="skeleton-pulse rounded blog-skeleton__author" />
            </div>
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

      <!-- Load more button -->
      <div
        v-if="hasMore && !searchQuery.trim()"
        class="text-center mt-5"
      >
        <button
          type="button"
          class="btn btn-outline-primary px-5"
          :disabled="blogStore.isLoading"
          :aria-busy="blogStore.isLoading"
          @click="loadMore"
        >
          <span
            v-if="blogStore.isLoading"
            class="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          />
          {{ blogStore.isLoading ? 'Cargando…' : 'Cargar más artículos' }}
        </button>
      </div>

      <!-- End of results message -->
      <p
        v-else-if="!hasMore && blogStore.total > POSTS_PER_PAGE && !searchQuery.trim()"
        class="text-center text-muted small mt-5"
      >
        Has llegado al final. ¡Eso es todo por ahora!
      </p>
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

  &__avatar {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
  }

  &__author {
    height: 0.75rem;
    width: 6rem;
  }
}
</style>
