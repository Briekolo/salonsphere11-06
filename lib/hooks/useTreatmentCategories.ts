'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, getCurrentUserTenantId } from '@/lib/supabase'
import { Database } from '@/types/database'
import { useTenant } from '@/lib/hooks/useTenant'

export type TreatmentCategory = {
  id: string
  tenant_id: string
  name: string
  description: string | null
  display_order: number
  color: string
  icon: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export type TreatmentCategoryInsert = Omit<TreatmentCategory, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>
export type TreatmentCategoryUpdate = Partial<TreatmentCategoryInsert>

// Get all categories for current tenant
export function useTreatmentCategories() {
  const { tenantId } = useTenant()

  return useQuery<TreatmentCategory[]>({
    queryKey: ['treatment-categories', 'v2', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant found')

      const { data, error } = await supabase
        .from('treatment_categories')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('display_order', { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!tenantId,
  })
}

// Get active categories only
export function useActiveTreatmentCategories() {
  const { tenantId } = useTenant()

  return useQuery<TreatmentCategory[]>({
    queryKey: ['treatment-categories', 'active', 'v2', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant found')

      const { data, error } = await supabase
        .from('treatment_categories')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('active', true)
        .order('display_order', { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!tenantId,
  })
}

// Create category
export function useCreateTreatmentCategory() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()

  return useMutation({
    mutationFn: async (category: TreatmentCategoryInsert) => {
      if (!tenantId) throw new Error('No tenant found')

      const { data, error } = await supabase
        .from('treatment_categories')
        .insert({ ...category, tenant_id: tenantId })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-categories'] })
    },
  })
}

// Update category
export function useUpdateTreatmentCategory() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TreatmentCategoryUpdate }) => {
      if (!tenantId) throw new Error('No tenant found')

      const { data, error } = await supabase
        .from('treatment_categories')
        .update(updates)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-categories'] })
    },
  })
}

// Delete category
export function useDeleteTreatmentCategory() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId) throw new Error('No tenant found')

      // Check if category is used by any services
      const { data: services, error: checkError } = await supabase
        .from('services')
        .select('id')
        .eq('category_id', id)
        .eq('tenant_id', tenantId)
        .limit(1)

      if (checkError) throw checkError
      if (services && services.length > 0) {
        throw new Error('Categorie wordt gebruikt door behandelingen en kan niet worden verwijderd')
      }

      const { error } = await supabase
        .from('treatment_categories')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-categories'] })
    },
  })
}

// Reorder categories
export function useReorderTreatmentCategories() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()

  return useMutation({
    mutationFn: async (categories: { id: string; display_order: number }[]) => {
      if (!tenantId) throw new Error('No tenant found')

      // Update each category's display order
      const promises = categories.map(({ id, display_order }) =>
        supabase
          .from('treatment_categories')
          .update({ display_order })
          .eq('id', id)
          .eq('tenant_id', tenantId)
      )

      const results = await Promise.all(promises)
      const errors = results.filter(r => r.error)
      
      if (errors.length > 0) {
        throw new Error('Failed to reorder categories')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-categories'] })
    },
  })
}