-- Add policy to allow authenticated users (including customers) to read staff from users table
-- This fixes the issue where logged-in customers couldn't see staff members on the booking page
--
-- Background: The booking page joins staff_services with users table to get staff details.
-- The existing "Public can read staff users" policy only works for anonymous users.
-- Authenticated customers couldn't see staff because they're not in the users table.

-- Create policy for authenticated users to read staff and admin users
CREATE POLICY "users_authenticated_read_staff" ON users
  FOR SELECT 
  TO authenticated
  USING (role IN ('staff', 'admin'));

-- This policy complements the existing policies:
-- - "Public can read staff users": allows anonymous users to see staff
-- - "users_authenticated_read_staff": allows authenticated users (customers) to see staff/admin
-- - Other existing policies: allow staff/admin to see users in their tenant