import { supabase } from '../supabase';

/**
 * Retrieves the tenant_id from the currently authenticated user's session.
 * Throws an error if the user is not authenticated or if the tenant_id is missing.
 */
export async function getTenantId(): Promise<string> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('Error getting session:', sessionError);
    throw new Error('Could not retrieve user session.');
  }
  
  if (!session || !session.user) {
    // This can happen if the user is not logged in. 
    // It's not necessarily an error state, but the caller needs to handle it.
    throw new Error('User not authenticated.');
  }

  const tenantId = session.user.user_metadata?.tenant_id;

  if (!tenantId) {
    console.warn('Tenant ID is missing from user metadata for user:', session.user.id);
    throw new Error('Tenant ID not found in user metadata.');
  }

  return tenantId;
} 