-- Temporarily disable the handle_user_signup_trigger to fix client registration
-- This trigger is interfering with Supabase's internal signup process
--
-- Background: Even though the function checks for client users and returns early,
-- the trigger itself seems to be causing "Database error updating user" during signup.
-- Supabase may perform internal operations that conflict with this AFTER INSERT trigger.

-- Drop the problematic AFTER INSERT trigger
DROP TRIGGER IF EXISTS handle_user_signup_trigger ON auth.users;

-- Keep the function for potential future use with staff/admin signup
-- The function handle_user_signup remains in the database but won't be triggered

-- Note: This means that staff/admin signup won't automatically create tenants
-- Staff/admin use a different signup flow through /auth/sign-up anyway

-- The only remaining trigger will be:
-- - auto_confirm_client_email_trigger (BEFORE INSERT) - simply confirms client emails

-- This minimal setup should allow client registration to work without interference