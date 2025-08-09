import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

let adminClient: ReturnType<typeof createClient<Database>> | null = null

/**
 * Get Supabase Admin client with service role key
 * This client bypasses RLS and should only be used in server-side code
 */
export function getSupabaseAdmin() {
  // Return existing client if already initialized
  if (adminClient) {
    return adminClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables for admin client')
  }
  
  adminClient = createClient<Database>(
    supabaseUrl,
    supabaseServiceKey,
    { 
      auth: { 
        persistSession: false,
        autoRefreshToken: false
      }
    }
  )

  return adminClient
}