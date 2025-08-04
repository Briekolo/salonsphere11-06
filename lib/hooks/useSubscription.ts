'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTenant } from './useTenant'
import { subscriptionService, SubscriptionPlan, SubscriptionStatus, SubscriptionWithPlan } from '@/lib/services/subscriptionService'

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptionService.getSubscriptionPlans(),
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  })
}

export function useSubscriptionPlan(planId: string | undefined) {
  return useQuery({
    queryKey: ['subscription-plan', planId],
    queryFn: () => planId ? subscriptionService.getSubscriptionPlan(planId) : null,
    enabled: !!planId,
    staleTime: 1000 * 60 * 30,
  })
}

export function useSubscription() {
  const { tenantId, loading: tenantLoading } = useTenant()
  const queryClient = useQueryClient()
  
  // Check if tenant has active subscription
  const { data: hasActiveSubscription, isLoading: checkingSubscription } = useQuery({
    queryKey: ['subscription-active', tenantId],
    queryFn: () => tenantId ? subscriptionService.hasActiveSubscription(tenantId) : false,
    enabled: !!tenantId && !tenantLoading,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })
  
  // Get subscription status details
  const { data: subscriptionStatus, isLoading: loadingStatus } = useQuery({
    queryKey: ['subscription-status', tenantId],
    queryFn: () => tenantId ? subscriptionService.getSubscriptionStatus(tenantId) : null,
    enabled: !!tenantId && !tenantLoading,
    staleTime: 1000 * 60 * 5,
  })
  
  // Get full subscription details
  const { data: subscription, isLoading: loadingSubscription } = useQuery({
    queryKey: ['subscription-details', tenantId],
    queryFn: () => tenantId ? subscriptionService.getTenantSubscription(tenantId) : null,
    enabled: !!tenantId && !tenantLoading,
    staleTime: 1000 * 60 * 5,
  })
  
  // Create trial subscription mutation
  const createTrialMutation = useMutation({
    mutationFn: (planId?: string) => {
      if (!tenantId) throw new Error('No tenant ID available')
      return subscriptionService.createTrialSubscription(tenantId, planId)
    },
    onSuccess: () => {
      // Invalidate all subscription queries
      queryClient.invalidateQueries({ queryKey: ['subscription-active', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['subscription-status', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['subscription-details', tenantId] })
    },
  })
  
  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: (subscriptionId: string) => subscriptionService.cancelSubscription(subscriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-active', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['subscription-status', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['subscription-details', tenantId] })
    },
  })

  // Simulate payment mutation (dev mode only)
  const simulatePaymentMutation = useMutation({
    mutationFn: (planId: string) => {
      if (!tenantId) throw new Error('No tenant ID available')
      return subscriptionService.simulatePayment(tenantId, planId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-active', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['subscription-status', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['subscription-details', tenantId] })
    },
  })

  // Create real payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (planId: string) => {
      if (!tenantId) throw new Error('No tenant ID available')
      
      const response = await fetch('/api/subscription/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId, tenantId })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create payment')
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      // Redirect to Mollie payment page
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      }
    },
  })
  
  const loading = tenantLoading || checkingSubscription || loadingStatus || loadingSubscription
  
  return {
    // Subscription state
    hasActiveSubscription: hasActiveSubscription || false,
    subscriptionStatus,
    subscription,
    loading,
    
    // Mutations
    createTrial: createTrialMutation.mutate,
    createTrialAsync: createTrialMutation.mutateAsync,
    isCreatingTrial: createTrialMutation.isPending,
    
    cancelSubscription: cancelSubscriptionMutation.mutate,
    cancelSubscriptionAsync: cancelSubscriptionMutation.mutateAsync,
    isCancelling: cancelSubscriptionMutation.isPending,
    
    simulatePayment: simulatePaymentMutation.mutate,
    simulatePaymentAsync: simulatePaymentMutation.mutateAsync,
    isSimulatingPayment: simulatePaymentMutation.isPending,
    
    createPayment: createPaymentMutation.mutate,
    createPaymentAsync: createPaymentMutation.mutateAsync,
    isCreatingPayment: createPaymentMutation.isPending,
    
    // Helper functions
    isFeatureAvailable: (feature: string) => subscriptionService.isFeatureAvailable(subscriptionStatus, feature),
    getFeatureLimit: (feature: string) => subscriptionService.getFeatureLimit(subscriptionStatus, feature),
    isUnlimited: (feature: string) => subscriptionService.isUnlimited(subscriptionStatus, feature),
    isExpiringSoon: (daysAhead = 7) => subscriptionService.isExpiringSoon(subscriptionStatus, daysAhead),
    
    // Status checks
    isActive: subscriptionStatus?.status === 'active',
    isTrial: subscriptionStatus?.status === 'trial',
    isCancelled: subscriptionStatus?.status === 'cancelled',
    isExpired: subscriptionStatus?.status === 'expired',
    isPastDue: subscriptionStatus?.status === 'past_due',
    
    // Tenant context
    tenantId,
  }
}

// Hook specifically for checking subscription requirements
export function useSubscriptionGuard() {
  const { hasActiveSubscription, loading, tenantId } = useSubscription()
  
  return {
    hasAccess: hasActiveSubscription,
    needsSubscription: !loading && !hasActiveSubscription && !!tenantId,
    loading,
    tenantId,
  }
}