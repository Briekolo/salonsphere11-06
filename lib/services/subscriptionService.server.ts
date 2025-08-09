import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export interface SubscriptionPlan {
  id: string
  name: string
  description: string | null
  price_cents: number
  currency: string
  billing_interval: 'monthly' | 'yearly'
  features: Record<string, any>
  is_active: boolean
}

export interface Subscription {
  id: string
  tenant_id: string
  plan_id: string
  status: 'active' | 'cancelled' | 'expired' | 'trial' | 'past_due' | 'unpaid'
  current_period_start: string
  current_period_end: string
  trial_end: string | null
  cancelled_at: string | null
  mollie_subscription_id: string | null
  mollie_customer_id: string | null
  created_at: string
  updated_at: string
}

export interface SubscriptionWithPlan extends Subscription {
  plan: SubscriptionPlan
}

export interface SubscriptionStatus {
  subscription_id: string | null
  plan_name: string | null
  status: string | null
  current_period_start: string | null
  current_period_end: string | null
  trial_end: string | null
  features: Record<string, any> | null
}

class SubscriptionServiceServer {
  private getSupabaseAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }
    
    return createClient<Database>(
      supabaseUrl,
      supabaseServiceKey,
      { auth: { persistSession: false } }
    )
  }

  /**
   * Get all available subscription plans
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const supabase = this.getSupabaseAdmin()
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_cents', { ascending: true })
    
    if (error) {
      throw new Error(`Failed to fetch subscription plans: ${error.message}`)
    }
    
    return data || []
  }

  /**
   * Get subscription plan by ID
   */
  async getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | null> {
    const supabase = this.getSupabaseAdmin()
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null // Plan not found
      }
      throw new Error(`Failed to fetch subscription plan: ${error.message}`)
    }
    
    return data
  }

  /**
   * Check if a tenant has an active subscription
   */
  async hasActiveSubscription(tenantId: string): Promise<boolean> {
    const supabase = this.getSupabaseAdmin()
    const { data, error } = await supabase
      .rpc('has_active_subscription', { tenant_uuid: tenantId })
    
    if (error) {
      console.error('Error checking subscription status:', error)
      return false // Default to no access on error
    }
    
    return data || false
  }

  /**
   * Get subscription status for a tenant
   */
  async getSubscriptionStatus(tenantId: string): Promise<SubscriptionStatus | null> {
    const supabase = this.getSupabaseAdmin()
    const { data, error } = await supabase
      .rpc('get_subscription_status', { tenant_uuid: tenantId })
    
    if (error) {
      console.error('Error fetching subscription status:', error)
      return null
    }
    
    if (!data || data.length === 0) {
      return null
    }
    
    return data[0]
  }

  /**
   * Get subscription details for a tenant
   */
  async getTenantSubscription(tenantId: string): Promise<SubscriptionWithPlan | null> {
    const supabase = this.getSupabaseAdmin()
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('tenant_id', tenantId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null // No subscription found
      }
      throw new Error(`Failed to fetch subscription: ${error.message}`)
    }
    
    return data as SubscriptionWithPlan
  }

  /**
   * Create a trial subscription for a new tenant
   * This provides 14 days free access to test the platform
   */
  async createTrialSubscription(tenantId: string, planId?: string): Promise<Subscription> {
    const supabase = this.getSupabaseAdmin()
    // Use the Starter plan by default for trials
    let selectedPlanId = planId
    
    if (!selectedPlanId) {
      const plans = await this.getSubscriptionPlans()
      const starterPlan = plans.find(p => p.name === 'Starter')
      if (!starterPlan) {
        throw new Error('No starter plan available for trial')
      }
      selectedPlanId = starterPlan.id
    }

    const now = new Date()
    const trialEnd = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000)) // 14 days

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        tenant_id: tenantId,
        plan_id: selectedPlanId,
        status: 'trial',
        current_period_start: now.toISOString(),
        current_period_end: trialEnd.toISOString(),
        trial_end: trialEnd.toISOString()
      })
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to create trial subscription: ${error.message}`)
    }
    
    return data
  }

  /**
   * Update subscription status (for webhook processing)
   */
  async updateSubscriptionStatus(
    subscriptionId: string, 
    status: Subscription['status'],
    metadata?: Partial<Pick<Subscription, 'mollie_subscription_id' | 'mollie_customer_id' | 'current_period_end' | 'cancelled_at'>>
  ): Promise<Subscription> {
    const supabase = this.getSupabaseAdmin()
    const updateData: any = { status }
    
    if (metadata) {
      Object.assign(updateData, metadata)
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscriptionId)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to update subscription: ${error.message}`)
    }
    
    return data
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<Subscription> {
    const supabase = this.getSupabaseAdmin()
    const { data, error } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to cancel subscription: ${error.message}`)
    }
    
    return data
  }

  /**
   * Check if a feature is available for a subscription
   */
  isFeatureAvailable(subscriptionStatus: SubscriptionStatus | null, feature: string): boolean {
    if (!subscriptionStatus || !subscriptionStatus.features) {
      return false
    }
    
    return subscriptionStatus.features[feature] === true || subscriptionStatus.features[feature] === -1
  }

  /**
   * Get feature limit for a subscription
   */
  getFeatureLimit(subscriptionStatus: SubscriptionStatus | null, feature: string): number {
    if (!subscriptionStatus || !subscriptionStatus.features) {
      return 0
    }
    
    const limit = subscriptionStatus.features[feature]
    return typeof limit === 'number' ? limit : 0
  }

  /**
   * Check if subscription allows unlimited usage for a feature
   */
  isUnlimited(subscriptionStatus: SubscriptionStatus | null, feature: string): boolean {
    if (!subscriptionStatus || !subscriptionStatus.features) {
      return false
    }
    
    return subscriptionStatus.features[feature] === -1
  }

  /**
   * Format price for display
   */
  formatPrice(priceCents: number, currency: string = 'EUR'): string {
    const price = priceCents / 100
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: currency
    }).format(price)
  }

  /**
   * Check if subscription is expired or will expire soon
   */
  isExpiringSoon(subscriptionStatus: SubscriptionStatus | null, daysAhead: number = 7): boolean {
    if (!subscriptionStatus || !subscriptionStatus.current_period_end) {
      return false
    }
    
    const expirationDate = new Date(subscriptionStatus.current_period_end)
    const checkDate = new Date()
    checkDate.setDate(checkDate.getDate() + daysAhead)
    
    return expirationDate <= checkDate
  }

  /**
   * Create subscription record
   */
  async createSubscription(
    tenantId: string,
    planId: string,
    mollieCustomerId: string
  ): Promise<Subscription> {
    const supabase = this.getSupabaseAdmin()
    const now = new Date()
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())

    const { data, error } = await supabase
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

    if (error) {
      throw new Error(`Failed to create subscription: ${error.message}`)
    }

    return data
  }

  /**
   * Update subscription with payment details
   */
  async updateSubscriptionWithPayment(
    subscriptionId: string,
    planId: string,
    mollieCustomerId: string
  ): Promise<Subscription> {
    const supabase = this.getSupabaseAdmin()
    const now = new Date()
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())

    const { data, error } = await supabase
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
      .eq('id', subscriptionId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update subscription: ${error.message}`)
    }

    return data
  }

  /**
   * Create payment record for subscription
   */
  async createPaymentRecord(
    subscriptionId: string,
    planPriceCents: number,
    currency: string,
    molliePaymentId: string
  ): Promise<any> {
    const supabase = this.getSupabaseAdmin()
    const now = new Date()
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())

    const { data, error } = await supabase
      .from('subscription_payments')
      .insert({
        subscription_id: subscriptionId,
        amount_cents: planPriceCents,
        currency: currency,
        status: 'pending',
        mollie_payment_id: molliePaymentId,
        period_start: now.toISOString(),
        period_end: nextMonth.toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create payment record: ${error.message}`)
    }

    return data
  }
}

export const subscriptionServiceServer = new SubscriptionServiceServer()
export default subscriptionServiceServer