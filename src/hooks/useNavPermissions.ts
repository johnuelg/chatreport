import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useSiteSettings";
import { useLocation } from "react-router-dom";

type NavPermissions = Record<string, string[]>;

/** Ordered list of nav paths for permission lookups and landing page resolution */
const NAV_PATHS_ORDERED = [
  { path: "/admin", key: "dashboard" },
  { path: "/admin/chat", key: "chat" },
  { path: "/admin/bookmarks", key: "bookmarks" },
  { path: "/admin/documents", key: "documents" },
  { path: "/admin/users", key: "users" },
  { path: "/admin/settings", key: "settings" },
];

/** Path-to-key mapping for nav permission lookups */
const PATH_TO_KEY: Record<string, string> = Object.fromEntries(
  NAV_PATHS_ORDERED.map(({ path, key }) => [path, key])
);

export function useNavPermissions() {
  return useQuery({
    queryKey: ["nav-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "nav_permissions")
        .maybeSingle();
      if (error) throw error;
      return (data?.value as NavPermissions) ?? {};
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUserCustomRoleIds() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-custom-role-ids", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_custom_roles")
        .select("custom_role_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r: any) => r.custom_role_id as string);
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Returns a filter function that checks if a nav path is allowed for the current user.
 * Admins always see everything. For other users, checks their custom roles against nav_permissions.
 * If no permissions are configured yet, all items are shown.
 */
export function useNavItemFilter(isAdmin: boolean) {
  const { data: permissions } = useNavPermissions();
  const { data: userRoleIds } = useUserCustomRoleIds();

  return (path: string): boolean => {
    if (isAdmin) return true;
    if (!permissions || Object.keys(permissions).length === 0) return true;

    const key = PATH_TO_KEY[path];
    if (!key) return true;

    const allowedRoleIds = permissions[key];
    if (!allowedRoleIds || allowedRoleIds.length === 0) return true;

    if (!userRoleIds || userRoleIds.length === 0) return false;
    return userRoleIds.some((roleId) => allowedRoleIds.includes(roleId));
  };
}

/**
 * Checks whether the current route is allowed for the user.
 * Returns { allowed: boolean, loading: boolean }.
 */
export function useRoutePermissionCheck() {
  const location = useLocation();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: permissions, isLoading: permsLoading } = useNavPermissions();
  const { data: userRoleIds, isLoading: rolesLoading } = useUserCustomRoleIds();

  const loading = adminLoading || permsLoading || rolesLoading;

  // Admins always allowed
  if (isAdmin) return { allowed: true, loading };

  // While loading, don't block
  if (loading) return { allowed: true, loading: true };

  // If no permissions configured, allow all
  if (!permissions || Object.keys(permissions).length === 0) return { allowed: true, loading: false };

  const path = location.pathname;
  const key = PATH_TO_KEY[path];
  if (!key) return { allowed: true, loading: false };

  const allowedRoleIds = permissions[key];
  if (!allowedRoleIds || allowedRoleIds.length === 0) return { allowed: true, loading: false };

  if (!userRoleIds || userRoleIds.length === 0) return { allowed: false, loading: false };
  const allowed = userRoleIds.some((roleId) => allowedRoleIds.includes(roleId));
  return { allowed, loading: false };
}

/**
 * Returns the first permitted admin path for the current user.
 * Admins always get "/admin". Non-admins get the first path their role allows.
 */
export function useFirstPermittedPath() {
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: permissions, isLoading: permsLoading } = useNavPermissions();
  const { data: userRoleIds, isLoading: rolesLoading } = useUserCustomRoleIds();

  const loading = adminLoading || permsLoading || rolesLoading;

  if (loading) return { path: null, loading: true };
  if (isAdmin) return { path: "/admin", loading: false };

  // No permissions configured → default dashboard
  if (!permissions || Object.keys(permissions).length === 0) return { path: "/admin", loading: false };

  for (const { path, key } of NAV_PATHS_ORDERED) {
    const allowedRoleIds = permissions[key];
    if (!allowedRoleIds || allowedRoleIds.length === 0) return { path, loading: false };
    if (userRoleIds?.some((roleId) => allowedRoleIds.includes(roleId))) return { path, loading: false };
  }

  // No permitted page found
  return { path: null, loading: false };
}
