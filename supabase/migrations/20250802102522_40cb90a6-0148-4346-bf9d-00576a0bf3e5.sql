-- Add 'redeemed' to the donation status enum
-- First, add the new value to the enum
ALTER TYPE donation_status ADD VALUE IF NOT EXISTS 'redeemed';

-- Update the donations table to use the enum if it's not already using it
-- (This is safe to run even if already using enum)
DO $$
BEGIN
    -- Check if the column is already using the enum type
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'donations' 
        AND column_name = 'status' 
        AND data_type = 'USER-DEFINED'
    ) THEN
        -- If not using enum, convert the column
        ALTER TABLE donations 
        ALTER COLUMN status TYPE donation_status 
        USING status::donation_status;
    END IF;
END $$;