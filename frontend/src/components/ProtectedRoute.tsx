import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children, requireVerified = false, requireAdmin = false }:
  { children: ReactNode; requireVerified?: boolean; requireAdmin?: boolean }) {
  const { user, loading, isVerified, isAdmin } = useAuth();
  if (loading) return (
    <div className="min-h-[60vh] grid place-items-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;
  if (requireVerified && !isVerified) return <Navigate to="/profile" replace />;
  return <>{children}</>;
}
