declare module '@supabase/ssr' {
  export interface CookieOptions {
    name?: string
    value?: string
    maxAge?: number
    domain?: string
    path?: string
    secure?: boolean
    httpOnly?: boolean
    sameSite?: 'lax' | 'strict' | 'none'
  }

  export interface CookieMethods {
    get(name: string): string | undefined
    set(name: string, value: string, options?: CookieOptions): void
    remove(name: string, options?: CookieOptions): void
  }

  export interface CreateServerClientOptions {
    cookies: CookieMethods
  }

  export function createServerClient<Database = any>(
    supabaseUrl: string,
    supabaseAnonKey: string,
    options: CreateServerClientOptions
  ): import('@supabase/supabase-js').SupabaseClient<Database>

  export function createBrowserClient<Database = any>(
    supabaseUrl: string,
    supabaseAnonKey: string,
    options?: {
      cookies?: CookieMethods
      cookieOptions?: CookieOptions
    }
  ): import('@supabase/supabase-js').SupabaseClient<Database>
}