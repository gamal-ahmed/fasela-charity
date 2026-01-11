-- Migration to fix RLS policies for organizations table
-- This allows super admins to manage organizations (Create, Update, Delete)

-- 1. Grant necessary table permissions to authenticated users
GRANT INSERT, UPDATE, DELETE ON public.organizations TO authenticated;

-- 2. Add INSERT policy for super admins
CREATE POLICY "Super admins can create organizations" ON public.organizations
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_super_admin(auth.uid()));

-- 3. Add UPDATE policy for super admins
CREATE POLICY "Super admins can update organizations" ON public.organizations
    FOR UPDATE
    TO authenticated
    USING (public.is_super_admin(auth.uid()))
    WITH CHECK (public.is_super_admin(auth.uid()));

-- 4. Add DELETE policy for super admins
CREATE POLICY "Super admins can delete organizations" ON public.organizations
    FOR DELETE
    TO authenticated
    USING (public.is_super_admin(auth.uid()));

-- Note: SELECT policy already exists as "Organizations are viewable by everyone"
-- which allows all users to see active organizations.
