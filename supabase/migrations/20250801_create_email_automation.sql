-- Create email automation settings table
CREATE TABLE email_automation_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Email toggles
  welcome_email_enabled BOOLEAN DEFAULT false,
  booking_confirmation_enabled BOOLEAN DEFAULT true,
  booking_reminder_enabled BOOLEAN DEFAULT true,
  
  -- Email template IDs (for future customization)
  welcome_email_template_id UUID REFERENCES email_templates(id),
  booking_confirmation_template_id UUID REFERENCES email_templates(id),
  booking_reminder_template_id UUID REFERENCES email_templates(id),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id)
);

-- Create email automation logs table
CREATE TABLE email_automation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email_type VARCHAR(50) NOT NULL, -- 'welcome', 'booking_confirmation', 'booking_reminder'
  recipient_email VARCHAR(255) NOT NULL,
  client_id UUID REFERENCES clients(id),
  booking_id UUID REFERENCES bookings(id),
  status VARCHAR(50) NOT NULL, -- 'sent', 'failed', 'pending'
  resend_email_id VARCHAR(255),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for email_automation_settings
ALTER TABLE email_automation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view their own email automation settings"
  ON email_automation_settings FOR SELECT
  USING (tenant_id = (auth.jwt() ->> 'user_metadata'::text)::jsonb ->> 'tenant_id'::text)::UUID;

CREATE POLICY "Tenants can update their own email automation settings"
  ON email_automation_settings FOR UPDATE
  USING (tenant_id = (auth.jwt() ->> 'user_metadata'::text)::jsonb ->> 'tenant_id'::text)::UUID;

CREATE POLICY "Tenants can insert their own email automation settings"
  ON email_automation_settings FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt() ->> 'user_metadata'::text)::jsonb ->> 'tenant_id'::text)::UUID;

-- Add RLS policies for email_automation_logs
ALTER TABLE email_automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view their own email automation logs"
  ON email_automation_logs FOR SELECT
  USING (tenant_id = (auth.jwt() ->> 'user_metadata'::text)::jsonb ->> 'tenant_id'::text)::UUID;

CREATE POLICY "Service role can insert email automation logs"
  ON email_automation_logs FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_email_automation_settings_tenant_id ON email_automation_settings(tenant_id);
CREATE INDEX idx_email_automation_logs_tenant_id ON email_automation_logs(tenant_id);
CREATE INDEX idx_email_automation_logs_email_type ON email_automation_logs(email_type);
CREATE INDEX idx_email_automation_logs_created_at ON email_automation_logs(created_at DESC);

-- Insert default settings for existing tenants
INSERT INTO email_automation_settings (tenant_id, welcome_email_enabled, booking_confirmation_enabled, booking_reminder_enabled)
SELECT id, false, true, true
FROM tenants
ON CONFLICT (tenant_id) DO NOTHING;