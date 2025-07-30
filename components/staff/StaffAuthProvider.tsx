'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

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

interface StaffAuthContextType {
  user: StaffUser | null;
  permissions: StaffPermissions | null;
}

const StaffAuthContext = createContext<StaffAuthContextType | null>(null);

interface StaffAuthProviderProps {
  children: ReactNode;
  initialUser?: Partial<StaffUser>;
}

export function StaffAuthProvider({ children, initialUser }: StaffAuthProviderProps) {
  const queryClient = useQueryClient();

  // Pre-populate the query cache with initial user data if available
  if (initialUser && !queryClient.getQueryData(['staff-auth'])) {
    const fullUser: StaffUser = {
      id: initialUser.id || '',
      email: initialUser.email || '',
      role: initialUser.role || 'staff',
      tenant_id: initialUser.tenant_id || '',
      first_name: initialUser.first_name || '',
      last_name: initialUser.last_name || '',
      name: `${initialUser.first_name || ''} ${initialUser.last_name || ''}`.trim(),
      avatar_url: initialUser.avatar_url,
      phone: initialUser.phone,
      active: initialUser.active ?? true,
      specializations: initialUser.specializations || [],
      working_hours: initialUser.working_hours || {},
    };

    // Set default permissions - these will be updated by the actual query
    const defaultPermissions: StaffPermissions = {
      can_view_all_appointments: false,
      can_edit_all_appointments: false,
      can_view_clients: true,
      can_edit_clients: false,
      can_view_financial: false,
      can_manage_own_schedule: true,
      can_add_appointment_notes: true,
    };

    queryClient.setQueryData(['staff-auth'], {
      user: fullUser,
      permissions: defaultPermissions,
    });
  }

  return (
    <StaffAuthContext.Provider value={{ user: null, permissions: null }}>
      {children}
    </StaffAuthContext.Provider>
  );
}

export const useStaffAuthContext = () => {
  const context = useContext(StaffAuthContext);
  if (!context) {
    throw new Error('useStaffAuthContext must be used within a StaffAuthProvider');
  }
  return context;
};