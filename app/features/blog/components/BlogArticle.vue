<script setup lang="ts">
// BlogArticle — Stitch-style full article view.
// Reading progress bar, hero image, author info, social share,
// intro paragraph with teal border, sidebar with TOC + CTA + related.
// Supports both HTML (rich text) and plain text content.
// HTML is sanitized with DOMPurify before v-html rendering.

import DOMPurify from 'isomorphic-dompurify'
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

// ── Category label ────────────────────────────────────────────
const categoryLabel = computed(() => {
  if (!post.value) return ''
  return BLOG_CATEGORIES.find(c => c.value === post.value!.category)?.label ?? post.value.category
})

// ── Date formatting ───────────────────────────────────────────
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

// ── Read time ─────────────────────────────────────────────────
const readTime = computed(() => {
  if (!post.value) return ''
  const words = post.value.content.split(/\s+/).length
  const minutes = Math.max(1, Math.ceil(words / 200))
  return `${minutes} min lectura`
})

// ── HTML content detection and sanitization ───────────────────
const isHtmlContent = computed(() => {
  if (!post.value) return false
  return /<[a-z][\s\S]*>/i.test(post.value.content)
})

const ALLOWED_TAGS = [
  'h2', 'h3', 'h4', 'p', 'br', 'strong', 'em', 'b', 'i', 'u',
  'ul', 'ol', 'li', 'blockquote', 'a', 'hr', 'code', 'pre',
]
const ALLOWED_ATTR = ['href', 'target', 'rel', 'id', 'class']

const sanitizedContent = computed(() => {
  if (!post.value) return ''
  return DOMPurify.sanitize(post.value.content, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  })
})

// ── TOC for HTML content — extract h2 tags ────────────────────
const htmlTocItems = computed(() => {
  if (!isHtmlContent.value || !sanitizedContent.value) return []
  const items: { text: string; id: string }[] = []
  const regex = /<h2[^>]*>(.*?)<\/h2>/gi
  let match
  let idx = 0
  while ((match = regex.exec(sanitizedContent.value)) !== null) {
    const text = match[1].replace(/<[^>]*>/g, '')
    items.push({ text, id: `html-section-${idx++}` })
  }
  return items
})

// Inject IDs into sanitized HTML for TOC anchors
const sanitizedContentWithIds = computed(() => {
  if (!htmlTocItems.value.length) return sanitizedContent.value
  let idx = 0
  return sanitizedContent.value.replace(/<h2([^>]*)>/gi, () => {
    return `<h2 id="html-section-${idx++}">`
  })
})

// ── Content paragraphs with heading heuristic ─────────────────
const contentBlocks = computed(() => {
  if (!post.value) return []
  const paragraphs = post.value.content.split('\n').filter(Boolean)
  return paragraphs.map((text, i) => {
    // Heuristic: short paragraphs (< 60 chars, no period at end) are headings
    const isHeading = text.length < 60 && !text.trim().endsWith('.')
    return { text, isHeading, id: `section-${i}` }
  })
})

// Intro = first non-heading paragraph
const introParagraph = computed(() => {
  const first = contentBlocks.value.find(b => !b.isHeading)
  return first?.text ?? ''
})

// Body = everything after intro
const bodyBlocks = computed(() => {
  const introIdx = contentBlocks.value.findIndex(b => !b.isHeading)
  if (introIdx < 0) return contentBlocks.value
  return contentBlocks.value.slice(introIdx + 1)
})

// TOC — headings only
const tocItems = computed(() =>
  contentBlocks.value.filter(b => b.isHeading),
)

// ── Reading progress bar ──────────────────────────────────────
const readingProgress = ref(0)
const articleEl = ref<HTMLElement | null>(null)

function updateProgress(): void {
  if (!articleEl.value) return
  const rect = articleEl.value.getBoundingClientRect()
  const totalHeight = rect.height
  const scrolled = -rect.top
  if (totalHeight <= 0) {
    readingProgress.value = 0
    return
  }
  readingProgress.value = Math.min(100, Math.max(0, (scrolled / (totalHeight - window.innerHeight)) * 100))
}

onMounted(() => {
  window.addEventListener('scroll', updateProgress, { passive: true })
  updateProgress()
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateProgress)
})

// ── Social share URLs ─────────────────────────────────────────
const shareUrl = computed(() => {
  if (!import.meta.client) return ''
  return window.location.href
})

const shareTitle = computed(() => post.value?.title ?? '')

// ── Related posts (up to 3 from same category, excluding current) ──
const relatedPosts = computed(() => {
  if (!post.value) return []
  return blogStore.posts
    .filter(p => p.category === post.value!.category && p.id !== post.value!.id)
    .slice(0, 3)
})

