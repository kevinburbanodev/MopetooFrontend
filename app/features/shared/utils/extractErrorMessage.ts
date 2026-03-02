export function extractErrorMessage(err: unknown): string {
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
