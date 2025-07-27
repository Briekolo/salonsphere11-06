'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/lib/hooks/useTenant'
import { ServiceService } from '@/lib/services/serviceService'
import { OverheadMetrics, TreatmentOverheadAnalysis, OverheadTrend } from '@/types/overhead'

// Hook voor overhead metrics van huidige maand
export function useOverheadMetrics(monthYear?: Date) {
  const { tenantId } = useTenant()

  return useQuery<OverheadMetrics | null>({
    queryKey: ['overhead-metrics', tenantId, monthYear],
    queryFn: async () => {
      try {
        return await ServiceService.getOverheadMetrics(monthYear)
      } catch (error) {
        console.error('Error in useOverheadMetrics:', error)
        return null
      }
    },
    enabled: !!tenantId,
    staleTime: 60_000, // Cache voor 1 minuut
    refetchOnWindowFocus: false,
    retry: 1 // Only retry once on failure
  })
}

// Hook voor overhead analyse per behandeling
export function useTreatmentOverheadAnalysis(serviceId?: string) {
  const { tenantId } = useTenant()

  return useQuery<TreatmentOverheadAnalysis[]>({
    queryKey: ['treatment-overhead-analysis', tenantId, serviceId],
    queryFn: () => ServiceService.getTreatmentOverheadAnalysis(serviceId),
    enabled: !!tenantId,
    staleTime: 60_000
  })
}

// Hook voor het updaten van overhead instellingen
export function useUpdateOverheadSettings() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()

  return useMutation({
    mutationFn: async (overheadMonthly: number) => {
      if (!tenantId) throw new Error('No tenant found')

      const { data, error } = await supabase
        .from('tenants')
        .update({ overhead_monthly: overheadMonthly })
        .eq('id', tenantId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate alle overhead gerelateerde queries
      queryClient.invalidateQueries({ queryKey: ['overhead-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['treatment-overhead-analysis'] })
      queryClient.invalidateQueries({ queryKey: ['tenant'] })
    }
  })
}

// Hook voor het ophalen van huidige overhead instellingen
export function useOverheadSettings() {
  const { tenantId } = useTenant()

  return useQuery<{ overhead_monthly: number }>({
    queryKey: ['overhead-settings', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant found')

      const { data, error } = await supabase
        .from('tenants')
        .select('overhead_monthly')
        .eq('id', tenantId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!tenantId,
    staleTime: 300_000 // Cache voor 5 minuten
  })
}

// Hook voor overhead trends over meerdere maanden
export function useOverheadTrends(monthsBack: number = 6) {
  const { tenantId } = useTenant()

  return useQuery<OverheadTrend[]>({
    queryKey: ['overhead-trends', tenantId, monthsBack],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant found')

      const trends: OverheadTrend[] = []
      const currentDate = new Date()

      for (let i = monthsBack - 1; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
        
        try {
          const metrics = await ServiceService.getOverheadMetrics(date)
          if (metrics) {
            trends.push({
              month: date.toISOString().slice(0, 7), // YYYY-MM format
              overheadMonthly: metrics.overhead_monthly,
              totalTreatments: metrics.total_treatments,
              overheadPerTreatment: metrics.overhead_per_treatment,
              overheadPercentage: metrics.overhead_percentage
            })
          }
        } catch (error) {
          console.error(`Error fetching overhead for ${date.toISOString().slice(0, 7)}:`, error)
          // Voeg een lege entry toe zodat de grafiek geen gaten heeft
          trends.push({
            month: date.toISOString().slice(0, 7),
            overheadMonthly: 0,
            totalTreatments: 0,
            overheadPerTreatment: 0,
            overheadPercentage: 0
          })
        }
      }

      return trends
    },
    enabled: !!tenantId,
    staleTime: 300_000, // Cache voor 5 minuten
    retry: 1 // Only retry once on failure
  })
}

// Hook voor maandelijkse behandelingen count
export function useMonthlyTreatmentCount(monthYear?: Date) {
  const { tenantId } = useTenant()

  return useQuery<number>({
    queryKey: ['monthly-treatment-count', tenantId, monthYear],
    queryFn: () => ServiceService.getMonthlyTreatmentCount(monthYear),
    enabled: !!tenantId,
    staleTime: 60_000,
    retry: 1
  })
}

// Hook voor gemiddelde behandelingsprijs
export function useAverageTreatmentPrice(monthYear?: Date) {
  const { tenantId } = useTenant()

  return useQuery<number>({
    queryKey: ['average-treatment-price', tenantId, monthYear],
    queryFn: () => ServiceService.getAverageTreatmentPrice(monthYear),
    enabled: !!tenantId,
    staleTime: 60_000
  })
}