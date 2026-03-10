import type { Country, City } from '../types/api.types'

export function useLocations() {
  const { get } = useApi()

  const countries = ref<Country[]>([])
  const cities = ref<City[]>([])
  const loadingCountries = ref(false)
  const loadingCities = ref(false)

  async function fetchCountries(): Promise<void> {
    if (countries.value.length > 0) return
    loadingCountries.value = true
    try {
      const response = await get<{ countries: Country[] }>('/countries')
      countries.value = response.countries ?? []
    }
    catch {
      countries.value = []
    }
    finally {
      loadingCountries.value = false
    }
  }

  async function fetchCitiesByCountry(countryId: number): Promise<void> {
    loadingCities.value = true
    try {
      const response = await get<{ cities: City[] }>(`/countries/${countryId}/cities`)
      cities.value = response.cities ?? []
    }
    catch {
      cities.value = []
    }
    finally {
      loadingCities.value = false
    }
  }

  function clearCities(): void {
    cities.value = []
  }

  return {
    countries,
    cities,
    loadingCountries,
    loadingCities,
    fetchCountries,
    fetchCitiesByCountry,
    clearCities,
  }
}
