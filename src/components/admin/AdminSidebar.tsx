import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings, useIsAdmin } from "@/hooks/useSiteSettings";
import { useNavItemFilter, useUserCustomRoleIds } from "@/hooks/useNavPermissions";
import { useCustomRoles } from "@/hooks/useCustomRoles";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  MessageSquare,
  Bookmark,
  FileText,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  X,
  Menu,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Chat Assistant", icon: MessageSquare, path: "/admin/chat" },
  { label: "Bookmarks", icon: Bookmark, path: "/admin/bookmarks" },
  { label: "Documents", icon: FileText, path: "/admin/documents" },
  { label: "User Management", icon: Users, path: "/admin/users" },
  { label: "Settings", icon: Settings, path: "/admin/settings" },
];

interface AdminSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const AdminSidebar = ({ mobileOpen, onMobileClose }: AdminSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { data: settings } = useSiteSettings();
  const { data: isAdmin } = useIsAdmin();
  const { data: customRoles } = useCustomRoles();
  const { data: userRoleIds } = useUserCustomRoleIds();
  const isNavAllowed = useNavItemFilter(!!isAdmin);
  const filteredNavItems = navItems.filter((item) => isNavAllowed(item.path));

  // Resolve display role
  const userRole = (() => {
    if (isAdmin) return { name: "Admin", color: "hsl(var(--primary))" };
    if (userRoleIds?.length && customRoles?.length) {
      const role = customRoles.find((r) => userRoleIds.includes(r.id));
      if (role) return { name: role.name, color: role.color };
    }
    return { name: "User", color: "hsl(var(--muted-foreground))" };
  })();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  const handleNav = (path: string) => {
    navigate(path);
    onMobileClose();
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-4 lg:p-5 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings?.logo?.url ? (
              <img src={settings.logo.url} alt={settings.logo.alt} className="w-9 h-9 rounded-lg object-contain" />
            ) : (
              <img src="/images/hospital-logo.svg" alt="Taif Children's Hospital" className="w-9 h-9 rounded-lg object-contain" />
            )}
            <div>
              <p className="font-heading font-bold text-sm text-foreground leading-tight">Taif Children's</p>
              <p className="text-[10px] text-muted-foreground leading-tight font-medium">مستشفى الطائف للأطفال</p>
            </div>
          </div>
          {/* Mobile close */}
          <button onClick={onMobileClose} className="lg:hidden p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 lg:px-3 space-y-0.5 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={`w-full flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {active && <ChevronRight className="w-4 h-4 shrink-0" />}
            </button>
          );
        })}
      </nav>

      {/* User info */}
      <div className="p-3 lg:p-4 border-t border-border/50 space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <span className="text-primary font-heading font-bold text-sm">
              {user?.email?.charAt(0).toUpperCase() || "A"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Admin"}
            </p>
            <Badge className="text-[10px] px-1.5 py-0 h-4 mt-0.5 border-0" style={{ backgroundColor: userRole.color, color: "#fff" }}>{userRole.name}</Badge>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/80 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border/50 flex-col z-50">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r border-border/50 flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;

export { navItems };

// Mobile header trigger component
export const AdminMobileHeader = ({ onMenuOpen }: { onMenuOpen: () => void }) => (
  <header className="lg:hidden sticky top-0 z-40 flex items-center gap-3 px-4 py-3 bg-card/90 backdrop-blur-lg border-b border-border/50">
    <button onClick={onMenuOpen} className="p-2 rounded-lg hover:bg-secondary transition-colors">
      <Menu className="w-5 h-5 text-foreground" />
    </button>
    <span className="font-heading font-bold text-sm text-foreground">Admin Panel</span>
  </header>
);
