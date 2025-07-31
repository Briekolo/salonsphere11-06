'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LogoDynamic } from '@/components/layout/LogoDynamic';
import { useBusinessLogo } from '@/lib/hooks/useBusinessLogo';
import {
  LayoutDashboard,
  Settings,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  Mail,
  Plug,
  Database,
  Shield,
  ArrowLeft,
  ChevronDown,
  Building2,
  Clock,
  Calculator,
  Link2,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  { name: 'Admin Dashboard', href: '/admin', icon: LayoutDashboard },
  { 
    name: 'Instellingen', 
    href: '/admin/settings', 
    icon: Settings,
    children: [
      { name: 'Salon Profiel', href: '/admin/settings', icon: Building2 },
      { name: 'Domein Instellingen', href: '/admin/settings/domain', icon: Link2 },
      { name: 'Openingstijden', href: '/admin/settings/hours', icon: Clock },
      { name: 'BTW Instellingen', href: '/admin/settings/tax', icon: Calculator },
      { name: 'Overhead Kosten', href: '/admin/settings/overhead', icon: Calculator },
    ]
  },
  { name: 'Medewerkers', href: '/admin/staff', icon: Users },
  { name: 'Facturatie', href: '/admin/billing', icon: FileText },
  { name: 'Abonnement', href: '/admin/subscription', icon: CreditCard },
  { name: 'Rapporten', href: '/admin/reports', icon: BarChart3 },
  { name: 'Email & Notificaties', href: '/admin/notifications', icon: Mail },
  { name: 'Integraties', href: '/admin/integrations', icon: Plug },
  { name: 'Data Beheer', href: '/admin/data', icon: Database },
  { name: 'Beveiliging', href: '/admin/security', icon: Shield },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { logoUrl, salonName } = useBusinessLogo();
  
  // Automatically expand settings if on a settings page
  const initialExpanded = pathname.startsWith('/admin/settings') ? ['Instellingen'] : [];
  const [expandedItems, setExpandedItems] = useState<string[]>(initialExpanded);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.href || (item.children && item.children.some(child => pathname === child.href));
    const isExpanded = expandedItems.includes(item.name);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.name}>
        {hasChildren ? (
          <button
            onClick={() => toggleExpanded(item.name)}
            className={cn(
              'sidebar-item group flex w-full items-center justify-between rounded-xl',
              isActive && 'active'
            )}
          >
            <div className="flex items-center">
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {item.name}
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform',
                isExpanded ? 'rotate-180' : ''
              )}
            />
          </button>
        ) : (
          <Link
            href={item.href}
            className={cn(
              'sidebar-item group flex items-center rounded-xl',
              isActive && 'active'
            )}
          >
            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
            {item.name}
          </Link>
        )}
        
        {hasChildren && isExpanded && (
          <div className="ml-6 mt-1 space-y-1">
            {item.children.map((child) => {
              const isChildActive = pathname === child.href;
              return (
                <Link
                  key={child.name}
                  href={child.href}
                  className={cn(
                    'sidebar-item group flex items-center rounded-xl pl-2',
                    isChildActive && 'active'
                  )}
                >
                  <child.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                  {child.name}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full w-sidebar flex-col bg-sidebar-bg border-r border-sidebar-border">
      {/* Logo Section */}
      <div className="p-4 lg:p-6 border-b border-sidebar-border">
        <LogoDynamic 
          size="sm" 
          customLogoUrl={logoUrl}
          salonName={salonName}
        />
      </div>
      
      {/* Header */}
      <div className="flex h-12 items-center justify-between px-4 border-b border-sidebar-border">
        <h2 className="text-base font-semibold text-sidebar-text">Admin Panel</h2>
        <Link
          href="/"
          className="text-sidebar-icon hover:text-primary-700 transition-colors"
          title="Terug naar dashboard"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
        {navigation.map(renderNavItem)}
      </nav>
    </div>
  );
}