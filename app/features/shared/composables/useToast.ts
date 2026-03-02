import { toast } from 'vue-sonner'

export function useToast() {
  function toastError(message: string, title = 'Error'): void {
    toast.error(title, { description: message, duration: 5000 })
  }

  function toastSuccess(message: string, title = '¡Listo!'): void {
    toast.success(title, { description: message, duration: 4000 })
  }

  function toastInfo(message: string, title = 'Información'): void {
    toast.info(title, { description: message, duration: 4000 })
  }

  return { toastError, toastSuccess, toastInfo }
}
