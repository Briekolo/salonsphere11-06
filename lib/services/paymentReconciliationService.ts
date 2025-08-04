import { createClient } from '@supabase/supabase-js'
import { mollieService } from './mollieService'
import { Database } from '@/types/database'

export interface PaymentReconciliationResult {
  processedPayments: number
  fixedPayments: number
  failedPayments: string[]
  errors: string[]
}

export interface StuckPayment {
  id: string
  subscription_id: string
  mollie_payment_id: string
  created_at: string
  amount_cents: number
  currency: string
}

class PaymentReconciliationService {
  private getSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables for payment reconciliation')
    }
    
    return createClient<Database>(
      supabaseUrl,
      supabaseServiceKey,
      { auth: { persistSession: false } }
    )
  }

  /**
   * Find payments that are stuck in 'pending' status for more than 5 minutes
   */
  async findStuckPayments(): Promise<StuckPayment[]> {
    const fiveMinutesAgo = new Date()
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5)

    const supabase = this.getSupabaseClient()
    const { data: stuckPayments, error } = await supabase
      .from('subscription_payments')
      .select('id, subscription_id, mollie_payment_id, created_at, amount_cents, currency')
      .eq('status', 'pending')
      .lt('created_at', fiveMinutesAgo.toISOString())
      .not('mollie_payment_id', 'is', null)

    if (error) {
      console.error('[PaymentReconciliation] Error finding stuck payments:', error)
      throw new Error(`Failed to find stuck payments: ${error.message}`)
    }

    console.log(`[PaymentReconciliation] Found ${stuckPayments?.length || 0} stuck payments`)
    return stuckPayments || []
  }

  /**
   * Reconcile a single payment with Mollie API
   */
  async reconcilePayment(payment: StuckPayment): Promise<boolean> {
    try {
      console.log(`[PaymentReconciliation] Processing payment ${payment.mollie_payment_id}`)

      // Get payment status from Mollie
      const molliePayment = await mollieService.getPayment(payment.mollie_payment_id)
      console.log(`[PaymentReconciliation] Mollie status for ${payment.mollie_payment_id}: ${molliePayment.status}`)

      // Convert Mollie status to internal status
      const internalStatus = mollieService.getInternalPaymentStatus(molliePayment.status)
      const paymentDate = mollieService.isPaymentSuccessful(molliePayment) ? new Date().toISOString() : null
      const failureReason = mollieService.isPaymentFailed(molliePayment) ? 
        molliePayment.details?.failureReason || 'Payment failed' : null

      // Update payment record
      const supabase = this.getSupabaseClient()
      const { error: paymentUpdateError } = await supabase
        .from('subscription_payments')
        .update({
          status: internalStatus,
          payment_date: paymentDate,
          failure_reason: failureReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id)

      if (paymentUpdateError) {
        console.error(`[PaymentReconciliation] Failed to update payment ${payment.id}:`, paymentUpdateError)
        return false
      }

      // If payment is successful, activate the subscription
      if (mollieService.isPaymentSuccessful(molliePayment)) {
        console.log(`[PaymentReconciliation] Activating subscription ${payment.subscription_id}`)
        
        const { error: subscriptionUpdateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            mollie_subscription_id: molliePayment.customerId ? `subscription_${molliePayment.customerId}` : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.subscription_id)

        if (subscriptionUpdateError) {
          console.error(`[PaymentReconciliation] Failed to activate subscription ${payment.subscription_id}:`, subscriptionUpdateError)
          return false
        }

        console.log(`[PaymentReconciliation] Successfully activated subscription ${payment.subscription_id}`)
      }
      // If payment failed, mark subscription as unpaid
      else if (mollieService.isPaymentFailed(molliePayment)) {
        console.log(`[PaymentReconciliation] Marking subscription ${payment.subscription_id} as unpaid`)
        
        const { error: subscriptionUpdateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'unpaid',
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.subscription_id)

        if (subscriptionUpdateError) {
          console.error(`[PaymentReconciliation] Failed to update subscription ${payment.subscription_id}:`, subscriptionUpdateError)
          return false
        }
      }

      return true
    } catch (error) {
      console.error(`[PaymentReconciliation] Error reconciling payment ${payment.mollie_payment_id}:`, error)
      return false
    }
  }

  /**
   * Run complete payment reconciliation process
   */
  async reconcileAllStuckPayments(): Promise<PaymentReconciliationResult> {
    const result: PaymentReconciliationResult = {
      processedPayments: 0,
      fixedPayments: 0,
      failedPayments: [],
      errors: []
    }

    try {
      console.log('[PaymentReconciliation] Starting payment reconciliation process')
      
      const stuckPayments = await this.findStuckPayments()
      result.processedPayments = stuckPayments.length

      if (stuckPayments.length === 0) {
        console.log('[PaymentReconciliation] No stuck payments found')
        return result
      }

      // Process each stuck payment
      for (const payment of stuckPayments) {
        try {
          const success = await this.reconcilePayment(payment)
          
          if (success) {
            result.fixedPayments++
            console.log(`[PaymentReconciliation] Successfully reconciled payment ${payment.mollie_payment_id}`)
          } else {
            result.failedPayments.push(payment.mollie_payment_id)
            console.log(`[PaymentReconciliation] Failed to reconcile payment ${payment.mollie_payment_id}`)
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          result.errors.push(`Payment ${payment.mollie_payment_id}: ${errorMessage}`)
          result.failedPayments.push(payment.mollie_payment_id)
          console.error(`[PaymentReconciliation] Error processing payment ${payment.mollie_payment_id}:`, error)
        }
      }

      console.log(`[PaymentReconciliation] Reconciliation complete. Fixed: ${result.fixedPayments}/${result.processedPayments}`)
      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      result.errors.push(`Global error: ${errorMessage}`)
      console.error('[PaymentReconciliation] Global error during reconciliation:', error)
      return result
    }
  }

  /**
   * Check if payment needs reconciliation (older than threshold and still pending)
   */
  async needsReconciliation(molliePaymentId: string, createdAt: string): Promise<boolean> {
    const paymentAge = Date.now() - new Date(createdAt).getTime()
    const RECONCILIATION_THRESHOLD = 2 * 60 * 1000 // 2 minutes

    if (paymentAge < RECONCILIATION_THRESHOLD) {
      return false
    }

    // Check if payment is still pending in our database
    const supabase = this.getSupabaseClient()
    const { data: payment, error } = await supabase
      .from('subscription_payments')
      .select('status')
      .eq('mollie_payment_id', molliePaymentId)
      .single()

    if (error || !payment) {
      console.error(`[PaymentReconciliation] Error checking payment status for ${molliePaymentId}:`, error)
      return false
    }

    return payment.status === 'pending'
  }

  /**
   * Force reconciliation of a specific payment (for manual sync)
   */
  async forceReconcilePayment(molliePaymentId: string): Promise<boolean> {
    try {
      const supabase = this.getSupabaseClient()
      const { data: payment, error } = await supabase
        .from('subscription_payments')
        .select('id, subscription_id, mollie_payment_id, created_at, amount_cents, currency')
        .eq('mollie_payment_id', molliePaymentId)
        .single()

      if (error || !payment) {
        console.error(`[PaymentReconciliation] Payment not found: ${molliePaymentId}`, error)
        return false
      }

      return await this.reconcilePayment(payment)
    } catch (error) {
      console.error(`[PaymentReconciliation] Error force reconciling payment ${molliePaymentId}:`, error)
      return false
    }
  }
}

export const paymentReconciliationService = new PaymentReconciliationService()
export default paymentReconciliationService