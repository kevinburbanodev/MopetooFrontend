<script setup lang="ts">
import type { BlogPost } from '~/features/blog/types'

// Blog article detail page — SSR-rendered for SEO.
// Uses useAsyncData so crawlers receive fully rendered HTML.

definePageMeta({
  name: 'blog-article',
})

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const config = useRuntimeConfig()
const baseURL = (config.public.apiBase as string) ?? ''

const SLUG_RE = /^[\w-]{1,100}$/

const { data: post, error } = useAsyncData<BlogPost>(
  `blog-post-${slug.value}`,
  () => {
    if (!SLUG_RE.test(slug.value)) {
      throw createError({ statusCode: 404, message: 'Slug invalido' })
    }
    return $fetch<BlogPost>(`${baseURL}/blog/posts/${slug.value}`)
  },
  { watch: [slug] },
)

// Sync to store for client-side navigation cache
const { blogStore } = useBlog()
watch(post, (p) => {
  if (p) blogStore.setSelectedPost(p)
}, { immediate: true })

useSeoMeta({
  title: () => post.value ? `${post.value.title} - Mopetoo` : 'Articulo - Mopetoo',
  description: () => post.value ? post.value.content.substring(0, 160).trim() : 'Lee este articulo en el blog de Mopetoo.',
  ogTitle: () => post.value?.title ?? 'Articulo - Mopetoo',
  ogDescription: () => post.value ? post.value.content.substring(0, 160).trim() : 'Lee este articulo en el blog de Mopetoo.',
  ogType: 'article',
  ogImage: () => {
    const img = post.value?.cover_image_url
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
  twitterTitle: () => post.value?.title ?? 'Articulo - Mopetoo',
  twitterDescription: () => post.value ? post.value.content.substring(0, 160).trim() : 'Lee este articulo en el blog de Mopetoo.',
})
</script>

<template>
  <div class="blog-article-page">
    <!-- Error state -->
    <div
      v-if="error"
      class="container py-5"
    >
      <div class="alert alert-danger d-flex align-items-center gap-2" role="alert">
        <span aria-hidden="true">&#9888;</span>
        Articulo no encontrado
      </div>
    </div>

    <BlogArticle />
  </div>
</template>

<style scoped>
.blog-article-page {
  background: #f8f6f6;
  min-height: 100vh;
}
</style>
