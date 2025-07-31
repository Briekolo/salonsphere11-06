'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/lib/hooks/useTenant'
import { startOfMonth, endOfMonth, subDays } from 'date-fns'

export interface TenantMetrics {
  revenue_last30: number
  appointments_last30: number
  new_clients_last30: number
  low_stock_items: number
  avg_spend_per_client: number
  expected_revenue_current_month: number
  avg_transaction_value: number
}

export function useTenantMetrics() {
  const { tenantId } = useTenant()

  return useQuery<TenantMetrics | null>({
    queryKey: ['tenant_metrics', tenantId],
    enabled: !!tenantId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!tenantId) return null
      
      // Try RPC first
      let { data, error } = await supabase
        .rpc('tenant_metrics', { _tenant: tenantId })
        .maybeSingle()

      // If RPC fails, calculate metrics directly
      if (error) {
        const now = new Date()
        const thirtyDaysAgo = subDays(now, 30)
        const monthStart = startOfMonth(now)
        const monthEnd = endOfMonth(now)

        // Fetch revenue from paid bookings last 30 days
        const { data: revenueData } = await supabase
          .from('bookings')
          .select('services:service_id(price)')
          .eq('tenant_id', tenantId)
          .eq('is_paid', true)
          .gte('scheduled_at', thirtyDaysAgo.toISOString())
          
        const revenue_last30 = revenueData?.reduce((sum, booking) => 
          sum + (booking.services?.price || 0), 0) || 0

        // Count appointments last 30 days
        const { count: appointments_last30 } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .gte('scheduled_at', thirtyDaysAgo.toISOString())

        // Count new clients last 30 days
        const { count: new_clients_last30 } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .gte('created_at', thirtyDaysAgo.toISOString())

        // Count low stock items
        const { data: inventoryItems } = await supabase
          .from('inventory_items')
          .select('current_stock, min_stock')
          .eq('tenant_id', tenantId)
        
        const low_stock_items = inventoryItems?.filter(item => 
          item.current_stock <= item.min_stock
        ).length || 0

        // Expected revenue current month from unpaid bookings
        const { data: expectedData } = await supabase
          .from('bookings')
          .select('services:service_id(price)')
          .eq('tenant_id', tenantId)
          .eq('is_paid', false)
          .gte('scheduled_at', monthStart.toISOString())
          .lte('scheduled_at', monthEnd.toISOString())
          
        const expected_revenue_current_month = expectedData?.reduce((sum, booking) => 
          sum + (booking.services?.price || 0), 0) || 0

        // Calculate average spend per client
        const { data: clientSpendData } = await supabase
          .from('bookings')
          .select('client_id, services:service_id(price)')
          .eq('tenant_id', tenantId)
          .eq('is_paid', true)
          .gte('scheduled_at', thirtyDaysAgo.toISOString())

        const clientSpendMap = new Map<string, number>()
        clientSpendData?.forEach(booking => {
          if (booking.client_id && booking.services?.price) {
            const current = clientSpendMap.get(booking.client_id) || 0
            clientSpendMap.set(booking.client_id, current + booking.services.price)
          }
        })

        const avg_spend_per_client = clientSpendMap.size > 0
          ? Array.from(clientSpendMap.values()).reduce((sum, val) => sum + val, 0) / clientSpendMap.size
          : 0

        // Calculate average transaction value (only paid bookings)
        const paidBookingsCount = revenueData?.length || 0
        const avg_transaction_value = paidBookingsCount > 0 && revenue_last30 > 0
          ? revenue_last30 / paidBookingsCount
          : 0

        return {
          revenue_last30: Math.round(revenue_last30 * 100) / 100,
          appointments_last30: appointments_last30 || 0,
          new_clients_last30: new_clients_last30 || 0,
          low_stock_items: low_stock_items || 0,
          avg_spend_per_client: Math.round(avg_spend_per_client * 100) / 100,
          expected_revenue_current_month: Math.round(expected_revenue_current_month * 100) / 100,
          avg_transaction_value: Math.round(avg_transaction_value * 100) / 100
        }
      }

      return data as TenantMetrics | null
    },
  })
} 