// ============================================================
// useBlog.test.ts
// Tests the useBlog composable in a Nuxt test environment.
//
// Mocking strategy:
//   - useApi() is mocked via vi.mock — it is a project composable,
//     not a Nuxt built-in, so mockNuxtImport is NOT the right tool.
//   - useRuntimeConfig is NOT mocked. NUXT_PUBLIC_API_BASE is
//     provided via vitest.config.ts env options.
//   - Pinia is isolated per test via createTestingPinia (stubActions: false)
//     so real store action logic runs and we can spy on it.
//
// What this suite does NOT cover intentionally:
//   - Network retry logic — no retry exists in the implementation.
//   - Page navigation — belongs in page-level or middleware tests.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import type { BlogPost, BlogCategory, BlogListResponse } from '../types'

// ── useApi mock ──────────────────────────────────────────────
// useApi is a project composable — vi.mock intercepts the module.

const mockGet = vi.fn()

vi.mock('../../shared/composables/useApi', () => ({
  useApi: () => ({ get: mockGet }),
}))

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

const postA = makeBlogPost({ id: 'post-1', slug: 'articulo-a', title: 'Artículo A' })
const postB = makeBlogPost({ id: 'post-2', slug: 'articulo-b', title: 'Artículo B' })

const catA = makeBlogCategory({ id: 'cat-1', slug: 'salud', name: 'Salud' })
const catB = makeBlogCategory({ id: 'cat-2', slug: 'nutricion', name: 'Nutrición' })

const paginatedResponse: BlogListResponse = {
  posts: [postA, postB],
  total: 20,
  page: 2,
  limit: 9,
  total_pages: 3,
}

// ── Suite ─────────────────────────────────────────────────────

