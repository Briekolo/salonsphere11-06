// Overhead calculation types and interfaces

export interface OverheadMetrics {
  overhead_monthly: number
  total_treatments: number
  overhead_per_treatment: number
  average_treatment_price: number
  overhead_percentage: number
  month_analyzed: string
}

export interface OverheadCalculationParams {
  tenantId: string
  monthYear?: Date
}

export interface TreatmentOverheadAnalysis {
  serviceId: string
  serviceName: string
  servicePrice: number
  materialCost: number
  overheadCost: number
  totalCost: number
  marginWithoutOverhead: number
  marginWithOverhead: number
  overheadPercentage: number
}

export interface OverheadTrend {
  month: string
  overheadMonthly: number
  totalTreatments: number
  overheadPerTreatment: number
  overheadPercentage: number
}

export interface OverheadSettings {
  overheadMonthly: number
  calculationMethod: 'treatments' | 'revenue' | 'hours'
  includeInPricing: boolean
  showInReports: boolean
}

// Helper type for overhead calculation results
export type OverheadCalculationResult = {
  success: boolean
  data?: OverheadMetrics
  error?: string
}

// Extended tenant type with overhead
export interface TenantWithOverhead {
  id: string
  name: string
  overhead_monthly: number
  created_at: string
  updated_at: string
}