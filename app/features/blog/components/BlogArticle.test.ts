// ============================================================
// BlogArticle.test.ts
// Tests for the BlogArticle component.
//
// Strategy: mountSuspended resolves Nuxt auto-imports. BlogArticle
// has NO props — it reads selectedPost directly from useBlogStore().
// We use createTestingPinia with initialState to control what the
// store contains before mounting.
//
// Key design points:
//   - Loading skeleton: shown when isLoading=true and selectedPost=null.
//   - "Artículo no encontrado": shown when isLoading=false and selectedPost=null.
//   - Full article: rendered when selectedPost is non-null.
//   - isSafeImageUrl guard on hero image: https/http accepted; javascript: rejected.
//   - Author avatar: safe URL shows <img>; fallback initial letter otherwise.
//   - Date formatting: Spanish Intl.DateTimeFormat — not the raw ISO string.
//   - Content rendered as <p> elements split on '\n'.
//   - "Actualizado el" shown only when updated_at !== published_at.
//   - NuxtLink hrefs verified via custom stub.
//
// Important:
//   - initialState key must match the store id: 'blog' (defined in blog.store.ts).
//
// What this suite does NOT cover intentionally:
//   - CSS transitions / SCSS visual styles.
//   - img @error network events beyond triggering the DOM event.
// ============================================================

import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createTestingPinia } from '@pinia/testing'
import BlogArticle from './BlogArticle.vue'
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
const NuxtLinkHrefStub = {
  template: '<a :href="to"><slot /></a>',
  props: ['to'],
}

const mockPost = makeBlogPost()

// ── Suite ─────────────────────────────────────────────────────

