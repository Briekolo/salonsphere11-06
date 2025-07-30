'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface StaffUser {
  id: string;
  email: string;
  role: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  name: string;
  avatar_url?: string;
  phone?: string;
  active: boolean;
  specializations: string[];
  working_hours: any;
}

interface StaffPermissions {
  can_view_all_appointments: boolean;
  can_edit_all_appointments: boolean;
  can_view_clients: boolean;
  can_edit_clients: boolean;
  can_view_financial: boolean;
  can_manage_own_schedule: boolean;
  can_add_appointment_notes: boolean;
}

const checkStaffAuthFn = async (router: any): Promise<{ user: StaffUser; permissions: StaffPermissions } | null> => {
  try {
    // Get current auth user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      router.push('/auth/sign-in');
      throw new Error('Not authenticated');
    }

    // Get user data from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (userError || !userData) {
      throw new Error('Failed to load user data');
    }

    // Check if user is staff
    if (userData.role !== 'staff') {
      // Redirect based on role
      if (userData.role === 'admin' || userData.role === 'owner') {
        router.push('/admin');
      } else {
        router.push('/');
      }
      throw new Error('Not a staff member');
    }

    // Get staff permissions
    const { data: permissionsData, error: permissionsError } = await supabase
      .from('staff_permissions')
      .select('*')
      .eq('user_id', authUser.id)
      .eq('tenant_id', userData.tenant_id)
      .single();

    const permissions = permissionsError ? {
      can_view_all_appointments: false,
      can_edit_all_appointments: false,
      can_view_clients: true,
      can_edit_clients: false,
      can_view_financial: false,
      can_manage_own_schedule: true,
      can_add_appointment_notes: true
    } : permissionsData;

    return { user: userData, permissions };

  } catch (err) {
    console.error('Error checking staff auth:', err);
    throw err;
  }
};

export function useStaffAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Check if we already have cached data
  const cachedData = queryClient.getQueryData(['staff-auth']);

  // Use React Query for staff auth data
  const { data: authData, isLoading, error, refetch } = useQuery({
    queryKey: ['staff-auth'],
    queryFn: () => checkStaffAuthFn(router),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (previously cacheTime)
    refetchOnMount: false, // Don't refetch on mount if data is cached
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
    notifyOnChangeProps: ['data', 'error'], // Only notify on data/error changes, not loading state
    enabled: !cachedData, // Only run query if we don't have cached data
  });

  useEffect(() => {
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        queryClient.setQueryData(['staff-auth'], null);
        router.push('/auth/sign-in');
      } else if (event === 'SIGNED_IN' && session) {
        await refetch();
      }
    });

    return () => subscription.unsubscribe();
  }, [router, queryClient, refetch]);

  // Use either fresh data or cached data
  const finalData = authData || cachedData;

  const hasPermission = (permission: keyof StaffPermissions): boolean => {
    if (!finalData?.permissions) return false;
    return finalData.permissions[permission] || false;
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      queryClient.setQueryData(['staff-auth'], null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    user: finalData?.user || null,
    permissions: finalData?.permissions || null,
    loading: isLoading && !cachedData, // Only show loading if no cached data
    error: error?.message || null,
    hasPermission,
    signOut,
    refetch
  };
}