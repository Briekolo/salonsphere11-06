'use client'

import { useState, useRef, useEffect } from 'react'
import { LogOut, User } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'

interface SafeProfileButtonProps {
  initials: string
  firstName: string | null
  userEmail?: string
}

export function SafeProfileButton({ initials, firstName, userEmail }: SafeProfileButtonProps) {
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
  const handleLogout = async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    try {
      setIsOpen(false)
      await signOut()
      router.push('/auth/sign-in')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="relative">
      {/* Profile Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px]"
        disabled={isLoggingOut}
      >
        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
          <span className="text-xs font-semibold text-primary-700">{initials}</span>
        </div>
        <span className="hidden xl:inline text-sm font-medium text-gray-900">{displayName}</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 py-2 z-50"
        >
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-700">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                <p className="text-xs text-gray-500 truncate">{email}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false)
                router.push('/profile')
              }}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User className="w-4 h-4" />
              Profiel
            </button>
            
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
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