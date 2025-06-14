'use client'

import React, { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { Building2, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function SignUpForm() {
  const { signUp } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [salonName, setSalonName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signUp(email, password, {
        role: 'admin',
        pending_tenant_name: salonName,
        emailRedirectTo: `${window.location.origin}/auth/callback`
      })
      setSuccess(true)
      // Supabase stuurt bevestigingsmail; laat user weten.
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">
            Bevestig je e-mailadres
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            We hebben een bevestigingslink gestuurd naar{' '}
            <span className="font-medium text-gray-900">{email}</span>.
            <br />
            Klik op de link in je e-mail om je account te activeren.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-700">
            💡 Controleer ook je spam/ongewenste berichten map als je de e-mail niet ziet.
          </p>
        </div>

        <button
          className="btn-outlined w-full"
          onClick={() => router.push('/auth/sign-in')}
        >
          Terug naar inloggen
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Salon Name Field */}
      <div className="space-y-2">
        <label htmlFor="salon" className="block text-sm font-medium text-gray-700">
          Naam van je salon
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Building2 className="h-5 w-5 text-muted" />
          </div>
          <input
            id="salon"
            type="text"
            required
            autoComplete="organization"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-[#02011F] transition-colors min-h-[44px]"
            placeholder="Bijv. Beauty Salon Amsterdam"
            value={salonName}
            onChange={(e) => setSalonName(e.target.value)}
          />
        </div>
      </div>

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
            autoComplete="new-password"
            className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#02011F] focus:border-[#02011F] transition-colors min-h-[44px]"
            placeholder="Minimaal 8 karakters"
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
        <p className="text-xs text-muted">
          Je wachtwoord moet minimaal 8 karakters bevatten.
        </p>
      </div>

      {/* Terms & Privacy */}
      <div className="bg-background border border-gray-200 rounded-xl p-4">
        <p className="text-xs text-gray-600 leading-relaxed">
          Door een account aan te maken ga je akkoord met onze{' '}
          <a href="#" className="text-[#02011F] hover:opacity-90 font-medium">
            Algemene Voorwaarden
          </a>{' '}
          en{' '}
          <a href="#" className="text-[#02011F] hover:opacity-90 font-medium">
            Privacybeleid
          </a>.
        </p>
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
            Account wordt aangemaakt...
          </>
        ) : (
          <>
            <span>Account aanmaken</span>
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </form>
  )
} 