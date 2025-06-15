'use client'

import React, { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function OnboardingForm() {
  const { user } = useAuth()
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | 'growth'>('starter')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [salonName, setSalonName] = useState('')

  const plans = [
    {
      id: 'starter' as const,
      name: 'Starter',
      price: '€29/maand',
      description: 'Perfect voor kleine salons',
      features: ['Tot 100 klanten', 'Basisrapportages', 'E-mail support']
    },
    {
      id: 'pro' as const,
      name: 'Pro',
      price: '€59/maand',
      description: 'Voor groeiende salons',
      features: ['Onbeperkte klanten', 'Geavanceerde rapportages', 'Prioriteit support', 'API toegang']
    },
    {
      id: 'growth' as const,
      name: 'Growth',
      price: 'Op maat',
      description: 'Voor grote salonketens',
      features: ['Alles van Pro', 'Dedicated support', 'Custom integraties', 'Meerdere locaties']
    }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Niet ingelogd')
      const token = session.access_token

      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ salonName, tier: selectedPlan })
      })

      if (!response.ok) {
        throw new Error('Onboarding failed')
      }

      // refresh session to get updated tenant_id metadata
      await supabase.auth.refreshSession()
      router.replace('/')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-xl font-semibold text-center">Welkom bij SalonSphere</h2>
        <p className="text-muted text-center mt-2 mb-8">
          Kies je abonnement om te starten
        </p>

        <div className="mb-6">
          <label htmlFor="salonName" className="block text-sm font-medium text-gray-700 mb-1">Naam van je salon</label>
          <input
            id="salonName"
            type="text"
            required
            className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#02011F]"
            value={salonName}
            onChange={(e)=>setSalonName(e.target.value)}
          />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 mb-6 grid-cols-1 md:grid-cols-3">
            {plans.map((plan) => (
              <label
                key={plan.id}
                className={`
                  border-2 rounded-xl p-4 cursor-pointer transition-colors
                  ${selectedPlan === plan.id 
                    ? 'border-[#02011F] bg-gray-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <input
                  type="radio"
                  name="plan"
                  value={plan.id}
                  checked={selectedPlan === plan.id}
                  onChange={e => setSelectedPlan(e.target.value as 'starter' | 'pro' | 'growth')}
                  className="sr-only"
                />
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-lg">{plan.name}</h3>
                    <p className="text-muted text-sm">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{plan.price}</div>
                  </div>
                </div>
                <ul className="text-sm text-muted">
                  {plan.features.map((feature, idx) => (
                    <li key={idx}>• {feature}</li>
                  ))}
                </ul>
              </label>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading}
          >
            {loading ? 'Bezig...' : 'Account voltooien'}
          </button>
        </form>
      </div>
    </div>
  )
}  