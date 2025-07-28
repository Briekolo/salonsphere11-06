'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function TestAuthPage() {
  const { user, loading } = useAuth()
  const [sessionData, setSessionData] = useState<any>(null)
  const [apiCheck, setApiCheck] = useState<any>(null)
  
  useEffect(() => {
    async function checkEverything() {
      // Check Supabase session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      // Check localStorage
      const storageItems: Record<string, string> = {}
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.startsWith('sb-')) {
          storageItems[key] = localStorage.getItem(key)?.substring(0, 50) + '...'
        }
      })
      
      setSessionData({
        session: session ? {
          userId: session.user.id,
          email: session.user.email,
          expiresAt: new Date(session.expires_at! * 1000).toLocaleString(),
          tenantId: session.user.user_metadata?.tenant_id
        } : null,
        error: error?.message,
        localStorage: storageItems,
        cookies: document.cookie.split(';').filter(c => 
          c.includes('supabase') || c.includes('sb-')
        )
      })
      
      // Check API endpoint
      try {
        const response = await fetch('/api/auth/check')
        const data = await response.json()
        setApiCheck(data)
      } catch (err) {
        setApiCheck({ error: 'Failed to check API' })
      }
    }
    
    checkEverything()
  }, [])
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Authentication Test Page</h1>
        
        {/* AuthProvider Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">AuthProvider Status</h2>
          <div className="space-y-2">
            <p>Loading: {loading ? '🔄 Yes' : '✅ No'}</p>
            <p>User Present: {user ? '✅ Yes' : '❌ No'}</p>
            {user && (
              <>
                <p>User ID: {user.id}</p>
                <p>Email: {user.email}</p>
              </>
            )}
          </div>
        </div>
        
        {/* Direct Supabase Check */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Direct Supabase Session</h2>
          {sessionData ? (
            <div className="space-y-2">
              <p>Session: {sessionData.session ? '✅ Active' : '❌ None'}</p>
              {sessionData.session && (
                <>
                  <p>User ID: {sessionData.session.userId}</p>
                  <p>Email: {sessionData.session.email}</p>
                  <p>Tenant ID: {sessionData.session.tenantId || 'None'}</p>
                  <p>Expires: {sessionData.session.expiresAt}</p>
                </>
              )}
              {sessionData.error && <p className="text-red-600">Error: {sessionData.error}</p>}
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </div>
        
        {/* API Check */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">API Endpoint Check</h2>
          {apiCheck ? (
            <pre className="text-xs overflow-auto bg-gray-50 p-2 rounded">
              {JSON.stringify(apiCheck, null, 2)}
            </pre>
          ) : (
            <p>Loading...</p>
          )}
        </div>
        
        {/* LocalStorage */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">LocalStorage Auth Keys</h2>
          {sessionData?.localStorage && Object.keys(sessionData.localStorage).length > 0 ? (
            <div className="space-y-1 text-sm">
              {Object.entries(sessionData.localStorage).map(([key, value]) => (
                <div key={key} className="font-mono">
                  <strong>{key}:</strong> {value}
                </div>
              ))}
            </div>
          ) : (
            <p>No auth-related localStorage items found</p>
          )}
        </div>
        
        {/* Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-x-4">
            <Link href="/" className="btn-primary">
              Go to Dashboard
            </Link>
            <Link href="/auth/sign-in" className="btn-secondary">
              Go to Sign In
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary"
            >
              Reload Page
            </button>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <p className="text-sm">
            <strong>Note:</strong> This page should only be accessible if you're authenticated. 
            If you can see this without being logged in, there's an authentication bypass issue.
          </p>
        </div>
      </div>
    </div>
  )
}