import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mollieService } from '@/lib/services/mollieService'

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await request.json()

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Verify user has access to this tenant
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', session.user.id)
      .single()

    if (!userData || userData.tenant_id !== tenantId) {
      return NextResponse.json(
        { error: 'Access denied to this tenant' },
        { status: 403 }
      )
    }

    console.log(`[Payment Sync] Checking payment status for tenant ${tenantId}`)

    // Find pending payments for this tenant
    const { data: pendingPayments, error: paymentsError } = await supabase
      .from('subscription_payments')
      .select(`
        *,
        subscriptions!inner(
          id,
          tenant_id,
          status
        )
      `)
      .eq('subscriptions.tenant_id', tenantId)
      .eq('status', 'pending')

    if (paymentsError) {
      console.error('Error fetching pending payments:', paymentsError)
      return NextResponse.json(
        { error: 'Failed to fetch payments' },
        { status: 500 }
      )
    }

    if (!pendingPayments || pendingPayments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending payments found',
        syncedPayments: 0
      })
    }

    console.log(`[Payment Sync] Found ${pendingPayments.length} pending payments`)

    let syncedCount = 0
    let activatedSubscriptions = 0

    // Check each pending payment with Mollie
    for (const payment of pendingPayments) {
      try {
        console.log(`[Payment Sync] Checking Mollie status for payment ${payment.mollie_payment_id}`)
        
        const molliePayment = await mollieService.getPayment(payment.mollie_payment_id)
        const isSuccessful = mollieService.isPaymentSuccessful(molliePayment)
        const isFailed = mollieService.isPaymentFailed(molliePayment)

        if (isSuccessful) {
          console.log(`[Payment Sync] Payment ${payment.mollie_payment_id} is successful, updating records`)
          
          // Update payment record
          await supabase
            .from('subscription_payments')
            .update({
              status: 'paid',
              payment_date: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', payment.id)

          // Update subscription to active
          await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('id', payment.subscription_id)

          syncedCount++
          activatedSubscriptions++

        } else if (isFailed) {
          console.log(`[Payment Sync] Payment ${payment.mollie_payment_id} failed, updating record`)
          
          // Update payment record as failed
          await supabase
            .from('subscription_payments')
            .update({
              status: 'failed',
              failure_reason: 'Payment failed in Mollie',
              updated_at: new Date().toISOString()
            })
            .eq('id', payment.id)

          syncedCount++
        }
        // If still pending in Mollie, leave as is

      } catch (error) {
        console.error(`[Payment Sync] Error checking payment ${payment.mollie_payment_id}:`, error)
        // Continue with other payments
      }
    }

    console.log(`[Payment Sync] Completed: ${syncedCount} payments synced, ${activatedSubscriptions} subscriptions activated`)

    return NextResponse.json({
      success: true,
      message: `Payment status sync completed`,
      syncedPayments: syncedCount,
      activatedSubscriptions: activatedSubscriptions
    })

  } catch (error) {
    console.error('Payment sync error:', error)
    return NextResponse.json(
      { error: 'Internal server error during payment sync' },
      { status: 500 }
    )
  }
}