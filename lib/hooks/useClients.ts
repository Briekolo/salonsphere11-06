'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ClientService } from '@/lib/services/clientService'
import { Database } from '@/types/database'
import { useTenant } from '@/lib/hooks/useTenant'

export type Client = Database['public']['Tables']['clients']['Row'] & {
  appointments_count?: number;
  status?: string;
  segment?: string;
  preferences?: {
    preferred_services?: string[];
    preferred_staff?: string;
    communication_preference?: string;
  }
};

export function useClients(searchTerm: string = '') {
  const { tenantId } = useTenant()

  const queryKey = ['clients', tenantId, searchTerm]

  const query = useQuery<Client[]>({
    queryKey,
    queryFn: () =>
      searchTerm.trim()
        ? ClientService.search(searchTerm)
        : ClientService.getAll(),
    enabled: !!tenantId,
    staleTime: 1000 * 60, // 1 min
  })

  return query
}

export function useClientById(clientId: string) {
  const { tenantId } = useTenant()

  const queryKey = ['client', tenantId, clientId]

  const query = useQuery<Client | null>({
    queryKey,
    queryFn: () => ClientService.getById(clientId),
    enabled: !!tenantId && !!clientId,
    staleTime: 1000 * 60, // 1 min
  })

  return query
}

// Mutations -----------------------------------------------------------
export function useCreateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ClientService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Client> }) =>
      ClientService.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ClientService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  })
} 