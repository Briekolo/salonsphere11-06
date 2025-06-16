export interface Salon {
  id: string
  name: string
  address: string
  phone: string
  email: string
  subscription_tier: 'starter' | 'growth' | 'pro'
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  salon_id: string
  email: string
  role: 'admin' | 'staff' | 'client'
  first_name: string
  last_name: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface Treatment {
  id: string
  salon_id: string
  name: string
  description?: string
  duration_minutes: number
  price: number
  material_cost: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  salon_id: string
  client_id: string
  treatment_id: string
  staff_id?: string
  scheduled_at: string
  duration_minutes: number
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  notes?: string
  created_at: string
  updated_at: string
}

export interface InventoryItem {
  id: string
  salon_id: string
  name: string
  description?: string
  quantity: number
  unit: string
  cost_per_unit: number
  supplier?: string
  low_stock_threshold: number
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  salon_id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  date_of_birth?: string
  marketing_consent: boolean
  notes?: string
  created_at: string
  updated_at: string
}