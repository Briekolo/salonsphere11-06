-- Add integrations table for managing external service connections
CREATE TABLE IF NOT EXISTS integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Integration details
    integration_type VARCHAR(50) NOT NULL, -- 'google_calendar', 'mollie', etc.
    name VARCHAR(100) NOT NULL,
    
    -- Connection status
    is_connected BOOLEAN DEFAULT FALSE,
    connected_at TIMESTAMP WITH TIME ZONE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    
    -- OAuth tokens (encrypted)
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Integration-specific configuration
    settings JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one integration per type per tenant
    UNIQUE(tenant_id, integration_type)
);

-- Add RLS policies
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Tenants can only access their own integrations
CREATE POLICY "Users can manage their own integrations"
    ON integrations FOR ALL
    USING (tenant_id = auth.uid());

-- Add indexes for performance
CREATE INDEX idx_integrations_tenant_id ON integrations(tenant_id);
CREATE INDEX idx_integrations_type ON integrations(tenant_id, integration_type);
CREATE INDEX idx_integrations_connected ON integrations(tenant_id, is_connected);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_integrations_updated_at
    BEFORE UPDATE ON integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();