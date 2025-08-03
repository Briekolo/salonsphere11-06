'use client'

import { useState, useRef, useEffect } from 'react'
import { LogOut, User } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'

interface ProfileDropdownProps {
  initials: string
  firstName: string | null
  userEmail?: string
}

export function ProfileDropdown({ initials, firstName, userEmail }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { signOut, user } = useAuth()
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const displayName = firstName || 'Gebruiker'
  const email = userEmail || user?.email || ''

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle logout
  const handleLogout = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (isLoggingOut) return

    setIsLoggingOut(true)
    try {
      // Close dropdown immediately for better UX
      setIsOpen(false)
      
      // Sign out from Supabase
      await signOut()
      
      // Clear all auth-related storage - be very aggressive
      if (typeof window !== 'undefined') {
        // Clear ALL localStorage and sessionStorage
        console.log('Clearing all storage...')
        
        // Get all keys before clearing
        const localStorageKeys = Object.keys(localStorage)
        const sessionStorageKeys = Object.keys(sessionStorage)
        
        // Clear everything
        localStorageKeys.forEach(key => {
          console.log(`Removing localStorage: ${key}`)
          localStorage.removeItem(key)
        })
        
        sessionStorageKeys.forEach(key => {
          console.log(`Removing sessionStorage: ${key}`)
          sessionStorage.removeItem(key)
        })
        
        // Also try to clear cookies
        document.cookie.split(";").forEach(function(c) { 
          const eqPos = c.indexOf("=")
          const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim()
          if (name.includes('supabase') || name.includes('sb-')) {
            document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'
          }
        })
        
        // Clear any IndexedDB
        if ('indexedDB' in window) {
          indexedDB.databases().then(dbs => {
            dbs.forEach(db => {
              if (db.name && (db.name.includes('supabase') || db.name.includes('auth'))) {
                indexedDB.deleteDatabase(db.name)
              }
            })
          })
        }
      }
      
      // Use hard navigation to ensure complete reload
      window.location.href = '/auth/sign-in'
    } catch (error) {
      console.error('Logout error:', error)
      // Still try to redirect even if logout partially fails
      window.location.href = '/auth/sign-in'
    }
  }

  return (
    <div className="relative">
      {/* Profile Button */}
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="w-8 h-8 lg:w-10 lg:h-10 bg-[#02011F] rounded-full flex items-center justify-center text-white text-sm font-medium hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {initials}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="dropdown-right dropdown-width-md py-2 animate-in fade-in-0 zoom-in-95 duration-200"
        >
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#02011F] rounded-full flex items-center justify-center text-white text-sm font-medium">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {displayName}
                </p>
                {email && (
                  <p className="text-xs text-gray-500 truncate">
                    {email}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {/* Profile Option (future enhancement) */}
            <button
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                // Future: navigate to profile page
                setIsOpen(false)
              }}
            >
              <User className="w-4 h-4" />
              Profiel
            </button>

            {/* Logout Option */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="w-4 h-4" />
              {isLoggingOut ? 'Uitloggen...' : 'Uitloggen'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}