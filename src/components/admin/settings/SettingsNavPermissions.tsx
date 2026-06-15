import { useEffect, useState } from "react";
import { Navigation, Loader2, Save, CheckCircle2, Circle } from "lucide-react";
import { useCustomRoles, CustomRole } from "@/hooks/useCustomRoles";
import { useUpdateSiteSetting } from "@/hooks/useSiteSettings";
import { useNavPermissions } from "@/hooks/useNavPermissions";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "chat", label: "Chat Assistant" },
  { key: "bookmarks", label: "Bookmarks" },
  { key: "documents", label: "Documents" },
  { key: "users", label: "User Management" },
  { key: "settings", label: "Settings" },
];

type NavPermissions = Record<string, string[]>;

interface SettingsNavPermissionsProps {
  onSaveAll?: () => void;
  saving?: boolean;
}

const SettingsNavPermissions = ({ onSaveAll, saving }: SettingsNavPermissionsProps) => {
  const { data: roles, isLoading: rolesLoading } = useCustomRoles();
  const { data: savedPerms, isLoading: permsLoading } = useNavPermissions();
  const updateSetting = useUpdateSiteSetting();
  const [permissions, setPermissions] = useState<NavPermissions>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (savedPerms) {
      setPermissions(savedPerms);
    }
  }, [savedPerms]);

  const togglePermission = (navKey: string, roleId: string) => {
    setPermissions((prev) => {
      const current = prev[navKey] ?? [];
      const has = current.includes(roleId);
      return {
        ...prev,
        [navKey]: has ? current.filter((id) => id !== roleId) : [...current, roleId],
      };
    });
    setDirty(true);
  };

  const hasPermission = (navKey: string, roleId: string) => {
    return (permissions[navKey] ?? []).includes(roleId);
  };

  const handleSave = async () => {
    try {
      await updateSetting.mutateAsync({ key: "nav_permissions", value: permissions });
      setDirty(false);
      toast({ title: "Saved", description: "Navigation permissions updated successfully." });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    }
  };

  if (rolesLoading || permsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const displayRoles: CustomRole[] = roles ?? [];

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 sm:p-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <Navigation className="w-5 h-5 text-primary" />
          <h2 className="text-lg sm:text-xl font-heading font-bold text-foreground">
            Navigation Permissions
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Control which navigation menu items each role can access
        </p>
      </div>

      {displayRoles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No custom roles found. Create roles in the Roles tab first.
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto -mx-5 sm:-mx-8 px-5 sm:px-8">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="text-left py-3 pr-4 text-sm font-medium text-muted-foreground w-[180px]">
                    Navigation Item
                  </th>
                  {displayRoles.map((role) => (
                    <th key={role.id} className="text-center py-3 px-3 text-sm font-medium">
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: role.color }}
                        />
                        <span className="text-foreground">{role.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {NAV_ITEMS.map((nav, idx) => (
                  <tr
                    key={nav.key}
                    className={`border-b border-border/20 transition-colors hover:bg-muted/30 ${
                      idx % 2 === 0 ? "" : ""
                    }`}
                  >
                    <td className="py-4 pr-4 text-sm font-medium text-foreground">
                      {nav.label}
                    </td>
                    {displayRoles.map((role) => {
                      const checked = hasPermission(nav.key, role.id);
                      return (
                        <td key={role.id} className="text-center py-4 px-3">
                          <button
                            onClick={() => togglePermission(nav.key, role.id)}
                            className="inline-flex items-center justify-center transition-all duration-200 hover:scale-110"
                            aria-label={`${checked ? "Revoke" : "Grant"} ${role.name} access to ${nav.label}`}
                          >
                            {checked ? (
                              <CheckCircle2 className="w-6 h-6 text-primary" />
                            ) : (
                              <Circle className="w-6 h-6 text-border" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Save */}
          {dirty && (
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSave}
                disabled={updateSetting.isPending}
                className="gap-2"
              >
                {updateSetting.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Permissions
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SettingsNavPermissions;
