'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Check } from 'lucide-react'

export default function OnboardingForm() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [salonName, setSalonName] = useState('')
  const [tenantId, setTenantId] = useState<string | null>(null)

  // Single Essential plan
  const ESSENTIAL_PLAN_ID = '20e739ad-7ebf-4ce6-9288-90d2b07c8de8'
  
  const essentialPlan = {
    name: 'Essential',
    price: '€97/maand',
    description: 'Essentieel abonnement voor het hosten van je salon op SalonSphere',
    features: [
      'Onbeperkte klanten',
      'Onbeperkte medewerkers', 
      'Online boekingssysteem',
      'E-mail & SMS notificaties',
      'Geavanceerde rapportages',
      'Voorraad beheer',
      'Marketing tools',
      'Prioriteit support',
      'API toegang'
    ]
  }

  // Check for payment success or failure
  useEffect(() => {
    const checkPaymentStatus = async () => {
      const success = searchParams.get('success')
      const paymentError = searchParams.get('error')
      const tenantParam = searchParams.get('tenant')
      const paymentId = searchParams.get('payment')
      
      if (success === 'true' && tenantParam) {
        // Payment was successful, redirect to subscription status page
        // The subscription-status page will handle polling for activation
        router.replace(`/subscription-status?success=true&tenant=${tenantParam}&payment=${paymentId || ''}`)
      } else if (paymentError === 'payment_failed') {
        setError('Betaling mislukt. Probeer het opnieuw.')
        if (tenantParam) {
          setTenantId(tenantParam)
        }
      }
    }

    checkPaymentStatus()
  }, [searchParams, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Niet ingelogd')
      const token = session.access_token

      // First, create or update the tenant with the salon name
      const onboardingResponse = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ salonName })
      })

      if (!onboardingResponse.ok) {
        throw new Error('Fout bij het aanmaken van de salon')
      }

      // Get the user's tenant_id
      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', session.user.id)
        .single()

      if (!userData?.tenant_id) {
        throw new Error('Tenant niet gevonden')
      }

      const currentTenantId = userData.tenant_id

      // Create Mollie payment
      const paymentResponse = await fetch('/api/subscription/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          planId: ESSENTIAL_PLAN_ID,
          tenantId: currentTenantId
        })
      })

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json()
        throw new Error(errorData.error || 'Fout bij het aanmaken van de betaling')
      }

      const paymentData = await paymentResponse.json()
      
      if (paymentData.paymentUrl) {
        // Redirect to Mollie checkout
        window.location.href = paymentData.paymentUrl
      } else {
        throw new Error('Geen betaling URL ontvangen')
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-xl font-semibold text-center">Welkom bij SalonSphere</h2>
        <p className="text-muted text-center mt-2 mb-8">
          Maak je salon aan en start direct
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
          {/* Essential Plan Display */}
          <div className="mb-6">
            <div className="border-2 border-[#02011F] rounded-xl p-6 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-xl text-[#02011F]">{essentialPlan.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{essentialPlan.description}</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-2xl text-[#02011F]">{essentialPlan.price}</div>
                  <div className="text-xs text-gray-500">incl. BTW</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Inclusief:</p>
                <div className="grid grid-cols-2 gap-2">
                  {essentialPlan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading || !salonName}
          >
            {loading ? 'Bezig met aanmaken...' : 'Start met Essential - €97/maand'}
          </button>
        </form>
      </div>
    </div>
  )
}  