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
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (loading) {
      return;
    }
    
    if (!user || !tenantId) {
      setIsAdmin(false);
      setIsLoading(false);
      setHasChecked(true);
      return;
    }

    // Check user metadata first for cached role
    const roleFromMetadata = user.user_metadata?.role;
    if (roleFromMetadata !== undefined && hasChecked) {
      setIsAdmin(roleFromMetadata === 'admin');
      setIsLoading(false);
      return;
    }

    checkAdminStatus();
  }, [user, tenantId, loading, hasChecked]);

  const checkAdminStatus = async () => {
    if (!user || !tenantId) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('tenant_id', tenantId)
        .eq('id', user.id)
        .single();

      const isUserAdmin = !error && data && data.role === 'admin';
      
      setIsAdmin(isUserAdmin);
      setHasChecked(true);

      // Cache the role in user metadata to prevent future queries
      try {
        await supabase.auth.updateUser({
          data: { 
            ...user.user_metadata, 
            role: data?.role || 'user'
          }
        });
      } catch (metadataError) {
        console.warn('Failed to cache role in metadata:', metadataError);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      setHasChecked(true);
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