import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useTenant } from '@/lib/hooks/useTenant';
import { supabase } from '@/lib/supabase';

// Helper to get/set admin status in localStorage
const ADMIN_CACHE_KEY = 'salonsphere_admin_status';

function getCachedAdminStatus(userId: string): boolean | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(ADMIN_CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      // Check if cache is for current user and not expired (24 hours)
      if (data.userId === userId && Date.now() - data.timestamp < 86400000) {
        return data.isAdmin;
      }
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  return null;
}

function setCachedAdminStatus(userId: string, isAdmin: boolean) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify({
      userId,
      isAdmin,
      timestamp: Date.now()
    }));
  } catch (e) {
    // Ignore localStorage errors
  }
}

export function useIsAdmin() {
  const { user, loading } = useAuth();
  const { tenantId } = useTenant();
  
  // Initialize from cache or metadata if available
  const [isAdmin, setIsAdmin] = useState(() => {
    if (!user) return false;
    
    // First check localStorage cache
    const cachedStatus = getCachedAdminStatus(user.id);
    if (cachedStatus !== null) {
      return cachedStatus;
    }
    
    // Then check user metadata
    const roleFromMetadata = user.user_metadata?.role;
    if (roleFromMetadata !== undefined) {
      return roleFromMetadata === 'admin';
    }
    
    return false;
  });
  
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

    // If we already have the role from metadata, we're done
    const roleFromMetadata = user.user_metadata?.role;
    if (roleFromMetadata !== undefined) {
      const isUserAdmin = roleFromMetadata === 'admin';
      setIsAdmin(isUserAdmin);
      setCachedAdminStatus(user.id, isUserAdmin);
      setIsLoading(false);
      setHasChecked(true);
      return;
    }

    // Otherwise, check the database
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

      const isUserAdmin = !error && data && data.role === 'admin';
      
      setIsAdmin(isUserAdmin);
      setHasChecked(true);
      
      // Cache in localStorage
      setCachedAdminStatus(user.id, isUserAdmin);

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