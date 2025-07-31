-- Remove all invoice-related functionality from the database

-- Step 1: Drop all triggers first
DROP TRIGGER IF EXISTS update_invoice_payment_status_on_payment_change ON invoice_payments;
DROP TRIGGER IF EXISTS create_invoice_on_payment_trigger ON bookings;
DROP TRIGGER IF EXISTS update_invoice_totals_on_item_change ON invoice_items;
DROP TRIGGER IF EXISTS update_invoice_totals_on_invoice_update ON invoices;

-- Step 2: Drop all functions
DROP FUNCTION IF EXISTS update_invoice_payment_status() CASCADE;
DROP FUNCTION IF EXISTS mark_overdue_invoices() CASCADE;
DROP FUNCTION IF EXISTS generate_invoice_number(UUID) CASCADE;
DROP FUNCTION IF EXISTS create_invoice_on_payment_confirmed() CASCADE;
DROP FUNCTION IF EXISTS update_invoice_totals() CASCADE;
DROP FUNCTION IF EXISTS update_invoice_totals_on_invoice_change() CASCADE;
DROP FUNCTION IF EXISTS search_invoices(UUID, TEXT, INT, INT) CASCADE;

-- Step 3: Drop foreign key constraints that reference invoices
ALTER TABLE IF EXISTS invoice_items DROP CONSTRAINT IF EXISTS invoice_items_invoice_id_fkey;
ALTER TABLE IF EXISTS invoice_payments DROP CONSTRAINT IF EXISTS invoice_payments_invoice_id_fkey;

-- Step 4: Drop tables in correct order (dependent tables first)
DROP TABLE IF EXISTS invoice_payments CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoice_sequences CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;

-- Step 5: Drop invoice-related types
DROP TYPE IF EXISTS invoice_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;

-- Step 6: Remove any invoice references from bookings (if they exist)
-- Note: Based on our check, bookings table doesn't have invoice columns

-- Step 7: Clean up any policies that might reference invoice tables
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Find and drop all policies on invoice-related tables
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename LIKE '%invoice%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            policy_record.policyname, 
            policy_record.schemaname, 
            policy_record.tablename);
    END LOOP;
END $$;