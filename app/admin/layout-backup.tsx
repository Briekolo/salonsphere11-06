'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useTenant } from '@/lib/hooks/useTenant';
import { supabase } from '@/lib/supabase';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Toaster } from '@/components/ui/toaster';

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
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}