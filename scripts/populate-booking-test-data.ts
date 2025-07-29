/**
 * Script to populate test data for booking system
 * Run with: npx tsx scripts/populate-booking-test-data.ts
 */

import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Need service role for admin operations

const supabase = createClient<Database>(supabaseUrl, supabaseKey)

async function populateBookingTestData() {
  console.log('Starting to populate booking test data...')

  try {
    // Get all tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name')

    if (tenantsError) {
      throw tenantsError
    }

    console.log(`Found ${tenants?.length || 0} tenants`)

    for (const tenant of tenants || []) {
      console.log(`Processing tenant: ${tenant.name}`)

      // Get all staff/admin users for this tenant
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, first_name, last_name, role')
        .eq('tenant_id', tenant.id)
        .in('role', ['staff', 'admin'])

      if (usersError) {
        console.error(`Error fetching users for tenant ${tenant.id}:`, usersError)
        continue
      }

      console.log(`Found ${users?.length || 0} staff/admin users`)

      // Create staff schedules (Monday to Friday, 9 AM to 5 PM)
      for (const user of users || []) {
        for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) {
          const { error: scheduleError } = await supabase
            .from('staff_schedules')
            .upsert({
              tenant_id: tenant.id,
              staff_id: user.id,
              day_of_week: dayOfWeek,
              start_time: '09:00:00',
              end_time: '17:00:00',
              is_active: true
            }, {
              onConflict: 'tenant_id,staff_id,day_of_week'
            })

          if (scheduleError && !scheduleError.message.includes('duplicate key')) {
            console.error(`Error creating schedule for ${user.first_name}:`, scheduleError)
          }
        }
        console.log(`Created schedules for ${user.first_name} ${user.last_name}`)
      }

      // Get all services for this tenant
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id, name')
        .eq('tenant_id', tenant.id)

      if (servicesError) {
        console.error(`Error fetching services for tenant ${tenant.id}:`, servicesError)
        continue
      }

      console.log(`Found ${services?.length || 0} services`)

      // Create staff-service assignments (all staff can perform all services)
      for (const user of users || []) {
        for (const service of services || []) {
          const { error: assignmentError } = await supabase
            .from('staff_services')
            .upsert({
              tenant_id: tenant.id,
              staff_id: user.id,
              service_id: service.id,
              proficiency_level: 'standard',
              active: true
            }, {
              onConflict: 'staff_id,service_id'
            })

          if (assignmentError && !assignmentError.message.includes('duplicate key')) {
            console.error(`Error creating staff-service assignment:`, assignmentError)
          }
        }
        console.log(`Created service assignments for ${user.first_name}`)
      }

      // Update services with booking requirements
      const { error: servicesUpdateError } = await supabase
        .from('services')
        .update({
          buffer_time_before: 0,
          buffer_time_after: 15,
          max_advance_days: 90,
          min_advance_hours: 2
        })
        .eq('tenant_id', tenant.id)
        .is('buffer_time_before', null)

      if (servicesUpdateError) {
        console.error(`Error updating services for tenant ${tenant.id}:`, servicesUpdateError)
      } else {
        console.log('Updated service booking requirements')
      }
    }

    console.log('✅ Booking test data population completed!')
  } catch (error) {
    console.error('❌ Error populating booking test data:', error)
  }
}

// Run the script
populateBookingTestData()