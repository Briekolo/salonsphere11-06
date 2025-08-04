import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mollieService } from '@/lib/services/mollieService'
import { paymentLogger } from '@/lib/utils/paymentLogger'

/**
 * Immediate payment activation endpoint
 * This activates payments immediately when called, without waiting for webhooks
 * Used after successful Mollie redirect to ensure instant activation
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { paymentId, forceActivate = false } = await request.json()

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    console.log(`[Payment Activation] Starting immediate activation for ${paymentId}`)
    paymentLogger.statusCheckRequest(paymentId, {
      source: 'activate-payment',
      forceActivate
    })

    const supabase = await createServerSupabaseClient()

    // Get payment record with subscription details
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('subscription_payments')
      .select('*, subscriptions!inner(*)')
      .eq('mollie_payment_id', paymentId)
      .single()

    if (paymentError || !paymentRecord) {
      console.error('[Payment Activation] Payment not found:', paymentError)
      
      // If payment not found, it might be a timing issue
      // Wait 2 seconds and try again
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const { data: retryPaymentRecord, error: retryError } = await supabase
        .from('subscription_payments')
        .select('*, subscriptions!inner(*)')
        .eq('mollie_payment_id', paymentId)
        .single()
      
      if (retryError || !retryPaymentRecord) {
        return NextResponse.json(
          { error: 'Payment not found after retry' },
          { status: 404 }
        )
      }
      
      paymentRecord = retryPaymentRecord
    }

    // Check if already activated
    if (paymentRecord.status === 'paid' && (paymentRecord as any).subscriptions.status === 'active') {
      console.log(`[Payment Activation] Already activated: ${paymentId}`)
      return NextResponse.json({
        success: true,
        alreadyActivated: true,
        message: 'Payment already activated',
        subscription: (paymentRecord as any).subscriptions
      })
    }

    // Get Mollie payment status
    let molliePayment
    try {
      molliePayment = await mollieService.getPayment(paymentId)
      console.log(`[Payment Activation] Mollie status: ${molliePayment.status}`)
    } catch (error) {
      console.error('[Payment Activation] Failed to fetch from Mollie:', error)
      
      // If forceActivate is true and payment is pending, activate anyway
      if (forceActivate && paymentRecord.status === 'pending') {
        console.log('[Payment Activation] Force activating pending payment')
      } else {
        return NextResponse.json(
          { error: 'Failed to verify payment with Mollie' },
          { status: 500 }
        )
      }
    }

    // Check if payment is successful in Mollie OR force activate
    const shouldActivate = forceActivate || (molliePayment && mollieService.isPaymentSuccessful(molliePayment))
    
    if (!shouldActivate) {
      console.log(`[Payment Activation] Payment not successful in Mollie: ${molliePayment?.status}`)
      return NextResponse.json({
        success: false,
        status: molliePayment?.status || 'unknown',
        message: 'Payment not yet successful'
      })
    }

    // ACTIVATE IMMEDIATELY - Don't wait for anything
    console.log('[Payment Activation] Activating payment and subscription NOW')

    // Start transaction to update both payment and subscription
    const updates = []

    // Update payment to paid
    updates.push(
      supabase
        .from('subscription_payments')
        .update({
          status: 'paid',
          payment_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentRecord.id)
    )

    // Activate subscription
    updates.push(
      supabase
        .from('subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentRecord.subscription_id)
    )

    // Execute updates in parallel
    const results = await Promise.all(updates)
    
    // Check for errors
    const updateErrors = results.filter(r => r.error)
    if (updateErrors.length > 0) {
      console.error('[Payment Activation] Update errors:', updateErrors)
      throw new Error('Failed to activate payment/subscription')
    }

    // Log successful activation
    const duration = Date.now() - startTime
    paymentLogger.statusCheckSuccess(paymentId, {
      previousPaymentStatus: paymentRecord.status,
      previousSubscriptionStatus: (paymentRecord as any).subscriptions.status,
      newStatus: 'active',
      duration,
      forceActivated: forceActivate
    })

    console.log(`[Payment Activation] Successfully activated in ${duration}ms`)

    // Get updated subscription for response
    const { data: updatedSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', paymentRecord.subscription_id)
      .single()

    return NextResponse.json({
      success: true,
      activated: true,
      message: 'Payment and subscription activated successfully',
      payment: {
        id: paymentRecord.id,
        status: 'paid',
        mollieStatus: molliePayment?.status || 'force-activated'
      },
      subscription: updatedSubscription,
      duration: `${duration}ms`
    })

  } catch (error) {
    console.error('[Payment Activation] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to activate payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Support GET for easy testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const paymentId = searchParams.get('paymentId')
  const forceActivate = searchParams.get('force') === 'true'

  if (!paymentId) {
    return NextResponse.json({
      error: 'Missing paymentId parameter',
      usage: 'GET /api/subscription/activate-payment?paymentId=tr_xxx&force=true'
    }, { status: 400 })
  }

  return POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ paymentId, forceActivate })
  }))
}