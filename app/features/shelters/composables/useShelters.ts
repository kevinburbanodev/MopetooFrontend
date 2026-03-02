// ============================================================
// useShelters — Shelters & Adoption Listings feature composable
// Central API surface for shelter and adoption listing operations.
// State is owned by useSheltersStore; this composable is the
// API layer that keeps the store in sync.
//
// Backend endpoints:
//   GET  /shelters                          → public directory
//   GET  /shelters/:id                      → public detail
//   GET  /adoption-listings                 → public (with shelter embedded)
//   GET  /adoption-listings/:id             → public (with shelter embedded)
//   POST /api/adoption-listings/:id/requests → protected
// ============================================================

import type { AdoptionListing, AdoptionRequest, Shelter } from '../types'
import { extractErrorMessage } from '../../shared/utils/extractErrorMessage'

export function useShelters() {
  const { get, post } = useApi()
  const sheltersStore = useSheltersStore()

  const error = ref<string | null>(null)

  // ── Adoption listings (public) ────────────────────────────

  /**
   * Fetch all adoption listings (public endpoint, with shelter embedded).
   * Handles both `{ adoption_listings: AdoptionListing[] }` and bare array shapes.
   */
  async function fetchAdoptionListings(): Promise<void> {
    sheltersStore.setLoading(true)
    error.value = null
    try {
      const response = await get<{ adoption_listings?: AdoptionListing[] } | AdoptionListing[]>(
        '/adoption-listings',
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
   * Fetch a single adoption listing by id (public, with shelter embedded).
   * Returns the listing or null on failure.
   */
  async function fetchAdoptionListingById(id: number): Promise<AdoptionListing | null> {
    sheltersStore.setLoading(true)
    error.value = null
    try {
      const listing = await get<AdoptionListing>(`/adoption-listings/${id}`)
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

  // ── Shelters (public) ──────────────────────────────────────

  /**
   * Fetch all public shelters (active + verified).
   * Handles both `{ shelters: Shelter[] }` and bare array shapes.
   */
  async function fetchShelters(): Promise<void> {
    sheltersStore.setLoading(true)
    error.value = null
    try {
      const response = await get<{ shelters?: Shelter[] } | Shelter[]>(
        '/shelters',
      )
      if (Array.isArray(response)) {
        sheltersStore.setShelters(response)
      }
      else {
        sheltersStore.setShelters(response.shelters ?? [])
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
   * Fetch a single shelter by id (public). Uses store-first cache.
   * Returns the shelter or null on failure.
   */
  async function fetchShelterById(id: number): Promise<Shelter | null> {
    // Cache-first: check if already in store
    const cached = sheltersStore.shelters.find(s => s.id === id) ?? null
    if (cached) {
      sheltersStore.setSelectedShelter(cached)
      return cached
    }

    sheltersStore.setLoading(true)
    error.value = null
    try {
      const shelter = await get<Shelter>(`/shelters/${id}`)
      sheltersStore.setSelectedShelter(shelter)
      return shelter
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
    fetchShelters,
    fetchShelterById,
  }
}
