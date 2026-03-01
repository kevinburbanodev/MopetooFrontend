// ============================================================
// useShelters — Adoption Listings feature composable
// Central API surface for adoption listing operations.
// State is owned by useSheltersStore; this composable is the
// API layer that keeps the store in sync.
//
// Backend endpoints:
//   GET  /api/adoption-listings        → list all available
//   GET  /api/adoption-listings/:id    → single listing
//   POST /api/adoption-listings/:id/requests → adoption request
// ============================================================

import type { AdoptionListing, AdoptionRequest } from '../types'

export function useShelters() {
  const { get, post } = useApi()
  const sheltersStore = useSheltersStore()

  const error = ref<string | null>(null)

  // ── Public API ──────────────────────────────────────────────

  /**
   * Fetch all adoption listings.
   * Handles both `{ adoption_listings: AdoptionListing[] }` and bare array shapes.
   */
  async function fetchAdoptionListings(): Promise<void> {
    sheltersStore.setLoading(true)
    error.value = null
    try {
      const response = await get<{ adoption_listings?: AdoptionListing[] } | AdoptionListing[]>(
        '/api/adoption-listings',
      )
      if (Array.isArray(response)) {
        sheltersStore.setAdoptionListings(response)
      }
      else {
        sheltersStore.setAdoptionListings(response.adoption_listings ?? [])
      }
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      sheltersStore.setLoading(false)
    }
  }

  /**
   * Fetch a single adoption listing by id and store it as selectedListing.
   * Returns the listing or null on failure.
   */
  async function fetchAdoptionListingById(id: number): Promise<AdoptionListing | null> {
    sheltersStore.setLoading(true)
    error.value = null
    try {
      const listing = await get<AdoptionListing>(`/api/adoption-listings/${id}`)
      sheltersStore.setSelectedListing(listing)
      return listing
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
    finally {
      sheltersStore.setLoading(false)
    }
  }

  /**
   * Submit an adoption request for a listing. Requires authentication.
   * Returns the created AdoptionRequest or null on failure.
   */
  async function submitAdoptionRequest(
    listingId: number,
    message: string,
  ): Promise<AdoptionRequest | null> {
    sheltersStore.setLoading(true)
    error.value = null
    try {
      const request = await post<AdoptionRequest>(
        `/api/adoption-listings/${listingId}/requests`,
        { message },
      )
      return request
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
    finally {
      sheltersStore.setLoading(false)
    }
  }

  return {
    error,
    sheltersStore,
    fetchAdoptionListings,
    fetchAdoptionListingById,
    submitAdoptionRequest,
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
