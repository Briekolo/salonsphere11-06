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

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, userData: any) => {
    console.log('[AuthProvider] SignUp attempt:', { email, userData, timestamp: new Date().toISOString() })
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      console.log('[AuthProvider] SignUp response:', { data, error })
      
      if (error) {
        console.error('[AuthProvider] SignUp error details:', {
          message: error.message,
          status: error.status,
          code: error.code,
          name: error.name
        })
        
        // Provide better error messages for common issues
        if (error.message.includes('Database error saving new user')) {
          throw new Error('Er is een probleem opgetreden bij het aanmaken van je account. Controleer of alle velden correct zijn ingevuld en probeer het opnieuw.')
        } else if (error.message.includes('User already registered')) {
          throw new Error('Dit e-mailadres is al in gebruik. Probeer in te loggen of gebruik een ander e-mailadres.')
        } else if (error.message.includes('Invalid email')) {
          throw new Error('Voer een geldig e-mailadres in.')
        } else if (error.message.includes('Password should be at least')) {
          throw new Error('Het wachtwoord moet minimaal 6 karakters bevatten.')
        } else if (error.message.includes('Signup is disabled')) {
          throw new Error('Registratie is momenteel uitgeschakeld. Neem contact met ons op voor meer informatie.')
        } else if (error.message.includes('Email rate limit exceeded')) {
          throw new Error('Te veel pogingen. Wacht even voordat je opnieuw probeert.')
        }
        
        throw new Error(error.message || 'Er is een onbekende fout opgetreden. Probeer het opnieuw.')
      }
      
      console.log('[AuthProvider] SignUp successful, user created:', data.user?.id)
      // Signup was successful, no need for additional metadata updates 
      // as the database trigger should handle everything
      return data
      
    } catch (err: any) {
      console.error('[AuthProvider] SignUp caught error:', err)
      // Re-throw with better error message if needed
      throw err
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