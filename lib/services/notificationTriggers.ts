import { NotificationService } from './notificationService'
import { Database } from '@/types/database'
import { supabase } from '@/lib/supabase/client'

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

  // Payment overdue
  static async onPaymentOverdue(
    tenantId: string,
    userId: string,
    invoice: any
  ) {
    await NotificationService.create({
      tenant_id: tenantId,
      user_id: userId,
      title: 'Betaling achterstallig',
      message: `Factuur ${invoice.number} van €${invoice.total} is achterstallig`,
      type: 'payment',
      severity: 'error',
      action_url: `/invoices/${invoice.id}`,
      action_label: 'Factuur bekijken',
      metadata: { invoice_id: invoice.id, amount: invoice.total }
    })
  }

  // New client registration
  static async onNewClientRegistration(
    tenantId: string,
    client: any
  ) {
    await NotificationService.create({
      tenant_id: tenantId,
      user_id: null, // Broadcast to all users in tenant
      title: 'Nieuwe klant registratie',
      message: `${client.first_name} ${client.last_name} heeft zich geregistreerd`,
      type: 'client',
      severity: 'info',
      action_url: `/clients/${client.id}`,
      action_label: 'Klant bekijken',
      metadata: { client_id: client.id }
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