-- Add function to create treatment series with custom appointment dates
-- This allows users to specify exact dates for each session instead of using intervals

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
BEGIN
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

-- Add comment for documentation
COMMENT ON FUNCTION create_treatment_series_with_custom_appointments IS 'Creates a treatment series with user-specified custom dates for each appointment';