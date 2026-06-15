import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MessageSquare, 
  FileText, 
  LayoutDashboard, 
  LogOut, 
  Menu,
  X,
  Users,
  ChevronRight,
  Settings,
  Bookmark
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { PageTransition } from "./PageTransition";
import logo from "@/assets/logo.png";

interface DashboardLayoutProps {
  children: React.ReactNode;
  fullHeight?: boolean;
}

interface NavItem {
  key: string;
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
}

export default function DashboardLayout({ children, fullHeight = false }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, signOut, loading } = useAuth();
  const { t, dir } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [allowedNavKeys, setAllowedNavKeys] = useState<string[]>([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  const getFallbackNavKeys = (currentRole: string | null): string[] => {
    if (currentRole === "admin") {
      return ["dashboard", "chat", "bookmarks", "documents", "users", "settings"];
    }

    if (currentRole === "doctor") {
      return ["dashboard", "chat", "bookmarks"];
    }

    return ["dashboard", "chat", "bookmarks"];
  };

  const allNavItems: NavItem[] = [
    { key: "dashboard", label: t("nav.dashboard"), icon: LayoutDashboard, path: "/dashboard" },
    { key: "chat", label: t("nav.chat"), icon: MessageSquare, path: "/chat" },
    { key: "bookmarks", label: t("nav.bookmarks"), icon: Bookmark, path: "/bookmarks" },
    { key: "documents", label: t("nav.documents"), icon: FileText, path: "/documents" },
    { key: "users", label: t("nav.users"), icon: Users, path: "/users" },
    { key: "settings", label: t("nav.settings"), icon: Settings, path: "/settings" },
  ];

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Fetch navigation permissions based on user's role
  useEffect(() => {
    const fetchNavPermissions = async () => {
      if (!role) {
        setAllowedNavKeys(getFallbackNavKeys(null));
        setPermissionsLoaded(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("role_nav_permissions")
          .select("nav_key")
          .eq("role_slug", role);

        if (error) throw error;

        const navKeys = data?.map((p) => p.nav_key) || [];
        if (navKeys.length === 0) {
          setAllowedNavKeys(getFallbackNavKeys(role));
        } else {
          setAllowedNavKeys(navKeys);
        }
      } catch (error) {
        if ((error as { code?: string }).code === "PGRST205") {
          setAllowedNavKeys(getFallbackNavKeys(role));
        } else {
          console.error("Error fetching nav permissions:", error);
          setAllowedNavKeys(getFallbackNavKeys(role));
        }
      } finally {
        setPermissionsLoaded(true);
      }
    };

    fetchNavPermissions();
  }, [role]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const getInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  const getRoleBadgeColor = () => {
    switch (role) {
      case "admin": return "bg-primary/20 text-primary border border-primary/30";
      case "doctor": return "bg-accent/20 text-accent-foreground border border-accent/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const filteredNavItems = allNavItems.filter((item) =>
    allowedNavKeys.includes(item.key)
  );

  // Redirect to auth if not logged in (after loading completes)
  if (!loading && !user) {
    return null;
  }

  if (loading || !permissionsLoaded) {
    return <DashboardSkeleton dir={dir} />;
  }

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-xl hover:bg-primary/10"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <img src={logo} alt="Logo" className="h-9 w-9" />
              <span className="font-display font-bold text-foreground">TCH ER</span>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                  <AvatarFallback className="gradient-primary text-primary-foreground text-sm font-semibold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user?.email}</span>
                  <span className={cn("text-xs mt-1 px-2 py-0.5 rounded-full w-fit capitalize", getRoleBadgeColor())}>
                    {role}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className={cn("h-4 w-4", dir === "rtl" ? "ml-2" : "mr-2")} />
                {t("nav.signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 z-40 h-screen w-72 bg-card/95 backdrop-blur-xl transition-transform duration-300 ease-in-out",
        dir === "rtl" ? "right-0 border-l border-border" : "left-0 border-r border-border",
        dir === "rtl" ? "lg:translate-x-0" : "lg:translate-x-0",
        sidebarOpen 
          ? "translate-x-0" 
          : dir === "rtl" ? "translate-x-full" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img src={logo} alt="Logo" className="h-14 w-14" />
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl -z-10" />
              </div>
              <div>
                <h1 className="font-display font-bold text-lg text-foreground">{t("header.hospitalName")}</h1>
                <p className="text-xs text-muted-foreground font-medium">{t("header.hospitalNameAr")}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1.5">
            {filteredNavItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 animate-fade-in",
                    "hover:bg-secondary/80 group",
                    isActive && "gradient-primary text-primary-foreground shadow-elegant"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 transition-all duration-300",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary group-hover:scale-110"
                  )} />
                  <span className={cn(
                    "font-semibold transition-colors",
                    isActive ? "text-primary-foreground" : "text-foreground"
                  )}>
                    {item.label}
                  </span>
                  {isActive && (
                    <ChevronRight className={cn(
                      "h-4 w-4 text-primary-foreground animate-slide-in-right",
                      dir === "rtl" ? "mr-auto rotate-180" : "ml-auto"
                    )} />
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 hover-lift">
              <Avatar className="h-11 w-11 ring-2 ring-primary/20">
                <AvatarFallback className="gradient-primary text-primary-foreground font-bold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user?.email}
                </p>
                <span className={cn("text-xs px-2 py-0.5 rounded-full capitalize inline-block mt-1", getRoleBadgeColor())}>
                  {role}
                </span>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              className="w-full mt-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
              onClick={handleSignOut}
            >
              <LogOut className={cn("h-4 w-4", dir === "rtl" ? "ml-2" : "mr-2")} />
              {t("nav.signOut")}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "pt-16 lg:pt-0", 
        dir === "rtl" ? "lg:mr-72" : "lg:ml-72",
        fullHeight ? "h-[100dvh] lg:h-[100dvh]" : "min-h-screen"
      )}>
        <div className={cn(
          fullHeight 
            ? "h-full pt-16 lg:pt-0 px-3 pb-[env(safe-area-inset-bottom)] md:px-5 lg:px-6" 
            : "p-6 lg:p-8"
        )}>
          <PageTransition className={fullHeight ? "h-full" : undefined}>
            {children}
          </PageTransition>
        </div>
      </main>
    </div>
  );
}
