// ============================================================
// BlogCard.test.ts
// Tests for the BlogCard component.
//
// Strategy: mountSuspended resolves Nuxt auto-imports. The component
// receives a single BlogPost prop and renders its content.
//
// Key design points:
//   - isSafeImageUrl guard: http/https accepted; javascript: / data: rejected.
//   - SVG placeholder rendered when featured_image is absent or blocked.
//   - Author avatar: safe URL shows <img>; otherwise initial fallback letter.
//   - Date is formatted in Spanish via Intl.DateTimeFormat — not the raw ISO string.
//   - Up to 3 tags are shown; +N overflow badge when more than 3 tags exist.
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
import type { BlogPost, BlogCategory } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makeBlogCategory(overrides: Partial<BlogCategory> = {}): BlogCategory {
  return {
    id: 'cat-1',
    slug: 'salud',
    name: 'Salud',
    post_count: 5,
    ...overrides,
  }
}

function makeBlogPost(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    id: 'post-1',
    slug: 'cuidado-perros',
    title: 'Cuidado de perros en verano',
    excerpt: 'Consejos para mantener a tu perro fresco durante el verano.',
    content: 'Párrafo uno.\nPárrafo dos.\nPárrafo tres.',
    featured_image: 'https://example.com/image.jpg',
    author: {
      id: 'author-1',
      name: 'Ana García',
      avatar: 'https://example.com/avatar.jpg',
    },
    category: makeBlogCategory(),
    tags: ['perros', 'verano', 'salud'],
    published_at: '2025-06-15T10:00:00Z',
    updated_at: '2025-06-15T10:00:00Z',
    reading_time_minutes: 5,
    is_published: true,
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
      // Use custom stub so NuxtLink slot content (title text) is visible
      const wrapper = await mountSuspended(BlogCard, {
        props: { post: defaultPost },
        global: { stubs: { NuxtLink: NuxtLinkHrefStub } },
      })
      expect(wrapper.text()).toContain('Cuidado de perros en verano')
    })

    it('renders the post excerpt', async () => {
      const wrapper = await mountSuspended(BlogCard, {
        props: { post: defaultPost },
        global: { stubs: { NuxtLink: NuxtLinkHrefStub } },
      })
      expect(wrapper.text()).toContain('Consejos para mantener a tu perro fresco durante el verano.')
    })

    it('renders the category badge with post.category.name', async () => {
      const wrapper = await mountSuspended(BlogCard, {
        props: { post: defaultPost },
        global: { stubs: { NuxtLink: NuxtLinkHrefStub } },
      })
      const badge = wrapper.find('.blog-card__category-badge')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toContain('Salud')
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

  // ── Featured image ──────────────────────────────────────────

  describe('featured image', () => {
    it('shows the featured image when featured_image is a valid https URL', async () => {
      const post = makeBlogPost({ featured_image: 'https://example.com/image.jpg' })
      const wrapper = await mountSuspended(BlogCard, {
        props: { post },
        global: { stubs: { NuxtLink: true } },
      })
      const img = wrapper.find('.blog-card__image')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toBe('https://example.com/image.jpg')
    })

    it('shows SVG placeholder when featured_image is undefined', async () => {
      const post = makeBlogPost({ featured_image: undefined })
      const wrapper = await mountSuspended(BlogCard, {
        props: { post },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('.blog-card__image').exists()).toBe(false)
      expect(wrapper.find('.blog-card__placeholder').exists()).toBe(true)
      expect(wrapper.find('svg').exists()).toBe(true)
    })

    it('shows SVG placeholder when featured_image is a javascript: URI (blocked)', async () => {
      const post = makeBlogPost({ featured_image: 'javascript:alert(1)' })
      const wrapper = await mountSuspended(BlogCard, {
        props: { post },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('.blog-card__image').exists()).toBe(false)
      expect(wrapper.find('.blog-card__placeholder').exists()).toBe(true)
    })

    it('shows SVG placeholder when featured_image is a data: URI (blocked)', async () => {
      const post = makeBlogPost({ featured_image: 'data:image/png;base64,abc123' })
      const wrapper = await mountSuspended(BlogCard, {
        props: { post },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('.blog-card__image').exists()).toBe(false)
      expect(wrapper.find('.blog-card__placeholder').exists()).toBe(true)
    })

    it('shows SVG placeholder after @error event on the featured image', async () => {
      const post = makeBlogPost({ featured_image: 'https://example.com/broken.jpg' })
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

  // ── Author ──────────────────────────────────────────────────

  describe('author', () => {
    it('shows author avatar image when author.avatar is a safe https URL', async () => {
      const post = makeBlogPost({
        author: { id: 'a1', name: 'Ana García', avatar: 'https://example.com/avatar.jpg' },
      })
      const wrapper = await mountSuspended(BlogCard, {
        props: { post },
        global: { stubs: { NuxtLink: true } },
      })
      const avatar = wrapper.find('.blog-card__avatar')
      expect(avatar.exists()).toBe(true)
      expect(avatar.attributes('src')).toBe('https://example.com/avatar.jpg')
    })

    it('shows initial fallback when author.avatar is undefined', async () => {
      const post = makeBlogPost({
        author: { id: 'a1', name: 'Ana García', avatar: undefined },
      })
      const wrapper = await mountSuspended(BlogCard, {
        props: { post },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('.blog-card__avatar').exists()).toBe(false)
      const fallback = wrapper.find('.blog-card__avatar-fallback')
      expect(fallback.exists()).toBe(true)
      expect(fallback.text()).toBe('A') // first letter of "Ana García" uppercased
    })

    it('initial fallback letter is always uppercase', async () => {
      const post = makeBlogPost({
        author: { id: 'a1', name: 'pedro Ramírez', avatar: undefined },
      })
      const wrapper = await mountSuspended(BlogCard, {
        props: { post },
        global: { stubs: { NuxtLink: true } },
      })
      const fallback = wrapper.find('.blog-card__avatar-fallback')
      expect(fallback.text()).toBe('P')
    })

    it('shows initial fallback after @error event on avatar image', async () => {
      const post = makeBlogPost({
        author: { id: 'a1', name: 'Ana García', avatar: 'https://example.com/broken-avatar.jpg' },
      })
      const wrapper = await mountSuspended(BlogCard, {
        props: { post },
        global: { stubs: { NuxtLink: true } },
      })
      await wrapper.find('.blog-card__avatar').trigger('error')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.blog-card__avatar').exists()).toBe(false)
      expect(wrapper.find('.blog-card__avatar-fallback').exists()).toBe(true)
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
  })

  // ── Reading time badge ──────────────────────────────────────

  describe('reading time badge', () => {
    it('shows reading time badge when reading_time_minutes is defined', async () => {
      const post = makeBlogPost({ reading_time_minutes: 5 })
      const wrapper = await mountSuspended(BlogCard, {
        props: { post },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('5 min de lectura')
    })

    it('hides reading time badge when reading_time_minutes is undefined', async () => {
      const post = makeBlogPost({ reading_time_minutes: undefined })
      const wrapper = await mountSuspended(BlogCard, {
        props: { post },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).not.toContain('min de lectura')
    })

    it('shows "1 min de lectura" when reading_time_minutes is 1', async () => {
      const post = makeBlogPost({ reading_time_minutes: 1 })
      const wrapper = await mountSuspended(BlogCard, {
        props: { post },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('1 min de lectura')
    })
  })

  // ── Tags ───────────────────────────────────────────────────

  describe('tags', () => {
    it('renders up to 3 tags', async () => {
      const post = makeBlogPost({ tags: ['perros', 'verano', 'salud'] })
      const wrapper = await mountSuspended(BlogCard, {
        props: { post },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('perros')
      expect(wrapper.text()).toContain('verano')
      expect(wrapper.text()).toContain('salud')
    })

    it('does NOT show overflow badge when tags.length <= 3', async () => {
      const post = makeBlogPost({ tags: ['perros', 'verano', 'salud'] })
      const wrapper = await mountSuspended(BlogCard, {
        props: { post },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).not.toContain('+')
    })

    it('shows +N overflow badge when tags.length > 3', async () => {
      const post = makeBlogPost({ tags: ['perros', 'verano', 'salud', 'nutricion', 'ejercicio'] })
      const wrapper = await mountSuspended(BlogCard, {
        props: { post },
        global: { stubs: { NuxtLink: true } },
      })
      // 5 tags — 3 shown — 2 hidden — badge shows +2
      expect(wrapper.text()).toContain('+2')
    })

    it('overflow badge value is the correct count of hidden tags', async () => {
      const post = makeBlogPost({ tags: ['t1', 't2', 't3', 't4'] })
      const wrapper = await mountSuspended(BlogCard, {
        props: { post },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('+1')
    })

    it('renders no tag section when tags array is empty', async () => {
      const post = makeBlogPost({ tags: [] })
      const wrapper = await mountSuspended(BlogCard, {
        props: { post },
        global: { stubs: { NuxtLink: true } },
      })
      const tagSection = wrapper.find('[aria-label="Etiquetas"]')
      expect(tagSection.exists()).toBe(false)
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
      // The title link is the first <a> inside the card title
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
