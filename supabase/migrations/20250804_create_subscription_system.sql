-- Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL, -- Price in cents to avoid floating point issues
  currency TEXT NOT NULL DEFAULT 'EUR',
  billing_interval TEXT NOT NULL CHECK (billing_interval IN ('monthly', 'yearly')),
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'trial', 'past_due', 'unpaid')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  trial_end TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  mollie_subscription_id TEXT, -- For future Mollie integration
  mollie_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(tenant_id) -- One subscription per tenant
);

-- Create subscription payments table (for tracking payment history)
CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  mollie_payment_id TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price_cents, billing_interval, features) VALUES
  (
    'Starter',
    'Perfect voor kleinere salons',
    2999, -- €29.99
    'monthly',
    '{
      "max_staff": 3,
      "max_clients": 100,
      "max_services": 20,
      "booking_system": true,
      "basic_reporting": true,
      "email_notifications": true,
      "support": "email"
    }'::jsonb
  ),
  (
    'Professional',
    'Ideaal voor groeiende salons',
    4999, -- €49.99
    'monthly',
    '{
      "max_staff": 10,
      "max_clients": 500,
      "max_services": 50,
      "booking_system": true,
      "advanced_reporting": true,
      "email_notifications": true,
      "sms_notifications": true,
      "inventory_management": true,
      "marketing_tools": true,
      "support": "email"
    }'::jsonb
  ),
  (
    'Enterprise',
    'Voor grote salons en keten',
    9999, -- €99.99
    'monthly',
    '{
      "max_staff": -1,
      "max_clients": -1,
      "max_services": -1,
      "booking_system": true,
      "advanced_reporting": true,
      "custom_reports": true,
      "email_notifications": true,
      "sms_notifications": true,
      "inventory_management": true,
      "marketing_tools": true,
      "api_access": true,
      "custom_domain": true,
      "priority_support": true,
      "support": "phone"
    }'::jsonb
  );

-- Add RLS policies
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- Subscription plans are readable by everyone (public pricing)
CREATE POLICY "subscription_plans_select" ON subscription_plans FOR SELECT USING (is_active = true);

-- Subscriptions are only accessible by the tenant owner
CREATE POLICY "subscriptions_tenant_access" ON subscriptions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.tenant_id = subscriptions.tenant_id 
    AND users.id = auth.uid()
    AND users.role IN ('owner', 'admin')
  )
);

-- Subscription payments follow the same rule as subscriptions
CREATE POLICY "subscription_payments_tenant_access" ON subscription_payments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM subscriptions s
    JOIN users u ON u.tenant_id = s.tenant_id
    WHERE s.id = subscription_payments.subscription_id
    AND u.id = auth.uid()
    AND u.role IN ('owner', 'admin')
  )
);

-- Create indexes for performance
CREATE INDEX idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_current_period ON subscriptions(current_period_start, current_period_end);
CREATE INDEX idx_subscription_payments_subscription_id ON subscription_payments(subscription_id);
CREATE INDEX idx_subscription_payments_status ON subscription_payments(status);

-- Create function to check if tenant has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(tenant_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM subscriptions 
    WHERE tenant_id = tenant_uuid 
    AND status IN ('active', 'trial')
    AND current_period_end > NOW()
  );
END;
$$;

-- Create function to get subscription status for a tenant
CREATE OR REPLACE FUNCTION get_subscription_status(tenant_uuid UUID)
RETURNS TABLE (
  subscription_id UUID,
  plan_name TEXT,
  status TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  features JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    sp.name,
    s.status,
    s.current_period_start,
    s.current_period_end,
    s.trial_end,
    sp.features
  FROM subscriptions s
  JOIN subscription_plans sp ON s.plan_id = sp.id
  WHERE s.tenant_id = tenant_uuid;
END;
$$;

-- Add updated_at trigger for subscriptions
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();

CREATE TRIGGER subscription_payments_updated_at
  BEFORE UPDATE ON subscription_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();

-- Grant necessary permissions
GRANT SELECT ON subscription_plans TO authenticated;
GRANT ALL ON subscriptions TO authenticated;
GRANT ALL ON subscription_payments TO authenticated;