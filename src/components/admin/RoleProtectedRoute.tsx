import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useOrganization } from "@/contexts/OrganizationContext";

interface RoleProtectedRouteProps {
  requiredRoles: Array<"admin" | "volunteer" | "user">;
  children: ReactNode;
}

/**
 * Component to protect routes based on user role
 * Redirects to /admin if user doesn't have required role
 */
export function RoleProtectedRoute({ requiredRoles, children }: RoleProtectedRouteProps) {
  const { hasAccess } = useRoleAccess();
  const { isLoading } = useOrganization();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">جار التحميل...</div>;
  }

  if (!hasAccess(requiredRoles)) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
