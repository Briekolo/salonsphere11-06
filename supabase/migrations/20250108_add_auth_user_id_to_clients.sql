-- Add auth_user_id column to clients table for linking with Supabase Auth
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add unique constraint to prevent duplicate auth users per tenant
ALTER TABLE clients 
ADD CONSTRAINT clients_auth_user_id_unique UNIQUE (auth_user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_auth_user_id ON clients(auth_user_id);

-- Update RLS policies for client authentication
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Clients can view their own record" ON clients;
DROP POLICY IF EXISTS "Clients can update their own record" ON clients;
DROP POLICY IF EXISTS "Anonymous users can insert during registration" ON clients;

-- Allow authenticated clients to view their own record
CREATE POLICY "Clients can view their own record"
  ON clients FOR SELECT
  TO authenticated
  USING (
    auth_user_id = auth.uid() 
    OR tenant_id = public.tenant_id()
  );

-- Allow authenticated clients to update their own record
CREATE POLICY "Clients can update their own record"
  ON clients FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Allow anonymous users to insert during registration (will be linked after auth)
CREATE POLICY "Allow client registration"
  ON clients FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Function to automatically link client to auth user on registration
CREATE OR REPLACE FUNCTION public.link_client_to_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if auth_user_id is null and we can match by email
  IF NEW.auth_user_id IS NULL AND auth.uid() IS NOT NULL THEN
    -- Check if the authenticated user's email matches
    IF NEW.email = auth.jwt() ->> 'email' THEN
      NEW.auth_user_id = auth.uid();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-link on insert/update
DROP TRIGGER IF EXISTS link_client_auth_trigger ON clients;
CREATE TRIGGER link_client_auth_trigger
  BEFORE INSERT OR UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION public.link_client_to_auth_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO authenticated, anon;
GRANT SELECT ON auth.users TO authenticated, anon;