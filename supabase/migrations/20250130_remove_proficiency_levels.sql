-- Remove proficiency_level column from staff_services table
ALTER TABLE staff_services DROP COLUMN IF EXISTS proficiency_level;

-- Update get_available_staff_for_service function to remove proficiency_level
CREATE OR REPLACE FUNCTION get_available_staff_for_service(
  p_service_id UUID,
  p_tenant_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_duration_minutes INTEGER
)
RETURNS TABLE (
  staff_id UUID,
  staff_name TEXT,
  custom_duration_minutes INTEGER,
  custom_price DECIMAL(10,2),
  is_available BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as staff_id,
    u.first_name || ' ' || u.last_name as staff_name,
    ss.custom_duration_minutes,
    ss.custom_price,
    NOT EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.staff_id = u.id
        AND b.booking_date = p_date
        AND b.status NOT IN ('cancelled', 'no-show')
        AND (
          (b.start_time, b.start_time + (b.duration_minutes || ' minutes')::interval) 
          OVERLAPS 
          (p_start_time, p_start_time + (p_duration_minutes || ' minutes')::interval)
        )
    ) as is_available
  FROM users u
  INNER JOIN staff_services ss ON u.id = ss.staff_id
  WHERE ss.service_id = p_service_id
    AND ss.tenant_id = p_tenant_id
    AND ss.active = true
    AND u.active = true
    AND u.role IN ('staff', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on updated function
GRANT EXECUTE ON FUNCTION get_available_staff_for_service TO authenticated;