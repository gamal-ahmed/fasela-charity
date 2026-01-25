import { useOrganization } from "@/contexts/OrganizationContext";

export type UserRole = "admin" | "volunteer" | "user";

/**
 * Hook to check if current user has access to a feature/page based on their role
 */
export function useRoleAccess() {
  const { currentOrg, isSuperAdmin } = useOrganization();

  const currentRole = currentOrg ? (currentOrg as any).role : null;

  /**
   * Check if user has access to a page/feature
   * Super admins always have access
   */
  const hasAccess = (requiredRoles: UserRole[]) => {
    if (isSuperAdmin) return true;
    if (!currentRole) return false;
    return requiredRoles.includes(currentRole);
  };

  /**
   * Check if user can access donations (admin only)
   */
  const canAccessDonations = () => hasAccess(["admin"]);

  /**
   * Check if user can access cases (admin, volunteer, user)
   */
  const canAccessCases = () => hasAccess(["admin", "volunteer", "user"]);

  /**
   * Check if user can access calendar (admin, volunteer)
   */
  const canAccessCalendar = () => hasAccess(["admin", "volunteer"]);

  /**
   * Check if user can access tasks (admin, volunteer)
   */
  const canAccessTasks = () => hasAccess(["admin", "volunteer"]);

  /**
   * Check if user can access reports (admin only)
   */
  const canAccessReports = () => hasAccess(["admin"]);

  /**
   * Check if user can access static pages (admin only)
   */
  const canAccessStaticPages = () => hasAccess(["admin"]);

  return {
    currentRole,
    hasAccess,
    canAccessDonations,
    canAccessCases,
    canAccessCalendar,
    canAccessTasks,
    canAccessReports,
    canAccessStaticPages,
  };
}
