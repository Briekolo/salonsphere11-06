'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function MigrateSessionPage() {
  const [status, setStatus] = useState('Checking session...')
  const router = useRouter()

  useEffect(() => {
    async function migrateSession() {
      try {
        // Check if we have a localStorage session
        const localStorageKey = 'sb-client-auth-token'
        const sessionData = localStorage.getItem(localStorageKey)
        
        if (!sessionData) {
          setStatus('No session found in localStorage')
          setTimeout(() => router.push('/auth/sign-in'), 2000)
          return
        }

        setStatus('Found session in localStorage, migrating to cookies...')
        
        // Parse the session
        const parsedSession = JSON.parse(sessionData)
        
        // Force Supabase to use this session and set cookies
        if (parsedSession.access_token && parsedSession.refresh_token) {
          const { data, error } = await supabase.auth.setSession({
            access_token: parsedSession.access_token,
            refresh_token: parsedSession.refresh_token
          })
          
          if (error) {
            setStatus(`Migration error: ${error.message}`)
            return
          }
          
          if (data.session) {
            setStatus('Session migrated successfully! Redirecting...')
            
            // Force a page reload to ensure cookies are set
            setTimeout(() => {
              window.location.href = '/'
            }, 1000)
          }
        } else {
          setStatus('Invalid session data')
        }
        
      } catch (error) {
        console.error('Migration error:', error)
        setStatus('Migration failed. Please sign in again.')
        setTimeout(() => router.push('/auth/sign-in'), 3000)
      }
    }
    
    migrateSession()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-6">Migrating Your Session</h1>
        
        <div className="mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#02011F] mx-auto mb-4"></div>
          <p className="text-gray-600">{status}</p>
        </div>
        
        <div className="text-sm text-gray-500">
          <p>We're updating how authentication works to improve security.</p>
          <p className="mt-2">This should only take a moment...</p>
        </div>
      </div>
    </div>
  )
}