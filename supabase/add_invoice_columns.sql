-- Add missing columns to invoices table
-- Run this in Supabase SQL Editor

-- Add discount_amount if it doesn't exist
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

-- Add tax_rate if it doesn't exist
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS tax_rate NUMERIC DEFAULT 0;

-- Comments
COMMENT ON COLUMN invoices.discount_amount IS 'Discount amount applied to invoice';
COMMENT ON COLUMN invoices.tax_rate IS 'Tax rate percentage';
