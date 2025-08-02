import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database'
import { serializeError } from '@/lib/utils/error-serializer'
import { logError, debugLog } from '@/lib/utils/error-logger'

type Notification = Database['public']['Tables']['notifications']['Row']
type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
type NotificationUpdate = Database['public']['Tables']['notifications']['Update']

export class NotificationService {
  // Test if notifications table exists and is accessible
  static async testTableAccess(): Promise<{ exists: boolean; error?: any }> {
    debugLog('NotificationService.testTableAccess', 'Testing notifications table access');
    
    try {
      // Try a simple count query
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .limit(1);
      
      if (error) {
        logError('NotificationService.testTableAccess failed', error);
        return { exists: false, error: error };
      }
      
      debugLog('NotificationService.testTableAccess', 'Table exists and is accessible', { count });
      return { exists: true };
    } catch (error) {
      logError('NotificationService.testTableAccess exception', error);
      return { exists: false, error: error };
    }
  }

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
      .is('dismissed_at', null)
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
    debugLog('NotificationService.create', 'Starting notification creation', {
      tenant_id: notification.tenant_id,
      user_id: notification.user_id,
      type: notification.type,
      title: notification.title
    });

    debugLog('NotificationService.create', 'About to call Supabase');

    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()

    debugLog('NotificationService.create', 'Supabase call completed', {
      hasData: !!data,
      hasError: !!error,
      errorType: error ? typeof error : 'no error'
    });

    if (error) {
      logError('NotificationService.create', error, {
        notification: notification,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        timestamp: new Date().toISOString()
      });
      throw error
    }
    
    debugLog('NotificationService.create', 'Notification created successfully', data);
    return data
  }

  // Create bulk notifications
  static async createBulk(notifications: NotificationInsert[]) {
    console.log('Creating bulk notifications:', {
      count: notifications.length,
      types: notifications.map(n => n.type)
    })

    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select()

    if (error) {
      console.error('NotificationService.createBulk error:', {
        errorDetails: serializeError(error),
        notificationCount: notifications.length
      })
      throw error
    }
    return data
  }

  // Subscribe to real-time notifications
  static subscribeToNotifications(
    tenantId: string,
    userId: string,
    callback: (notification: Notification) => void,
    instanceId?: string
  ) {
    // Create unique channel name with instance ID to prevent duplicate subscriptions
    const channelName = instanceId 
      ? `notifications:${tenantId}:${userId}:${instanceId}`
      : `notifications:${tenantId}:${userId}`
      
    return supabase
      .channel(channelName)
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