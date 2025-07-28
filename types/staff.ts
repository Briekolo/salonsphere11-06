// Staff-related type definitions

export interface StaffService {
  service_id: string
  active: boolean
  custom_duration_minutes?: number
  custom_price?: number
  proficiency_level?: string
}

export interface StaffMember {
  id: string
  first_name?: string
  last_name?: string
  email: string
  services: StaffService[]
}

export interface StaffWithServices extends StaffMember {
  tenant_id: string
  role: string
  created_at: string
  updated_at: string
}