import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type TreatmentSeries = Database['public']['Tables']['treatment_series']['Row']
type TreatmentSeriesInsert = Database['public']['Tables']['treatment_series']['Insert']
type TreatmentSeriesUpdate = Database['public']['Tables']['treatment_series']['Update']

export interface TreatmentSeriesWithDetails extends TreatmentSeries {
  client_name?: string
  client_email?: string
  client_phone?: string
  service_name?: string
  service_duration?: number
  service_price?: number
  staff_name?: string
  total_booked_sessions?: number
  next_appointment_date?: string
}

export interface CreateTreatmentSeriesParams {
  client_id: string
  service_id: string
  staff_id?: string
  start_date: string
  total_sessions: number
  interval_weeks?: number
  package_discount?: number
  notes?: string
  custom_dates?: string[] // Optional custom dates for appointments
}

export class TreatmentSeriesService {
  static async createSeries(params: CreateTreatmentSeriesParams): Promise<string> {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) throw new Error('Not authenticated')

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', userData.user.id)
      .single()

    if (profileError || !userProfile.tenant_id) {
      throw new Error('Could not fetch tenant information')
    }

    // If custom dates are provided, use the new function
    if (params.custom_dates && params.custom_dates.length > 0) {
      // Convert datetime-local strings to ISO format with timezone
      const isoCustomDates = params.custom_dates.map(dateStr => {
        // dateStr is in format "yyyy-MM-dd'T'HH:mm"
        // Convert to proper ISO string by adding seconds and timezone
        const date = new Date(dateStr)
        return date.toISOString()
      })
      
      const { data, error } = await supabase.rpc('create_treatment_series_with_custom_appointments', {
        p_tenant_id: userProfile.tenant_id,
        p_client_id: params.client_id,
        p_service_id: params.service_id,
        p_staff_id: params.staff_id || null,
        p_custom_dates: isoCustomDates,
        p_package_discount: params.package_discount || 0,
        p_notes: params.notes || null
      })
      
      if (error) {
        // Check if it's a business hours validation error
        if (error.message.includes('outside business hours')) {
          throw new Error('Een of meer afspraken vallen buiten de openingstijden van het salon')
        }
        throw error
      }
      return data
    }

    // Otherwise use the existing interval-based function
    // Convert start date to ISO format
    const isoStartDate = new Date(params.start_date).toISOString()
    
    const { data, error } = await supabase.rpc('create_treatment_series_with_appointments', {
      p_tenant_id: userProfile.tenant_id,
      p_client_id: params.client_id,
      p_service_id: params.service_id,
      p_staff_id: params.staff_id || null,
      p_start_date: isoStartDate,
      p_total_sessions: params.total_sessions,
      p_interval_weeks: params.interval_weeks || null,
      p_package_discount: params.package_discount || 0,
      p_notes: params.notes || null
    })

    if (error) throw error
    return data
  }

  static async getSeriesByClient(clientId: string): Promise<TreatmentSeriesWithDetails[]> {
    const { data, error } = await supabase
      .from('treatment_series_details')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async getSeriesById(seriesId: string): Promise<TreatmentSeriesWithDetails | null> {
    const { data, error } = await supabase
      .from('treatment_series_details')
      .select('*')
      .eq('id', seriesId)
      .single()

    if (error) throw error
    return data
  }

  static async updateSeries(seriesId: string, updates: TreatmentSeriesUpdate): Promise<TreatmentSeries> {
    // Remove updated_at from updates as it's handled by the database
    const { updated_at, ...cleanUpdates } = updates as any
    
    const { data, error } = await supabase
      .from('treatment_series')
      .update(cleanUpdates)
      .eq('id', seriesId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getActiveSeries(tenantId: string): Promise<TreatmentSeriesWithDetails[]> {
    const { data, error } = await supabase
      .from('treatment_series_details')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .order('next_appointment_date', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async getAllSeries(tenantId: string): Promise<TreatmentSeriesWithDetails[]> {
    const { data, error } = await supabase
      .from('treatment_series_details')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async getSeriesBookings(seriesId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        services (name, duration_minutes, price),
        clients (first_name, last_name, email, phone),
        users!bookings_staff_id_fkey (first_name, last_name)
      `)
      .eq('series_id', seriesId)
      .order('series_session_number', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async cancelSeries(seriesId: string): Promise<void> {
    // First cancel all pending bookings
    const { error: bookingsError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('series_id', seriesId)
      .in('status', ['confirmed', 'pending'])

    if (bookingsError) throw bookingsError

    // Then update the series status
    const { error: seriesError } = await supabase
      .from('treatment_series')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
        // updated_at is handled by the database trigger
      })
      .eq('id', seriesId)

    if (seriesError) throw seriesError
  }

  static async pauseSeries(seriesId: string): Promise<void> {
    const { error } = await supabase
      .from('treatment_series')
      .update({ status: 'paused' })
      .eq('id', seriesId)

    if (error) throw error
  }

  static async resumeSeries(seriesId: string): Promise<void> {
    const { error } = await supabase
      .from('treatment_series')
      .update({ status: 'active' })
      .eq('id', seriesId)

    if (error) throw error
  }
}