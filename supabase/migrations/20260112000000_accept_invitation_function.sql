-- Migration: create accept_invitation RPC to safely accept org invitations
-- Creates a SECURITY DEFINER function that inserts into user_roles and marks invitation accepted

BEGIN;

-- Drop existing function if it exists (with any parameter name)
-- Drop all possible variations to ensure clean state
DROP FUNCTION IF EXISTS public.accept_invitation(text);
DROP FUNCTION IF EXISTS public.accept_invitation(p_token text);

-- Create function
CREATE OR REPLACE FUNCTION public.accept_invitation(token text)
RETURNS TABLE(invitation_id uuid, organization_id uuid, role text) AS $$
DECLARE
  v_invitation_id uuid;
  v_organization_id uuid;
  v_role app_role;
  v_expires_at timestamp with time zone;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Select invitation data into individual variables to avoid ambiguity
  SELECT 
    org_invitations.id,
    org_invitations.organization_id,
    org_invitations.role,
    org_invitations.expires_at
  INTO 
    v_invitation_id,
    v_organization_id,
    v_role,
    v_expires_at
  FROM org_invitations 
  WHERE org_invitations.token = accept_invitation.token 
    AND org_invitations.status = 'pending' 
  LIMIT 1;
  
  IF v_invitation_id IS NULL THEN
    RAISE EXCEPTION 'Invitation not found or already used';
  END IF;

  IF v_expires_at IS NOT NULL AND v_expires_at < now() THEN
    RAISE EXCEPTION 'Invitation expired';
  END IF;

  -- Insert into user_roles idempotently
  INSERT INTO user_roles (user_id, organization_id, role, created_at)
  VALUES (uid, v_organization_id, v_role, now())
  ON CONFLICT (user_id, organization_id, role) DO NOTHING;

  -- Mark invitation accepted
  UPDATE org_invitations SET status = 'accepted' WHERE org_invitations.id = v_invitation_id;

  -- Return the result (cast app_role to text for return type compatibility)
  RETURN QUERY SELECT v_invitation_id, v_organization_id, v_role::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated role so logged-in users can call it
GRANT EXECUTE ON FUNCTION public.accept_invitation(text) TO authenticated;

COMMIT;
