'use client'

import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { useClientAuth } from '@/lib/hooks/useClientAuth'

const ClientAuthContext = createContext<ReturnType<typeof useClientAuth> | undefined>(undefined)

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  const auth = useClientAuth()
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Prevent hydration issues by only showing content after mount
  if (!isHydrated) {
    return (
      <ClientAuthContext.Provider value={auth}>
        <div suppressHydrationWarning>
          {children}
        </div>
      </ClientAuthContext.Provider>
    )
  }

  return (
    <ClientAuthContext.Provider value={auth}>
      {children}
    </ClientAuthContext.Provider>
  )
}

export function useClientAuthContext() {
  const context = useContext(ClientAuthContext)
  if (!context) {
    throw new Error('useClientAuthContext must be used within ClientAuthProvider')
  }
  return context
}