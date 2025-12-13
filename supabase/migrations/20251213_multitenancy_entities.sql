-- Function to safely add org_id and backfill
CREATE OR REPLACE FUNCTION public.add_org_to_table(table_name_text text, default_org_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = table_name_text 
        AND column_name = 'organization_id'
        AND table_schema = 'public'
    ) THEN
        -- Add column
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN organization_id UUID REFERENCES public.organizations(id)', table_name_text);
        
        -- Backfill
        EXECUTE format('UPDATE public.%I SET organization_id = $1 WHERE organization_id IS NULL', table_name_text) USING default_org_id;
        
        -- Make NOT NULL (Optional for now, but good practice if backfill guaranteed)
        -- EXECUTE format('ALTER TABLE public.%I ALTER COLUMN organization_id SET NOT NULL', table_name_text);
        
        -- Create Index
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_org ON public.%I(organization_id)', table_name_text, table_name_text);
    END IF;
END;
$$;

DO $$
DECLARE
    default_org_id UUID;
BEGIN
    SELECT id INTO default_org_id FROM public.organizations WHERE slug = 'yateem-care' LIMIT 1;

    -- List of tables to migrate
    PERFORM public.add_org_to_table('cases', default_org_id);
    PERFORM public.add_org_to_table('case_kids', default_org_id);
    PERFORM public.add_org_to_table('donations', default_org_id);
    PERFORM public.add_org_to_table('monthly_reports', default_org_id);
    PERFORM public.add_org_to_table('followup_actions', default_org_id);
    PERFORM public.add_org_to_table('donation_handovers', default_org_id);
    PERFORM public.add_org_to_table('case_charities', default_org_id);
    PERFORM public.add_org_to_table('case_private_spending', default_org_id);
    PERFORM public.add_org_to_table('case_confidential_info', default_org_id);
    -- Add others if missed
    
    -- Charities Might remain global or be org specific. Let's make them org specific for now as per plan
    PERFORM public.add_org_to_table('charities', default_org_id);
    
END $$;

-- Drop function after use
DROP FUNCTION public.add_org_to_table(text, uuid);
