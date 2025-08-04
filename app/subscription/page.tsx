'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, CreditCard, Star } from 'lucide-react'
import { useSubscriptionPlans, useSubscription } from '@/lib/hooks/useSubscription'
import { subscriptionService } from '@/lib/services/subscriptionService'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function SubscriptionPage() {
  const router = useRouter()
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans()
  const { 
    subscriptionStatus, 
    subscription, 
    loading: subscriptionLoading,
    createTrial,
    isCreatingTrial,
    simulatePayment,
    isSimulatingPayment,
    tenantId 
  } = useSubscription()

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const handleStartTrial = async (planId: string) => {
    try {
      setSelectedPlan(planId)
      await createTrial(planId)
      router.push('/')
    } catch (error) {
      console.error('Error starting trial:', error)
      // You could add error handling UI here
    }
  }

  const handleUpgrade = async (planId: string) => {
    if (process.env.NODE_ENV === 'development') {
      // Dev mode: simulate payment
      try {
        setSelectedPlan(planId)
        await simulatePayment(planId)
        router.push('/')
      } catch (error) {
        console.error('Error simulating payment:', error)
        alert('Er is een fout opgetreden bij de betaling simulatie')
      }
    } else {
      // Production: show Mollie integration message
      alert('Betaling integratie komt binnenkort beschikbaar!')
    }
  }

  if (plansLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>
            Er zijn momenteel geen abonnementen beschikbaar. Neem contact op met support.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // If user already has a subscription, show current status
  if (subscriptionStatus) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Uw Abonnement</h1>
            <p className="text-gray-600">Beheer uw abonnement en bekijk uw huidige plan</p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{subscriptionStatus.plan_name}</CardTitle>
                    <CardDescription>
                      Status: <Badge variant={subscriptionStatus.status === 'active' ? 'default' : 'secondary'}>
                        {subscriptionStatus.status === 'active' ? 'Actief' : 
                         subscriptionStatus.status === 'trial' ? 'Proefperiode' :
                         subscriptionStatus.status === 'expired' ? 'Verlopen' : 
                         subscriptionStatus.status}
                      </Badge>
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    {subscriptionStatus.status === 'trial' && subscriptionStatus.trial_end && (
                      <div className="flex items-center text-amber-600">
                        <Clock className="w-4 h-4 mr-1" />
                        <span className="text-sm">
                          Proefperiode eindigt op {new Date(subscriptionStatus.trial_end).toLocaleDateString('nl-NL')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Inbegrepen functies:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {subscriptionStatus.features && Object.entries(subscriptionStatus.features).map(([key, value]) => {
                        if (typeof value === 'boolean' && value) {
                          return (
                            <div key={key} className="flex items-center text-sm text-gray-600">
                              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                              {getFeatureDisplayName(key)}
                            </div>
                          )
                        } else if (typeof value === 'number') {
                          return (
                            <div key={key} className="flex items-center text-sm text-gray-600">
                              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                              {getFeatureDisplayName(key)}: {value === -1 ? 'Onbeperkt' : value}
                            </div>
                          )
                        }
                        return null
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
              {subscriptionStatus.status === 'trial' && (
                <CardFooter>
                  <div className="w-full space-y-4">
                    <Alert>
                      <AlertDescription>
                        Uw proefperiode eindigt binnenkort. Upgrade naar een betaald plan om door te gaan met SalonSphere.
                      </AlertDescription>
                    </Alert>
                    <Button 
                      onClick={() => handleUpgrade(subscription?.plan_id || '')}
                      className="w-full"
                      size="lg"
                      disabled={(isCreatingTrial || isSimulatingPayment) && selectedPlan === subscription?.plan_id}
                    >
                      {(isCreatingTrial || isSimulatingPayment) && selectedPlan === subscription?.plan_id ? (
                        <LoadingSpinner className="w-4 h-4 mr-2" />
                      ) : (
                        <CreditCard className="w-4 h-4 mr-2" />
                      )}
                      {process.env.NODE_ENV === 'development' ? 'Betalen (Dev Mode)' : 'Upgrade naar betaald plan'}
                    </Button>
                  </div>
                </CardFooter>
              )}
            </Card>
          </div>

          {/* Show other plans for upgrade/downgrade */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-center mb-8">Andere Plannen</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.filter(plan => plan.id !== subscription?.plan_id).map((plan) => (
                <PlanCard 
                  key={plan.id} 
                  plan={plan} 
                  onSelect={() => handleUpgrade(plan.id)}
                  buttonText={process.env.NODE_ENV === 'development' ? 'Betalen (Dev Mode)' : 'Wijzig Plan'}
                  buttonVariant="outline"
                  isLoading={(isCreatingTrial || isSimulatingPayment) && selectedPlan === plan.id}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // New user - show plan selection
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Kies Uw Plan</h1>
          <p className="text-xl text-gray-600 mb-8">
            Start uw 14-daagse gratis proefperiode en ontdek alle mogelijkheden van SalonSphere
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 max-w-2xl mx-auto mb-6">
              <div className="flex items-center justify-center text-orange-800">
                <span className="font-medium">🚧 Development Mode: Betalingen worden gesimuleerd</span>
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-center text-blue-800">
              <Star className="w-5 h-5 mr-2" />
              <span className="font-medium">
                {process.env.NODE_ENV === 'development' 
                  ? '14 dagen gratis proberen • Dev betaling beschikbaar'
                  : '14 dagen gratis proberen • Geen betaalgegevens vereist'
                }
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <PlanCard 
              key={plan.id} 
              plan={plan}
              onTrialSelect={() => handleStartTrial(plan.id)}
              onPaymentSelect={() => handleUpgrade(plan.id)}
              isLoading={(isCreatingTrial || isSimulatingPayment) && selectedPlan === plan.id}
              popular={plan.name === 'Professional'}
              showDevPayment={process.env.NODE_ENV === 'development'}
            />
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm">
            Alle plannen bevatten een 14-daagse gratis proefperiode. U kunt op elk moment opzeggen.
          </p>
        </div>
      </div>
    </div>
  )
}

function PlanCard({ 
  plan, 
  onTrialSelect, 
  onPaymentSelect,
  onSelect, // Legacy support
  isLoading = false, 
  popular = false,
  buttonText = "Start Gratis Proef",
  buttonVariant = "default" as "default" | "outline",
  showDevPayment = false
}) {
  return (
    <Card className={`relative ${popular ? 'border-blue-500 shadow-lg scale-105' : ''}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-blue-500 text-white px-3 py-1">Meest Populair</Badge>
        </div>
      )}
      
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <CardDescription className="text-sm">{plan.description}</CardDescription>
        <div className="mt-4">
          <span className="text-4xl font-bold">
            {subscriptionService.formatPrice(plan.price_cents)}
          </span>
          <span className="text-gray-500">/{plan.billing_interval === 'monthly' ? 'maand' : 'jaar'}</span>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {plan.features && Object.entries(plan.features).map(([key, value]) => {
            if (typeof value === 'boolean' && value) {
              return (
                <div key={key} className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                  {getFeatureDisplayName(key)}
                </div>
              )
            } else if (typeof value === 'number') {
              return (
                <div key={key} className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                  {getFeatureDisplayName(key)}: {value === -1 ? 'Onbeperkt' : value}
                </div>
              )
            }
            return null
          })}
        </div>
      </CardContent>
      
      <CardFooter>
        {showDevPayment ? (
          <div className="w-full space-y-3">
            <Button 
              className="w-full" 
              size="lg"
              onClick={onTrialSelect}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? <LoadingSpinner className="w-4 h-4 mr-2" /> : null}
              Start Gratis Proef
            </Button>
            <Button 
              className="w-full" 
              size="lg"
              onClick={onPaymentSelect}
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner className="w-4 h-4 mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
              Betalen (Dev Mode)
            </Button>
          </div>
        ) : (
          <Button 
            className="w-full" 
            size="lg"
            variant={buttonVariant}
            onClick={onSelect || onTrialSelect}
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner className="w-4 h-4 mr-2" /> : null}
            {buttonText}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

function getFeatureDisplayName(key: string): string {
  const displayNames: Record<string, string> = {
    'max_staff': 'Maximaal personen',
    'max_clients': 'Maximaal klanten',
    'max_services': 'Maximaal diensten',
    'booking_system': 'Online boekingen',
    'basic_reporting': 'Basis rapportages',
    'advanced_reporting': 'Geavanceerde rapportages',
    'custom_reports': 'Aangepaste rapporten',
    'email_notifications': 'E-mail notificaties',
    'sms_notifications': 'SMS notificaties',
    'inventory_management': 'Voorraadbeheer',
    'marketing_tools': 'Marketing tools',
    'api_access': 'API toegang',
    'custom_domain': 'Aangepast domein',
    'priority_support': 'Prioriteitsondersteuning',
    'support': 'Ondersteuning'
  }
  
  return displayNames[key] || key
}