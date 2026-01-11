-- Migration to fix RLS policies for user_roles table
-- This allows super admins to manage all roles, org admins to manage their org roles,
-- and users to join an organization when they have a pending invitation.

-- 1. Ensure RLS is enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- 3. Grant necessary permissions
GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;

-- 4. SELECT Policies
CREATE POLICY "Super admins can view all roles" ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Org admins can view their org members" ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (
        organization_id IN (
            SELECT ur.organization_id FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
    );

CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- 5. INSERT Policies
CREATE POLICY "Super admins can manage any role" ON public.user_roles
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Org admins can manage roles in their org" ON public.user_roles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        organization_id IN (
            SELECT ur.organization_id FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
    );

CREATE POLICY "Users can join org via invitation" ON public.user_roles
    FOR INSERT
    TO authenticated
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

-- 6. UPDATE Policies
CREATE POLICY "Super admins can update any role" ON public.user_roles
    FOR UPDATE
    TO authenticated
    USING (public.is_super_admin(auth.uid()))
    WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Org admins can update roles in their org" ON public.user_roles
    FOR UPDATE
    TO authenticated
    USING (
        organization_id IN (
            SELECT ur.organization_id FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT ur.organization_id FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
    );

-- 7. DELETE Policies
CREATE POLICY "Super admins can delete any role" ON public.user_roles
    FOR DELETE
    TO authenticated
    USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Org admins can delete roles in their org" ON public.user_roles
    FOR DELETE
    TO authenticated
    USING (
        organization_id IN (
            SELECT ur.organization_id FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
    );
