-- Fix invoice tax calculation to apply tax on discounted amount, not full subtotal
-- The tax should be calculated as: (subtotal - discount) * (tax_rate / 100)

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS update_invoice_totals_on_item_change ON invoice_items;

-- Update the function to calculate tax correctly
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
      -- Fix: Calculate tax on discounted amount, not full subtotal
      tax_amount = (subtotal - discount_amount) * (tax_rate / 100),
      total_amount = (subtotal - discount_amount) + ((subtotal - discount_amount) * (tax_rate / 100)),
      updated_at = NOW()
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER update_invoice_totals_on_item_change
AFTER INSERT OR UPDATE OR DELETE ON invoice_items
FOR EACH ROW
EXECUTE FUNCTION update_invoice_totals();

-- Also create a trigger for when discount_amount or tax_rate changes on the invoice itself
CREATE OR REPLACE FUNCTION update_invoice_totals_on_invoice_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only recalculate if discount_amount or tax_rate changed
  IF NEW.discount_amount IS DISTINCT FROM OLD.discount_amount OR 
     NEW.tax_rate IS DISTINCT FROM OLD.tax_rate THEN
    -- Recalculate tax and total based on current subtotal
    NEW.tax_amount := (NEW.subtotal - NEW.discount_amount) * (NEW.tax_rate / 100);
    NEW.total_amount := (NEW.subtotal - NEW.discount_amount) + NEW.tax_amount;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for invoice updates
DROP TRIGGER IF EXISTS update_invoice_totals_on_invoice_update ON invoices;
CREATE TRIGGER update_invoice_totals_on_invoice_update
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_invoice_totals_on_invoice_change();

-- Fix existing invoices with incorrect calculations
UPDATE invoices
SET 
  tax_amount = (subtotal - discount_amount) * (tax_rate / 100),
  total_amount = (subtotal - discount_amount) + ((subtotal - discount_amount) * (tax_rate / 100)),
  updated_at = NOW()
WHERE discount_amount > 0; -- Only update invoices that have discounts

-- Log the number of invoices updated
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % invoices with corrected tax calculations', updated_count;
END $$;