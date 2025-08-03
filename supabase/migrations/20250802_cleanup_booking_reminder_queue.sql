-- Clean up unused booking reminder queue system
-- This removes the incomplete Supabase cron-based system in favor of GitHub Actions

-- Remove the cron job first
SELECT cron.unschedule('process-booking-reminders');

-- Drop the unused queue table
DROP TABLE IF EXISTS booking_reminder_queue;

-- Remove the unused functions
DROP FUNCTION IF EXISTS public.process_reminder_queue();
DROP FUNCTION IF EXISTS public.process_booking_reminders();
DROP FUNCTION IF EXISTS public.invoke_booking_reminder_scheduler();
DROP FUNCTION IF EXISTS public.get_app_setting(text);

-- Remove any orphaned logs from the old system
DELETE FROM email_automation_logs 
WHERE email_type IN ('scheduler_trigger', 'scheduler_run') 
  AND tenant_id IS NULL;

-- Add a comment to document the cleanup
COMMENT ON TABLE email_automation_logs IS 'Email automation logs. The booking reminder system now uses GitHub Actions → Edge Functions → Resend API for delivery.';

-- Cleanup completed successfully
-- Note: Skipping log entry as email_automation_logs is constrained to specific email types