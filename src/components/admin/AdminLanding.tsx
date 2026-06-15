import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useFirstPermittedPath } from "@/hooks/useNavPermissions";

/**
 * Smart landing page that redirects users to their first permitted admin page.
 * Admins go to /admin (dashboard). Non-admins go to their first allowed page.
 */
const AdminLanding = () => {
  const navigate = useNavigate();
  const { path, loading } = useFirstPermittedPath();

  useEffect(() => {
    if (loading) return;
    if (path) {
      navigate(path, { replace: true });
    } else {
      // No permitted pages — send to login
      navigate("/admin/login", { replace: true });
    }
  }, [path, loading, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
};

export default AdminLanding;
