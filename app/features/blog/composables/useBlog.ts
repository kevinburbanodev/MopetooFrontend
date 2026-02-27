// ============================================================
// useBlog — Blog editorial feature composable
// Central API surface for blog post and category operations.
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
  BlogCategory,
  BlogListFilters,
  BlogListResponse,
} from '../types'

export function useBlog() {
  const { get } = useApi()
  const blogStore = useBlogStore()

  const error = ref<string | null>(null)

  // ── Public API ──────────────────────────────────────────────

  /**
   * Fetch a page of blog posts, optionally filtered.
   * Pass `append: true` to add results to the existing list (load-more pattern).
   * Handles both the `BlogListResponse` envelope shape and a bare `BlogPost[]`.
   */
  async function fetchPosts(
    filters?: BlogListFilters,
    append = false,
  ): Promise<void> {
    blogStore.setLoading(true)
    error.value = null
    try {
      const params = new URLSearchParams()
      if (filters?.category_slug) params.set('category_slug', filters.category_slug)
      if (filters?.search) params.set('search', filters.search)
      if (filters?.page) params.set('page', String(filters.page))
      if (filters?.limit) params.set('limit', String(filters.limit))
      const qs = params.toString()
      const path = qs ? `/api/blog/posts?${qs}` : '/api/blog/posts'

      // Backend may return a paginated envelope or a bare array
      const response = await get<BlogListResponse | BlogPost[]>(path)

      if (Array.isArray(response)) {
        // Bare array — no pagination metadata available
        if (append) {
          blogStore.appendPosts(response)
        }
        else {
          blogStore.setPosts(response)
        }
        blogStore.setPagination(1, 1, response.length)
      }
      else {
        // Paginated envelope
        if (append) {
          blogStore.appendPosts(response.posts ?? [])
        }
        else {
          blogStore.setPosts(response.posts ?? [])
        }
        blogStore.setPagination(
          response.page ?? 1,
          response.total_pages ?? 1,
          response.total ?? (response.posts?.length ?? 0),
        )
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

      const post = await get<BlogPost>(`/api/blog/posts/${slug}`)
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

  /**
   * Fetch all blog categories.
   * Handles both `{ categories: BlogCategory[] }` and bare `BlogCategory[]` shapes.
   */
  async function fetchCategories(): Promise<void> {
    error.value = null
    try {
      const response = await get<{ categories?: BlogCategory[] } | BlogCategory[]>(
        '/api/blog/categories',
      )

      if (Array.isArray(response)) {
        blogStore.setCategories(response)
      }
      else {
        blogStore.setCategories(response.categories ?? [])
      }
    }
    catch (err: unknown) {
      // Non-critical: category fetch failure should not block post display
      error.value = extractErrorMessage(err)
    }
  }

  return {
    error,
    blogStore,
    fetchPosts,
    fetchPostBySlug,
    fetchCategories,
  }
}

// ── Helpers ─────────────────────────────────────────────────

function extractErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    if ('data' in err) {
      const data = (err as { data: unknown }).data
      if (typeof data === 'object' && data !== null && 'error' in data) {
        return String((data as { error: unknown }).error)
      }
      if (typeof data === 'string' && data.length > 0) return data
    }
    if ('message' in err && typeof (err as { message: unknown }).message === 'string') {
      return (err as { message: string }).message
    }
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.'
}
