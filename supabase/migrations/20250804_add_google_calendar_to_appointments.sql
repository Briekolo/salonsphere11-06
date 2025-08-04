-- Add Google Calendar integration columns to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS google_calendar_event_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS google_calendar_synced_at TIMESTAMP WITH TIME ZONE;

-- Add index for Google Calendar event lookups
CREATE INDEX IF NOT EXISTS idx_bookings_google_calendar_event_id 
ON bookings(google_calendar_event_id) 
WHERE google_calendar_event_id IS NOT NULL;