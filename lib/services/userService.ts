import { supabase, getCurrentUserTenantId } from '@/lib/supabase'

export const UserService = {
    async getAll(filters: { role?: string } = {}) {
        const tenantId = await getCurrentUserTenantId()
        if (!tenantId) throw new Error("Tenant ID not found")

        let query = supabase
            .from('users')
            .select('id, first_name, last_name, email, role, tenant_id')
            .eq('tenant_id', tenantId)

        if (filters.role) {
            query = query.eq('role', filters.role)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching users:', error)
            throw error
        }

        return data || []
    }
} 