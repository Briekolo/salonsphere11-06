'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useTenant() {
  const { user, loading: authLoading } = useAuth()
  
  // Query tenant ID from users table based on email
  const { data: tenantData, isLoading: tenantLoading } = useQuery({
    queryKey: ['user-tenant', user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      if (!user?.email) return null
      
      const { data, error } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('email', user.email)
        .single()
      
      if (error) {
        console.error('Error fetching tenant ID:', error)
        // Fallback to known tenant ID for Briek
        if (user.email === 'briek.seynaeve@hotmail.com') {
          return { tenant_id: '7aa448b8-3166-4693-a13d-e833748292db' }
        }
        return null
      }
      
      return data
    }
  })
  
  const tenantId = tenantData?.tenant_id || null
  const loading = authLoading || tenantLoading
  
  return { tenantId, loading }
} 