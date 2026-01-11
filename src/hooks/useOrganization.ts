import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization, Organization } from "@/contexts/OrganizationContext";

// Re-export the context hook for convenience
export { useOrganization } from "@/contexts/OrganizationContext";

// Fetch all organizations (super admin only)
export function useAllOrganizations() {
  return useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Organization[];
    },
  });
}

// Fetch single organization
export function useOrganizationById(id: string | undefined) {
  return useQuery({
    queryKey: ["organization", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Organization;
    },
    enabled: !!id,
  });
}

// Create organization (super admin only)
export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (org: { name: string; slug: string; logo_url?: string }) => {
      const { data, error } = await supabase
        .from("organizations")
        .insert(org)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}

// Update organization
export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Organization>;
    }) => {
      const { data, error } = await supabase
        .from("organizations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organization", data.id] });
    },
  });
}

// Soft delete organization (super admin only)
export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("organizations")
        .update({ is_active: false })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}

// Fetch organization members
export function useOrganizationMembers(orgId: string | undefined) {
  return useQuery({
    queryKey: ["organization-members", orgId],
    queryFn: async () => {
      if (!orgId) return [];

      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          id,
          user_id,
          role,
          is_super_admin,
          created_at,
          organization_id
        `)
        .eq("organization_id", orgId);

      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

// Update member role
export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roleId,
      newRole,
    }: {
      roleId: string;
      newRole: "admin" | "volunteer" | "user";
    }) => {
      const { data, error } = await supabase
        .from("user_roles")
        .update({ role: newRole as "admin" | "user" })
        .eq("id", roleId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["organization-members", data.organization_id],
      });
    },
  });
}

// Remove member from organization
export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roleId, orgId }: { roleId: string; orgId: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;
      return { orgId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["organization-members", data.orgId],
      });
    },
  });
}

// Invitation hooks
export function useOrganizationInvitations(orgId: string | undefined) {
  return useQuery({
    queryKey: ["organization-invitations", orgId],
    queryFn: async () => {
      if (!orgId) return [];

      const { data, error } = await supabase
        .from("org_invitations")
        .select("*")
        .eq("organization_id", orgId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organizationId,
      email,
      role,
    }: {
      organizationId: string;
      email: string;
      role: "admin" | "volunteer" | "user";
    }) => {
      const { data: { session } } = await supabase.auth.getSession();

      const { data, error } = await supabase
        .from("org_invitations")
        .insert({
          organization_id: organizationId,
          email,
          role: role as "admin" | "user",
          invited_by: session?.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["organization-invitations", data.organization_id],
      });
    },
  });
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invitationId, orgId }: { invitationId: string; orgId: string }) => {
      const { data, error } = await supabase
        .from("org_invitations")
        .update({ status: "cancelled" })
        .eq("id", invitationId)
        .select()
        .single();

      if (error) throw error;
      return { ...data, orgId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["organization-invitations", data.orgId],
      });
    },
  });
}

// Check for pending invitation by token
export function useInvitationByToken(token: string | undefined) {
  return useQuery({
    queryKey: ["invitation", token],
    queryFn: async () => {
      if (!token) return null;

      const { data, error } = await supabase
        .from("org_invitations")
        .select(`
          *,
          organizations:organization_id (
            id,
            name,
            slug,
            logo_url
          )
        `)
        .eq("token", token)
        .eq("status", "pending")
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!token,
  });
}

// Accept invitation
export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  const { refreshOrganizations } = useOrganization();

  return useMutation({
    mutationFn: async (token: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      // Get the invitation
      const { data: invitation, error: fetchError } = await supabase
        .from("org_invitations")
        .select("*")
        .eq("token", token)
        .eq("status", "pending")
        .single();

      if (fetchError) throw fetchError;
      if (!invitation) throw new Error("Invitation not found");

      // Check expiration
      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error("Invitation has expired");
      }

      // Create user role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: session.user.id,
        organization_id: invitation.organization_id,
        role: invitation.role,
      });

      if (roleError) throw roleError;

      // Update invitation status
      const { error: updateError } = await supabase
        .from("org_invitations")
        .update({ status: "accepted" })
        .eq("id", invitation.id);

      if (updateError) throw updateError;

      return invitation;
    },
    onSuccess: () => {
      refreshOrganizations();
      queryClient.invalidateQueries({ queryKey: ["invitation"] });
    },
  });
}
