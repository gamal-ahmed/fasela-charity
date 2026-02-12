import { useOrganization } from "@/contexts/OrganizationContext";

/**
 * Hook to get the current organization ID for queries.
 * Returns the org ID or null if not available.
 *
 * Note: RLS policies already filter by organization, so this is for
 * defense in depth and UI correctness.
 */
export function useCurrentOrgId() {
  const { currentOrg } = useOrganization();
  return currentOrg?.id ?? null;
}

/**
 * Hook to get organization-aware query options.
 * Use this to add org filtering to your React Query queries.
 *
 * - For regular users: returns orgId and enables queries once org is loaded
 * - For super admins: returns orgId as null so queries skip the org filter,
 *   allowing them to see data across all organizations
 *
 * Example:
 * ```
 * const { orgId, enabled } = useOrgQueryOptions();
 *
 * const query = supabase.from("cases").select("*");
 * if (orgId) query.eq("organization_id", orgId);
 * ```
 */
export function useOrgQueryOptions() {
  const { currentOrg, isLoading, isSuperAdmin } = useOrganization();

  return {
    orgId: isSuperAdmin ? null : (currentOrg?.id ?? null),
    enabled: !isLoading && (isSuperAdmin || !!currentOrg?.id),
    isLoading,
    isSuperAdmin,
  };
}

/**
 * Type for organization-scoped tables
 */
export type OrgScopedTable =
  | "cases"
  | "case_kids"
  | "donations"
  | "monthly_reports"
  | "followup_actions"
  | "donation_handovers"
  | "case_charities"
  | "case_private_spending"
  | "case_confidential_info"
  | "charities";

/**
 * Helper to add organization filter to a query builder.
 * Since RLS handles filtering, this is optional but recommended
 * for explicit clarity and UI correctness.
 */
export function withOrgFilter<T extends { eq: (column: string, value: string) => T }>(
  query: T,
  orgId: string | null
): T {
  if (orgId) {
    return query.eq("organization_id", orgId);
  }
  return query;
}
