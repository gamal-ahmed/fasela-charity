-- Fix donations trigger to get organization_id from case instead of user
-- This is needed because donations can be created by anonymous users,
-- and donations should inherit the organization from the case

-- Create a special trigger function for donations
CREATE OR REPLACE FUNCTION public.set_donation_org_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set if not already provided
    IF NEW.organization_id IS NULL AND NEW.case_id IS NOT NULL THEN
        -- Get organization_id from the case
        SELECT organization_id INTO NEW.organization_id
        FROM public.cases
        WHERE id = NEW.case_id;
        
        -- If case not found or has no org, fall back to default org
        IF NEW.organization_id IS NULL THEN
            SELECT id INTO NEW.organization_id
            FROM public.organizations
            WHERE slug = 'yateem-care'
            LIMIT 1;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the old trigger and create the new one
DROP TRIGGER IF EXISTS tr_set_org_id_donations ON public.donations;
CREATE TRIGGER tr_set_org_id_donations
    BEFORE INSERT ON public.donations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_donation_org_id();
