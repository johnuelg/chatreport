import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navigation, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Role {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

interface NavPermission {
  role_slug: string;
  nav_key: string;
}

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "chat", label: "Chat Assistant" },
  { key: "bookmarks", label: "Bookmarks" },
  { key: "documents", label: "Documents" },
  { key: "users", label: "User Management" },
  { key: "settings", label: "Settings" },
];

export function NavPermissionsSettings() {
  const { t } = useLanguage();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<NavPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rolesResult, permissionsResult] = await Promise.all([
        supabase.from("roles").select("id, name, slug, color").order("display_order"),
        supabase.from("role_nav_permissions").select("role_slug, nav_key"),
      ]);

      if (rolesResult.error) throw rolesResult.error;
      if (permissionsResult.error) throw permissionsResult.error;

      setRoles(rolesResult.data || []);
      setPermissions(permissionsResult.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load permissions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const hasPermission = (roleSlug: string, navKey: string) => {
    return permissions.some((p) => p.role_slug === roleSlug && p.nav_key === navKey);
  };

  const togglePermission = async (roleSlug: string, navKey: string) => {
    const key = `${roleSlug}-${navKey}`;
    setIsSaving(key);

    try {
      const exists = hasPermission(roleSlug, navKey);

      if (exists) {
        // Remove permission
        const { error } = await supabase
          .from("role_nav_permissions")
          .delete()
          .eq("role_slug", roleSlug)
          .eq("nav_key", navKey);

        if (error) throw error;

        setPermissions((prev) =>
          prev.filter((p) => !(p.role_slug === roleSlug && p.nav_key === navKey))
        );
        toast.success("Permission removed");
      } else {
        // Add permission
        const { error } = await supabase
          .from("role_nav_permissions")
          .insert({ role_slug: roleSlug, nav_key: navKey });

        if (error) throw error;

        setPermissions((prev) => [...prev, { role_slug: roleSlug, nav_key: navKey }]);
        toast.success("Permission added");
      }
    } catch (error: any) {
      console.error("Error toggling permission:", error);
      toast.error(error.message || "Failed to update permission");
    } finally {
      setIsSaving(null);
    }
  };

  return (
    <Card className="border-0 shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Navigation className="h-5 w-5 text-primary" />
          Navigation Permissions
        </CardTitle>
        <CardDescription>
          Control which navigation menu items each role can access
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : roles.length === 0 ? (
          <div className="text-center py-8">
            <Navigation className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No roles defined yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-semibold text-muted-foreground">
                    Navigation Item
                  </th>
                  {roles.map((role) => (
                    <th key={role.id} className="text-center py-3 px-2 min-w-[100px]">
                      <div className="flex items-center justify-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: role.color || "#6366f1" }}
                        />
                        <span className="font-semibold text-sm">{role.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {NAV_ITEMS.map((navItem) => (
                  <tr key={navItem.key} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-4 px-2 font-medium">{navItem.label}</td>
                    {roles.map((role) => {
                      const key = `${role.slug}-${navItem.key}`;
                      const isChecked = hasPermission(role.slug, navItem.key);
                      const isCurrentlySaving = isSaving === key;

                      return (
                        <td key={role.id} className="text-center py-4 px-2">
                          <div className="flex items-center justify-center">
                            {isCurrentlySaving ? (
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            ) : (
                              <Checkbox
                                id={key}
                                checked={isChecked}
                                onCheckedChange={() => togglePermission(role.slug, navItem.key)}
                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}