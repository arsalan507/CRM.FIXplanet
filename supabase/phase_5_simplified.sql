-- Phase 5 SIMPLIFIED: Linear Lead-to-Invoice Workflow
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. ADD ACCEPTANCE/REJECTION COLUMNS TO LEADS
-- ============================================

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS acceptance_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS rejection_remarks TEXT,
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS invoice_id UUID;

-- Create index for acceptance_status filtering
CREATE INDEX IF NOT EXISTS idx_leads_acceptance_status ON leads(acceptance_status);

-- ============================================
-- 2. CREATE SIMPLIFIED INVOICES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL, -- FP-2025-001
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- Customer Info (snapshot)
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,

  -- Device Info (snapshot)
  device_type TEXT NOT NULL,
  device_model TEXT NOT NULL,
  issue TEXT NOT NULL,

  -- Pricing (Simple)
  parts_cost NUMERIC(10,2) DEFAULT 0,
  labor_cost NUMERIC(10,2) DEFAULT 0,
  other_charges NUMERIC(10,2) DEFAULT 0,
  subtotal NUMERIC(10,2) NOT NULL,
  gst_included BOOLEAN DEFAULT true,
  gst_amount NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,

  -- Payment
  payment_method TEXT, -- cash, upi, card, bank_transfer
  payment_status TEXT DEFAULT 'pending', -- pending, paid
  paid_at TIMESTAMPTZ,

  -- PDF
  pdf_url TEXT,

  -- Metadata
  invoice_date DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES staff(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for invoice_id in leads
ALTER TABLE leads
ADD CONSTRAINT fk_leads_invoice
FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;

-- ============================================
-- 3. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_invoices_lead_id ON invoices(lead_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);

-- ============================================
-- 4. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view invoices
CREATE POLICY "Authenticated users can view invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (true);

-- All authenticated users can insert invoices
CREATE POLICY "Authenticated users can insert invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- All authenticated users can update invoices
CREATE POLICY "Authenticated users can update invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (true);

-- Only super_admins can delete invoices
CREATE POLICY "Super admins can delete invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.auth_user_id = auth.uid()
      AND s.role = 'super_admin'
    )
  );

-- ============================================
-- 5. FUNCTIONS
-- ============================================

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  month TEXT;
  next_num INTEGER;
  invoice_num TEXT;
BEGIN
  year := TO_CHAR(CURRENT_DATE, 'YYYY');
  month := TO_CHAR(CURRENT_DATE, 'MM');

  -- Get the next number for this month
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(invoice_number FROM 'FP-\\d{4}-\\d{2}-(\\d+)') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM invoices
  WHERE invoice_number LIKE 'FP-' || year || '-' || month || '-%';

  invoice_num := 'FP-' || year || '-' || month || '-' || LPAD(next_num::TEXT, 4, '0');

  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Function to get revenue metrics
CREATE OR REPLACE FUNCTION get_revenue_metrics(days_back INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalRevenue', (
      SELECT COALESCE(SUM(total_amount), 0)
      FROM invoices
      WHERE payment_status = 'paid'
      AND created_at > NOW() - (days_back || ' days')::INTERVAL
    ),
    'pendingAmount', (
      SELECT COALESCE(SUM(total_amount), 0)
      FROM invoices
      WHERE payment_status = 'pending'
    ),
    'paidInvoices', (
      SELECT COUNT(*)
      FROM invoices
      WHERE payment_status = 'paid'
      AND created_at > NOW() - (days_back || ' days')::INTERVAL
    ),
    'pendingInvoices', (
      SELECT COUNT(*)
      FROM invoices
      WHERE payment_status = 'pending'
    ),
    'avgInvoiceValue', (
      SELECT ROUND(AVG(total_amount), 2)
      FROM invoices
      WHERE created_at > NOW() - (days_back || ' days')::INTERVAL
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending acceptance count
CREATE OR REPLACE FUNCTION get_pending_acceptance_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM leads
    WHERE acceptance_status = 'pending'
    AND status NOT IN ('lost', 'rejected')
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. TRIGGERS
-- ============================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. COMMENTS
-- ============================================

COMMENT ON TABLE invoices IS 'Simplified invoice table for linear lead-to-invoice workflow';
COMMENT ON COLUMN leads.acceptance_status IS 'Telecaller decision: pending, accepted, rejected';
COMMENT ON COLUMN leads.rejection_reason IS 'Reason for rejecting the lead';
COMMENT ON COLUMN leads.invoice_id IS 'Link to generated invoice when lead is won';
COMMENT ON COLUMN invoices.invoice_number IS 'Unique invoice identifier (FP-YYYY-MM-####)';
COMMENT ON COLUMN invoices.gst_included IS 'Whether GST (18%) is included in total';
