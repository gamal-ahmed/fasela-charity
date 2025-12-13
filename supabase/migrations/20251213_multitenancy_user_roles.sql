-- Add organization_id to user_roles
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- Get the default organization ID
DO $$
DECLARE
    default_org_id UUID;
BEGIN
    SELECT id INTO default_org_id FROM public.organizations WHERE slug = 'yateem-care' LIMIT 1;

    -- Backfill existing roles to the default organization
    UPDATE public.user_roles
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;

    -- Now that we've backfilled, we could make it NOT NULL, but let's check first
    -- ALTER TABLE public.user_roles ALTER COLUMN organization_id SET NOT NULL;
    
    -- Update primary key/unique constraints if necessary
    -- Current PK is likely (user_id, role) or similar.
    -- We want to change it to (user_id, organization_id, role) eventually.
    -- For now key the legacy PK or drop it and add new one.
    
    -- Dropping old PK/Constraint might be risky without knowing exact name. 
    -- Assuming standard Supabase setup or previously defined constraint.
    
    -- Let's just create an index for performance for now
    -- CREATE INDEX IF NOT EXISTS idx_user_roles_org ON public.user_roles(organization_id);
END $$;
