'use client';

import { ReactNode } from 'react';

interface ClientRealtimeProviderProps {
  children: ReactNode;
}

export function ClientRealtimeProvider({ children }: ClientRealtimeProviderProps) {
  // Client module doesn't need staff realtime subscriptions
  // The TenantProvider already handles tenant-specific realtime updates
  // This provider is kept for future client-specific realtime features
  
  return <>{children}</>;
}