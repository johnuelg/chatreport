import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Users as UsersIcon, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { CreateUserDialog } from "@/components/users/CreateUserDialog";
import { EditUserDialog } from "@/components/users/EditUserDialog";

interface Role {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

interface Domain {
  id: string;
  name: string;
  slug: string;
  color: string;
  abbreviation: string | null;
}

interface UserDomain {
  user_id: string;
  domain_id: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  created_at: string;
  role: string;
  domain_ids: string[];
}

export default function Users() {
  const { isAdmin, loading: authLoading, user: currentUser, session } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [userDomains, setUserDomains] = useState<UserDomain[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    const { data, error } = await supabase
      .from("roles")
      .select("id, name, slug, color")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching roles:", error);
    } else {
      setRoles(data || []);
    }
  }, []);

  const fetchDomains = useCallback(async () => {
    const { data, error } = await supabase
      .from("domains")
      .select("id, name, slug, color, abbreviation")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching domains:", error);
    } else {
      setDomains(data || []);
    }
  }, []);

  const fetchUserDomains = useCallback(async () => {
    const { data, error } = await supabase
      .from("user_domains")
      .select("user_id, domain_id");

    if (error) {
      console.error("Error fetching user domains:", error);
    } else {
      setUserDomains(data || []);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      toast.error("Failed to load users");
      setIsLoading(false);
      return;
    }

    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("*");

    if (rolesError) {
      console.error("Error fetching roles:", rolesError);
    }

    const { data: userDomainsData, error: userDomainsError } = await supabase
      .from("user_domains")
      .select("user_id, domain_id");

    if (userDomainsError) {
      console.error("Error fetching user domains:", userDomainsError);
    } else {
      setUserDomains(userDomainsData || []);
    }

    const usersWithRoles = (profiles || []).map((profile) => {
      const userRole = userRoles?.find((r) => r.user_id === profile.user_id);
      const userDomainIds = (userDomainsData || [])
        .filter((ud) => ud.user_id === profile.user_id)
        .map((ud) => ud.domain_id);
      return {
        ...profile,
        role: userRole?.role || "",
        domain_ids: userDomainIds,
      };
    });

    setUsers(usersWithRoles);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/dashboard");
      return;
    }
    
    if (isAdmin) {
      fetchRoles();
      fetchDomains();
      fetchUsers();
    }
  }, [isAdmin, authLoading, navigate, fetchUsers, fetchRoles, fetchDomains]);

  const handleDeleteUser = async (userId: string, userName: string) => {
    setDeletingUserId(userId);

    try {
      if (!session?.access_token) {
        toast.error("Your session expired. Please sign in again.");
        try {
          await supabase.auth.signOut();
        } catch {
          // ignore
        }
        navigate("/auth");
        return;
      }

      const response = await supabase.functions.invoke("admin-delete-user", {
        body: { userId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const contextBody = (response.error as any)?.context?.body;
      const contextStatus = (response.error as any)?.context?.status;
      let contextError: string | undefined;

      if (typeof contextBody === "string") {
        try {
          contextError = JSON.parse(contextBody)?.error;
        } catch {
          // ignore
        }
      } else if (contextBody && typeof contextBody === "object") {
        contextError = (contextBody as any)?.error;
      }

      const errorMessage =
        response.data?.error ||
        contextError ||
        response.error?.message ||
        (contextStatus ? `Request failed (${contextStatus})` : undefined);

      if (response.error || response.data?.error) {
        throw new Error(errorMessage || "Failed to delete user");
      }

      setUsers((prev) => prev.filter((u) => u.user_id !== userId));
      toast.success(`User "${userName}" deleted successfully`);
    } catch (error: any) {
      const message = error?.message || "Failed to delete user";
      console.error("Error deleting user:", error);

      if (/invalid token|no authorization header|session not found/i.test(message)) {
        toast.error("Your session expired. Please sign in again.");
        try {
          await supabase.auth.signOut();
        } catch {
          // ignore
        }
        navigate("/auth");
        return;
      }

      toast.error(message);
    } finally {
      setDeletingUserId(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = !selectedRoleFilter || user.role === selectedRoleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserDomains = (domainIds: string[]) => {
    return domains.filter((d) => domainIds.includes(d.id));
  };

  const getRoleCounts = () => {
    return roles.map((role) => ({
      ...role,
      count: users.filter((u) => u.role === role.slug).length,
    }));
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const roleCounts = getRoleCounts();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <UsersIcon className="h-6 w-6 text-primary" />
              User Management
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Create and manage user accounts with roles
            </p>
          </div>
          <CreateUserDialog onUserCreated={fetchUsers} />
        </div>

        {/* Dynamic Role Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {roleCounts.map((roleItem, index) => {
            const isSelected = selectedRoleFilter === roleItem.slug;
            return (
              <Card
                key={roleItem.id}
                className={`border-0 shadow-elegant animate-slide-up cursor-pointer transition-all hover:scale-105 ${
                  isSelected ? "ring-2 ring-primary" : ""
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => setSelectedRoleFilter(isSelected ? null : roleItem.slug)}
              >
                <CardContent className="pt-6 pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2.5 rounded-lg text-white"
                      style={{ backgroundColor: roleItem.color || "#6366f1" }}
                    >
                      <UsersIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xl font-display font-bold text-foreground">
                        {roleItem.count}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {roleItem.name}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Active Role Filter Badge */}
        {selectedRoleFilter && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtering by:</span>
            <Badge
              variant="secondary"
              className="cursor-pointer"
              onClick={() => setSelectedRoleFilter(null)}
            >
              {roles.find((r) => r.slug === selectedRoleFilter)?.name || selectedRoleFilter}
              <span className="ml-1">×</span>
            </Badge>
          </div>
        )}

        {/* Users Table */}
        <Card className="border-0 shadow-elegant">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="font-display">All Users</CardTitle>
                <CardDescription>
                  {filteredUsers.length} users {selectedRoleFilter ? "matching filter" : "in the system"}
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <UsersIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-foreground">No users found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery || selectedRoleFilter ? "Try a different filter" : "No users have registered yet"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Domains</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user, index) => {
                      const roleInfo = roles.find((r) => r.slug === user.role);
                      const userDomainsList = getUserDomains(user.domain_ids);
                      return (
                        <TableRow
                          key={user.id}
                          className="animate-fade-in"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback className="gradient-primary text-primary-foreground">
                                  {getInitials(user.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{user.full_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {user.email}
                          </TableCell>
                          <TableCell>
                            {userDomainsList.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {userDomainsList.length === domains.length ? (
                                  <Badge variant="outline" className="text-xs">
                                    All Domains
                                  </Badge>
                                ) : (
                                  userDomainsList.slice(0, 2).map((domain) => (
                                    <Badge
                                      key={domain.id}
                                      variant="outline"
                                      className="text-xs"
                                      style={{ 
                                        borderColor: domain.color,
                                        color: domain.color 
                                      }}
                                    >
                                      {domain.abbreviation || domain.name}
                                    </Badge>
                                  ))
                                )}
                                {userDomainsList.length > 2 && userDomainsList.length !== domains.length && (
                                  <Badge variant="outline" className="text-xs">
                                    +{userDomainsList.length - 2}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(user.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className="text-white"
                              style={{ backgroundColor: roleInfo?.color || "#6b7280" }}
                            >
                              {roleInfo?.name || user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <EditUserDialog
                                user={user}
                                onUserUpdated={fetchUsers}
                                disabled={deletingUserId === user.user_id}
                              />
                              
                              {user.user_id !== currentUser?.id && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                      disabled={deletingUserId === user.user_id}
                                    >
                                      {deletingUserId === user.user_id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete User</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete <strong>{user.full_name}</strong>? This action cannot be undone and will permanently remove the user account and all associated data.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteUser(user.user_id, user.full_name)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete User
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}