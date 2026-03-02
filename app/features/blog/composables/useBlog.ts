// ============================================================
// useBlog — Blog editorial feature composable
// Central API surface for blog post operations.
// State is owned by useBlogStore; this composable is the API
// layer that keeps the store in sync.
//
// Blog endpoints are public — no auth token is required.
// useApi() is still used for base URL resolution; it will send
// an Authorization header only when a token is present, which
// is harmless for public endpoints.
// ============================================================

import type {
  BlogPost,
  BlogListFilters,
  BlogListResponse,
} from '../types'
import { extractErrorMessage } from '../../shared/utils/extractErrorMessage'

export function useBlog() {
  const { get } = useApi()
  const blogStore = useBlogStore()

  const error = ref<string | null>(null)

  // ── Public API ──────────────────────────────────────────────

  /**
   * Fetch all published blog posts, optionally filtered by category.
   * Backend returns all posts at once (no pagination).
   * Handles both the `BlogListResponse` envelope and a bare `BlogPost[]`.
   */
  async function fetchPosts(filters?: BlogListFilters): Promise<void> {
    blogStore.setLoading(true)
    error.value = null
    try {
      const params = new URLSearchParams()
      if (filters?.category) params.set('category', filters.category)
      const qs = params.toString()
      const path = qs ? `/blog/posts?${qs}` : '/blog/posts'

      const response = await get<BlogListResponse | BlogPost[]>(path)

      if (Array.isArray(response)) {
        blogStore.setPosts(response)
      }
      else {
        blogStore.setPosts(response.posts ?? [])
      }
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      blogStore.setLoading(false)
    }
  }

  /**
   * Fetch a single blog post by its URL slug and store it as selectedPost.
   * Returns the post on success or null on failure.
   */
  async function fetchPostBySlug(slug: string): Promise<BlogPost | null> {
    blogStore.setLoading(true)
    error.value = null
    try {
      // Check local store cache first to avoid a redundant network round-trip
      // when navigating from the list page to the detail page.
      const cached = blogStore.getPostBySlug(slug)
      if (cached) {
        blogStore.setSelectedPost(cached)
        return cached
      }

      const post = await get<BlogPost>(`/blog/posts/${slug}`)
      blogStore.setSelectedPost(post)
      return post
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
    finally {
      blogStore.setLoading(false)
    }
  }

  return {
    error,
    blogStore,
    fetchPosts,
    fetchPostBySlug,
  }
}

