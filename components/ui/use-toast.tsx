import { useState, useCallback } from 'react'

interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

interface ToastState {
  toasts: Toast[]
}

let toastCount = 0

export function useToast() {
  const [state, setState] = useState<ToastState>({ toasts: [] })

  const toast = useCallback(
    ({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
      const id = String(toastCount++)
      const newToast: Toast = { id, title, description, variant }
      
      setState((prev) => ({
        toasts: [...prev.toasts, newToast],
      }))

      // Auto-remove toast after 5 seconds
      setTimeout(() => {
        setState((prev) => ({
          toasts: prev.toasts.filter((t) => t.id !== id),
        }))
      }, 5000)
    },
    []
  )

  return { toast, toasts: state.toasts }
}