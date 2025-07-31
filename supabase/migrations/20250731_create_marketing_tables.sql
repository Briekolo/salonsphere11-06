/*
  # Marketing Module Database Schema

  1. New Tables
    - `marketing_campaigns` - Store campaign details and settings
    - `email_templates` - Reusable email templates
    - `customer_segments` - Define customer segments with criteria
    - `campaign_recipients` - Track who receives which campaigns
    - `email_metrics` - Track email events (opens, clicks, bounces)
    - `email_queue` - Queue for scheduled emails
    - `unsubscribes` - Track unsubscribed emails for GDPR

  2. Security
    - Enable RLS on all tables
    - Add policies for tenant-based data isolation
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Marketing Campaigns table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  subject_line text NOT NULL,
  subject_line_b text, -- For A/B testing
  template_id uuid,
  segment_id uuid,
  content text NOT NULL, -- HTML content
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
  send_type text NOT NULL DEFAULT 'immediate' CHECK (send_type IN ('immediate', 'scheduled')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  completed_at timestamptz,
  
  -- A/B Testing fields
  ab_test_enabled boolean DEFAULT false,
  ab_test_percentage integer DEFAULT 20 CHECK (ab_test_percentage >= 10 AND ab_test_percentage <= 50),
  ab_winner text CHECK (ab_winner IN ('a', 'b')),
  
  -- Metrics summary (denormalized for performance)
  total_recipients integer DEFAULT 0,
  total_sent integer DEFAULT 0,
  total_opened integer DEFAULT 0,
  total_clicked integer DEFAULT 0,
  total_bounced integer DEFAULT 0,
  total_unsubscribed integer DEFAULT 0,
  
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Email Templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'promotional', 'transactional', 'newsletter', 'automated')),
  subject_line text NOT NULL,
  html_content text NOT NULL,
  text_content text, -- Plain text version
  thumbnail_url text, -- Preview image
  
  -- Variables that can be used in the template
  variables jsonb DEFAULT '[]'::jsonb, -- Array of {name, description, default_value}
  
  -- Performance metrics (aggregated)
  times_used integer DEFAULT 0,
  avg_open_rate numeric(5,2) DEFAULT 0,
  avg_click_rate numeric(5,2) DEFAULT 0,
  
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Customer Segments table
CREATE TABLE IF NOT EXISTS customer_segments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  
  -- Segment criteria stored as JSON
  criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
  /* Example criteria structure:
    [
      {
        "field": "total_spent",
        "operator": "greater_than",
        "value": 500
      },
      {
        "field": "last_visit",
        "operator": "within_days",
        "value": 30
      }
    ]
  */
  
  -- Cached member count (updated periodically)
  member_count integer DEFAULT 0,
  last_calculated_at timestamptz,
  
  is_dynamic boolean DEFAULT true, -- Dynamic segments update automatically
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Campaign Recipients table (who gets which campaigns)
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  email text NOT NULL,
  
  -- A/B test assignment
  variant text DEFAULT 'a' CHECK (variant IN ('a', 'b')),
  
  -- Delivery status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'sent', 'delivered', 'bounced', 'failed')),
  sent_at timestamptz,
  delivered_at timestamptz,
  bounced_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  
  -- Engagement tracking
  opened_at timestamptz,
  clicked_at timestamptz,
  unsubscribed_at timestamptz,
  
  -- Resend message ID for tracking
  message_id text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure unique recipient per campaign
  UNIQUE(campaign_id, client_id)
);

-- Email Metrics table (detailed event tracking)
CREATE TABLE IF NOT EXISTS email_metrics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES campaign_recipients(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed')),
  event_timestamp timestamptz NOT NULL,
  
  -- Additional event data
  metadata jsonb DEFAULT '{}'::jsonb, -- Store click URLs, bounce reasons, etc.
  
  -- User agent and location data (from webhooks)
  user_agent text,
  ip_address inet,
  country text,
  city text,
  
  created_at timestamptz DEFAULT now()
);

