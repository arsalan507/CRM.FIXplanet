-- Add follow_up_date field to leads table
-- This allows agents to set when they need to follow up with a lead

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS follow_up_date DATE;

-- Add comment
COMMENT ON COLUMN leads.follow_up_date IS 'Date when the lead should be followed up';

-- Create index for better query performance on follow-up page
CREATE INDEX IF NOT EXISTS idx_leads_follow_up_date ON leads(follow_up_date);
