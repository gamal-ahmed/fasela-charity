-- Immediate fix for follow-up actions RLS policies
-- Run this in your Supabase SQL editor to fix the admin-only access issue

-- Create admin-only function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has admin role
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$;

-- Drop existing policies for followup_actions (if they exist)
DROP POLICY IF EXISTS "Admins can view all followup actions" ON public.followup_actions;
DROP POLICY IF EXISTS "Admins can insert followup actions" ON public.followup_actions;
DROP POLICY IF EXISTS "Admins can update followup actions" ON public.followup_actions;
DROP POLICY IF EXISTS "Admins can delete followup actions" ON public.followup_actions;

-- Create new policies using the admin-only function
CREATE POLICY "Admins can view all followup actions"
  ON public.followup_actions
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert followup actions"
  ON public.followup_actions
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update followup actions"
  ON public.followup_actions
  FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete followup actions"
  ON public.followup_actions
  FOR DELETE
  USING (is_admin());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.followup_actions TO authenticated;

-- Verify the policies are working
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'followup_actions';
