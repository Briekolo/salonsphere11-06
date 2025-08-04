'use client'

import { useEffect } from 'react'
import { useTenant } from '@/lib/hooks/useTenant'
import { useSubscription } from '@/lib/hooks/useSubscription'

/**
 * Provider that automatically checks for stuck payments on app load
 * This ensures payments are never stuck even if all other mechanisms fail
 */
export function PaymentVerificationProvider({ children }: { children: React.ReactNode }) {
  const { tenantId } = useTenant()
  const { subscriptionStatus } = useSubscription()

  useEffect(() => {
    if (!tenantId || !subscriptionStatus) return

    // Only check if subscription is unpaid
    if (subscriptionStatus.status === 'unpaid' || subscriptionStatus.status === 'pending') {
      console.log('[Payment Verification] Detected unpaid subscription, checking for stuck payments...')
      
      // Check for stuck payments
      const verifyPayments = async () => {
        try {
          const response = await fetch('/api/subscription/sync-payment-status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              tenantId,
              useReconciliationService: true 
            })
          })

          const result = await response.json()
          
          if (result.fixedPayments > 0) {
            console.log(`[Payment Verification] Fixed ${result.fixedPayments} stuck payment(s)`)
            // Reload to show updated subscription status
            window.location.reload()
          }
        } catch (error) {
          console.error('[Payment Verification] Error checking payments:', error)
        }
      }

      // Run verification after a short delay to not block initial render
      const timer = setTimeout(verifyPayments, 2000)
      return () => clearTimeout(timer)
    }
  }, [tenantId, subscriptionStatus])

  return <>{children}</>
}