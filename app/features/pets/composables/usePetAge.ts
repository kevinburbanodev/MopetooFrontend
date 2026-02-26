// ============================================================
// usePetAge — utility composable for computing a human-readable
// age string from an ISO birth_date string.
// Exported as a standalone composable so both components and
// composables can use it without coupling.
// ============================================================

/**
 * Compute a Spanish-language age label from an ISO date string.
 * Returns strings like "2 años", "8 meses", "2 años y 3 meses",
 * or "Recién nacido" if birth_date is empty or unparseable.
 */
export function usePetAge() {
  function formatAge(birthDate: string): string {
    if (!birthDate) return 'Desconocida'

    const birth = new Date(birthDate)
    if (isNaN(birth.getTime())) return 'Desconocida'

    const now = new Date()

    let years = now.getFullYear() - birth.getFullYear()
    let months = now.getMonth() - birth.getMonth()

    if (months < 0) {
      years--
      months += 12
    }

    // Adjust if the day of month hasn't been reached yet this month
    if (now.getDate() < birth.getDate()) {
      months--
      if (months < 0) {
        years--
        months += 12
      }
    }

    if (years === 0 && months === 0) return 'Recién nacido'
    if (years === 0) return months === 1 ? '1 mes' : `${months} meses`
    if (months === 0) return years === 1 ? '1 año' : `${years} años`
    const yearLabel = years === 1 ? '1 año' : `${years} años`
    const monthLabel = months === 1 ? '1 mes' : `${months} meses`
    return `${yearLabel} y ${monthLabel}`
  }

  return { formatAge }
}
