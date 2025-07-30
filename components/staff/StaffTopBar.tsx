'use client';

import { useState, useEffect } from 'react';
import { Bell, Search } from 'lucide-react';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface StaffTopBarProps {
  user: {
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
}

export function StaffTopBar({ user }: StaffTopBarProps) {
  const [greeting, setGreeting] = useState('');
  const today = new Date();

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  const initials = `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`.toUpperCase();
  const firstName = user.first_name || 'Medewerker';

  return (
    <header className="bg-background border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-3 lg:py-4 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        {/* Left side - Greeting */}
        <div className="flex-1 min-w-0 ml-12 lg:ml-0">
          <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 truncate">
            {greeting}, {firstName}
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
          <button className="p-1.5 sm:p-2 text-[#02011F] hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors relative min-h-[44px] min-w-[44px] flex items-center justify-center">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          {/* Profile */}
          <ProfileDropdown 
            initials={initials}
            firstName={user.first_name}
            userEmail={user.email}
          />
        </div>
      </div>
    </header>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour < 12) return 'Goedemorgen';
  if (hour < 18) return 'Goedemiddag';
  return 'Goedenavond';
}