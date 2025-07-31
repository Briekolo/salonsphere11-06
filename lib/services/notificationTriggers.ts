import { NotificationService } from './notificationService'
import { Database } from '@/types/database'
import { supabase } from '@/lib/supabase/client'
import { debugLog } from '@/lib/utils/error-logger'

type NotificationInsert = Database['public']['Tables']['notifications']['Insert']

export class NotificationTriggers {
  // New appointment notification
  static async onNewAppointment(
    tenantId: string,
    staffId: string,
    appointment: any
  ) {
    debugLog('NotificationTriggers.onNewAppointment', 'Triggered', {
      tenantId,
      staffId,
      appointmentId: appointment.id
    });
    
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

  // Appointment reminder (30 minutes before)
  static async onAppointmentReminder(
    tenantId: string,
    staffId: string,
    appointment: any
  ) {
    await NotificationService.create({
      tenant_id: tenantId,
      user_id: staffId,
      title: 'Afspraak herinnering',
      message: `Herinnering: ${appointment.client_name} komt over 30 minuten`,
      type: 'appointment',
      severity: 'warning',
      action_url: `/appointments/${appointment.id}`,
      action_label: 'Bekijken',
      metadata: { appointment_id: appointment.id }
    })
  }


  // New client registration
  static async onNewClientRegistration(
    tenantId: string,
    client: any
  ) {
    const isBookingRegistration = client.source === 'booking'
    const title = isBookingRegistration ? 'Nieuwe klant via online boeking' : 'Nieuwe klant registratie'
    const message = isBookingRegistration 
      ? `${client.first_name} ${client.last_name} heeft zich geregistreerd via online boeking`
      : `${client.first_name} ${client.last_name} is toegevoegd als nieuwe klant`

    await NotificationService.create({
      tenant_id: tenantId,
      user_id: null, // Broadcast to all users in tenant
      title,
      message,
      type: 'client',
      severity: 'success',
      action_url: `/clients/${client.id}`,
      action_label: 'Klant bekijken',
      metadata: { 
        client_id: client.id,
        source: client.source || 'manual',
        email: client.email,
        phone: client.phone
      }
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

  // Product out of stock
  static async onProductOutOfStock(
    tenantId: string,
    product: any
  ) {
    await NotificationService.create({
      tenant_id: tenantId,
      user_id: null, // Broadcast to all users in tenant
      title: 'Product uitverkocht',
      message: `${product.name} is uitverkocht`,
      type: 'inventory',
      severity: 'error',
      action_url: `/inventory/${product.id}`,
      action_label: 'Voorraad bijvullen',
      metadata: { product_id: product.id }
    })
  }

  // New staff member assigned
  static async onStaffAssigned(
    tenantId: string,
    staffId: string,
    assignment: any
  ) {
    await NotificationService.create({
      tenant_id: tenantId,
      user_id: staffId,
      title: 'Nieuwe toewijzing',
      message: `Je bent toegewezen aan ${assignment.service_name}`,
      type: 'staff',
      severity: 'info',
      action_url: `/treatments`,
      action_label: 'Bekijken',
      metadata: { assignment_id: assignment.id }
    })
  }

  // Staff schedule changed
  static async onStaffScheduleChanged(
    tenantId: string,
    staffId: string,
    scheduleChange: any
  ) {
    let title = 'Werkschema gewijzigd'
    let message = `${scheduleChange.staff_name} heeft het werkschema bijgewerkt`
    let severity: 'info' | 'warning' | 'error' | 'success' = 'info'

    // Customize message based on change type
    switch (scheduleChange.change_type) {
      case 'schedule_updated':
        message = `${scheduleChange.staff_name} heeft het werkschema bijgewerkt`
        break
      case 'time_off':
        title = 'Verlof aangevraagd'
        message = `${scheduleChange.staff_name} heeft verlof aangevraagd voor ${scheduleChange.date}`
        severity = 'warning'
        break
      case 'extra_hours':
        title = 'Extra uren toegevoegd'
        message = `${scheduleChange.staff_name} heeft extra uren toegevoegd voor ${scheduleChange.date}`
        severity = 'success'
        break
      case 'time_off_updated':
        title = 'Verlof gewijzigd'
        message = `${scheduleChange.staff_name} heeft verlof gewijzigd voor ${scheduleChange.date}`
        severity = 'warning'
        break
      case 'extra_hours_updated':
        title = 'Extra uren gewijzigd'
        message = `${scheduleChange.staff_name} heeft extra uren gewijzigd voor ${scheduleChange.date}`
        break
      case 'time_off_cancelled':
        title = 'Verlof geannuleerd'
        message = `${scheduleChange.staff_name} heeft verlof geannuleerd voor ${scheduleChange.date}`
        break
      case 'extra_hours_cancelled':
        title = 'Extra uren geannuleerd'
        message = `${scheduleChange.staff_name} heeft extra uren geannuleerd voor ${scheduleChange.date}`
        break
    }

    // Notify admin users (users with role admin or owner)
    await NotificationService.create({
      tenant_id: tenantId,
      user_id: null, // Broadcast to all admin users in tenant
      title,
      message,
      type: 'staff',
      severity,
      action_url: `/admin/staff/${staffId}/availability`,
      action_label: 'Beschikbaarheid bekijken',
      metadata: { 
        staff_id: staffId,
        change_type: scheduleChange.change_type,
        date: scheduleChange.date,
        start_time: scheduleChange.start_time,
        end_time: scheduleChange.end_time,
        reason: scheduleChange.reason
      }
    })
  }

  // System maintenance notification
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

  // System update notification
  static async onSystemUpdate(
    title: string,
    message: string,
    actionUrl?: string
  ) {
    // Get all tenants and create notifications
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id')

    if (tenants) {
      const notifications = tenants.map(tenant => ({
        tenant_id: tenant.id,
        user_id: null,
        title,
        message,
        type: 'system' as const,
        severity: 'success' as const,
        action_url: actionUrl,
        action_label: actionUrl ? 'Meer info' : undefined
      }))

      await NotificationService.createBulk(notifications)
    }
  }
}