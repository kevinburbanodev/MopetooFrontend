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

const postA = makeBlogPost({ id: 1, slug: 'articulo-a', title: 'Artículo A' })
const postB = makeBlogPost({ id: 2, slug: 'articulo-b', title: 'Artículo B', category: 'nutricion' })
const postC = makeBlogPost({ id: 3, slug: 'articulo-c', title: 'Artículo C', category: 'cuidados' })

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

    it('has isLoading false', () => {
      const store = useBlogStore()
      expect(store.isLoading).toBe(false)
    })

    it('hasPosts is false with an empty posts array', () => {
      const store = useBlogStore()
      expect(store.hasPosts).toBe(false)
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
      expect(store.posts[0].id).toBe(3)
      expect(store.posts[1].id).toBe(1)
      expect(store.posts[2].id).toBe(2)
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
      expect(store.selectedPost?.category).toBe('salud')
      expect(store.selectedPost?.published).toBe(true)
      expect(store.selectedPost?.cover_image_url).toBe('https://example.com/image.jpg')
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

    it('does not affect posts or selectedPost', () => {
      const store = useBlogStore()
      store.setPosts([postA])
      store.setSelectedPost(postA)
      store.setLoading(true)
      expect(store.posts).toHaveLength(1)
      expect(store.selectedPost).toEqual(postA)
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

    it('makes hasPosts false after clearing', () => {
      const store = useBlogStore()
      store.setPosts([postA, postB])
      store.clearBlog()
      expect(store.hasPosts).toBe(false)
    })

    it('is safe to call when the store is already in initial state', () => {
      const store = useBlogStore()
      expect(() => store.clearBlog()).not.toThrow()
      expect(store.posts).toEqual([])
      expect(store.selectedPost).toBeNull()
    })
  })
})
