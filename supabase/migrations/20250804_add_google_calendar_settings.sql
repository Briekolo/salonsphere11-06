-- Add Google Calendar integration settings to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS google_calendar_settings JSONB DEFAULT '{
    "sync_enabled": false,
    "calendar_id": null,
    "sync_direction": "both",
    "auto_accept_appointments": true,
    "appointment_color": "#4285f4",
    "include_client_details": true,
    "reminder_minutes": [15, 60],
    "sync_cancelled_appointments": false
}';

-- Add column for Google Calendar sync status
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS google_calendar_last_sync TIMESTAMP WITH TIME ZONE;

-- Update existing tenants to have default settings
UPDATE tenants 
SET google_calendar_settings = '{
    "sync_enabled": false,
    "calendar_id": null,
    "sync_direction": "both",
    "auto_accept_appointments": true,
    "appointment_color": "#4285f4",
    "include_client_details": true,
    "reminder_minutes": [15, 60],
    "sync_cancelled_appointments": false
}'
WHERE google_calendar_settings IS NULL;