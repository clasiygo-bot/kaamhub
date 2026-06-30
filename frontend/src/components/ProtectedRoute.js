import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute({ children, roles }) {
  const { user, bootstrapping } = useAuth();
  if (bootstrapping || user === null) {
    return (
      <div data-testid="auth-loading" className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#FF8A00] border-t-transparent" />
      </div>
    );
  }
  if (user === false) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    const target = user.role === "customer" ? "/customer" : user.role === "partner" ? "/partner" : "/admin";
    return <Navigate to={target} replace />;
  }
  return children;
}
