-- Improve business hours error messages to be more user-friendly
-- This migration updates error messages to be clearer for end users

-- Update the booking validation trigger with better error messages
CREATE OR REPLACE FUNCTION check_booking_business_hours() 
RETURNS TRIGGER AS $$
DECLARE
  v_business_hours jsonb;
  v_day_of_week int;
  v_day_config jsonb;
  v_day_names text[] := ARRAY['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
  v_local_time timestamp;
  v_formatted_time text;
  v_day_name text;
BEGIN
  -- Only check for non-series bookings or if explicitly requested
  IF NOT COALESCE(NEW.is_series_booking, false) OR 
     current_setting('salonsphere.validate_business_hours', true) = 'true' THEN
    
    IF NOT is_within_business_hours(NEW.tenant_id, NEW.scheduled_at) THEN
      -- Get business hours and format a user-friendly error message
      SELECT business_hours INTO v_business_hours
      FROM tenants WHERE id = NEW.tenant_id;
      
      -- Convert to local time for better readability
      v_local_time := NEW.scheduled_at AT TIME ZONE 'Europe/Amsterdam';
      v_day_of_week := EXTRACT(dow FROM v_local_time)::int;
      v_day_name := v_day_names[v_day_of_week + 1];
      v_formatted_time := to_char(v_local_time, 'HH24:MI');
      
      -- Get day configuration
      v_day_config := v_business_hours->v_day_of_week::text;
      
      -- Create specific error message based on the situation
      IF v_day_config->>'closed' = 'true' THEN
        RAISE EXCEPTION 'Deze afspraak kan niet worden ingepland omdat wij op % gesloten zijn. Kies een andere dag.', v_day_name
        USING HINT = 'Bekijk onze openingstijden en kies een beschikbare dag.';
      ELSE
        RAISE EXCEPTION 'Deze afspraak (% om %) valt buiten onze openingstijden. Wij zijn op % open van % tot %.', 
          v_day_name, v_formatted_time, v_day_name, 
          v_day_config->>'open', v_day_config->>'close'
        USING HINT = 'Kies een tijd binnen onze openingstijden.';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the treatment series validation function with better error messages
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
  v_business_hours jsonb;
  v_day_of_week int;
  v_day_config jsonb;
  v_day_names text[] := ARRAY['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
  v_local_time timestamp;
  v_formatted_time text;
  v_day_name text;
BEGIN
  -- Get business hours once
  SELECT business_hours INTO v_business_hours
  FROM tenants WHERE id = p_tenant_id;
  
  FOR i IN 1..array_length(p_dates, 1) LOOP
    v_date := p_dates[i];
    
    IF NOT is_within_business_hours(p_tenant_id, v_date) THEN
      -- Format user-friendly error message
      v_local_time := v_date AT TIME ZONE 'Europe/Amsterdam';
      v_day_of_week := EXTRACT(dow FROM v_local_time)::int;
      v_day_name := v_day_names[v_day_of_week + 1];
      v_formatted_time := to_char(v_local_time, 'HH24:MI');
      v_day_config := v_business_hours->v_day_of_week::text;
      
      IF v_day_config->>'closed' = 'true' THEN
        RETURN QUERY SELECT 
          i, 
          v_date, 
          false, 
          format('Afspraak op %s kan niet worden ingepland - wij zijn deze dag gesloten', v_day_name);
      ELSE
        RETURN QUERY SELECT 
          i, 
          v_date, 
          false, 
          format('Afspraak op %s om %s valt buiten openingstijden (%s - %s)', 
            v_day_name, v_formatted_time, v_day_config->>'open', v_day_config->>'close');
      END IF;
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

-- Update the treatment series function to use better error messages
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
  v_validation_errors text[];
BEGIN
  -- Validate all dates are within business hours
  SELECT 
    COUNT(*) FILTER (WHERE NOT is_valid),
    array_agg(reason) FILTER (WHERE NOT is_valid)
  INTO v_invalid_dates, v_validation_errors
  FROM validate_treatment_series_dates(p_tenant_id, p_custom_dates);
  
  IF v_invalid_dates > 0 THEN
    RAISE EXCEPTION 'Sommige afspraken kunnen niet worden ingepland: %', 
      array_to_string(v_validation_errors, '; ')
    USING HINT = 'Controleer de geselecteerde tijden en kies tijden binnen onze openingstijden.';
  END IF;

  -- Get service price
  SELECT price INTO v_service_price 
  FROM services 
  WHERE id = p_service_id AND tenant_id = p_tenant_id;
  
  IF v_service_price IS NULL THEN
    RAISE EXCEPTION 'De geselecteerde behandeling is niet beschikbaar'
    USING HINT = 'Kies een andere behandeling of neem contact op met de salon.';
  END IF;
  
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

-- Update comments
COMMENT ON FUNCTION check_booking_business_hours IS 'Prevents bookings outside business hours with user-friendly error messages';
COMMENT ON FUNCTION validate_treatment_series_dates IS 'Validates treatment series dates with user-friendly error messages';
COMMENT ON FUNCTION create_treatment_series_with_custom_appointments IS 'Creates treatment series with user-friendly validation messages';