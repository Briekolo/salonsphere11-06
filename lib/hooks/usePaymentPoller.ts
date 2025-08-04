'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface PaymentPollerOptions {
  paymentId: string | null
  tenantId: string | null
  onSuccess?: () => void
  onError?: (error: Error) => void
  maxAttempts?: number
  initialDelay?: number
  maxDelay?: number
}

/**
 * Hook that polls for payment status with exponential backoff
 * Automatically activates payments as soon as they're confirmed
 */
export function usePaymentPoller({
  paymentId,
  tenantId,
  onSuccess,
  onError,
  maxAttempts = 10,
  initialDelay = 1000,
  maxDelay = 30000
}: PaymentPollerOptions) {
  const queryClient = useQueryClient()
  const attemptRef = useRef(0)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const isPollingRef = useRef(false)

  const checkAndActivatePayment = useCallback(async () => {
    if (!paymentId || isPollingRef.current) return

    try {
      console.log(`[Payment Poller] Checking payment ${paymentId} (attempt ${attemptRef.current + 1}/${maxAttempts})`)
      
      // Try to activate the payment
      const response = await fetch('/api/subscription/activate-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          paymentId,
          forceActivate: attemptRef.current >= 3 // Force after 3 attempts
        })
      })

      const result = await response.json()

      if (result.success && (result.activated || result.alreadyActivated)) {
        console.log('[Payment Poller] Payment activated successfully!')
        isPollingRef.current = false
        
        // Invalidate subscription queries to refresh UI
        if (tenantId) {
          queryClient.invalidateQueries({ queryKey: ['subscription-active', tenantId] })
          queryClient.invalidateQueries({ queryKey: ['subscription-status', tenantId] })
          queryClient.invalidateQueries({ queryKey: ['subscription-details', tenantId] })
        }
        
        onSuccess?.()
        return
      }

      // Not yet successful, schedule next attempt
      attemptRef.current++
      
      if (attemptRef.current >= maxAttempts) {
        console.log('[Payment Poller] Max attempts reached')
        isPollingRef.current = false
        onError?.(new Error('Payment activation timeout'))
        return
      }

      // Calculate next delay with exponential backoff
      const nextDelay = Math.min(initialDelay * Math.pow(1.5, attemptRef.current), maxDelay)
      console.log(`[Payment Poller] Scheduling next check in ${nextDelay}ms`)
      
      timeoutRef.current = setTimeout(() => {
        checkAndActivatePayment()
      }, nextDelay)

    } catch (error) {
      console.error('[Payment Poller] Error:', error)
      isPollingRef.current = false
      onError?.(error instanceof Error ? error : new Error('Payment polling failed'))
    }
  }, [paymentId, tenantId, maxAttempts, initialDelay, maxDelay, onSuccess, onError, queryClient])

  // Start polling when payment ID is set
  useEffect(() => {
    if (paymentId && !isPollingRef.current) {
      console.log(`[Payment Poller] Starting to poll for payment ${paymentId}`)
      isPollingRef.current = true
      attemptRef.current = 0
      checkAndActivatePayment()
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      isPollingRef.current = false
    }
  }, [paymentId, checkAndActivatePayment])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      isPollingRef.current = false
    }
  }, [])

  return {
    isPolling: isPollingRef.current,
    attempts: attemptRef.current
  }
}