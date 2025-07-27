import { supabase, getCurrentUserTenantId } from '@/lib/supabase'

interface CreateUserData {
    email: string
    first_name: string
    last_name: string
    phone?: string
    role: 'admin' | 'staff'
    active?: boolean
    specializations?: string[]
    working_hours?: any
}

export const UserService = {
    async getAll(filters: { role?: string } = {}) {
        const tenantId = await getCurrentUserTenantId()
        if (!tenantId) throw new Error("Tenant ID not found")

        let query = supabase
            .from('users')
            .select('id, first_name, last_name, email, role, tenant_id')
            .eq('tenant_id', tenantId)

        // If looking for staff, include both staff and admin users
        if (filters.role === 'staff') {
            query = query.in('role', ['staff', 'admin'])
        } else if (filters.role) {
            query = query.eq('role', filters.role)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching users:', error)
            throw error
        }

        return data || []
    },

    async create(userData: CreateUserData) {
        const tenantId = await getCurrentUserTenantId()
        if (!tenantId) throw new Error("Tenant ID not found")

        try {
            // First check if user already exists in this tenant
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', userData.email)
                .eq('tenant_id', tenantId)
                .single()

            if (existingUser) {
                throw new Error('Een gebruiker met dit email adres bestaat al')
            }

            // Generate a UUID for the new user
            const userId = crypto.randomUUID()

            // Create user in public.users table
            const { data: publicUser, error: publicError } = await supabase
                .from('users')
                .insert({
                    id: userId,
                    tenant_id: tenantId,
                    email: userData.email,
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    phone: userData.phone || null,
                    role: userData.role,
                    active: userData.active !== false,
                    specializations: userData.specializations || [],
                    working_hours: userData.working_hours || {}
                    // Note: 'name' is a generated column, don't include it
                })
                .select()
                .single()

            if (publicError) {
                console.error('Error creating public user:', publicError)
                throw publicError
            }

            return {
                user: publicUser,
                message: 'Medewerker succesvol aangemaakt. De medewerker kan nu worden toegewezen aan behandelingen.'
            }
        } catch (error) {
            console.error('Error in UserService.create:', error)
            throw error
        }
    },

    async update(userId: string, updates: Partial<CreateUserData>) {
        const tenantId = await getCurrentUserTenantId()
        if (!tenantId) throw new Error("Tenant ID not found")

        const updateData: any = { ...updates }
        // Remove the name field if it exists since it's a generated column
        delete updateData.name

        const { data, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId)
            .eq('tenant_id', tenantId)
            .select()
            .single()

        if (error) throw error
        return data
    },

    async delete(userId: string) {
        const tenantId = await getCurrentUserTenantId()
        if (!tenantId) throw new Error("Tenant ID not found")

        // Delete from public.users
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', userId)
            .eq('tenant_id', tenantId)

        if (error) throw error
    }
} 