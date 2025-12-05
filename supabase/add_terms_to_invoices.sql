-- Add terms_conditions column to invoices table
-- Run this in Supabase SQL Editor

ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS terms_conditions TEXT;

COMMENT ON COLUMN invoices.terms_conditions IS 'Terms and conditions for the invoice';
