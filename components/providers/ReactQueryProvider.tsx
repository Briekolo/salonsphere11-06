'use client'

import { QueryClient, QueryClientProvider, HydrationBoundary } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ReactNode, useState } from 'react'

export default function ReactQueryProvider({ children }: { children: ReactNode }) {
  // Create a new QueryClient for each mounted Provider so that caches are not shared across requests (important for RSC)
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes (previously cacheTime)
        refetchOnWindowFocus: false,
        refetchOnMount: false, // Don't refetch on component mount if data is still fresh
        retry: 1, // Only retry once on failure
      },
    },
  }))

  return (
    <QueryClientProvider client={client}>
      <HydrationBoundary state={null}>{children}</HydrationBoundary>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
} 