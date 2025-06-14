/*
  # Initial Database Schema for SalonSphere

  1. New Tables
    - `tenants` - Salon accounts with subscription tiers
    - `users` - User authentication and profiles linked to tenants
    - `clients` - Customer information with marketing consent
    - `services` - Treatment catalog with pricing and margins
    - `inventory_items` - Product inventory with stock management
    - `supplier_pos` - Purchase orders from suppliers
    - `bookings` - Appointment scheduling system
    - `payments` - Payment processing and tracking
    - `pricing_presets` - Saved pricing configurations per tenant
    - `email_reminders` - Automated email reminder system

  2. Security
    - Enable RLS on all tables
    - Add policies for tenant-based data isolation
    - Ensure users can only access their tenant's data
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenants table (salon accounts)
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  address text,
  subscription_tier text NOT NULL DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'growth', 'pro')),
  subscription_status text NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'suspended')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Users table (authentication and profiles)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff', 'client')),
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  avatar_url text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Clients table (customer information)
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  date_of_birth date,
  address text,
  marketing_consent boolean DEFAULT false,
  notes text,
  tags text[] DEFAULT '{}',
  total_spent decimal(10,2) DEFAULT 0,
  last_visit_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, email)
);

-- Services table (treatment catalog)
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  price decimal(10,2) NOT NULL,
  material_cost decimal(10,2) DEFAULT 0,
  active boolean DEFAULT true,
  image_url text,
  preparation_info text,
  aftercare_info text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inventory items table (product management)
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  sku text,
  category text NOT NULL,
  current_stock integer NOT NULL DEFAULT 0,
  min_stock integer NOT NULL DEFAULT 0,
  max_stock integer NOT NULL DEFAULT 100,
  unit text NOT NULL DEFAULT 'stuks',
  cost_per_unit decimal(10,2) NOT NULL,
  supplier text,
  location text,
  barcode text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, sku)
);

-- Supplier purchase orders table
CREATE TABLE IF NOT EXISTS supplier_pos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  supplier_name text NOT NULL,
  order_number text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  order_date timestamptz DEFAULT now(),
  expected_delivery_date timestamptz,
  actual_delivery_date timestamptz,
  total_amount decimal(10,2) NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, order_number)
);

-- Purchase order items (line items for supplier_pos)
CREATE TABLE IF NOT EXISTS supplier_po_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_id uuid NOT NULL REFERENCES supplier_pos(id) ON DELETE CASCADE,
  inventory_item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  unit_cost decimal(10,2) NOT NULL,
  total_cost decimal(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  created_at timestamptz DEFAULT now()
);

-- Bookings table (appointment scheduling)
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES users(id) ON DELETE SET NULL,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes text,
  internal_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payments table (payment processing)
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('card', 'sepa', 'cash', 'bank_transfer')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id text,
  payment_date timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pricing presets table (saved configurations)
CREATE TABLE IF NOT EXISTS pricing_presets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  labor_rate_per_hour decimal(10,2) NOT NULL,
  overhead_percentage decimal(5,2) NOT NULL DEFAULT 25.00,
  target_margin_percentage decimal(5,2) NOT NULL DEFAULT 75.00,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, name)
);

-- Email reminders table (automated communications)
CREATE TABLE IF NOT EXISTS email_reminders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  reminder_type text NOT NULL CHECK (reminder_type IN ('confirmation', 'reminder_24h', 'reminder_2h', 'follow_up', 'birthday')),
  scheduled_at timestamptz NOT NULL,
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'failed', 'cancelled')),
  email_subject text NOT NULL,
  email_body text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_pos ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_po_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_reminders ENABLE ROW LEVEL SECURITY;

-- Helper function to get tenant_id from the user's claims
CREATE OR REPLACE FUNCTION public.tenant_id()
RETURNS UUID AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id', '')::uuid;
$$ LANGUAGE SQL STABLE;

-- Create policies for tenant-based data isolation

-- Tenants policies
DROP POLICY IF EXISTS "Users can read their own tenant" ON tenants;
CREATE POLICY "Users can read their own tenant"
  ON tenants FOR SELECT
  TO authenticated
  USING (id = public.tenant_id());

-- Users policies
DROP POLICY IF EXISTS "Users can read users in their tenant" ON users;
CREATE POLICY "Users can read users in their tenant"
  ON users FOR SELECT
  TO authenticated
  USING (tenant_id = public.tenant_id());

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Clients policies
DROP POLICY IF EXISTS "Users can manage clients in their tenant" ON clients;
CREATE POLICY "Users can manage clients in their tenant"
  ON clients FOR ALL
  TO authenticated
  USING (tenant_id = public.tenant_id())
  WITH CHECK (tenant_id = public.tenant_id());

-- Services policies
DROP POLICY IF EXISTS "Users can manage services in their tenant" ON services;
CREATE POLICY "Users can manage services in their tenant"
  ON services FOR ALL
  TO authenticated
  USING (tenant_id = public.tenant_id())
  WITH CHECK (tenant_id = public.tenant_id());

-- Inventory items policies
DROP POLICY IF EXISTS "Users can manage inventory in their tenant" ON inventory_items;
CREATE POLICY "Users can manage inventory in their tenant"
  ON inventory_items FOR ALL
  TO authenticated
  USING (tenant_id = public.tenant_id())
  WITH CHECK (tenant_id = public.tenant_id());

-- Supplier POs policies
DROP POLICY IF EXISTS "Users can manage purchase orders in their tenant" ON supplier_pos;
CREATE POLICY "Users can manage purchase orders in their tenant"
  ON supplier_pos FOR ALL
  TO authenticated
  USING (tenant_id = public.tenant_id())
  WITH CHECK (tenant_id = public.tenant_id());

-- Supplier PO items policies
DROP POLICY IF EXISTS "Users can manage PO items in their tenant" ON supplier_po_items;
CREATE POLICY "Users can manage PO items in their tenant"
  ON supplier_po_items FOR ALL
  TO authenticated
  USING (po_id IN (SELECT id FROM supplier_pos WHERE tenant_id = public.tenant_id()));

-- Bookings policies
DROP POLICY IF EXISTS "Users can manage bookings in their tenant" ON bookings;
CREATE POLICY "Users can manage bookings in their tenant"
  ON bookings FOR ALL
  TO authenticated
  USING (tenant_id = public.tenant_id())
  WITH CHECK (tenant_id = public.tenant_id());

-- Payments policies
DROP POLICY IF EXISTS "Users can manage payments in their tenant" ON payments;
CREATE POLICY "Users can manage payments in their tenant"
  ON payments FOR ALL
  TO authenticated
  USING (tenant_id = public.tenant_id())
  WITH CHECK (tenant_id = public.tenant_id());

-- Pricing presets policies
DROP POLICY IF EXISTS "Users can manage pricing presets in their tenant" ON pricing_presets;
CREATE POLICY "Users can manage pricing presets in their tenant"
  ON pricing_presets FOR ALL
  TO authenticated
  USING (tenant_id = public.tenant_id())
  WITH CHECK (tenant_id = public.tenant_id());

-- Email reminders policies
DROP POLICY IF EXISTS "Users can manage email reminders in their tenant" ON email_reminders;
CREATE POLICY "Users can manage email reminders in their tenant"
  ON email_reminders FOR ALL
  TO authenticated
  USING (tenant_id = public.tenant_id())
  WITH CHECK (tenant_id = public.tenant_id());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_services_tenant_id ON services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(tenant_id, active);
CREATE INDEX IF NOT EXISTS idx_inventory_tenant_id ON inventory_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory_items(tenant_id, sku);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_id ON bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_at ON bookings(tenant_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_email_reminders_scheduled_at ON email_reminders(scheduled_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supplier_pos_updated_at BEFORE UPDATE ON supplier_pos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pricing_presets_updated_at BEFORE UPDATE ON pricing_presets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_reminders_updated_at BEFORE UPDATE ON email_reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();