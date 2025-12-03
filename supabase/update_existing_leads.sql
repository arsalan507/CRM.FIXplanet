-- Update existing leads to set default acceptance_status
-- Run this ONCE in your Supabase SQL Editor

UPDATE leads
SET acceptance_status = 'pending'
WHERE acceptance_status IS NULL;

-- Verify the update
SELECT
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE acceptance_status = 'pending') as pending_acceptance,
  COUNT(*) FILTER (WHERE acceptance_status = 'accepted') as accepted,
  COUNT(*) FILTER (WHERE acceptance_status = 'rejected') as rejected
FROM leads;
