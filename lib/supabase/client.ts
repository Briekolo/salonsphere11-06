import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

// Check if environment variables are properly configured
if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here' || !supabaseUrl.startsWith('https://')) {
  throw new Error(
    'Missing or invalid NEXT_PUBLIC_SUPABASE_URL. Please set this environment variable in your .env.local file with your actual Supabase project URL.'
  )
}

if (!supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key_here') {
  throw new Error(
    'Missing or invalid NEXT_PUBLIC_SUPABASE_ANON_KEY. Please set this environment variable in your .env.local file with your actual Supabase anon key.'
  )
}

// Use a singleton pattern to ensure only one Supabase client instance
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: 'sb-client-auth-token',
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  }
  return supabaseInstance
}

export const supabase = getSupabaseClient()

// Helper function to get current user's tenant_id
export async function getCurrentUserTenantId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  // 1. Probeer eerst tenant_id uit JWT metadata (meest up-to-date)
  // @ts-ignore raw_user_meta_data type van Supabase
  const metaTenantId: string | undefined = user.user_metadata?.tenant_id

  if (metaTenantId) {
    try {
      // Probeer row in users-tabel te syncen maar negeer RLS-fouten (500)
      const { data: existingRow } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (existingRow && existingRow.tenant_id !== metaTenantId) {
        await supabase
          .from('users')
          .update({ tenant_id: metaTenantId })
          .eq('id', user.id)
      }
    } catch (err) {
      // Geen rechten op users-tabel -> negeer voor dashboard-flow
    }

    return metaTenantId
  }

  // Fallback uit users-tabel maar sla over bij RLS-errors
  try {
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    return userData?.tenant_id || null
  } catch {
    return null
  }
}

// Helper function to check if user has admin role
export async function isUserAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false
  
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  
  return userData?.role === 'admin'
}