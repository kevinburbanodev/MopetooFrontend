// ============================================================
// Petshops feature — domain types
// Aligned with Mopetoo backend API (Go + Gin) model.Store
// RF-700 to RF-709
// ============================================================

/** Product category values accepted by the backend */
export type StoreProductCategory =
  | 'alimento'
  | 'accesorios'
  | 'salud'
  | 'juguetes'
  | 'higiene'
  | 'otros'

/** Static list of product categories for filter UI */
export const PRODUCT_CATEGORIES: { value: StoreProductCategory; label: string }[] = [
  { value: 'alimento', label: 'Alimentos' },
  { value: 'accesorios', label: 'Accesorios' },
  { value: 'salud', label: 'Salud' },
  { value: 'juguetes', label: 'Juguetes' },
  { value: 'higiene', label: 'Higiene' },
  { value: 'otros', label: 'Otros' },
]

/**
 * model.Store — aligned with the Go backend.
 * Backend endpoint: GET /api/stores, GET /api/stores/:id
 */
export interface Petshop {
  id: number
  name: string
  email: string
  description: string
  logo_url?: string
  country: string
  city: string
  phone_country_code: string
  phone: string
  whatsapp_link?: string
  website?: string
  verified: boolean
  is_active: boolean
  plan: string
  created_at: string
  updated_at: string
}

/**
 * model.StoreProduct — products sold by a store.
 * Backend endpoint: GET /api/stores/:id/products
 */
export interface StoreProduct {
  id: number
  store_id: number
  name: string
  description: string
  category: StoreProductCategory
  price: number
  photo_url?: string
  is_available: boolean
  created_at: string
  updated_at: string
}

/** Query parameters for the petshop directory endpoint */
export interface PetshopListFilters {
  city?: string
  category?: string
}

/** API response envelope for GET /api/stores */
export interface PetshopListResponse {
  stores: Petshop[]
  message?: string
}

/** API response envelope for GET /api/stores/:id/products */
export interface StoreProductListResponse {
  products: StoreProduct[]
  message?: string
}
