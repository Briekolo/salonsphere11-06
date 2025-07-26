import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useTenant } from '@/lib/hooks/useTenant';
import { supabase } from '@/lib/supabase';

export function useIsAdmin() {
  const { user, loading } = useAuth();
  const { tenantId } = useTenant();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading) {
      return;
    }
    
    if (!user || !tenantId) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    checkAdminStatus();
  }, [user, tenantId, loading]);

  const checkAdminStatus = async () => {
    if (!user || !tenantId) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('tenant_id', tenantId)
        .eq('id', user.id)
        .single();

      if (!error && data && data.role === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  return { isAdmin, isLoading };
}

export function useRequireAdmin() {
  const router = useRouter();
  const { isAdmin, isLoading } = useIsAdmin();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, isLoading, router]);

  return { isAdmin, isLoading };
}