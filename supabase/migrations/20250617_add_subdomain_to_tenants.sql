-- Add subdomain and domain fields to tenants table for client module
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS subdomain text UNIQUE,
ADD COLUMN IF NOT EXISTS custom_domain text,
ADD COLUMN IF NOT EXISTS domain_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS domain_verified_at timestamptz,
ADD COLUMN IF NOT EXISTS theme_settings jsonb DEFAULT '{
  "primary_color": "#02011F",
  "secondary_color": "#FE7E6D", 
  "font_family": "Inter",
  "logo_position": "left"
}'::jsonb,
ADD COLUMN IF NOT EXISTS booking_settings jsonb DEFAULT '{
  "advance_booking_days": 90,
  "min_advance_hours": 24,
  "max_services_per_booking": 3,
  "require_deposit": false,
  "deposit_percentage": 20,
  "cancellation_hours": 24,
  "allow_guest_booking": true,
  "require_phone": true,
  "auto_confirm": true
}'::jsonb;

-- Create index on subdomain for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON tenants(custom_domain);

-- Generate subdomain from tenant name for existing tenants
-- This creates a URL-safe subdomain from the tenant name
UPDATE tenants 
SET subdomain = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), -- Remove special chars
      '\s+', '-', 'g' -- Replace spaces with hyphens
    ),
    '-+', '-', 'g' -- Replace multiple hyphens with single
  )
)
WHERE subdomain IS NULL;

-- Add comment
COMMENT ON COLUMN tenants.subdomain IS 'URL-safe subdomain for client-facing pages (e.g., beauty-salon in beauty-salon.salonsphere.nl)';