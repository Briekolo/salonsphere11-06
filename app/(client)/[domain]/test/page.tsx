'use client';

import { useEffect, useState } from 'react';
import { useTenant } from '@/lib/client/tenant-context';
import { supabase } from '@/lib/supabase';

export default function TestPage() {
  const { tenant, isLoading, error } = useTenant();
  const [services, setServices] = useState<any[]>([]);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  useEffect(() => {
    async function testQuery() {
      if (!tenant?.id || isQuerying) return;
      
      setIsQuerying(true);
      console.log('[TestPage] Testing with tenant:', tenant.id);
      
      try {
        const { data, error } = await supabase
          .from('services')
          .select('id, name, active')
          .eq('tenant_id', tenant.id)
          .eq('active', true)
          .limit(5);
          
        console.log('[TestPage] Query result:', { data, error });
        
        if (error) {
          setQueryError(error.message);
        } else {
          setServices(data || []);
        }
      } catch (err: any) {
        console.error('[TestPage] Catch error:', err);
        setQueryError(err.message || 'Unknown error');
      }
    }
    
    testQuery();
  }, [tenant?.id]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold">Tenant Context:</h2>
          <pre className="text-sm mt-2">
            {JSON.stringify({ 
              loading: isLoading, 
              error,
              tenantId: tenant?.id,
              tenantName: tenant?.name,
              subdomain: tenant?.subdomain
            }, null, 2)}
          </pre>
        </div>
        
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold">Services Query:</h2>
          <pre className="text-sm mt-2">
            {JSON.stringify({ 
              queryError,
              servicesCount: services.length,
              services: services.slice(0, 3)
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}