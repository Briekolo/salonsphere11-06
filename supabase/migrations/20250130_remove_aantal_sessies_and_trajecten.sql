-- Remove aantal_sessies feature and trajecten system
-- This migration removes the session-based treatment tracking functionality

-- Drop the trigger function that handles session-based payments
DROP FUNCTION IF EXISTS handle_behandeling_sessie_on_payment() CASCADE;

-- Drop the klant_behandeling_trajecten table entirely
DROP TABLE IF EXISTS klant_behandeling_trajecten CASCADE;

-- Remove the aantal_sessies column from services table
ALTER TABLE services DROP COLUMN IF EXISTS aantal_sessies;

-- Note: This migration will result in data loss for:
-- - 3 services with multiple sessions (data will be lost)
-- - 2 trajectory records (will be deleted)
-- This is acceptable as the feature has minimal usage