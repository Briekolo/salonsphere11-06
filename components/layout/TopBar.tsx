'use client'

import { Search, Bell, Plus, HelpCircle } from 'lucide-react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { supabase } from '@/lib/supabase'

export function TopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const today = new Date()
  const [greeting, setGreeting] = useState('')
  const { user } = useAuth()
  const [firstName, setFirstName] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFirstName() {
      if (!user) return
      const { data, error } = await supabase
        .from('users')
        .select('first_name')
        .eq('id', user.id)
        .single()
      if (!error) {
        setFirstName(data?.first_name ?? null)
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
    <header className="bg-background border-b border-gray-200 px-4 lg:px-6 py-3 lg:py-4 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        {/* Left side - Greeting */}
        <div className="flex-1 min-w-0 ml-12 lg:ml-0">
          <h1 className="text-lg lg:text-xl font-semibold text-gray-900 truncate">
            {greeting}, {firstName === null ? <span className="opacity-0">Laden...</span> : name}
          </h1>
          <p className="text-xs lg:text-sm text-muted hidden sm:block">
            {format(today, 'EEEE d MMMM yyyy', { locale: nl })}
          </p>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Search - Hidden on mobile */}
          <button className="hidden sm:flex p-2 text-[#02011F] hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] items-center justify-center">
            <Search className="w-5 h-5" />
          </button>
          
          {/* Notifications */}
          <button className="p-2 text-[#02011F] hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors relative min-h-[44px] min-w-[44px] flex items-center justify-center">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full border-2 border-white"></span>
          </button>

          {/* Profile */}
          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-[#02011F] rounded-full flex items-center justify-center text-white text-sm font-medium">
            {initials}
          </div>
          
          {/* New Appointment Button - Only on dashboard and larger screens */}
          {isDashboard && (
            <button 
              onClick={() => router.push('/appointments')}
              className="hidden lg:flex btn-primary items-center gap-2 min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xl:inline">Nieuwe afspraak</span>
            </button>
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