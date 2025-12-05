-- Performance indexes for faster dashboard queries
-- Run this in Supabase SQL Editor to improve performance

-- Leads table indexes
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_workflow_status ON leads(workflow_status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_device_type ON leads(device_type);
CREATE INDEX IF NOT EXISTS idx_leads_lead_source ON leads(lead_source);
CREATE INDEX IF NOT EXISTS idx_leads_updated_at ON leads(updated_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_leads_status_created ON leads(workflow_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_created ON leads(assigned_to, created_at DESC);

-- Lead remarks indexes
CREATE INDEX IF NOT EXISTS idx_lead_remarks_lead_id ON lead_remarks(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_remarks_created_at ON lead_remarks(created_at DESC);

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_lead_id ON invoices(lead_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);

-- Staff indexes
CREATE INDEX IF NOT EXISTS idx_staff_auth_user_id ON staff(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_staff_is_active ON staff(is_active);

-- Analyze tables to update statistics
ANALYZE leads;
ANALYZE lead_remarks;
ANALYZE invoices;
ANALYZE staff;

-- Comments
COMMENT ON INDEX idx_leads_created_at IS 'Improves dashboard date-based queries';
COMMENT ON INDEX idx_leads_workflow_status IS 'Speeds up status filtering';
COMMENT ON INDEX idx_leads_assigned_to IS 'Optimizes team performance queries';
