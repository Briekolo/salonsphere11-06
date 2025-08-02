// Test script to create notifications for testing
// This should be run after the database migration is applied

import { NotificationService } from '@/lib/services/notificationService'

export async function createTestNotifications(tenantId: string, userId: string) {
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
      action_url: '/staff/appointments',
    },
    {
      tenant_id: tenantId,
      user_id: userId,
      title: 'Betaling ontvangen',
      message: '€45,00 ontvangen voor behandeling',
      type: 'payment' as const,
      severity: 'success' as const,
    },
    {
      tenant_id: tenantId,
      user_id: null, // Broadcast to all users in tenant
      title: 'Lage voorraad',
      message: 'Shampoo heeft een lage voorraad (3 stuks)',
      type: 'inventory' as const,
      severity: 'warning' as const,
      action_url: '/inventory',
    },
    {
      tenant_id: tenantId,
      user_id: null, // Broadcast to all users in tenant
      title: 'Nieuwe update beschikbaar',
      message: 'SalonSphere v2.1 is nu beschikbaar met nieuwe functies',
      type: 'system' as const,
      severity: 'success' as const,
      action_url: 'https://updates.salonsphere.nl/v2.1',
      action_label: 'Meer info',
    },
  ]

  console.log('Creating test notifications...')
  
  try {
    const results = await NotificationService.createBulk(testNotifications)
    console.log(`Successfully created ${results.length} test notifications`)
    return results
  } catch (error) {
    console.error('Error creating test notifications:', error)
    throw error
  }
}

// Manual test function for debugging
export async function testNotificationFunctionality() {
  console.log('Testing notification functionality...')
  
  // This would be called with actual tenant and user IDs
  const TENANT_ID = 'your-tenant-id'
  const USER_ID = 'your-user-id'
  
  try {
    // Test creating notifications
    await createTestNotifications(TENANT_ID, USER_ID)
    
    // Test fetching notifications
    const notifications = await NotificationService.getNotifications(TENANT_ID, USER_ID, { limit: 10 })
    console.log(`Fetched ${notifications.length} notifications`)
    
    // Test getting unread count
    const unreadCount = await NotificationService.getUnreadCount(TENANT_ID, USER_ID)
    console.log(`Unread count: ${unreadCount}`)
    
    // Test marking as read (if notifications exist)
    if (notifications.length > 0) {
      await NotificationService.markAsRead(notifications[0].id)
      console.log('Marked first notification as read')
    }
    
    console.log('All notification functionality tests passed!')
    
  } catch (error) {
    console.error('Notification functionality test failed:', error)
    throw error
  }
}