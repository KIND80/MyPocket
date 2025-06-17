import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, role, allowedRoles }: { children: React.ReactNode, role: string | null, allowedRoles: string[] }) {
  if (!role) {
    return <Navigate to="/login" />;
  }
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" />;
  }
  return <>{children}</>;
}
