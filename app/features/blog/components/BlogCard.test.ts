// ============================================================
// BlogCard.test.ts
// Tests for the BlogCard component.
//
// Strategy: mountSuspended resolves Nuxt auto-imports. The component
// receives a single BlogPost prop and renders its content.
//
// Key design points:
//   - isSafeImageUrl guard: http/https accepted; javascript: / data: rejected.
//   - SVG placeholder rendered when cover_image_url is absent or blocked.
//   - Date is formatted in Spanish via Intl.DateTimeFormat — not the raw ISO string.
//   - Excerpt derived from content (first 150 chars + '...').
//   - Category label via BLOG_CATEGORIES lookup.
//   - Title NuxtLink href: /blog/<slug> verified via custom NuxtLink stub.
//
// NuxtLink stubs:
//   - { NuxtLink: true } — stubs as <nuxtlink-stub>, slot content hidden.
//     Used when href is irrelevant.
//   - Custom stub { template: '<a :href="to"><slot /></a>', props: ['to'] } —
//     renders slot content visible and forwards :to as href. Used for href assertions.
//
// What this suite does NOT cover intentionally:
//   - CSS transitions / SCSS visual styles.
//   - img @error network events (happy-dom does not fire real network errors).
//     The @error handler is verified by directly triggering the error event.
// ============================================================

import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BlogCard from './BlogCard.vue'
import type { BlogPost } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makeBlogPost(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    id: 1,
    slug: 'cuidado-perros',
    title: 'Cuidado de perros en verano',
    content: 'Párrafo uno.\nPárrafo dos.\nPárrafo tres.',
    cover_image_url: 'https://example.com/image.jpg',
    category: 'salud',
    published: true,
    published_at: '2025-06-15T10:00:00Z',
    created_at: '2025-06-15T10:00:00Z',
    updated_at: '2025-06-15T10:00:00Z',
    ...overrides,
  }
}

// Custom NuxtLink stub that forwards :to as href and renders slot content.
// Required for all tests where text inside a NuxtLink must be visible
// (e.g. title, category badge) and for href assertions.
// NuxtLink: true hides slot content; NuxtLink: false renders without href.
const NuxtLinkHrefStub = {
  template: '<a :href="to"><slot /></a>',
  props: ['to'],
}

const defaultPost = makeBlogPost()

// ── Suite ─────────────────────────────────────────────────────

