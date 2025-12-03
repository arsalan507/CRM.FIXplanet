-- Trigger to automatically create a customer when a new lead is created
-- This ensures every lead has a corresponding customer record

CREATE OR REPLACE FUNCTION auto_create_customer_from_lead()
RETURNS TRIGGER AS $$
DECLARE
  existing_customer_id UUID;
BEGIN
  -- Check if a customer already exists with this contact number
  SELECT id INTO existing_customer_id
  FROM customers
  WHERE contact_number = NEW.contact_number
  LIMIT 1;

  -- If customer doesn't exist, create one
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

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_create_customer ON leads;

-- Create trigger for new leads
CREATE TRIGGER trigger_auto_create_customer
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_customer_from_lead();

COMMENT ON FUNCTION auto_create_customer_from_lead IS 'Automatically creates a customer record when a new lead is inserted';
