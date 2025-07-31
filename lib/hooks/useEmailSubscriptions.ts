import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useTenant } from './useTenant'
import { useToast } from '@/components/providers/ToastProvider'

export interface EmailSubscription {
  id: string
  tenant_id: string
  email: string
  client_id?: string
  subscribed_at: string
  unsubscribed_at?: string
  subscription_source: 'manual' | 'website' | 'checkout' | 'import' | 'booking'
  status: 'active' | 'unsubscribed' | 'bounced' | 'invalid'
  first_name?: string
  last_name?: string
  tags?: string[]
  created_at: string
  updated_at: string
}

// Fetch all email subscriptions
export function useEmailSubscriptions(status?: 'active' | 'unsubscribed' | 'bounced') {
  const { tenantId } = useTenant()

  return useQuery({
    queryKey: ['email-subscriptions', tenantId, status],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant found')

      let query = supabase
        .from('email_subscriptions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('subscribed_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) throw error
      return data as EmailSubscription[]
    },
    enabled: !!tenantId
  })
}

// Add email subscription
export function useAddEmailSubscription() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: async (subscription: {
      email: string
      first_name?: string
      last_name?: string
      subscription_source?: 'manual' | 'website' | 'checkout' | 'import' | 'booking'
      client_id?: string
    }) => {
      if (!tenantId) throw new Error('No tenant found')

      const { data, error } = await supabase
        .from('email_subscriptions')
        .insert({
          ...subscription,
          tenant_id: tenantId,
          subscription_source: subscription.subscription_source || 'manual'
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new Error('Dit e-mailadres is al geabonneerd')
        }
        throw error
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-subscriptions'] })
      showToast('De e-mail is succesvol toegevoegd aan de abonnees lijst', 'success')
    },
    onError: (error: Error) => {
      showToast(error.message, 'error')
    }
  })
}

// Bulk import email subscriptions
export function useBulkImportSubscriptions() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: async (emails: Array<{
      email: string
      first_name?: string
      last_name?: string
    }>) => {
      if (!tenantId) throw new Error('No tenant found')

      const subscriptions = emails.map(email => ({
        ...email,
        tenant_id: tenantId,
        subscription_source: 'import' as const
      }))

      const { data, error } = await supabase
        .from('email_subscriptions')
        .upsert(subscriptions, {
          onConflict: 'tenant_id,email',
          ignoreDuplicates: true
        })
        .select()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-subscriptions'] })
      showToast(`${data.length} e-mailadressen succesvol geïmporteerd`, 'success')
    },
    onError: (error: Error) => {
      showToast(error.message, 'error')
    }
  })
}

// Update subscription status
export function useUpdateSubscriptionStatus() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: async ({ 
      id, 
      status 
    }: { 
      id: string
      status: 'active' | 'unsubscribed' | 'bounced' | 'invalid'
    }) => {
      const updateData: any = { status }
      
      if (status === 'unsubscribed') {
        updateData.unsubscribed_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('email_subscriptions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-subscriptions'] })
      showToast('De abonnee status is succesvol bijgewerkt', 'success')
    },
    onError: (error: Error) => {
      showToast(error.message, 'error')
    }
  })
}

// Export subscriptions
export function useExportSubscriptions() {
  const { tenantId } = useTenant()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: async (status?: 'active' | 'unsubscribed' | 'bounced') => {
      if (!tenantId) throw new Error('No tenant found')

      let query = supabase
        .from('email_subscriptions')
        .select('email, first_name, last_name, status, subscribed_at, unsubscribed_at')
        .eq('tenant_id', tenantId)
        .order('subscribed_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) throw error

      // Convert to CSV
      const headers = ['E-mail', 'Voornaam', 'Achternaam', 'Status', 'Geabonneerd op', 'Uitgeschreven op']
      const rows = data.map(sub => [
        sub.email,
        sub.first_name || '',
        sub.last_name || '',
        sub.status,
        new Date(sub.subscribed_at).toLocaleDateString('nl-NL'),
        sub.unsubscribed_at ? new Date(sub.unsubscribed_at).toLocaleDateString('nl-NL') : ''
      ])

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `abonnees-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      return data.length
    },
    onSuccess: (count) => {
      showToast(`${count} abonnees geëxporteerd`, 'success')
    },
    onError: (error: Error) => {
      showToast(error.message, 'error')
    }
  })
}

// Get subscription statistics
export function useSubscriptionStats() {
  const { tenantId } = useTenant()

  return useQuery({
    queryKey: ['subscription-stats', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant found')

      const { data, error } = await supabase
        .rpc('get_subscription_stats', { p_tenant_id: tenantId })
        .single()

      if (error) throw error
      return data
    },
    enabled: !!tenantId
  })
}