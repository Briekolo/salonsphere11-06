'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { CheckCircle, Clock, XCircle, RefreshCw, AlertCircle } from 'lucide-react'

export default function SubscriptionStatusPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { 
    hasActiveSubscription, 
    subscriptionStatus, 
    loading, 
    syncPaymentStatus,
    isSyncingPaymentStatus 
  } = useSubscription()
  
  const [checkCount, setCheckCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [manualRefreshing, setManualRefreshing] = useState(false)
  
  const paymentId = searchParams.get('payment')
  const tenantId = searchParams.get('tenant')
  const success = searchParams.get('success')
  
  // Maximum checks before timeout (30 seconds / 2 second intervals = 15 checks)
  const MAX_CHECKS = 15
  
  useEffect(() => {
    // If no payment parameters, redirect to onboarding
    if (!paymentId || !tenantId || success !== 'true') {
      router.replace('/onboarding')
      return
    }
    
    // If subscription is already active, redirect to dashboard
    if (hasActiveSubscription && !loading) {
      router.replace('/')
      return
    }
    
    // Poll for subscription status
    const interval = setInterval(() => {
      setCheckCount(prev => {
        const newCount = prev + 1
        
        // Timeout after MAX_CHECKS attempts
        if (newCount >= MAX_CHECKS) {
          setError('Het verwerken van uw betaling duurt langer dan verwacht. Probeer de pagina te vernieuwen of neem contact op met support.')
          clearInterval(interval)
          return prev
        }
        
        return newCount
      })
      
      // Trigger status sync
      syncPaymentStatus()
    }, 2000) // Check every 2 seconds
    
    return () => clearInterval(interval)
  }, [paymentId, tenantId, success, hasActiveSubscription, loading, router, syncPaymentStatus])
  
  const handleManualRefresh = async () => {
    setManualRefreshing(true)
    setError(null)
    setCheckCount(0)
    
    try {
      await syncPaymentStatus()
      
      // Wait a bit and check again
      setTimeout(() => {
        if (hasActiveSubscription) {
          router.replace('/')
        } else {
          setError('Abonnement nog niet actief. Probeer het over enkele momenten opnieuw.')
        }
        setManualRefreshing(false)
      }, 2000)
    } catch (err) {
      setError('Er is een fout opgetreden bij het vernieuwen. Probeer het opnieuw.')
      setManualRefreshing(false)
    }
  }
  
  const getStatusIcon = () => {
    if (error) {
      return <XCircle className="w-16 h-16 text-red-500" />
    }
    
    if (hasActiveSubscription) {
      return <CheckCircle className="w-16 h-16 text-green-500" />
    }
    
    return <Clock className="w-16 h-16 text-blue-500 animate-pulse" />
  }
  
  const getStatusMessage = () => {
    if (error) {
      return 'Betaling verwerking vertraagd'
    }
    
    if (hasActiveSubscription) {
      return 'Betaling succesvol!'
    }
    
    return 'Betaling wordt verwerkt...'
  }
  
  const getStatusDescription = () => {
    if (error) {
      return error
    }
    
    if (hasActiveSubscription) {
      return 'Uw abonnement is nu actief. U wordt doorgestuurd naar het dashboard...'
    }
    
    if (checkCount > 5) {
      return 'Dit duurt iets langer dan normaal. Een moment geduld alstublieft...'
    }
    
    return 'We zijn uw betaling aan het verwerken. Dit duurt meestal enkele seconden.'
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center text-center">
            {/* Status Icon */}
            <div className="mb-6">
              {getStatusIcon()}
            </div>
            
            {/* Status Message */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {getStatusMessage()}
            </h1>
            
            {/* Status Description */}
            <p className="text-gray-600 mb-6">
              {getStatusDescription()}
            </p>
            
            {/* Progress indicator */}
            {!error && !hasActiveSubscription && (
              <div className="w-full mb-6">
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                  <span className="text-sm text-gray-500">
                    Controleren... (poging {Math.min(checkCount + 1, MAX_CHECKS)} van {MAX_CHECKS})
                  </span>
                </div>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((checkCount / MAX_CHECKS) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              {error && (
                <>
                  <button
                    onClick={handleManualRefresh}
                    disabled={manualRefreshing || isSyncingPaymentStatus}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    {manualRefreshing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Vernieuwen...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Opnieuw proberen
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => router.push('/onboarding')}
                    className="flex-1 btn-outlined"
                  >
                    Terug naar onboarding
                  </button>
                </>
              )}
              
              {hasActiveSubscription && (
                <button
                  onClick={() => router.push('/')}
                  className="w-full btn-primary"
                >
                  Naar dashboard
                </button>
              )}
            </div>
            
            {/* Support info */}
            {error && (
              <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-amber-900 mb-1">
                      Hulp nodig?
                    </p>
                    <p className="text-xs text-amber-700">
                      Als dit probleem blijft bestaan, neem dan contact op met support@salonsphere.nl 
                      met uw betalingsreferentie: <code className="bg-amber-100 px-1 py-0.5 rounded">{paymentId}</code>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Additional info */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Betalingsreferentie: {paymentId}
          </p>
        </div>
      </div>
    </div>
  )
}