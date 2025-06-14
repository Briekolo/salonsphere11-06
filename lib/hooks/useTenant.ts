'use client'

import { useAuth } from '@/components/auth/AuthProvider'

export function useTenant() {
  const { user, loading } = useAuth()
  // @ts-ignore  metadata type
  const tenantId: string | null = user?.user_metadata?.tenant_id ?? null
  return { tenantId, loading }
} 