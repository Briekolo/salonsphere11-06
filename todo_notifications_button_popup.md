# Todo: Meldingen Button Functioneel Maken met Popup

## Task Summary
Implement full functionality for the notification button in TopBar component, including database schema, backend services, frontend popup component, click handlers, real-time updates, and complete integration with the existing multi-tenant architecture.

## Current State Analysis
- **Location**: `/components/layout/TopBar.tsx` (line 117-121)
- **Status**: Visual component exists with Bell icon and red notification dot
- **Missing**: All functionality - no click handler, no popup, no data source, no real-time updates

## Root Cause Analysis
The notification button was implemented as a placeholder UI element without backend infrastructure or frontend logic. The system lacks:
1. Database table for storing notifications
2. Service layer for notification CRUD operations
3. Real-time subscription mechanism
4. UI components for displaying notifications
5. State management for notification data

## Proposed Fix Steps

### 1. Database Schema Implementation

#### 1.1 Create notifications table migration
```sql
-- supabase/migrations/20250130_create_notifications_table.sql
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('appointment', 'client', 'payment', 'inventory', 'system', 'staff')),
    severity VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'success')),
    action_url TEXT,
    action_label TEXT,
    metadata JSONB DEFAULT '{}',
    read_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_notifications_tenant_user ON public.notifications(tenant_id, user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_read_status ON public.notifications(tenant_id, user_id, read_at) WHERE read_at IS NULL;

-- RLS policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND tenant_id IN (
            SELECT tenant_id FROM public.users WHERE id = auth.uid()
        ))
    );

-- Users can update their own notifications (mark as read/dismissed)
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND tenant_id IN (
            SELECT tenant_id FROM public.users WHERE id = auth.uid()
        ))
    );

-- System/admin can insert notifications
CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

#### 1.2 Update database types
```typescript
// Add to types/database.ts
notifications: {
  Row: {
    id: string
    tenant_id: string
    user_id: string | null
    title: string
    message: string
    type: 'appointment' | 'client' | 'payment' | 'inventory' | 'system' | 'staff'
    severity: 'info' | 'warning' | 'error' | 'success'
    action_url: string | null
    action_label: string | null
    metadata: Json
    read_at: string | null
    dismissed_at: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    tenant_id: string
    user_id?: string | null
    title: string
    message: string
    type: 'appointment' | 'client' | 'payment' | 'inventory' | 'system' | 'staff'
    severity?: 'info' | 'warning' | 'error' | 'success'
    action_url?: string | null
    action_label?: string | null
    metadata?: Json
    read_at?: string | null
    dismissed_at?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    tenant_id?: string
    user_id?: string | null
    title?: string
    message?: string
    type?: 'appointment' | 'client' | 'payment' | 'inventory' | 'system' | 'staff'
    severity?: 'info' | 'warning' | 'error' | 'success'
    action_url?: string | null
    action_label?: string | null
    metadata?: Json
    read_at?: string | null
    dismissed_at?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "notifications_tenant_id_fkey"
      columns: ["tenant_id"]
      isOneToOne: false
      referencedRelation: "tenants"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "notifications_user_id_fkey"  
      columns: ["user_id"]
      isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
  ]
}
```

### 2. Backend Service Implementation

#### 2.1 Create notification service
```typescript
// lib/services/notificationService.ts
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

type Notification = Database['public']['Tables']['notifications']['Row']
type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
type NotificationType = Notification['type']
type NotificationSeverity = Notification['severity']

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
    return data
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
```

### 3. Frontend Components

#### 3.1 Create notification types
```typescript
// types/notification.ts
export interface NotificationItem {
  id: string
  title: string
  message: string
  type: 'appointment' | 'client' | 'payment' | 'inventory' | 'system' | 'staff'
  severity: 'info' | 'warning' | 'error' | 'success'
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, any>
  readAt?: string | null
  dismissedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface NotificationGroup {
  date: string
  notifications: NotificationItem[]
}
```

#### 3.2 Create notification hook
```typescript
// lib/hooks/useNotifications.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { NotificationService } from '@/lib/services/notificationService'
import { useTenant } from './useTenant'
import { useAuth } from '@/components/auth/AuthProvider'
import { toast } from 'sonner'

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
      toast.success('Alle meldingen gemarkeerd als gelezen')
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
        
