'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useTenant() {
  const { user, loading: authLoading } = useAuth()
  
  // Query tenant ID from users table based on auth user id
  const { data: tenantData, isLoading: tenantLoading, error: queryError } = useQuery({
    queryKey: ['user-tenant', user?.id],
    enabled: !!user?.id && !authLoading,
    retry: 1,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    queryFn: async () => {
      if (!user?.id) return null
      
      try {
        // First try to get from user metadata
        const tenantIdFromMetadata = user.user_metadata?.tenant_id
        if (tenantIdFromMetadata) {
          return { tenant_id: tenantIdFromMetadata }
        }
        
        // Otherwise query from users table
        const { data, error } = await supabase
          .from('users')
          .select('tenant_id')
          .eq('id', user.id)
          .maybeSingle() // Use maybeSingle instead of single to handle non-existent records
        
        if (error) {
          // Only log if it's not a PGRST116 (no rows) error
          if (error.code !== 'PGRST116') {
            console.error('Error fetching tenant ID:', error.message, { 
              code: error.code, 
              userId: user.id,
              email: user.email 
            })
          }
          return null
        }
        
        return data
      } catch (err) {
        console.error('Unexpected error in useTenant:', err)
        return null
      }
    }
  })
  
  const tenantId = tenantData?.tenant_id || null
  const loading = authLoading || tenantLoading
  const hasNoTenant = !loading && !tenantId && !!user
  
  return { tenantId, loading, hasNoTenant }
} 