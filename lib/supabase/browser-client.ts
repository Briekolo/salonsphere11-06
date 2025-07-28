import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

// Create a browser client
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)