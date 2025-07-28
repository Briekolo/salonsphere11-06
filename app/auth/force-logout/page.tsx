'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ForceLogoutPage() {
  const [status, setStatus] = useState('Starting cleanup...')
  const [items, setItems] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    async function forceCleanup() {
      const cleanedItems: string[] = []
      
      try {
        // 1. Sign out from Supabase
        setStatus('Signing out from Supabase...')
        try {
          await supabase.auth.signOut()
          cleanedItems.push('✅ Supabase sign out')
        } catch (e) {
          cleanedItems.push('⚠️ Supabase sign out failed (continuing anyway)')
        }
        
        // 2. Clear ALL localStorage items
        setStatus('Clearing localStorage...')
        const localStorageKeys = Object.keys(localStorage)
        localStorageKeys.forEach(key => {
          localStorage.removeItem(key)
          cleanedItems.push(`🗑️ Removed localStorage: ${key}`)
        })
        
        // 3. Clear ALL sessionStorage items
        setStatus('Clearing sessionStorage...')
        const sessionStorageKeys = Object.keys(sessionStorage)
        sessionStorageKeys.forEach(key => {
          sessionStorage.removeItem(key)
          cleanedItems.push(`🗑️ Removed sessionStorage: ${key}`)
        })
        
        // 4. Clear all cookies (what we can access)
        setStatus('Clearing cookies...')
        document.cookie.split(";").forEach(function(c) { 
          const eqPos = c.indexOf("=")
          const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim()
          // Try multiple deletion patterns
          document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT'
          document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'
          document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=' + window.location.hostname
          document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.' + window.location.hostname
          cleanedItems.push(`🍪 Attempted to clear cookie: ${name}`)
        })
        
        // 5. Clear IndexedDB
        setStatus('Clearing IndexedDB...')
        if ('indexedDB' in window) {
          const databases = await indexedDB.databases()
          for (const db of databases) {
            if (db.name) {
              try {
                indexedDB.deleteDatabase(db.name)
                cleanedItems.push(`💾 Deleted IndexedDB: ${db.name}`)
              } catch (e) {
                cleanedItems.push(`⚠️ Failed to delete IndexedDB: ${db.name}`)
              }
            }
          }
        }
        
        // 6. Unregister service workers
        setStatus('Unregistering service workers...')
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations()
          for (const registration of registrations) {
            await registration.unregister()
            cleanedItems.push(`👷 Unregistered service worker`)
          }
        }
        
        // 7. Clear caches
        setStatus('Clearing caches...')
        if ('caches' in window) {
          const cacheNames = await caches.keys()
          for (const cacheName of cacheNames) {
            await caches.delete(cacheName)
            cleanedItems.push(`📦 Deleted cache: ${cacheName}`)
          }
        }
        
        setItems(cleanedItems)
        setStatus('✅ Complete cleanup finished!')
        
        // Wait a moment then redirect
        setTimeout(() => {
          window.location.href = '/auth/sign-in'
        }, 3000)
        
      } catch (error) {
        console.error('Force cleanup error:', error)
        setStatus('❌ Error during cleanup, but continuing...')
        // Still try to redirect
        setTimeout(() => {
          window.location.href = '/auth/sign-in'
        }, 3000)
      }
    }
    
    forceCleanup()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full">
        <h1 className="text-2xl font-bold mb-6">Force Logout & Clear All Data</h1>
        
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            {status.includes('✅') ? (
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#02011F]"></div>
            )}
            <p className="text-lg font-medium">{status}</p>
          </div>
          
          {items.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <h3 className="font-semibold mb-2">Cleanup Log:</h3>
              <ul className="space-y-1 text-sm font-mono">
                {items.map((item, index) => (
                  <li key={index} className="text-gray-600">{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {status.includes('✅') && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">
              All authentication data has been cleared. Redirecting to sign-in page in 3 seconds...
            </p>
          </div>
        )}
        
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => window.location.href = '/auth/sign-in'}
            className="btn-primary"
          >
            Go to Sign In Now
          </button>
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary"
          >
            Retry Cleanup
          </button>
        </div>
        
        <div className="mt-6 text-sm text-gray-500">
          <p>This page performs a complete cleanup of:</p>
          <ul className="list-disc list-inside mt-1">
            <li>Supabase authentication session</li>
            <li>All localStorage items</li>
            <li>All sessionStorage items</li>
            <li>All accessible cookies</li>
            <li>IndexedDB databases</li>
            <li>Service workers</li>
            <li>Browser caches</li>
          </ul>
        </div>
      </div>
    </div>
  )
}