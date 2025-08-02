-- Create donation_status enum type and update the donations table
CREATE TYPE donation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'redeemed');

-- Update the donations table to use the new enum type
ALTER TABLE donations 
ALTER COLUMN status TYPE donation_status 
USING status::donation_status;