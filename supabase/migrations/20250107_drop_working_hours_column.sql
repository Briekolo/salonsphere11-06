-- Final migration: Drop the working_hours column after successful migration to staff_schedules
-- This should only be run after confirming all data has been migrated

BEGIN;

-- Safety check: Ensure all users with working_hours have corresponding staff_schedules
DO $$
DECLARE
  users_with_hours integer;
  users_with_schedules integer;
BEGIN
  SELECT COUNT(*) INTO users_with_hours
  FROM users 
  WHERE working_hours IS NOT NULL 
    AND working_hours != '{}'::jsonb
    AND role IN ('staff', 'admin');
  
  SELECT COUNT(DISTINCT staff_id) INTO users_with_schedules
  FROM staff_schedules;
  
  IF users_with_hours > 0 AND users_with_schedules < users_with_hours THEN
    RAISE EXCEPTION 'Not all working_hours have been migrated to staff_schedules. Aborting drop.';
  END IF;
  
  RAISE NOTICE 'Safety check passed: % users had working_hours, % have staff_schedules', 
    users_with_hours, users_with_schedules;
END $$;

-- Drop the working_hours column
ALTER TABLE users DROP COLUMN IF EXISTS working_hours;

-- Log the completion
RAISE NOTICE 'Successfully dropped working_hours column from users table';

COMMIT;