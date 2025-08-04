'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { SubscriptionStatus } from '@/lib/services/subscriptionService'

interface SubscriptionContextType {
  hasActiveSubscription: boolean
  subscriptionStatus: SubscriptionStatus | null
  loading: boolean
  isFeatureAvailable: (feature: string) => boolean
  getFeatureLimit: (feature: string) => number
  isExpiringSoon: (daysAhead?: number) => boolean
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const subscriptionData = useSubscription()

  const contextValue: SubscriptionContextType = {
    hasActiveSubscription: subscriptionData.hasActiveSubscription,
    subscriptionStatus: subscriptionData.subscriptionStatus,
    loading: subscriptionData.loading,
    isFeatureAvailable: subscriptionData.isFeatureAvailable,
    getFeatureLimit: subscriptionData.getFeatureLimit,
    isExpiringSoon: subscriptionData.isExpiringSoon,
  }

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider')
  }
  return context
}