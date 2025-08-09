import { Suspense } from 'react'
import SubscriptionStatusContent from './SubscriptionStatusContent'
import { RefreshCw } from 'lucide-react'

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6">
              <RefreshCw className="w-16 h-16 text-blue-500 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Laden...
            </h1>
            <p className="text-gray-600">
              Een moment geduld alstublieft
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SubscriptionStatusPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SubscriptionStatusContent />
    </Suspense>
  )
}