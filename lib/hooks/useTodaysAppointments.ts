'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/lib/hooks/useTenant'

export interface TodaysAppointment {
  id: string
  scheduled_at: string
  service_name: string
  client_name: string
  is_paid: boolean
}

export function useTodaysAppointments() {
  const { tenantId } = useTenant()

  return useQuery<TodaysAppointment[]>({
    queryKey: ['todays_appointments', tenantId],
    enabled: !!tenantId,
    staleTime: 30_000, // 30 seconds
    queryFn: async () => {
      if (!tenantId) return []
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          scheduled_at,
          is_paid,
          services!inner(name),
          clients!inner(first_name, last_name)
        `)
        .eq('tenant_id', tenantId)
        .gte('scheduled_at', new Date().toISOString().slice(0, 10))
        .lt('scheduled_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
        .order('scheduled_at', { ascending: true })

      if (error) {
        console.error('Error fetching todays appointments:', error)
        return []
      }

      return (data || []).map(booking => ({
        id: booking.id,
        scheduled_at: booking.scheduled_at,
        service_name: (booking.services as any)?.name || 'Onbekende service',
        client_name: `${(booking.clients as any)?.first_name || ''} ${(booking.clients as any)?.last_name || ''}`.trim() || 'Onbekende klant',
        is_paid: booking.is_paid || false
      }))
    },
  })
}

export function useTodaysAppointmentCount() {
  const { tenantId } = useTenant()

  return useQuery<number>({
    queryKey: ['todays_appointment_count', tenantId],
    enabled: !!tenantId,
    staleTime: 30_000,
    queryFn: async () => {
      if (!tenantId) return 0
      
      const { count, error } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('scheduled_at', new Date().toISOString().slice(0, 10))
        .lt('scheduled_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10))

      if (error) {
        console.error('Error fetching todays appointment count:', error)
        return 0
      }

      return count || 0
    },
  })
}