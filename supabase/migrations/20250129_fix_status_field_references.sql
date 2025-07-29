/*
  Fix for "record 'new' has no field 'status'" error
  
  This migration addresses any remaining references to the removed status field
  in the bookings table that might exist in triggers, functions, or policies.
*/

-- First, let's check if there are any functions that reference NEW.status or OLD.status
DO $$
DECLARE
    func_name text;
    func_source text;
BEGIN
    -- Find and update any functions that reference bookings.status
    FOR func_name, func_source IN 
        SELECT proname, prosrc 
        FROM pg_proc 
        WHERE prosrc LIKE '%NEW.status%' 
           OR prosrc LIKE '%OLD.status%'
           OR (prosrc LIKE '%bookings%' AND prosrc LIKE '%.status%')
    LOOP
        RAISE NOTICE 'Found function % that references status field', func_name;
        -- You would need to manually update these functions
    END LOOP;
END $$;

-- If there's a generic update trigger that's trying to copy all fields, 
-- we might need to update it. Let's check for common patterns:

-- Drop and recreate any triggers that might be causing issues
-- This is a safe operation as we're only updating the updated_at timestamp

-- First, save the existing trigger function if it exists
DO $$
BEGIN
    -- Check if we have any triggers on bookings that might be problematic
    IF EXISTS (
        SELECT 1 
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'bookings' 
        AND t.tgname != 'update_bookings_updated_at'
    ) THEN
        RAISE NOTICE 'Found additional triggers on bookings table that might need attention';
    END IF;
END $$;

-- Create a safe update_updated_at function if it doesn't exist or might be corrupted
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger to ensure it's clean
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON bookings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Check and update RLS policies that might reference status
DO $$
DECLARE
    policy_rec record;
BEGIN
    FOR policy_rec IN 
        SELECT polname 
        FROM pg_policy 
        WHERE polrelid = 'public.bookings'::regclass
    LOOP
        -- Log any policies found for manual review
        RAISE NOTICE 'Policy found on bookings table: %', policy_rec.polname;
    END LOOP;
END $$;

-- If the issue persists after running this migration, you may need to:
-- 1. Check for any Edge Functions or database functions that construct dynamic SQL
-- 2. Look for any materialized views that need to be refreshed
-- 3. Check if there are any foreign tables or extensions causing issues

-- As a last resort, if there's a hidden reference we can't find,
-- we could add a computed column (but this should be avoided if possible):
-- ALTER TABLE bookings ADD COLUMN status text GENERATED ALWAYS AS ('completed') STORED;
-- But let's not do this unless absolutely necessary

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Migration to fix status field references completed';
    RAISE NOTICE 'If errors persist, check the investigate_status_references.sql output';
END $$;