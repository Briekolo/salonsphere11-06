-- Add proper business hours validation to treatment series functions
-- This migration ensures that appointments can only be scheduled during business hours

-- Update the custom appointments function to use proper validation
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

-- Add a trigger to prevent any booking creation outside business hours
CREATE OR REPLACE FUNCTION check_booking_business_hours() 
RETURNS TRIGGER AS $$
BEGIN
  -- Only check for non-series bookings or if explicitly requested
  IF NOT COALESCE(NEW.is_series_booking, false) OR 
     current_setting('salonsphere.validate_business_hours', true) = 'true' THEN
    
    IF NOT is_within_business_hours(NEW.tenant_id, NEW.scheduled_at) THEN
      RAISE EXCEPTION 'Booking scheduled outside business hours for %', 
        NEW.scheduled_at;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS booking_business_hours_check ON bookings;
CREATE TRIGGER booking_business_hours_check
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_booking_business_hours();

-- Add comments
COMMENT ON FUNCTION create_treatment_series_with_custom_appointments IS 'Creates treatment series with custom dates and validates business hours';
COMMENT ON FUNCTION check_booking_business_hours IS 'Prevents bookings outside business hours';
COMMENT ON TRIGGER booking_business_hours_check ON bookings IS 'Validates booking times against business hours';