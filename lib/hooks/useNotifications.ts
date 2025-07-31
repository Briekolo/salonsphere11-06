'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { NotificationService } from '@/lib/services/notificationService'
import { useTenant } from './useTenant'
import { useAuth } from '@/components/auth/AuthProvider'
// import { toast } from 'sonner' // Removed sonner dependency

export function useNotifications(options?: {
  limit?: number
  unreadOnly?: boolean
}) {
  const { tenantId } = useTenant()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Fetch notifications
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['notifications', tenantId, user?.id, options],
    queryFn: async () => {
      if (!tenantId || !user?.id) return []
      return NotificationService.getNotifications(tenantId, user.id, options)
    },
    enabled: !!tenantId && !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Fetch unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread-count', tenantId, user?.id],
    queryFn: async () => {
      if (!tenantId || !user?.id) return 0
      return NotificationService.getUnreadCount(tenantId, user.id)
    },
    enabled: !!tenantId && !!user?.id,
    refetchInterval: 30000,
  })

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => 
      NotificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => {
      if (!tenantId || !user?.id) throw new Error('Missing tenant or user')
      return NotificationService.markAllAsRead(tenantId, user.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
      console.log('Alle meldingen gemarkeerd als gelezen')
    },
  })

  // Dismiss mutation
  const dismissMutation = useMutation({
    mutationFn: (notificationId: string) => 
      NotificationService.dismiss(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })

  // Real-time subscription
  useEffect(() => {
    if (!tenantId || !user?.id) return

    const channel = NotificationService.subscribeToNotifications(
      tenantId,
      user.id,
      (notification) => {
        // Invalidate queries to refetch
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
        queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
        
        // Show console log for new notification (toast removed)
        console.log('New notification:', notification.title, notification.message)
      }
    )

    return () => {
      channel.unsubscribe()
    }
  }, [tenantId, user?.id, queryClient])

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refetch,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    dismiss: dismissMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDismissing: dismissMutation.isPending,
  }
}