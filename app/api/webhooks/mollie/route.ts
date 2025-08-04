import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mollieService } from '@/lib/services/mollieService'

export async function POST(request: NextRequest) {
  try {
    // Get the payment ID from the request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error('Invalid JSON in webhook request:', error)
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const paymentId = body.id
    if (!paymentId) {
      console.error('No payment ID in webhook request')
      return NextResponse.json({ error: 'Payment ID required' }, { status: 400 })
    }

    console.log(`[Mollie Webhook] Processing payment ${paymentId}`)

    // Get payment details from Mollie
    let payment
    try {
      payment = await mollieService.getPayment(paymentId)
    } catch (error) {
      console.error('Failed to fetch payment from Mollie:', error)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (!payment.metadata) {
      console.error('Payment has no metadata')
      return NextResponse.json({ error: 'Invalid payment metadata' }, { status: 400 })
    }

    const { tenantId, planId, subscriptionId } = payment.metadata
    if (!tenantId || !planId) {
      console.error('Missing required metadata in payment')
      return NextResponse.json({ error: 'Invalid metadata' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Find the subscription payment record with retry logic for race conditions
    let paymentRecord = null
    let attempts = 0
    const maxAttempts = 3
    const baseDelay = 1000 // 1 second

    while (attempts < maxAttempts && !paymentRecord) {
      attempts++
      console.log(`[Mollie Webhook] Attempt ${attempts}/${maxAttempts} to find payment record for ${paymentId}`)
      
      const { data, error } = await supabase
        .from('subscription_payments')
        .select('*')
        .eq('mollie_payment_id', paymentId)
        .single()

      if (data && !error) {
        paymentRecord = data
        console.log(`[Mollie Webhook] Payment record found on attempt ${attempts}`)
        break
      }

      if (attempts < maxAttempts) {
        const delay = baseDelay * Math.pow(2, attempts - 1) // Exponential backoff: 1s, 2s, 4s
        console.log(`[Mollie Webhook] Payment record not found, retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        console.error(`[Mollie Webhook] Payment record not found after ${maxAttempts} attempts:`, error)
      }
    }

    if (!paymentRecord) {
      console.error(`[Mollie Webhook] Failed to find payment record for ${paymentId} after ${maxAttempts} attempts`)
      return NextResponse.json({ error: 'Payment record not found after retries' }, { status: 404 })
    }

    // Update payment status
    const internalStatus = mollieService.getInternalPaymentStatus(payment.status)
    const paymentDate = mollieService.isPaymentSuccessful(payment) ? new Date().toISOString() : null

    await supabase
      .from('subscription_payments')
      .update({
        status: internalStatus,
        payment_date: paymentDate,
        failure_reason: mollieService.isPaymentFailed(payment) ? payment.details?.failureReason || 'Payment failed' : null
      })
      .eq('id', paymentRecord.id)

    // If payment is successful, activate the subscription
    if (mollieService.isPaymentSuccessful(payment)) {
      console.log(`[Mollie Webhook] Payment ${paymentId} successful, activating subscription`)
      
      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          mollie_subscription_id: payment.customerId ? `subscription_${payment.customerId}` : null
        })
        .eq('id', paymentRecord.subscription_id)

      console.log(`[Mollie Webhook] Subscription ${paymentRecord.subscription_id} activated`)
    } 
    // If payment failed, mark subscription as unpaid
    else if (mollieService.isPaymentFailed(payment)) {
      console.log(`[Mollie Webhook] Payment ${paymentId} failed, marking subscription as unpaid`)
      
      await supabase
        .from('subscriptions')
        .update({
          status: 'unpaid'
        })
        .eq('id', paymentRecord.subscription_id)
    }

    console.log(`[Mollie Webhook] Successfully processed payment ${paymentId} with status ${payment.status}`)

    return NextResponse.json({ 
      success: true,
      paymentId: paymentId,
      status: payment.status,
      subscriptionId: paymentRecord.subscription_id
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Allow only POST requests
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}