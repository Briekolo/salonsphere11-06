'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData: any) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Debug mode - enable with ?debug=auth in URL
  const debugMode = typeof window !== 'undefined' && 
    new URLSearchParams(window.location.search).get('debug') === 'auth'

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (debugMode) {
        console.group('🔐 Auth Provider - Initial Session')
        console.log('Session:', session)
        console.log('User:', session?.user)
        console.log('Error:', error)
        console.groupEnd()
      }
      
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (debugMode) {
          console.group(`🔐 Auth State Change: ${event}`)
          console.log('Session:', session)
          console.log('User:', session?.user)
          console.groupEnd()
        }
        
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [debugMode])

  const signIn = async (email: string, password: string) => {
    if (debugMode) {
      console.log('🔐 Attempting sign in for:', email)
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (debugMode) {
      console.log('🔐 Sign in result:', { data, error })
    }
    
    if (error) {
      // Add more context to auth errors
      if (error.message === 'Invalid login credentials') {
        throw new Error('Onjuist e-mailadres of wachtwoord')
      }
      throw error
    }
    
    // Ensure session is properly set
    if (data.session) {
      setUser(data.user)
      
      // Force a session refresh to ensure it's properly stored
      const { data: refreshData } = await supabase.auth.refreshSession()
      if (refreshData.session) {
        console.log('Session refreshed after sign in')
        
        // Cache user role in metadata to prevent admin panel flickering
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', data.user.id)
            .single();
            
          if (userData?.role) {
            await supabase.auth.updateUser({
              data: { 
                ...data.user.user_metadata, 
                role: userData.role
              }
            });
          }
        } catch (error) {
          console.warn('Failed to cache user role during sign-in:', error);
        }
      }
    }
  }

  const signUp = async (email: string, password: string, userData: any) => {
    console.log('Attempting signup with:', { email, userData })
    
    // First check if we can reach Supabase
    try {
      const { data: testData, error: testError } = await supabase
        .from('tenants')
        .select('count')
        .limit(1)
      console.log('Supabase connection test:', { testData, testError })
    } catch (connError) {
      console.error('Cannot connect to Supabase:', connError)
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    
    if (error) {
      console.error('Signup error:', error)
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        name: error.name,
        stack: error.stack
      })
      throw error
    }
    
    console.log('Signup successful:', data)
    
    // After signup, update tenant metadata if user was created
    if (data.user) {
      try {
        // Wait a bit to ensure the trigger has run
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Get the tenant_id from the users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('tenant_id')
          .eq('id', data.user.id)
          .single()
          
        if (userData?.tenant_id) {
          // Update the auth metadata
          await supabase.rpc('update_user_tenant_metadata', {
            user_id: data.user.id,
            tenant_id: userData.tenant_id
          })
        }
      } catch (metadataError) {
        console.warn('Failed to update tenant metadata:', metadataError)
        // Don't fail the signup, just log the warning
      }
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}