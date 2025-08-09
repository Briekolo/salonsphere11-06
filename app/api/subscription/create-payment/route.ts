import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { subscriptionServiceServer } from '@/lib/services/subscriptionService.server'
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
    const plan = await subscriptionServiceServer.getSubscriptionPlan(planId)
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      )
    }

    // Check if tenant already has a subscription
    let subscription = await subscriptionServiceServer.getTenantSubscription(tenantId)
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
      
      // First create the payment without payment ID in redirect URL
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
      
      // Now we have the payment ID, update the redirect URL
      // Note: We'll handle the payment ID extraction from Mollie's redirect instead
      console.log(`[Payment Creation] Payment created with ID: ${payment.id}`)

      // Create or update subscription record
      if (subscription) {
        // Update existing subscription
        subscription = await subscriptionServiceServer.updateSubscriptionWithPayment(
          subscription.id,
          planId,
          mollieCustomerId
        )
      } else {
        // Create new subscription
        subscription = await subscriptionServiceServer.createSubscription(
          tenantId,
          planId,
          mollieCustomerId
        )
      }

      // Ensure subscription exists before creating payment record
      if (!subscription) {
        throw new Error('Subscription creation failed - no subscription object available')
      }

      // Create payment record and ensure it's committed
      const paymentRecordData = await subscriptionServiceServer.createPaymentRecord(
        subscription.id,
        plan.price_cents,
        plan.currency,
        payment.id
      )

      const now = new Date()
      console.log(`[Payment Creation] Payment record created with ID: ${paymentRecordData.id} for Mollie payment: ${payment.id}`)
      console.log(`[Payment Creation] Payment tracking started at ${now.toISOString()} - will check for webhook delivery`)

      // Get the checkout URL from Mollie
      const checkoutUrl = payment.getCheckoutUrl()

      // Schedule a fallback reconciliation check after 30 seconds if webhook doesn't arrive
      const fallbackDelayMs = 30 * 1000 // 30 seconds
      console.log(`[Payment Creation] Fallback reconciliation will trigger in ${fallbackDelayMs}ms if webhook not received`)

      return NextResponse.json({
        success: true,
        paymentUrl: checkoutUrl || payment.getCheckoutUrl(),
        paymentId: payment.id,
        subscription: subscription,
        paymentRecordId: paymentRecordData.id,
        webhookTimeout: fallbackDelayMs,
        createdAt: now.toISOString(),
        message: 'Payment created successfully with immediate status checking on redirect'
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