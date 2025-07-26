-- Add treatment session fields to services table
-- This is a unique feature that shows how many sessions are typically needed for optimal results

ALTER TABLE services
ADD COLUMN IF NOT EXISTS treatments_needed integer DEFAULT 1 CHECK (treatments_needed >= 1),
ADD COLUMN IF NOT EXISTS treatment_interval_weeks integer CHECK (treatment_interval_weeks >= 1),
ADD COLUMN IF NOT EXISTS treatment_package_discount decimal(5,2) DEFAULT 0 CHECK (treatment_package_discount >= 0 AND treatment_package_discount <= 100);

-- Add comments for clarity
COMMENT ON COLUMN services.treatments_needed IS 'Number of treatment sessions typically needed for optimal results';
COMMENT ON COLUMN services.treatment_interval_weeks IS 'Recommended weeks between treatment sessions';
COMMENT ON COLUMN services.treatment_package_discount IS 'Discount percentage when booking all recommended sessions as a package';