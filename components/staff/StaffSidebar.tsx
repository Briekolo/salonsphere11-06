'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Users,
  User,
  ArrowLeft,
  Settings,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: any;
}

const staffNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/staff/dashboard', icon: LayoutDashboard },
  { name: 'Mijn Agenda', href: '/staff/agenda', icon: Calendar },
  { name: 'Afspraken', href: '/staff/appointments', icon: Clock },
  { name: 'Klanten', href: '/staff/clients', icon: Users },
  { name: 'Profiel', href: '/staff/profile', icon: User },
];

export function StaffSidebar() {
  const pathname = usePathname();

  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.href;

    return (
      <Link
        key={item.name}
        href={item.href}
        className={cn(
          'sidebar-item group flex items-center rounded-xl',
          isActive && 'active'
        )}
      >
        <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
        {item.name}
      </Link>
    );
  };

  return (
    <div className="flex h-full w-sidebar flex-col bg-sidebar-bg border-r border-sidebar-border">
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <h2 className="text-lg font-semibold text-sidebar-text">Medewerker Portal</h2>
        <Link
          href="/"
          className="text-sidebar-icon hover:text-primary-700 transition-colors"
          title="Terug naar hoofddashboard"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
        {staffNavigation.map(renderNavItem)}
      </nav>
      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-muted">
          SalonSphere Staff Portal
        </div>
      </div>
    </div>
  );
}