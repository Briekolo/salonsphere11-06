-- Migration: Convert legacy working_hours to staff_schedules table
-- This migration moves all staff working hours from the JSON field to the normalized table

BEGIN;

-- Create a temporary function to map Dutch day names to day numbers
CREATE OR REPLACE FUNCTION map_dutch_day_to_number(day_name text) 
RETURNS integer AS $$
BEGIN
  CASE lower(day_name)
    WHEN 'zondag' THEN RETURN 0;
    WHEN 'maandag' THEN RETURN 1;
    WHEN 'dinsdag' THEN RETURN 2;
    WHEN 'woensdag' THEN RETURN 3;
    WHEN 'donderdag' THEN RETURN 4;
    WHEN 'vrijdag' THEN RETURN 5;
    WHEN 'zaterdag' THEN RETURN 6;
    ELSE RETURN NULL;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Delete any existing staff_schedules to avoid conflicts
-- (This is safe as the system is currently using working_hours)
DELETE FROM staff_schedules 
WHERE staff_id IN (
  SELECT id FROM users WHERE working_hours IS NOT NULL
);

-- Migrate all working_hours data to staff_schedules
INSERT INTO staff_schedules (
  id,
  tenant_id,
  staff_id,
  day_of_week,
  start_time,
  end_time,
  is_active,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid() as id,
  u.tenant_id,
  u.id as staff_id,
  map_dutch_day_to_number(day_key) as day_of_week,
  (day_value->>'start')::time as start_time,
  (day_value->>'end')::time as end_time,
  COALESCE((day_value->>'enabled')::boolean, false) as is_active,
  NOW() as created_at,
  NOW() as updated_at
FROM 
  users u,
  jsonb_each(u.working_hours) as schedule(day_key, day_value)
WHERE 
  u.working_hours IS NOT NULL
  AND u.working_hours != '{}'::jsonb
  AND map_dutch_day_to_number(day_key) IS NOT NULL
  AND day_value->>'start' IS NOT NULL
  AND day_value->>'end' IS NOT NULL;

-- Log the migration results
DO $$
DECLARE
  migrated_count integer;
  users_with_hours integer;
BEGIN
  SELECT COUNT(DISTINCT staff_id) INTO migrated_count 
  FROM staff_schedules 
  WHERE created_at >= NOW() - INTERVAL '1 minute';
  
  SELECT COUNT(*) INTO users_with_hours
  FROM users 
  WHERE working_hours IS NOT NULL AND working_hours != '{}'::jsonb;
  
  RAISE NOTICE 'Migration complete: % users migrated, % total users had working_hours', 
    migrated_count, users_with_hours;
END $$;

-- Clean up the temporary function
DROP FUNCTION IF EXISTS map_dutch_day_to_number(text);

-- Note: We're NOT dropping the working_hours column yet
-- This will be done in a separate migration after confirming everything works
-- ALTER TABLE users DROP COLUMN working_hours;

COMMIT;