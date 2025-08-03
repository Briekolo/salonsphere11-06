-- Add business hours configuration to tenants table
-- This allows salons to define their opening hours and prevent bookings outside business hours

-- Add business_hours column to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS business_hours jsonb DEFAULT jsonb_build_object(
  '0', jsonb_build_object('closed', true),  -- Sunday
  '1', jsonb_build_object('closed', false, 'open', '09:00', 'close', '18:00'), -- Monday
  '2', jsonb_build_object('closed', false, 'open', '09:00', 'close', '18:00'), -- Tuesday
  '3', jsonb_build_object('closed', false, 'open', '09:00', 'close', '18:00'), -- Wednesday
  '4', jsonb_build_object('closed', false, 'open', '09:00', 'close', '18:00'), -- Thursday
  '5', jsonb_build_object('closed', false, 'open', '09:00', 'close', '18:00'), -- Friday
  '6', jsonb_build_object('closed', false, 'open', '10:00', 'close', '16:00'), -- Saturday
  '7', jsonb_build_object('closed', true)   -- Sunday (alternative)
);

-- Add timezone column to tenants table for proper date/time handling
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Europe/Amsterdam';

-- Function to check if a datetime is within business hours
CREATE OR REPLACE FUNCTION is_within_business_hours(
  p_tenant_id uuid,
  p_datetime timestamptz
) RETURNS boolean AS $$
DECLARE
  v_business_hours jsonb;
  v_timezone text;
  v_local_time timestamp;
  v_day_of_week int;
  v_day_config jsonb;
  v_time_only time;
  v_open_time time;
  v_close_time time;
BEGIN
  -- Get tenant business hours and timezone
  SELECT business_hours, timezone 
  INTO v_business_hours, v_timezone
  FROM tenants 
  WHERE id = p_tenant_id;
  
  -- Convert to local time
  v_local_time := p_datetime AT TIME ZONE v_timezone;
  v_day_of_week := EXTRACT(dow FROM v_local_time)::int;
  v_time_only := v_local_time::time;
  
  -- Get config for this day
  v_day_config := v_business_hours->v_day_of_week::text;
  
  -- Check if closed
  IF v_day_config->>'closed' = 'true' THEN
    RETURN false;
  END IF;
  
  -- Check if within open hours
  v_open_time := (v_day_config->>'open')::time;
  v_close_time := (v_day_config->>'close')::time;
  
  RETURN v_time_only >= v_open_time AND v_time_only <= v_close_time;
END;
$$ LANGUAGE plpgsql;

-- Function to validate treatment series appointments against business hours
CREATE OR REPLACE FUNCTION validate_treatment_series_dates(
  p_tenant_id uuid,
  p_dates timestamptz[]
) RETURNS TABLE(
  date_index int,
  appointment_date timestamptz,
  is_valid boolean,
  reason text
) AS $$
DECLARE
  i int;
  v_date timestamptz;
BEGIN
  FOR i IN 1..array_length(p_dates, 1) LOOP
    v_date := p_dates[i];
    
    IF NOT is_within_business_hours(p_tenant_id, v_date) THEN
      RETURN QUERY SELECT 
        i, 
        v_date, 
        false, 
        'Appointment is outside business hours'::text;
    ELSE
      RETURN QUERY SELECT 
        i, 
        v_date, 
        true, 
        NULL::text;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Update the custom appointments function to validate business hours
