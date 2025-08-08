import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth/AuthProvider'

interface UserProfile {
  id: string
  email: string | null
  role: string | null
  tenant_id: string | null
  first_name: string | null
  last_name: string | null
  phone?: string | null
  active?: boolean | null
  specializations?: string[] | null
  working_hours?: any
}

export function useUserProfile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user) return null

      // First try to get from user metadata (faster)
      const userMetaFirstName = user.user_metadata?.first_name
      const userMetaLastName = user.user_metadata?.last_name
      
      // Then fetch from database
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        // Return partial data from auth if database fetch fails
        return {
          id: user.id,
          email: user.email || null,
          first_name: userMetaFirstName || null,
          last_name: userMetaLastName || null,
          role: null,
          tenant_id: user.user_metadata?.tenant_id || null,
          phone: null,
          active: null,
          specializations: null,
          working_hours: null
        } as UserProfile
      }

      return data as UserProfile
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  })

  const invalidateProfile = () => {
    queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] })
  }

  const firstName = profile?.first_name || user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Gebruiker'
  const lastName = profile?.last_name || user?.user_metadata?.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim() || user?.email || 'Gebruiker'
  
  const initials = fullName
    .split(' ')
    .map(n => n.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return {
    profile,
    isLoading,
    error,
    firstName,
    lastName,
    fullName,
    initials,
    invalidateProfile
  }
}