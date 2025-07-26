'use client'

import { useEffect, useCallback } from 'react'

interface UseKeyboardNavigationProps {
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
  onNewAppointment: () => void
  onEscape?: () => void
  enabled?: boolean
}

export function useKeyboardNavigation({
  onPrevious,
  onNext,
  onToday,
  onNewAppointment,
  onEscape,
  enabled = true
}: UseKeyboardNavigationProps) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return
    
    // Check if user is typing in an input
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return
    }
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        onPrevious()
        break
        
      case 'ArrowRight':
        event.preventDefault()
        onNext()
        break
        
      case 't':
      case 'T':
        if (!event.metaKey && !event.ctrlKey) {
          event.preventDefault()
          onToday()
        }
        break
        
      case 'n':
      case 'N':
        if (!event.metaKey && !event.ctrlKey) {
          event.preventDefault()
          onNewAppointment()
        }
        break
        
      case 'Escape':
        if (onEscape) {
          event.preventDefault()
          onEscape()
        }
        break
    }
    
    // Cmd/Ctrl + Arrow for faster navigation
    if ((event.metaKey || event.ctrlKey) && event.key === 'ArrowLeft') {
      event.preventDefault()
      // Navigate to previous month
      for (let i = 0; i < 4; i++) onPrevious()
    }
    
    if ((event.metaKey || event.ctrlKey) && event.key === 'ArrowRight') {
      event.preventDefault()
      // Navigate to next month
      for (let i = 0; i < 4; i++) onNext()
    }
  }, [enabled, onPrevious, onNext, onToday, onNewAppointment, onEscape])
  
  useEffect(() => {
    if (!enabled) return
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, enabled])
  
  // Return keyboard shortcuts info
  return {
    shortcuts: [
      { key: '←/→', description: 'Vorige/Volgende periode' },
      { key: 'T', description: 'Ga naar vandaag' },
      { key: 'N', description: 'Nieuwe afspraak' },
      { key: 'Cmd+←/→', description: 'Vorige/Volgende maand' }
    ]
  }
}