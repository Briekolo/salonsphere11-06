import { supabase, getCurrentUserTenantId } from '@/lib/supabase'
import { Database } from '@/types/database'
import { OverheadMetrics, TreatmentOverheadAnalysis } from '@/types/overhead'

type Service = Database['public']['Tables']['services']['Row']
type ServiceInsert = Database['public']['Tables']['services']['Insert']
type ServiceUpdate = Database['public']['Tables']['services']['Update']

export class ServiceService {
  static async getAll(): Promise<Service[]> {
    const tenantId = await getCurrentUserTenantId()

    if (!tenantId) throw new Error('No tenant found')

    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        treatment_categories!category_id (
          id,
          name,
          color
        )
      `)
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async getActive(): Promise<Service[]> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async getById(id: string): Promise<Service | null> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error) throw error
    return data
  }

  static async create(service: Omit<ServiceInsert, 'tenant_id'>): Promise<Service> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const { data, error } = await supabase
      .from('services')
      .insert({ ...service, tenant_id: tenantId })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async update(id: string, updates: Omit<ServiceUpdate, 'tenant_id'>): Promise<Service> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) throw error
  }

  static async getByCategory(category: string): Promise<Service[]> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('category', category)
      .eq('active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  }

  static calculateMargin(price: number, materialCost: number): number {
    if (price <= 0) return 0
    return ((price - materialCost) / price) * 100
  }

  // Overhead calculation methods
  static async getOverheadMetrics(monthYear?: Date): Promise<OverheadMetrics | null> {
    try {
      const tenantId = await getCurrentUserTenantId()
      if (!tenantId) throw new Error('No tenant found')

      const { data, error } = await supabase
        .rpc('get_overhead_metrics', {
          tenant_id_param: tenantId,
          month_year: monthYear || new Date()
        })
        .single()

      if (error) {
        console.error('Error fetching overhead metrics:', error)
        // Check if it's a function not found error
        if (error.code === '42883' || error.message?.includes('function') || error.message?.includes('does not exist')) {
          console.warn('get_overhead_metrics function not found - returning default values')
          return {
            overhead_monthly: 0,
            total_treatments: 0,
            overhead_per_treatment: 0,
            average_treatment_price: 0,
            overhead_percentage: 0,
            month_analyzed: (monthYear || new Date()).toISOString()
          }
        }
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getOverheadMetrics:', error)
      return null
    }
  }

  static async getMonthlyTreatmentCount(monthYear?: Date): Promise<number> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const date = monthYear || new Date()
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1)
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)

    const { count, error } = await supabase
      .from('bookings')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('status', 'completed')
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())

    if (error) throw error
    return count || 0
  }

  static async getAverageTreatmentPrice(monthYear?: Date): Promise<number> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const date = monthYear || new Date()
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1)
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)

    const { data, error } = await supabase
      .from('bookings')
      .select('total_price')
      .eq('tenant_id', tenantId)
      .eq('status', 'completed')
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .gt('total_price', 0)

    if (error) throw error
    
    if (!data || data.length === 0) return 0
    
    const sum = data.reduce((acc, booking) => acc + (booking.total_price || 0), 0)
    return sum / data.length
  }

  static calculateOverheadPerTreatment(overheadMonthly: number, treatmentCount: number): number {
    if (treatmentCount === 0) return 0
    return overheadMonthly / treatmentCount
  }

  static calculateOverheadPercentage(overheadPerTreatment: number, averagePrice: number): number {
    if (averagePrice === 0) return 0
    return (overheadPerTreatment / averagePrice) * 100
  }

  static calculateMarginWithOverhead(price: number, materialCost: number, overheadCost: number): number {
    if (price <= 0) return 0
    const totalCost = materialCost + overheadCost
    return ((price - totalCost) / price) * 100
  }

  static async getTreatmentOverheadAnalysis(serviceId?: string): Promise<TreatmentOverheadAnalysis[]> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    // Get overhead metrics
    const overheadMetrics = await this.getOverheadMetrics()
    if (!overheadMetrics) {
      throw new Error('Could not fetch overhead metrics')
    }

    // Get services
    let servicesQuery = supabase
      .from('services')
      .select('id, name, price, material_cost')
      .eq('tenant_id', tenantId)
      .eq('active', true)

    if (serviceId) {
      servicesQuery = servicesQuery.eq('id', serviceId)
    }

    const { data: services, error } = await servicesQuery

    if (error) throw error

    return (services || []).map(service => {
      const materialCost = service.material_cost || 0
      const overheadCost = overheadMetrics.overhead_per_treatment
      const totalCost = materialCost + overheadCost
      
      return {
        serviceId: service.id,
        serviceName: service.name,
        servicePrice: service.price,
        materialCost,
        overheadCost,
        totalCost,
        marginWithoutOverhead: this.calculateMargin(service.price, materialCost),
        marginWithOverhead: this.calculateMarginWithOverhead(service.price, materialCost, overheadCost),
        overheadPercentage: this.calculateOverheadPercentage(overheadCost, service.price)
      }
    })
  }
}