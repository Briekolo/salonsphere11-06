import { supabase } from '@/lib/supabase'

interface AuthDebugInfo {
  sessionExists: boolean
  userId?: string
  email?: string
  tenantId?: string
  storageKeys: string[]
  supabaseUrl: string
  connectionTest: {
    success: boolean
    error?: string
  }
}

export async function getAuthDebugInfo(): Promise<AuthDebugInfo> {
  const info: AuthDebugInfo = {
    sessionExists: false,
    storageKeys: [],
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'not-set',
    connectionTest: { success: false }
  }

  try {
    // Check session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (session) {
      info.sessionExists = true
      info.userId = session.user.id
      info.email = session.user.email
      info.tenantId = session.user.user_metadata?.tenant_id
    }

    // Check localStorage
    if (typeof window !== 'undefined') {
      info.storageKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('sb-') || key.includes('supabase')
      )
    }

    // Test connection
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('id')
        .limit(1)
      
      info.connectionTest.success = !error
      if (error) {
        info.connectionTest.error = error.message
      }
    } catch (connError: any) {
      info.connectionTest.error = connError.message
    }

  } catch (error: any) {
    console.error('Auth debug error:', error)
  }

  return info
}

export function logAuthDebugInfo() {
  if (typeof window === 'undefined') return
  
  getAuthDebugInfo().then(info => {
    console.group('🔐 Auth Debug Info')
    console.log('Session exists:', info.sessionExists)
    console.log('User ID:', info.userId || 'none')
    console.log('Email:', info.email || 'none')
    console.log('Tenant ID:', info.tenantId || 'none')
    console.log('Storage keys:', info.storageKeys)
    console.log('Supabase URL:', info.supabaseUrl)
    console.log('Connection test:', info.connectionTest)
    console.groupEnd()
  })
}