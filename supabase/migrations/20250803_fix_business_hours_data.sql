-- Fix business hours data for existing tenants
-- This migration ensures all tenants have proper business hours configuration

-- Update existing tenants that have NULL business_hours
UPDATE tenants 
SET business_hours = jsonb_build_object(
  '0', jsonb_build_object('closed', true),  -- Sunday
  '1', jsonb_build_object('closed', false, 'open', '09:00', 'close', '18:00'), -- Monday
  '2', jsonb_build_object('closed', false, 'open', '09:00', 'close', '18:00'), -- Tuesday
  '3', jsonb_build_object('closed', false, 'open', '09:00', 'close', '18:00'), -- Wednesday
  '4', jsonb_build_object('closed', false, 'open', '09:00', 'close', '18:00'), -- Thursday
  '5', jsonb_build_object('closed', false, 'open', '09:00', 'close', '18:00'), -- Friday
  '6', jsonb_build_object('closed', false, 'open', '10:00', 'close', '16:00')  -- Saturday
)
WHERE business_hours IS NULL;

-- Ensure timezone is set for all tenants
UPDATE tenants 
SET timezone = 'Europe/Amsterdam'
WHERE timezone IS NULL;

-- Add a check constraint to prevent NULL business_hours in the future
ALTER TABLE tenants 
ADD CONSTRAINT business_hours_not_null 
CHECK (business_hours IS NOT NULL);

-- Add comment for documentation
COMMENT ON CONSTRAINT business_hours_not_null ON tenants IS 'Ensures all tenants have business hours configuration';