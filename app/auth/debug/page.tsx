'use client'

import { useEffect, useState } from 'react'
import { getAuthDebugInfo } from '@/lib/utils/auth-debug'
import { useAuth } from '@/components/auth/AuthProvider'
import Link from 'next/link'

export default function AuthDebugPage() {
  const { user } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadDebugInfo() {
      const info = await getAuthDebugInfo()
      setDebugInfo(info)
      setIsLoading(false)
    }
    loadDebugInfo()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#02011F] mx-auto"></div>
          <p className="mt-4 text-gray-600">Laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold mb-6">Auth Debug Info</h1>
          
          <div className="space-y-6">
            {/* Session Info */}
            <div>
              <h2 className="text-lg font-semibold mb-2">Session Status</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Session Exists:</span>
                  <span className={debugInfo?.sessionExists ? 'text-green-600' : 'text-red-600'}>
                    {debugInfo?.sessionExists ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">User ID:</span>
                  <span className="font-mono text-sm">{debugInfo?.userId || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span>{debugInfo?.email || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tenant ID:</span>
                  <span className="font-mono text-sm">{debugInfo?.tenantId || 'None'}</span>
                </div>
              </div>
            </div>

            {/* Connection Test */}
            <div>
              <h2 className="text-lg font-semibold mb-2">Connection Test</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Supabase URL:</span>
                  <span className="font-mono text-xs">{debugInfo?.supabaseUrl}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Connection Success:</span>
                  <span className={debugInfo?.connectionTest?.success ? 'text-green-600' : 'text-red-600'}>
                    {debugInfo?.connectionTest?.success ? 'Yes' : 'No'}
                  </span>
                </div>
                {debugInfo?.connectionTest?.error && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-red-600 text-sm">
                    Error: {debugInfo.connectionTest.error}
                  </div>
                )}
              </div>
            </div>

            {/* Storage Keys */}
            <div>
              <h2 className="text-lg font-semibold mb-2">Storage Keys</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                {debugInfo?.storageKeys?.length > 0 ? (
                  <ul className="space-y-1">
                    {debugInfo.storageKeys.map((key: string) => (
                      <li key={key} className="font-mono text-sm text-gray-600">{key}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No auth-related storage keys found</p>
                )}
              </div>
            </div>

            {/* AuthProvider Info */}
            <div>
              <h2 className="text-lg font-semibold mb-2">AuthProvider State</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">User from Context:</span>
                  <span className={user ? 'text-green-600' : 'text-red-600'}>
                    {user ? 'Present' : 'None'}
                  </span>
                </div>
                {user && (
                  <div className="mt-2 text-sm text-gray-600">
                    <p>ID: {user.id}</p>
                    <p>Email: {user.email}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <Link href="/auth/sign-in" className="btn-secondary">
              Go to Sign In
            </Link>
            <Link href="/" className="btn-primary">
              Go to Dashboard
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary"
            >
              Refresh Page
            </button>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> This debug page helps diagnose authentication issues. 
            Add <code className="bg-amber-100 px-1 rounded">?debug=auth</code> to any page URL 
            to enable console logging.
          </p>
        </div>
      </div>
    </div>
  )
}