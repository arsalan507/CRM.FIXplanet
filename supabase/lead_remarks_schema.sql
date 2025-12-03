-- Lead Remarks & Updates Schema
-- This table tracks all remarks/comments and status updates made by agents on leads

-- ============================================
-- LEAD REMARKS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS lead_remarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE SET NULL,
  remark TEXT NOT NULL,
  status_changed_to TEXT, -- Order, Not Interested, Follow Up
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_lead_remarks_lead_id ON lead_remarks(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_remarks_staff_id ON lead_remarks(staff_id);
CREATE INDEX IF NOT EXISTS idx_lead_remarks_created_at ON lead_remarks(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE lead_remarks ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view lead remarks
CREATE POLICY "Authenticated users can view lead remarks"
  ON lead_remarks FOR SELECT
  TO authenticated
  USING (true);

-- All authenticated users can insert lead remarks
CREATE POLICY "Authenticated users can insert lead remarks"
  ON lead_remarks FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can update their own remarks
CREATE POLICY "Users can update their own remarks"
  ON lead_remarks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.auth_user_id = auth.uid()
      AND s.id = staff_id
    )
  );

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE lead_remarks IS 'Tracks all remarks and status updates made by agents on leads';
COMMENT ON COLUMN lead_remarks.status_changed_to IS 'New status if the lead status was updated: Order, Not Interested, Follow Up';
