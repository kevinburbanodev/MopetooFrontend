// ============================================================
// Blog store — manages the post list, currently selected post,
// available categories, and pagination state.
//
// clearBlog() is called from auth.store.clearSession() only if
// blog content becomes user-specific (e.g. drafts). Blog posts
// are public data — calling clearBlog() on logout is optional
// but exported for completeness.
// ============================================================

import { defineStore } from 'pinia'
import type { BlogPost, BlogCategory } from '../types'

export const useBlogStore = defineStore('blog', () => {
  // ── State ──────────────────────────────────────────────────
  const posts = ref<BlogPost[]>([])
  const selectedPost = ref<BlogPost | null>(null)
  const categories = ref<BlogCategory[]>([])
  const isLoading = ref(false)
  const currentPage = ref(1)
  const totalPages = ref(1)
  const total = ref(0)

  // ── Getters ────────────────────────────────────────────────
  const hasPosts = computed(() => posts.value.length > 0)
  const hasCategories = computed(() => categories.value.length > 0)

  /**
   * Look up a post by slug from the already-loaded list.
   * Returns undefined when the post is not yet in local state.
   */
  const getPostBySlug = computed(
    () => (slug: string): BlogPost | undefined =>
      posts.value.find(p => p.slug === slug),
  )

  // ── Actions ────────────────────────────────────────────────

  /** Replace the current post list with a fresh page of results. */
  function setPosts(newPosts: BlogPost[]): void {
    posts.value = newPosts
  }

  /**
   * Append posts to the existing list — used by the "Cargar más"
   * pagination button to extend the list without replacing it.
   */
  function appendPosts(newPosts: BlogPost[]): void {
    posts.value = [...posts.value, ...newPosts]
  }

  function setSelectedPost(post: BlogPost | null): void {
    selectedPost.value = post
  }

  function clearSelectedPost(): void {
    selectedPost.value = null
  }

  function setCategories(newCategories: BlogCategory[]): void {
    categories.value = newCategories
  }

  function setLoading(value: boolean): void {
    isLoading.value = value
  }

  /** Update pagination metadata after a list fetch. */
  function setPagination(page: number, totalPagesValue: number, totalValue: number): void {
    currentPage.value = page
    totalPages.value = totalPagesValue
    total.value = totalValue
  }

  /** Reset all state — useful for hard refreshes or logout cleanup. */
  function clearBlog(): void {
    posts.value = []
    selectedPost.value = null
    categories.value = []
    currentPage.value = 1
    totalPages.value = 1
    total.value = 0
  }

  return {
    // State
    posts,
    selectedPost,
    categories,
    isLoading,
    currentPage,
    totalPages,
    total,
    // Getters
    hasPosts,
    hasCategories,
    getPostBySlug,
    // Actions
    setPosts,
    appendPosts,
    setSelectedPost,
    clearSelectedPost,
    setCategories,
    setLoading,
    setPagination,
    clearBlog,
  }
})
