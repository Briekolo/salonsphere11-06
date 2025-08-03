'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TreatmentSeriesService, CreateTreatmentSeriesParams } from '@/lib/services/treatmentSeriesService'
import { useTenant } from './useTenant'
import { useToast } from '@/components/providers/ToastProvider'

export function useClientTreatmentSeries(clientId: string) {
  const { tenantId } = useTenant()

  return useQuery({
    queryKey: ['treatment-series', tenantId, clientId],
    queryFn: () => TreatmentSeriesService.getSeriesByClient(clientId),
    enabled: !!tenantId && !!clientId,
  })
}

export function useTreatmentSeries(seriesId: string) {
  const { tenantId } = useTenant()

  return useQuery({
    queryKey: ['treatment-series', tenantId, seriesId],
    queryFn: () => TreatmentSeriesService.getSeriesById(seriesId),
    enabled: !!tenantId && !!seriesId,
  })
}

export function useActiveTreatmentSeries() {
  const { tenantId } = useTenant()

  return useQuery({
    queryKey: ['treatment-series', tenantId, 'active'],
    queryFn: () => tenantId ? TreatmentSeriesService.getActiveSeries(tenantId) : [],
    enabled: !!tenantId,
  })
}

export function useSeriesBookings(seriesId: string) {
  const { tenantId } = useTenant()

  return useQuery({
    queryKey: ['treatment-series-bookings', tenantId, seriesId],
    queryFn: () => TreatmentSeriesService.getSeriesBookings(seriesId),
    enabled: !!tenantId && !!seriesId,
  })
}

export function useCreateTreatmentSeries() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: (params: CreateTreatmentSeriesParams) => 
      TreatmentSeriesService.createSeries(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['treatment-series', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['bookings', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['clients', tenantId, variables.client_id] })
      showToast('Behandelreeks succesvol aangemaakt', 'success')
    },
    onError: (error) => {
      console.error('Error creating treatment series:', error)
      showToast('Fout bij het aanmaken van behandelreeks', 'error')
    },
  })
}

export function useUpdateTreatmentSeries() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: ({ seriesId, updates }: { seriesId: string; updates: any }) => 
      TreatmentSeriesService.updateSeries(seriesId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-series', tenantId] })
      showToast('Behandelreeks bijgewerkt', 'success')
    },
    onError: (error) => {
      console.error('Error updating treatment series:', error)
      showToast('Fout bij het bijwerken van behandelreeks', 'error')
    },
  })
}

export function useCancelTreatmentSeries() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: (seriesId: string) => TreatmentSeriesService.cancelSeries(seriesId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-series', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['bookings', tenantId] })
      showToast('Behandelreeks geannuleerd', 'success')
    },
    onError: (error) => {
      console.error('Error cancelling treatment series:', error)
      showToast('Fout bij het annuleren van behandelreeks', 'error')
    },
  })
}

export function usePauseTreatmentSeries() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: (seriesId: string) => TreatmentSeriesService.pauseSeries(seriesId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-series', tenantId] })
      showToast('Behandelreeks gepauzeerd', 'success')
    },
    onError: (error) => {
      console.error('Error pausing treatment series:', error)
      showToast('Fout bij het pauzeren van behandelreeks', 'error')
    },
  })
}

export function useResumeTreatmentSeries() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: (seriesId: string) => TreatmentSeriesService.resumeSeries(seriesId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-series', tenantId] })
      showToast('Behandelreeks hervat', 'success')
    },
    onError: (error) => {
      console.error('Error resuming treatment series:', error)
      showToast('Fout bij het hervatten van behandelreeks', 'error')
    },
  })
}