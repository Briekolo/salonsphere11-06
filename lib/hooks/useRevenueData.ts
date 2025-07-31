'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/lib/hooks/useTenant'
import { eachDayOfInterval, format } from 'date-fns'

interface UseRevenueDataParams {
  startDate: Date
  endDate: Date
  previousStartDate: Date
}

interface RevenueDataPoint {
  date: string
  revenue: number
  previousRevenue?: number
}

export function useRevenueData({ startDate, endDate, previousStartDate }: UseRevenueDataParams) {
  const { tenantId } = useTenant()

  return useQuery<RevenueDataPoint[]>({
    queryKey: ['revenue-data', tenantId, startDate.toISOString(), endDate.toISOString(), previousStartDate.toISOString()],
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes in memory (renamed from cacheTime)
    queryFn: async () => {
      if (!tenantId) return []

      // Fetch current period data - use bookings with is_paid = true
      const { data: currentData, error: currentError } = await supabase
        .from('bookings')
        .select(`
          scheduled_at,
          services:service_id (price)
        `)
        .eq('tenant_id', tenantId)
        .eq('is_paid', true)
        .gte('scheduled_at', startDate.toISOString())
        .lte('scheduled_at', endDate.toISOString())
        .order('scheduled_at', { ascending: true })

      if (currentError) {
        console.error('Error fetching revenue data:', currentError)
        // Return empty data instead of mock data
        const days = eachDayOfInterval({ start: startDate, end: endDate })
        return days.map(day => ({
          date: format(day, 'yyyy-MM-dd'),
          revenue: 0,
          previousRevenue: 0
        }))
      }

      // Fetch previous period data for comparison
      const { data: previousData } = await supabase
        .from('bookings')
        .select(`
          scheduled_at,
          services:service_id (price)
        `)
        .eq('tenant_id', tenantId)
        .eq('is_paid', true)
        .gte('scheduled_at', previousStartDate.toISOString())
        .lt('scheduled_at', startDate.toISOString())

      // Group revenue by date
      const revenueByDate = new Map<string, number>()
      const previousRevenueByDate = new Map<string, number>()

      // Process current period
      currentData?.forEach(booking => {
        const date = format(new Date(booking.scheduled_at), 'yyyy-MM-dd')
        const current = revenueByDate.get(date) || 0
        const servicePrice = booking.services?.price || 0
        revenueByDate.set(date, current + servicePrice)
      })

      // Process previous period
      previousData?.forEach(booking => {
        const date = format(new Date(booking.scheduled_at), 'yyyy-MM-dd')
        const current = previousRevenueByDate.get(date) || 0
        const servicePrice = booking.services?.price || 0
        previousRevenueByDate.set(date, current + servicePrice)
      })

      // Generate data points for each day in the range
      const days = eachDayOfInterval({ start: startDate, end: endDate })
      
      return days.map((day, index) => {
        const dateStr = format(day, 'yyyy-MM-dd')
        const previousDay = format(
          new Date(previousStartDate.getTime() + (index * 24 * 60 * 60 * 1000)),
          'yyyy-MM-dd'
        )
        
        return {
          date: dateStr,
          revenue: revenueByDate.get(dateStr) || 0,
          previousRevenue: previousRevenueByDate.get(previousDay) || 0
        }
      })
    }
  })
}

// Mock data generator for development
function generateMockData(startDate: Date, endDate: Date): RevenueDataPoint[] {
  const days = eachDayOfInterval({ start: startDate, end: endDate })
  
  return days.map((day, index) => {
    // Generate realistic revenue data with some variation
    const baseRevenue = 300 + Math.random() * 200
    const dayOfWeek = day.getDay()
    
    // Weekends typically have higher revenue
    const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.5 : 1
    
    // Add some random variation
    const variation = (Math.random() - 0.5) * 100
    
    const revenue = Math.max(0, (baseRevenue * weekendMultiplier) + variation)
    const previousRevenue = Math.max(0, revenue * (0.8 + Math.random() * 0.4))
    
    return {
      date: format(day, 'yyyy-MM-dd'),
      revenue: Math.round(revenue * 100) / 100,
      previousRevenue: Math.round(previousRevenue * 100) / 100
    }
  })
}