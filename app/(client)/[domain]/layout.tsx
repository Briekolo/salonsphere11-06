import { use } from 'react';
import { ClientHeader } from '@/components/client/layout/ClientHeader';
import { ClientFooter } from '@/components/client/layout/ClientFooter';
import { TenantProvider } from '@/lib/client/tenant-context';

export default function ClientLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ domain: string }>;
}) {
  const resolvedParams = use(params);
  
  return (
    <TenantProvider>
      <div className="min-h-screen bg-background">
        <ClientHeader domain={resolvedParams.domain} />
        <main className="flex-1">
          {children}
        </main>
        <ClientFooter />
      </div>
    </TenantProvider>
  );
}