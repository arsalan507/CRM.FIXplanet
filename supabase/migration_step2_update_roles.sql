-- MIGRATION STEP 2: Update existing staff records
-- Run this AFTER step 1 completes successfully

UPDATE staff SET role = 'sales_executive' WHERE role = 'telecaller';
UPDATE staff SET role = 'field_executive' WHERE role = 'pickup_agent';
