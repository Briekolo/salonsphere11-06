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
    console.log('[ClientAuth] Starting registration for:', data.email)
    
    try {
      // Get tenant ID from domain with timeout
      console.log('[ClientAuth] Getting tenant ID for domain:', data.domain)
      
      // Add timeout to tenant resolution
      const tenantPromise = getTenantIdFromDomain(data.domain)
      const tenantTimeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Tenant lookup timeout')), 10000) // 10 second timeout
      )
      
      let tenantId: string | null = null
      try {
        tenantId = await Promise.race([
          tenantPromise,
          tenantTimeoutPromise
        ]) as string | null
      } catch (error) {
        console.error('[ClientAuth] Tenant lookup error:', error)
        return { client: null, error: new Error('Could not find salon. Please check the URL and try again.') }
      }
      
      if (!tenantId) {
        console.error('[ClientAuth] No tenant ID found for domain:', data.domain)
        return { client: null, error: new Error('Invalid salon domain') }
      }
      console.log('[ClientAuth] Got tenant ID:', tenantId)

      // Skip the existing client check during registration since anonymous users
      // may not have proper permissions. We'll handle duplicates via unique constraints.

      // Create auth user with Supabase Auth
      // Email confirmation is disabled - accounts are created immediately
      console.log('[ClientAuth] Calling supabase.auth.signUp...')
      
      // Add timeout to prevent infinite hanging
      const signUpPromise = supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            user_type: 'client',
            tenant_id: tenantId
          },
          emailRedirectTo: undefined // Don't send confirmation email
        }
      })
      
      // Set a 30 second timeout
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Registration timeout - please try again')), 30000)
      )
      
      const { data: authData, error: authError } = await Promise.race([
        signUpPromise,
        timeoutPromise
      ]).catch(error => {
        console.error('[ClientAuth] SignUp error:', error)
        return { data: null, error }
      })

      console.log('[ClientAuth] SignUp response:', { 
        hasData: !!authData, 
        hasUser: !!authData?.user,
        userId: authData?.user?.id,
        error: authError 
      })

      if (authError || !authData?.user) {
        console.error('[ClientAuth] SignUp failed:', authError)
        return { client: null, error: authError || new Error('Failed to create account') }
      }

      // Wait for the auth user to be fully created
      console.log('[ClientAuth] Waiting for auth user to be created...')
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Automatically sign in after signup since email confirmation is disabled
      console.log('[ClientAuth] Auto signing in after registration...')
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      // Sign in should always work since we're not requiring email confirmation
      if (signInError) {
        console.warn('[ClientAuth] Auto sign-in after registration failed:', signInError)
      } else {
        console.log('[ClientAuth] Auto sign-in successful')
      }

      // Create new client record
      // Note: auth_user_id will be set by database trigger if column exists
      const clientData: any = {
        tenant_id: tenantId,
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        marketing_consent: data.marketingConsent
      };

      // Laat het koppelen van auth_user_id aan de database trigger over.
      console.log('[ClientAuth] Creating client record with data:', clientData)

      const { data: newClient, error: createError } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single()

      console.log('[ClientAuth] Client creation result:', { 
        hasClient: !!newClient, 
        clientId: newClient?.id,
        error: createError 
      })

      if (createError || !newClient) {
        // Handle specific errors
        console.error('[ClientAuth] Client creation error:', createError);
        
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

      console.log('[ClientAuth] Registration completed successfully for:', data.email)
      // Account is successfully created and user is logged in
      return { client, error: null }
    } catch (error) {
      console.error('[ClientAuth] Unexpected registration error:', error)
      return { client: null, error: error as Error }
    }
  }

  /**
   * Login an existing client
   */
  async login(data: ClientLoginData): Promise<ClientAuthResponse> {
    try {
      console.log('[CLIENT-AUTH] Login attempt for:', data.email, 'domain:', data.domain);
      
      // Get tenant ID from domain
      const tenantId = await getTenantIdFromDomain(data.domain)
      if (!tenantId) {
        console.error('[CLIENT-AUTH] No tenant found for domain:', data.domain);
        return { client: null, error: new Error('Invalid salon domain') }
      }
      console.log('[CLIENT-AUTH] Tenant ID resolved:', tenantId);

      // Sign in with Supabase Auth
      console.log('[CLIENT-AUTH] Attempting sign in with Supabase Auth');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      console.log('[CLIENT-AUTH] Sign in result:', {
        success: !!authData?.user,
        userId: authData?.user?.id,
        userType: authData?.user?.user_metadata?.user_type,
        error: authError?.message
      });

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

      // Get client record - try by auth_user_id first, fall back to email
      console.log('[CLIENT-AUTH] Fetching client record for auth_user_id:', authData.user.id);
      let { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('auth_user_id', authData.user.id)
        .eq('tenant_id', tenantId)
        .single()
      
      console.log('[CLIENT-AUTH] Client fetch by auth_user_id:', {
        found: !!client,
        error: clientError?.message
      });

      // If not found by auth_user_id, try by email (for backward compatibility)
      if (!client || clientError) {
        console.log('[CLIENT-AUTH] Trying to fetch client by email:', data.email);
        const result = await supabase
          .from('clients')
          .select('*')
          .eq('email', data.email)
          .eq('tenant_id', tenantId)
          .single()
        
        client = result.data;
        clientError = result.error;
        
        console.log('[CLIENT-AUTH] Client fetch by email:', {
          found: !!client,
          error: clientError?.message
        });
      }

      if (clientError || !client) {
        console.error('[CLIENT-AUTH] Client profile not found, signing out');
        await supabase.auth.signOut()
        return { client: null, error: clientError || new Error('Client profile not found') }
      }

      console.log('[CLIENT-AUTH] Login successful for client:', client.id);
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
      console.log('[CLIENT-AUTH] Getting current authenticated client');
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      console.log('[CLIENT-AUTH] Auth user result:', {
        hasUser: !!user,
        userId: user?.id,
        userEmail: user?.email,
        userType: user?.user_metadata?.user_type,
        tenantId: user?.user_metadata?.tenant_id,
        error: userError?.message
      });
      
      if (!user || user.user_metadata.user_type !== 'client') {
        console.log('[CLIENT-AUTH] Not a client user, returning null');
        return null
      }

      // Try to get client by auth_user_id first
      console.log('[CLIENT-AUTH] Fetching client by auth_user_id:', user.id);
      let { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()
      
      console.log('[CLIENT-AUTH] Client fetch by auth_user_id result:', {
        found: !!client,
        clientId: client?.id,
        clientEmail: client?.email,
        clientTenantId: client?.tenant_id,
        error: clientError?.message,
        errorCode: clientError?.code
      });

      // If not found by auth_user_id, try by email (for backward compatibility)
      if (!client && user.email) {
        console.log('[CLIENT-AUTH] Client not found by auth_user_id, trying by email:', user.email);
        const result = await supabase
          .from('clients')
          .select('*')
          .eq('email', user.email)
          .eq('tenant_id', user.user_metadata.tenant_id)
          .single()
        
        client = result.data;
        
        console.log('[CLIENT-AUTH] Client fetch by email result:', {
          found: !!client,
          clientId: client?.id,
          clientTenantId: client?.tenant_id,
          error: result.error?.message,
          errorCode: result.error?.code
        });
        
        if (result.error?.message?.includes('row-level security') || result.error?.code === '42501') {
          console.error('[RLS-ERROR] Cannot fetch client due to RLS policy when searching by email');
        }
      }

      console.log('[CLIENT-AUTH] Final client result:', {
        found: !!client,
        clientId: client?.id,
        clientEmail: client?.email,
        clientTenantId: client?.tenant_id
      });
      
      return client
    } catch (error: any) {
      console.error('[CLIENT-AUTH] Error getting current client:', error);
      console.error('[CLIENT-AUTH] Error details:', {
        message: error?.message,
        code: error?.code,
        hint: error?.hint
      });
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
        .select('*')
        .eq('email', email)
        .eq('tenant_id', tenantId)
        .single()

      if (!client) {
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