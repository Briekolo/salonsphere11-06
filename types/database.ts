export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string
          tenant_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type: string
          tenant_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string
          tenant_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_holds: {
        Row: {
          client_id: string | null
          created_at: string | null
          duration_minutes: number
          expires_at: string
          id: string
          service_id: string
          session_id: string
          slot_date: string
          slot_time: string
          staff_id: string
          tenant_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          duration_minutes: number
          expires_at: string
          id?: string
          service_id: string
          session_id: string
          slot_date: string
          slot_time: string
          staff_id: string
          tenant_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          duration_minutes?: number
          expires_at?: string
          id?: string
          service_id?: string
          session_id?: string
          slot_date?: string
          slot_time?: string
          staff_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_holds_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_holds_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_holds_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_holds_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_slots: {
        Row: {
          break_time: boolean | null
          created_at: string | null
          date: string
          end_time: string
          id: string
          is_available: boolean | null
          staff_id: string
          start_time: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          break_time?: boolean | null
          created_at?: string | null
          date: string
          end_time: string
          id?: string
          is_available?: boolean | null
          staff_id: string
          start_time: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          break_time?: boolean | null
          created_at?: string | null
          date?: string
          end_time?: string
          id?: string
          is_available?: boolean | null
          staff_id?: string
          start_time?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_slots_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_slots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          client_id: string
          created_at: string | null
          duration_minutes: number
          id: string
          internal_notes: string | null
          notes: string | null
          scheduled_at: string
          service_id: string
          staff_id: string | null
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          duration_minutes: number
          id?: string
          internal_notes?: string | null
          notes?: string | null
          scheduled_at: string
          service_id: string
          staff_id?: string | null
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          duration_minutes?: number
          id?: string
          internal_notes?: string | null
          notes?: string | null
          scheduled_at?: string
          service_id?: string
          staff_id?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      client_sessions: {
        Row: {
          client_id: string | null
          created_at: string | null
          expires_at: string
          id: string
          ip_address: unknown | null
          session_token: string
          tenant_id: string | null
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown | null
          session_token: string
          tenant_id?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          session_token?: string
          tenant_id?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          auth_user_id: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          last_visit_date: string | null
          marketing_consent: boolean | null
          notes: string | null
          phone: string | null
          tags: string[] | null
          tenant_id: string
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          auth_user_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          last_visit_date?: string | null
          marketing_consent?: boolean | null
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          tenant_id: string
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          auth_user_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          last_visit_date?: string | null
          marketing_consent?: boolean | null
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          tenant_id?: string
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_reminders: {
        Row: {
          booking_id: string | null
          client_id: string
          created_at: string | null
          email_body: string
          email_subject: string
          id: string
          reminder_type: string
          scheduled_at: string
          sent_at: string | null
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          client_id: string
          created_at?: string | null
          email_body: string
          email_subject: string
          id?: string
          reminder_type: string
          scheduled_at: string
          sent_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          client_id?: string
          created_at?: string | null
          email_body?: string
          email_subject?: string
          id?: string
          reminder_type?: string
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_reminders_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_reminders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_reminders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          active: boolean | null
          body_html: string
          body_text: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          subject: string
          tenant_id: string
          type: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          active?: boolean | null
          body_html: string
          body_text?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          subject: string
          tenant_id: string
          type: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          active?: boolean | null
          body_html?: string
          body_text?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          subject?: string
          tenant_id?: string
          type?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          config: Json
          created_at: string | null
          credentials: Json | null
          error_message: string | null
          id: string
          last_sync_at: string | null
          name: string
          provider: string
          status: string
          tenant_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          config?: Json
          created_at?: string | null
          credentials?: Json | null
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          name: string
          provider: string
          status?: string
          tenant_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          credentials?: Json | null
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          name?: string
          provider?: string
          status?: string
          tenant_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          barcode: string | null
          category: string
          cost_per_unit: number
          created_at: string | null
          current_stock: number
          description: string | null
          id: string
          location: string | null
          max_stock: number
          min_stock: number
          name: string
          sku: string | null
          supplier: string | null
          tenant_id: string
          unit: string
          updated_at: string | null
        }
        Insert: {
          barcode?: string | null
          category: string
          cost_per_unit: number
          created_at?: string | null
          current_stock?: number
          description?: string | null
          id?: string
          location?: string | null
          max_stock?: number
          min_stock?: number
          name: string
          sku?: string | null
          supplier?: string | null
          tenant_id: string
          unit?: string
          updated_at?: string | null
        }
        Update: {
          barcode?: string | null
          category?: string
          cost_per_unit?: number
          created_at?: string | null
          current_stock?: number
          description?: string | null
          id?: string
          location?: string | null
          max_stock?: number
          min_stock?: number
          name?: string
          sku?: string | null
          supplier?: string | null
          tenant_id?: string
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          quantity: number
          service_id: string | null
          sort_order: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          service_id?: string | null
          sort_order?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          service_id?: string | null
          sort_order?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_sequences: {
        Row: {
          last_number: number
          tenant_id: string
          year: number
        }
        Insert: {
          last_number?: number
          tenant_id: string
          year: number
        }
        Update: {
          last_number?: number
          tenant_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_sequences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          booking_id: string | null
          cancelled_at: string | null
          client_id: string
          created_at: string | null
          discount_amount: number
          due_date: string
          id: string
          internal_notes: string | null
          invoice_number: string
          issue_date: string
          notes: string | null
          paid_amount: number
          paid_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax_amount: number
          tax_rate: number
          tenant_id: string
          total_amount: number
          updated_at: string | null
          viewed_at: string | null
        }
        Insert: {
          booking_id?: string | null
          cancelled_at?: string | null
          client_id: string
          created_at?: string | null
          discount_amount?: number
          due_date: string
          id?: string
          internal_notes?: string | null
          invoice_number: string
          issue_date?: string
          notes?: string | null
          paid_amount?: number
          paid_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          tenant_id: string
          total_amount?: number
          updated_at?: string | null
          viewed_at?: string | null
        }
        Update: {
          booking_id?: string | null
          cancelled_at?: string | null
          client_id?: string
          created_at?: string | null
          discount_amount?: number
          due_date?: string
          id?: string
          internal_notes?: string | null
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          paid_amount?: number
          paid_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          tenant_id?: string
          total_amount?: number
          updated_at?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      klant_behandeling_trajecten: {
        Row: {
          behandeling_id: string | null
          id: string
          klant_id: string | null
          laatste_update: string | null
          start_datum: string | null
          tenant_id: string | null
          totaal_sessies: number
          voltooide_sessies: number | null
        }
        Insert: {
          behandeling_id?: string | null
          id?: string
          klant_id?: string | null
          laatste_update?: string | null
          start_datum?: string | null
          tenant_id?: string | null
          totaal_sessies: number
          voltooide_sessies?: number | null
        }
        Update: {
          behandeling_id?: string | null
          id?: string
          klant_id?: string | null
          laatste_update?: string | null
          start_datum?: string | null
          tenant_id?: string | null
          totaal_sessies?: number
          voltooide_sessies?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "klant_behandeling_trajecten_behandeling_id_fkey"
            columns: ["behandeling_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "klant_behandeling_trajecten_klant_id_fkey"
            columns: ["klant_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "klant_behandeling_trajecten_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string | null
          client_id: string
          created_at: string | null
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: string
          status: string
          tenant_id: string
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          client_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method: string
          status?: string
          tenant_id: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          client_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string
          status?: string
          tenant_id?: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_presets: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          labor_rate_per_hour: number
          name: string
          overhead_percentage: number
          target_margin_percentage: number
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          labor_rate_per_hour: number
          name: string
          overhead_percentage?: number
          target_margin_percentage?: number
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          labor_rate_per_hour?: number
          name?: string
          overhead_percentage?: number
          target_margin_percentage?: number
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_presets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_history: {
        Row: {
          change: number
          created_at: string
          id: string
          product_id: string
          reason: string
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          change: number
          created_at?: string
          id?: string
          product_id: string
          reason: string
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          change?: number
          created_at?: string
          id?: string
          product_id?: string
          reason?: string
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string | null
          data: Json
          file_url: string | null
          filters: Json | null
          format: string
          generated_by: string | null
          id: string
          name: string
          period_end: string
          period_start: string
          tenant_id: string
          type: string
        }
        Insert: {
          created_at?: string | null
          data?: Json
          file_url?: string | null
          filters?: Json | null
          format?: string
          generated_by?: string | null
          id?: string
          name: string
          period_end: string
          period_start: string
          tenant_id: string
          type: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          file_url?: string | null
          filters?: Json | null
          format?: string
          generated_by?: string | null
          id?: string
          name?: string
          period_end?: string
          period_start?: string
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_exceptions: {
        Row: {
          created_at: string | null
          date: string
          end_time: string | null
          id: string
          is_available: boolean | null
          reason: string | null
          staff_id: string
          start_time: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          end_time?: string | null
          id?: string
          is_available?: boolean | null
          reason?: string | null
          staff_id: string
          start_time?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          end_time?: string | null
          id?: string
          is_available?: boolean | null
          reason?: string | null
          staff_id?: string
          start_time?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_exceptions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_exceptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          aantal_sessies: number | null
          active: boolean | null
          aftercare_info: string | null
          buffer_time_after: number | null
          buffer_time_before: number | null
          category: string
          category_id: string | null
          certifications: string[] | null
          created_at: string | null
          description: string | null
          duration_minutes: number
          id: string
          image_url: string | null
          material_cost: number | null
          max_advance_days: number | null
          min_advance_hours: number | null
          name: string
          preparation_info: string | null
          price: number
          products_used: string[] | null
          requires_specific_room: boolean | null
          room_ids: string[] | null
          tenant_id: string
          treatment_interval_weeks: number | null
          treatments_needed: number | null
          updated_at: string | null
        }
        Insert: {
          aantal_sessies?: number | null
          active?: boolean | null
          aftercare_info?: string | null
          buffer_time_after?: number | null
          buffer_time_before?: number | null
          category: string
          category_id?: string | null
          certifications?: string[] | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          image_url?: string | null
          material_cost?: number | null
          max_advance_days?: number | null
          min_advance_hours?: number | null
          name: string
          preparation_info?: string | null
          price: number
          products_used?: string[] | null
          requires_specific_room?: boolean | null
          room_ids?: string[] | null
          tenant_id: string
          treatment_interval_weeks?: number | null
          treatments_needed?: number | null
          updated_at?: string | null
        }
        Update: {
          aantal_sessies?: number | null
          active?: boolean | null
          aftercare_info?: string | null
          buffer_time_after?: number | null
          buffer_time_before?: number | null
          category?: string
          category_id?: string | null
          certifications?: string[] | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          image_url?: string | null
          material_cost?: number | null
          max_advance_days?: number | null
          min_advance_hours?: number | null
          name?: string
          preparation_info?: string | null
          price?: number
          products_used?: string[] | null
          requires_specific_room?: boolean | null
          room_ids?: string[] | null
          tenant_id?: string
          treatment_interval_weeks?: number | null
          treatments_needed?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "treatment_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_certifications: {
        Row: {
          certification_name: string
          created_at: string | null
          document_url: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuer: string | null
          staff_id: string
          tenant_id: string
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          certification_name: string
          created_at?: string | null
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string | null
          staff_id: string
          tenant_id: string
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          certification_name?: string
          created_at?: string | null
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string | null
          staff_id?: string
          tenant_id?: string
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_certifications_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_certifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_schedules: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          staff_id: string
          start_time: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          staff_id: string
          start_time: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          staff_id?: string
          start_time?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_schedules_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_schedules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_services: {
        Row: {
          active: boolean | null
          created_at: string | null
          custom_duration_minutes: number | null
          custom_price: number | null
          id: string
          proficiency_level: string | null
          service_id: string
          staff_id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          custom_duration_minutes?: number | null
          custom_price?: number | null
          id?: string
          proficiency_level?: string | null
          service_id: string
          staff_id: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          custom_duration_minutes?: number | null
          custom_price?: number | null
          id?: string
          proficiency_level?: string | null
          service_id?: string
          staff_id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_services_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_po_items: {
        Row: {
          created_at: string | null
          id: string
          inventory_item_id: string
          po_id: string
          quantity: number
          total_cost: number | null
          unit_cost: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_item_id: string
          po_id: string
          quantity: number
          total_cost?: number | null
          unit_cost: number
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_item_id?: string
          po_id?: string
          quantity?: number
          total_cost?: number | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_po_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_po_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "supplier_pos"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_pos: {
        Row: {
          actual_delivery_date: string | null
          created_at: string | null
          expected_delivery_date: string | null
          id: string
          notes: string | null
          order_date: string | null
          order_number: string
          status: string
          supplier_name: string
          tenant_id: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          created_at?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          order_number: string
          status?: string
          supplier_name: string
          tenant_id: string
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          created_at?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          order_number?: string
          status?: string
          supplier_name?: string
          tenant_id?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_pos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: string | null
          booking_settings: Json | null
          business_hours: Json | null
          chamber_of_commerce: string | null
          city: string | null
          country: string | null
          created_at: string | null
          custom_domain: string | null
          description: string | null
          domain_verified: boolean | null
          domain_verified_at: string | null
          email: string
          id: string
          logo_url: string | null
          name: string
          notification_preferences: Json | null
          overhead_monthly: number | null
          payment_methods: Json | null
          phone: string | null
          postal_code: string | null
          subdomain: string | null
          subscription_status: string
          subscription_tier: string
          tax_settings: Json | null
          theme_settings: Json | null
          updated_at: string | null
          vat_number: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          booking_settings?: Json | null
          business_hours?: Json | null
          chamber_of_commerce?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          custom_domain?: string | null
          description?: string | null
          domain_verified?: boolean | null
          domain_verified_at?: string | null
          email: string
          id?: string
          logo_url?: string | null
          name: string
          notification_preferences?: Json | null
          overhead_monthly?: number | null
          payment_methods?: Json | null
          phone?: string | null
          postal_code?: string | null
          subdomain?: string | null
          subscription_status?: string
          subscription_tier?: string
          tax_settings?: Json | null
          theme_settings?: Json | null
          updated_at?: string | null
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          booking_settings?: Json | null
          business_hours?: Json | null
          chamber_of_commerce?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          custom_domain?: string | null
          description?: string | null
          domain_verified?: boolean | null
          domain_verified_at?: string | null
          email?: string
          id?: string
          logo_url?: string | null
          name?: string
          notification_preferences?: Json | null
          overhead_monthly?: number | null
          payment_methods?: Json | null
          phone?: string | null
          postal_code?: string | null
          subdomain?: string | null
          subscription_status?: string
          subscription_tier?: string
          tax_settings?: Json | null
          theme_settings?: Json | null
          updated_at?: string | null
          vat_number?: string | null
          website?: string | null
        }
        Relationships: []
      }
      treatment_categories: {
        Row: {
          active: boolean | null
          color: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          name: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          active: boolean | null
          avatar_url: string | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          last_login: string | null
          last_name: string
          name: string | null
          phone: string | null
          role: string
          specializations: string[] | null
          tenant_id: string
          updated_at: string | null
          working_hours: Json | null
        }
        Insert: {
          active?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          last_login?: string | null
          last_name: string
          name?: string | null
          phone?: string | null
          role?: string
          specializations?: string[] | null
          tenant_id: string
          updated_at?: string | null
          working_hours?: Json | null
        }
        Update: {
          active?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_login?: string | null
          last_name?: string
          name?: string | null
          phone?: string | null
          role?: string
          specializations?: string[] | null
          tenant_id?: string
          updated_at?: string | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_inventory_and_log: {
        Args:
          | {
              p_item_id: string
              p_quantity_change: number
              p_reason: string
              p_user_id: string
            }
          | {
              p_product_id: string
              p_tenant_id: string
              p_adjustment: number
              p_reason: string
            }
        Returns: undefined
      }
      calculate_overhead_per_treatment: {
        Args:
          | { p_tenant_id: string }
          | { tenant_id_param: string; month_year?: string }
        Returns: {
          overhead_per_treatment: number
          total_treatments: number
          overhead_monthly: number
        }[]
      }
      calculate_overhead_percentage: {
        Args:
          | { p_tenant_id: string }
          | { tenant_id_param: string; month_year?: string }
        Returns: {
          overhead_percentage: number
          average_treatment_price: number
          overhead_per_treatment: number
        }[]
      }
      check_slot_availability: {
        Args:
          | {
              p_tenant_id: string
              p_staff_id: string
              p_date: string
              p_time: string
              p_duration_minutes: number
            }
          | {
              p_tenant_id: string
              p_staff_id: string
              p_service_id: string
              p_slot_datetime: string
            }
        Returns: boolean
      }
      cleanup_expired_holds: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_default_categories: {
        Args: { p_tenant_id: string }
        Returns: undefined
      }
      generate_invoice_number: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      get_auth_user_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_available_staff_for_service: {
        Args:
          | { p_service_id: string; p_datetime: string }
          | {
              p_service_id: string
              p_tenant_id: string
              p_date: string
              p_start_time: string
              p_duration_minutes: number
            }
        Returns: {
          staff_id: string
          staff_name: string
          proficiency_level: string
          custom_duration_minutes: number
          custom_price: number
          is_available: boolean
        }[]
      }
      get_inventory_stats: {
        Args: { p_tenant_id: string }
        Returns: {
          total_items: number
          low_stock_items: number
          out_of_stock_items: number
          total_value: number
        }[]
      }
      get_overhead_metrics: {
        Args:
          | { p_tenant_id: string }
          | { tenant_id_param: string; month_year?: string }
        Returns: {
          overhead_monthly: number
          overhead_per_treatment: number
          overhead_percentage: number
          total_treatments: number
          average_treatment_price: number
        }[]
      }
      get_revenue_daily: {
        Args: { p_tenant_id?: string }
        Returns: {
          tenant_id: string
          day: string
          revenue: number
        }[]
      }
      get_tenant_metrics: {
        Args: { p_tenant_id: string }
        Returns: {
          tenant_id: string
          revenue_last30: number
          appointments_last30: number
          new_clients_last30: number
          low_stock_items: number
          avg_spend_per_client: number
        }[]
      }
      get_user_tenant_id: {
        Args: Record<PropertyKey, never> | { user_id: string }
        Returns: string
      }
      is_auth_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      mark_overdue_invoices: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      popular_services: {
        Args:
          | { _tenant: string; _from: string; _to: string; _limit?: number }
          | { p_tenant_id: string; p_limit?: number }
        Returns: {
          service_name: string
          total: number
          percentage: number
        }[]
      }
      revenue_timeseries: {
        Args: { _tenant: string; _from: string; _to: string }
        Returns: {
          day: string
          revenue: number
        }[]
      }
      set_claim: {
        Args:
          | { uid: string; claim: string; value: Json }
          | { user_id: string; claim: string; value: string }
        Returns: undefined
      }
      tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      tenant_metrics: {
        Args: { _tenant: string }
        Returns: Json
      }
      update_user_tenant_metadata: {
        Args: { user_id: string; tenant_id: string }
        Returns: undefined
      }
    }
    Enums: {
      invoice_status:
        | "draft"
        | "sent"
        | "viewed"
        | "partially_paid"
        | "paid"
        | "overdue"
        | "cancelled"
      payment_method:
        | "cash"
        | "card"
        | "bank_transfer"
        | "ideal"
        | "paypal"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      invoice_status: [
        "draft",
        "sent",
        "viewed",
        "partially_paid",
        "paid",
        "overdue",
        "cancelled",
      ],
      payment_method: [
        "cash",
        "card",
        "bank_transfer",
        "ideal",
        "paypal",
        "other",
      ],
    },
  },
} as const