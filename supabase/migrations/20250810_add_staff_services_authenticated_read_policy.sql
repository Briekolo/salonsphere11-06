-- Add policy to allow authenticated users (including customers) to read staff service assignments
-- This fixes the issue where logged-in customers couldn't see staff members on the booking page
-- 
-- Background: Customers who create accounts are stored in the 'clients' table, not the 'users' table.
-- The existing 'staff_services_tenant_isolation' policy fails for them because it tries to find
-- their tenant_id in the users table, which doesn't exist for customer accounts.

-- Create policy for authenticated users to read active staff services
CREATE POLICY "staff_services_authenticated_read" ON staff_services
  FOR SELECT 
  TO authenticated
  USING (active = true);

-- This policy works alongside:
-- - staff_services_public_read: allows anonymous users to read active staff_services
-- - staff_services_tenant_isolation: allows staff/admin users full access to their tenant's staff_services