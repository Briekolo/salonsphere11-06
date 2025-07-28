'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { checkAuthAndRedirect } from '@/lib/utils/auth-redirect'

export default function SignInForm() {
  const { signIn } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  // Test Supabase connection on mount
  useEffect(() => {
    async function testConnection() {
      try {
        const { error } = await supabase
          .from('tenants')
          .select('count')
          .limit(1)
          .single()
        
        if (error && error.code !== 'PGRST116') { // Ignore "not found" errors
          setConnectionError('Kan geen verbinding maken met de server. Controleer je internetverbinding.')
        }
      } catch (err) {
        setConnectionError('Kan geen verbinding maken met de server. Controleer je internetverbinding.')
      }
    }
    
    testConnection()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signIn(email, password)
      
      console.log('Sign in successful, ensuring cookies are set...')
      
      // Get the session to ensure it's properly stored
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        console.log('Session confirmed, setting cookies...')
        
        // Force set the session to ensure cookies are created
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        })
      }
      
      // Wait for cookies to be set
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Force redirect with full page reload
      console.log('Redirecting to dashboard...')
      window.location.replace('/')
    } catch (err: any) {
      // Translate common error messages to Dutch
      let errorMessage = err.message
      
      if (err.message?.includes('Invalid login credentials')) {
        errorMessage = 'Onjuist e-mailadres of wachtwoord'
      } else if (err.message?.includes('Email not confirmed')) {
        errorMessage = 'Je e-mailadres is nog niet bevestigd. Controleer je inbox.'
      } else if (err.message?.includes('Network request failed') || err.message?.includes('Failed to fetch')) {
        errorMessage = 'Geen verbinding met de server. Controleer je internetverbinding.'
      } else if (err.message?.includes('User not found')) {
        errorMessage = 'Geen account gevonden met dit e-mailadres'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Connection Error */}
      {connectionError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">{connectionError}</p>
        </div>
      )}
      
      {/* Email Field */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          E-mailadres
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-muted" />
          </div>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-[#02011F] transition-colors min-h-[44px]"
            placeholder="jouw@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Wachtwoord
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-muted" />
          </div>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            required
            minLength={8}
            autoComplete="current-password"
            className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-[#02011F] transition-colors min-h-[44px]"
            placeholder="Voer je wachtwoord in"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-muted hover:text-gray-600" />
            ) : (
              <Eye className="h-5 w-5 text-muted hover:text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Forgot Password Link */}
      <div className="flex justify-end">
        <button
          type="button"
          className="text-sm text-[#02011F] hover:opacity-90 font-medium transition-opacity"
        >
          Wachtwoord vergeten?
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        className="btn-primary w-full"
        disabled={loading}
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Bezig met inloggen...
          </>
        ) : (
          <>
            <span>Inloggen</span>
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </form>
  )
} 