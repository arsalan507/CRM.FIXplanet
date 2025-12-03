-- Add workflow_status column to leads table
-- This column tracks the lead workflow: new, Order, Not Interested, Follow Up

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS workflow_status TEXT DEFAULT 'new';

-- Add comment
COMMENT ON COLUMN leads.workflow_status IS 'Lead workflow status: new, Order, Not Interested, Follow Up';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_workflow_status ON leads(workflow_status);

-- Set existing leads to 'new' status
UPDATE leads
SET workflow_status = 'new'
WHERE workflow_status IS NULL;
