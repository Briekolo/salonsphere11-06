import { supabase, getCurrentUserTenantId } from '@/lib/supabase'
import { Database } from '@/types/database'

type InventoryItem = Database['public']['Tables']['inventory_items']['Row']
type InventoryItemInsert = Database['public']['Tables']['inventory_items']['Insert']
type InventoryItemUpdate = Database['public']['Tables']['inventory_items']['Update']

export class InventoryService {
  static async getAll(): Promise<InventoryItem[]> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async getLowStock(): Promise<InventoryItem[]> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('tenant_id', tenantId)
      .filter('current_stock', 'lte', 'min_stock')
      .order('current_stock', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async getById(id: string): Promise<InventoryItem | null> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error) throw error
    return data
  }

  static async create(item: Omit<InventoryItemInsert, 'tenant_id'>): Promise<InventoryItem> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const { data, error } = await supabase
      .from('inventory_items')
      .insert({ ...item, tenant_id: tenantId })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async update(id: string, updates: Omit<InventoryItemUpdate, 'tenant_id'>): Promise<InventoryItem> {
    const tenantId = await getCurrentUserTenantId()
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

  static async adjustStock(id: string, adjustment: number, reason: string): Promise<InventoryItem> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    // Get current stock
    const item = await this.getById(id)
    if (!item) throw new Error('Item not found')

    const newStock = Math.max(0, item.current_stock + adjustment)

    const { data, error } = await supabase
      .from('inventory_items')
      .update({ current_stock: newStock })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) throw error

    // TODO: Log the stock adjustment in a separate audit table
    // This would include: item_id, old_stock, new_stock, adjustment, reason, user_id, timestamp

    return data
  }

  static async delete(id: string): Promise<void> {
    const tenantId = await getCurrentUserTenantId()
    if (!tenantId) throw new Error('No tenant found')

    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) throw error
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
}