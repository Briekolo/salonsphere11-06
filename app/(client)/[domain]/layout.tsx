import { use } from 'react';
import { ClientHeader } from '@/components/client/layout/ClientHeader';
import { ClientFooter } from '@/components/client/layout/ClientFooter';
import { TenantProvider } from '@/lib/client/tenant-context';
import { ClientAuthProvider } from '@/components/client/auth/ClientAuthProvider';

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
      <ClientAuthProvider>
        <div className="min-h-screen bg-background" suppressHydrationWarning>
          <ClientHeader domain={resolvedParams.domain} />
          <main className="flex-1">
            {children}
          </main>
          <ClientFooter />
        </div>
      </ClientAuthProvider>
    </TenantProvider>
  );
}