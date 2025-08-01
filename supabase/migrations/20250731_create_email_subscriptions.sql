/*
  # Email Subscriptions Table

  1. New Table
    - `email_subscriptions` - Store email subscription data
    
  2. Security
    - Enable RLS on the table
    - Add policies for tenant-based data isolation
    
  3. Indexes
    - Performance indexes for common queries
*/

-- Create email_subscriptions table
CREATE TABLE IF NOT EXISTS email_subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Subscription details
  subscribed_at timestamptz DEFAULT now(),
  unsubscribed_at timestamptz,
  subscription_source text NOT NULL DEFAULT 'manual' CHECK (subscription_source IN ('manual', 'website', 'checkout', 'import', 'booking')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced', 'invalid')),
  
  -- Additional metadata
  first_name text,
  last_name text,
  tags jsonb DEFAULT '[]'::jsonb,
  
  -- Tracking
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure unique email per tenant
  UNIQUE(tenant_id, email)
);

-- Create indexes for performance
CREATE INDEX idx_subscriptions_tenant_status ON email_subscriptions(tenant_id, status);
CREATE INDEX idx_subscriptions_email ON email_subscriptions(email);
CREATE INDEX idx_subscriptions_client ON email_subscriptions(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_subscriptions_subscribed ON email_subscriptions(subscribed_at);

-- Enable RLS
ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view subscriptions in their tenant"
  ON email_subscriptions FOR SELECT
  TO authenticated
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Admin and staff can create subscriptions"
  ON email_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin and staff can update subscriptions"
  ON email_subscriptions FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin can delete subscriptions"
  ON email_subscriptions FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER update_email_subscriptions_updated_at
  BEFORE UPDATE ON email_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_email_subscriptions_updated_at();

-- Function to get subscription statistics
CREATE OR REPLACE FUNCTION get_subscription_stats(p_tenant_id uuid)
RETURNS TABLE (
  total_active integer,
  total_unsubscribed integer,
  total_bounced integer,
  new_this_month integer,
  unsubscribed_this_month integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status = 'active')::integer AS total_active,
    COUNT(*) FILTER (WHERE status = 'unsubscribed')::integer AS total_unsubscribed,
    COUNT(*) FILTER (WHERE status = 'bounced')::integer AS total_bounced,
    COUNT(*) FILTER (WHERE status = 'active' AND subscribed_at >= date_trunc('month', now()))::integer AS new_this_month,
    COUNT(*) FILTER (WHERE status = 'unsubscribed' AND unsubscribed_at >= date_trunc('month', now()))::integer AS unsubscribed_this_month
  FROM email_subscriptions
  WHERE tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update unsubscribes table to sync with email_subscriptions
CREATE OR REPLACE FUNCTION sync_unsubscribe_to_subscriptions()
RETURNS TRIGGER AS $$
BEGIN
  -- Update email_subscriptions when an unsubscribe is created
  UPDATE email_subscriptions
  SET 
    status = 'unsubscribed',
    unsubscribed_at = NEW.unsubscribed_at
  WHERE 
    tenant_id = NEW.tenant_id 
    AND email = NEW.email;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync unsubscribes
CREATE TRIGGER sync_unsubscribe_to_subscriptions_trigger
  AFTER INSERT ON unsubscribes
  FOR EACH ROW
  EXECUTE FUNCTION sync_unsubscribe_to_subscriptions();