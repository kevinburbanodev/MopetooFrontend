// ============================================================
// usePetProfile — fetches a public pet profile by slug.
// Uses useFetch for SSR support so the page is server-rendered
// for QR code scanning and SEO.
// ============================================================

import type { PublicPetProfile } from '../types'

export function usePetProfile(slug: string) {
  const config = useRuntimeConfig()
  const baseURL = (config.public.apiBase as string) ?? ''

  const { data, error, status } = useFetch<PublicPetProfile>(
    `${baseURL}/pets/public/${slug}`,
    { key: `pet-profile-${slug}` },
  )

  const pet = computed(() => data.value?.pet ?? null)
  const photos = computed(() => data.value?.photos ?? [])
  const notFound = computed(() => !!error.value)
  const loading = computed(() => status.value === 'pending')

  return { pet, photos, notFound, loading }
}
