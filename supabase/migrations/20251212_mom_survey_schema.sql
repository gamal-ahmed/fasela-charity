
-- Add contact_phone to cases table for mom authentication
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS contact_phone text;

-- Create an index on contact_phone for faster lookups
CREATE INDEX IF NOT EXISTS idx_cases_contact_phone ON cases(contact_phone);

-- Add hobbies to case_kids table
ALTER TABLE case_kids 
ADD COLUMN IF NOT EXISTS hobbies text[] DEFAULT '{}';

-- Comment on columns
COMMENT ON COLUMN cases.contact_phone IS 'Phone number used for mom login/survey access';
COMMENT ON COLUMN case_kids.hobbies IS 'Array of hobbies selected by the mother';
