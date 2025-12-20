-- Add kid-level task support to followup_actions table
ALTER TABLE public.followup_actions 
ADD COLUMN IF NOT EXISTS task_level TEXT CHECK (task_level IN ('case_level', 'kid_level')) DEFAULT 'case_level',
ADD COLUMN IF NOT EXISTS kid_ids JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.followup_actions.task_level IS 'Level of the task: case_level or kid_level';
COMMENT ON COLUMN public.followup_actions.kid_ids IS 'Array of kid IDs for kid-level tasks';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_followup_actions_task_level ON public.followup_actions(task_level);
CREATE INDEX IF NOT EXISTS idx_followup_actions_kid_ids ON public.followup_actions USING GIN (kid_ids);

-- Create table for kid-level task answers
CREATE TABLE IF NOT EXISTS public.followup_action_kid_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  followup_action_id UUID NOT NULL REFERENCES public.followup_actions(id) ON DELETE CASCADE,
  kid_id UUID NOT NULL REFERENCES public.case_kids(id) ON DELETE CASCADE,
  answer_text TEXT,
  answer_photos JSONB DEFAULT '[]'::jsonb,
  answer_multi_choice TEXT,
  answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  answered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(followup_action_id, kid_id)
);

COMMENT ON TABLE public.followup_action_kid_answers IS 'Stores answers for kid-level follow-up tasks';
COMMENT ON COLUMN public.followup_action_kid_answers.followup_action_id IS 'Reference to the follow-up action task';
COMMENT ON COLUMN public.followup_action_kid_answers.kid_id IS 'Reference to the kid this answer is for';
COMMENT ON COLUMN public.followup_action_kid_answers.answer_text IS 'Text answer for text_area type';
COMMENT ON COLUMN public.followup_action_kid_answers.answer_photos IS 'Array of photo URLs for photo_upload type';
COMMENT ON COLUMN public.followup_action_kid_answers.answer_multi_choice IS 'Selected option for multi-choice questions';
COMMENT ON COLUMN public.followup_action_kid_answers.answered_at IS 'Timestamp when the task was answered';
COMMENT ON COLUMN public.followup_action_kid_answers.answered_by IS 'User who answered the task';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_followup_action_kid_answers_followup_action_id ON public.followup_action_kid_answers(followup_action_id);
CREATE INDEX IF NOT EXISTS idx_followup_action_kid_answers_kid_id ON public.followup_action_kid_answers(kid_id);
CREATE INDEX IF NOT EXISTS idx_followup_action_kid_answers_answered_at ON public.followup_action_kid_answers(answered_at DESC);

-- Enable RLS
ALTER TABLE public.followup_action_kid_answers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for kid-level answers
CREATE POLICY "Admins can view all kid-level answers"
  ON public.followup_action_kid_answers
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert kid-level answers"
  ON public.followup_action_kid_answers
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update kid-level answers"
  ON public.followup_action_kid_answers
  FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete kid-level answers"
  ON public.followup_action_kid_answers
  FOR DELETE
  USING (is_admin());

-- Allow case moms to view and insert their own answers (for their case's kids)
CREATE POLICY "Case moms can view answers for their case kids"
  ON public.followup_action_kid_answers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.case_kids ck
      JOIN public.cases c ON c.id = ck.case_id
      WHERE ck.id = followup_action_kid_answers.kid_id
      AND c.contact_phone = (SELECT phone FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Case moms can insert answers for their case kids"
  ON public.followup_action_kid_answers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.case_kids ck
      JOIN public.cases c ON c.id = ck.case_id
      WHERE ck.id = followup_action_kid_answers.kid_id
      AND c.contact_phone = (SELECT phone FROM auth.users WHERE id = auth.uid())
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.followup_action_kid_answers TO authenticated;

