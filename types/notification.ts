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