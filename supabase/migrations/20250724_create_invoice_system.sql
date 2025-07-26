-- Create invoice status enum
CREATE TYPE invoice_status AS ENUM (
  'draft',
  'sent',
  'viewed',
  'partially_paid',
  'paid',
  'overdue',
  'cancelled'
);

-- Create payment method enum
CREATE TYPE payment_method AS ENUM (
  'cash',
  'card',
  'bank_transfer',
  'ideal',
  'paypal',
  'other'
);

-- Create invoices table
CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  
  -- Invoice details
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  status invoice_status NOT NULL DEFAULT 'draft',
  
  -- Financial details
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 21.00, -- Dutch BTW
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Additional info
  notes TEXT,
  internal_notes TEXT,
  
  -- Metadata
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique invoice number per tenant
  CONSTRAINT unique_invoice_number_per_tenant UNIQUE (tenant_id, invoice_number)
);

-- Create invoice line items table
CREATE TABLE invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  
  -- Item details
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  
  -- Order
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE invoice_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference TEXT,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create invoice number sequence per tenant
CREATE TABLE invoice_sequences (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0,
  
  PRIMARY KEY (tenant_id, year)
);

-- Create indexes
CREATE INDEX idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_booking_id ON invoices(booking_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);

-- Add RLS policies
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_sequences ENABLE ROW LEVEL SECURITY;

-- Invoices policies
CREATE POLICY "Tenants can view their own invoices"
  ON invoices FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Tenants can create their own invoices"
  ON invoices FOR INSERT
  WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Tenants can update their own invoices"
  ON invoices FOR UPDATE
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

-- Invoice items policies
CREATE POLICY "View invoice items for own invoices"
  ON invoice_items FOR SELECT
  USING (invoice_id IN (
    SELECT id FROM invoices WHERE tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Create invoice items for own invoices"
  ON invoice_items FOR INSERT
  WITH CHECK (invoice_id IN (
    SELECT id FROM invoices WHERE tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Update invoice items for own invoices"
  ON invoice_items FOR UPDATE
  USING (invoice_id IN (
    SELECT id FROM invoices WHERE tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Delete invoice items for own invoices"
  ON invoice_items FOR DELETE
  USING (invoice_id IN (
    SELECT id FROM invoices WHERE tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  ));

-- Invoice payments policies
CREATE POLICY "View payments for own invoices"
  ON invoice_payments FOR SELECT
  USING (invoice_id IN (
    SELECT id FROM invoices WHERE tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Create payments for own invoices"
  ON invoice_payments FOR INSERT
  WITH CHECK (invoice_id IN (
    SELECT id FROM invoices WHERE tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  ));

-- Invoice sequences policies
CREATE POLICY "View own invoice sequences"
  ON invoice_sequences FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Manage own invoice sequences"
  ON invoice_sequences FOR ALL
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_year INTEGER;
  v_next_number INTEGER;
  v_prefix TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Get or create sequence
  INSERT INTO invoice_sequences (tenant_id, year, last_number)
  VALUES (p_tenant_id, v_year, 0)
  ON CONFLICT (tenant_id, year) DO NOTHING;
  
  -- Get next number
  UPDATE invoice_sequences
  SET last_number = last_number + 1
  WHERE tenant_id = p_tenant_id AND year = v_year
  RETURNING last_number INTO v_next_number;
  
  -- Format: INV-YYYY-NNNN
  RETURN FORMAT('INV-%s-%s', v_year, LPAD(v_next_number::TEXT, 4, '0'));
END;
$$ LANGUAGE plpgsql;

-- Function to update invoice totals
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    UPDATE invoices
    SET 
      subtotal = COALESCE((
        SELECT SUM(total_price) 
        FROM invoice_items 
        WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
      ), 0),
      tax_amount = subtotal * (tax_rate / 100),
      total_amount = subtotal + tax_amount - discount_amount,
      updated_at = NOW()
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update invoice totals when items change
CREATE TRIGGER update_invoice_totals_on_item_change
AFTER INSERT OR UPDATE OR DELETE ON invoice_items
FOR EACH ROW
EXECUTE FUNCTION update_invoice_totals();

-- Function to update invoice payment status
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  v_total_paid DECIMAL(10, 2);
  v_total_amount DECIMAL(10, 2);
  v_new_status invoice_status;
BEGIN
  -- Get total paid amount
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM invoice_payments
  WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Get invoice total
  SELECT total_amount INTO v_total_amount
  FROM invoices
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Determine new status
  IF v_total_paid >= v_total_amount THEN
    v_new_status := 'paid';
  ELSIF v_total_paid > 0 THEN
    v_new_status := 'partially_paid';
  ELSE
    -- Keep current status if no payments
    SELECT status INTO v_new_status
    FROM invoices
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  END IF;
  
  -- Update invoice
  UPDATE invoices
  SET 
    paid_amount = v_total_paid,
    status = v_new_status,
    paid_at = CASE WHEN v_new_status = 'paid' THEN NOW() ELSE paid_at END,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update payment status when payments change
CREATE TRIGGER update_invoice_payment_status_on_payment_change
AFTER INSERT OR UPDATE OR DELETE ON invoice_payments
FOR EACH ROW
EXECUTE FUNCTION update_invoice_payment_status();

-- Function to check and mark overdue invoices
CREATE OR REPLACE FUNCTION mark_overdue_invoices()
RETURNS void AS $$
BEGIN
  UPDATE invoices
  SET status = 'overdue'
  WHERE status IN ('sent', 'viewed', 'partially_paid')
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;