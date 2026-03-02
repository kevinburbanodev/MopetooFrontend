// ============================================================
// usePetshops — Petshop directory feature composable
// Central API surface for the petshop directory.
// State is owned by usePetshopsStore; this composable is the
// API layer that keeps the store in sync.
// ============================================================

import type { Petshop, PetshopListFilters, PetshopListResponse, StoreProduct, StoreProductListResponse } from '../types'
import { extractErrorMessage } from '../../shared/utils/extractErrorMessage'

export function usePetshops() {
  const { get } = useApi()
  const petshopsStore = usePetshopsStore()

  const error = ref<string | null>(null)

  // ── Public API ──────────────────────────────────────────────

  /**
   * Fetch all petshops, optionally filtered by city and category.
   * Handles both `{ stores: Petshop[] }` envelope and plain `Petshop[]` shapes.
   */
  async function fetchPetshops(filters?: PetshopListFilters): Promise<void> {
    petshopsStore.setLoading(true)
    error.value = null
    try {
      const params = new URLSearchParams()
      if (filters?.city) params.set('city', filters.city)
      if (filters?.category) params.set('category', filters.category)
      const qs = params.toString()
      const path = qs ? `/api/stores?${qs}` : '/api/stores'

      const response = await get<PetshopListResponse | Petshop[]>(path)
      if (Array.isArray(response)) {
        petshopsStore.setPetshops(response)
      }
      else {
        petshopsStore.setPetshops(response.stores ?? [])
      }
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      petshopsStore.setLoading(false)
    }
  }

  /**
   * Fetch a single petshop by id. Checks the petshops[] array first
   * (store-first lookup — avoids a network round-trip when navigating
   * from the list to the detail view).
   * Calls setSelectedPetshop() on success.
   * Returns the petshop or null on failure.
   */
  async function fetchPetshopById(id: number): Promise<Petshop | null> {
    // Store-first: if we already loaded this petshop in the list, reuse it.
    const cached = petshopsStore.petshops.find(p => p.id === id)
    if (cached) {
      petshopsStore.setSelectedPetshop(cached)
      return cached
    }

    petshopsStore.setLoading(true)
    error.value = null
    try {
      const petshop = await get<Petshop>(`/api/stores/${id}`)
      petshopsStore.setSelectedPetshop(petshop)
      return petshop
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
    finally {
      petshopsStore.setLoading(false)
    }
  }

  /**
   * Fetch products for a given store.
   * Handles both `{ products: StoreProduct[] }` envelope and plain array shapes.
   */
  async function fetchStoreProducts(storeId: number): Promise<void> {
    petshopsStore.setLoading(true)
    error.value = null
    try {
      const response = await get<StoreProductListResponse | StoreProduct[]>(
        `/api/stores/${storeId}/products`,
      )
      if (Array.isArray(response)) {
        petshopsStore.setStoreProducts(response)
      }
      else {
        petshopsStore.setStoreProducts(response.products ?? [])
      }
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      petshopsStore.setLoading(false)
    }
  }

  return {
    error,
    petshopsStore,
    fetchPetshops,
    fetchPetshopById,
    fetchStoreProducts,
  }
}

