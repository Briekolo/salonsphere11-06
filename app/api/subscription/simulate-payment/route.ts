import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { subscriptionService } from '@/lib/services/subscriptionService'

export async function POST(request: NextRequest) {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Payment simulation only available in development mode' },
        { status: 403 }
      )
    }

    const { planId, tenantId } = await request.json()

    if (!planId || !tenantId) {
      return NextResponse.json(
        { error: 'Plan ID and Tenant ID are required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

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

    // Verify the plan exists
    const plan = await subscriptionService.getSubscriptionPlan(planId)
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      )
    }

    // Check if tenant already has a subscription
    const existingSubscription = await subscriptionService.getTenantSubscription(tenantId)
    
    if (existingSubscription) {
      // Update existing subscription to active paid status
      const now = new Date()
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())

      const { data: updatedSubscription } = await supabase
        .from('subscriptions')
        .update({
          plan_id: planId,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: nextMonth.toISOString(),
          trial_end: null, // Remove trial status
          cancelled_at: null
        })
        .eq('id', existingSubscription.id)
        .select()
        .single()

      // Create a simulated payment record
      await supabase
        .from('subscription_payments')
        .insert({
          subscription_id: existingSubscription.id,
          amount_cents: plan.price_cents,
          currency: plan.currency,
          status: 'paid',
          payment_date: now.toISOString(),
          period_start: now.toISOString(),
          period_end: nextMonth.toISOString(),
          mollie_payment_id: `sim_payment_${Date.now()}` // Simulated payment ID
        })

      return NextResponse.json({
        success: true,
        subscription: updatedSubscription,
        message: 'Payment simulated successfully'
      })
    } else {
      // Create new active subscription
      const now = new Date()
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())

      const { data: newSubscription } = await supabase
        .from('subscriptions')
        .insert({
          tenant_id: tenantId,
          plan_id: planId,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: nextMonth.toISOString(),
          mollie_customer_id: `sim_customer_${tenantId}`, // Simulated customer ID
          mollie_subscription_id: `sim_subscription_${Date.now()}` // Simulated subscription ID
        })
        .select()
        .single()

      // Create a simulated payment record
      await supabase
        .from('subscription_payments')
        .insert({
          subscription_id: newSubscription.id,
          amount_cents: plan.price_cents,
          currency: plan.currency,
          status: 'paid',
          payment_date: now.toISOString(),
          period_start: now.toISOString(),
          period_end: nextMonth.toISOString(),
          mollie_payment_id: `sim_payment_${Date.now()}` // Simulated payment ID
        })

      return NextResponse.json({
        success: true,
        subscription: newSubscription,
        message: 'Payment simulated and subscription created successfully'
      })
    }

  } catch (error) {
    console.error('Payment simulation error:', error)
    return NextResponse.json(
      { error: 'Internal server error during payment simulation' },
      { status: 500 }
    )
  }
}