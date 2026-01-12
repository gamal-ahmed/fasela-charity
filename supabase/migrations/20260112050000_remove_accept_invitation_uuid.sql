-- Migration: remove accept_invitation(uuid) overload to avoid PostgREST ambiguity (PGRST203)

BEGIN;

-- Drop the uuid overload if it exists
DROP FUNCTION IF EXISTS public.accept_invitation(uuid);

COMMIT;
