-- Add policy to allow authenticated users to create their own client record during registration
-- This fixes the issue where registration hangs after creating the auth user
--
-- Background: The registration flow creates an auth user, then automatically signs them in,
-- making them authenticated (not anonymous). But the existing "Allow client registration" 
-- policy only works for anonymous users, causing the client record insert to fail.

-- Create policy for authenticated users to insert their own client record
CREATE POLICY "clients_authenticated_self_register" ON clients
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    -- Allow inserting if the email matches the authenticated user's email
    email = auth.jwt()->>'email'
  );

-- This policy complements the existing "Allow client registration" policy:
-- - "Allow client registration": allows anonymous users to create client records
-- - "clients_authenticated_self_register": allows authenticated users to create their own client record