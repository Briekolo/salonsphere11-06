import { Suspense } from 'react'
import OnboardingForm from '@/components/onboarding/OnboardingForm'

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Suspense fallback={
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#02011F] mx-auto"></div>
          <p className="mt-4 text-gray-600">Laden...</p>
        </div>
      }>
        <OnboardingForm />
      </Suspense>
    </div>
  )
} 