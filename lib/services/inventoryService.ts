import { supabase } from '../supabase'
import { Database } from '../../types/database'

type InventoryItem = Database['public']['Tables']['inventory_items']['Row']
type InventoryItemInsert = Database['public']['Tables']['inventory_items']['Insert']
type InventoryItemUpdate = Database['public']['Tables']['inventory_items']['Update']
type ProductHistory = Database['public']['Tables']['product_history']['Row']

export class InventoryService {
  static async getAll(tenantId: string): Promise<InventoryItem[]> {
    if (!tenantId) {
      console.warn('InventoryService.getAll called without tenantId')
      return []
    }
    const { data, error } = await supabase.from('inventory_items').select('*').eq('tenant_id', tenantId)

    if (error) throw error
    return data || []
  }

  static async getLowStock(tenantId: string): Promise<InventoryItem[]> {
    if (!tenantId) {
      console.warn('InventoryService.getLowStock called without tenantId')
      return []
    }

    // Supabase filters kunnen geen kolom-naar-kolom vergelijking maken (current_stock <= min_stock).
    // Daarom halen we alle records op en filteren we in JavaScript.
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('tenant_id', tenantId)

    if (error) throw error

    const lowStockItems = (data || []).filter((item) => item.current_stock <= item.min_stock)

    // Sorteer van laag naar hoog aantal stuks
    lowStockItems.sort((a, b) => a.current_stock - b.current_stock)

    return lowStockItems
  }

  static async getById(tenantId: string, id: string): Promise<InventoryItem | null> {
    if (!tenantId) throw new Error('No tenant found')

    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      console.error('Error fetching product by id:', error)
      return null
    }
    return data
  }

  static async create(tenantId: string, item: Omit<InventoryItemInsert, 'tenant_id'>): Promise<InventoryItem> {
    if (!tenantId) throw new Error('No tenant found')

    const { data, error } = await supabase
      .from('inventory_items')
      .insert({ ...item, tenant_id: tenantId })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async update(tenantId: string, id: string, updates: InventoryItemUpdate): Promise<InventoryItem> {
    if (!tenantId) throw new Error('No tenant found')

    const { data, error } = await supabase
      .from('inventory_items')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async adjustStock(tenantId: string, id: string, adjustment: number, reason: string): Promise<InventoryItem> {
    if (!tenantId) throw new Error('No tenant found')

    const { data, error } = await supabase.rpc('adjust_inventory_and_log', {
      p_product_id: id,
      p_adjustment: adjustment,
      p_reason: reason,
      p_tenant_id: tenantId,
    })

    if (error) {
      console.error('Error adjusting stock:', error)
      throw new Error(error.message)
    }

    // RPC returns a list, even if it's just one item.
    const updatedItem = data?.[0]
    if (!updatedItem) {
      throw new Error('No item returned after stock adjustment.')
    }

    // The structure needs to be mapped to the InventoryItem type.
    return updatedItem as InventoryItem
  }

  static async delete(tenantId: string, id: string): Promise<void> {
    if (!tenantId) throw new Error('No tenant found')

    const { error } = await supabase.from('inventory_items').delete().eq('id', id).eq('tenant_id', tenantId)

    if (error) throw error
  }

  static async getHistoryByProductId(tenantId: string, productId: string): Promise<ProductHistory[]> {
    if (!tenantId) throw new Error('No tenant found')

    const { data, error } = await supabase
      .from('product_history')
      .select('*')
      .eq('product_id', productId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static getStockStatus(item: InventoryItem): 'in-stock' | 'low-stock' | 'out-of-stock' | 'critical' {
    if (item.current_stock === 0) return 'out-of-stock'
    if (item.current_stock <= item.min_stock * 0.5) return 'critical'
    if (item.current_stock <= item.min_stock) return 'low-stock'
    return 'in-stock'
  }

  static calculateStockValue(items: InventoryItem[]): number {
    return items.reduce((total, item) => total + (item.current_stock * item.cost_per_unit), 0)
  }

  static async createInventoryItem(tenantId: string, item: Omit<InventoryItem, 'id' | 'created_at' | 'tenant_id' | 'updated_at'>): Promise<InventoryItem> {
    if (!tenantId) throw new Error('No tenant found')

    const { data, error } = await supabase
      .from('inventory_items')
      .insert({ ...item, tenant_id: tenantId })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateInventoryItem(tenantId: string, id: string, item: Partial<InventoryItem>): Promise<InventoryItem> {
    if (!tenantId) throw new Error('No tenant found')

    const { data, error } = await supabase
      .from('inventory_items')
      .update(item)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async deleteInventoryItem(tenantId: string, id: string) {
    if (!tenantId) throw new Error('No tenant found')

    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) throw error
  }
}