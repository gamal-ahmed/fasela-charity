-- Fix RLS policies to only check for admin role
-- Since only admins access the follow-up system, we don't need volunteer checks

-- First, create a simple admin-only function
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

-- Drop existing policies for followup_actions
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

-- Also fix the old case_followups and case_tasks policies if they still exist
-- (in case the old tables weren't dropped yet)
DROP POLICY IF EXISTS "Admins can view all followups" ON public.case_followups;
DROP POLICY IF EXISTS "Admins can insert followups" ON public.case_followups;
DROP POLICY IF EXISTS "Admins can update followups" ON public.case_followups;
DROP POLICY IF EXISTS "Admins can delete followups" ON public.case_followups;

DROP POLICY IF EXISTS "Admins can view all tasks" ON public.case_tasks;
DROP POLICY IF EXISTS "Admins can insert tasks" ON public.case_tasks;
DROP POLICY IF EXISTS "Admins can update tasks" ON public.case_tasks;
DROP POLICY IF EXISTS "Admins can delete tasks" ON public.case_tasks;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.followup_actions TO authenticated;
