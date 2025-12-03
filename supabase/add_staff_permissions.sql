-- Add employee_id and permissions to staff table
-- This enables granular permission control for each staff member

-- Add employee_id column
ALTER TABLE staff
ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50);

-- Add permissions column as JSONB
ALTER TABLE staff
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;

-- Add comments
COMMENT ON COLUMN staff.employee_id IS 'Employee identification number';
COMMENT ON COLUMN staff.permissions IS 'JSON object containing granular permissions for the staff member';

-- Create index for employee_id lookups
CREATE INDEX IF NOT EXISTS idx_staff_employee_id ON staff(employee_id);

-- Update existing roles to new role names (optional migration)
-- Uncomment and run these if you want to migrate existing data:
-- UPDATE staff SET role = 'admin' WHERE role = 'manager';
-- UPDATE staff SET role = 'sell_executive' WHERE role = 'telecaller';
-- UPDATE staff SET role = 'operation_manager' WHERE role = 'pickup_agent';

-- Example: Set default permissions for super_admin (all permissions)
-- UPDATE staff
-- SET permissions = '{
--   "search": true,
--   "follow_up": true,
--   "decline": true,
--   "report": true,
--   "add_source": true,
--   "enquiry_form": true,
--   "booking": true,
--   "order": true,
--   "not_repairable": true,
--   "enquiry_not_verify": true,
--   "add_lead_status": true,
--   "enquiry": true,
--   "invoice": true,
--   "not_interested": true,
--   "user": true,
--   "add_products": true
-- }'::jsonb
-- WHERE role = 'super_admin';