describe('BlogArticle', () => {
  // ── Loading skeleton ───────────────────────────────────────

  describe('loading skeleton', () => {
    it('shows loading skeleton when isLoading=true and selectedPost=null', async () => {
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: null, isLoading: true } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      const skeleton = wrapper.find('[aria-label="Cargando artículo"]')
      expect(skeleton.exists()).toBe(true)
    })

    it('skeleton has aria-busy="true"', async () => {
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: null, isLoading: true } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
    })

    it('does NOT render article element when loading', async () => {
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: null, isLoading: true } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      expect(wrapper.find('article').exists()).toBe(false)
    })

    it('does NOT render "Artículo no encontrado" when loading', async () => {
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: null, isLoading: true } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      expect(wrapper.text()).not.toContain('Artículo no encontrado')
    })
  })

  // ── Not found state ────────────────────────────────────────

  describe('"Artículo no encontrado" state', () => {
    it('shows "Artículo no encontrado" when isLoading=false and selectedPost=null', async () => {
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: null, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      expect(wrapper.text()).toContain('Artículo no encontrado')
    })

    it('does NOT render article element in not-found state', async () => {
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: null, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      expect(wrapper.find('article').exists()).toBe(false)
    })

    it('does NOT show loading skeleton in not-found state', async () => {
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: null, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      expect(wrapper.find('[aria-label="Cargando artículo"]').exists()).toBe(false)
    })
  })

  // ── Article rendering ──────────────────────────────────────

  describe('article rendering', () => {
    it('renders the article title when post is set', async () => {
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: mockPost, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      expect(wrapper.find('h1').text()).toContain('Cuidado de perros en verano')
    })

    it('article element has aria-label containing the post title', async () => {
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: mockPost, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      const article = wrapper.find('article')
      expect(article.exists()).toBe(true)
      expect(article.attributes('aria-label')).toContain('Cuidado de perros en verano')
    })

    it('renders formatted published date in Spanish (not raw ISO)', async () => {
      const post = makeBlogPost({ published_at: '2025-06-15T10:00:00Z' })
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: post, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      // Raw ISO string must NOT appear in rendered text
      expect(wrapper.text()).not.toContain('2025-06-15T10:00:00Z')
      // The <time> element should exist and contain a year
      const timeEl = wrapper.find('time')
      expect(timeEl.exists()).toBe(true)
      expect(timeEl.text()).toContain('2025')
    })

    it('renders the category name badge', async () => {
      // Category name is inside a NuxtLink — use custom stub so slot text is visible
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: mockPost, isLoading: false } },
          })],
          stubs: { NuxtLink: NuxtLinkHrefStub },
        },
      })

      expect(wrapper.text()).toContain('Salud')
    })

    it('renders reading time badge when reading_time_minutes is defined', async () => {
      const post = makeBlogPost({ reading_time_minutes: 7 })
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: post, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      expect(wrapper.text()).toContain('7 min de lectura')
    })

    it('hides reading time badge when reading_time_minutes is undefined', async () => {
      const post = makeBlogPost({ reading_time_minutes: undefined })
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: post, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      expect(wrapper.text()).not.toContain('min de lectura')
    })
  })

  // ── Hero image ─────────────────────────────────────────────

  describe('hero image', () => {
    it('shows hero image when featured_image is a valid https URL', async () => {
      const post = makeBlogPost({ featured_image: 'https://example.com/hero.jpg' })
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: post, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      const figure = wrapper.find('figure.blog-article__hero-wrap')
      expect(figure.exists()).toBe(true)
      const img = figure.find('img')
      expect(img.attributes('src')).toBe('https://example.com/hero.jpg')
    })

    it('hides hero image when featured_image is undefined', async () => {
      const post = makeBlogPost({ featured_image: undefined })
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: post, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      expect(wrapper.find('figure.blog-article__hero-wrap').exists()).toBe(false)
    })

    it('hides hero image when featured_image is a javascript: URI (blocked by isSafeImageUrl)', async () => {
      const post = makeBlogPost({ featured_image: 'javascript:alert(1)' })
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: post, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      expect(wrapper.find('figure.blog-article__hero-wrap').exists()).toBe(false)
    })

    it('hides hero image after @error event on the hero img element', async () => {
      const post = makeBlogPost({ featured_image: 'https://example.com/broken.jpg' })
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: post, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      await wrapper.find('.blog-article__hero-image').trigger('error')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('figure.blog-article__hero-wrap').exists()).toBe(false)
    })
  })

  // ── Author avatar ──────────────────────────────────────────

  describe('author avatar', () => {
    it('shows author avatar img when author.avatar is a safe https URL', async () => {
      const post = makeBlogPost({
        author: { id: 'a1', name: 'Ana García', avatar: 'https://example.com/avatar.jpg' },
      })
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: post, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      const avatar = wrapper.find('.blog-article__author-avatar')
      expect(avatar.exists()).toBe(true)
      expect(avatar.attributes('src')).toBe('https://example.com/avatar.jpg')
    })

    it('shows initial fallback when author.avatar is undefined', async () => {
      const post = makeBlogPost({
        author: { id: 'a1', name: 'Ana García', avatar: undefined },
      })
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: post, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      expect(wrapper.find('.blog-article__author-avatar').exists()).toBe(false)
      const fallback = wrapper.find('.blog-article__author-avatar-fallback')
      expect(fallback.exists()).toBe(true)
      expect(fallback.text()).toBe('A') // first letter of "Ana García" uppercased
    })

    it('shows initial fallback after @error event on avatar img', async () => {
      const post = makeBlogPost({
        author: { id: 'a1', name: 'Ana García', avatar: 'https://example.com/broken-avatar.jpg' },
      })
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: post, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      await wrapper.find('.blog-article__author-avatar').trigger('error')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.blog-article__author-avatar').exists()).toBe(false)
      expect(wrapper.find('.blog-article__author-avatar-fallback').exists()).toBe(true)
    })
  })

  // ── Article content ────────────────────────────────────────

  describe('article content', () => {
    it('renders content as plain text paragraphs split on \\n', async () => {
      const post = makeBlogPost({ content: 'Párrafo uno.\nPárrafo dos.' })
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: post, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      const paragraphs = wrapper.findAll('.blog-article__paragraph')
      expect(paragraphs).toHaveLength(2)
      expect(paragraphs[0].text()).toBe('Párrafo uno.')
      expect(paragraphs[1].text()).toBe('Párrafo dos.')
    })

    it('renders three paragraphs when content has three lines', async () => {
      const post = makeBlogPost({ content: 'Uno.\nDos.\nTres.' })
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: post, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      expect(wrapper.findAll('.blog-article__paragraph')).toHaveLength(3)
    })

    it('filters out empty lines from content (filter(Boolean))', async () => {
      const post = makeBlogPost({ content: 'Uno.\n\nDos.' }) // double newline = empty line
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: post, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      // Empty line filtered out — only 2 paragraphs
      expect(wrapper.findAll('.blog-article__paragraph')).toHaveLength(2)
    })
  })

  // ── Tags ───────────────────────────────────────────────────

  describe('tags', () => {
    it('renders each tag as a badge', async () => {
      const post = makeBlogPost({ tags: ['perros', 'verano', 'salud'] })
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: post, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      expect(wrapper.text()).toContain('perros')
      expect(wrapper.text()).toContain('verano')
      expect(wrapper.text()).toContain('salud')
    })

    it('renders no tag section when tags array is empty', async () => {
      const post = makeBlogPost({ tags: [] })
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: post, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      expect(wrapper.text()).not.toContain('Etiquetas:')
    })
  })

  // ── Updated date ───────────────────────────────────────────

  describe('"Actualizado el" section', () => {
    it('shows "Actualizado el" when updated_at differs from published_at', async () => {
      const post = makeBlogPost({
        published_at: '2025-06-15T10:00:00Z',
        updated_at: '2025-07-01T10:00:00Z', // different date
      })
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: post, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      expect(wrapper.text()).toContain('Actualizado el')
    })

    it('hides "Actualizado el" when updated_at equals published_at', async () => {
      const post = makeBlogPost({
        published_at: '2025-06-15T10:00:00Z',
        updated_at: '2025-06-15T10:00:00Z', // same date
      })
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: post, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      expect(wrapper.text()).not.toContain('Actualizado el')
    })
  })

  // ── Navigation links ───────────────────────────────────────

  describe('navigation links', () => {
    it('"Volver al blog" link goes to /blog', async () => {
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: mockPost, isLoading: false } },
          })],
          stubs: { NuxtLink: NuxtLinkHrefStub },
        },
      })

      const backLinks = wrapper.findAll('a').filter(a => a.text().includes('Volver al blog'))
      expect(backLinks.length).toBeGreaterThan(0)
      expect(backLinks[0].attributes('href')).toBe('/blog')
    })

    it('"Ver más artículos" CTA link goes to /blog', async () => {
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: mockPost, isLoading: false } },
          })],
          stubs: { NuxtLink: NuxtLinkHrefStub },
        },
      })

      const ctaLinks = wrapper.findAll('a').filter(a => a.text().includes('Ver más artículos'))
      expect(ctaLinks.length).toBeGreaterThan(0)
      expect(ctaLinks[0].attributes('href')).toBe('/blog')
    })
  })
})
