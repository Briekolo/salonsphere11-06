'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { clientAuthService } from '@/lib/services/clientAuthService'
import { Database } from '@/types/database'

type Client = Database['public']['Tables']['clients']['Row']

interface ClientAuthState {
  user: User | null
  client: Client | null
  loading: boolean
}

export function useClientAuth() {
  const router = useRouter()
  const [authState, setAuthState] = useState<ClientAuthState>({
    user: null,
    client: null,
    loading: true
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    let isActive = true
    
    // Check initial auth state
    checkAuth()

    // Listen for auth changes - only set up once
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isActive) return // Prevent updates after cleanup
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Only handle client users
        if (session.user.user_metadata.user_type === 'client') {
          const client = await clientAuthService.getCurrentClient()
          setAuthState({
            user: session.user,
            client,
            loading: false
          })
        }
      } else if (event === 'SIGNED_OUT') {
        setAuthState({
          user: null,
          client: null,
          loading: false
        })
      }
    })

    return () => {
      isActive = false
      subscription.unsubscribe()
    }
  }, [mounted])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user && session.user.user_metadata.user_type === 'client') {
        const client = await clientAuthService.getCurrentClient()
        setAuthState({
          user: session.user,
          client,
          loading: false
        })
      } else {
        setAuthState({
          user: null,
          client: null,
          loading: false
        })
      }
    } catch (error) {
      console.error('Error checking auth:', error)
      setAuthState({
        user: null,
        client: null,
        loading: false
      })
    }
  }

  const login = async (email: string, password: string, domain: string) => {
    const { client, error } = await clientAuthService.login({ email, password, domain })
    if (!error && client) {
      await checkAuth()
    }
    return { client, error }
  }

  const register = async (data: Parameters<typeof clientAuthService.register>[0]) => {
    const { client, error } = await clientAuthService.register(data)
    if (!error && client) {
      await checkAuth()
    }
    return { client, error }
  }

  const logout = async () => {
    await clientAuthService.logout()
    setAuthState({
      user: null,
      client: null,
      loading: false
    })
    router.push('/')
  }

  const updateProfile = async (updates: Partial<Client>) => {
    if (!authState.client) {
      return { client: null, error: new Error('Not authenticated') }
    }

    const { client, error } = await clientAuthService.updateProfile(authState.client.id, updates)
    if (!error && client) {
      setAuthState(prev => ({ ...prev, client }))
    }
    return { client, error }
  }

  return {
    user: mounted ? authState.user : null,
    client: mounted ? authState.client : null,
    loading: authState.loading || !mounted,
    isAuthenticated: mounted && !!authState.user && !!authState.client,
    login,
    register,
    logout,
    updateProfile,
    checkAuth,
    mounted
  }
}