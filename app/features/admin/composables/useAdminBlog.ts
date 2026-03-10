// ============================================================
// useAdminBlog — Blog management composable for admin panel.
// Provides CRUD operations against the admin blog API.
// ============================================================

import type { BlogPost } from '../../blog/types'
import { extractErrorMessage } from '../../shared/utils/extractErrorMessage'

export function useAdminBlog() {
  const { get, post, put, del, patch, upload } = useApi()

  const posts = ref<BlogPost[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAllPosts(category?: string): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const params = new URLSearchParams()
      if (category) params.set('category', category)
      const qs = params.toString()
      const path = qs ? `/api/blog/posts?${qs}` : '/api/blog/posts'
      const response = await get<{ posts: BlogPost[] }>(path)
      posts.value = response.posts ?? []
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      isLoading.value = false
    }
  }

  async function fetchPostById(id: number): Promise<BlogPost | null> {
    error.value = null
    try {
      return await get<BlogPost>(`/api/blog/posts/${id}`)
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
  }

  async function createPost(data: {
    title: string
    slug: string
    content: string
    category: string
    cover_image_url?: string
  }): Promise<BlogPost | null> {
    error.value = null
    try {
      return await post<BlogPost>('/api/blog/posts', data)
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
  }

  async function updatePost(id: number, data: {
    title?: string
    slug?: string
    content?: string
    category?: string
    cover_image_url?: string
  }): Promise<BlogPost | null> {
    error.value = null
    try {
      return await put<BlogPost>(`/api/blog/posts/${id}`, data)
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
  }

  async function deletePost(id: number): Promise<boolean> {
    error.value = null
    try {
      await del(`/api/blog/posts/${id}`)
      posts.value = posts.value.filter(p => p.id !== id)
      return true
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return false
    }
  }

  async function togglePublish(id: number, publish: boolean): Promise<BlogPost | null> {
    error.value = null
    try {
      const updated = await patch<BlogPost>(`/api/blog/posts/${id}/publish`, { published: publish })
      const idx = posts.value.findIndex(p => p.id === id)
      if (idx !== -1) {
        posts.value[idx] = updated
      }
      return updated
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
  }

  async function uploadCoverImage(postId: number, file: File): Promise<BlogPost | null> {
    error.value = null
    try {
      const formData = new FormData()
      formData.append('cover_image', file)
      return await upload<BlogPost>(`/api/blog/posts/${postId}/cover-image`, formData)
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
  }

  return {
    posts,
    isLoading,
    error,
    fetchAllPosts,
    fetchPostById,
    createPost,
    updatePost,
    deletePost,
    togglePublish,
    uploadCoverImage,
  }
}
