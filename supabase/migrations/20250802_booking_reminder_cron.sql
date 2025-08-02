-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage on cron schema to postgres
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Create a function to invoke the booking reminder scheduler edge function
CREATE OR REPLACE FUNCTION public.invoke_booking_reminder_scheduler()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id text;
  response json;
BEGIN
  -- Generate a unique request ID for tracking
  request_id := gen_random_uuid()::text;
  
  -- Log the start of the scheduler run
  INSERT INTO email_automation_logs (
    tenant_id,
    email_type,
    status,
    metadata,
    created_at
  ) VALUES (
    NULL, -- System-level log
    'scheduler_trigger',
    'started',
    jsonb_build_object(
      'request_id', request_id,
      'triggered_at', now()
    ),
    now()
  );

  -- Note: Direct edge function invocation from pg_cron is not supported
  -- We'll need to use a different approach
  RAISE NOTICE 'Booking reminder scheduler triggered at %', now();
  
  -- Instead, we'll process reminders directly in the database
  PERFORM public.process_booking_reminders();
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log any errors
    INSERT INTO email_automation_logs (
      tenant_id,
      email_type,
      status,
      error_message,
      metadata,
      created_at
    ) VALUES (
      NULL,
      'scheduler_trigger',
      'failed',
      SQLERRM,
      jsonb_build_object(
        'request_id', request_id,
        'error_detail', SQLSTATE
      ),
      now()
    );
    RAISE;
END;
$$;

-- Create a function to process booking reminders directly
CREATE OR REPLACE FUNCTION public.process_booking_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  booking_record record;
  reminder_time_start timestamp with time zone;
  reminder_time_end timestamp with time zone;
  reminders_sent int := 0;
  reminders_skipped int := 0;
BEGIN
  -- Calculate the time window for reminders (24 hours from now, with a 15-minute buffer)
  reminder_time_start := now() + interval '23 hours 45 minutes';
  reminder_time_end := now() + interval '24 hours 15 minutes';
  
  -- Log the processing start
  RAISE NOTICE 'Processing booking reminders for window: % to %', reminder_time_start, reminder_time_end;
  
  -- Process each booking in the reminder window
  FOR booking_record IN
    SELECT 
      b.id as booking_id,
      b.tenant_id,
      b.client_id,
      b.scheduled_at,
      b.service_id,
      b.staff_id,
      b.notes,
      b.duration_minutes,
      c.email as client_email,
      c.first_name as client_first_name,
      c.last_name as client_last_name,
      s.name as service_name,
      s.duration_minutes as service_duration,
      t.name as tenant_name,
      t.address as tenant_address,
      t.phone as tenant_phone,
      st.first_name as staff_first_name,
      st.last_name as staff_last_name,
      eas.booking_reminder_enabled
    FROM bookings b
    JOIN clients c ON c.id = b.client_id
    JOIN services s ON s.id = b.service_id
    JOIN tenants t ON t.id = b.tenant_id
    LEFT JOIN users st ON st.id = b.staff_id
    LEFT JOIN email_automation_settings eas ON eas.tenant_id = b.tenant_id
    WHERE b.scheduled_at >= reminder_time_start
      AND b.scheduled_at <= reminder_time_end
      AND b.status IN ('scheduled', 'confirmed')
      AND NOT EXISTS (
        -- Check if reminder was already sent
        SELECT 1 
        FROM email_automation_logs eal
        WHERE eal.booking_id = b.id
          AND eal.email_type = 'booking_reminder'
          AND eal.status = 'sent'
      )
  LOOP
    -- Check if reminders are enabled for this tenant
    IF COALESCE(booking_record.booking_reminder_enabled, false) = false THEN
      reminders_skipped := reminders_skipped + 1;
      CONTINUE;
    END IF;
    
    -- Queue the reminder for sending
    INSERT INTO booking_reminder_queue (
      booking_id,
      tenant_id,
      client_id,
      client_email,
      client_name,
      service_name,
      scheduled_at,
      duration_minutes,
      staff_name,
      tenant_name,
      tenant_address,
      tenant_phone,
      notes,
      created_at
    ) VALUES (
      booking_record.booking_id,
      booking_record.tenant_id,
      booking_record.client_id,
      booking_record.client_email,
      booking_record.client_first_name || ' ' || booking_record.client_last_name,
      booking_record.service_name,
      booking_record.scheduled_at,
      COALESCE(booking_record.duration_minutes, booking_record.service_duration, 60),
      CASE 
        WHEN booking_record.staff_first_name IS NOT NULL 
        THEN booking_record.staff_first_name || ' ' || booking_record.staff_last_name
        ELSE NULL
      END,
      booking_record.tenant_name,
      booking_record.tenant_address,
      booking_record.tenant_phone,
      booking_record.notes,
      now()
    );
    
    reminders_sent := reminders_sent + 1;
  END LOOP;
  
  -- Log the results
  INSERT INTO email_automation_logs (
    tenant_id,
    email_type,
    status,
    metadata,
    created_at
  ) VALUES (
    NULL,
    'scheduler_run',
    'completed',
    jsonb_build_object(
      'reminders_queued', reminders_sent,
      'reminders_skipped', reminders_skipped,
      'time_window', jsonb_build_object(
        'start', reminder_time_start,
        'end', reminder_time_end
      )
    ),
    now()
  );
  
  RAISE NOTICE 'Booking reminder processing completed. Queued: %, Skipped: %', reminders_sent, reminders_skipped;
