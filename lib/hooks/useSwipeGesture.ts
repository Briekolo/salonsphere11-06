'use client'

import { useRef, useEffect } from 'react'

interface UseSwipeGestureProps {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
  enabled?: boolean
}

export function useSwipeGesture(
  elementRef: React.RefObject<HTMLElement>,
  {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    enabled = true
  }: UseSwipeGestureProps
) {
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const touchEndY = useRef<number | null>(null)
  
  useEffect(() => {
    if (!enabled || !elementRef.current) return
    
    const element = elementRef.current
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.changedTouches[0].screenX
      touchStartY.current = e.changedTouches[0].screenY
    }
    
    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX.current = e.changedTouches[0].screenX
      touchEndY.current = e.changedTouches[0].screenY
      handleSwipe()
    }
    
    const handleSwipe = () => {
      if (!touchStartX.current || !touchStartY.current || !touchEndX.current || !touchEndY.current) {
        return
      }
      
      const deltaX = touchEndX.current - touchStartX.current
      const deltaY = touchEndY.current - touchStartY.current
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)
      
      // Horizontal swipe
      if (absX > absY && absX > threshold) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight()
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft()
        }
      }
      
      // Vertical swipe
      if (absY > absX && absY > threshold) {
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown()
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp()
        }
      }
      
      // Reset
      touchStartX.current = null
      touchStartY.current = null
      touchEndX.current = null
      touchEndY.current = null
    }
    
    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [elementRef, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, enabled])
}