-- Fix RLS policies for followup_action_kid_answers to allow public access
-- Case moms access via phone verification (not authentication)

-- Drop existing case mom policies that require authentication
DROP POLICY IF EXISTS "Case moms can view answers for their case kids" ON public.followup_action_kid_answers;
DROP POLICY IF EXISTS "Case moms can insert answers for their case kids" ON public.followup_action_kid_answers;

-- Allow public to view kid-level answers for pending followup actions that require case action
-- This allows CaseFollowups page (which uses phone verification) to view answers
CREATE POLICY "Public can view kid-level answers for pending tasks"
  ON public.followup_action_kid_answers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.followup_actions fa
      WHERE fa.id = followup_action_kid_answers.followup_action_id
      AND fa.status = 'pending'
      AND fa.requires_case_action = true
      AND fa.task_level = 'kid_level'
    )
  );

-- Allow public to insert kid-level answers for pending followup actions
-- This allows CaseFollowups page to submit answers
CREATE POLICY "Public can insert kid-level answers for pending tasks"
  ON public.followup_action_kid_answers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.followup_actions fa
      WHERE fa.id = followup_action_kid_answers.followup_action_id
      AND fa.status = 'pending'
      AND fa.requires_case_action = true
      AND fa.task_level = 'kid_level'
    )
  );

-- Grant permissions to public (anon) role
GRANT SELECT, INSERT ON public.followup_action_kid_answers TO anon;
GRANT SELECT, INSERT ON public.followup_action_kid_answers TO authenticated;

