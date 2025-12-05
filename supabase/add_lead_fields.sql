-- Add new fields to leads table
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS area TEXT,
ADD COLUMN IF NOT EXISTS pincode TEXT,
ADD COLUMN IF NOT EXISTS alternate_mobile TEXT;

-- Add comment
COMMENT ON COLUMN leads.area IS 'Customer area/locality';
COMMENT ON COLUMN leads.pincode IS 'Customer pincode';
COMMENT ON COLUMN leads.alternate_mobile IS 'Alternate contact number';
