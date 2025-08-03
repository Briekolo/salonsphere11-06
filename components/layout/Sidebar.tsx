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

const navigationItems = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Agenda', href: '/appointments', icon: Calendar },
  { name: 'Klantbeheer', href: '/clients', icon: Users },
  { name: 'Behandelingen', href: '/treatments', icon: Sparkles },
  { name: 'Voorraadbeheer', href: '/inventory', icon: Package },
  { name: 'E-mail Automatisering', href: '/email-automation', icon: Mail },
]

interface SidebarProps {
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const { isAdmin, isLoading } = useIsAdmin()
  const { logoUrl, salonName } = useBusinessLogo()

  const closeMobileMenu = () => {
    onMobileClose?.()
  }
  
  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileOpen])

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={clsx(
          "lg:hidden fixed inset-0 bg-black z-40 transition-opacity duration-300",
          isMobileOpen ? "opacity-50" : "opacity-0 pointer-events-none"
        )}
        onClick={closeMobileMenu}
      />

      {/* Sidebar */}
      <div className={clsx(
        "fixed inset-y-0 left-0 z-50 w-sidebar bg-sidebar-bg border-r border-sidebar-border flex flex-col transition-transform duration-300 ease-in-out",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo and Close Button */}
        <div className="relative p-4 lg:p-6 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <LogoDynamic 
              size="sm" 
              customLogoUrl={logoUrl}
              salonName={salonName}
            />
            {/* Mobile Close Button */}
            <button
              onClick={closeMobileMenu}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Sluit menu"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
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
                onClick={closeMobileMenu}
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
              onClick={closeMobileMenu}
              tabIndex={isAdmin ? 0 : -1} // Prevent keyboard navigation when hidden
            >
              <Shield className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">Admin Panel</span>
            </Link>
          </div>
          <Link 
            href={isAdmin ? "/admin/settings" : "/settings"} 
            className="sidebar-item min-h-[44px]"
            onClick={closeMobileMenu}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className="truncate">Instellingen</span>
          </Link>
          <Link 
            href="/help" 
            className="sidebar-item min-h-[44px]"
            onClick={closeMobileMenu}
          >
            <HelpCircle className="w-5 h-5 flex-shrink-0" />
            <span className="truncate">Hulp</span>
          </Link>
        </div>
      </div>
    </>
  )
}