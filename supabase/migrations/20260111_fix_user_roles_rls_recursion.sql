-- Migration to fix infinite recursion in user_roles RLS policies
-- By using SECURITY DEFINER functions, we can query the user_roles table
-- during policy evaluation without re-triggering RLS recursively.

-- 1. Helper Function: Check if user is a super admin (SECURITY DEFINER)
-- Note: This might already exist, but we ensure it's defined correctly for recursion bypass.
CREATE OR REPLACE FUNCTION public.check_is_super_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = check_user_id AND is_super_admin = true
    );
END;
$$;

-- 2. Helper Function: Check if user is an admin of a specific organization (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.check_is_org_admin(check_user_id UUID, check_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = check_user_id 
        AND organization_id = check_org_id 
        AND role = 'admin'
    );
END;
$$;

-- 3. Helper Function: Get all organization IDs where user is an admin (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_admin_org_ids(check_user_id UUID)
RETURNS TABLE (org_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT organization_id FROM public.user_roles
    WHERE user_id = check_user_id AND role = 'admin';
END;
$$;

-- 4. Re-apply user_roles policies using helper functions
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Org admins can view their org members" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage any role" ON public.user_roles;
DROP POLICY IF EXISTS "Org admins can manage roles in their org" ON public.user_roles;
DROP POLICY IF EXISTS "Users can join org via invitation" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can update any role" ON public.user_roles;
DROP POLICY IF EXISTS "Org admins can update roles in their org" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can delete any role" ON public.user_roles;
DROP POLICY IF EXISTS "Org admins can delete roles in their org" ON public.user_roles;

-- SELECT Policies
CREATE POLICY "Super admins can view all roles" ON public.user_roles
    FOR SELECT TO authenticated
    USING (public.check_is_super_admin(auth.uid()));

CREATE POLICY "Org admins can view their org members" ON public.user_roles
    FOR SELECT TO authenticated
    USING (public.check_is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- INSERT Policies
CREATE POLICY "Super admins can manage any role" ON public.user_roles
    FOR INSERT TO authenticated
    WITH CHECK (public.check_is_super_admin(auth.uid()));

CREATE POLICY "Org admins can manage roles in their org" ON public.user_roles
    FOR INSERT TO authenticated
    WITH CHECK (public.check_is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Users can join org via invitation" ON public.user_roles
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.org_invitations
            WHERE email = (auth.jwt() ->> 'email')
            AND organization_id = user_roles.organization_id
            AND status = 'pending'
            AND expires_at > NOW()
        )
    );

-- UPDATE Policies
CREATE POLICY "Super admins can update any role" ON public.user_roles
    FOR UPDATE TO authenticated
    USING (public.check_is_super_admin(auth.uid()))
    WITH CHECK (public.check_is_super_admin(auth.uid()));

CREATE POLICY "Org admins can update roles in their org" ON public.user_roles
    FOR UPDATE TO authenticated
    USING (public.check_is_org_admin(auth.uid(), organization_id))
    WITH CHECK (public.check_is_org_admin(auth.uid(), organization_id));

-- DELETE Policies
CREATE POLICY "Super admins can delete any role" ON public.user_roles
    FOR DELETE TO authenticated
    USING (public.check_is_super_admin(auth.uid()));

CREATE POLICY "Org admins can delete roles in their org" ON public.user_roles
    FOR DELETE TO authenticated
    USING (public.check_is_org_admin(auth.uid(), organization_id));

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_is_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_org_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_org_ids(UUID) TO authenticated;
