-- Fix the handle_auth_user_update trigger to handle both staff and client users
-- This fixes the "Database error updating user" when clients register
--
-- Background: The current trigger tries to update public.users for ALL auth users,
-- but client users are stored in the clients table, not the users table.

-- Drop and recreate the function with client handling
CREATE OR REPLACE FUNCTION handle_auth_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is a client user
  IF NEW.raw_user_meta_data->>'user_type' = 'client' THEN
    -- For clients, we don't need to update the users table
    -- The clients table is managed separately through the application
    RETURN NEW;
  END IF;

  -- For staff/admin users, update the users table as before
  UPDATE public.users
  SET
    email = NEW.email,
    first_name = COALESCE(NEW.raw_user_meta_data->>'first_name', first_name),
    last_name = COALESCE(NEW.raw_user_meta_data->>'last_name', last_name),
    updated_at = now()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;