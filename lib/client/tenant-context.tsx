'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { TenantInfo, resolveTenant } from './tenant-resolver';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface TenantContextType {
  tenant: TenantInfo | null;
  isLoading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  isLoading: true,
  error: null
});

export function TenantProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const domain = params.domain as string;
  
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tenantIdRef = useRef<string | null>(null);

  useEffect(() => {
    async function loadTenant() {
      if (!domain) {
        setError('No domain provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log('[TenantProvider] Loading tenant for domain:', domain);
        const tenantInfo = await resolveTenant(domain);
        console.log('[TenantProvider] Tenant resolved:', tenantInfo);
        
        if (!tenantInfo) {
          console.error('[TenantProvider] No tenant found for domain:', domain);
          setError('Salon not found');
        } else {
          setTenant(tenantInfo);
          tenantIdRef.current = tenantInfo.id;
          console.log('[TenantProvider] Tenant set successfully:', tenantInfo.id, tenantInfo.name);
          // Apply theme colors
          if (tenantInfo.theme_settings) {
            document.documentElement.style.setProperty('--primary-color', tenantInfo.theme_settings.primary_color);
            document.documentElement.style.setProperty('--secondary-color', tenantInfo.theme_settings.secondary_color);
          }
        }
      } catch (err) {
        setError('Failed to load salon information');
        console.error('Tenant resolution error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadTenant();
  }, [domain]);

  // Set up real-time subscription for tenant updates
  useEffect(() => {
    // Only set up subscription after initial load is complete and we have a tenant ID
    if (isLoading || !tenantIdRef.current) return;

    const tenantId = tenantIdRef.current;
    console.log(`[TenantProvider] Setting up realtime subscription for tenant: ${tenantId}`);

    let retryCount = 0;
    const maxRetries = 3;
    
    const setupChannel = () => {
      const channel = supabase
        .channel(`tenant_updates_${tenantId}`)
        .on(
          'postgres_changes',
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'tenants',
            filter: `id=eq.${tenantId}`
          },
          async (payload) => {
            console.log('[TenantProvider] Tenant updated, refreshing data:', payload);
            
            try {
              // Update tenant data with new values
              setTenant(prevTenant => {
                if (!prevTenant) return prevTenant;
                const updatedTenant = { ...prevTenant, ...payload.new } as TenantInfo;
                
                // Apply updated theme colors immediately
                if (updatedTenant.theme_settings) {
                  document.documentElement.style.setProperty('--primary-color', updatedTenant.theme_settings.primary_color);
                  document.documentElement.style.setProperty('--secondary-color', updatedTenant.theme_settings.secondary_color);
                }
                
                return updatedTenant;
              });
              
              console.log('[TenantProvider] Tenant data updated successfully');
            } catch (error) {
              console.error('[TenantProvider] Error updating tenant data:', error);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[TenantProvider] Successfully subscribed to realtime updates');
            retryCount = 0; // Reset retry count on success
          } else if (status === 'CLOSED') {
            console.log('[TenantProvider] Realtime subscription closed');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[TenantProvider] Error subscribing to realtime updates');
            
            // Retry with exponential backoff
            if (retryCount < maxRetries) {
              retryCount++;
              const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
              console.log(`[TenantProvider] Retrying subscription in ${delay}ms (attempt ${retryCount}/${maxRetries})`);
              
              setTimeout(() => {
                supabase.removeChannel(channel);
                setupChannel();
              }, delay);
            }
          }
        });
      
      return channel;
    };
    
    const channel = setupChannel();

    return () => {
      console.log(`[TenantProvider] Cleaning up realtime subscription for tenant: ${tenantId}`);
      supabase.removeChannel(channel);
    };
  }, [isLoading]); // Only depend on isLoading, not tenant

  return (
    <TenantContext.Provider value={{ tenant, isLoading, error }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}