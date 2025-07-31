'use client';

import { StaffSidebar } from '@/components/staff/StaffSidebar';
import { StaffAuthProvider } from '@/components/staff/StaffAuthProvider';
import { TopBar } from '@/components/layout/TopBar';

interface StaffLayoutProps {
  children: React.ReactNode;
  user: {
    id?: string;
    role: string;
    tenant_id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
}

export function StaffLayout({ children, user }: StaffLayoutProps) {
  return (
    <StaffAuthProvider initialUser={user}>
      <div className="h-screen flex bg-background">
        <StaffSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </StaffAuthProvider>
  );
}