describe('BlogCard', () => {
  // ── Core content ───────────────────────────────────────────

  describe('core content', () => {
    it('renders the post title', async () => {
      const wrapper = await mountSuspended(BlogCard, {
        props: { post: defaultPost },
        global: { stubs: { NuxtLink: NuxtLinkHrefStub } },
      })
      expect(wrapper.text()).toContain('Cuidado de perros en verano')
    })

    it('renders the excerpt derived from content (first 150 chars + "...")', async () => {
      const longContent = 'A'.repeat(200)
      const post = makeBlogPost({ content: longContent })
      const wrapper = await mountSuspended(BlogCard, {
        props: { post },
        global: { stubs: { NuxtLink: NuxtLinkHrefStub } },
      })
      expect(wrapper.text()).toContain('A'.repeat(150) + '...')
    })

    it('renders the full content as excerpt when content is 150 chars or less', async () => {
      const shortContent = 'Contenido corto.'
      const post = makeBlogPost({ content: shortContent })
      const wrapper = await mountSuspended(BlogCard, {
        props: { post },
        global: { stubs: { NuxtLink: NuxtLinkHrefStub } },
      })
      expect(wrapper.text()).toContain('Contenido corto.')
      expect(wrapper.text()).not.toContain('...')
    })

    it('renders the category badge with the label from BLOG_CATEGORIES lookup', async () => {
      const wrapper = await mountSuspended(BlogCard, {
        props: { post: defaultPost },
        global: { stubs: { NuxtLink: NuxtLinkHrefStub } },
      })
      const badge = wrapper.find('.blog-card__category-badge')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toContain('Salud')
    })

    it('falls back to raw category value when category is not in BLOG_CATEGORIES', async () => {
      const post = makeBlogPost({ category: 'desconocida' as any })
      const wrapper = await mountSuspended(BlogCard, {
        props: { post },
        global: { stubs: { NuxtLink: NuxtLinkHrefStub } },
      })
      const badge = wrapper.find('.blog-card__category-badge')
      expect(badge.text()).toContain('desconocida')
    })

    it('wraps in an <article> element with correct aria-label', async () => {
      const wrapper = await mountSuspended(BlogCard, {
        props: { post: defaultPost },
        global: { stubs: { NuxtLink: NuxtLinkHrefStub } },
      })
      const article = wrapper.find('article')
      expect(article.exists()).toBe(true)
      expect(article.attributes('aria-label')).toContain('Cuidado de perros en verano')
    })
  })

  // ── Cover image ───────────────────────────────────────────

  describe('cover image', () => {
    it('shows the cover image when cover_image_url is a valid https URL', async () => {
      const post = makeBlogPost({ cover_image_url: 'https://example.com/image.jpg' })
      const wrapper = await mountSuspended(BlogCard, {
        props: { post },
        global: { stubs: { NuxtLink: true } },
      })
      const img = wrapper.find('.blog-card__image')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toBe('https://example.com/image.jpg')
    })

    it('shows SVG placeholder when cover_image_url is undefined', async () => {
      const post = makeBlogPost({ cover_image_url: undefined })
      const wrapper = await mountSuspended(BlogCard, {
        props: { post },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('.blog-card__image').exists()).toBe(false)
      expect(wrapper.find('.blog-card__placeholder').exists()).toBe(true)
      expect(wrapper.find('svg').exists()).toBe(true)
    })

    it('shows SVG placeholder when cover_image_url is a javascript: URI (blocked)', async () => {
      const post = makeBlogPost({ cover_image_url: 'javascript:alert(1)' })
      const wrapper = await mountSuspended(BlogCard, {
        props: { post },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('.blog-card__image').exists()).toBe(false)
      expect(wrapper.find('.blog-card__placeholder').exists()).toBe(true)
    })

    it('shows SVG placeholder when cover_image_url is a data: URI (blocked)', async () => {
      const post = makeBlogPost({ cover_image_url: 'data:image/png;base64,abc123' })
      const wrapper = await mountSuspended(BlogCard, {
        props: { post },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('.blog-card__image').exists()).toBe(false)
      expect(wrapper.find('.blog-card__placeholder').exists()).toBe(true)
    })

    it('shows SVG placeholder after @error event on the cover image', async () => {
      const post = makeBlogPost({ cover_image_url: 'https://example.com/broken.jpg' })
      const wrapper = await mountSuspended(BlogCard, {
        props: { post },
        global: { stubs: { NuxtLink: true } },
      })
      // Trigger image error to simulate broken URL
      await wrapper.find('.blog-card__image').trigger('error')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.blog-card__image').exists()).toBe(false)
      expect(wrapper.find('.blog-card__placeholder').exists()).toBe(true)
    })
  })

  // ── Date formatting ─────────────────────────────────────────

  describe('date formatting', () => {
    it('renders the published date in Spanish (not the raw ISO string)', async () => {
      const post = makeBlogPost({ published_at: '2025-06-15T10:00:00Z' })
      const wrapper = await mountSuspended(BlogCard, {
        props: { post },
        global: { stubs: { NuxtLink: true } },
      })
      // The raw ISO string should NOT appear in the rendered output
      expect(wrapper.text()).not.toContain('2025-06-15T10:00:00Z')
      // The <time> element should contain a Spanish-formatted date
      const timeEl = wrapper.find('time')
      expect(timeEl.exists()).toBe(true)
      expect(timeEl.text()).toContain('2025')
    })

    it('the <time> element has the original ISO string as datetime attribute', async () => {
      const post = makeBlogPost({ published_at: '2025-06-15T10:00:00Z' })
      const wrapper = await mountSuspended(BlogCard, {
        props: { post },
        global: { stubs: { NuxtLink: true } },
      })
      const timeEl = wrapper.find('time')
      expect(timeEl.attributes('datetime')).toBe('2025-06-15T10:00:00Z')
    })

    it('does not render <time> element when published_at is undefined', async () => {
      const post = makeBlogPost({ published_at: undefined })
      const wrapper = await mountSuspended(BlogCard, {
        props: { post },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('time').exists()).toBe(false)
    })
  })

  // ── Title NuxtLink ──────────────────────────────────────────

  describe('title NuxtLink', () => {
    it('title link href resolves to /blog/<slug>', async () => {
      const post = makeBlogPost({ slug: 'cuidado-perros' })
      const wrapper = await mountSuspended(BlogCard, {
        props: { post },
        global: { stubs: { NuxtLink: NuxtLinkHrefStub } },
      })
      const titleLink = wrapper.find('.blog-card__title-link')
      expect(titleLink.exists()).toBe(true)
      expect(titleLink.attributes('href')).toBe('/blog/cuidado-perros')
    })

    it('title link text contains the post title', async () => {
      const post = makeBlogPost({ slug: 'mi-articulo', title: 'Mi Artículo de Prueba' })
      const wrapper = await mountSuspended(BlogCard, {
        props: { post },
        global: { stubs: { NuxtLink: NuxtLinkHrefStub } },
      })
      const titleLink = wrapper.find('.blog-card__title-link')
      expect(titleLink.text()).toContain('Mi Artículo de Prueba')
    })
  })
})
