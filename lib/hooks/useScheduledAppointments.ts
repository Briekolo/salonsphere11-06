'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/lib/hooks/useTenant'

export interface ScheduledAppointment {
  id: string
  scheduled_at: string
  clients: {
    first_name: string | null
    last_name: string | null
  } | null
  services: {
    name: string | null
    price: number | null
  } | null
}

export function useScheduledAppointments() {
  const { tenantId } = useTenant()

  return useQuery<ScheduledAppointment[]>({
    queryKey: ['scheduled-appointments', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      if (!tenantId) return []

      const now = new Date()
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          scheduled_at,
          clients!inner (
            first_name,
            last_name
          ),
          services!inner (
            name,
            price
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('status', 'scheduled')
        .gte('scheduled_at', now.toISOString())
        .lte('scheduled_at', endOfMonth.toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(10)

      if (error) {
        console.error('Error fetching scheduled appointments:', error)
        return []
      }

      return data || []
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  })
}