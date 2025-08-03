-- Treatment Series Tracking System
-- This migration adds comprehensive support for multi-phase treatment plans

-- Create treatment_series table to track multi-appointment treatment plans
CREATE TABLE treatment_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES users(id) ON DELETE SET NULL,
  
  -- Series configuration
  total_sessions integer NOT NULL CHECK (total_sessions >= 2),
  completed_sessions integer NOT NULL DEFAULT 0 CHECK (completed_sessions >= 0),
  interval_weeks integer, -- Recommended weeks between sessions
  
  -- Pricing
  package_discount_percentage decimal(5,2) DEFAULT 0 CHECK (package_discount_percentage >= 0 AND package_discount_percentage <= 100),
  total_price decimal(10,2) NOT NULL,
  paid_amount decimal(10,2) DEFAULT 0,
  
  -- Status tracking
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'paused')),
  notes text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  cancelled_at timestamptz,
  
  -- Ensure completed_sessions doesn't exceed total_sessions
  CONSTRAINT valid_session_count CHECK (completed_sessions <= total_sessions)
);

-- Add series tracking to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS series_id uuid REFERENCES treatment_series(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS series_session_number integer,
ADD COLUMN IF NOT EXISTS is_series_booking boolean DEFAULT false;

-- Create index for efficient queries
CREATE INDEX idx_treatment_series_tenant_client ON treatment_series(tenant_id, client_id);
CREATE INDEX idx_treatment_series_status ON treatment_series(status);
CREATE INDEX idx_bookings_series ON bookings(series_id);

-- Add RLS policies for treatment_series
ALTER TABLE treatment_series ENABLE ROW LEVEL SECURITY;

-- Allow users to view treatment series for their tenant
CREATE POLICY "Users can view treatment series for their tenant" ON treatment_series
  FOR SELECT USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

-- Allow users to create treatment series for their tenant
CREATE POLICY "Users can create treatment series for their tenant" ON treatment_series
  FOR INSERT WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

-- Allow users to update treatment series for their tenant
CREATE POLICY "Users can update treatment series for their tenant" ON treatment_series
  FOR UPDATE USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

-- Create function to update treatment series progress
CREATE OR REPLACE FUNCTION update_treatment_series_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if this is a series booking being marked as completed
  IF NEW.series_id IS NOT NULL AND NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update the completed sessions count
    UPDATE treatment_series
    SET 
      completed_sessions = completed_sessions + 1,
      updated_at = now(),
      status = CASE 
        WHEN completed_sessions + 1 >= total_sessions THEN 'completed'
        ELSE status
      END,
      completed_at = CASE 
        WHEN completed_sessions + 1 >= total_sessions THEN now()
        ELSE completed_at
      END
    WHERE id = NEW.series_id;
  END IF;
  
  -- Handle cancellation
  IF NEW.series_id IS NOT NULL AND NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    -- Check if we should update series status based on remaining bookings
    UPDATE treatment_series ts
    SET 
      status = CASE 
        WHEN NOT EXISTS (
          SELECT 1 FROM bookings 
          WHERE series_id = ts.id 
          AND status NOT IN ('cancelled', 'completed')
        ) THEN 'cancelled'
        ELSE status
      END,
      cancelled_at = CASE 
        WHEN NOT EXISTS (
          SELECT 1 FROM bookings 
          WHERE series_id = ts.id 
          AND status NOT IN ('cancelled', 'completed')
        ) THEN now()
        ELSE cancelled_at
      END,
      updated_at = now()
    WHERE id = NEW.series_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update series progress
CREATE TRIGGER update_series_progress_on_booking_change
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_treatment_series_progress();

-- Add helpful view for treatment series with details
CREATE OR REPLACE VIEW treatment_series_details AS
SELECT 
  ts.*,
  c.first_name || ' ' || c.last_name as client_name,
  c.email as client_email,
  c.phone as client_phone,
  s.name as service_name,
  s.duration_minutes as service_duration,
  s.price as service_price,
  u.first_name || ' ' || u.last_name as staff_name,
  (
    SELECT COUNT(*) 
    FROM bookings 
    WHERE series_id = ts.id 
    AND status NOT IN ('cancelled')
  ) as total_booked_sessions,
  (
    SELECT MIN(scheduled_at) 
    FROM bookings 
    WHERE series_id = ts.id 
    AND status = 'confirmed'
    AND scheduled_at > now()
  ) as next_appointment_date
FROM treatment_series ts
JOIN clients c ON c.id = ts.client_id
JOIN services s ON s.id = ts.service_id
LEFT JOIN users u ON u.id = ts.staff_id;

-- Grant access to the view
GRANT SELECT ON treatment_series_details TO authenticated;

-- Add function to create a treatment series with all appointments
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
    
    -- Calculate next session date
    IF i < p_total_sessions AND p_interval_weeks IS NOT NULL THEN
      v_session_date := v_session_date + (p_interval_weeks || ' weeks')::interval;
    END IF;
  END LOOP;
  
  RETURN v_series_id;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE treatment_series IS 'Tracks multi-session treatment plans for clients';
COMMENT ON COLUMN treatment_series.total_sessions IS 'Total number of sessions in the treatment plan';
COMMENT ON COLUMN treatment_series.completed_sessions IS 'Number of sessions already completed';
COMMENT ON COLUMN treatment_series.interval_weeks IS 'Recommended weeks between sessions';
COMMENT ON COLUMN treatment_series.package_discount_percentage IS 'Discount percentage when booking the full series';
COMMENT ON COLUMN bookings.series_id IS 'Reference to treatment series if this booking is part of a multi-session plan';
COMMENT ON COLUMN bookings.series_session_number IS 'Session number within the treatment series (1, 2, 3, etc)';
COMMENT ON COLUMN bookings.is_series_booking IS 'Flag to indicate this booking is part of a treatment series';