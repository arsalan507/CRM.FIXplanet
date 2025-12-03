# Lead Workflow System Implementation

## Overview
This document outlines the implementation of a comprehensive lead workflow system with remarks tracking, status management, and automatic customer creation.

## Features Implemented

### 1. Lead Detail Page (`/leads/[id]`)
- Displays complete lead information
- Shows customer contact details, device info, and issue description
- Includes assigned agent and creation date
- Real-time activity timeline showing all remarks and status changes
- Form to add new remarks and update lead status

### 2. New Workflow Statuses
Leads now progress through these workflow statuses:
- **new** - Initial status for all new leads
- **Order** - Lead converted to an order (won)
- **Not Interested** - Customer is not interested
- **Follow Up** - Requires follow-up action

### 3. New Routes & Pages
- **/leads** - Shows only leads with "new" status
- **/orders** - Shows leads with "Order" status
- **/followup** - Shows leads with "Follow Up" status
- **/not-interested** - Shows leads with "Not Interested" status

### 4. Remarks & Activity Tracking
- Agents can add remarks to leads at any time
- Each remark includes:
  - Agent name who made the update
  - Timestamp of the update
  - Remark text
  - Status change (if status was updated)
- Complete history is maintained and displayed in timeline format

### 5. Sidebar Navigation
Updated sidebar menu now includes:
- Dashboard
- Leads (new leads only)
- Orders
- Follow Up
- Not Interested
- Customers
- Invoices
- Team
- Staff
- Opportunities

Role-based access:
- **Telecallers**: Dashboard, Leads, Orders, Follow Up, Not Interested
- **Pickup Agents**: Above + Customers, Invoices
- **Managers & Super Admins**: All menu items

### 6. Automatic Customer Creation
- Every new lead automatically creates a customer record
- Prevents duplicate customers (checks by contact number)
- Customer delete option available in Customers page

### 7. Clickable Lead Rows
- Clicking on any lead row opens the detailed lead page
- Maintains sidebar visibility for easy navigation

## Database Changes Required

### IMPORTANT: Run these SQL scripts in your Supabase SQL Editor

Execute the following SQL files in this order:

#### 1. Add workflow_status column to leads table
```sql
-- File: supabase/add_workflow_status.sql
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS workflow_status TEXT DEFAULT 'new';

COMMENT ON COLUMN leads.workflow_status IS 'Lead workflow status: new, Order, Not Interested, Follow Up';

CREATE INDEX IF NOT EXISTS idx_leads_workflow_status ON leads(workflow_status);

UPDATE leads
SET workflow_status = 'new'
WHERE workflow_status IS NULL;
```

#### 2. Create lead_remarks table
```sql
-- File: supabase/lead_remarks_schema.sql
CREATE TABLE IF NOT EXISTS lead_remarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE SET NULL,
  remark TEXT NOT NULL,
  status_changed_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_remarks_lead_id ON lead_remarks(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_remarks_staff_id ON lead_remarks(staff_id);
CREATE INDEX IF NOT EXISTS idx_lead_remarks_created_at ON lead_remarks(created_at DESC);

ALTER TABLE lead_remarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lead remarks"
  ON lead_remarks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert lead remarks"
  ON lead_remarks FOR INSERT
  TO authenticated
  WITH CHECK (true);

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

COMMENT ON TABLE lead_remarks IS 'Tracks all remarks and status updates made by agents on leads';
COMMENT ON COLUMN lead_remarks.status_changed_to IS 'New status if the lead status was updated: Order, Not Interested, Follow Up';
```

#### 3. Create automatic customer creation trigger
```sql
-- File: supabase/auto_create_customer.sql
CREATE OR REPLACE FUNCTION auto_create_customer_from_lead()
RETURNS TRIGGER AS $$
DECLARE
  existing_customer_id UUID;
BEGIN
  SELECT id INTO existing_customer_id
  FROM customers
  WHERE contact_number = NEW.contact_number
  LIMIT 1;

  IF existing_customer_id IS NULL THEN
    INSERT INTO customers (
      lead_id,
      customer_name,
      contact_number,
      email,
      created_at
    )
    VALUES (
      NEW.id,
      NEW.customer_name,
      NEW.contact_number,
      NEW.email,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_create_customer ON leads;

CREATE TRIGGER trigger_auto_create_customer
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_customer_from_lead();

COMMENT ON FUNCTION auto_create_customer_from_lead IS 'Automatically creates a customer record when a new lead is inserted';
```

