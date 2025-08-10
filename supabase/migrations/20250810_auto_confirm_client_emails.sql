-- Auto-confirm emails for client accounts
-- This removes the email verification requirement for customer accounts

-- First, update all existing client accounts to have confirmed emails
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, created_at)
WHERE raw_user_meta_data->>'user_type' = 'client'
  AND email_confirmed_at IS NULL;

-- Create or replace function to auto-confirm client emails on signup
CREATE OR REPLACE FUNCTION public.auto_confirm_client_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Only auto-confirm for client accounts
  IF NEW.raw_user_meta_data->>'user_type' = 'client' THEN
    -- Set email_confirmed_at if it's not already set
    IF NEW.email_confirmed_at IS NULL THEN
      NEW.email_confirmed_at = NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS auto_confirm_client_email_trigger ON auth.users;

-- Create trigger to auto-confirm client emails on insert
CREATE TRIGGER auto_confirm_client_email_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_client_email();

-- Also handle updates in case user_type is set after creation
CREATE OR REPLACE FUNCTION public.auto_confirm_client_email_on_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If user_type is being set to 'client' and email is not confirmed
  IF NEW.raw_user_meta_data->>'user_type' = 'client' 
     AND NEW.email_confirmed_at IS NULL 
     AND (OLD.raw_user_meta_data->>'user_type' IS DISTINCT FROM 'client') THEN
    NEW.email_confirmed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the update trigger if it exists
DROP TRIGGER IF EXISTS auto_confirm_client_email_update_trigger ON auth.users;

-- Create trigger for updates
CREATE TRIGGER auto_confirm_client_email_update_trigger
  BEFORE UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_client_email_on_update();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.auto_confirm_client_email() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.auto_confirm_client_email_on_update() TO postgres, service_role;