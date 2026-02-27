// ============================================================
// Blog editorial feature — domain types
// Aligned with Mopetoo backend API (Go + Gin)
// RF-600 to RF-609
// ============================================================

export interface BlogAuthor {
  id: string
  name: string
  avatar?: string
}

export interface BlogCategory {
  id: string
  slug: string
  name: string
  description?: string
  /** Number of published posts in this category (returned by list endpoint) */
  post_count?: number
}

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  featured_image?: string
  author: BlogAuthor
  category: BlogCategory
  tags: string[]
  published_at: string
  updated_at: string
  /** Approximate reading time in minutes (may be absent for older posts) */
  reading_time_minutes?: number
  is_published: boolean
}

/** Query parameters for the blog post list endpoint */
export interface BlogListFilters {
  category_slug?: string
  search?: string
  page?: number
  limit?: number
}

/** Paginated response envelope from GET /api/blog/posts */
export interface BlogListResponse {
  posts: BlogPost[]
  total: number
  page: number
  limit: number
  total_pages: number
}
