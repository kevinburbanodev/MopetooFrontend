// ============================================================
// usePetAge — utility composable for formatting an integer age
// (in years) into a human-readable Spanish string.
//
// The backend stores age as *int (approximate years). This
// composable formats that integer for display in components.
// ============================================================

/**
 * Format an integer age (years) into a Spanish-language label.
 * Returns "3 años", "1 año", "Menos de 1 año", or "Desconocida".
 */
export function usePetAge() {
  function formatAge(age: number | null | undefined): string {
    if (age === null || age === undefined) return 'Desconocida'
    if (age === 0) return 'Menos de 1 año'
    if (age === 1) return '1 año'
    return `${age} años`
  }

  return { formatAge }
}
