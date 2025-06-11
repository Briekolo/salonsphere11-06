export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          address: string | null
          subscription_tier: 'starter' | 'growth' | 'pro'
          subscription_status: 'active' | 'inactive' | 'suspended'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          address?: string | null
          subscription_tier?: 'starter' | 'growth' | 'pro'
          subscription_status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          address?: string | null
          subscription_tier?: 'starter' | 'growth' | 'pro'
          subscription_status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          tenant_id: string
          email: string
          role: 'admin' | 'staff' | 'client'
          first_name: string
          last_name: string
          phone: string | null
          avatar_url: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          email: string
          role?: 'admin' | 'staff' | 'client'
          first_name: string
          last_name: string
          phone?: string | null
          avatar_url?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          email?: string
          role?: 'admin' | 'staff' | 'client'
          first_name?: string
          last_name?: string
          phone?: string | null
          avatar_url?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          tenant_id: string
          email: string
          first_name: string
          last_name: string
          phone: string | null
          date_of_birth: string | null
          address: string | null
          marketing_consent: boolean
          notes: string | null
          tags: string[]
          total_spent: number
          last_visit_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          email: string
          first_name: string
          last_name: string
          phone?: string | null
          date_of_birth?: string | null
          address?: string | null
          marketing_consent?: boolean
          notes?: string | null
          tags?: string[]
          total_spent?: number
          last_visit_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          email?: string
          first_name?: string
          last_name?: string
          phone?: string | null
          date_of_birth?: string | null
          address?: string | null
          marketing_consent?: boolean
          notes?: string | null
          tags?: string[]
          total_spent?: number
          last_visit_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          category: string
          duration_minutes: number
          price: number
          material_cost: number
          active: boolean
          image_url: string | null
          preparation_info: string | null
          aftercare_info: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          description?: string | null
          category: string
          duration_minutes?: number
          price: number
          material_cost?: number
          active?: boolean
          image_url?: string | null
          preparation_info?: string | null
          aftercare_info?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          description?: string | null
          category?: string
          duration_minutes?: number
          price?: number
          material_cost?: number
          active?: boolean
          image_url?: string | null
          preparation_info?: string | null
          aftercare_info?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      inventory_items: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          sku: string | null
          category: string
          current_stock: number
          min_stock: number
          max_stock: number
          unit: string
          cost_per_unit: number
          supplier: string | null
          location: string | null
          barcode: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          description?: string | null
          sku?: string | null
          category: string
          current_stock?: number
          min_stock?: number
          max_stock?: number
          unit?: string
          cost_per_unit: number
          supplier?: string | null
          location?: string | null
          barcode?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          description?: string | null
          sku?: string | null
          category?: string
          current_stock?: number
          min_stock?: number
          max_stock?: number
          unit?: string
          cost_per_unit?: number
          supplier?: string | null
          location?: string | null
          barcode?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      supplier_pos: {
        Row: {
          id: string
          tenant_id: string
          supplier_name: string
          order_number: string
          status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
          order_date: string
          expected_delivery_date: string | null
          actual_delivery_date: string | null
          total_amount: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          supplier_name: string
          order_number: string
          status?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
          order_date?: string
          expected_delivery_date?: string | null
          actual_delivery_date?: string | null
          total_amount: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          supplier_name?: string
          order_number?: string
          status?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
          order_date?: string
          expected_delivery_date?: string | null
          actual_delivery_date?: string | null
          total_amount?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      supplier_po_items: {
        Row: {
          id: string
          po_id: string
          inventory_item_id: string
          quantity: number
          unit_cost: number
          total_cost: number
          created_at: string
        }
        Insert: {
          id?: string
          po_id: string
          inventory_item_id: string
          quantity: number
          unit_cost: number
          created_at?: string
        }
        Update: {
          id?: string
          po_id?: string
          inventory_item_id?: string
          quantity?: number
          unit_cost?: number
          created_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          tenant_id: string
          client_id: string
          service_id: string
          staff_id: string | null
          scheduled_at: string
          duration_minutes: number
          status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          notes: string | null
          internal_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          client_id: string
          service_id: string
          staff_id?: string | null
          scheduled_at: string
          duration_minutes: number
          status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          notes?: string | null
          internal_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          client_id?: string
          service_id?: string
          staff_id?: string | null
          scheduled_at?: string
          duration_minutes?: number
          status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          notes?: string | null
          internal_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          tenant_id: string
          booking_id: string | null
          client_id: string
          amount: number
          payment_method: 'card' | 'sepa' | 'cash' | 'bank_transfer'
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          transaction_id: string | null
          payment_date: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          booking_id?: string | null
          client_id: string
          amount: number
          payment_method: 'card' | 'sepa' | 'cash' | 'bank_transfer'
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          transaction_id?: string | null
          payment_date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          booking_id?: string | null
          client_id?: string
          amount?: number
          payment_method?: 'card' | 'sepa' | 'cash' | 'bank_transfer'
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          transaction_id?: string | null
          payment_date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      pricing_presets: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          labor_rate_per_hour: number
          overhead_percentage: number
          target_margin_percentage: number
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          description?: string | null
          labor_rate_per_hour: number
          overhead_percentage?: number
          target_margin_percentage?: number
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          description?: string | null
          labor_rate_per_hour?: number
          overhead_percentage?: number
          target_margin_percentage?: number
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      email_reminders: {
        Row: {
          id: string
          tenant_id: string
          booking_id: string | null
          client_id: string
          reminder_type: 'confirmation' | 'reminder_24h' | 'reminder_2h' | 'follow_up' | 'birthday'
          scheduled_at: string
          sent_at: string | null
          status: 'scheduled' | 'sent' | 'failed' | 'cancelled'
          email_subject: string
          email_body: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          booking_id?: string | null
          client_id: string
          reminder_type: 'confirmation' | 'reminder_24h' | 'reminder_2h' | 'follow_up' | 'birthday'
          scheduled_at: string
          sent_at?: string | null
          status?: 'scheduled' | 'sent' | 'failed' | 'cancelled'
          email_subject: string
          email_body: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          booking_id?: string | null
          client_id?: string
          reminder_type?: 'confirmation' | 'reminder_24h' | 'reminder_2h' | 'follow_up' | 'birthday'
          scheduled_at?: string
          sent_at?: string | null
          status?: 'scheduled' | 'sent' | 'failed' | 'cancelled'
          email_subject?: string
          email_body?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}