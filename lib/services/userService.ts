import { supabase, getCurrentUserTenantId } from '@/lib/supabase'
import { AvailabilityService } from './availabilityService'

interface CreateUserData {
    email: string
    first_name: string
    last_name: string
    phone?: string
    role: 'admin' | 'staff'
    active?: boolean
    specializations?: string[]
    working_hours?: any  // Keep for backward compatibility during transition
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
    
    async getById(userId: string) {
        const tenantId = await getCurrentUserTenantId()
        if (!tenantId) throw new Error("Tenant ID not found")
        
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .eq('tenant_id', tenantId)
            .single()
        
        if (error) {
            console.error('Error fetching user by id:', error)
            throw error
        }
        
        // Also fetch staff schedules for this user
        const { data: schedules } = await supabase
            .from('staff_schedules')
            .select('*')
            .eq('staff_id', userId)
            .eq('tenant_id', tenantId)
            .order('day_of_week')
        
        // Convert schedules to working_hours format for UI compatibility
        const dutchDays = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag']
        const workingHours: any = {}
        
        // First, initialize all days as disabled
        dutchDays.forEach(day => {
            workingHours[day] = {
                start: '09:00',
                end: '17:00',
                enabled: false // Default to disabled
            }
        })
        
        // Then, override with actual schedule data if it exists
        if (schedules && schedules.length > 0) {
            schedules.forEach(schedule => {
                const dayName = dutchDays[schedule.day_of_week]
                if (dayName) {
                    workingHours[dayName] = {
                        start: schedule.start_time.substring(0, 5), // Convert HH:mm:ss to HH:mm
                        end: schedule.end_time.substring(0, 5),
                        enabled: schedule.is_active
                    }
                }
            })
        }
        
        data.working_hours = workingHours
        
        return data
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

            // Create user in public.users table (without working_hours)
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
                    working_hours: {}  // Always set to empty, will use staff_schedules instead
                    // Note: 'name' is a generated column, don't include it
                })
                .select()
                .single()

            if (publicError) {
                console.error('Error creating public user:', publicError)
                throw publicError
            }

            // If working_hours provided, convert to staff_schedules
            if (userData.working_hours && Object.keys(userData.working_hours).length > 0) {
                try {
                    // Convert Dutch day names to English for the AvailabilityService
                    const weekSchedule: any = {}
                    const dutchToEnglish: Record<string, string> = {
                        'maandag': 'monday',
                        'dinsdag': 'tuesday',
                        'woensdag': 'wednesday',
                        'donderdag': 'thursday',
                        'vrijdag': 'friday',
                        'zaterdag': 'saturday',
                        'zondag': 'sunday'
                    }
                    
                    Object.entries(userData.working_hours).forEach(([dutchDay, schedule]: [string, any]) => {
                        const englishDay = dutchToEnglish[dutchDay.toLowerCase()]
                        if (englishDay) {
                            weekSchedule[englishDay] = schedule
                        }
                    })
                    
                    await AvailabilityService.updateStaffSchedule(userId, tenantId, weekSchedule)
                } catch (scheduleError) {
                    console.error('Error creating staff schedules:', scheduleError)
                    // Don't fail the user creation, but log the error
                }
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
        
        // Extract working_hours to handle separately
        const workingHours = updateData.working_hours
        delete updateData.working_hours  // Don't update this field in users table
        
        // Always set working_hours to empty object in users table
        updateData.working_hours = {}

        const { data, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId)
            .eq('tenant_id', tenantId)
            .select()
            .single()

        if (error) throw error
        
        // If working_hours was provided, update staff_schedules
        if (workingHours && Object.keys(workingHours).length > 0) {
            try {
                // Convert Dutch day names to English for the AvailabilityService
                const weekSchedule: any = {}
                const dutchToEnglish: Record<string, string> = {
                    'maandag': 'monday',
                    'dinsdag': 'tuesday',
                    'woensdag': 'wednesday',
                    'donderdag': 'thursday',
                    'vrijdag': 'friday',
                    'zaterdag': 'saturday',
                    'zondag': 'sunday'
                }
                
                Object.entries(workingHours).forEach(([dutchDay, schedule]: [string, any]) => {
                    const englishDay = dutchToEnglish[dutchDay.toLowerCase()]
                    if (englishDay) {
                        weekSchedule[englishDay] = schedule
                    }
                })
                
                await AvailabilityService.updateStaffSchedule(userId, tenantId, weekSchedule)
            } catch (scheduleError) {
                console.error('Error updating staff schedules:', scheduleError)
                // Don't fail the update, but log the error
            }
        }
        
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