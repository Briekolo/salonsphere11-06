'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ServiceService } from '@/lib/services/serviceService'
import { Database } from '@/types/database'
import { useTenant } from '@/lib/hooks/useTenant'

// Types afleiden uit Supabase-generated types
export type Service = Database['public']['Tables']['services']['Row']

// 1. Hoofdhook: lijst alle behandelingen voor huidige tenant
export function useServices() {
  const { tenantId } = useTenant()

  const query = useQuery<Service[]>({
    queryKey: ['services', tenantId],
    queryFn: () => ServiceService.getAll(),
    enabled: !!tenantId, // Alleen runnen als tenant bekend is
  })

  return query
}

// 2. Mutations helpers ------------------------------------------------------
export function useCreateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ServiceService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

export function useUpdateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Service> }) => ServiceService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

export function useDeleteService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => ServiceService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
} 