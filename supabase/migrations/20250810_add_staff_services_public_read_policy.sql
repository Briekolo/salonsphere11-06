-- Add policy to allow anonymous users to read staff service assignments
-- This is needed for the client booking page where customers (not logged in) 
-- need to see which staff members can perform which services

-- Create policy for anonymous read access to staff_services
CREATE POLICY "staff_services_public_read" ON staff_services
  FOR SELECT 
  TO anon
  USING (active = true);

-- Also ensure that anonymous users can see basic staff info when joined
-- The existing "Public can read staff users" policy should handle this,
-- but let's make sure it includes all necessary fields