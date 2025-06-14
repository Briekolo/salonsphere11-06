'use client'

import { useQuery } from '@tanstack/react-query'
import { UserService } from '@/lib/services/userService'
import { useTenant } from './useTenant'

// Basic user type, can be expanded
export type User = {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    role: string | null
}

export function useUsers(filters: { role?: string } = {}) {
    const { tenantId } = useTenant()
    const queryKey = ['users', tenantId, JSON.stringify(filters)]

    return useQuery<User[]>({
        queryKey,
        queryFn: async () => {
            if (!tenantId) return []
            const res = await UserService.getAll(filters)
            if (typeof window !== 'undefined') {
              console.log('[useUsers] tenant', tenantId, 'filters', filters, 'result', res)
            }
            return res
        },
        enabled: !!tenantId,
    })
} 