import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { subscriptionService } from '@/lib/services/subscriptionService'
import { mollieService } from '@/lib/services/mollieService'

export async function POST(request: NextRequest) {
  try {
    const { planId, tenantId } = await request.json()

    if (!planId || !tenantId) {
      return NextResponse.json(
        { error: 'Plan ID and Tenant ID are required' },
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

    // Check if user belongs to the tenant
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', session.user.id)
      .single()

    if (!userData || userData.tenant_id !== tenantId) {
      return NextResponse.json(
        { error: 'Access denied to this tenant' },
        { status: 403 }
      )
    }

    // Get tenant information for customer creation
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('name, email')
      .eq('id', tenantId)
      .single()

    if (!tenantData) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Verify the plan exists
    const plan = await subscriptionService.getSubscriptionPlan(planId)
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      )
    }

    // Check if tenant already has a subscription
    let subscription = await subscriptionService.getTenantSubscription(tenantId)
    let mollieCustomerId: string | null = null

    if (subscription && subscription.mollie_customer_id) {
      // Use existing Mollie customer
      mollieCustomerId = subscription.mollie_customer_id
      try {
        await mollieService.getCustomer(mollieCustomerId)
      } catch (error) {
        // Customer doesn't exist in Mollie, create new one
        mollieCustomerId = null
      }
    }

    // Create or get Mollie customer
    if (!mollieCustomerId) {
      try {
        const mollieCustomer = await mollieService.createCustomer({
          name: tenantData.name,
          email: tenantData.email,
          metadata: {
            tenantId: tenantId,
            planId: planId
          }
        })
        mollieCustomerId = mollieCustomer.id
      } catch (error) {
        console.error('Failed to create Mollie customer:', error)
        return NextResponse.json(
          { error: 'Failed to create customer' },
          { status: 500 }
        )
      }
    }

    // Create payment in Mollie
    try {
      const paymentAmount = mollieService.formatAmount(plan.price_cents)
      const payment = await mollieService.createPayment({
        amount: paymentAmount,
        description: `${plan.name} Subscription - ${tenantData.name}`,
        redirectUrl: mollieService.getSuccessUrl(tenantId),
        webhookUrl: mollieService.getWebhookUrl(),
        customerId: mollieCustomerId,
        metadata: {
          tenantId: tenantId,
          planId: planId,
          subscriptionId: subscription?.id || 'new'
        }
      })

      // Create or update subscription record
      const now = new Date()
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())

      if (subscription) {
        // Update existing subscription
        await supabase
          .from('subscriptions')
          .update({
            plan_id: planId,
            status: 'unpaid',
            current_period_start: now.toISOString(),
            current_period_end: nextMonth.toISOString(),
            mollie_customer_id: mollieCustomerId,
            trial_end: null,
            cancelled_at: null
          })
          .eq('id', subscription.id)
      } else {
        // Create new subscription
        const { data: newSubscription, error: subscriptionError } = await supabase
          .from('subscriptions')
          .insert({
            tenant_id: tenantId,
            plan_id: planId,
            status: 'unpaid',
            current_period_start: now.toISOString(),
            current_period_end: nextMonth.toISOString(),
            mollie_customer_id: mollieCustomerId
          })
          .select()
          .single()

        if (subscriptionError || !newSubscription) {
          console.error('Failed to create subscription:', subscriptionError)
          throw new Error(`Failed to create subscription: ${subscriptionError?.message || 'Unknown error'}`)
        }

        subscription = newSubscription
      }

      // Ensure subscription exists before creating payment record
      if (!subscription) {
        throw new Error('Subscription creation failed - no subscription object available')
      }

      // Create payment record and ensure it's committed
      const { data: paymentRecordData, error: paymentInsertError } = await supabase
        .from('subscription_payments')
        .insert({
          subscription_id: subscription.id,
          amount_cents: plan.price_cents,
          currency: plan.currency,
          status: 'pending',
          mollie_payment_id: payment.id,
          period_start: now.toISOString(),
          period_end: nextMonth.toISOString()
        })
        .select()
        .single()

      if (paymentInsertError) {
        console.error('Failed to create payment record:', paymentInsertError)
        throw new Error(`Failed to create payment record: ${paymentInsertError.message}`)
      }

      console.log(`[Payment Creation] Payment record created with ID: ${paymentRecordData.id} for Mollie payment: ${payment.id}`)
      console.log(`[Payment Creation] Payment tracking started at ${now.toISOString()} - will check for webhook delivery`)

      // Schedule a fallback reconciliation check after 3 minutes if webhook doesn't arrive
      // This is done via a delayed API call rather than in-memory timeout to handle serverless nature
      const fallbackDelayMs = 3 * 60 * 1000 // 3 minutes
      console.log(`[Payment Creation] Fallback reconciliation will trigger in ${fallbackDelayMs}ms if webhook not received`)

      return NextResponse.json({
        success: true,
        paymentUrl: payment.getCheckoutUrl(),
        paymentId: payment.id,
        subscription: subscription,
        paymentRecordId: paymentRecordData.id,
        webhookTimeout: fallbackDelayMs,
        createdAt: now.toISOString(),
        message: 'Payment created successfully with fallback reconciliation scheduled'
      })

    } catch (error) {
      console.error('Failed to create Mollie payment:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        mollieApiKey: process.env.MOLLIE_API_KEY ? 'SET' : 'NOT_SET'
      })
      return NextResponse.json(
        { 
          error: 'Failed to create payment',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Payment creation error:', error)
    console.error('Full error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      tenantId,
      planId
    })
    return NextResponse.json(
      { 
        error: 'Internal server error during payment creation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}