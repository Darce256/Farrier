import { ReactNode } from "react";

import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/Contexts/AuthProvider";

interface ProtectedAdminRouteProps {
  children: ReactNode;
}

export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const { user } = useAuth();

  if (!user?.isAdmin) {
    return <Navigate to="/horses" replace />;
  }

  return <>{children}</>;
}
