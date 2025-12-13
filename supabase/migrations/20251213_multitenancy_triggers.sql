-- Function to automatically set organization_id
CREATE OR REPLACE FUNCTION public.set_current_org_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set if not already provided
    IF NEW.organization_id IS NULL THEN
        NEW.organization_id := public.get_my_org_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create trigger for a table
CREATE OR REPLACE FUNCTION public.create_org_trigger(table_name_text text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE format('
        DROP TRIGGER IF EXISTS tr_set_org_id_%I ON public.%I;
        CREATE TRIGGER tr_set_org_id_%I
        BEFORE INSERT ON public.%I
        FOR EACH ROW
        EXECUTE FUNCTION public.set_current_org_id();
    ', table_name_text, table_name_text, table_name_text, table_name_text);
END;
$$;

DO $$
BEGIN
    PERFORM public.create_org_trigger('cases');
    PERFORM public.create_org_trigger('case_kids');
    PERFORM public.create_org_trigger('donations');
    PERFORM public.create_org_trigger('monthly_reports');
    PERFORM public.create_org_trigger('followup_actions');
    PERFORM public.create_org_trigger('donation_handovers');
    PERFORM public.create_org_trigger('case_charities');
    PERFORM public.create_org_trigger('case_private_spending');
    PERFORM public.create_org_trigger('case_confidential_info');
END $$;

DROP FUNCTION public.create_org_trigger(text);
