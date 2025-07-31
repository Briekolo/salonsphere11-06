import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

// Singleton instance
let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | undefined

// Create a singleton browser client
export function getSupabaseBrowserClient() {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return supabaseInstance
}

// Export for backward compatibility
export const supabase = getSupabaseBrowserClient()