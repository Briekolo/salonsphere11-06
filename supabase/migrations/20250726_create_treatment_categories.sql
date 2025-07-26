-- Create treatment_categories table
CREATE TABLE treatment_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  color VARCHAR(7) DEFAULT '#6366f1', -- Hex color for UI display
  icon VARCHAR(50), -- Icon name for UI display
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- Enable RLS
ALTER TABLE treatment_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for treatment_categories
CREATE POLICY "treatment_categories_tenant_isolation" ON treatment_categories
  FOR ALL USING (tenant_id = auth.jwt()->>'tenant_id'::uuid);

-- Add category_id to services table
ALTER TABLE services ADD COLUMN category_id UUID REFERENCES treatment_categories(id);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_treatment_categories_updated_at BEFORE UPDATE
  ON treatment_categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Migrate existing category data to new table
INSERT INTO treatment_categories (tenant_id, name, display_order, active)
SELECT DISTINCT 
  s.tenant_id,
  s.category,
  CASE 
    WHEN s.category = 'Nagelverzorging' THEN 1
    WHEN s.category = 'Gezichtsbehandelingen' THEN 2
    WHEN s.category = 'Massage' THEN 3
    WHEN s.category = 'Ontharing' THEN 4
    WHEN s.category = 'Lichaamsbehandelingen' THEN 5
    ELSE 99
  END as display_order,
  true
FROM services s
WHERE s.category IS NOT NULL AND s.category != ''
ON CONFLICT (tenant_id, name) DO NOTHING;

-- Update services to use new category_id
UPDATE services s
SET category_id = tc.id
FROM treatment_categories tc
WHERE s.tenant_id = tc.tenant_id
  AND s.category = tc.name;

-- Create index for performance
CREATE INDEX idx_treatment_categories_tenant_id ON treatment_categories(tenant_id);
CREATE INDEX idx_treatment_categories_display_order ON treatment_categories(display_order);
CREATE INDEX idx_services_category_id ON services(category_id);

-- Grant permissions
GRANT ALL ON treatment_categories TO authenticated;
GRANT ALL ON treatment_categories TO service_role;

-- Add default categories for new tenants
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default categories for new tenant
  INSERT INTO treatment_categories (tenant_id, name, display_order, color, icon) VALUES
    (NEW.id, 'Nagelverzorging', 1, '#ec4899', 'hand'),
    (NEW.id, 'Gezichtsbehandelingen', 2, '#8b5cf6', 'face'),
    (NEW.id, 'Massage', 3, '#3b82f6', 'massage'),
    (NEW.id, 'Ontharing', 4, '#f59e0b', 'hair'),
    (NEW.id, 'Lichaamsbehandelingen', 5, '#10b981', 'body');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to add default categories for new tenants
CREATE TRIGGER create_default_categories_trigger
  AFTER INSERT ON tenants
  FOR EACH ROW
  EXECUTE PROCEDURE create_default_categories();