'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { TenantInfo, resolveTenant } from './tenant-resolver';
import { useParams } from 'next/navigation';

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

  useEffect(() => {
    async function loadTenant() {
      if (!domain) {
        setError('No domain provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const tenantInfo = await resolveTenant(domain);
        
        if (!tenantInfo) {
          setError('Salon not found');
        } else {
          setTenant(tenantInfo);
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