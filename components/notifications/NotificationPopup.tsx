'use client'

import { useState, useRef, useEffect } from 'react'
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
  const popupRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    dismiss,
    isMarkingAllAsRead,
  } = useNotifications({ limit: 20 })

  // Handle clicks outside the popup to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popupRef.current && 
        !popupRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle escape key to close popup
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleNotificationClick = (notification: any) => {
    if (!notification.read_at) {
      markAsRead(notification.id)
    }
    if (notification.action_url) {
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
    const date = format(parseISO(notification.created_at), 'yyyy-MM-dd')
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
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 sm:p-2 text-[#02011F] hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors relative min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#02011F]"
        aria-label="Notifications"
        aria-expanded={isOpen}
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
      </button>

      {/* Custom Popup Panel */}
      <div
        ref={popupRef}
        className={cn(
          'absolute right-0 z-50 mt-2 w-80 sm:w-96 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none transition-all duration-200',
          isOpen 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-1 pointer-events-none'
        )}
        style={{ transformOrigin: 'top right' }}
      >
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
                    const isUnread = !notification.read_at

                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          'relative px-4 py-3 hover:bg-gray-50 transition-colors',
                          isUnread && 'bg-blue-50/30'
                        )}
                      >
                        {notification.action_url ? (
                          <Link
                            href={notification.action_url}
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
                          aria-label="Dismiss notification"
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
      </div>
    </div>
  )
}

function NotificationContent({ notification, Icon, isUnread }: any) {
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
          {formatNotificationDate(notification.created_at)}
        </p>
      </div>
    </div>
  )
}