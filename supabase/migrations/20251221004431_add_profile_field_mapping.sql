-- Add profile field mapping to followup_actions for kid-level tasks
-- This allows admin to map follow-up answers directly to kid profile fields
ALTER TABLE public.followup_actions 
ADD COLUMN IF NOT EXISTS profile_field_mapping TEXT CHECK (profile_field_mapping IN ('health_state', 'current_grade', 'school_name', 'education_progress', 'certificates', 'ongoing_courses')) DEFAULT NULL;

COMMENT ON COLUMN public.followup_actions.profile_field_mapping IS 'Kid profile field to map the answer to (only for kid-level tasks). If NULL, answer goes to follow-up answer section.';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_followup_actions_profile_field_mapping ON public.followup_actions(profile_field_mapping) WHERE profile_field_mapping IS NOT NULL;

