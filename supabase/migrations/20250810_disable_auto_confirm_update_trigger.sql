-- Disable the auto_confirm_client_email_update_trigger that's causing issues during signup
-- This trigger is not essential since we already confirm emails during INSERT
--
-- Background: Supabase internally performs an UPDATE after INSERT during signup,
-- and this UPDATE is triggering our auto_confirm_client_email_update_trigger
-- which is causing the "Database error updating user" error.

-- Drop the problematic UPDATE trigger
DROP TRIGGER IF EXISTS auto_confirm_client_email_update_trigger ON auth.users;

-- We keep the INSERT trigger (auto_confirm_client_email_trigger) which handles
-- email confirmation when the user is first created

-- Note: If we need to re-enable UPDATE-based email confirmation later,
-- we should add better error handling to prevent it from interfering with
-- Supabase's internal operations