function scrollToSection(id: string): void {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <!-- Reading progress bar -->
  <div
    v-if="post"
    class="blog-progress"
    role="progressbar"
    :aria-valuenow="Math.round(readingProgress)"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-label="Progreso de lectura"
  >
    <div class="blog-progress__bar" :style="{ width: `${readingProgress}%` }" />
  </div>

  <!-- Loading skeleton -->
  <div
    v-if="blogStore.isLoading && !post"
    class="blog-article-skeleton"
    aria-busy="true"
    aria-label="Cargando articulo"
  >
    <div class="blog-article-skeleton__hero skeleton-pulse mb-4" aria-hidden="true" />
    <div class="container">
      <div class="skeleton-pulse rounded mb-3 blog-article-skeleton__title" aria-hidden="true" />
      <div class="skeleton-pulse rounded mb-4 blog-article-skeleton__title blog-article-skeleton__title--short" aria-hidden="true" />
      <div class="d-flex gap-3 mb-4" aria-hidden="true">
        <div class="skeleton-pulse rounded-circle" style="width:48px;height:48px" />
        <div class="d-flex flex-column gap-2">
          <div class="skeleton-pulse rounded blog-article-skeleton__meta-line" />
          <div class="skeleton-pulse rounded blog-article-skeleton__meta-line blog-article-skeleton__meta-line--short" />
        </div>
      </div>
      <div class="d-flex flex-column gap-2" aria-hidden="true">
        <div v-for="n in 8" :key="n" class="skeleton-pulse rounded blog-article-skeleton__body-line" :style="n % 5 === 0 ? 'width:60%' : 'width:100%'" />
      </div>
    </div>
  </div>

  <!-- Article content -->
  <article
    v-else-if="post"
    ref="articleEl"
    class="blog-article"
    :aria-label="`Articulo: ${post.title}`"
  >
    <!-- Hero image -->
    <div class="blog-article__hero-wrap">
      <div class="container">
        <div class="blog-article__hero-inner">
          <img
            v-if="showHeroImage"
            :src="safeHeroImage!"
            :alt="`Imagen de portada: ${post.title}`"
            class="blog-article__hero-image"
            width="1200"
            height="500"
            @error="onHeroImgError"
          />
          <div v-else class="blog-article__hero-placeholder" aria-hidden="true">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
              <circle cx="40" cy="48" r="18" fill="rgba(255,255,255,0.2)" />
              <circle cx="24" cy="30" r="8" fill="rgba(255,255,255,0.2)" />
              <circle cx="56" cy="30" r="8" fill="rgba(255,255,255,0.2)" />
            </svg>
          </div>
          <div class="blog-article__hero-overlay">
            <span class="blog-article__category-badge">{{ categoryLabel }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="row">
        <!-- Main content column -->
        <div class="col-12 col-lg-8">
          <!-- Title -->
          <h1 class="blog-article__title mt-4">{{ post.title }}</h1>

          <!-- Author info -->
          <div class="blog-article__author mb-4">
            <div class="blog-article__avatar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="8" r="4" fill="#fff" />
                <path d="M4 20c0-4 4-7 8-7s8 3 8 7" fill="#fff" />
              </svg>
            </div>
            <div>
              <div class="blog-article__author-name">Mopetoo Blog</div>
              <div class="blog-article__author-meta">
                <time v-if="post.published_at" :datetime="post.published_at">
                  {{ formattedPublished }}
                </time>
                <span v-if="readTime" class="blog-article__meta-dot"></span>
                <span>{{ readTime }}</span>
              </div>
            </div>
          </div>

          <!-- Social share -->
          <div class="blog-article__share mb-4">
            <a
              :href="`https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`"
              target="_blank"
              rel="noopener noreferrer"
              class="blog-article__share-btn blog-article__share-btn--whatsapp"
              aria-label="Compartir en WhatsApp"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
            <a
              :href="`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`"
              target="_blank"
              rel="noopener noreferrer"
              class="blog-article__share-btn blog-article__share-btn--facebook"
              aria-label="Compartir en Facebook"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a
              :href="`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`"
              target="_blank"
              rel="noopener noreferrer"
              class="blog-article__share-btn blog-article__share-btn--x"
              aria-label="Compartir en X"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>

          <!-- HTML content (rich text from editor) -->
          <template v-if="isHtmlContent">
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div class="blog-article__body blog-article__body--html" v-html="sanitizedContentWithIds" />
          </template>

          <!-- Plain text content (legacy articles) -->
          <template v-else>
            <div v-if="introParagraph" class="blog-article__intro mb-4">
              <p>{{ introParagraph }}</p>
            </div>

            <div class="blog-article__body">
              <template v-for="(block, index) in bodyBlocks" :key="index">
                <h2
                  v-if="block.isHeading"
                  :id="block.id"
                  class="blog-article__heading"
                >
                  {{ block.text }}
                </h2>
                <p v-else class="blog-article__paragraph">
                  {{ block.text }}
                </p>
              </template>
            </div>
          </template>

          <!-- Back to blog CTA -->
          <div class="blog-article__cta mt-5 mb-4">
            <NuxtLink to="/blog" class="btn btn-primary btn-lg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="me-2" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              Volver al blog
            </NuxtLink>
          </div>
        </div>

        <!-- Sidebar (desktop only) -->
        <aside class="col-lg-4 d-none d-lg-block">
          <div class="blog-sidebar">
            <!-- Table of Contents -->
            <div v-if="(isHtmlContent ? htmlTocItems : tocItems).length > 0" class="blog-sidebar__card mb-4">
              <h3 class="blog-sidebar__card-title">Contenido</h3>
              <nav aria-label="Tabla de contenido">
                <ul class="blog-sidebar__toc">
                  <li v-for="item in (isHtmlContent ? htmlTocItems : tocItems)" :key="item.id">
                    <button
                      type="button"
                      class="blog-sidebar__toc-link"
                      @click="scrollToSection(item.id)"
                    >
                      {{ item.text }}
                    </button>
                  </li>
                </ul>
              </nav>
            </div>

            <!-- App Download CTA -->
            <div class="blog-sidebar__cta-card mb-4">
              <h3 class="blog-sidebar__cta-title">Descarga Mopetoo</h3>
              <p class="blog-sidebar__cta-text">Gestiona la salud de tu mascota desde tu celular.</p>
              <div class="d-flex flex-column gap-2">
                <span class="blog-sidebar__store-badge">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  App Store
                </span>
                <span class="blog-sidebar__store-badge">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-1.707l2.108 1.22a1 1 0 010 1.56l-2.108 1.22-2.537-2.537 2.537-2.463zM5.864 1.457L16.8 8.29l-2.302 2.302-8.635-8.635z" />
                  </svg>
                  Google Play
                </span>
              </div>
            </div>

            <!-- Related articles -->
            <div v-if="relatedPosts.length > 0" class="blog-sidebar__card">
              <h3 class="blog-sidebar__card-title">Articulos relacionados</h3>
              <div class="blog-sidebar__related">
                <NuxtLink
                  v-for="related in relatedPosts"
                  :key="related.id"
                  :to="`/blog/${related.slug}`"
                  class="blog-sidebar__related-item"
                >
                  <span class="blog-sidebar__related-title">{{ related.title }}</span>
                  <span class="blog-sidebar__related-meta">
                    {{ related.published_at ? formatDate(related.published_at) : '' }}
                  </span>
                </NuxtLink>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </article>

  <!-- Post not found -->
  <div v-else class="text-center py-5">
    <div class="mb-3" aria-hidden="true">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M14 2v6h6M12 18v-6M9 15h6" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>
    <h2 class="h5 fw-bold mb-2">Articulo no encontrado</h2>
    <p class="text-muted mb-4">
      El articulo que buscas no existe o ya no esta disponible.
    </p>
    <NuxtLink to="/blog" class="btn btn-primary">
      Ir al blog
    </NuxtLink>
  </div>
</template>

<style scoped lang="scss">
// ── Reading progress bar ─────────────────────────────────────
.blog-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  z-index: 1100;
  background: transparent;

  &__bar {
    height: 100%;
    background: #F97316;
    transition: width 0.1s linear;
    border-radius: 0 2px 2px 0;
  }
}

// ── Hero image ───────────────────────────────────────────────
.blog-article {
  &__hero-wrap {
    padding-top: 1rem;
  }

  &__hero-inner {
    position: relative;
    border-radius: 1.5rem;
    overflow: hidden;
    height: 400px;
    background-color: #dff0e8;

    @media (min-width: 768px) {
      height: 500px;
    }
  }

  &__hero-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__hero-placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #10B981 0%, #065f46 100%);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.4) 0%, transparent 50%);
    display: flex;
    align-items: flex-end;
    padding: 1.5rem;
  }

  &__category-badge {
    display: inline-block;
    background-color: #F97316;
    color: #fff;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    padding: 0.3em 0.75em;
    border-radius: 0.5rem;
  }

  // ── Title ──────────────────────────────────────────────────
  &__title {
    font-size: clamp(1.75rem, 4vw, 3rem);
    font-weight: 800;
    line-height: 1.2;
    color: #111827;
    margin-bottom: 1rem;
  }

  // ── Author info ────────────────────────────────────────────
  &__author {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  &__avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #10B981;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__author-name {
    font-weight: 600;
    color: #111827;
    font-size: 0.95rem;
  }

  &__author-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #6b7280;
    font-size: 0.85rem;
  }

  &__meta-dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background-color: #d1d5db;
    flex-shrink: 0;
  }

  // ── Social share ───────────────────────────────────────────
  &__share {
    display: flex;
    gap: 0.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  &__share-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    color: #fff;
    transition: transform 0.2s ease, opacity 0.2s ease;

    &:hover {
      transform: scale(1.1);
      opacity: 0.9;
    }

    &--whatsapp { background: #25D366; }
    &--facebook { background: #1877F2; }
    &--x { background: #111827; }
  }

  // ── Intro paragraph ────────────────────────────────────────
  &__intro {
    border-left: 4px solid #14b8a6;
    padding-left: 1.25rem;
    font-style: italic;
    color: #374151;
    font-size: 1.1rem;
    line-height: 1.75;

    p {
      margin: 0;
    }
  }

  // ── Body content ───────────────────────────────────────────
  &__body {
    font-size: 1.0625rem;
    line-height: 1.8;
    color: #374151;
  }

  &__heading {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin-top: 2rem;
    margin-bottom: 1rem;
    scroll-margin-top: 80px;
  }

  &__paragraph {
    margin-bottom: 1.25rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  // ── HTML rich content styles ────────────────────────────────
  &__body--html {
    :deep(h2) {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      margin-top: 2rem;
      margin-bottom: 1rem;
      scroll-margin-top: 80px;
    }

    :deep(h3) {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
    }

    :deep(p) {
      margin-bottom: 1.25rem;

      &:last-child {
        margin-bottom: 0;
      }
    }

    :deep(ul), :deep(ol) {
      padding-left: 1.5rem;
      margin-bottom: 1.25rem;
    }

    :deep(li) {
      margin-bottom: 0.25rem;
    }

    :deep(blockquote) {
      border-left: 4px solid #14b8a6;
      padding-left: 1.25rem;
      margin: 1.5rem 0;
      color: #6b7280;
      font-style: italic;
    }

    :deep(a) {
      color: #0d6efd;
      text-decoration: underline;

      &:hover {
        color: #0a58ca;
      }
    }

    :deep(code) {
      background: #f3f4f6;
      padding: 0.15em 0.4em;
      border-radius: 0.25rem;
      font-size: 0.9em;
    }

    :deep(pre) {
      background: #1f2937;
      color: #e5e7eb;
      padding: 1rem;
      border-radius: 0.5rem;
      overflow-x: auto;
      margin-bottom: 1.25rem;

      code {
        background: none;
        padding: 0;
        color: inherit;
      }
    }

    :deep(hr) {
      border: none;
      border-top: 2px solid #e5e7eb;
      margin: 2rem 0;
    }
  }

  // ── CTA ────────────────────────────────────────────────────
  &__cta {
    text-align: center;
    padding: 2rem;
    background: #fff;
    border-radius: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  }
}

// ── Sidebar ──────────────────────────────────────────────────
.blog-sidebar {
  position: sticky;
  top: 2rem;
  padding-top: 1rem;

  &__card {
    background: #fff;
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  }

  &__card-title {
    font-size: 1rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 1rem;
  }

  &__toc {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  &__toc-link {
    display: block;
    width: 100%;
    text-align: left;
    padding: 0.4rem 0;
    border: none;
    background: none;
    color: #6b7280;
    font-size: 0.875rem;
    cursor: pointer;
    transition: color 0.15s ease;

    &:hover {
      color: #10B981;
    }
  }

  // CTA card — dark
  &__cta-card {
    background: #111827;
    border-radius: 1rem;
    padding: 1.5rem;
    color: #fff;
  }

  &__cta-title {
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  &__cta-text {
    font-size: 0.875rem;
    color: #9ca3af;
    margin-bottom: 1rem;
  }

  &__store-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 0.5rem;
    font-size: 0.85rem;
    color: #fff;
  }

  // Related articles
  &__related {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  &__related-item {
    display: block;
    text-decoration: none;
    padding: 0.75rem;
    border-radius: 0.5rem;
    transition: background-color 0.15s ease;

    &:hover {
      background: #f3f4f6;
    }
  }

  &__related-title {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: #111827;
    line-height: 1.4;
    margin-bottom: 0.25rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__related-meta {
    font-size: 0.75rem;
    color: #9ca3af;
  }
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

.blog-article-skeleton {
  &__hero {
    height: 300px;
    border-radius: 1.5rem;

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
