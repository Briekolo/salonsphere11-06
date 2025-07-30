'use client'

import { Search, Bell, Plus, HelpCircle } from 'lucide-react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { supabase } from '@/lib/supabase'
import { ProfileDropdown } from '@/components/ui/ProfileDropdown'
import { NotificationPopup } from '@/components/notifications/NotificationPopup'

export function TopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const today = new Date()
  const [greeting, setGreeting] = useState('')
  const { user } = useAuth()
  const [firstName, setFirstName] = useState<string | null>(null)
  const [isLoadingName, setIsLoadingName] = useState(true)

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
  const isDashboard = pathname === '/'
  
  return (
    <header className="bg-background border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-3 lg:py-4 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        {/* Left side - Greeting */}
        <div className="flex-1 min-w-0 ml-12 lg:ml-0">
          <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 truncate">
            {greeting}, {isLoadingName ? (
              <span className="inline-block animate-pulse bg-gray-200 rounded h-5 w-20"></span>
            ) : (
              name
            )}
          </h1>
          <p className="text-xs lg:text-sm text-muted hidden sm:block">
            {format(today, 'EEEE d MMMM yyyy', { locale: nl })}
          </p>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
          {/* Search - Hidden on mobile */}
          <button className="hidden sm:flex p-2 text-[#02011F] hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] items-center justify-center">
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          
          {/* Notifications */}
          <NotificationPopup />

          {/* Profile */}
          <ProfileDropdown 
            initials={initials}
            firstName={firstName}
            userEmail={user?.email}
          />
          
          {/* New Appointment Button - Mobile FAB on dashboard, button on larger screens */}
          {isDashboard && (
            <>
              <button 
                onClick={() => router.push('/appointments')}
                className="hidden lg:flex btn-primary items-center gap-2 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden xl:inline">Nieuwe afspraak</span>
              </button>
              
              {/* Mobile FAB */}
              <button 
                onClick={() => router.push('/appointments')}
                className="fixed bottom-6 right-4 lg:hidden w-14 h-14 bg-[#02011F] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-opacity-90 transition-all z-20"
              >
                <Plus className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  
  if (hour < 12) return 'Goedemorgen'
  if (hour < 18) return 'Goedemiddag'
  return 'Goedenavond'
}