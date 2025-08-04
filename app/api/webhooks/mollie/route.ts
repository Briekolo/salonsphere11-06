import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mollieService } from '@/lib/services/mollieService'
import { paymentLogger } from '@/lib/utils/paymentLogger'
import { paymentReconciliationService } from '@/lib/services/paymentReconciliationService'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let paymentId: string | undefined
  
  try {
    // Verify webhook signature if secret is configured
    if (process.env.MOLLIE_WEBHOOK_SECRET) {
      const signature = request.headers.get('mollie-signature')
      if (!signature) {
        console.error('[Mollie Webhook] Missing webhook signature')
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
      }
      
      // Note: Mollie webhook signature verification would go here
      // For now, we'll just check that the header exists
      // In production, implement proper HMAC verification
      console.log('[Mollie Webhook] Webhook signature present (verification not implemented)')
    }
    // Get the payment ID from the request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error('Invalid JSON in webhook request:', error)
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    paymentId = body.id
    if (!paymentId) {
      console.error('[Mollie Webhook] No payment ID in webhook request')
      paymentLogger.webhookFailed('unknown', 'Missing payment ID in webhook request', {
        duration: Date.now() - startTime
      })
      return NextResponse.json({ error: 'Payment ID required' }, { status: 400 })
    }

    const webhookTimestamp = new Date().toISOString()
    const requestIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    
    console.log(`[Mollie Webhook] WEBHOOK RECEIVED at ${webhookTimestamp} - Processing payment ${paymentId}`)
    console.log(`[Mollie Webhook] Request IP:`, requestIp)
    
    // Log webhook receipt
    paymentLogger.webhookReceived(paymentId, {
      requestHeaders: Object.fromEntries(request.headers.entries()),
      requestBody: body,
      sourceIP: requestIp
    })

    // Get payment details from Mollie with retry
    let payment
    let mollieAttempts = 0
    const maxMollieAttempts = 3
    
    while (mollieAttempts < maxMollieAttempts) {
      try {
        payment = await mollieService.getPayment(paymentId)
        break
      } catch (error) {
        mollieAttempts++
        console.error(`[Mollie Webhook] Attempt ${mollieAttempts}/${maxMollieAttempts} failed to fetch payment from Mollie:`, error)
        
        if (mollieAttempts === maxMollieAttempts) {
          paymentLogger.webhookFailed(paymentId, error instanceof Error ? error : 'Failed to fetch payment from Mollie', {
            duration: Date.now() - startTime
          })
          return NextResponse.json({ error: 'Payment not found in Mollie' }, { status: 404 })
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * mollieAttempts))
      }
    }

    if (!payment.metadata) {
      console.error('[Mollie Webhook] Payment has no metadata')
      paymentLogger.webhookFailed(paymentId, 'Payment has no metadata', {
        duration: Date.now() - startTime
      })
      return NextResponse.json({ error: 'Invalid payment metadata' }, { status: 400 })
    }

    const { tenantId, planId, subscriptionId } = payment.metadata
    if (!tenantId || !planId) {
      console.error('[Mollie Webhook] Missing required metadata in payment')
      paymentLogger.webhookFailed(paymentId, 'Missing required metadata fields', {
        duration: Date.now() - startTime
      })
      return NextResponse.json({ error: 'Invalid metadata' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Find the subscription payment record (single attempt to prevent timeouts)
    console.log(`[Mollie Webhook] Processing webhook for payment ${paymentId} at ${webhookTimestamp}`)
    
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('subscription_payments')
      .select('*')
      .eq('mollie_payment_id', paymentId)
      .single()

    if (paymentError || !paymentRecord) {
      console.error(`[Mollie Webhook] Payment record not found for ${paymentId}:`, paymentError)
      console.log(`[Mollie Webhook] This might be a timing issue. Attempting immediate reconciliation.`)
      
      paymentLogger.webhookMissing(paymentId, {
        createdAt: new Date().toISOString(),
        expectedBy: new Date(Date.now() + 30000).toISOString()
      })
      
      // For missing payments, wait briefly then check again (timing issue)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Try one more time
      const { data: retryPaymentRecord, error: retryError } = await supabase
        .from('subscription_payments')
        .select('*')
        .eq('mollie_payment_id', paymentId)
        .single()
      
      if (retryError || !retryPaymentRecord) {
        console.log(`[Mollie Webhook] Payment still not found after retry. Creating orphaned payment record.`)
        
        // Create an orphaned payment record for later reconciliation
        const { error: createError } = await supabase
          .from('subscription_payments')
          .insert({
            tenant_id: tenantId,
            subscription_id: subscriptionId || null,
            mollie_payment_id: paymentId,
            amount_cents: payment.amount ? Math.round(parseFloat(payment.amount.value) * 100) : 0,
            currency: payment.amount?.currency || 'EUR',
            status: mollieService.getInternalPaymentStatus(payment.status),
            payment_date: mollieService.isPaymentSuccessful(payment) ? new Date().toISOString() : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        
        if (createError) {
          console.error(`[Mollie Webhook] Failed to create orphaned payment record:`, createError)
        } else {
          console.log(`[Mollie Webhook] Created orphaned payment record for ${paymentId}`)
        }
        
        // Trigger immediate reconciliation
        try {
          const reconciled = await paymentReconciliationService.forceReconcilePayment(paymentId)
          console.log(`[Mollie Webhook] Immediate reconciliation result:`, reconciled)
        } catch (reconcileError) {
          console.error(`[Mollie Webhook] Failed to reconcile payment:`, reconcileError)
        }
        
        return NextResponse.json({ 
          success: true,
          message: 'Webhook processed with orphaned payment creation',
          paymentId: paymentId,
          timestamp: webhookTimestamp,
          action: 'orphaned_payment_created'
        })
      }
      
      // Found on retry, use this record
      paymentRecord = retryPaymentRecord
      console.log(`[Mollie Webhook] Payment record found on retry: ${paymentRecord.id}`)
    }

    console.log(`[Mollie Webhook] Payment record found: ${paymentRecord.id}`)

    // Update payment status
    const internalStatus = mollieService.getInternalPaymentStatus(payment.status)
    const paymentDate = mollieService.isPaymentSuccessful(payment) ? new Date().toISOString() : null
    const failureReason = mollieService.isPaymentFailed(payment) ? payment.details?.failureReason || 'Payment failed' : null

    const { error: updateError } = await supabase
      .from('subscription_payments')
      .update({
        status: internalStatus,
        payment_date: paymentDate,
        failure_reason: failureReason,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentRecord.id)
    
    if (updateError) {
      console.error(`[Mollie Webhook] Failed to update payment status:`, updateError)
      paymentLogger.webhookFailed(paymentId, updateError, {
        paymentId: paymentRecord.id,
        duration: Date.now() - startTime
      })
      throw updateError
    }

    // If payment is successful, activate the subscription
    if (mollieService.isPaymentSuccessful(payment)) {
      console.log(`[Mollie Webhook] Payment ${paymentId} successful, activating subscription`)
      
      const { error: subUpdateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          mollie_subscription_id: payment.customerId ? `subscription_${payment.customerId}` : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentRecord.subscription_id)
      
      if (subUpdateError) {
        console.error(`[Mollie Webhook] Failed to activate subscription:`, subUpdateError)
        paymentLogger.subscriptionFailed(paymentRecord.subscription_id, subUpdateError, {
          paymentId: paymentRecord.id,
          molliePaymentId: paymentId,
          tenantId: paymentRecord.tenant_id
        })
        throw subUpdateError
      }

      console.log(`[Mollie Webhook] Subscription ${paymentRecord.subscription_id} activated`)
      
      // Log successful payment processing
      paymentLogger.webhookProcessed(paymentId, {
        paymentId: paymentRecord.id,
        subscriptionId: paymentRecord.subscription_id,
        oldStatus: paymentRecord.status,
        newStatus: 'paid',
        duration: Date.now() - startTime
      })
      
      paymentLogger.subscriptionActivated(paymentRecord.subscription_id, {
        paymentId: paymentRecord.id,
        molliePaymentId: paymentId,
        tenantId: paymentRecord.tenant_id
      })
    } 
    // If payment failed, mark subscription as unpaid
    else if (mollieService.isPaymentFailed(payment)) {
      console.log(`[Mollie Webhook] Payment ${paymentId} failed, marking subscription as unpaid`)
      
      const { error: subUpdateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'unpaid',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentRecord.subscription_id)
      
      if (subUpdateError) {
        console.error(`[Mollie Webhook] Failed to update subscription status:`, subUpdateError)
        paymentLogger.subscriptionFailed(paymentRecord.subscription_id, subUpdateError, {
          paymentId: paymentRecord.id,
          molliePaymentId: paymentId
        })
      }
      
      // Log payment failure
      paymentLogger.webhookProcessed(paymentId, {
        paymentId: paymentRecord.id,
        subscriptionId: paymentRecord.subscription_id,
        oldStatus: paymentRecord.status,
        newStatus: 'failed',
        duration: Date.now() - startTime
      })
    }

    const processingTime = Date.now() - startTime
    console.log(`[Mollie Webhook] Successfully processed payment ${paymentId} with status ${payment.status}`)
    console.log(`[Mollie Webhook] Webhook processing completed in ${processingTime}ms`)
    
    // Webhook processing already logged above

    return NextResponse.json({ 
      success: true,
      paymentId: paymentId,
      status: payment.status,
      subscriptionId: paymentRecord.subscription_id,
      processedAt: new Date().toISOString(),
      webhookReceived: webhookTimestamp,
      processingTime: `${processingTime}ms`
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const processingTime = Date.now() - startTime
    
    console.error('[Mollie Webhook] Processing error:', error)
    
    // Log webhook error
    paymentLogger.webhookFailed(paymentId || 'unknown', error instanceof Error ? error : errorMessage, {
      duration: processingTime
    })
    
    // Return error but with details for debugging
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        message: errorMessage,
        paymentId: paymentId || 'unknown',
        processingTime: `${processingTime}ms`
      },
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