## How to Use the System

### Adding a Remark to a Lead
1. Navigate to Leads page
2. Click on any lead row to open the detail page
3. In the "Add Update" card, enter your remark (e.g., "Called customer, will call back in 10 minutes")
4. Optionally select a new status from the dropdown (Order, Not Interested, or Follow Up)
5. Click "Submit Update"

### Lead Movement Between Tabs
- When you change a lead's status to "Order", it moves from Leads to Orders tab
- When you change a lead's status to "Follow Up", it moves from Leads to Follow Up tab
- When you change a lead's status to "Not Interested", it moves from Leads to Not Interested tab
- Original Leads tab only shows leads with "new" status

### Viewing Activity History
- Open any lead detail page
- Scroll to "Activity Timeline" section
- See all previous remarks with:
  - Who made the update
  - When it was made
  - What remark was added
  - If status was changed

## TypeScript Types Added

### LeadWorkflowStatus
```typescript
export type LeadWorkflowStatus = "new" | "Order" | "Not Interested" | "Follow Up";
```

### LeadRemark
```typescript
export interface LeadRemark {
  id: string;
  lead_id: string;
  staff_id: string;
  remark: string;
  status_changed_to: LeadWorkflowStatus | null;
  created_at: string;
  staff?: Staff;
}
```

### Updated Lead Interface
```typescript
export interface Lead {
  // ... existing fields
  workflow_status?: LeadWorkflowStatus;
  remarks?: LeadRemark[];
}
```

## API Routes Created

### POST /api/leads/[id]/remarks
Adds a new remark to a lead and optionally updates the workflow status.

**Request Body:**
```json
{
  "remark": "Called the customer, will follow up tomorrow",
  "status_changed_to": "Follow Up"  // optional
}
```

**Response:**
```json
{
  "success": true,
  "remark": {
    "id": "uuid",
    "lead_id": "uuid",
    "staff_id": "uuid",
    "remark": "text",
    "status_changed_to": "Follow Up",
    "created_at": "timestamp"
  }
}
```

## Files Created/Modified

### New Files:
- `app/(dashboard)/leads/[id]/page.tsx` - Lead detail server component
- `app/(dashboard)/leads/[id]/client.tsx` - Lead detail client component
- `app/(dashboard)/orders/page.tsx` - Orders page
- `app/(dashboard)/not-interested/page.tsx` - Not Interested page
- `app/(dashboard)/followup/page.tsx` - Follow Up page
- `app/api/leads/[id]/remarks/route.ts` - Remarks API route
- `supabase/lead_remarks_schema.sql` - Database schema for remarks
- `supabase/add_workflow_status.sql` - Add workflow_status column
- `supabase/auto_create_customer.sql` - Auto-create customer trigger

### Modified Files:
- `lib/types.ts` - Added LeadWorkflowStatus and LeadRemark types
- `components/layout/sidebar.tsx` - Added new menu items
- `components/tables/enhanced-leads-table.tsx` - Made rows clickable to detail page
- `app/(dashboard)/leads/page.tsx` - Filter only "new" workflow status

## Next Steps (Future Enhancements)

1. Add notification system for follow-ups due
2. Add reminder scheduling for follow-up leads
3. Add bulk status updates
4. Add export functionality for each status category
5. Add analytics dashboard for conversion rates
6. Add WhatsApp integration for follow-ups

## Testing Checklist

- [ ] Run all 3 SQL migration scripts in Supabase
- [ ] Create a new lead and verify customer is auto-created
- [ ] Click on a lead and verify detail page opens
- [ ] Add a remark without changing status
- [ ] Add a remark and change status to "Order"
- [ ] Verify lead moved from Leads tab to Orders tab
- [ ] Add another remark to the same lead
- [ ] Verify all remarks show in timeline with correct timestamps
- [ ] Test with different user roles (telecaller, manager)
- [ ] Verify sidebar shows correct menu items based on role

## Support

If you encounter any issues or need modifications, please refer to the code comments or contact the development team.
