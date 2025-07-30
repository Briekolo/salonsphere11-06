import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Notification = Database['public']['Tables']['notifications']['Row']
type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
type NotificationUpdate = Database['public']['Tables']['notifications']['Update']

export class NotificationService {
  // Get notifications for current user
  static async getNotifications(tenantId: string, userId: string, options?: {
    limit?: number
    offset?: number
    unreadOnly?: boolean
  }) {
    let query = supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (options?.unreadOnly) {
      query = query.is('read_at', null)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  // Get unread count
  static async getUnreadCount(tenantId: string, userId: string) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .or(`user_id.eq.${userId},user_id.is.null`)
      .eq('tenant_id', tenantId)
      .is('read_at', null)
      .is('dismissed_at', null)

    if (error) throw error
    return count || 0
  }

  // Mark notification as read
  static async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)

    if (error) throw error
  }

  // Mark all as read
  static async markAllAsRead(tenantId: string, userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .or(`user_id.eq.${userId},user_id.is.null`)
      .eq('tenant_id', tenantId)
      .is('read_at', null)

    if (error) throw error
  }

  // Dismiss notification
  static async dismiss(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ dismissed_at: new Date().toISOString() })
      .eq('id', notificationId)

    if (error) throw error
  }

  // Create notification
  static async create(notification: NotificationInsert) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Create bulk notifications
  static async createBulk(notifications: NotificationInsert[]) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select()

    if (error) throw error
    return data
  }

  // Subscribe to real-time notifications
  static subscribeToNotifications(
    tenantId: string,
    userId: string,
    callback: (notification: Notification) => void
  ) {
    return supabase
      .channel(`notifications:${tenantId}:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const notification = payload.new as Notification
          if (notification.user_id === userId || notification.user_id === null) {
            callback(notification)
          }
        }
      )
      .subscribe()
  }
}