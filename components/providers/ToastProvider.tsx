'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning'
type ToastVariant = 'default' | 'destructive'

interface Toast {
  id: string
  message?: string
  title?: string
  description?: string
  type: ToastType
  variant?: ToastVariant
}

interface ToastInput {
  title?: string
  description?: string
  variant?: ToastVariant
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (message: string, type?: ToastType) => void
  toast: (input: ToastInput) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

let toastId = 0

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])
  
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${toastId++}`
    const newToast: Toast = { id, message, type }
    
    console.log('showToast called:', { message, type, id }) // Debug log
    
    setToasts(prev => {
      const updated = [...prev, newToast]
      console.log('Toast state updated:', updated) // Debug log
      return updated
    })
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }, [])
  
  const toast = useCallback((input: ToastInput) => {
    const id = `toast-${toastId++}`
    const type: ToastType = input.variant === 'destructive' ? 'error' : 'info'
    const newToast: Toast = { 
      id, 
      title: input.title,
      description: input.description,
      type,
      variant: input.variant
    }
    
    console.log('toast called:', { input, type, id }) // Debug log
    
    setToasts(prev => {
      const updated = [...prev, newToast]
      console.log('Toast state updated:', updated) // Debug log
      return updated
    })
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }, [])
  
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])
  
  return (
    <ToastContext.Provider value={{ toasts, showToast, toast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}