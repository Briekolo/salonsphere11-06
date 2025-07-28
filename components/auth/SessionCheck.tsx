'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { supabase } from '@/lib/supabase'

export function SessionCheck() {
  const { user, loading } = useAuth()
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  
  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      const storageKeys = Object.keys(localStorage).filter(key => 
        key.includes('supabase') || key.startsWith('sb-')
      )
      
      setSessionInfo({
        hasUser: !!user,
        hasSession: !!session,
        storageKeys,
        pathname: window.location.pathname
      })
    }
    
    checkSession()
  }, [user])
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  
  return (
    <div className="fixed bottom-4 left-4 bg-black text-white p-4 rounded-lg text-xs max-w-xs z-50">
      <h3 className="font-bold mb-2">Session Debug</h3>
      <div className="space-y-1">
        <div>Loading: {loading ? 'Yes' : 'No'}</div>
        <div>User: {user ? '✓' : '✗'}</div>
        <div>Session: {sessionInfo?.hasSession ? '✓' : '✗'}</div>
        <div>Storage Keys: {sessionInfo?.storageKeys?.length || 0}</div>
        <div>Path: {sessionInfo?.pathname}</div>
      </div>
    </div>
  )
}