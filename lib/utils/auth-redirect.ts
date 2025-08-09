import { supabase } from '@/lib/supabase'

export async function checkAuthAndRedirect() {
  try {
    // Get the current session
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Auth check error:', error)
      return false
    }
    
    if (!session) {
      console.log('No session found, staying on login')
      return false
    }
    
    // Session exists, check if it's valid
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('Invalid session:', userError)
      return false
    }
    
    console.log('Valid session found for:', user.email)
    
    // Check for tenant_id
    const tenantId = user.user_metadata?.tenant_id
    
    if (!tenantId) {
      console.log('No tenant_id, redirecting to subscription')
      window.location.replace('/subscription')
      return true
    }
    
    console.log('Complete auth found, redirecting to dashboard')
    window.location.replace('/')
    return true
    
  } catch (error) {
    console.error('Auth redirect error:', error)
    return false
  }
}