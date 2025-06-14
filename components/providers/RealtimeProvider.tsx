'use client'
import { ReactNode } from 'react'
import { useTenantRealtime } from '@/lib/hooks/useTenantRealtime'

export default function RealtimeProvider({ children }: { children: ReactNode }) {
  useTenantRealtime()
  return <>{children}</>
} 