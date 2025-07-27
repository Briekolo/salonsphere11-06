'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenant } from './useTenant';
import { supabase } from '@/lib/supabase';

interface NotificationSettings {
  email: {
    new_bookings: boolean;
    cancellations: boolean;
    reminders: boolean;
    daily_summary: boolean;
    payment_received: boolean;
    low_inventory: boolean;
  };
  sms: {
    enabled: boolean;
    new_bookings: boolean;
    reminders: boolean;
    cancellations: boolean;
  };
  staff: {
    new_bookings: boolean;
    cancellations: boolean;
    no_shows: boolean;
    schedule_changes: boolean;
  };
  client_reminders: {
    appointment_reminder_hours: number;
    send_confirmation_email: boolean;
    send_thank_you_email: boolean;
  };
}

export function useNotificationSettings() {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  const { data: notificationSettings, isLoading, error } = useQuery({
    queryKey: ['notification-settings', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      if (!tenantId) return null;

      const { data, error } = await supabase
        .from('tenants')
        .select('notification_preferences')
        .eq('id', tenantId)
        .single();

      if (error) throw error;
      return data?.notification_preferences as NotificationSettings | null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const invalidateNotificationSettings = () => {
    queryClient.invalidateQueries({ queryKey: ['notification-settings', tenantId] });
    queryClient.invalidateQueries({ queryKey: ['tenant'] });
  };

  // Helper function to check if email notifications are enabled for a type
  const isEmailNotificationEnabled = (type: keyof NotificationSettings['email']): boolean => {
    return notificationSettings?.email?.[type] || false;
  };

  // Helper function to check if SMS notifications are enabled
  const isSmsEnabled = (): boolean => {
    return notificationSettings?.sms?.enabled || false;
  };

  // Helper function to check if SMS notifications are enabled for a type
  const isSmsNotificationEnabled = (type: keyof NotificationSettings['sms']): boolean => {
    if (!isSmsEnabled()) return false;
    return notificationSettings?.sms?.[type] || false;
  };

  // Helper function to check if staff notifications are enabled for a type
  const isStaffNotificationEnabled = (type: keyof NotificationSettings['staff']): boolean => {
    return notificationSettings?.staff?.[type] || false;
  };

  // Helper function to get reminder timing
  const getReminderTiming = (): number => {
    return notificationSettings?.client_reminders?.appointment_reminder_hours || 24;
  };

  // Helper function to check if confirmation emails should be sent
  const shouldSendConfirmationEmail = (): boolean => {
    return notificationSettings?.client_reminders?.send_confirmation_email || false;
  };

  // Helper function to check if thank you emails should be sent
  const shouldSendThankYouEmail = (): boolean => {
    return notificationSettings?.client_reminders?.send_thank_you_email || false;
  };

  // Helper function to get reminder date/time for an appointment
  const getReminderDateTime = (appointmentDateTime: Date): Date => {
    const reminderHours = getReminderTiming();
    const reminderDate = new Date(appointmentDateTime);
    reminderDate.setHours(reminderDate.getHours() - reminderHours);
    return reminderDate;
  };

  // Helper function to check if notifications should be sent for a specific event
  const shouldNotify = (event: 'booking' | 'cancellation' | 'reminder' | 'no_show' | 'schedule_change' | 'payment' | 'inventory', channel: 'email' | 'sms' | 'staff' = 'email'): boolean => {
    if (!notificationSettings) return false;

    switch (channel) {
      case 'email':
        switch (event) {
          case 'booking': return isEmailNotificationEnabled('new_bookings');
          case 'cancellation': return isEmailNotificationEnabled('cancellations');
          case 'reminder': return isEmailNotificationEnabled('reminders');
          case 'payment': return isEmailNotificationEnabled('payment_received');
          case 'inventory': return isEmailNotificationEnabled('low_inventory');
          default: return false;
        }
      case 'sms':
        switch (event) {
          case 'booking': return isSmsNotificationEnabled('new_bookings');
          case 'cancellation': return isSmsNotificationEnabled('cancellations');
          case 'reminder': return isSmsNotificationEnabled('reminders');
          default: return false;
        }
      case 'staff':
        switch (event) {
          case 'booking': return isStaffNotificationEnabled('new_bookings');
          case 'cancellation': return isStaffNotificationEnabled('cancellations');
          case 'no_show': return isStaffNotificationEnabled('no_shows');
          case 'schedule_change': return isStaffNotificationEnabled('schedule_changes');
          default: return false;
        }
      default:
        return false;
    }
  };

  return {
    notificationSettings,
    isLoading,
    error,
    invalidateNotificationSettings,
    isEmailNotificationEnabled,
    isSmsEnabled,
    isSmsNotificationEnabled,
    isStaffNotificationEnabled,
    getReminderTiming,
    shouldSendConfirmationEmail,
    shouldSendThankYouEmail,
    getReminderDateTime,
    shouldNotify
  };
}