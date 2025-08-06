import { supabase } from '@/lib/supabase/client'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

interface ExpectedRevenueMetrics {
  totalExpected: number
  weeklyExpected: number
  monthlyExpected: number
  bookingsCount: number
  averageBookingValue: number
}

export class ExpectedRevenueService {
  static async getMetrics(tenantId: string): Promise<ExpectedRevenueMetrics> {
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    // Get all future bookings
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, scheduled_at, service_id')
      .eq('tenant_id', tenantId)
      .in('status', ['scheduled', 'confirmed'])
      .gte('scheduled_at', now.toISOString())
      .not('service_id', 'is', null)

    if (error || !bookings) {
      console.error('Error fetching expected revenue metrics:', error)
      return {
        totalExpected: 0,
        weeklyExpected: 0,
        monthlyExpected: 0,
        bookingsCount: 0,
        averageBookingValue: 0
      }
    }

    // Get unique service IDs
    const serviceIds = [...new Set(bookings.map(b => b.service_id).filter(Boolean))]
    
    if (serviceIds.length === 0) {
      return {
        totalExpected: 0,
        weeklyExpected: 0,
        monthlyExpected: 0,
        bookingsCount: 0,
        averageBookingValue: 0
      }
    }

    // Fetch services separately
    const { data: services } = await supabase
      .from('services')
      .select('id, price')
      .in('id', serviceIds)

    // Create a map of service prices
    const servicePriceMap = new Map(
      services?.map(s => [s.id, Number(s.price) || 0]) || []
    )

    let totalExpected = 0
    let weeklyExpected = 0
    let monthlyExpected = 0
    let bookingsCount = 0

    bookings.forEach(booking => {
      if (booking.service_id) {
        const price = servicePriceMap.get(booking.service_id) || 0
        const scheduledDate = new Date(booking.scheduled_at)
        
        totalExpected += price
        bookingsCount++

        // Check if in current week
        if (scheduledDate >= weekStart && scheduledDate <= weekEnd) {
          weeklyExpected += price
        }

        // Check if in current month
        if (scheduledDate >= monthStart && scheduledDate <= monthEnd) {
          monthlyExpected += price
        }
      }
    })

    console.log('Expected Revenue Metrics:', { 
      totalExpected, 
      weeklyExpected, 
      monthlyExpected, 
      bookingsCount 
    })

    const averageBookingValue = bookingsCount > 0 ? totalExpected / bookingsCount : 0

    return {
      totalExpected,
      weeklyExpected,
      monthlyExpected,
      bookingsCount,
      averageBookingValue
    }
  }

  static async getExpectedRevenueByPeriod(
    tenantId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<Map<string, number>> {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, scheduled_at, service_id')
      .eq('tenant_id', tenantId)
      .in('status', ['scheduled', 'confirmed'])
      .gte('scheduled_at', startDate.toISOString())
      .lte('scheduled_at', endDate.toISOString())
      .not('service_id', 'is', null)

    if (error || !bookings) {
      console.error('Error fetching expected revenue by period:', error)
      return new Map()
    }

    // Get unique service IDs
    const serviceIds = [...new Set(bookings.map(b => b.service_id).filter(Boolean))]
    
    if (serviceIds.length === 0) {
      return new Map()
    }

    // Fetch services separately
    const { data: services } = await supabase
      .from('services')
      .select('id, price')
      .in('id', serviceIds)

    // Create a map of service prices
    const servicePriceMap = new Map(
      services?.map(s => [s.id, Number(s.price) || 0]) || []
    )

    const revenueByDate = new Map<string, number>()

    bookings.forEach(booking => {
      if (booking.service_id && booking.scheduled_at) {
        const date = format(new Date(booking.scheduled_at), 'yyyy-MM-dd')
        const price = servicePriceMap.get(booking.service_id) || 0
        const current = revenueByDate.get(date) || 0
        revenueByDate.set(date, current + price)
      }
    })

    return revenueByDate
  }

  static async getOccupancyRate(tenantId: string, date: Date): Promise<number> {
    // Get total available slots (assuming 8 hours per day, 15 min slots = 32 slots)
    const totalSlots = 32

    // Get booked slots for the date
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('duration_minutes')
      .eq('tenant_id', tenantId)
      .in('status', ['scheduled', 'confirmed'])
      .gte('scheduled_at', startOfDay.toISOString())
      .lte('scheduled_at', endOfDay.toISOString())

    if (error || !bookings) {
      console.error('Error calculating occupancy rate:', error)
      return 0
    }

    const bookedMinutes = bookings.reduce((sum, booking) => 
      sum + (booking.duration_minutes || 60), 0
    )
    
    const bookedSlots = bookedMinutes / 30
    const occupancyRate = (bookedSlots / totalSlots) * 100

    return Math.min(100, Math.round(occupancyRate))
  }
}