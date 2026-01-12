-- Migration: create accept_invitation RPC to safely accept org invitations
-- Creates a SECURITY DEFINER function that inserts into user_roles and marks invitation accepted

BEGIN;

-- Create function
CREATE OR REPLACE FUNCTION public.accept_invitation(token text)
RETURNS TABLE(invitation_id uuid, organization_id uuid, role text) AS $$
DECLARE
  inv record;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO inv FROM org_invitations WHERE org_invitations.token = token AND org_invitations.status = 'pending' LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or already used';
  END IF;

  IF inv.expires_at IS NOT NULL AND inv.expires_at < now() THEN
    RAISE EXCEPTION 'Invitation expired';
  END IF;

  -- Insert into user_roles idempotently
  INSERT INTO user_roles (user_id, organization_id, role, created_at)
  VALUES (uid, inv.organization_id, inv.role, now())
  ON CONFLICT (user_id, organization_id, role) DO NOTHING;

  -- Mark invitation accepted
  UPDATE org_invitations SET status = 'accepted' WHERE id = inv.id;

  invitation_id := inv.id;
  organization_id := inv.organization_id;
  role := inv.role;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated role so logged-in users can call it
GRANT EXECUTE ON FUNCTION public.accept_invitation(text) TO authenticated;

COMMIT;
