import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert } from "lucide-react";
import AdminSidebar, { AdminMobileHeader } from "./AdminSidebar";
import { ReactNode } from "react";

interface AdminLayoutProps {
  children: ReactNode;
  /** If true, allow any authenticated user, not just admins */
  allowNonAdmin?: boolean;
}

const AdminLayout = ({ children, allowNonAdmin = false }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Please log in to access admin settings.</p>
          <Button onClick={() => navigate("/admin/login")}>Go to Login</Button>
        </div>
      </div>
    );
  }

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Access control is handled by RoutePermissionGuard per-route.
  // AdminLayout only requires authentication.

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="lg:ml-64 min-h-screen flex flex-col">
        <AdminMobileHeader onMenuOpen={() => setMobileOpen(true)} />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
