// ============================================================
// blog.store.test.ts
// Tests the useBlogStore Pinia store in isolation.
//
// Strategy: uses the real store (no stubActions) so that action
// implementations are exercised, not mocked away. Each test gets
// a fresh pinia via setActivePinia(createPinia()) in beforeEach.
//
// What this suite does NOT cover intentionally:
//   - HTTP / API calls — those are composable concerns (useBlog.test.ts)
//   - Component rendering — covered in component test files
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBlogStore } from './blog.store'
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

const catA = makeBlogCategory({ id: 'cat-1', slug: 'salud', name: 'Salud', post_count: 3 })
const catB = makeBlogCategory({ id: 'cat-2', slug: 'nutricion', name: 'Nutrición', post_count: 7 })
const catC = makeBlogCategory({ id: 'cat-3', slug: 'bienestar', name: 'Bienestar' })

const postA = makeBlogPost({ id: 'post-1', slug: 'articulo-a', title: 'Artículo A' })
const postB = makeBlogPost({ id: 'post-2', slug: 'articulo-b', title: 'Artículo B' })
const postC = makeBlogPost({ id: 'post-3', slug: 'articulo-c', title: 'Artículo C' })

// ── Suite ─────────────────────────────────────────────────────

describe('useBlogStore', () => {
  beforeEach(() => {
    // Fresh pinia per test — no state leaks between tests
    setActivePinia(createPinia())
  })

  // ── Initial state ──────────────────────────────────────────

  describe('initial state', () => {
    it('has an empty posts array', () => {
      const store = useBlogStore()
      expect(store.posts).toEqual([])
    })

    it('has null selectedPost', () => {
      const store = useBlogStore()
      expect(store.selectedPost).toBeNull()
    })

    it('has an empty categories array', () => {
      const store = useBlogStore()
      expect(store.categories).toEqual([])
    })

    it('has isLoading false', () => {
      const store = useBlogStore()
      expect(store.isLoading).toBe(false)
    })

    it('has currentPage equal to 1', () => {
      const store = useBlogStore()
      expect(store.currentPage).toBe(1)
    })

    it('has totalPages equal to 1', () => {
      const store = useBlogStore()
      expect(store.totalPages).toBe(1)
    })

    it('has total equal to 0', () => {
      const store = useBlogStore()
      expect(store.total).toBe(0)
    })

    it('hasPosts is false with an empty posts array', () => {
      const store = useBlogStore()
      expect(store.hasPosts).toBe(false)
    })

    it('hasCategories is false with an empty categories array', () => {
      const store = useBlogStore()
      expect(store.hasCategories).toBe(false)
    })
  })

  // ── hasPosts getter ────────────────────────────────────────

  describe('hasPosts getter', () => {
    it('is false when posts array is empty', () => {
      const store = useBlogStore()
      expect(store.hasPosts).toBe(false)
    })

    it('is true when at least one post exists', () => {
      const store = useBlogStore()
      store.setPosts([postA])
      expect(store.hasPosts).toBe(true)
    })

    it('becomes false again after clearBlog resets posts', () => {
      const store = useBlogStore()
      store.setPosts([postA, postB])
      store.clearBlog()
      expect(store.hasPosts).toBe(false)
    })

    it('stays true when multiple posts are present', () => {
      const store = useBlogStore()
      store.setPosts([postA, postB, postC])
      expect(store.hasPosts).toBe(true)
    })
  })

  // ── hasCategories getter ───────────────────────────────────

  describe('hasCategories getter', () => {
    it('is false when categories array is empty', () => {
      const store = useBlogStore()
      expect(store.hasCategories).toBe(false)
    })

    it('is true when at least one category exists', () => {
      const store = useBlogStore()
      store.setCategories([catA])
      expect(store.hasCategories).toBe(true)
    })

    it('becomes false after clearBlog resets categories', () => {
      const store = useBlogStore()
      store.setCategories([catA, catB])
      store.clearBlog()
      expect(store.hasCategories).toBe(false)
    })
  })

  // ── getPostBySlug getter ───────────────────────────────────

  describe('getPostBySlug getter', () => {
    it('returns a function (factory getter pattern)', () => {
      const store = useBlogStore()
      expect(typeof store.getPostBySlug).toBe('function')
    })

    it('returns undefined when no posts are loaded', () => {
      const store = useBlogStore()
      expect(store.getPostBySlug('articulo-a')).toBeUndefined()
    })

    it('returns the post when its slug matches', () => {
      const store = useBlogStore()
      store.setPosts([postA, postB])
      const found = store.getPostBySlug('articulo-a')
      expect(found).toEqual(postA)
    })

    it('returns undefined for an unknown slug when posts exist', () => {
      const store = useBlogStore()
      store.setPosts([postA, postB])
      expect(store.getPostBySlug('no-existe')).toBeUndefined()
    })

    it('returns the correct post when multiple posts exist with different slugs', () => {
      const store = useBlogStore()
      store.setPosts([postA, postB, postC])
      expect(store.getPostBySlug('articulo-b')).toEqual(postB)
      expect(store.getPostBySlug('articulo-c')).toEqual(postC)
    })

    it('returns undefined after clearBlog even if the post was previously loaded', () => {
      const store = useBlogStore()
      store.setPosts([postA])
      store.clearBlog()
      expect(store.getPostBySlug('articulo-a')).toBeUndefined()
    })
  })

  // ── setPosts ───────────────────────────────────────────────

  describe('setPosts()', () => {
    it('replaces the posts array with the provided list', () => {
      const store = useBlogStore()
      store.setPosts([postA, postB])
      expect(store.posts).toEqual([postA, postB])
    })

    it('overwrites any previously stored posts', () => {
      const store = useBlogStore()
      store.setPosts([postA, postB])
      store.setPosts([postC])
      expect(store.posts).toEqual([postC])
    })

    it('accepts an empty array, clearing all posts', () => {
      const store = useBlogStore()
      store.setPosts([postA])
      store.setPosts([])
      expect(store.posts).toEqual([])
    })

    it('makes hasPosts true after setting a non-empty array', () => {
      const store = useBlogStore()
      store.setPosts([postA])
      expect(store.hasPosts).toBe(true)
    })

    it('preserves the order of the provided list', () => {
      const store = useBlogStore()
      store.setPosts([postC, postA, postB])
      expect(store.posts[0].id).toBe('post-3')
      expect(store.posts[1].id).toBe('post-1')
      expect(store.posts[2].id).toBe('post-2')
    })
  })

  // ── appendPosts ────────────────────────────────────────────

  describe('appendPosts()', () => {
    it('appends posts to an empty list', () => {
      const store = useBlogStore()
      store.appendPosts([postA, postB])
      expect(store.posts).toHaveLength(2)
      expect(store.posts[0]).toEqual(postA)
      expect(store.posts[1]).toEqual(postB)
    })

    it('appends new posts after existing posts (does NOT replace)', () => {
      const store = useBlogStore()
      store.setPosts([postA])
      store.appendPosts([postB, postC])
      expect(store.posts).toHaveLength(3)
      expect(store.posts[0]).toEqual(postA)
      expect(store.posts[1]).toEqual(postB)
      expect(store.posts[2]).toEqual(postC)
    })

    it('does not remove existing posts when appending', () => {
      const store = useBlogStore()
      store.setPosts([postA, postB])
      store.appendPosts([postC])
      expect(store.posts[0]).toEqual(postA)
      expect(store.posts[1]).toEqual(postB)
    })

    it('makes hasPosts true after appending to an empty list', () => {
      const store = useBlogStore()
      store.appendPosts([postA])
      expect(store.hasPosts).toBe(true)
    })

    it('appending an empty array does not change existing posts', () => {
      const store = useBlogStore()
      store.setPosts([postA])
      store.appendPosts([])
      expect(store.posts).toHaveLength(1)
      expect(store.posts[0]).toEqual(postA)
    })
  })

  // ── setSelectedPost / clearSelectedPost ────────────────────

  describe('setSelectedPost()', () => {
    it('sets selectedPost to the provided post', () => {
      const store = useBlogStore()
      store.setSelectedPost(postA)
      expect(store.selectedPost).toEqual(postA)
    })

    it('replaces a previously selected post', () => {
      const store = useBlogStore()
      store.setSelectedPost(postA)
      store.setSelectedPost(postB)
      expect(store.selectedPost).toEqual(postB)
    })

    it('accepts null to clear the selection', () => {
      const store = useBlogStore()
      store.setSelectedPost(postA)
      store.setSelectedPost(null)
      expect(store.selectedPost).toBeNull()
    })

    it('stores all post fields intact', () => {
      const store = useBlogStore()
      store.setSelectedPost(postA)
      expect(store.selectedPost?.slug).toBe('articulo-a')
      expect(store.selectedPost?.author.name).toBe('Ana García')
      expect(store.selectedPost?.tags).toEqual(['perros', 'verano', 'salud'])
    })
  })

  describe('clearSelectedPost()', () => {
    it('sets selectedPost to null', () => {
      const store = useBlogStore()
      store.setSelectedPost(postA)
      store.clearSelectedPost()
      expect(store.selectedPost).toBeNull()
    })

    it('is safe to call when selectedPost is already null', () => {
      const store = useBlogStore()
      expect(() => store.clearSelectedPost()).not.toThrow()
      expect(store.selectedPost).toBeNull()
    })

    it('does not affect the posts array', () => {
      const store = useBlogStore()
      store.setPosts([postA, postB])
      store.setSelectedPost(postA)
      store.clearSelectedPost()
      expect(store.posts).toHaveLength(2)
    })
  })

  // ── setCategories ──────────────────────────────────────────

  describe('setCategories()', () => {
    it('replaces the categories array with the provided list', () => {
      const store = useBlogStore()
      store.setCategories([catA, catB])
      expect(store.categories).toEqual([catA, catB])
    })

    it('overwrites any previously stored categories', () => {
      const store = useBlogStore()
      store.setCategories([catA, catB])
      store.setCategories([catC])
      expect(store.categories).toEqual([catC])
    })

    it('accepts an empty array, clearing all categories', () => {
      const store = useBlogStore()
      store.setCategories([catA])
      store.setCategories([])
      expect(store.categories).toEqual([])
    })

    it('makes hasCategories true after setting a non-empty array', () => {
      const store = useBlogStore()
      store.setCategories([catA])
      expect(store.hasCategories).toBe(true)
    })
  })

  // ── setLoading ─────────────────────────────────────────────

  describe('setLoading()', () => {
    it('sets isLoading to true', () => {
      const store = useBlogStore()
      store.setLoading(true)
      expect(store.isLoading).toBe(true)
    })

    it('sets isLoading back to false', () => {
      const store = useBlogStore()
      store.setLoading(true)
      store.setLoading(false)
      expect(store.isLoading).toBe(false)
    })

    it('is idempotent when called with the same value', () => {
      const store = useBlogStore()
      store.setLoading(false)
      store.setLoading(false)
      expect(store.isLoading).toBe(false)
    })

    it('does not affect posts, categories, or selectedPost', () => {
      const store = useBlogStore()
      store.setPosts([postA])
      store.setCategories([catA])
      store.setSelectedPost(postA)
      store.setLoading(true)
      expect(store.posts).toHaveLength(1)
      expect(store.categories).toHaveLength(1)
      expect(store.selectedPost).toEqual(postA)
    })
  })

  // ── setPagination ──────────────────────────────────────────

  describe('setPagination()', () => {
    it('updates currentPage to the provided page number', () => {
      const store = useBlogStore()
      store.setPagination(3, 10, 90)
      expect(store.currentPage).toBe(3)
    })

    it('updates totalPages to the provided value', () => {
      const store = useBlogStore()
      store.setPagination(1, 5, 45)
      expect(store.totalPages).toBe(5)
    })

    it('updates total to the provided value', () => {
      const store = useBlogStore()
      store.setPagination(1, 1, 7)
      expect(store.total).toBe(7)
    })

    it('sets all three pagination values in one call', () => {
      const store = useBlogStore()
      store.setPagination(2, 4, 36)
      expect(store.currentPage).toBe(2)
      expect(store.totalPages).toBe(4)
      expect(store.total).toBe(36)
    })

    it('accepts page 1, totalPages 1, total 0 for an empty result', () => {
      const store = useBlogStore()
      store.setPagination(3, 5, 40) // first set non-defaults
      store.setPagination(1, 1, 0)
      expect(store.currentPage).toBe(1)
      expect(store.totalPages).toBe(1)
      expect(store.total).toBe(0)
    })
  })

  // ── clearBlog ──────────────────────────────────────────────

  describe('clearBlog()', () => {
    it('resets posts to an empty array', () => {
      const store = useBlogStore()
      store.setPosts([postA, postB])
      store.clearBlog()
      expect(store.posts).toEqual([])
    })

    it('resets selectedPost to null', () => {
      const store = useBlogStore()
      store.setSelectedPost(postA)
      store.clearBlog()
      expect(store.selectedPost).toBeNull()
    })

    it('resets categories to an empty array', () => {
      const store = useBlogStore()
      store.setCategories([catA, catB])
      store.clearBlog()
      expect(store.categories).toEqual([])
    })

    it('resets currentPage to 1', () => {
      const store = useBlogStore()
      store.setPagination(4, 10, 100)
      store.clearBlog()
      expect(store.currentPage).toBe(1)
    })

    it('resets totalPages to 1', () => {
      const store = useBlogStore()
      store.setPagination(1, 8, 72)
      store.clearBlog()
      expect(store.totalPages).toBe(1)
    })

    it('resets total to 0', () => {
      const store = useBlogStore()
      store.setPagination(1, 1, 42)
      store.clearBlog()
      expect(store.total).toBe(0)
    })

    it('makes hasPosts false after clearing', () => {
      const store = useBlogStore()
      store.setPosts([postA, postB])
      store.clearBlog()
      expect(store.hasPosts).toBe(false)
    })

    it('makes hasCategories false after clearing', () => {
      const store = useBlogStore()
      store.setCategories([catA, catB])
      store.clearBlog()
      expect(store.hasCategories).toBe(false)
    })

    it('is safe to call when the store is already in initial state', () => {
      const store = useBlogStore()
      expect(() => store.clearBlog()).not.toThrow()
      expect(store.posts).toEqual([])
      expect(store.selectedPost).toBeNull()
      expect(store.categories).toEqual([])
      expect(store.currentPage).toBe(1)
      expect(store.totalPages).toBe(1)
      expect(store.total).toBe(0)
    })
  })
})
