-- Add payment_method column to invoices table
ALTER TABLE invoices
ADD COLUMN payment_method TEXT DEFAULT 'bank_transfer';

-- Add a constraint to ensure valid payment methods
ALTER TABLE invoices
ADD CONSTRAINT valid_payment_method 
CHECK (payment_method IN ('bank_transfer', 'cash', 'card', 'other'));