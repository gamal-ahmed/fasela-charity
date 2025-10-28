-- Create new simplified follow-up actions system
-- This replaces the old case_followups and case_tasks tables

-- Drop old tables if they exist
DROP TABLE IF EXISTS public.case_tasks CASCADE;
DROP TABLE IF EXISTS public.case_followups CASCADE;

-- Create new followup_actions table
CREATE TABLE public.followup_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  action_date DATE NOT NULL,
  requires_case_action BOOLEAN NOT NULL DEFAULT false,
  requires_volunteer_action BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completion_notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_followup_actions_case_id ON public.followup_actions(case_id);
CREATE INDEX idx_followup_actions_action_date ON public.followup_actions(action_date DESC);
CREATE INDEX idx_followup_actions_status ON public.followup_actions(status);
CREATE INDEX idx_followup_actions_created_by ON public.followup_actions(created_by);

-- Enable RLS
ALTER TABLE public.followup_actions ENABLE ROW LEVEL SECURITY;

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

-- Create RLS policies using admin-only function
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

-- Create trigger for updated_at
CREATE TRIGGER update_followup_actions_updated_at
  BEFORE UPDATE ON public.followup_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.followup_actions TO authenticated;