        // Show toast for new notification
        toast(notification.title, {
          description: notification.message,
          action: notification.actionUrl ? {
            label: notification.actionLabel || 'Bekijken',
            onClick: () => window.location.href = notification.actionUrl!,
          } : undefined,
        })
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
```

#### 3.3 Create NotificationPopup component
```typescript
// components/notifications/NotificationPopup.tsx
'use client'

import { Fragment, useState } from 'react'
import { Popover, Transition } from '@headlessui/react'
import { Bell, Check, X, AlertCircle, Calendar, Users, Euro, Package, Settings, UserCheck, Loader2 } from 'lucide-react'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { nl } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const notificationIcons = {
  appointment: Calendar,
  client: Users,
  payment: Euro,
  inventory: Package,
  system: Settings,
  staff: UserCheck,
}

const severityColors = {
  info: 'text-blue-600 bg-blue-50',
  warning: 'text-yellow-600 bg-yellow-50',
  error: 'text-red-600 bg-red-50',
  success: 'text-green-600 bg-green-50',
}

export function NotificationPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    dismiss,
    isMarkingAllAsRead,
  } = useNotifications({ limit: 20 })

  const handleNotificationClick = (notification: any) => {
    if (!notification.readAt) {
      markAsRead(notification.id)
    }
    if (notification.actionUrl) {
      setIsOpen(false)
    }
  }

  const formatNotificationDate = (dateString: string) => {
    const date = parseISO(dateString)
    if (isToday(date)) {
      return `Vandaag om ${format(date, 'HH:mm')}`
    } else if (isYesterday(date)) {
      return `Gisteren om ${format(date, 'HH:mm')}`
    } else {
      return format(date, 'd MMM om HH:mm', { locale: nl })
    }
  }

  // Group notifications by date
  const groupedNotifications = notifications.reduce((groups: any[], notification: any) => {
    const date = format(parseISO(notification.createdAt), 'yyyy-MM-dd')
    const existingGroup = groups.find(g => g.date === date)
    
    if (existingGroup) {
      existingGroup.notifications.push(notification)
    } else {
      groups.push({
        date,
        notifications: [notification],
      })
    }
    
    return groups
  }, [])

  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <Popover.Button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 sm:p-2 text-[#02011F] hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors relative min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#02011F]"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 flex items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-red-500 border-2 border-white">
                  {unreadCount > 9 && (
                    <span className="absolute -top-0.5 -right-0.5 text-[9px] text-white bg-red-500 rounded-full w-4 h-4 flex items-center justify-center font-medium">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </span>
              </span>
            )}
          </Popover.Button>

          <Transition
            show={isOpen}
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute right-0 z-50 mt-2 w-80 sm:w-96 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Meldingen</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      disabled={isMarkingAllAsRead}
                      className="text-sm text-[#02011F] hover:text-gray-700 font-medium disabled:opacity-50"
                    >
                      {isMarkingAllAsRead ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Alles als gelezen markeren'
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">Meldingen laden...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto" />
                    <p className="mt-2 text-sm text-gray-500">Geen meldingen</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {groupedNotifications.map((group) => (
                      <div key={group.date}>
                        <div className="px-4 py-2 bg-gray-50">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {isToday(parseISO(group.date + 'T00:00:00')) ? 'Vandaag' :
                             isYesterday(parseISO(group.date + 'T00:00:00')) ? 'Gisteren' :
                             format(parseISO(group.date + 'T00:00:00'), 'd MMMM', { locale: nl })}
                          </p>
                        </div>
                        {group.notifications.map((notification: any) => {
                          const Icon = notificationIcons[notification.type as keyof typeof notificationIcons]
                          const isUnread = !notification.readAt

                          return (
                            <div
                              key={notification.id}
                              className={cn(
                                'relative px-4 py-3 hover:bg-gray-50 transition-colors',
                                isUnread && 'bg-blue-50/30'
                              )}
                            >
                              {notification.actionUrl ? (
                                <Link
                                  href={notification.actionUrl}
                                  onClick={() => handleNotificationClick(notification)}
                                  className="block"
                                >
                                  <NotificationContent
                                    notification={notification}
                                    Icon={Icon}
                                    isUnread={isUnread}
                                  />
                                </Link>
                              ) : (
                                <div onClick={() => handleNotificationClick(notification)}>
                                  <NotificationContent
                                    notification={notification}
                                    Icon={Icon}
                                    isUnread={isUnread}
                                  />
                                </div>
                              )}
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  dismiss(notification.id)
                                }}
                                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 rounded"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-4 border-t border-gray-100">
                  <Link
                    href="/notifications"
                    onClick={() => setIsOpen(false)}
                    className="text-sm text-[#02011F] hover:text-gray-700 font-medium"
                  >
                    Alle meldingen bekijken
                  </Link>
                </div>
              )}
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  )
}

function NotificationContent({ notification, Icon, isUnread }: any) {
  return (
    <div className="flex gap-3">
      <div className={cn(
        'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
        severityColors[notification.severity as keyof typeof severityColors]
      )}>
        <Icon className="w-5 h-5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            'text-sm font-medium text-gray-900',
            isUnread && 'font-semibold'
          )}>
            {notification.title}
          </p>
          {isUnread && (
            <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1.5"></span>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-0.5">{notification.message}</p>
        <p className="text-xs text-gray-400 mt-1">
          {formatNotificationDate(notification.createdAt)}
        </p>
      </div>
    </div>
  )
}
```

#### 3.4 Update TopBar component
```typescript
// components/layout/TopBar.tsx - Update the notifications button section
import { NotificationPopup } from '@/components/notifications/NotificationPopup'

// Replace lines 117-121 with:
{/* Notifications */}
<NotificationPopup />
```

### 4. Integration Steps

#### 4.1 Create notification triggers for common events

```typescript
// lib/services/notificationTriggers.ts
import { NotificationService } from './notificationService'
import { Database } from '@/types/database'

type NotificationInsert = Database['public']['Tables']['notifications']['Insert']

export class NotificationTriggers {
  // New appointment notification
  static async onNewAppointment(
    tenantId: string,
    staffId: string,
    appointment: any
  ) {
    await NotificationService.create({
      tenant_id: tenantId,
      user_id: staffId,
      title: 'Nieuwe afspraak',
      message: `${appointment.client_name} heeft een afspraak geboekt voor ${appointment.service_name}`,
      type: 'appointment',
      severity: 'info',
      action_url: `/appointments/${appointment.id}`,
      action_label: 'Bekijken',
      metadata: { appointment_id: appointment.id }
    })
  }

  // Appointment cancelled
  static async onAppointmentCancelled(
    tenantId: string,
    staffId: string,
    appointment: any
  ) {
    await NotificationService.create({
      tenant_id: tenantId,
      user_id: staffId,
      title: 'Afspraak geannuleerd',
      message: `De afspraak met ${appointment.client_name} is geannuleerd`,
      type: 'appointment',
      severity: 'warning',
      action_url: `/appointments`,
      metadata: { appointment_id: appointment.id }
    })
  }

  // Payment received
  static async onPaymentReceived(
    tenantId: string,
    userId: string,
    payment: any
  ) {
    await NotificationService.create({
      tenant_id: tenantId,
      user_id: userId,
      title: 'Betaling ontvangen',
      message: `€${payment.amount} ontvangen van ${payment.client_name}`,
      type: 'payment',
      severity: 'success',
      action_url: `/invoices/${payment.invoice_id}`,
      action_label: 'Factuur bekijken',
      metadata: { payment_id: payment.id, amount: payment.amount }
    })
  }

  // Low inventory warning
  static async onLowInventory(
    tenantId: string,
    product: any
  ) {
    await NotificationService.create({
      tenant_id: tenantId,
      user_id: null, // Broadcast to all users in tenant
      title: 'Lage voorraad',
      message: `${product.name} heeft een lage voorraad (${product.current_stock} stuks)`,
      type: 'inventory',
      severity: 'warning',
      action_url: `/inventory/${product.id}`,
      action_label: 'Voorraad beheren',
      metadata: { product_id: product.id, current_stock: product.current_stock }
    })
  }

  // System maintenance
  static async onSystemMaintenance(
    message: string,
    scheduledTime: Date
  ) {
    // Get all tenants and create notifications
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id')

    if (tenants) {
      const notifications = tenants.map(tenant => ({
        tenant_id: tenant.id,
        user_id: null,
        title: 'Gepland onderhoud',
        message,
        type: 'system' as const,
        severity: 'info' as const,
        metadata: { scheduled_time: scheduledTime.toISOString() }
      }))

      await NotificationService.createBulk(notifications)
    }
  }
}
```

### 5. Testing & Validation

#### 5.1 Manual test scenarios
1. Click notification button - popup should open
2. View unread notifications - should show with blue background
3. Click notification with action URL - should navigate
4. Mark as read - notification should update
5. Mark all as read - all should update
6. Dismiss notification - should remove from list
7. Real-time test - create notification in another tab

#### 5.2 Create test notifications
```typescript
// scripts/test-notifications.ts
import { NotificationService } from '@/lib/services/notificationService'

async function createTestNotifications(tenantId: string, userId: string) {
  const testNotifications = [
    {
      tenant_id: tenantId,
      user_id: userId,
      title: 'Nieuwe klant registratie',
      message: 'Sophie van den Berg heeft zich geregistreerd',
      type: 'client' as const,
      severity: 'info' as const,
      action_url: '/clients',
    },
    {
      tenant_id: tenantId,
      user_id: userId,
      title: 'Afspraak over 30 minuten',
      message: 'Herinnering: Emma de Vries komt om 14:30',
      type: 'appointment' as const,
      severity: 'warning' as const,
      action_url: '/appointments',
    },
    {
      tenant_id: tenantId,
      user_id: userId,
      title: 'Betaling ontvangen',
      message: '€45,00 ontvangen voor behandeling',
      type: 'payment' as const,
      severity: 'success' as const,
    },
  ]

  await NotificationService.createBulk(testNotifications)
}
```

## Acceptance Criteria

1. **UI/UX Requirements**
   - [ ] Notification button shows unread count badge
   - [ ] Badge animates (pulse) when new notifications arrive
   - [ ] Popup opens on click with smooth animation
   - [ ] Notifications grouped by date
   - [ ] Unread notifications visually distinct
   - [ ] Loading state while fetching
   - [ ] Empty state when no notifications
   - [ ] Responsive design (mobile/desktop)

2. **Functionality**
   - [ ] Real-time updates without page refresh
   - [ ] Mark individual notification as read
   - [ ] Mark all notifications as read
   - [ ] Dismiss/delete notifications
   - [ ] Click through to action URLs
   - [ ] Toast notification for new arrivals
   - [ ] Persist read state across sessions

3. **Performance**
   - [ ] Pagination for large notification lists
   - [ ] Efficient database queries with indexes
   - [ ] Minimal re-renders on updates
   - [ ] Debounced real-time subscriptions

4. **Security**
   - [ ] RLS policies enforce tenant isolation
   - [ ] Users can only see own notifications
   - [ ] No cross-tenant data leakage
   - [ ] Secure WebSocket connections

## Technical Notes & References

### Database Considerations
- Use UUID for IDs for better security
- Index on (tenant_id, user_id, created_at) for performance
- Consider partitioning for large-scale deployments
- Archive old notifications after X days

### Real-time Architecture
- Supabase Realtime uses PostgreSQL LISTEN/NOTIFY
- Channel naming convention: `notifications:{tenant_id}:{user_id}`
- Consider connection pooling for many concurrent users

### State Management
- React Query for caching and synchronization
- Optimistic updates for better UX
- Background refetching every 30 seconds
- Invalidate queries on mutations

### Notification Types
- `appointment`: Booking related (new, cancelled, rescheduled)
- `client`: Client activities (new registration, updates)
- `payment`: Financial transactions
- `inventory`: Stock alerts
- `system`: Platform announcements
- `staff`: Team updates and scheduling

## Estimated Effort

**Total: 16-20 hours**

1. Database setup: 2 hours
2. Backend service: 3-4 hours
3. Frontend components: 4-5 hours
4. Real-time integration: 2-3 hours
5. Testing & debugging: 3-4 hours
6. Documentation: 2 hours

## Dependencies

- Supabase real-time subscriptions enabled
- React Query configured in the app
- Headless UI for popup component
- date-fns for date formatting
- Database migration tools set up

## Future Enhancements

1. **Push Notifications**
   - Browser push API integration
   - Mobile app push notifications
   - Email digest options

2. **Advanced Features**
   - Notification preferences per type
   - Snooze notifications
   - Custom notification sounds
   - Rich media in notifications

3. **Analytics**
   - Track notification engagement
   - Click-through rates
   - Most effective notification types

4. **Integration**
   - Webhook support for external services
   - Email/SMS gateway integration
   - Calendar app integration