'use client'

import { Bell, Plus, HelpCircle, MoreVertical, Menu, User, LogOut } from 'lucide-react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { supabase } from '@/lib/supabase'
import { ProfileDropdown } from '@/components/ui/ProfileDropdown'
import { NotificationWrapper } from '@/components/notifications/NotificationWrapper'
import { SafeNotificationButton } from '@/components/ui/SafeNotificationButton'
import { SafeProfileButton } from '@/components/ui/SafeProfileButton'
import { SafeComponentWrapper } from '@/components/ui/SafeComponentWrapper'
import { LogoDynamic } from '@/components/layout/LogoDynamic'
import { useBusinessLogo } from '@/lib/hooks/useBusinessLogo'

interface TopBarProps {
  onMobileSidebarToggle?: () => void
}

export function TopBar({ onMobileSidebarToggle }: TopBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const today = new Date()
  const [greeting, setGreeting] = useState('')
  const { user, signOut } = useAuth()
  const [firstName, setFirstName] = useState<string | null>(null)
  const [isLoadingName, setIsLoadingName] = useState(true)
  const { logoUrl, salonName } = useBusinessLogo()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)
  
  // Memoized handlers to improve performance
  const handleMobileMenuToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMobileMenuOpen(prev => !prev)
  }, [])
  
  const handleSidebarToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (onMobileSidebarToggle) {
      onMobileSidebarToggle()
    }
  }, [onMobileSidebarToggle])

  useEffect(() => {
    async function fetchFirstName() {
      if (!user) {
        setIsLoadingName(false)
        return
      }
      
      try {
        // First try to get from user metadata (faster)
        const userMetaName = user.user_metadata?.first_name
        if (userMetaName) {
          setFirstName(userMetaName)
          setIsLoadingName(false)
          return
        }

        // Then try database with retry
        let retries = 0
        const maxRetries = 3
        
        while (retries < maxRetries) {
          const { data, error } = await supabase
            .from('users')
            .select('first_name')
            .eq('id', user.id)
            .single()
            
          if (!error && data?.first_name) {
            setFirstName(data.first_name)
            setIsLoadingName(false)
            return
          }
          
          if (error && error.code !== 'PGRST116') { // Not a "not found" error
            console.warn(`Failed to fetch user name (attempt ${retries + 1}):`, error)
          }
          
          retries++
          if (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retries)) // Exponential backoff
          }
        }
        
        // Fallback to email-based name
        const emailName = user.email?.split('@')[0] || 'Gebruiker'
        setFirstName(emailName)
      } catch (err) {
        console.error('Error fetching user name:', err)
        const emailName = user.email?.split('@')[0] || 'Gebruiker'
        setFirstName(emailName)
      } finally {
        setIsLoadingName(false)
      }
    }
    
    fetchFirstName()
  }, [user])

  const name = firstName ?? 'Gebruiker'

  const initials = (firstName ?? user?.email?.split('@')[0] ?? 'Gebruiker')
    .split(' ')
    .map((n: string) => n.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()

  useEffect(() => {
    setGreeting(getGreeting())
  }, [])
  
  // Handle click outside for mobile menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        mobileMenuRef.current &&
        mobileMenuButtonRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        !mobileMenuButtonRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileMenuOpen])
  
  const isDashboard = pathname === '/'

  // Safe component wrappers with error boundaries
  const SafeNotificationComponent = ({ instanceType = 'desktop' }: { instanceType?: 'desktop' | 'mobile' }) => (
    <SafeComponentWrapper 
      fallback={<SafeNotificationButton />}
      errorName="NotificationPopup"
    >
      <NotificationWrapper instanceType={instanceType} />
    </SafeComponentWrapper>
  )

  const SafeProfileComponent = () => (
    <SafeComponentWrapper 
      fallback={
        <SafeProfileButton 
          initials={initials}
          firstName={firstName}
          userEmail={user?.email}
        />
      }
      errorName="ProfileDropdown"
    >
      <ProfileDropdown 
        initials={initials}
        firstName={firstName}
        userEmail={user?.email}
      />
    </SafeComponentWrapper>
  )
  
  return (
    <>
      {/* Mobile TopBar */}
      <header className="lg:hidden bg-background border-b border-gray-200 sticky top-0 z-10">
        {/* Mobile Header Row */}
        <div className="flex items-center justify-between px-4 py-3">
          {/* Hamburger Menu */}
          <button
            onClick={handleSidebarToggle}
            className="flex flex-col items-center justify-center w-10 h-10 gap-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Menu"
          >
            <span className="block w-5 h-0.5 bg-gray-700"></span>
            <span className="block w-5 h-0.5 bg-gray-700"></span>
          </button>

          {/* Logo */}
          <div className="flex-1 flex justify-center">
            <LogoDynamic 
              size="sm" 
              customLogoUrl={logoUrl}
              salonName={salonName}
            />
          </div>

          {/* Three Dots Menu */}
          <button
            ref={mobileMenuButtonRef}
            onClick={handleMobileMenuToggle}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="More options"
          >
            <MoreVertical className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Greeting Section */}
        <div className="px-4 pb-3">
          <h1 className="text-lg font-semibold text-gray-900">
            {greeting}, {isLoadingName ? (
              <span className="inline-block animate-pulse bg-gray-200 rounded h-5 w-20"></span>
            ) : (
              name
            )}
          </h1>
          <p className="text-xs text-muted">
            {format(today, 'EEEE d MMMM yyyy', { locale: nl })}
          </p>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Dropdown */}
            <div
              ref={mobileMenuRef}
              className="absolute right-2 top-12 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-64 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="py-2">
                {/* Notifications */}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    router.push('/notifications')
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="relative">
                    <Bell className="w-5 h-5 text-gray-700" />
                    {/* Add unread count badge if needed */}
                  </div>
                  <span className="text-sm font-medium text-gray-900">Meldingen</span>
                </button>
                
                {/* Divider */}
                <div className="h-px bg-gray-200 my-1" />
                
                {/* Profile Section */}
                <div className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#02011F] rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {firstName || 'Gebruiker'}
                      </p>
                      {user?.email && (
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Profile Actions */}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    router.push('/profile')
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <User className="w-5 h-5 text-gray-700" />
                  <span className="text-sm text-gray-700">Profiel</span>
                </button>
                
                <button
                  onClick={async () => {
                    setIsMobileMenuOpen(false)
                    await signOut()
                    window.location.href = '/auth/sign-in'
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-red-600">Uitloggen</span>
                </button>
              </div>
            </div>
          </>
        )}
      </header>

      {/* Desktop TopBar */}
      <header className="hidden lg:block bg-background border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-3 lg:py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          {/* Left side - Greeting */}
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 truncate">
              {greeting}, {isLoadingName ? (
                <span className="inline-block animate-pulse bg-gray-200 rounded h-5 w-20"></span>
              ) : (
                name
              )}
            </h1>
            <p className="text-xs lg:text-sm text-muted">
              {format(today, 'EEEE d MMMM yyyy', { locale: nl })}
            </p>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
            {/* Notifications */}
            <SafeNotificationComponent instanceType="desktop" />

            {/* Profile */}
            <SafeProfileComponent />
            
            {/* New Appointment Button */}
            {isDashboard && (
              <button 
                onClick={() => router.push('/appointments')}
                className="flex btn-primary items-center gap-2 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden xl:inline">Nieuwe afspraak</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile FAB */}
      {isDashboard && (
        <button 
          onClick={() => router.push('/appointments')}
          className="fixed bottom-6 right-4 lg:hidden w-14 h-14 bg-[#02011F] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-opacity-90 transition-all z-20"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  
  if (hour < 12) return 'Goedemorgen'
  if (hour < 18) return 'Goedemiddag'
  return 'Goedenavond'
}