-- Drop existing problematic policies on user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view roles in their organization" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;

-- Create a security definer function to check if user is admin in org (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_org_admin(check_user_id uuid, check_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = check_user_id
      AND organization_id = check_org_id
      AND role = 'admin'
  );
$$;

-- Create a security definer function to check user's org membership
CREATE OR REPLACE FUNCTION public.user_belongs_to_org(check_user_id uuid, check_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = check_user_id
      AND organization_id = check_org_id
  );
$$;

-- Create safe RLS policies using security definer functions
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can view roles in their organization"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Org admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_org_admin(auth.uid(), organization_id)
  OR public.is_super_admin(auth.uid())
);

CREATE POLICY "Org admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  public.is_org_admin(auth.uid(), organization_id)
  OR public.is_super_admin(auth.uid())
);

CREATE POLICY "Org admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  public.is_org_admin(auth.uid(), organization_id)
  OR public.is_super_admin(auth.uid())
);