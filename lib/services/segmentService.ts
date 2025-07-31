import { supabase, getCurrentUserTenantId } from '@/lib/supabase'

export interface CustomerSegment {
  id?: string
  tenant_id: string
  name: string
  description?: string
  criteria: SegmentCriteria[]
  member_count?: number
  last_calculated_at?: string
  is_dynamic?: boolean
  is_active?: boolean
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface SegmentCriteria {
  field: string
  operator: string
  value: any
  connector?: 'AND' | 'OR'
}

export type SegmentField = 
  | 'total_spent'
  | 'last_booking'
  | 'created_at'
  | 'booking_count'
  | 'average_spend'
  | 'has_email'
  | 'has_phone'

export type SegmentOperator = 
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'within_days'
  | 'older_than_days'
  | 'between'
  | 'in'
  | 'not_in'
  | 'is_true'
  | 'is_false'

export class SegmentService {
  // Get all segments for tenant
  static async getSegments(tenantId?: string) {
    const effectiveTenantId = tenantId || await getCurrentUserTenantId()
    if (!effectiveTenantId) throw new Error('No tenant ID available')

    const { data, error } = await supabase
      .from('customer_segments')
      .select('*')
      .eq('tenant_id', effectiveTenantId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  // Get single segment
  static async getSegment(segmentId: string) {
    const { data, error } = await supabase
      .from('customer_segments')
      .select('*')
      .eq('id', segmentId)
      .single()

    if (error) throw error
    return data
  }

  // Create new segment
  static async createSegment(segment: Partial<CustomerSegment>) {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant ID available')

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('customer_segments')
      .insert({
        ...segment,
        tenant_id: tenantId,
        created_by: user.user.id,
        is_dynamic: segment.is_dynamic !== false, // Default to true
        is_active: true
      })
      .select()
      .single()

    if (error) throw error

    // Calculate initial member count
    await this.calculateSegmentMembers(data.id)

    return data
  }

  // Update segment
  static async updateSegment(segmentId: string, updates: Partial<CustomerSegment>) {
    const { data, error } = await supabase
      .from('customer_segments')
      .update(updates)
      .eq('id', segmentId)
      .select()
      .single()

    if (error) throw error

    // Recalculate members if criteria changed
    if (updates.criteria) {
      await this.calculateSegmentMembers(segmentId)
    }

    return data
  }

  // Delete segment
  static async deleteSegment(segmentId: string) {
    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('customer_segments')
      .update({ is_active: false })
      .eq('id', segmentId)

    if (error) throw error
  }

  // Calculate segment members
  static async calculateSegmentMembers(segmentId: string) {
    const { data, error } = await supabase.rpc('calculate_segment_members', {
      segment_id: segmentId
    })

    if (error) throw error
    return data
  }

  // Get segment members
  static async getSegmentMembers(segmentId: string, page = 1, limit = 50) {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant ID available')

    const offset = (page - 1) * limit

    // Get segment to check criteria
    const segment = await this.getSegment(segmentId)
    if (!segment) throw new Error('Segment not found')

    // Build query based on criteria
    let query = supabase
      .from('clients')
      .select('*, bookings(count)', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .not('email', 'is', null)

    // Apply segment criteria
    query = this.applySegmentCriteria(query, segment.criteria)

    // Exclude unsubscribed
    const { data: unsubscribes } = await supabase
      .from('unsubscribes')
      .select('email')
      .eq('tenant_id', tenantId)

    const unsubscribedEmails = new Set(unsubscribes?.map(u => u.email) || [])

    // Execute query
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    // Filter out unsubscribed
    const filteredData = data?.filter(client => !unsubscribedEmails.has(client.email)) || []

    return {
      members: filteredData,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }

  // Apply segment criteria to query
  static applySegmentCriteria(query: any, criteria: SegmentCriteria[]) {
    // For now, return the query as-is
    // This will be expanded to handle dynamic criteria
    return query
  }

  // Get predefined segments
  static getPredefinedSegments() {
    return [
      {
        name: 'Alle Klanten',
        description: 'Alle actieve klanten met een e-mailadres',
        criteria: []
      },
      {
        name: 'Nieuwe Klanten',
        description: 'Klanten die zich in de afgelopen 30 dagen hebben aangemeld',
        criteria: [
          { field: 'created_at', operator: 'within_days', value: 30 }
        ]
      },
      {
        name: 'VIP Klanten',
        description: 'Klanten met hoge uitgaven (> €500)',
        criteria: [
          { field: 'total_spent', operator: 'greater_than', value: 500 }
        ]
      },
      {
        name: 'Regelmatige Klanten',
        description: 'Klanten met meer dan 5 afspraken',
        criteria: [
          { field: 'booking_count', operator: 'greater_than', value: 5 }
        ]
      },
      {
        name: 'Inactieve Klanten',
        description: 'Klanten zonder afspraak in de laatste 90 dagen',
        criteria: [
          { field: 'last_booking', operator: 'older_than_days', value: 90 }
        ]
      },
      {
        name: 'Verjaardagen Deze Maand',
        description: 'Klanten die deze maand jarig zijn',
        criteria: [
          { field: 'birth_month', operator: 'equals', value: new Date().getMonth() + 1 }
        ]
      }
    ]
  }

  // Get available fields for segmentation
  static getAvailableFields() {
    return [
      { value: 'total_spent', label: 'Totaal Uitgegeven', type: 'number' },
      { value: 'last_booking', label: 'Laatste Afspraak', type: 'date' },
      { value: 'created_at', label: 'Klant Sinds', type: 'date' },
      { value: 'booking_count', label: 'Aantal Afspraken', type: 'number' },
      { value: 'average_spend', label: 'Gemiddelde Uitgave', type: 'number' },
      { value: 'has_email', label: 'Heeft E-mail', type: 'boolean' },
      { value: 'has_phone', label: 'Heeft Telefoon', type: 'boolean' }
    ]
  }

  // Get operators for field type
  static getOperatorsForField(fieldType: string) {
    const operators = {
      number: [
        { value: 'equals', label: 'Gelijk aan' },
        { value: 'not_equals', label: 'Niet gelijk aan' },
        { value: 'greater_than', label: 'Groter dan' },
        { value: 'less_than', label: 'Kleiner dan' },
        { value: 'greater_than_or_equal', label: 'Groter dan of gelijk aan' },
        { value: 'less_than_or_equal', label: 'Kleiner dan of gelijk aan' },
        { value: 'between', label: 'Tussen' }
      ],
      date: [
        { value: 'within_days', label: 'Binnen dagen' },
        { value: 'older_than_days', label: 'Ouder dan dagen' },
        { value: 'between', label: 'Tussen datums' }
      ],
      boolean: [
        { value: 'is_true', label: 'Ja' },
        { value: 'is_false', label: 'Nee' }
      ],
      string: [
        { value: 'equals', label: 'Gelijk aan' },
        { value: 'not_equals', label: 'Niet gelijk aan' },
        { value: 'in', label: 'Een van' },
        { value: 'not_in', label: 'Niet een van' }
      ]
    }

    return operators[fieldType] || operators.string
  }

  // Build SQL condition from criteria
  static buildSqlCondition(criteria: SegmentCriteria[]): string {
    if (criteria.length === 0) return 'TRUE'

    const conditions = criteria.map((criterion, index) => {
      const connector = index > 0 ? (criterion.connector || 'AND') : ''
      let condition = ''

      switch (criterion.operator) {
        case 'equals':
          condition = `${criterion.field} = '${criterion.value}'`
          break
        case 'not_equals':
          condition = `${criterion.field} != '${criterion.value}'`
          break
        case 'greater_than':
          condition = `${criterion.field} > ${criterion.value}`
          break
        case 'less_than':
          condition = `${criterion.field} < ${criterion.value}`
          break
        case 'greater_than_or_equal':
          condition = `${criterion.field} >= ${criterion.value}`
          break
        case 'less_than_or_equal':
          condition = `${criterion.field} <= ${criterion.value}`
          break
        case 'within_days':
          condition = `${criterion.field} >= NOW() - INTERVAL '${criterion.value} days'`
          break
        case 'older_than_days':
          condition = `${criterion.field} <= NOW() - INTERVAL '${criterion.value} days'`
          break
        case 'between':
          condition = `${criterion.field} BETWEEN '${criterion.value[0]}' AND '${criterion.value[1]}'`
          break
        case 'in':
          const inValues = criterion.value.map((v: any) => `'${v}'`).join(',')
          condition = `${criterion.field} IN (${inValues})`
          break
        case 'not_in':
          const notInValues = criterion.value.map((v: any) => `'${v}'`).join(',')
          condition = `${criterion.field} NOT IN (${notInValues})`
          break
        case 'is_true':
          condition = `${criterion.field} = TRUE`
          break
        case 'is_false':
          condition = `${criterion.field} = FALSE`
          break
        default:
          condition = 'TRUE'
      }

      return `${connector} ${condition}`
    }).join(' ')

    return conditions
  }

  // Duplicate segment
  static async duplicateSegment(segmentId: string, newName: string) {
    const segment = await this.getSegment(segmentId)
    if (!segment) throw new Error('Segment not found')

    const { id, created_at, updated_at, member_count, last_calculated_at, ...segmentData } = segment

    return this.createSegment({
      ...segmentData,
      name: newName
    })
  }

  // Test segment criteria
  static async testSegmentCriteria(criteria: SegmentCriteria[]) {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant ID available')

    // Build a test query
    let query = supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .not('email', 'is', null)

    // Apply criteria
    query = this.applySegmentCriteria(query, criteria)

    const { count, error } = await query

    if (error) throw error

    return { count: count || 0 }
  }
}