import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mollieService } from '@/lib/services/mollieService'
import { paymentLogger } from '@/lib/utils/paymentLogger'

/**
 * Handles Mollie payment redirect
 * This endpoint creates the payment record if it doesn't exist and activates it immediately
 * This solves the timing issue where payment doesn't exist in DB when redirect happens
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { paymentId, tenantId } = await request.json()

    if (!paymentId || !tenantId) {
      return NextResponse.json(
        { error: 'Payment ID and Tenant ID are required' },
        { status: 400 }
      )
    }

    console.log(`[Payment Redirect Handler] Processing payment ${paymentId} for tenant ${tenantId}`)
    
    const supabase = await createServerSupabaseClient()

    // Get payment from Mollie FIRST
    let molliePayment
    try {
      molliePayment = await mollieService.getPayment(paymentId)
      console.log(`[Payment Redirect Handler] Mollie payment status: ${molliePayment.status}`)
    } catch (error) {
      console.error('[Payment Redirect Handler] Failed to fetch from Mollie:', error)
      return NextResponse.json(
        { error: 'Failed to verify payment with Mollie' },
        { status: 500 }
      )
    }

    // Check if payment is successful in Mollie
    if (!mollieService.isPaymentSuccessful(molliePayment)) {
      console.log(`[Payment Redirect Handler] Payment not successful: ${molliePayment.status}`)
      return NextResponse.json({
        success: false,
        status: molliePayment.status,
        message: 'Payment not successful'
      })
    }

    // Payment is successful in Mollie! Now check if it exists in our DB
    const { data: existingPayment } = await supabase
      .from('subscription_payments')
      .select('*, subscriptions!inner(*)')
      .eq('mollie_payment_id', paymentId)
      .single()

    if (existingPayment) {
      console.log(`[Payment Redirect Handler] Payment exists, updating to paid`)
      
      // Update payment and subscription
      await Promise.all([
        supabase
          .from('subscription_payments')
          .update({
            status: 'paid',
            payment_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPayment.id),
        
        supabase
          .from('subscriptions')
          .update({
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPayment.subscription_id)
      ])

      return NextResponse.json({
        success: true,
        message: 'Payment activated successfully',
        paymentId: existingPayment.id,
        subscriptionId: existingPayment.subscription_id
      })
    }

    // Payment doesn't exist yet - this is the timing issue!
    console.log(`[Payment Redirect Handler] Payment doesn't exist yet, creating it`)

    // Extract metadata from Mollie payment
    const metadata = molliePayment.metadata || {}
    const planId = metadata.planId
    const subscriptionId = metadata.subscriptionId

    if (!planId) {
      console.error('[Payment Redirect Handler] No plan ID in payment metadata')
      return NextResponse.json(
        { error: 'Invalid payment metadata' },
        { status: 400 }
      )
    }

    // Get or create subscription
    let subscription
    if (subscriptionId && subscriptionId !== 'new') {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single()
      subscription = data
    }

    if (!subscription) {
      // Create new subscription
      const now = new Date()
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
      
      const { data: newSub, error: subError } = await supabase
        .from('subscriptions')
        .insert({
          tenant_id: tenantId,
          plan_id: planId,
          status: 'active', // Set to active immediately!
          current_period_start: now.toISOString(),
          current_period_end: nextMonth.toISOString(),
          mollie_customer_id: molliePayment.customerId
        })
        .select()
        .single()

      if (subError || !newSub) {
        console.error('[Payment Redirect Handler] Failed to create subscription:', subError)
        throw new Error('Failed to create subscription')
      }

      subscription = newSub
    } else {
      // Update existing subscription to active
      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id)
    }

    // Create payment record as PAID
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('subscription_payments')
      .insert({
        subscription_id: subscription.id,
        tenant_id: tenantId,
        mollie_payment_id: paymentId,
        amount_cents: molliePayment.amount ? Math.round(parseFloat(molliePayment.amount.value) * 100) : 0,
        currency: molliePayment.amount?.currency || 'EUR',
        status: 'paid', // Mark as PAID immediately!
        payment_date: new Date().toISOString(),
        period_start: subscription.current_period_start,
        period_end: subscription.current_period_end,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (paymentError || !paymentRecord) {
      console.error('[Payment Redirect Handler] Failed to create payment:', paymentError)
      throw new Error('Failed to create payment record')
    }

    const duration = Date.now() - startTime
    console.log(`[Payment Redirect Handler] Successfully handled redirect in ${duration}ms`)

    return NextResponse.json({
      success: true,
      message: 'Payment created and activated successfully',
      paymentId: paymentRecord.id,
      subscriptionId: subscription.id,
      duration: `${duration}ms`
    })

  } catch (error) {
    console.error('[Payment Redirect Handler] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to handle payment redirect',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}