CREATE OR REPLACE FUNCTION create_treatment_series_with_custom_appointments(
  p_tenant_id uuid,
  p_client_id uuid,
  p_service_id uuid,
  p_staff_id uuid,
  p_custom_dates timestamptz[],
  p_package_discount decimal DEFAULT 0,
  p_notes text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_series_id uuid;
  v_service_price decimal;
  v_total_price decimal;
  v_session_date timestamptz;
  i integer;
  v_total_sessions integer;
  v_invalid_dates int;
BEGIN
  -- Validate all dates are within business hours
  SELECT COUNT(*) INTO v_invalid_dates
  FROM validate_treatment_series_dates(p_tenant_id, p_custom_dates)
  WHERE NOT is_valid;
  
  IF v_invalid_dates > 0 THEN
    RAISE EXCEPTION 'One or more appointments are outside business hours';
  END IF;

  -- Get service price
  SELECT price INTO v_service_price 
  FROM services 
  WHERE id = p_service_id AND tenant_id = p_tenant_id;
  
  -- Get total sessions from custom dates array length
  v_total_sessions := array_length(p_custom_dates, 1);
  
  -- Calculate total price with discount
  v_total_price := v_service_price * v_total_sessions * (1 - p_package_discount / 100);
  
  -- Create the treatment series
  INSERT INTO treatment_series (
    tenant_id, client_id, service_id, staff_id,
    total_sessions, interval_weeks, package_discount_percentage,
    total_price, notes
  ) VALUES (
    p_tenant_id, p_client_id, p_service_id, p_staff_id,
    v_total_sessions, NULL, p_package_discount,
    v_total_price, p_notes
  ) RETURNING id INTO v_series_id;
  
  -- Create bookings for each custom date
  FOR i IN 1..v_total_sessions LOOP
    v_session_date := p_custom_dates[i];
    
    INSERT INTO bookings (
      tenant_id, client_id, service_id, user_id,
      scheduled_at, duration_minutes, status,
      series_id, series_session_number, is_series_booking,
      price
    ) VALUES (
      p_tenant_id, p_client_id, p_service_id, p_staff_id,
      v_session_date,
      (SELECT duration_minutes FROM services WHERE id = p_service_id),
      'confirmed',
      v_series_id, i, true,
      v_service_price * (1 - p_package_discount / 100)
    );
  END LOOP;
  
  RETURN v_series_id;
END;
$$ LANGUAGE plpgsql;

-- Also update the interval-based function to validate business hours
CREATE OR REPLACE FUNCTION create_treatment_series_with_appointments(
  p_tenant_id uuid,
  p_client_id uuid,
  p_service_id uuid,
  p_staff_id uuid,
  p_start_date timestamptz,
  p_total_sessions integer,
  p_interval_weeks integer,
  p_package_discount decimal,
  p_notes text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_series_id uuid;
  v_service_price decimal;
  v_total_price decimal;
  v_session_date timestamptz;
  i integer;
BEGIN
  -- Get service price
  SELECT price INTO v_service_price 
  FROM services 
  WHERE id = p_service_id AND tenant_id = p_tenant_id;
  
  -- Calculate total price with discount
  v_total_price := v_service_price * p_total_sessions * (1 - p_package_discount / 100);
  
  -- Create the treatment series
  INSERT INTO treatment_series (
    tenant_id, client_id, service_id, staff_id,
    total_sessions, interval_weeks, package_discount_percentage,
    total_price, notes
  ) VALUES (
    p_tenant_id, p_client_id, p_service_id, p_staff_id,
    p_total_sessions, p_interval_weeks, p_package_discount,
    v_total_price, p_notes
  ) RETURNING id INTO v_series_id;
  
  -- Create bookings for each session
  v_session_date := p_start_date;
  FOR i IN 1..p_total_sessions LOOP
    -- Skip if outside business hours
    IF is_within_business_hours(p_tenant_id, v_session_date) THEN
      INSERT INTO bookings (
        tenant_id, client_id, service_id, user_id,
        scheduled_at, duration_minutes, status,
        series_id, series_session_number, is_series_booking,
        price
      ) VALUES (
        p_tenant_id, p_client_id, p_service_id, p_staff_id,
        v_session_date,
        (SELECT duration_minutes FROM services WHERE id = p_service_id),
        'confirmed',
        v_series_id, i, true,
        v_service_price * (1 - p_package_discount / 100)
      );
    END IF;
    
    -- Calculate next session date
    IF i < p_total_sessions AND p_interval_weeks IS NOT NULL THEN
      v_session_date := v_session_date + (p_interval_weeks || ' weeks')::interval;
    END IF;
  END LOOP;
  
  RETURN v_series_id;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON COLUMN tenants.business_hours IS 'JSON object with days 0-6 (0=Sunday) containing open/close times or closed flag';
COMMENT ON COLUMN tenants.timezone IS 'Timezone for the tenant location, used for business hours calculations';