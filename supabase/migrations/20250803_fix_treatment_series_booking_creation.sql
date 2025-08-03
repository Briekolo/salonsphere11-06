-- Fix treatment series booking creation functions
-- Issue: Functions were using incorrect column name 'staff_id' instead of 'user_id' in bookings table

-- Fix the interval-based function
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
        tenant_id, client_id, service_id, user_id,  -- FIXED: changed staff_id to user_id
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

-- Fix the custom dates function
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
    RAISE EXCEPTION 'One or more appointments are outside business hours: %', 
      array_to_string(v_validation_errors, ', ');
  END IF;

  -- Get service price
  SELECT price INTO v_service_price 
  FROM services 
  WHERE id = p_service_id AND tenant_id = p_tenant_id;
  
  IF v_service_price IS NULL THEN
    RAISE EXCEPTION 'Service not found or not accessible';
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
      tenant_id, client_id, service_id, user_id,  -- FIXED: changed staff_id to user_id
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

-- Add comment explaining the fix
COMMENT ON FUNCTION create_treatment_series_with_appointments IS 'Creates treatment series with appointments at regular intervals. Fixed column name from staff_id to user_id in bookings table.';
COMMENT ON FUNCTION create_treatment_series_with_custom_appointments IS 'Creates treatment series with custom appointment dates. Fixed column name from staff_id to user_id in bookings table.';