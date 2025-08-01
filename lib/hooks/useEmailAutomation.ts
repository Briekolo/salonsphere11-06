import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/browser-client'
import { useTenant } from './useTenant'

export interface EmailAutomationSettings {
  id: string
  tenant_id: string
  welcome_email_enabled: boolean
  booking_confirmation_enabled: boolean
  booking_reminder_enabled: boolean
  welcome_email_template_id?: string | null
  booking_confirmation_template_id?: string | null
  booking_reminder_template_id?: string | null
  created_at: string
  updated_at: string
}

export interface EmailAutomationLog {
  id: string
  tenant_id: string
  email_type: 'welcome' | 'booking_confirmation' | 'booking_reminder'
  recipient_email: string
  client_id?: string | null
  booking_id?: string | null
  status: 'sent' | 'failed' | 'pending'
  resend_email_id?: string | null
  error_message?: string | null
  sent_at?: string | null
  created_at: string
}

export interface EmailStats {
  welcome_emails_sent_today: number
  welcome_emails_sent_this_month: number
  booking_confirmations_sent_today: number
  booking_confirmations_sent_this_month: number
  booking_reminders_sent_today: number
  booking_reminders_sent_this_month: number
  total_emails_sent_today: number
  total_emails_sent_this_month: number
}

// Get email automation settings for tenant
export function useEmailSettings() {
  const { tenantId } = useTenant()

  return useQuery({
    queryKey: ['emailSettings', tenantId],
    queryFn: async (): Promise<EmailAutomationSettings> => {
      if (!tenantId) throw new Error('No tenant ID')

      const { data, error } = await supabase
        .from('email_automation_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .single()

      if (error) {
        // If no settings exist, create default ones
        if (error.code === 'PGRST116') {
          const { data: newSettings, error: createError } = await supabase
            .from('email_automation_settings')
            .insert({
              tenant_id: tenantId,
              welcome_email_enabled: false,
              booking_confirmation_enabled: true,
              booking_reminder_enabled: true
            })
            .select()
            .single()

          if (createError) throw createError
          return newSettings
        }
        throw error
      }

      return data
    },
    enabled: !!tenantId,
  })
}

// Update email automation settings
export function useUpdateEmailSettings() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()

  return useMutation({
    mutationFn: async (updates: Partial<Pick<EmailAutomationSettings, 'welcome_email_enabled' | 'booking_confirmation_enabled' | 'booking_reminder_enabled'>>) => {
      if (!tenantId) throw new Error('No tenant ID')

      const { data, error } = await supabase
        .from('email_automation_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('tenant_id', tenantId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailSettings', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['emailStats', tenantId] })
    },
  })
}

// Get email statistics
export function useEmailStats(period: 'today' | 'this_month' = 'this_month') {
  const { tenantId } = useTenant()

  return useQuery({
    queryKey: ['emailStats', tenantId, period],
    queryFn: async (): Promise<EmailStats> => {
      if (!tenantId) throw new Error('No tenant ID')

      const now = new Date()
      let startDate: Date

      if (period === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      }

      const { data: logs, error } = await supabase
        .from('email_automation_logs')
        .select('email_type, status, created_at')
        .eq('tenant_id', tenantId)
        .eq('status', 'sent')
        .gte('created_at', startDate.toISOString())

      if (error) throw error

      const stats: EmailStats = {
        welcome_emails_sent_today: 0,
        welcome_emails_sent_this_month: 0,
        booking_confirmations_sent_today: 0,
        booking_confirmations_sent_this_month: 0,
        booking_reminders_sent_today: 0,
        booking_reminders_sent_this_month: 0,
        total_emails_sent_today: 0,
        total_emails_sent_this_month: 0,
      }

      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      logs?.forEach(log => {
        const logDate = new Date(log.created_at)
        const isToday = logDate >= todayStart
        const isThisMonth = logDate >= monthStart

        if (isToday) {
          stats.total_emails_sent_today++
          if (log.email_type === 'welcome') stats.welcome_emails_sent_today++
          if (log.email_type === 'booking_confirmation') stats.booking_confirmations_sent_today++
          if (log.email_type === 'booking_reminder') stats.booking_reminders_sent_today++
        }

        if (isThisMonth) {
          stats.total_emails_sent_this_month++
          if (log.email_type === 'welcome') stats.welcome_emails_sent_this_month++
          if (log.email_type === 'booking_confirmation') stats.booking_confirmations_sent_this_month++
          if (log.email_type === 'booking_reminder') stats.booking_reminders_sent_this_month++
        }
      })

      return stats
    },
    enabled: !!tenantId,
    refetchInterval: 60000, // Refresh every minute
  })
}

// Get recent email logs
export function useEmailLogs(limit: number = 50) {
  const { tenantId } = useTenant()

  return useQuery({
    queryKey: ['emailLogs', tenantId, limit],
    queryFn: async (): Promise<EmailAutomationLog[]> => {
      if (!tenantId) throw new Error('No tenant ID')

      const { data, error } = await supabase
        .from('email_automation_logs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    },
    enabled: !!tenantId,
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

// Get email logs for specific type
export function useEmailLogsByType(emailType: 'welcome' | 'booking_confirmation' | 'booking_reminder', limit: number = 20) {
  const { tenantId } = useTenant()

  return useQuery({
    queryKey: ['emailLogs', tenantId, emailType, limit],
    queryFn: async (): Promise<EmailAutomationLog[]> => {
      if (!tenantId) throw new Error('No tenant ID')

      const { data, error } = await supabase
        .from('email_automation_logs')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('email_type', emailType)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    },
    enabled: !!tenantId,
  })
}