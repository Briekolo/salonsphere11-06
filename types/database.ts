export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
      clients: {
        Row: {
          address: string | null
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
      services: {
        Row: {
          aantal_sessies: number | null
          active: boolean | null
          aftercare_info: string | null
          category: string
          certifications: string[] | null
          created_at: string | null
          description: string | null
          duration_minutes: number
          id: string
          image_url: string | null
          material_cost: number | null
          name: string
          preparation_info: string | null
          price: number
          products_used: string[] | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          aantal_sessies?: number | null
          active?: boolean | null
          aftercare_info?: string | null
          category: string
          certifications?: string[] | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          image_url?: string | null
          material_cost?: number | null
          name: string
          preparation_info?: string | null
          price: number
          products_used?: string[] | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          aantal_sessies?: number | null
          active?: boolean | null
          aftercare_info?: string | null
          category?: string
          certifications?: string[] | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          image_url?: string | null
          material_cost?: number | null
          name?: string
          preparation_info?: string | null
          price?: number
          products_used?: string[] | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_tenant_id_fkey"
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
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string | null
          subscription_status: string
          subscription_tier: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          subscription_status?: string
          subscription_tier?: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          subscription_status?: string
          subscription_tier?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          active: boolean | null
          avatar_url: string | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          role: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          role?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          role?: string
          tenant_id?: string
          updated_at?: string | null
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
        Args: {
          p_product_id: string
          p_tenant_id: string
          p_adjustment: number
          p_reason: string
        }
        Returns: {
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
        }[]
      }
      popular_services: {
        Args: { _tenant: string; _from: string; _to: string; _limit?: number }
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
        Args: { uid: string; name: string; value: Json }
        Returns: undefined
      }
      tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      tenant_metrics: {
        Args: { _tenant: string }
        Returns: {
          tenant_id: string
          revenue_last30: number
          appointments_last30: number
          new_clients_last30: number
          low_stock_items: number
          avg_spend_per_client: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
