<script setup lang="ts">
// Blog article detail page — thin wrapper.
// Public route; no auth middleware required.
// Fetches the post by slug on mount (client-side) so that SSR-rendered
// dynamic SEO tags are populated once the post is available.
// The blog/[slug] routeRule in nuxt.config.ts caches responses for 1 hour,
// so the SSR hit rate is amortised across requests.

definePageMeta({
  name: 'blog-article',
})

const route = useRoute()
const slug = computed(() => route.params.slug as string)

// Guard: only request the backend when the slug has a valid format.
// Prevents path traversal / unexpected API calls from crafted URLs like
// /blog/../admin or /blog/%2F%2Fevil.com
const SLUG_RE = /^[\w-]{1,100}$/

const { fetchPostBySlug, error, blogStore } = useBlog()

// ── Dynamic SEO — updates once the post loads ─────────────────
const post = computed(() => blogStore.selectedPost)

useSeoMeta({
  title: () => post.value ? `${post.value.title} — Mopetoo` : 'Artículo — Mopetoo',
  description: () => post.value?.excerpt ?? 'Lee este artículo en el blog de Mopetoo.',
  ogTitle: () => post.value?.title ?? 'Artículo — Mopetoo',
  ogDescription: () => post.value?.excerpt ?? 'Lee este artículo en el blog de Mopetoo.',
  ogType: 'article',
  // Only set ogImage when the featured_image passes the URL safety check
  ogImage: () => {
    const img = post.value?.featured_image
    if (!img) return undefined
    try {
      const parsed = new URL(img)
      return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? img : undefined
    }
    catch {
      return undefined
    }
  },
  twitterCard: 'summary_large_image',
  twitterTitle: () => post.value?.title ?? 'Artículo — Mopetoo',
  twitterDescription: () => post.value?.excerpt ?? 'Lee este artículo en el blog de Mopetoo.',
})

// ── Fetch on client mount ──────────────────────────────────────
// onMounted is used (not useAsyncData) to keep the page as a thin wrapper
// consistent with the rest of the codebase. The composable handles the
// store cache check internally, so navigating list → detail is instant
// when the post is already in the store.
onMounted(async () => {
  if (!SLUG_RE.test(slug.value)) return
  await fetchPostBySlug(slug.value)
})

// Clear selection when leaving the page to prevent stale data
// appearing briefly if the user navigates to a different article
onUnmounted(() => {
  blogStore.clearSelectedPost()
})
</script>

<template>
  <div class="container py-5">
    <!-- Breadcrumb -->
    <nav aria-label="Migas de pan" class="mb-4">
      <ol class="breadcrumb">
        <li class="breadcrumb-item">
          <NuxtLink to="/">Inicio</NuxtLink>
        </li>
        <li class="breadcrumb-item">
          <NuxtLink to="/blog">Blog</NuxtLink>
        </li>
        <li class="breadcrumb-item active" aria-current="page">
          {{ post?.title ?? 'Artículo' }}
        </li>
      </ol>
    </nav>

    <!-- Error state -->
    <div
      v-if="error && !blogStore.isLoading"
      class="alert alert-danger d-flex align-items-center gap-2 mb-4"
      role="alert"
    >
      <span aria-hidden="true">⚠</span>
      {{ error }}
    </div>

    <div class="row justify-content-center">
      <div class="col-12 col-lg-8">
        <BlogArticle />
      </div>
    </div>
  </div>
</template>
