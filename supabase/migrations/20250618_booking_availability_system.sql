-- Booking Availability System for Client Module
-- This migration adds tables for real-time availability checking and optimistic locking

-- Table for available time slots per staff member
CREATE TABLE IF NOT EXISTS booking_slots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true,
  break_time boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, staff_id, date, start_time)
);

-- Table for temporary slot reservations (optimistic locking)
CREATE TABLE IF NOT EXISTS booking_holds (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  staff_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  slot_date date NOT NULL,
  slot_time time NOT NULL,
  duration_minutes integer NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, staff_id, slot_date, slot_time)
);

-- Staff work schedules
CREATE TABLE IF NOT EXISTS staff_schedules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 6 = Saturday
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, staff_id, day_of_week)
);

-- Schedule exceptions (holidays, sick days, etc)
CREATE TABLE IF NOT EXISTS schedule_exceptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time,
  end_time time,
  is_available boolean DEFAULT false,
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, staff_id, date)
);

-- Extend services table with booking requirements
ALTER TABLE services ADD COLUMN IF NOT EXISTS
  requires_specific_room boolean DEFAULT false,
  room_ids uuid[] DEFAULT '{}',
  buffer_time_before integer DEFAULT 0,
  buffer_time_after integer DEFAULT 15,
  max_advance_days integer DEFAULT 90,
  min_advance_hours integer DEFAULT 24;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_booking_slots_lookup 
  ON booking_slots(tenant_id, date, staff_id) 
  WHERE is_available = true;

CREATE INDEX IF NOT EXISTS idx_booking_holds_active 
  ON booking_holds(tenant_id, expires_at) 
  WHERE expires_at > now();

CREATE INDEX IF NOT EXISTS idx_bookings_by_date 
  ON bookings(tenant_id, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_staff_schedules_active
  ON staff_schedules(tenant_id, staff_id)
  WHERE is_active = true;

-- RLS Policies
ALTER TABLE booking_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_exceptions ENABLE ROW LEVEL SECURITY;

-- Booking slots policies (read-only for clients)
CREATE POLICY "Clients can view available slots for their tenant" ON booking_slots
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM tenants WHERE id = tenant_id
    )
  );

-- Booking holds policies (clients can create/read their own holds)
CREATE POLICY "Anyone can create holds with session" ON booking_holds
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view holds for availability checking" ON booking_holds
  FOR SELECT USING (true);

CREATE POLICY "Session owners can delete their holds" ON booking_holds
  FOR DELETE USING (session_id = current_setting('app.session_id', true));

-- Staff schedules policies (read-only for clients)
CREATE POLICY "Public can view staff schedules" ON staff_schedules
  FOR SELECT USING (true);

-- Schedule exceptions policies (read-only for clients)
CREATE POLICY "Public can view schedule exceptions" ON schedule_exceptions
  FOR SELECT USING (true);

-- Function to clean up expired holds
CREATE OR REPLACE FUNCTION cleanup_expired_holds()
RETURNS void AS $$
BEGIN
  DELETE FROM booking_holds
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check slot availability
CREATE OR REPLACE FUNCTION check_slot_availability(
  p_tenant_id uuid,
  p_staff_id uuid,
  p_date date,
  p_time time,
  p_duration_minutes integer
)
RETURNS boolean AS $$
DECLARE
  v_available boolean;
  v_end_time time;
BEGIN
  v_end_time := p_time + (p_duration_minutes || ' minutes')::interval;
  
  -- Check if slot exists and is available
  SELECT EXISTS (
    SELECT 1 FROM booking_slots
    WHERE tenant_id = p_tenant_id
      AND staff_id = p_staff_id
      AND date = p_date
      AND start_time <= p_time
      AND end_time >= v_end_time
      AND is_available = true
      AND NOT break_time
  ) INTO v_available;
  
  IF NOT v_available THEN
    RETURN false;
  END IF;
  
  -- Check for existing bookings
  SELECT NOT EXISTS (
    SELECT 1 FROM bookings
    WHERE tenant_id = p_tenant_id
      AND staff_id = p_staff_id
      AND scheduled_at::date = p_date
      AND (
        (scheduled_at::time <= p_time AND (scheduled_at::time + (duration_minutes || ' minutes')::interval) > p_time)
        OR (scheduled_at::time < v_end_time AND scheduled_at::time >= p_time)
      )
      AND status NOT IN ('cancelled', 'no_show')
  ) INTO v_available;
  
  IF NOT v_available THEN
    RETURN false;
  END IF;
  
  -- Check for active holds
  SELECT NOT EXISTS (
    SELECT 1 FROM booking_holds
    WHERE tenant_id = p_tenant_id
      AND staff_id = p_staff_id
      AND slot_date = p_date
      AND slot_time = p_time
      AND expires_at > now()
  ) INTO v_available;
  
  RETURN v_available;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_booking_slots_updated_at BEFORE UPDATE ON booking_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_schedules_updated_at BEFORE UPDATE ON staff_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE booking_slots IS 'Available time slots for staff members';
COMMENT ON TABLE booking_holds IS 'Temporary slot reservations with optimistic locking';
COMMENT ON TABLE staff_schedules IS 'Regular working hours for staff members';
COMMENT ON TABLE schedule_exceptions IS 'Exceptions to regular schedules (holidays, sick days, etc)';
COMMENT ON COLUMN booking_holds.expires_at IS 'When this hold expires and slot becomes available again';
COMMENT ON COLUMN staff_schedules.day_of_week IS '0 = Sunday, 1 = Monday, ..., 6 = Saturday';