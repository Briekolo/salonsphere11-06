/*
  Temporary workaround for "record 'new' has no field 'status'" error
  
  This adds a computed column to satisfy any legacy code still expecting
  the status field, without actually storing any data.
  
  This is a TEMPORARY fix - the proper solution is to update all 
  database objects to not reference the status field.
*/

-- Add a virtual status column that always returns a fixed value
-- This won't store any data but will satisfy any code expecting the field
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS status text 
GENERATED ALWAYS AS ('confirmed') STORED;

-- Add a comment explaining this is temporary
COMMENT ON COLUMN bookings.status IS 'TEMPORARY: Virtual column for backward compatibility. All bookings are considered confirmed. Remove after updating all references.';

-- Log what we did
DO $$
BEGIN
    RAISE NOTICE 'Added temporary virtual status column to bookings table';
    RAISE NOTICE 'This is a workaround - please investigate and fix the root cause';
    RAISE NOTICE 'Run investigate_status_references.sql to find what needs updating';
END $$;