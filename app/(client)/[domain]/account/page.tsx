'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useClientAuthContext } from '@/components/client/auth/ClientAuthProvider'
import { Loader2 } from 'lucide-react'
import { use } from 'react'

export default function AccountPage({ params }: { params: Promise<{ domain: string }> }) {
  const router = useRouter()
  const { isAuthenticated, loading } = useClientAuthContext()
  const resolvedParams = use(params)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Redirect to login with return URL
      router.push(`/${resolvedParams.domain}/auth/login?returnUrl=/${resolvedParams.domain}/account/dashboard`)
    } else if (!loading && isAuthenticated) {
      // Redirect to dashboard if authenticated
      router.push(`/${resolvedParams.domain}/account/dashboard`)
    }
  }, [isAuthenticated, loading, router, resolvedParams.domain])

  // Show loading while checking auth
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
        <p className="text-gray-600">Even geduld...</p>
      </div>
    </div>
  )
}