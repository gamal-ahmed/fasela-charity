-- Add payment_code to cases table for unique 6-digit identifiers
ALTER TABLE cases 
ADD COLUMN payment_code TEXT;

-- Create function to generate 6-digit payment codes
CREATE OR REPLACE FUNCTION generate_payment_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a 6-digit code (100000 to 999999)
        new_code := LPAD((FLOOR(RANDOM() * 900000) + 100000)::TEXT, 6, '0');
        
        -- Check if this code already exists
        SELECT EXISTS(SELECT 1 FROM cases WHERE payment_code = new_code) INTO code_exists;
        
        -- If code doesn't exist, we can use it
        IF NOT code_exists THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Update existing cases with payment codes
UPDATE cases 
SET payment_code = generate_payment_code() 
WHERE payment_code IS NULL;

-- Create trigger to auto-generate payment codes for new cases
CREATE OR REPLACE FUNCTION set_payment_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payment_code IS NULL THEN
        NEW.payment_code := generate_payment_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cases_payment_code_trigger
    BEFORE INSERT ON cases
    FOR EACH ROW
    EXECUTE FUNCTION set_payment_code();