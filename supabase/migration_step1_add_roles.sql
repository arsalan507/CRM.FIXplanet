-- MIGRATION STEP 1: Add new enum values
-- Run this first in Supabase SQL Editor

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'sales_executive';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'field_executive';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'technician';
