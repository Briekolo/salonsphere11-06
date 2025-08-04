import { paymentReconciliationService } from '@/lib/services/paymentReconciliationService'

export interface PaymentTimeoutConfig {
  paymentId: string
  molliePaymentId: string
  createdAt: string
  timeoutMs: number
}

class PaymentTimeoutManager {
  private timeouts = new Map<string, NodeJS.Timeout>()

  /**
   * Schedule a webhook timeout check for a payment
   * In serverless environments, this may not be reliable, so we rely on cron jobs as primary mechanism
   */
  scheduleWebhookTimeout(config: PaymentTimeoutConfig): void {
    const { paymentId, molliePaymentId, createdAt, timeoutMs } = config

    console.log(`[PaymentTimeout] Scheduling webhook timeout check for payment ${molliePaymentId} in ${timeoutMs}ms`)

    // Clear any existing timeout for this payment
    this.clearTimeout(paymentId)

    // Schedule the timeout check
    const timeoutId = setTimeout(async () => {
      try {
        console.log(`[PaymentTimeout] Webhook timeout triggered for payment ${molliePaymentId}`)
        
        // Check if payment still needs reconciliation
        const needsReconciliation = await paymentReconciliationService.needsReconciliation(
          molliePaymentId,
          createdAt
        )

        if (needsReconciliation) {
          console.log(`[PaymentTimeout] Payment ${molliePaymentId} needs reconciliation - triggering force reconcile`)
          
          const success = await paymentReconciliationService.forceReconcilePayment(molliePaymentId)
          
          if (success) {
            console.log(`[PaymentTimeout] Successfully reconciled payment ${molliePaymentId} via timeout handler`)
          } else {
            console.error(`[PaymentTimeout] Failed to reconcile payment ${molliePaymentId} via timeout handler`)
          }
        } else {
          console.log(`[PaymentTimeout] Payment ${molliePaymentId} no longer needs reconciliation - webhook likely arrived`)
        }

        // Clean up the timeout reference
        this.timeouts.delete(paymentId)

      } catch (error) {
        console.error(`[PaymentTimeout] Error in timeout handler for payment ${molliePaymentId}:`, error)
        this.timeouts.delete(paymentId)
      }
    }, timeoutMs)

    // Store the timeout reference
    this.timeouts.set(paymentId, timeoutId)
  }

  /**
   * Cancel a scheduled webhook timeout (called when webhook is received)
   */
  clearTimeout(paymentId: string): void {
    const timeoutId = this.timeouts.get(paymentId)
    if (timeoutId) {
      clearTimeout(timeoutId)
      this.timeouts.delete(paymentId)
      console.log(`[PaymentTimeout] Cleared webhook timeout for payment ${paymentId}`)
    }
  }

  /**
   * Get number of active timeouts (for monitoring)
   */
  getActiveTimeoutsCount(): number {
    return this.timeouts.size
  }

  /**
   * Clear all timeouts (for cleanup)
   */
  clearAllTimeouts(): void {
    for (const [paymentId, timeoutId] of this.timeouts.entries()) {
      clearTimeout(timeoutId)
    }
    this.timeouts.clear()
    console.log('[PaymentTimeout] Cleared all payment timeouts')
  }

  /**
   * Check if payment has an active timeout
   */
  hasActiveTimeout(paymentId: string): boolean {
    return this.timeouts.has(paymentId)
  }
}

// Singleton instance
export const paymentTimeoutManager = new PaymentTimeoutManager()

// Helper function to schedule webhook timeout from API routes
export function schedulePaymentWebhookTimeout(
  paymentId: string,
  molliePaymentId: string,
  createdAt: string,
  timeoutMs: number = 3 * 60 * 1000 // 3 minutes default
): void {
  // Note: In serverless environments like Vercel, timeouts may not persist across requests
  // This is primarily for development and local testing
  // Production should rely on the cron job for reliable reconciliation
  
  if (process.env.NODE_ENV === 'development') {
    paymentTimeoutManager.scheduleWebhookTimeout({
      paymentId,
      molliePaymentId,
      createdAt,
      timeoutMs
    })
  } else {
    console.log(`[PaymentTimeout] Skipping in-memory timeout in production - relying on cron reconciliation`)
  }
}

// Helper function to cancel webhook timeout when webhook is received
export function cancelPaymentWebhookTimeout(paymentId: string): void {
  paymentTimeoutManager.clearTimeout(paymentId)
}

export default paymentTimeoutManager