import { useEffect, useState } from 'react'
import { supabase, getCurrentUserTenantId } from '@/lib/supabase'
import { Database } from '@/types/database'

type Tables = Database['public']['Tables']

// Generic hook for fetching data from any table
export function useSupabaseQuery<T extends keyof Tables>(
  table: T,
  options?: {
    select?: string
    filter?: Record<string, any>
    orderBy?: { column: string; ascending?: boolean }
    limit?: number
  }
) {
  const [data, setData] = useState<Tables[T]['Row'][]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        let query = supabase.from(table).select(options?.select || '*')

        // Apply filters
        if (options?.filter) {
          Object.entries(options.filter).forEach(([key, value]) => {
            query = query.eq(key, value)
          })
        }

        // Apply ordering
        if (options?.orderBy) {
          query = query.order(options.orderBy.column, { 
            ascending: options.orderBy.ascending ?? true 
          })
        }

        // Apply limit
        if (options?.limit) {
          query = query.limit(options.limit)
        }

        const { data: result, error: queryError } = await query

        if (queryError) {
          throw queryError
        }

        setData(result || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [table, JSON.stringify(options)])

  return { data, loading, error, refetch: () => fetchData() }
}

// Hook for tenant-specific data
export function useTenantData<T extends keyof Tables>(
  table: T,
  options?: Omit<Parameters<typeof useSupabaseQuery>[1], 'filter'> & {
    filter?: Record<string, any>
  }
) {
  const [tenantId, setTenantId] = useState<string | null>(null)

  useEffect(() => {
    getCurrentUserTenantId().then(setTenantId)
  }, [])

  return useSupabaseQuery(table, {
    ...options,
    filter: {
      tenant_id: tenantId,
      ...options?.filter
    }
  })
}

// Hook for real-time subscriptions
export function useSupabaseSubscription<T extends keyof Tables>(
  table: T,
  callback: (payload: any) => void,
  filter?: Record<string, any>
) {
  useEffect(() => {
    let subscription = supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: table as string,
          filter: filter ? Object.entries(filter).map(([key, value]) => `${key}=eq.${value}`).join(',') : undefined
        }, 
        callback
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [table, callback, JSON.stringify(filter)])
}