END;
$$;

-- Create a queue table for booking reminders
CREATE TABLE IF NOT EXISTS booking_reminder_queue (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  client_email text NOT NULL,
  client_name text NOT NULL,
  service_name text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL,
  staff_name text,
  tenant_name text NOT NULL,
  tenant_address text,
  tenant_phone text,
  notes text,
  processed_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create index for efficient queue processing
CREATE INDEX idx_booking_reminder_queue_status ON booking_reminder_queue(status, created_at);
CREATE INDEX idx_booking_reminder_queue_booking ON booking_reminder_queue(booking_id);

-- Enable RLS on the queue table
ALTER TABLE booking_reminder_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for the queue table
CREATE POLICY "Service role can manage reminder queue"
  ON booking_reminder_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create a function to process the reminder queue
CREATE OR REPLACE FUNCTION public.process_reminder_queue()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  queue_record record;
  edge_function_url text;
  auth_header text;
BEGIN
  -- Get Supabase project URL and service role key from app settings
  -- Note: In production, these should be stored securely
  edge_function_url := get_app_setting('SUPABASE_URL') || '/functions/v1/send-booking-reminder';
  auth_header := 'Bearer ' || get_app_setting('SUPABASE_SERVICE_ROLE_KEY');
  
  -- Process pending reminders
  FOR queue_record IN
    SELECT * FROM booking_reminder_queue
    WHERE status = 'pending'
    ORDER BY created_at
    LIMIT 50 -- Process in batches
  LOOP
    -- Mark as processing
    UPDATE booking_reminder_queue
    SET status = 'processing'
    WHERE id = queue_record.id;
    
    -- In a real implementation, this would make an HTTP request to the edge function
    -- For now, we'll just mark it as ready for the edge function to pick up
    
    -- The actual sending will be handled by the edge function scheduler
    -- which will query this table and process pending reminders
  END LOOP;
END;
$$;

-- Create a helper function to get app settings (placeholder)
CREATE OR REPLACE FUNCTION public.get_app_setting(setting_name text)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- In production, this would retrieve settings from a secure configuration
  -- For now, return empty string
  RETURN '';
END;
$$;

-- Schedule the booking reminder processor to run every 15 minutes
-- Note: The actual HTTP invocation to the edge function needs to be done externally
-- This cron job will prepare the reminders for processing
SELECT cron.schedule(
  'process-booking-reminders', -- name of the cron job
  '*/15 * * * *', -- every 15 minutes
  $$SELECT public.process_booking_reminders();$$
);

-- Alternative: Schedule to run every hour at minute 0, 15, 30, 45
-- SELECT cron.schedule(
--   'process-booking-reminders',
--   '0,15,30,45 * * * *',
--   $$SELECT public.process_booking_reminders();$$
-- );

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.invoke_booking_reminder_scheduler() TO postgres;
GRANT EXECUTE ON FUNCTION public.process_booking_reminders() TO postgres;
GRANT EXECUTE ON FUNCTION public.process_reminder_queue() TO postgres;
GRANT ALL ON booking_reminder_queue TO postgres;
GRANT ALL ON booking_reminder_queue TO service_role;