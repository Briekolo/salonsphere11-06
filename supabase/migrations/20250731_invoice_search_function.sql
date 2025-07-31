-- Create a function to search invoices by invoice number or client name
CREATE OR REPLACE FUNCTION search_invoices(
  p_tenant_id UUID,
  p_search_term TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  client_id UUID,
  booking_id UUID,
  invoice_number VARCHAR(50),
  issue_date DATE,
  due_date DATE,
  subtotal DECIMAL(10, 2),
  tax_rate DECIMAL(5, 2),
  tax_amount DECIMAL(10, 2),
  discount_amount DECIMAL(10, 2),
  total_amount DECIMAL(10, 2),
  paid_amount DECIMAL(10, 2),
  status invoice_status,
  notes TEXT,
  internal_notes TEXT,
  payment_terms TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  client_first_name VARCHAR(100),
  client_last_name VARCHAR(100),
  client_email VARCHAR(255)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.tenant_id,
    i.client_id,
    i.booking_id,
    i.invoice_number,
    i.issue_date,
    i.due_date,
    i.subtotal,
    i.tax_rate,
    i.tax_amount,
    i.discount_amount,
    i.total_amount,
    i.paid_amount,
    i.status,
    i.notes,
    i.internal_notes,
    i.payment_terms,
    i.sent_at,
    i.viewed_at,
    i.cancelled_at,
    i.created_at,
    i.updated_at,
    c.first_name as client_first_name,
    c.last_name as client_last_name,
    c.email as client_email
  FROM invoices i
  LEFT JOIN clients c ON i.client_id = c.id
  WHERE i.tenant_id = p_tenant_id
    AND (
      p_search_term IS NULL 
      OR i.invoice_number ILIKE '%' || p_search_term || '%'
      OR c.first_name ILIKE '%' || p_search_term || '%'
      OR c.last_name ILIKE '%' || p_search_term || '%'
      OR CONCAT(c.first_name, ' ', c.last_name) ILIKE '%' || p_search_term || '%'
    )
  ORDER BY i.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_invoices TO authenticated;