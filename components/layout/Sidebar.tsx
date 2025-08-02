'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Calendar,
  Package,
  Mail,
  BarChart3,
  Users,
  Settings,
  HelpCircle,
  Sparkles,
  Menu,
  X,
  Shield
} from 'lucide-react'
import clsx from 'clsx'
import { LogoDynamic } from '@/components/layout/LogoDynamic'
import { useIsAdmin } from '@/lib/hooks/use-admin'
import { useBusinessLogo } from '@/lib/hooks/useBusinessLogo'
import { useSidebar } from '@/components/providers/SidebarProvider'

const navigationItems = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Agenda', href: '/appointments', icon: Calendar },
  { name: 'Klantbeheer', href: '/clients', icon: Users },
  { name: 'Behandelingen', href: '/treatments', icon: Sparkles },
  { name: 'Voorraadbeheer', href: '/inventory', icon: Package },
  { name: 'E-mail Automatisering', href: '/email-automation', icon: Mail },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isSidebarOpen, closeSidebar } = useSidebar()
  const { isAdmin, isLoading } = useIsAdmin()
  const { logoUrl, salonName } = useBusinessLogo()

  // Close sidebar on desktop when pathname changes
  useEffect(() => {
    if (window.innerWidth < 1024) {
      closeSidebar()
    }
  }, [pathname, closeSidebar])

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={clsx(
        "fixed lg:static inset-y-0 left-0 z-40 w-sidebar bg-sidebar-bg border-r border-sidebar-border flex flex-col transition-transform duration-300 ease-in-out",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="p-4 lg:p-6 border-b border-sidebar-border">
          <LogoDynamic 
            size="sm" 
            customLogoUrl={logoUrl}
            salonName={salonName}
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 lg:px-4 py-4 lg:py-6 space-y-1 lg:space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={closeSidebar}
                className={clsx(
                  'sidebar-item min-h-[44px]', // Minimum touch target size
                  isActive && 'active'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-3 lg:p-4 border-t border-sidebar-border space-y-1 lg:space-y-2">
          {/* Admin Panel Link - Always render but control visibility */}
          <div 
            className={clsx(
              'transition-all duration-200 ease-in-out',
              isAdmin ? 'opacity-100' : 'opacity-0 pointer-events-none',
              !isLoading && !isAdmin && 'hidden' // Only hide after loading completes
            )}
          >
            <Link 
              href="/admin" 
              className={clsx(
                'sidebar-item min-h-[44px]',
                pathname.startsWith('/admin') && 'active'
              )}
              onClick={closeSidebar}
              tabIndex={isAdmin ? 0 : -1} // Prevent keyboard navigation when hidden
            >
              <Shield className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">Admin Panel</span>
            </Link>
          </div>
          <Link 
            href={isAdmin ? "/admin/settings" : "/settings"} 
            className="sidebar-item min-h-[44px]"
            onClick={closeSidebar}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className="truncate">Instellingen</span>
          </Link>
          <Link 
            href="/help" 
            className="sidebar-item min-h-[44px]"
            onClick={closeSidebar}
          >
            <HelpCircle className="w-5 h-5 flex-shrink-0" />
            <span className="truncate">Hulp</span>
          </Link>
        </div>
      </div>
    </>
  )
}