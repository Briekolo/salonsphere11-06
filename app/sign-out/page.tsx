'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function SignOutPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignOut = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Clear all local storage
      localStorage.clear()
      sessionStorage.clear()
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Sign out error:', error)
        setError(error.message)
      } else {
        // Force redirect to sign-in page
        window.location.href = '/auth/sign-in'
      }
    } catch (err) {
      console.error('Unexpected error during sign out:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Auto sign out on mount
  useEffect(() => {
    handleSignOut()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="mb-4">
          <LogOut className="w-12 h-12 mx-auto text-gray-600" />
        </div>
        
        <h1 className="text-xl font-semibold mb-2">Signing Out...</h1>
        
        {loading && (
          <p className="text-gray-600 mb-4">Please wait while we sign you out...</p>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        
        <button
          onClick={handleSignOut}
          disabled={loading}
          className="w-full bg-red-600 text-white rounded-lg px-4 py-2 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Signing out...' : 'Click here to sign out'}
        </button>
        
        <div className="mt-4 text-sm text-gray-500">
          <p>This is a temporary sign-out page.</p>
          <p>You will be redirected to the login page after signing out.</p>
        </div>
      </div>
    </div>
  )
}