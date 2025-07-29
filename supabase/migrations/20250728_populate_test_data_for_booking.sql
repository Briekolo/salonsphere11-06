-- Migration to populate test data for booking system to work
-- This will create the necessary schedules and staff assignments for testing

-- Insert test staff schedules (Monday to Friday, 9 AM to 5 PM for existing users)
INSERT INTO staff_schedules (tenant_id, staff_id, day_of_week, start_time, end_time, is_active)
SELECT 
  u.tenant_id,
  u.id as staff_id,
  generate_series(1, 5) as day_of_week, -- Monday to Friday
  '09:00:00'::time as start_time,
  '17:00:00'::time as end_time,
  true as is_active
FROM users u
WHERE u.role = 'staff' OR u.role = 'admin'
ON CONFLICT (tenant_id, staff_id, day_of_week) DO NOTHING;

-- Insert staff-service assignments (assign all staff to all services in their tenant)
INSERT INTO staff_services (tenant_id, staff_id, service_id, proficiency_level, active)
SELECT 
  s.tenant_id,
  u.id as staff_id,
  s.id as service_id,
  'standard' as proficiency_level,
  true as active
FROM users u
CROSS JOIN services s
WHERE u.tenant_id = s.tenant_id 
  AND (u.role = 'staff' OR u.role = 'admin')
ON CONFLICT (staff_id, service_id) DO UPDATE SET active = true;

-- Add buffer time settings to services if they don't exist
UPDATE services SET 
  buffer_time_before = COALESCE(buffer_time_before, 0),
  buffer_time_after = COALESCE(buffer_time_after, 15),
  max_advance_days = COALESCE(max_advance_days, 90),
  min_advance_hours = COALESCE(min_advance_hours, 2)
WHERE buffer_time_before IS NULL 
   OR buffer_time_after IS NULL 
   OR max_advance_days IS NULL 
   OR min_advance_hours IS NULL;