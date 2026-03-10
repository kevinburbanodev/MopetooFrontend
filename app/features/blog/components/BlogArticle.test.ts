// ============================================================
// BlogArticle.test.ts
// Tests for the BlogArticle component (Stitch redesign).
//
// Key design changes from redesign:
//   - Reading progress bar (fixed top, orange).
//   - Hero image with rounded container (not <figure>).
//   - Author info section with avatar placeholder.
//   - Social share buttons (WhatsApp, Facebook, X).
//   - Intro paragraph with teal left border.
//   - Heading heuristic: short paragraphs without trailing period are headings.
//   - Sidebar (desktop only): TOC, app download CTA, related articles.
//   - "Volver al blog" CTA replaces "Ver más artículos".
//   - "Actualizado el" section removed.
// ============================================================

import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createTestingPinia } from '@pinia/testing'
import BlogArticle from './BlogArticle.vue'
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

      const skeleton = wrapper.find('[aria-busy="true"]')
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

    it('does NOT render "Articulo no encontrado" when loading', async () => {
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: null, isLoading: true } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      expect(wrapper.text()).not.toContain('Articulo no encontrado')
    })
  })

  // ── Not found state ────────────────────────────────────────

  describe('"Articulo no encontrado" state', () => {
    it('shows "Articulo no encontrado" when isLoading=false and selectedPost=null', async () => {
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: null, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      expect(wrapper.text()).toContain('Articulo no encontrado')
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

      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(false)
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

      expect(wrapper.text()).not.toContain('2025-06-15T10:00:00Z')
      const timeEl = wrapper.find('time')
      expect(timeEl.exists()).toBe(true)
      expect(timeEl.text()).toContain('2025')
    })

    it('renders the category name badge via BLOG_CATEGORIES lookup', async () => {
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

    it('falls back to raw category value when not in BLOG_CATEGORIES', async () => {
      const post = makeBlogPost({ category: 'desconocida' as any })
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: post, isLoading: false } },
          })],
          stubs: { NuxtLink: NuxtLinkHrefStub },
        },
      })

      expect(wrapper.text()).toContain('desconocida')
    })

    it('renders read time estimate', async () => {
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: mockPost, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      expect(wrapper.text()).toContain('min lectura')
    })

    it('renders author name "Mopetoo Blog"', async () => {
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: mockPost, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      expect(wrapper.text()).toContain('Mopetoo Blog')
    })
  })

  // ── Hero image ─────────────────────────────────────────────

  describe('hero image', () => {
    it('shows hero image when cover_image_url is a valid https URL', async () => {
      const post = makeBlogPost({ cover_image_url: 'https://example.com/hero.jpg' })
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: post, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      const heroInner = wrapper.find('.blog-article__hero-inner')
      expect(heroInner.exists()).toBe(true)
      const img = wrapper.find('.blog-article__hero-image')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toBe('https://example.com/hero.jpg')
    })

    it('shows placeholder when cover_image_url is undefined', async () => {
      const post = makeBlogPost({ cover_image_url: undefined })
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: post, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      expect(wrapper.find('.blog-article__hero-image').exists()).toBe(false)
      expect(wrapper.find('.blog-article__hero-placeholder').exists()).toBe(true)
    })

    it('shows placeholder when cover_image_url is a javascript: URI (blocked)', async () => {
      const post = makeBlogPost({ cover_image_url: 'javascript:alert(1)' })
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: post, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      expect(wrapper.find('.blog-article__hero-image').exists()).toBe(false)
      expect(wrapper.find('.blog-article__hero-placeholder').exists()).toBe(true)
    })

    it('shows placeholder after @error event on the hero img element', async () => {
      const post = makeBlogPost({ cover_image_url: 'https://example.com/broken.jpg' })
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

      expect(wrapper.find('.blog-article__hero-image').exists()).toBe(false)
      expect(wrapper.find('.blog-article__hero-placeholder').exists()).toBe(true)
    })
  })

  // ── Article content ────────────────────────────────────────

  describe('article content', () => {
    it('renders content paragraphs', async () => {
      // Use content where all lines end with periods (so none become headings)
      const post = makeBlogPost({ content: 'Parrafo uno es largo y tiene punto.\nParrafo dos es largo y tiene punto.' })
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: post, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      const paragraphs = wrapper.findAll('.blog-article__paragraph')
      // First paragraph becomes intro, second goes to body
      expect(paragraphs.length).toBeGreaterThanOrEqual(1)
    })

    it('renders intro paragraph with teal border', async () => {
      const post = makeBlogPost({ content: 'Este es el primer parrafo largo con punto.\nSegundo parrafo.' })
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: post, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      expect(wrapper.find('.blog-article__intro').exists()).toBe(true)
    })

    it('renders short paragraphs without trailing period as headings', async () => {
      const post = makeBlogPost({ content: 'Introduccion del articulo con punto.\nTitulo corto\nContenido del parrafo con punto.' })
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: post, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      const headings = wrapper.findAll('.blog-article__heading')
      expect(headings.length).toBeGreaterThanOrEqual(1)
      expect(headings[0].text()).toBe('Titulo corto')
    })

    it('filters out empty lines from content', async () => {
      const post = makeBlogPost({ content: 'Parrafo uno es largo con punto.\n\nParrafo dos es largo con punto.' })
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: post, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      // Content should render without blank paragraphs
      expect(wrapper.text()).toContain('Parrafo uno')
      expect(wrapper.text()).toContain('Parrafo dos')
    })
  })

  // ── Social share ───────────────────────────────────────────

  describe('social share', () => {
    it('renders social share buttons', async () => {
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: mockPost, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      expect(wrapper.find('.blog-article__share').exists()).toBe(true)
      expect(wrapper.findAll('.blog-article__share-btn')).toHaveLength(3)
    })
  })

  // ── Reading progress bar ───────────────────────────────────

  describe('reading progress bar', () => {
    it('renders the progress bar when post is loaded', async () => {
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: mockPost, isLoading: false } },
          })],
          stubs: { NuxtLink: true },
        },
      })

      expect(wrapper.find('.blog-progress').exists()).toBe(true)
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

    it('"Ir al blog" link shown in not-found state goes to /blog', async () => {
      const wrapper = await mountSuspended(BlogArticle, {
        global: {
          plugins: [createTestingPinia({
            initialState: { blog: { selectedPost: null, isLoading: false } },
          })],
          stubs: { NuxtLink: NuxtLinkHrefStub },
        },
      })

      const blogLinks = wrapper.findAll('a').filter(a => a.text().includes('Ir al blog'))
      expect(blogLinks.length).toBeGreaterThan(0)
      expect(blogLinks[0].attributes('href')).toBe('/blog')
    })
  })
})
