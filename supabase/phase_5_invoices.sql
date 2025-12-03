-- Phase 5: Invoice & Payment Management Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. REPAIRS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS repairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  device_type TEXT NOT NULL,
  device_model TEXT NOT NULL,
  issue TEXT NOT NULL,
  diagnosis TEXT,
  repair_notes TEXT,
  parts_used JSONB DEFAULT '[]', -- [{ part: "Screen", cost: 5000, quantity: 1 }]
  labor_cost NUMERIC(10,2) DEFAULT 0,
  parts_cost NUMERIC(10,2) DEFAULT 0,
  total_cost NUMERIC(10,2) GENERATED ALWAYS AS (labor_cost + parts_cost) STORED,
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  technician_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. INVOICES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL, -- FP-2025-001
  repair_id UUID REFERENCES repairs(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT,

  -- Line Items
  items JSONB NOT NULL DEFAULT '[]', -- [{ description, quantity, rate, amount }]

  -- Calculations
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 18.00, -- GST 18%
  tax_amount NUMERIC(10,2) DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- Payment
  payment_status TEXT DEFAULT 'pending', -- pending, partial, paid
  amount_paid NUMERIC(10,2) DEFAULT 0,
  amount_due NUMERIC(10,2),

  -- Metadata
  notes TEXT,
  terms_conditions TEXT DEFAULT 'Payment due within 7 days. All sales are final.',
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  pdf_url TEXT, -- Supabase Storage URL
  sent_at TIMESTAMPTZ, -- When SMS was sent
  created_by UUID REFERENCES staff(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. PAYMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL, -- cash, upi, card, bank_transfer
  transaction_id TEXT,
  payment_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  received_by UUID REFERENCES staff(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. PARTS INVENTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS parts_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_name TEXT NOT NULL,
  device_type TEXT, -- iPhone, iPad, MacBook, Apple Watch
  compatible_models TEXT[], -- ["iPhone 13", "iPhone 13 Pro"]
  category TEXT, -- Screen, Battery, Charging Port, etc.
  cost_price NUMERIC(10,2) NOT NULL,
  selling_price NUMERIC(10,2) NOT NULL,
  quantity_in_stock INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 5,
  supplier TEXT,
  supplier_contact TEXT,
  last_restocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_repairs_customer_id ON repairs(customer_id);
CREATE INDEX IF NOT EXISTS idx_repairs_lead_id ON repairs(lead_id);
CREATE INDEX IF NOT EXISTS idx_repairs_status ON repairs(status);
CREATE INDEX IF NOT EXISTS idx_repairs_created_at ON repairs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date DESC);

CREATE INDEX IF NOT EXISTS idx_parts_device_type ON parts_inventory(device_type);
CREATE INDEX IF NOT EXISTS idx_parts_category ON parts_inventory(category);
CREATE INDEX IF NOT EXISTS idx_parts_stock_level ON parts_inventory(quantity_in_stock);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_inventory ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view repairs
CREATE POLICY "Authenticated users can view repairs"
  ON repairs FOR SELECT
  TO authenticated
  USING (true);

-- All authenticated users can insert repairs
CREATE POLICY "Authenticated users can insert repairs"
  ON repairs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- All authenticated users can update repairs
CREATE POLICY "Authenticated users can update repairs"
  ON repairs FOR UPDATE
  TO authenticated
  USING (true);

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

-- All authenticated users can view payments
CREATE POLICY "Authenticated users can view payments"
  ON payments FOR SELECT
  TO authenticated
  USING (true);

-- All authenticated users can insert payments
CREATE POLICY "Authenticated users can insert payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- All authenticated users can view parts inventory
CREATE POLICY "Authenticated users can view parts"
  ON parts_inventory FOR SELECT
  TO authenticated
  USING (true);

-- Managers and super_admins can manage parts inventory
CREATE POLICY "Managers can manage parts"
  ON parts_inventory FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.auth_user_id = auth.uid()
      AND s.role IN ('manager', 'super_admin')
    )
  );

-- ============================================
-- FUNCTIONS
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
    CAST(SUBSTRING(invoice_number FROM 'FP-\d{4}-\d{2}-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM invoices
  WHERE invoice_number LIKE 'FP-' || year || '-' || month || '-%';

  invoice_num := 'FP-' || year || '-' || month || '-' || LPAD(next_num::TEXT, 4, '0');

  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Function to update invoice payment status
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate amount_due
  NEW.amount_due := NEW.total_amount - NEW.amount_paid;

  -- Update payment_status
  IF NEW.amount_paid >= NEW.total_amount THEN
    NEW.payment_status := 'paid';
  ELSIF NEW.amount_paid > 0 THEN
    NEW.payment_status := 'partial';
  ELSE
    NEW.payment_status := 'pending';
  END IF;

  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update payment status
CREATE TRIGGER trigger_update_invoice_payment_status
  BEFORE INSERT OR UPDATE OF amount_paid, total_amount
  ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_payment_status();

-- Function to get revenue metrics
CREATE OR REPLACE FUNCTION get_revenue_metrics(days_back INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalRevenue', (
      SELECT COALESCE(SUM(amount_paid), 0)
      FROM invoices
      WHERE created_at > NOW() - (days_back || ' days')::INTERVAL
    ),
    'pendingAmount', (
      SELECT COALESCE(SUM(amount_due), 0)
      FROM invoices
      WHERE payment_status IN ('pending', 'partial')
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
      WHERE payment_status IN ('pending', 'partial')
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

-- Function to get low stock items
CREATE OR REPLACE FUNCTION get_low_stock_items()
RETURNS TABLE (
  id UUID,
  part_name TEXT,
  device_type TEXT,
  quantity_in_stock INTEGER,
  min_stock_level INTEGER,
  selling_price NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.part_name,
    p.device_type,
    p.quantity_in_stock,
    p.min_stock_level,
    p.selling_price
  FROM parts_inventory p
  WHERE p.quantity_in_stock <= p.min_stock_level
  ORDER BY p.quantity_in_stock ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE repairs IS 'Tracks repair jobs from quote to completion';
COMMENT ON TABLE invoices IS 'Stores invoice details and payment tracking';
COMMENT ON TABLE payments IS 'Records all payment transactions for invoices';
COMMENT ON TABLE parts_inventory IS 'Manages spare parts stock and pricing';

COMMENT ON COLUMN invoices.invoice_number IS 'Unique invoice identifier (FP-YYYY-MM-####)';
COMMENT ON COLUMN invoices.items IS 'Array of line items with description, quantity, rate, amount';
COMMENT ON COLUMN invoices.payment_status IS 'Auto-updated based on amount_paid vs total_amount';
COMMENT ON COLUMN invoices.sent_at IS 'Timestamp when invoice SMS was sent to customer';

COMMENT ON COLUMN parts_inventory.compatible_models IS 'Array of device models this part fits';
COMMENT ON COLUMN parts_inventory.min_stock_level IS 'Reorder point - alert when stock falls below this';
