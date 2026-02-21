// ============================================================
// useApi — HTTP client wrapper
// Automatically attaches JWT Authorization header from auth store
// and prefixes the base API URL from runtime config.
// ============================================================

import type { ApiError } from '../types/api.types'

export function useApi() {
  const config = useRuntimeConfig()
  const baseURL = (config.public.apiBase as string) ?? ''

  /**
   * Authenticated GET request
   */
  async function get<T>(path: string): Promise<T> {
    const token = getToken()
    return await $fetch<T>(`${baseURL}${path}`, {
      method: 'GET',
      headers: buildHeaders(token),
    })
  }

  /**
   * Authenticated POST request
   */
  async function post<T>(path: string, body: unknown): Promise<T> {
    const token = getToken()
    return await $fetch<T>(`${baseURL}${path}`, {
      method: 'POST',
      headers: buildHeaders(token),
      body,
    })
  }

  /**
   * Authenticated PUT request
   */
  async function put<T>(path: string, body: unknown): Promise<T> {
    const token = getToken()
    return await $fetch<T>(`${baseURL}${path}`, {
      method: 'PUT',
      headers: buildHeaders(token),
      body,
    })
  }

  /**
   * Authenticated DELETE request
   */
  async function del<T>(path: string): Promise<T> {
    const token = getToken()
    return await $fetch<T>(`${baseURL}${path}`, {
      method: 'DELETE',
      headers: buildHeaders(token),
    })
  }

  return { get, post, put, del }
}

// ── Helpers ─────────────────────────────────────────────────

function getToken(): string | null {
  if (import.meta.client) {
    return localStorage.getItem('mopetoo_token')
  }
  return null
}

function buildHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}
