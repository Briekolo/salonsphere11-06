'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, getCurrentUserTenantId } from '@/lib/supabase'
import { useTenant } from '@/lib/hooks/useTenant'

export type StaffService = {
  id: string
  staff_id: string
  service_id: string
  tenant_id: string
  custom_duration_minutes: number | null
  custom_price: number | null
  active: boolean
  created_at: string
  updated_at: string
}

export type StaffCertification = {
  id: string
  staff_id: string
  certification_name: string
  issuer: string | null
  issue_date: string | null
  expiry_date: string | null
  document_url: string | null
  verified: boolean
  tenant_id: string
  created_at: string
  updated_at: string
}

export type StaffWithServices = {
  id: string
  first_name: string
  last_name: string
  email: string
  services: StaffService[]
}

// Get all staff services assignments
export function useStaffServices() {
  const { tenantId } = useTenant()

  return useQuery<StaffService[]>({
    queryKey: ['staff-services', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant found')

      const { data, error } = await supabase
        .from('staff_services')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!tenantId,
  })
}

// Get staff members with their assigned services
export function useStaffWithServices() {
  const { tenantId } = useTenant()

  return useQuery<StaffWithServices[]>({
    queryKey: ['staff-with-services', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant found')

      // First get all staff members (including admins who can also perform services)
      const { data: staff, error: staffError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .eq('tenant_id', tenantId)
        .in('role', ['staff', 'admin'])
        .eq('active', true)
        .order('first_name', { ascending: true })

      if (staffError) throw staffError

      // Then get their service assignments
      const { data: assignments, error: assignError } = await supabase
        .from('staff_services')
        .select('*')
        .eq('tenant_id', tenantId)

      if (assignError) throw assignError

      // Combine the data
      return (staff || []).map(staffMember => ({
        ...staffMember,
        services: (assignments || []).filter(a => a.staff_id === staffMember.id)
      }))
    },
    enabled: !!tenantId,
  })
}

// Assign service to staff
export function useAssignServiceToStaff() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()

  return useMutation({
    mutationFn: async ({ 
      staff_id, 
      service_id, 
      custom_duration_minutes,
      custom_price 
    }: {
      staff_id: string
      service_id: string
      custom_duration_minutes?: number | null
      custom_price?: number | null
    }) => {
      if (!tenantId) throw new Error('No tenant found')

      const { data, error } = await supabase
        .from('staff_services')
        .upsert({
          staff_id,
          service_id,
          tenant_id: tenantId,
          custom_duration_minutes,
          custom_price,
          active: true
        }, {
          onConflict: 'staff_id,service_id'
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-services'] })
      queryClient.invalidateQueries({ queryKey: ['staff-with-services'] })
    },
  })
}

// Update staff service assignment
export function useUpdateStaffService() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string
      updates: Partial<Omit<StaffService, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>
    }) => {
      if (!tenantId) throw new Error('No tenant found')

      const { data, error } = await supabase
        .from('staff_services')
        .update(updates)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-services'] })
      queryClient.invalidateQueries({ queryKey: ['staff-with-services'] })
    },
  })
}

// Remove service from staff
export function useRemoveServiceFromStaff() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()

  return useMutation({
    mutationFn: async ({ staff_id, service_id }: { staff_id: string; service_id: string }) => {
      if (!tenantId) throw new Error('No tenant found')

      const { error } = await supabase
        .from('staff_services')
        .delete()
        .eq('staff_id', staff_id)
        .eq('service_id', service_id)
        .eq('tenant_id', tenantId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-services'] })
      queryClient.invalidateQueries({ queryKey: ['staff-with-services'] })
    },
  })
}

// Get staff certifications
export function useStaffCertifications(staffId?: string) {
  const { tenantId } = useTenant()

  return useQuery<StaffCertification[]>({
    queryKey: ['staff-certifications', tenantId, staffId],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant found')

      let query = supabase
        .from('staff_certifications')
        .select('*')
        .eq('tenant_id', tenantId)

      if (staffId) {
        query = query.eq('staff_id', staffId)
      }

      const { data, error } = await query.order('issue_date', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!tenantId,
  })
}

// Add certification
export function useAddCertification() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()

  return useMutation({
    mutationFn: async (certification: Omit<StaffCertification, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => {
      if (!tenantId) throw new Error('No tenant found')

      const { data, error } = await supabase
        .from('staff_certifications')
        .insert({ ...certification, tenant_id: tenantId })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-certifications'] })
    },
  })
}

// Delete certification
export function useDeleteCertification() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId) throw new Error('No tenant found')

      const { error } = await supabase
        .from('staff_certifications')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-certifications'] })
    },
  })
}