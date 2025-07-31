'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
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

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const {
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    dismiss,
    isMarkingAllAsRead,
  } = useNotifications({ limit: 100 });

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read_at)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const formatNotificationDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return `Vandaag om ${format(date, 'HH:mm')}`;
    } else if (isYesterday(date)) {
      return `Gisteren om ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'd MMMM yyyy om HH:mm', { locale: nl });
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

  return (
    <div className="h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Meldingen</h1>
              <p className="text-sm text-gray-500 mt-1">
                Beheer al je meldingen op één plek
              </p>
            </div>

            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                    filter === 'all'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  )}
                >
                  Alle meldingen
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                    filter === 'unread'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  )}
                >
                  Ongelezen ({unreadCount})
                </button>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  disabled={isMarkingAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
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

            {/* Notifications List */}
            <div className="bg-white rounded-lg shadow">
              {isLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">Meldingen laden...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto" />
                  <p className="mt-2 text-sm text-gray-500">
                    {filter === 'unread' ? 'Geen ongelezen meldingen' : 'Geen meldingen'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {groupedNotifications.map((group) => (
                    <div key={group.date}>
                      <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-700">
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
                                  </div>
                                  {isUnread && (
                                    <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></span>
                                  )}
                                </div>

                                <div className="flex items-center gap-4 mt-3">
                                  {notification.action_url && (
                                    <Link
                                      href={notification.action_url}
                                      onClick={() => !isUnread || markAsRead(notification.id)}
                                      className="text-sm font-medium text-[#02011F] hover:text-gray-700"
                                    >
                                      {notification.action_label || 'Bekijken'}
                                    </Link>
                                  )}
                                  {!isUnread && (
                                    <button
                                      onClick={() => markAsRead(notification.id)}
                                      className="text-sm text-gray-500 hover:text-gray-700"
                                    >
                                      Als ongelezen markeren
                                    </button>
                                  )}
                                  <button
                                    onClick={() => dismiss(notification.id)}
                                    className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Verwijderen
                                  </button>
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
        </main>
      </div>
    </div>
  );
}