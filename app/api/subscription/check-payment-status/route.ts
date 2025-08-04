import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mollieService } from '@/lib/services/mollieService'
import { paymentLogger, PaymentLogEvent } from '@/lib/utils/paymentLogger'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { paymentId } = await request.json()

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    console.log(`[Payment Status Check] Checking payment ${paymentId}`)

    const supabase = await createServerSupabaseClient()

    // Get payment record from database
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('subscription_payments')
      .select('*, subscriptions!inner(id, tenant_id, status)')
      .eq('mollie_payment_id', paymentId)
      .single()

    if (paymentError || !paymentRecord) {
      console.error('[Payment Status Check] Payment record not found:', paymentError)
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Check if payment is already processed
    if (paymentRecord.status === 'paid') {
      console.log(`[Payment Status Check] Payment ${paymentId} already marked as paid`)
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        status: 'paid',
        subscription: (paymentRecord as any).subscriptions
      })
    }

    // Check payment status with Mollie
    const mollieStatus = await mollieService.checkPaymentStatus(paymentId)
    console.log(`[Payment Status Check] Mollie status for ${paymentId}:`, mollieStatus)

    // If payment is successful in Mollie, update our records
    if (mollieStatus.isPaid) {
      console.log(`[Payment Status Check] Payment ${paymentId} is paid in Mollie, updating database`)
      
      // Update payment record
      const { error: updatePaymentError } = await supabase
        .from('subscription_payments')
        .update({
          status: 'paid',
          payment_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentRecord!.id)

      if (updatePaymentError) {
        console.error('[Payment Status Check] Failed to update payment:', updatePaymentError)
        throw new Error('Failed to update payment status')
      }

      // Activate subscription
      const { error: updateSubError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentRecord!.subscription_id)

      if (updateSubError) {
        console.error('[Payment Status Check] Failed to activate subscription:', updateSubError)
        throw new Error('Failed to activate subscription')
      }

      // Log successful payment
      paymentLogger.reconciliationSuccess(paymentId, {
        paymentId: paymentRecord!.id,
        subscriptionId: paymentRecord!.subscription_id,
        oldStatus: paymentRecord!.status,
        newStatus: 'paid',
        duration: Date.now() - startTime
      })

      console.log(`[Payment Status Check] Successfully updated payment ${paymentId} to paid`)

      return NextResponse.json({
        success: true,
        updated: true,
        status: 'paid',
        message: 'Payment confirmed and subscription activated',
        duration: `${Date.now() - startTime}ms`
      })
    }

    // If payment failed
    if (mollieStatus.isFailed) {
      console.log(`[Payment Status Check] Payment ${paymentId} failed in Mollie`)
      
      // Update payment record
      await supabase
        .from('subscription_payments')
        .update({
          status: 'failed',
          failure_reason: 'Payment failed in Mollie',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentRecord!.id)

      // Update subscription
      await supabase
        .from('subscriptions')
        .update({
          status: 'unpaid',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentRecord!.subscription_id)

      return NextResponse.json({
        success: false,
        status: 'failed',
        message: 'Payment failed'
      })
    }

    // Payment is still pending
    console.log(`[Payment Status Check] Payment ${paymentId} still pending`)
    
    return NextResponse.json({
      success: true,
      status: mollieStatus.status,
      isPending: true,
      message: 'Payment is still being processed'
    })

  } catch (error) {
    console.error('[Payment Status Check] Error:', error)
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    )
  }
}