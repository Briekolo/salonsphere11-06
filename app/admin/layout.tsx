'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useTenant } from '@/lib/hooks/useTenant';
import { supabase } from '@/lib/supabase';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { TopBar } from '@/components/layout/TopBar';
import { SidebarProvider } from '@/components/providers/SidebarProvider';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { tenantId } = useTenant();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/sign-in');
      return;
    }

    if (!loading && user && tenantId) {
      // Check if user is admin or owner
      checkAdminAccess();
    }
  }, [user, loading, tenantId, router]);

  const checkAdminAccess = async () => {
    if (!user || !tenantId) return;

    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('id', user.id)
      .single();

    if (error || !data || data.role !== 'admin') {
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="h-screen flex bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}