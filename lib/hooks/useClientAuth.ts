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
  
  console.log('[CLIENT-AUTH-HOOK] Current auth state:', {
    hasUser: !!authState.user,
    hasClient: !!authState.client,
    loading: authState.loading,
    mounted,
    clientId: authState.client?.id,
    clientEmail: authState.client?.email
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) {
      console.log('[CLIENT-AUTH-HOOK] Not mounted yet, skipping auth setup');
      return
    }
    
    console.log('[CLIENT-AUTH-HOOK] Setting up auth listener');
    let isActive = true
    
    // Check initial auth state
    checkAuth()

    // Listen for auth changes - only set up once
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isActive) {
        console.log('[CLIENT-AUTH-HOOK] Auth change ignored - component unmounted');
        return // Prevent updates after cleanup
      }
      
      console.log('[CLIENT-AUTH-HOOK] Auth state change event:', {
        event,
        hasSession: !!session,
        userId: session?.user?.id,
        userType: session?.user?.user_metadata?.user_type
      });
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Only handle client users
        if (session.user.user_metadata.user_type === 'client') {
          console.log('[CLIENT-AUTH-HOOK] Client user signed in, fetching client data');
          const client = await clientAuthService.getCurrentClient()
          console.log('[CLIENT-AUTH-HOOK] Client data fetched:', {
            hasClient: !!client,
            clientId: client?.id,
            clientEmail: client?.email
          });
          setAuthState({
            user: session.user,
            client,
            loading: false
          })
        } else {
          console.log('[CLIENT-AUTH-HOOK] Non-client user signed in, ignoring');
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('[CLIENT-AUTH-HOOK] User signed out');
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
    console.log('[CLIENT-AUTH-HOOK] Checking auth state');
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      console.log('[CLIENT-AUTH-HOOK] Session check result:', {
        hasSession: !!session,
        userId: session?.user?.id,
        userType: session?.user?.user_metadata?.user_type,
        error: sessionError?.message
      });
      
      if (session?.user && session.user.user_metadata.user_type === 'client') {
        console.log('[CLIENT-AUTH-HOOK] Valid client session found, fetching client data');
        const client = await clientAuthService.getCurrentClient()
        console.log('[CLIENT-AUTH-HOOK] Client data result:', {
          hasClient: !!client,
          clientId: client?.id,
          clientEmail: client?.email,
          clientTenantId: client?.tenant_id
        });
        setAuthState({
          user: session.user,
          client,
          loading: false
        })
      } else {
        console.log('[CLIENT-AUTH-HOOK] No valid client session');
        setAuthState({
          user: null,
          client: null,
          loading: false
        })
      }
    } catch (error: any) {
      console.error('[CLIENT-AUTH-HOOK] Error checking auth:', error);
      console.error('[CLIENT-AUTH-HOOK] Error details:', {
        message: error?.message,
        code: error?.code
      });
      setAuthState({
        user: null,
        client: null,
        loading: false
      })
    }
  }

  const login = async (email: string, password: string, domain: string) => {
    console.log('[CLIENT-AUTH-HOOK] Login attempt for:', email, 'on domain:', domain);
    const { client, error } = await clientAuthService.login({ email, password, domain })
    if (!error && client) {
      console.log('[CLIENT-AUTH-HOOK] Login successful, rechecking auth');
      await checkAuth()
    } else {
      console.error('[CLIENT-AUTH-HOOK] Login failed:', error?.message);
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