describe('useBlog', () => {
  let blogStore: ReturnType<typeof import('../stores/blog.store').useBlogStore>

  beforeEach(async () => {
    // Isolate Pinia per test.
    // stubActions: false so real store action logic runs.
    setActivePinia(
      createTestingPinia({ stubActions: false, createSpy: vi.fn }),
    )

    const { useBlogStore } = await import('../stores/blog.store')
    blogStore = useBlogStore()

    mockGet.mockReset()
  })

  // ── fetchPosts ─────────────────────────────────────────────

  describe('fetchPosts()', () => {
    it('calls GET /api/blog/posts when no filters are provided', async () => {
      mockGet.mockResolvedValueOnce([postA])
      const { useBlog } = await import('./useBlog')
      const { fetchPosts } = useBlog()

      await fetchPosts()

      expect(mockGet).toHaveBeenCalledWith('/api/blog/posts')
    })

    it('appends category_slug query param when provided in filters', async () => {
      mockGet.mockResolvedValueOnce([postA])
      const { useBlog } = await import('./useBlog')
      const { fetchPosts } = useBlog()

      await fetchPosts({ category_slug: 'salud' })

      expect(mockGet).toHaveBeenCalledWith('/api/blog/posts?category_slug=salud')
    })

    it('appends search query param when provided in filters', async () => {
      mockGet.mockResolvedValueOnce([postA])
      const { useBlog } = await import('./useBlog')
      const { fetchPosts } = useBlog()

      await fetchPosts({ search: 'perros' })

      expect(mockGet).toHaveBeenCalledWith('/api/blog/posts?search=perros')
    })

    it('appends page and limit query params when provided', async () => {
      mockGet.mockResolvedValueOnce([postA])
      const { useBlog } = await import('./useBlog')
      const { fetchPosts } = useBlog()

      await fetchPosts({ page: 2, limit: 9 })

      expect(mockGet).toHaveBeenCalledWith('/api/blog/posts?page=2&limit=9')
    })

    it('combines multiple query params correctly', async () => {
      mockGet.mockResolvedValueOnce([postA])
      const { useBlog } = await import('./useBlog')
      const { fetchPosts } = useBlog()

      await fetchPosts({ category_slug: 'salud', search: 'verano', page: 1, limit: 9 })

      const call = mockGet.mock.calls[0][0] as string
      expect(call).toContain('category_slug=salud')
      expect(call).toContain('search=verano')
      expect(call).toContain('page=1')
      expect(call).toContain('limit=9')
    })

    it('handles BlogListResponse envelope: calls setPosts with response.posts', async () => {
      mockGet.mockResolvedValueOnce(paginatedResponse)
      const setPostsSpy = vi.spyOn(blogStore, 'setPosts')
      const { useBlog } = await import('./useBlog')
      const { fetchPosts } = useBlog()

      await fetchPosts()

      expect(setPostsSpy).toHaveBeenCalledWith([postA, postB])
    })

    it('handles BlogListResponse envelope: calls setPagination with response metadata', async () => {
      mockGet.mockResolvedValueOnce(paginatedResponse)
      const setPaginationSpy = vi.spyOn(blogStore, 'setPagination')
      const { useBlog } = await import('./useBlog')
      const { fetchPosts } = useBlog()

      await fetchPosts()

      expect(setPaginationSpy).toHaveBeenCalledWith(2, 3, 20)
    })

    it('handles bare BlogPost[] response: calls setPosts with the array', async () => {
      mockGet.mockResolvedValueOnce([postA, postB])
      const setPostsSpy = vi.spyOn(blogStore, 'setPosts')
      const { useBlog } = await import('./useBlog')
      const { fetchPosts } = useBlog()

      await fetchPosts()

      expect(setPostsSpy).toHaveBeenCalledWith([postA, postB])
    })

    it('handles bare BlogPost[] response: calls setPagination with page=1, totalPages=1, total=array.length', async () => {
      mockGet.mockResolvedValueOnce([postA, postB])
      const setPaginationSpy = vi.spyOn(blogStore, 'setPagination')
      const { useBlog } = await import('./useBlog')
      const { fetchPosts } = useBlog()

      await fetchPosts()

      expect(setPaginationSpy).toHaveBeenCalledWith(1, 1, 2)
    })

    it('calls appendPosts instead of setPosts when append=true (envelope response)', async () => {
      mockGet.mockResolvedValueOnce(paginatedResponse)
      const appendPostsSpy = vi.spyOn(blogStore, 'appendPosts')
      const setPostsSpy = vi.spyOn(blogStore, 'setPosts')
      const { useBlog } = await import('./useBlog')
      const { fetchPosts } = useBlog()

      await fetchPosts(undefined, true)

      expect(appendPostsSpy).toHaveBeenCalledWith([postA, postB])
      expect(setPostsSpy).not.toHaveBeenCalled()
    })

    it('calls appendPosts instead of setPosts when append=true (bare array response)', async () => {
      mockGet.mockResolvedValueOnce([postA, postB])
      const appendPostsSpy = vi.spyOn(blogStore, 'appendPosts')
      const setPostsSpy = vi.spyOn(blogStore, 'setPosts')
      const { useBlog } = await import('./useBlog')
      const { fetchPosts } = useBlog()

      await fetchPosts(undefined, true)

      expect(appendPostsSpy).toHaveBeenCalledWith([postA, postB])
      expect(setPostsSpy).not.toHaveBeenCalled()
    })

    it('sets isLoading to true during the fetch and false after success', async () => {
      let loadingDuringCall = false
      mockGet.mockImplementationOnce(async () => {
        loadingDuringCall = blogStore.isLoading
        return [postA]
      })
      const { useBlog } = await import('./useBlog')
      const { fetchPosts } = useBlog()

      await fetchPosts()

      expect(loadingDuringCall).toBe(true)
      expect(blogStore.isLoading).toBe(false)
    })

    it('sets isLoading to false even when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Network error' })
      const { useBlog } = await import('./useBlog')
      const { fetchPosts } = useBlog()

      await fetchPosts()

      expect(blogStore.isLoading).toBe(false)
    })

    it('sets error when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ data: { error: 'Error de servidor' } })
      const { useBlog } = await import('./useBlog')
      const { fetchPosts, error } = useBlog()

      await fetchPosts()

      expect(error.value).toBe('Error de servidor')
    })

    it('sets error from message property when data.error is not available', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Connection refused' })
      const { useBlog } = await import('./useBlog')
      const { fetchPosts, error } = useBlog()

      await fetchPosts()

      expect(error.value).toBe('Connection refused')
    })

    it('sets fallback error message when the thrown error has no recognisable shape', async () => {
      mockGet.mockRejectedValueOnce('unexpected string error')
      const { useBlog } = await import('./useBlog')
      const { fetchPosts, error } = useBlog()

      await fetchPosts()

      expect(error.value).toBe('Ocurrió un error inesperado. Intenta de nuevo.')
    })

    it('resets error to null before each fetch', async () => {
      mockGet.mockRejectedValueOnce({ message: 'First error' })
      const { useBlog } = await import('./useBlog')
      const { fetchPosts, error } = useBlog()

      await fetchPosts()
      expect(error.value).toBe('First error')

      mockGet.mockResolvedValueOnce([postA])
      await fetchPosts()
      expect(error.value).toBeNull()
    })

    it('does not call appendPosts or setPosts when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Network error' })
      const setPostsSpy = vi.spyOn(blogStore, 'setPosts')
      const appendPostsSpy = vi.spyOn(blogStore, 'appendPosts')
      const { useBlog } = await import('./useBlog')
      const { fetchPosts } = useBlog()

      await fetchPosts()

      expect(setPostsSpy).not.toHaveBeenCalled()
      expect(appendPostsSpy).not.toHaveBeenCalled()
    })
  })

  // ── fetchPostBySlug ────────────────────────────────────────

  describe('fetchPostBySlug()', () => {
    it('returns the cached post from store without making an API call', async () => {
      // Pre-load the store with a post that has slug 'articulo-a'
      blogStore.setPosts([postA])
      const { useBlog } = await import('./useBlog')
      const { fetchPostBySlug } = useBlog()

      const result = await fetchPostBySlug('articulo-a')

      expect(mockGet).not.toHaveBeenCalled()
      expect(result).toEqual(postA)
    })

    it('sets selectedPost from cache without an API call', async () => {
      blogStore.setPosts([postA])
      const setSelectedPostSpy = vi.spyOn(blogStore, 'setSelectedPost')
      const { useBlog } = await import('./useBlog')
      const { fetchPostBySlug } = useBlog()

      await fetchPostBySlug('articulo-a')

      expect(setSelectedPostSpy).toHaveBeenCalledWith(postA)
    })

    it('calls GET /api/blog/posts/:slug when post is not in store cache', async () => {
      mockGet.mockResolvedValueOnce(postA)
      const { useBlog } = await import('./useBlog')
      const { fetchPostBySlug } = useBlog()

      await fetchPostBySlug('articulo-a')

      expect(mockGet).toHaveBeenCalledWith('/api/blog/posts/articulo-a')
    })

    it('sets selectedPost in store on a successful API fetch', async () => {
      mockGet.mockResolvedValueOnce(postB)
      const setSelectedPostSpy = vi.spyOn(blogStore, 'setSelectedPost')
      const { useBlog } = await import('./useBlog')
      const { fetchPostBySlug } = useBlog()

      await fetchPostBySlug('articulo-b')

      expect(setSelectedPostSpy).toHaveBeenCalledWith(postB)
    })

    it('returns the post on a successful API fetch', async () => {
      mockGet.mockResolvedValueOnce(postB)
      const { useBlog } = await import('./useBlog')
      const { fetchPostBySlug } = useBlog()

      const result = await fetchPostBySlug('articulo-b')

      expect(result).toEqual(postB)
    })

    it('returns null when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Not Found' })
      const { useBlog } = await import('./useBlog')
      const { fetchPostBySlug } = useBlog()

      const result = await fetchPostBySlug('no-existe')

      expect(result).toBeNull()
    })

    it('sets error when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ data: { error: 'Artículo no encontrado' } })
      const { useBlog } = await import('./useBlog')
      const { fetchPostBySlug, error } = useBlog()

      await fetchPostBySlug('no-existe')

      expect(error.value).toBe('Artículo no encontrado')
    })

    it('sets isLoading to true during the fetch and false after success', async () => {
      let loadingDuringCall = false
      mockGet.mockImplementationOnce(async () => {
        loadingDuringCall = blogStore.isLoading
        return postA
      })
      const { useBlog } = await import('./useBlog')
      const { fetchPostBySlug } = useBlog()

      await fetchPostBySlug('articulo-a')

      expect(loadingDuringCall).toBe(true)
      expect(blogStore.isLoading).toBe(false)
    })

    it('sets isLoading to false in finally block even when the API fails', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Network error' })
      const { useBlog } = await import('./useBlog')
      const { fetchPostBySlug } = useBlog()

      await fetchPostBySlug('no-existe')

      expect(blogStore.isLoading).toBe(false)
    })

    it('resets error to null before the fetch', async () => {
      mockGet.mockRejectedValueOnce({ message: 'First error' })
      const { useBlog } = await import('./useBlog')
      const { fetchPostBySlug, error } = useBlog()

      await fetchPostBySlug('no-existe')
      expect(error.value).toBe('First error')

      mockGet.mockResolvedValueOnce(postA)
      await fetchPostBySlug('articulo-a')
      expect(error.value).toBeNull()
    })

    it('does not call setSelectedPost when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Not Found' })
      const setSelectedPostSpy = vi.spyOn(blogStore, 'setSelectedPost')
      const { useBlog } = await import('./useBlog')
      const { fetchPostBySlug } = useBlog()

      await fetchPostBySlug('no-existe')

      expect(setSelectedPostSpy).not.toHaveBeenCalled()
    })
  })

  // ── fetchCategories ────────────────────────────────────────

  describe('fetchCategories()', () => {
    it('calls GET /api/blog/categories', async () => {
      mockGet.mockResolvedValueOnce([catA, catB])
      const { useBlog } = await import('./useBlog')
      const { fetchCategories } = useBlog()

      await fetchCategories()

      expect(mockGet).toHaveBeenCalledWith('/api/blog/categories')
    })

    it('handles envelope shape { categories: BlogCategory[] }: calls setCategories', async () => {
      mockGet.mockResolvedValueOnce({ categories: [catA, catB] })
      const setCategoriesSpy = vi.spyOn(blogStore, 'setCategories')
      const { useBlog } = await import('./useBlog')
      const { fetchCategories } = useBlog()

      await fetchCategories()

      expect(setCategoriesSpy).toHaveBeenCalledWith([catA, catB])
    })

    it('handles bare BlogCategory[] response: calls setCategories', async () => {
      mockGet.mockResolvedValueOnce([catA, catB])
      const setCategoriesSpy = vi.spyOn(blogStore, 'setCategories')
      const { useBlog } = await import('./useBlog')
      const { fetchCategories } = useBlog()

      await fetchCategories()

      expect(setCategoriesSpy).toHaveBeenCalledWith([catA, catB])
    })

    it('calls setCategories with an empty array when envelope categories key is missing', async () => {
      mockGet.mockResolvedValueOnce({})
      const setCategoriesSpy = vi.spyOn(blogStore, 'setCategories')
      const { useBlog } = await import('./useBlog')
      const { fetchCategories } = useBlog()

      await fetchCategories()

      expect(setCategoriesSpy).toHaveBeenCalledWith([])
    })

    it('does not throw when the API call fails (non-critical)', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Network error' })
      const { useBlog } = await import('./useBlog')
      const { fetchCategories } = useBlog()

      await expect(fetchCategories()).resolves.toBeUndefined()
    })

    it('sets error when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ data: { error: 'Error al cargar categorías' } })
      const { useBlog } = await import('./useBlog')
      const { fetchCategories, error } = useBlog()

      await fetchCategories()

      expect(error.value).toBe('Error al cargar categorías')
    })

    it('does NOT set isLoading (category fetch is background, non-blocking)', async () => {
      let loadingDuringCall = false
      mockGet.mockImplementationOnce(async () => {
        loadingDuringCall = blogStore.isLoading
        return [catA]
      })
      const { useBlog } = await import('./useBlog')
      const { fetchCategories } = useBlog()

      await fetchCategories()

      // isLoading must never have been true during the categories fetch
      expect(loadingDuringCall).toBe(false)
      expect(blogStore.isLoading).toBe(false)
    })

    it('resets error to null before the fetch', async () => {
      mockGet.mockRejectedValueOnce({ message: 'First error' })
      const { useBlog } = await import('./useBlog')
      const { fetchCategories, error } = useBlog()

      await fetchCategories()
      expect(error.value).toBe('First error')

      mockGet.mockResolvedValueOnce([catA])
      await fetchCategories()
      expect(error.value).toBeNull()
    })

    it('does not call setCategories when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Network error' })
      const setCategoriesSpy = vi.spyOn(blogStore, 'setCategories')
      const { useBlog } = await import('./useBlog')
      const { fetchCategories } = useBlog()

      await fetchCategories()

      expect(setCategoriesSpy).not.toHaveBeenCalled()
    })
  })
})
