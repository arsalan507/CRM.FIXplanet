-- Update user_role enum to rename values and add technician
-- This migration updates the enum values for user_role

-- Step 1: Add new enum values to the existing enum
-- Note: Run these ALTER TYPE commands first, then commit the transaction
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'sales_executive';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'field_executive';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'technician';

-- IMPORTANT: After running the above ALTER TYPE commands, you MUST run the UPDATE statements
-- in a SEPARATE query/transaction. PostgreSQL requires enum values to be committed before use.

-- Step 2: Run these UPDATE statements in a NEW/SEPARATE query after the ALTER TYPE commands above:
-- UPDATE staff SET role = 'sales_executive' WHERE role = 'telecaller';
-- UPDATE staff SET role = 'field_executive' WHERE role = 'pickup_agent';
