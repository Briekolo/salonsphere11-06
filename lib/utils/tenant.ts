import { resolveTenant } from '@/lib/client/tenant-resolver'

/**
 * Get tenant ID from domain/subdomain
 */
export async function getTenantIdFromDomain(domain: string): Promise<string | null> {
  const tenant = await resolveTenant(domain)
  return tenant?.id || null
}