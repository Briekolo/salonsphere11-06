import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'
import { getTenantIdFromDomain } from '@/lib/utils/tenant'

type Client = Database['public']['Tables']['clients']['Row']

export interface ClientAuthResponse {
  client: Client | null
  error: Error | null
}

export interface ClientRegistrationData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  marketingConsent?: boolean
  domain: string
}

export interface ClientLoginData {
  email: string
  password: string
  domain: string
}

class ClientAuthService {
  /**
   * Register a new client with Supabase Auth and create client record
   */
  async register(data: ClientRegistrationData): Promise<ClientAuthResponse> {
    try {
      // Get tenant ID from domain
      const tenantId = await getTenantIdFromDomain(data.domain)
      if (!tenantId) {
        return { client: null, error: new Error('Invalid salon domain') }
      }

      // Skip the existing client check during registration since anonymous users
      // may not have proper permissions. We'll handle duplicates via unique constraints.

      // Create auth user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            user_type: 'client',
            tenant_id: tenantId
          }
        }
      })

      if (authError || !authData.user) {
        return { client: null, error: authError || new Error('Failed to create account') }
      }

      // Wait for the auth user to be fully created
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Sign in immediately after signup to ensure proper session with claims
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (signInError || !signInData.session) {
        console.error('Failed to sign in after signup:', signInError)
        // Continue anyway, as the auth user was created
      }

      // Create new client record
      const { data: newClient, error: createError } = await supabase
        .from('clients')
        .insert({
          tenant_id: tenantId,
          email: data.email,
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          marketing_consent: data.marketingConsent,
          auth_user_id: authData.user.id
        })
        .select()
        .single()

      if (createError || !newClient) {
        // Handle specific errors
        console.error('Client creation error:', createError);
        
        if (createError?.message?.includes('duplicate key') || 
            createError?.message?.includes('unique constraint')) {
          return { client: null, error: new Error('An account already exists with this email address') }
        }
        
        if (createError?.message?.includes('violates row-level security')) {
          return { client: null, error: new Error('Registration failed due to security policy. Please try again.') }
        }
        
        return { client: null, error: new Error(`Failed to create client record: ${createError?.message || 'Unknown error'}`) }
      }

      const client = newClient

      return { client, error: null }
    } catch (error) {
      return { client: null, error: error as Error }
    }
  }

  /**
   * Login an existing client
   */
  async login(data: ClientLoginData): Promise<ClientAuthResponse> {
    try {
      // Get tenant ID from domain
      const tenantId = await getTenantIdFromDomain(data.domain)
      if (!tenantId) {
        return { client: null, error: new Error('Invalid salon domain') }
      }

      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (authError || !authData.user) {
        return { client: null, error: authError || new Error('Invalid email or password') }
      }

      // Verify this is a client user
      const userMetadata = authData.user.user_metadata
      if (userMetadata.user_type !== 'client') {
        await supabase.auth.signOut()
        return { client: null, error: new Error('Invalid login credentials') }
      }

      // Verify tenant matches
      if (userMetadata.tenant_id !== tenantId) {
        await supabase.auth.signOut()
        return { client: null, error: new Error('Account not found for this salon') }
      }

      // Get client record
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('auth_user_id', authData.user.id)
        .eq('tenant_id', tenantId)
        .single()

      if (clientError || !client) {
        await supabase.auth.signOut()
        return { client: null, error: clientError || new Error('Client profile not found') }
      }

      return { client, error: null }
    } catch (error) {
      return { client: null, error: error as Error }
    }
  }

  /**
   * Logout the current client
   */
  async logout(): Promise<void> {
    await supabase.auth.signOut()
  }

  /**
   * Get current authenticated client
   */
  async getCurrentClient(): Promise<Client | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.user_metadata.user_type !== 'client') {
        return null
      }

      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      return client
    } catch (error) {
      console.error('Error getting current client:', error)
      return null
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, domain: string): Promise<{ error: Error | null }> {
    try {
      const tenantId = await getTenantIdFromDomain(domain)
      if (!tenantId) {
        return { error: new Error('Invalid salon domain') }
      }

      // Verify client exists for this tenant
      const { data: client } = await supabase
        .from('clients')
        .select('auth_user_id')
        .eq('email', email)
        .eq('tenant_id', tenantId)
        .single()

      if (!client || !client.auth_user_id) {
        return { error: new Error('No account found with this email address') }
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/${domain}/auth/reset-password`
      })

      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  /**
   * Update client password
   */
  async updatePassword(newPassword: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  /**
   * Update client profile
   */
  async updateProfile(clientId: string, updates: Partial<Client>): Promise<ClientAuthResponse> {
    try {
      const { data: client, error } = await supabase
        .from('clients')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId)
        .select()
        .single()

      return { client, error }
    } catch (error) {
      return { client: null, error: error as Error }
    }
  }

  /**
   * Delete client account
   */
  async deleteAccount(clientId: string): Promise<{ error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { error: new Error('Not authenticated') }
      }

      // Delete client record (this will cascade to bookings based on FK constraints)
      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)
        .eq('auth_user_id', user.id)

      if (deleteError) {
        return { error: deleteError }
      }

      // Delete auth user
      await supabase.auth.signOut()
      
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }
}

export const clientAuthService = new ClientAuthService()