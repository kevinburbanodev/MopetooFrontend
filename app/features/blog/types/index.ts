// ============================================================
// Blog editorial feature — domain types
// Aligned with Mopetoo backend API (Go + Gin) model.BlogPost
// RF-600 to RF-609
// ============================================================

/** Blog post category values accepted by the backend */
export type BlogPostCategory =
  | 'nutricion'
  | 'salud'
  | 'comportamiento'
  | 'cuidados'
  | 'otros'

/** Static list of blog categories for filter UI */
export const BLOG_CATEGORIES: { value: BlogPostCategory; label: string }[] = [
  { value: 'nutricion', label: 'Nutrición' },
  { value: 'salud', label: 'Salud' },
  { value: 'comportamiento', label: 'Comportamiento' },
  { value: 'cuidados', label: 'Cuidados' },
  { value: 'otros', label: 'Otros' },
]

/**
 * model.BlogPost — aligned with the Go backend.
 * Backend endpoint: GET /blog/posts, GET /blog/posts/:slug
 */
export interface BlogPost {
  id: number
  title: string
  slug: string
  content: string
  cover_image_url?: string
  category: BlogPostCategory
  published: boolean
  published_at?: string
  created_at: string
  updated_at: string
}

/** Query parameters for the blog post list endpoint */
export interface BlogListFilters {
  category?: BlogPostCategory
}

/** API response envelope for GET /blog/posts */
export interface BlogListResponse {
  posts: BlogPost[]
  message?: string
}
