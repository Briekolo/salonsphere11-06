-- Fix for authenticated client users unable to create bookings
-- When clients log in, they transition from 'anon' to 'authenticated' role
-- but there was no policy allowing authenticated clients to create bookings

-- Drop the existing authenticated policy if it exists (it only works for staff)
-- We'll keep it but add a new one specifically for clients

-- Policy for authenticated client users to create bookings
DROP POLICY IF EXISTS "clients_authenticated_insert_bookings" ON bookings;
CREATE POLICY "clients_authenticated_insert_bookings" ON bookings
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    -- Check if this is a client user type
    (auth.jwt() -> 'user_metadata' ->> 'user_type')::text = 'client'
    -- Ensure tenant_id matches the client's tenant from their metadata
    AND tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
    -- Ensure all required fields are present
    AND client_id IS NOT NULL 
    AND service_id IS NOT NULL
    AND scheduled_at IS NOT NULL
    AND duration_minutes IS NOT NULL
  );

-- Also allow authenticated clients to read their own bookings
DROP POLICY IF EXISTS "clients_authenticated_read_own_bookings" ON bookings;
CREATE POLICY "clients_authenticated_read_own_bookings" ON bookings
  FOR SELECT
  TO authenticated
  USING (
    -- Check if this is a client user
    (auth.jwt() -> 'user_metadata' ->> 'user_type')::text = 'client'
    -- Only show bookings for the client's tenant
    AND tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
    -- And only their own bookings (match by email since client_id might not be in JWT)
    AND client_id IN (
      SELECT id FROM clients 
      WHERE email = auth.jwt() ->> 'email'
      AND tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
    )
  );

-- Allow authenticated clients to update their own bookings (for cancellations)
DROP POLICY IF EXISTS "clients_authenticated_update_own_bookings" ON bookings;
CREATE POLICY "clients_authenticated_update_own_bookings" ON bookings
  FOR UPDATE
  TO authenticated
  USING (
    -- Check if this is a client user
    (auth.jwt() -> 'user_metadata' ->> 'user_type')::text = 'client'
    -- Only allow updating bookings for the client's tenant
    AND tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
    -- And only their own bookings
    AND client_id IN (
      SELECT id FROM clients 
      WHERE email = auth.jwt() ->> 'email'
      AND tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
    )
  )
  WITH CHECK (
    -- Ensure they maintain the same tenant
    tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
    -- And can only update their own bookings
    AND client_id IN (
      SELECT id FROM clients 
      WHERE email = auth.jwt() ->> 'email'
      AND tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
    )
  );

-- Grant necessary permissions to authenticated role for booking operations
GRANT INSERT, SELECT, UPDATE ON bookings TO authenticated;