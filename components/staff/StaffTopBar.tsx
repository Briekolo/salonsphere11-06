'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, User, LogOut, Settings } from 'lucide-react';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { supabase } from '@/lib/supabase';

interface StaffTopBarProps {
  user: {
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
}

export function StaffTopBar({ user }: StaffTopBarProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      router.push('/auth/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initials = `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`.toUpperCase();
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();

  return (
    <div className="flex h-16 items-center justify-between px-6 bg-white border-b border-gray-200">
      {/* Page title will be dynamic based on route */}
      <div className="flex-1">
        <h1 className="text-2xl font-semibold text-gray-900">
          {/* This will be filled by individual pages */}
        </h1>
      </div>

      {/* Right side actions */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <button className="p-2 text-[#02011F] hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors relative min-h-[44px] min-w-[44px] flex items-center justify-center">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* User Profile */}
        <ProfileDropdown 
          initials={initials}
          firstName={user.first_name}
          userEmail={user.email}
        />
      </div>
    </div>
  );
}