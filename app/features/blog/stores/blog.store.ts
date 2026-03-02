// ============================================================
// Blog store — manages the post list and currently selected post.
//
// Blog posts are public data — clearBlog() on logout is optional
// but exported for completeness.
// ============================================================

import { defineStore } from 'pinia'
import type { BlogPost } from '../types'

export const useBlogStore = defineStore('blog', () => {
  // ── State ──────────────────────────────────────────────────
  const posts = ref<BlogPost[]>([])
  const selectedPost = ref<BlogPost | null>(null)
  const isLoading = ref(false)

  // ── Getters ────────────────────────────────────────────────
  const hasPosts = computed(() => posts.value.length > 0)

  /**
   * Look up a post by slug from the already-loaded list.
   * Returns undefined when the post is not yet in local state.
   */
  const getPostBySlug = computed(
    () => (slug: string): BlogPost | undefined =>
      posts.value.find(p => p.slug === slug),
  )

  // ── Actions ────────────────────────────────────────────────

  /** Replace the current post list with a fresh set of results. */
  function setPosts(newPosts: BlogPost[]): void {
    posts.value = newPosts
  }

  function setSelectedPost(post: BlogPost | null): void {
    selectedPost.value = post
  }

  function clearSelectedPost(): void {
    selectedPost.value = null
  }

  function setLoading(value: boolean): void {
    isLoading.value = value
  }

  /** Reset all state — useful for hard refreshes or logout cleanup. */
  function clearBlog(): void {
    posts.value = []
    selectedPost.value = null
  }

  return {
    // State
    posts,
    selectedPost,
    isLoading,
    // Getters
    hasPosts,
    getPostBySlug,
    // Actions
    setPosts,
    setSelectedPost,
    clearSelectedPost,
    setLoading,
    clearBlog,
  }
})
