-- Create staff_services table for staff-treatment assignments
CREATE TABLE staff_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES users(id) NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  proficiency_level VARCHAR(50) DEFAULT 'standard' CHECK (proficiency_level IN ('junior', 'standard', 'senior', 'expert')),
  custom_duration_minutes INTEGER,
  custom_price DECIMAL(10,2),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(staff_id, service_id)
);

-- Create staff_certifications table
CREATE TABLE staff_certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES users(id) NOT NULL,
  certification_name VARCHAR(255) NOT NULL,
  issuer VARCHAR(255),
  issue_date DATE,
  expiry_date DATE,
  document_url TEXT,
  verified BOOLEAN DEFAULT false,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE staff_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_certifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff_services
CREATE POLICY "staff_services_tenant_isolation" ON staff_services
  FOR ALL USING (tenant_id = auth.jwt()->>'tenant_id'::uuid);

-- RLS Policies for staff_certifications
CREATE POLICY "staff_certifications_tenant_isolation" ON staff_certifications
  FOR ALL USING (tenant_id = auth.jwt()->>'tenant_id'::uuid);

-- Create indexes for performance
CREATE INDEX idx_staff_services_staff_id ON staff_services(staff_id);
CREATE INDEX idx_staff_services_service_id ON staff_services(service_id);
CREATE INDEX idx_staff_services_tenant_id ON staff_services(tenant_id);
CREATE INDEX idx_staff_certifications_staff_id ON staff_certifications(staff_id);
CREATE INDEX idx_staff_certifications_tenant_id ON staff_certifications(tenant_id);

-- Grant permissions
GRANT ALL ON staff_services TO authenticated;
GRANT ALL ON staff_services TO service_role;
GRANT ALL ON staff_certifications TO authenticated;
GRANT ALL ON staff_certifications TO service_role;

-- Create triggers for updated_at
CREATE TRIGGER update_staff_services_updated_at BEFORE UPDATE
  ON staff_services FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_staff_certifications_updated_at BEFORE UPDATE
  ON staff_certifications FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create function to get available staff for a service
CREATE OR REPLACE FUNCTION get_available_staff_for_service(
  p_service_id UUID,
  p_tenant_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_duration_minutes INTEGER
)
RETURNS TABLE (
  staff_id UUID,
  staff_name TEXT,
  proficiency_level VARCHAR(50),
  custom_duration_minutes INTEGER,
  custom_price DECIMAL(10,2),
  is_available BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as staff_id,
    u.first_name || ' ' || u.last_name as staff_name,
    ss.proficiency_level,
    ss.custom_duration_minutes,
    ss.custom_price,
    NOT EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.staff_id = u.id
        AND b.booking_date = p_date
        AND b.status NOT IN ('cancelled', 'no-show')
        AND (
          (b.start_time, b.start_time + (b.duration_minutes || ' minutes')::interval) 
          OVERLAPS 
          (p_start_time, p_start_time + (p_duration_minutes || ' minutes')::interval)
        )
    ) as is_available
  FROM users u
  INNER JOIN staff_services ss ON u.id = ss.staff_id
  WHERE ss.service_id = p_service_id
    AND ss.tenant_id = p_tenant_id
    AND ss.active = true
    AND u.active = true
    AND u.role = 'staff';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on function
GRANT EXECUTE ON FUNCTION get_available_staff_for_service TO authenticated;