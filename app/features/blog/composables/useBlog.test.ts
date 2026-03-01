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
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import type { BlogPost, BlogListResponse } from '../types'

// ── useApi mock ──────────────────────────────────────────────

const mockGet = vi.fn()

vi.mock('../../shared/composables/useApi', () => ({
  useApi: () => ({ get: mockGet }),
}))

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

const postA = makeBlogPost({ id: 1, slug: 'articulo-a', title: 'Artículo A' })
const postB = makeBlogPost({ id: 2, slug: 'articulo-b', title: 'Artículo B', category: 'nutricion' })

const envelopeResponse: BlogListResponse = {
  posts: [postA, postB],
}

// ── Suite ─────────────────────────────────────────────────────

describe('useBlog', () => {
  let blogStore: ReturnType<typeof import('../stores/blog.store').useBlogStore>

  beforeEach(async () => {
    setActivePinia(
      createTestingPinia({ stubActions: false, createSpy: vi.fn }),
    )

    const { useBlogStore } = await import('../stores/blog.store')
    blogStore = useBlogStore()

    mockGet.mockReset()
  })

  // ── fetchPosts ─────────────────────────────────────────────

  describe('fetchPosts()', () => {
    it('calls GET /blog/posts when no filters are provided', async () => {
      mockGet.mockResolvedValueOnce([postA])
      const { useBlog } = await import('./useBlog')
      const { fetchPosts } = useBlog()

      await fetchPosts()

      expect(mockGet).toHaveBeenCalledWith('/blog/posts')
    })

    it('appends category query param when provided in filters', async () => {
      mockGet.mockResolvedValueOnce([postA])
      const { useBlog } = await import('./useBlog')
      const { fetchPosts } = useBlog()

      await fetchPosts({ category: 'salud' })

      expect(mockGet).toHaveBeenCalledWith('/blog/posts?category=salud')
    })

    it('does not send category param when filter is undefined', async () => {
      mockGet.mockResolvedValueOnce([postA])
      const { useBlog } = await import('./useBlog')
      const { fetchPosts } = useBlog()

      await fetchPosts({})

      expect(mockGet).toHaveBeenCalledWith('/blog/posts')
    })

    it('handles BlogListResponse envelope: calls setPosts with response.posts', async () => {
      mockGet.mockResolvedValueOnce(envelopeResponse)
      const setPostsSpy = vi.spyOn(blogStore, 'setPosts')
      const { useBlog } = await import('./useBlog')
      const { fetchPosts } = useBlog()

      await fetchPosts()

      expect(setPostsSpy).toHaveBeenCalledWith([postA, postB])
    })

    it('handles bare BlogPost[] response: calls setPosts with the array', async () => {
      mockGet.mockResolvedValueOnce([postA, postB])
      const setPostsSpy = vi.spyOn(blogStore, 'setPosts')
      const { useBlog } = await import('./useBlog')
      const { fetchPosts } = useBlog()

      await fetchPosts()

      expect(setPostsSpy).toHaveBeenCalledWith([postA, postB])
    })

    it('handles envelope with missing posts key gracefully', async () => {
      mockGet.mockResolvedValueOnce({})
      const setPostsSpy = vi.spyOn(blogStore, 'setPosts')
      const { useBlog } = await import('./useBlog')
      const { fetchPosts } = useBlog()

      await fetchPosts()

      expect(setPostsSpy).toHaveBeenCalledWith([])
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

    it('does not call setPosts when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Network error' })
      const setPostsSpy = vi.spyOn(blogStore, 'setPosts')
      const { useBlog } = await import('./useBlog')
      const { fetchPosts } = useBlog()

      await fetchPosts()

      expect(setPostsSpy).not.toHaveBeenCalled()
    })
  })

  // ── fetchPostBySlug ────────────────────────────────────────

  describe('fetchPostBySlug()', () => {
    it('returns the cached post from store without making an API call', async () => {
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

    it('calls GET /blog/posts/:slug when post is not in store cache', async () => {
      mockGet.mockResolvedValueOnce(postA)
      const { useBlog } = await import('./useBlog')
      const { fetchPostBySlug } = useBlog()

      await fetchPostBySlug('articulo-a')

      expect(mockGet).toHaveBeenCalledWith('/blog/posts/articulo-a')
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

  // ── return shape ───────────────────────────────────────────

  describe('return shape', () => {
    it('does NOT export fetchCategories (no categories endpoint)', async () => {
      const { useBlog } = await import('./useBlog')
      const result = useBlog()

      expect(result).not.toHaveProperty('fetchCategories')
    })

    it('exports error, blogStore, fetchPosts, and fetchPostBySlug', async () => {
      const { useBlog } = await import('./useBlog')
      const result = useBlog()

      expect(result).toHaveProperty('error')
      expect(result).toHaveProperty('blogStore')
      expect(result).toHaveProperty('fetchPosts')
      expect(result).toHaveProperty('fetchPostBySlug')
    })
  })
})