-- Email Queue table (for scheduled and batch sending)
CREATE TABLE IF NOT EXISTS email_queue (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES campaign_recipients(id) ON DELETE CASCADE,
  
  -- Email details
  to_email text NOT NULL,
  subject text NOT NULL,
  html_content text NOT NULL,
  text_content text,
  
  -- Queue management
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  priority integer DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  
  -- Processing details
  processed_at timestamptz,
  error_message text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Unsubscribes table (GDPR compliance)
CREATE TABLE IF NOT EXISTS unsubscribes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  reason text,
  campaign_id uuid REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
  unsubscribed_at timestamptz DEFAULT now(),
  
  -- Ensure unique unsubscribe per tenant
  UNIQUE(tenant_id, email)
);

-- Create indexes for performance
CREATE INDEX idx_campaigns_tenant_status ON marketing_campaigns(tenant_id, status);
CREATE INDEX idx_campaigns_scheduled ON marketing_campaigns(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_templates_tenant_active ON email_templates(tenant_id, is_active);
CREATE INDEX idx_segments_tenant_active ON customer_segments(tenant_id, is_active);
CREATE INDEX idx_recipients_campaign_status ON campaign_recipients(campaign_id, status);
CREATE INDEX idx_recipients_client ON campaign_recipients(client_id);
CREATE INDEX idx_metrics_campaign_event ON email_metrics(campaign_id, event_type);
CREATE INDEX idx_metrics_timestamp ON email_metrics(event_timestamp);
CREATE INDEX idx_queue_status_scheduled ON email_queue(status, scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_unsubscribes_email ON unsubscribes(tenant_id, email);

-- Enable Row Level Security
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE unsubscribes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketing_campaigns
CREATE POLICY "Users can view campaigns in their tenant"
  ON marketing_campaigns FOR SELECT
  TO authenticated
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Admin and staff can create campaigns"
  ON marketing_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin and staff can update campaigns"
  ON marketing_campaigns FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin can delete campaigns"
  ON marketing_campaigns FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for email_templates
CREATE POLICY "Users can view templates in their tenant"
  ON email_templates FOR SELECT
  TO authenticated
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Admin and staff can manage templates"
  ON email_templates FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- RLS Policies for customer_segments
CREATE POLICY "Users can view segments in their tenant"
  ON customer_segments FOR SELECT
  TO authenticated
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Admin and staff can manage segments"
  ON customer_segments FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- RLS Policies for campaign_recipients
CREATE POLICY "Users can view recipients for their tenant's campaigns"
  ON campaign_recipients FOR SELECT
  TO authenticated
  USING (
    campaign_id IN (
      SELECT id FROM marketing_campaigns 
      WHERE tenant_id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "System can manage recipients"
  ON campaign_recipients FOR ALL
  TO authenticated
  USING (
    campaign_id IN (
      SELECT id FROM marketing_campaigns 
      WHERE tenant_id IN (
        SELECT tenant_id FROM users 
        WHERE id = auth.uid() AND role IN ('admin', 'staff')
      )
    )
  );

-- RLS Policies for email_metrics
CREATE POLICY "Users can view metrics for their tenant's campaigns"
  ON email_metrics FOR SELECT
  TO authenticated
  USING (
    campaign_id IN (
      SELECT id FROM marketing_campaigns 
      WHERE tenant_id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "System can insert metrics"
  ON email_metrics FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Webhook endpoints will handle validation

-- RLS Policies for email_queue
CREATE POLICY "Users can view queue items for their tenant"
  ON email_queue FOR SELECT
  TO authenticated
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "System can manage queue"
  ON email_queue FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- RLS Policies for unsubscribes
CREATE POLICY "Users can view unsubscribes in their tenant"
  ON unsubscribes FOR SELECT
  TO authenticated
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Anyone can unsubscribe"
  ON unsubscribes FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Will be validated in the API

-- Create function to update campaign metrics
CREATE OR REPLACE FUNCTION update_campaign_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update campaign metrics based on email_metrics events
  IF NEW.event_type = 'delivered' THEN
    UPDATE marketing_campaigns 
    SET total_sent = total_sent + 1
    WHERE id = NEW.campaign_id;
  ELSIF NEW.event_type = 'opened' THEN
    UPDATE marketing_campaigns 
    SET total_opened = total_opened + 1
    WHERE id = NEW.campaign_id;
  ELSIF NEW.event_type = 'clicked' THEN
    UPDATE marketing_campaigns 
    SET total_clicked = total_clicked + 1
    WHERE id = NEW.campaign_id;
  ELSIF NEW.event_type = 'bounced' THEN
    UPDATE marketing_campaigns 
    SET total_bounced = total_bounced + 1
    WHERE id = NEW.campaign_id;
  ELSIF NEW.event_type = 'unsubscribed' THEN
    UPDATE marketing_campaigns 
    SET total_unsubscribed = total_unsubscribed + 1
    WHERE id = NEW.campaign_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating campaign metrics
CREATE TRIGGER update_campaign_metrics_trigger
AFTER INSERT ON email_metrics
FOR EACH ROW
EXECUTE FUNCTION update_campaign_metrics();

-- Create function to calculate segment members
CREATE OR REPLACE FUNCTION calculate_segment_members(segment_id uuid)
RETURNS integer AS $$
DECLARE
  criteria jsonb;
  member_count integer;
  tenant_id_val uuid;
BEGIN
  -- Get segment criteria and tenant_id
  SELECT cs.criteria, cs.tenant_id 
  INTO criteria, tenant_id_val
  FROM customer_segments cs
  WHERE cs.id = segment_id;
  
  -- For now, return count of all clients in tenant
  -- This will be expanded to handle dynamic criteria
  SELECT COUNT(*)
  INTO member_count
  FROM clients c
  WHERE c.tenant_id = tenant_id_val
  AND c.email IS NOT NULL
  AND c.id NOT IN (
    SELECT u.client_id 
    FROM unsubscribes u 
    WHERE u.tenant_id = tenant_id_val 
    AND u.client_id IS NOT NULL
  );
  
  -- Update the segment with the new count
  UPDATE customer_segments
  SET member_count = member_count,
      last_calculated_at = now()
  WHERE id = segment_id;
  
  RETURN member_count;
END;
$$ LANGUAGE plpgsql;

-- Create default segments for new tenants
CREATE OR REPLACE FUNCTION create_default_segments()
RETURNS TRIGGER AS $$
BEGIN
  -- All Clients segment
  INSERT INTO customer_segments (tenant_id, name, description, criteria, is_dynamic)
  VALUES (
    NEW.id,
    'Alle Klanten',
    'Alle actieve klanten in uw database',
    '[]'::jsonb,
    true
  );
  
  -- New Clients segment
  INSERT INTO customer_segments (tenant_id, name, description, criteria, is_dynamic)
  VALUES (
    NEW.id,
    'Nieuwe Klanten',
    'Klanten die zich recent hebben aangemeld',
    '[{"field": "created_at", "operator": "within_days", "value": 30}]'::jsonb,
    true
  );
  
  -- VIP Clients segment
  INSERT INTO customer_segments (tenant_id, name, description, criteria, is_dynamic)
  VALUES (
    NEW.id,
    'VIP Klanten',
    'Klanten met hoge uitgaven',
    '[{"field": "total_spent", "operator": "greater_than", "value": 500}]'::jsonb,
    true
  );
  
  -- Inactive Clients segment
  INSERT INTO customer_segments (tenant_id, name, description, criteria, is_dynamic)
  VALUES (
    NEW.id,
    'Inactieve Klanten',
    'Klanten die lang niet geweest zijn',
    '[{"field": "last_booking", "operator": "older_than_days", "value": 90}]'::jsonb,
    true
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to add default segments for new tenants
CREATE TRIGGER create_default_segments_trigger
AFTER INSERT ON tenants
FOR EACH ROW
EXECUTE FUNCTION create_default_segments();

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_marketing_campaigns_updated_at BEFORE UPDATE ON marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_segments_updated_at BEFORE UPDATE ON customer_segments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_recipients_updated_at BEFORE UPDATE ON campaign_recipients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_queue_updated_at BEFORE UPDATE ON email_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create increment function for atomic updates
CREATE OR REPLACE FUNCTION increment(table_name text, column_name text, row_id uuid, increment_value int)
RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE %I SET %I = %I + $1 WHERE id = $2', table_name, column_name, column_name)
  USING increment_value, row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;