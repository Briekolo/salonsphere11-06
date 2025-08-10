-- Temporarily disable the on_auth_user_updated trigger to fix registration
-- This trigger is causing "Database error updating user" during signup
--
-- Background: Supabase performs internal UPDATEs during the signup process,
-- and these are triggering our custom UPDATE trigger which is failing.
-- Even with checks for client users, the trigger is still causing issues.

-- Drop the problematic UPDATE trigger
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Keep the function for potential future use, but don't attach it as a trigger
-- The function handle_auth_user_update remains in the database but won't be triggered

-- Note: This means that staff/admin user updates won't automatically sync to the users table
-- We'll need to handle this in application code or redesign the trigger later

-- The INSERT triggers remain active:
-- - auto_confirm_client_email_trigger (BEFORE INSERT)
-- - handle_user_signup_trigger (AFTER INSERT)