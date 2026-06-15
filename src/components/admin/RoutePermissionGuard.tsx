import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useRoutePermissionCheck } from "@/hooks/useNavPermissions";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Loader2 } from "lucide-react";

interface RoutePermissionGuardProps {
  children: ReactNode;
}

const RoutePermissionGuard = ({ children }: RoutePermissionGuardProps) => {
  const navigate = useNavigate();
  const { allowed, loading } = useRoutePermissionCheck();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="font-heading font-bold text-xl text-foreground">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
          <Button variant="outline" onClick={() => navigate("/admin")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoutePermissionGuard;
