'use client'

import { useToast } from '@/components/providers/ToastProvider'
import { X } from 'lucide-react'

export function ToastContainer() {
  const { toasts, removeToast } = useToast()
  
  console.log('ToastContainer render - toasts:', toasts) // Debug log

  const getToastStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 border-green-500 text-green-800'
      case 'error':
        return 'bg-red-100 border-red-500 text-red-800'
      case 'warning':
        return 'bg-yellow-100 border-yellow-500 text-yellow-800'
      case 'info':
      default:
        return 'bg-blue-100 border-blue-500 text-blue-800'
    }
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center justify-between p-4 rounded-lg border-l-4 shadow-lg min-w-[300px] max-w-[400px] ${getToastStyles(toast.type)}`}
        >
          <div className="flex-1">
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-3 p-1 hover:bg-black/10 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}