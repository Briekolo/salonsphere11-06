'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Calendar,
  Scissors,
  Package,
  CreditCard,
  Mail,
  BarChart3,
  Users,
  Settings,
  HelpCircle,
  ChevronDown,
  Sparkles,
  PieChart,
  Menu,
  X,
  Shield,
  FileText
} from 'lucide-react'
import clsx from 'clsx'
import { Logo } from '@/components/layout/Logo'
import { useIsAdmin } from '@/lib/hooks/use-admin'

const navigationItems = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Agenda', href: '/appointments', icon: Calendar },
  { name: 'Klantbeheer', href: '/clients', icon: Users },
  { name: 'Behandelingen', href: '/treatments', icon: Sparkles },
  { name: 'Facturen', href: '/invoices', icon: FileText },
  { name: 'Voorraadbeheer', href: '/inventory', icon: Package },
  { name: 'Marketing', href: '/marketing', icon: Mail },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isAdmin } = useIsAdmin()

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-lg"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6 text-gray-600" />
        ) : (
          <Menu className="w-6 h-6 text-gray-600" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div className={clsx(
        "fixed lg:static inset-y-0 left-0 z-40 w-sidebar bg-sidebar-bg border-r border-sidebar-border flex flex-col transition-transform duration-300 ease-in-out",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="p-4 lg:p-6 border-b border-sidebar-border">
          <Logo size="sm" />
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
          {isAdmin && (
            <Link 
              href="/admin" 
              className={clsx(
                'sidebar-item min-h-[44px]',
                pathname.startsWith('/admin') && 'active'
              )}
              onClick={closeMobileMenu}
            >
              <Shield className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">Admin Panel</span>
            </Link>
          )}
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