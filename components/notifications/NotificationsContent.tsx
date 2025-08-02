'use client';

import { useState } from 'react';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Bell, Calendar, Users, Euro, Package, Settings, UserCheck, Check, Loader2, Trash2 } from 'lucide-react';
import Link from 'next/link';

const notificationIcons = {
  appointment: Calendar,
  client: Users,
  payment: Euro,
  inventory: Package,
  system: Settings,
  staff: UserCheck,
};

const severityColors = {
  info: 'text-blue-600 bg-blue-50',
  warning: 'text-yellow-600 bg-yellow-50',
  error: 'text-red-600 bg-red-50',
  success: 'text-green-600 bg-green-50',
};

export function NotificationsContent() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    dismiss,
    isMarkingAllAsRead,
  } = useNotifications({ limit: 100 });

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read_at)
    : notifications;

  const formatNotificationDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return `Vandaag om ${format(date, 'HH:mm')}`;
    } else if (isYesterday(date)) {
      return `Gisteren om ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'd MMMM \'om\' HH:mm', { locale: nl });
    }
  };

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce((groups: any[], notification: any) => {
    const date = format(parseISO(notification.created_at), 'yyyy-MM-dd');
    const existingGroup = groups.find(g => g.date === date);
    
    if (existingGroup) {
      existingGroup.notifications.push(notification);
    } else {
      groups.push({
        date,
        notifications: [notification],
      });
    }
    
    return groups;
  }, []);

  const handleNotificationClick = (notification: any) => {
    if (!notification.read_at) {
      markAsRead(notification.id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-gray-400" />
              <h1 className="text-xl font-semibold text-gray-900">Meldingen</h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Filter buttons */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setFilter('all')}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                    filter === 'all'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  Alle
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                    filter === 'unread'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  Ongelezen ({unreadCount})
                </button>
              </div>

              {/* Mark all as read */}
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  disabled={isMarkingAllAsRead}
                  className="text-sm text-[#02011F] hover:text-gray-700 font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {isMarkingAllAsRead ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Alles als gelezen markeren
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications list */}
        <div className="max-h-[calc(100vh-240px)] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Meldingen laden...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="mt-2 text-gray-500">
                {filter === 'unread' ? 'Geen ongelezen meldingen' : 'Geen meldingen'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {groupedNotifications.map((group) => (
                <div key={group.date}>
                  <div className="px-6 py-2 bg-gray-50">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isToday(parseISO(group.date + 'T00:00:00')) ? 'Vandaag' :
                       isYesterday(parseISO(group.date + 'T00:00:00')) ? 'Gisteren' :
                       format(parseISO(group.date + 'T00:00:00'), 'd MMMM yyyy', { locale: nl })}
                    </p>
                  </div>
                  {group.notifications.map((notification: any) => {
                    const Icon = notificationIcons[notification.type as keyof typeof notificationIcons];
                    const isUnread = !notification.read_at;

                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          'relative px-6 py-4 hover:bg-gray-50 transition-colors',
                          isUnread && 'bg-blue-50/30'
                        )}
                      >
                        <div className="flex gap-4">
                          <div className={cn(
                            'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
                            severityColors[notification.severity as keyof typeof severityColors]
                          )}>
                            <Icon className="w-6 h-6" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className={cn(
                                  'text-sm font-medium text-gray-900',
                                  isUnread && 'font-semibold'
                                )}>
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {formatNotificationDate(notification.created_at)}
                                </p>
                                {notification.action_url && (
                                  <Link
                                    href={notification.action_url}
                                    onClick={() => handleNotificationClick(notification)}
                                    className="text-xs text-[#02011F] hover:text-gray-700 font-medium mt-2 inline-block"
                                  >
                                    Bekijken →
                                  </Link>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {isUnread && (
                                  <button
                                    onClick={() => markAsRead(notification.id)}
                                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                    aria-label="Mark as read"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => dismiss(notification.id)}
                                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                  aria-label="Dismiss notification"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}