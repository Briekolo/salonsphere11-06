import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Helper function to get current user's tenant_id
export async function getCurrentUserTenantId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  
  return userData?.tenant_id || null
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