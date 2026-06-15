import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Users, Pencil, Trash2, UserPlus, KeyRound, RefreshCw, Copy, Eye, EyeOff } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  useCustomRoles, useUserCustomRoles, useAssignCustomRole, useRemoveCustomRole,
  type CustomRole,
} from "@/hooks/useCustomRoles";
import { useDomains, type Domain } from "@/hooks/useDomains";
import { useUserDomains, useAssignDomain, useRemoveDomain } from "@/hooks/useUserDomains";

interface UserWithRole {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  is_admin: boolean;
}

const AVATAR_COLORS = [
  "hsl(var(--primary))",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
];

function getAvatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

const AdminUsers = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<UserWithRole | null>(null);
  const [editUser, setEditUser] = useState<UserWithRole | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRoleId, setEditRoleId] = useState<string>("");
  const [editDomainIds, setEditDomainIds] = useState<Set<string>>(new Set());
  const [allDomainsChecked, setAllDomainsChecked] = useState(true);
  const [editSaving, setEditSaving] = useState(false);
  const [resetPwOpen, setResetPwOpen] = useState(false);
  const [resetPwValue, setResetPwValue] = useState("");
  const [resetPwShow, setResetPwShow] = useState(false);
  const [resetPwSaving, setResetPwSaving] = useState(false);

  // Create form state
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createShowPw, setCreateShowPw] = useState(false);
  const [createRoleId, setCreateRoleId] = useState<string>("");
  const [createDomainIds, setCreateDomainIds] = useState<Set<string>>(new Set());
  const [createAllDomains, setCreateAllDomains] = useState(true);
  const [createSaving, setCreateSaving] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error: profilesErr } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, created_at");
      if (profilesErr) throw profilesErr;

      const { data: roles, error: rolesErr } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (rolesErr) throw rolesErr;

      const adminSet = new Set(
        roles?.filter((r) => r.role === "admin").map((r) => r.user_id) ?? []
      );

      return (profiles ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        avatar_url: p.avatar_url,
        created_at: p.created_at,
        is_admin: adminSet.has(p.id),
      })) as UserWithRole[];
    },
  });

  const { data: customRoles = [] } = useCustomRoles();
  const { data: userCustomRoles = [] } = useUserCustomRoles();
  const assignRole = useAssignCustomRole();
  const removeRole = useRemoveCustomRole();

  const { data: domains = [] } = useDomains();
  const { data: userDomains = [] } = useUserDomains();
  const assignDomain = useAssignDomain();
  const removeDomain = useRemoveDomain();

  const toggleRole = useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: "grant" | "revoke" }) => {
      if (action === "grant") {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" as const });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  const getUserRoleIds = (userId: string): Set<string> =>
    new Set(userCustomRoles.filter((ur) => ur.user_id === userId).map((ur) => ur.custom_role_id));

  const getUserDomainIds = (userId: string): Set<string> =>
    new Set(userDomains.filter((ud) => ud.user_id === userId).map((ud) => ud.domain_id));

  const getUserPrimaryRole = (userId: string, isAdmin: boolean): { name: string; color: string; id?: string } | null => {
    const roleIds = getUserRoleIds(userId);
    const assigned = customRoles.filter((r) => roleIds.has(r.id));
    if (assigned.length > 0) return assigned[0];
    if (isAdmin) {
      const adminRole = customRoles.find((r) => r.name === "Administrator");
      return adminRole ?? { name: "Admin", color: "#ec4899" };
    }
    return null;
  };

  const getRoleCount = (roleId: string) =>
    userCustomRoles.filter((ur) => ur.custom_role_id === roleId).length;

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (u.full_name?.toLowerCase().includes(q) ?? false) || (u.email?.toLowerCase().includes(q) ?? false) || u.id.toLowerCase().includes(q);
  });

  // Open edit dialog
  const openEdit = (u: UserWithRole) => {
    setEditUser(u);
    setEditName(u.full_name || "");
    setEditEmail(u.email || "");
    const roleIds = getUserRoleIds(u.id);
    const firstRole = customRoles.find((r) => roleIds.has(r.id));
    setEditRoleId(firstRole?.id || "");
    const domIds = getUserDomainIds(u.id);
    setEditDomainIds(new Set(domIds));
    setAllDomainsChecked(domIds.size === 0);
    setResetPwOpen(false);
    setResetPwValue("");
    setResetPwShow(false);
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!editUser) return;
    setEditSaving(true);
    try {
      // Update profile name
      await supabase.from("profiles").update({ full_name: editName.trim() } as any).eq("id", editUser.id);

      // Sync role: remove all existing, add selected
      const currentRoleIds = getUserRoleIds(editUser.id);
      for (const rid of currentRoleIds) {
        if (rid !== editRoleId) {
          await removeRole.mutateAsync({ user_id: editUser.id, custom_role_id: rid });
        }
      }
      if (editRoleId && !currentRoleIds.has(editRoleId)) {
        await assignRole.mutateAsync({ user_id: editUser.id, custom_role_id: editRoleId });
      }

      // Sync domains
      const currentDomIds = getUserDomainIds(editUser.id);
      const targetDomIds = allDomainsChecked ? new Set<string>() : editDomainIds;

      for (const did of currentDomIds) {
        if (!targetDomIds.has(did)) {
          await removeDomain.mutateAsync({ user_id: editUser.id, domain_id: did });
        }
      }
      for (const did of targetDomIds) {
        if (!currentDomIds.has(did)) {
          await assignDomain.mutateAsync({ user_id: editUser.id, domain_id: did });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "User updated" });
      setEditUser(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setEditSaving(false);
    }
  };

  const handleToggleEditDomain = (domainId: string) => {
    const next = new Set(editDomainIds);
    if (next.has(domainId)) {
      next.delete(domainId);
    } else {
      next.add(domainId);
    }
    setEditDomainIds(next);
    if (next.size > 0) setAllDomainsChecked(false);
  };

  const handleAllDomainsToggle = (checked: boolean) => {
    setAllDomainsChecked(checked);
    if (checked) {
      setEditDomainIds(new Set());
    }
  };

  // Create user helpers
  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pw = "";
    for (let i = 0; i < 12; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    setCreatePassword(pw);
  };

  const openCreateDialog = () => {
    setCreateName("");
    setCreateEmail("");
    setCreatePassword("");
    setCreateShowPw(false);
    setCreateRoleId("");
    setCreateDomainIds(new Set());
    setCreateAllDomains(true);
    setCreateOpen(true);
  };

  const handleCreateUser = async () => {
    if (!createEmail.trim() || !createPassword.trim()) {
      toast({ title: "Email and password are required", variant: "destructive" });
      return;
    }
    setCreateSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch(
        `https://dmnrgpdpqgudqgrrlhjc.supabase.co/functions/v1/admin-create-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtbnJncGRwcWd1ZHFncnJsaGpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MjYxMzIsImV4cCI6MjA5MDQwMjEzMn0.hzNvxq6RYsJ6S5coWglIumxlA9lYKy6kjGtJyqevwk4",
          },
          body: JSON.stringify({
            full_name: createName.trim(),
            email: createEmail.trim(),
            password: createPassword,
            role_id: createRoleId || null,
            domain_ids: createAllDomains ? [] : Array.from(createDomainIds),
          }),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create user");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["user-custom-roles"] });
      queryClient.invalidateQueries({ queryKey: ["user-domains"] });
      toast({ title: "User created successfully" });
      setCreateOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreateSaving(false);
    }
  };

  const handleToggleCreateDomain = (domainId: string) => {
    const next = new Set(createDomainIds);
    if (next.has(domainId)) next.delete(domainId); else next.add(domainId);
    setCreateDomainIds(next);
    if (next.size > 0) setCreateAllDomains(false);
  };

  const handleCreateAllDomainsToggle = (checked: boolean) => {
    setCreateAllDomains(checked);
    if (checked) setCreateDomainIds(new Set());
  };

  const UserDomainBadges = ({ userId }: { userId: string }) => {
    const domainIds = getUserDomainIds(userId);
    if (domainIds.size === 0) {
      return <Badge variant="outline" className="text-[10px]">All Domains</Badge>;
    }
    const assigned = domains.filter((d) => domainIds.has(d.id));
    const MAX_SHOW = 2;
    const shown = assigned.slice(0, MAX_SHOW);
    const remaining = assigned.length - MAX_SHOW;
    return (
      <div className="flex flex-wrap items-center gap-1">
        {shown.map((d) => (
          <Badge key={d.id} variant="outline" className="text-[10px] px-1.5 py-0 font-semibold" style={{ borderColor: d.color, color: d.color }}>
            {d.abbreviation}
          </Badge>
        ))}
        {remaining > 0 && <Badge variant="outline" className="text-[10px] px-1.5 py-0">+{remaining}</Badge>}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <div>
              <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground">User Management</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Create and manage user accounts with roles</p>
            </div>
          </div>
          <Button size="sm" className="gap-1.5" onClick={openCreateDialog}>
            <UserPlus className="w-4 h-4" /> Add User
          </Button>
        </div>

        {/* Role Stats Cards */}
        {customRoles.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {customRoles.map((role) => (
              <div key={role.id} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: role.color + "20", color: role.color }}>
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-heading font-bold">{getRoleCount(role.id)}</p>
                  <p className="text-xs text-muted-foreground">{role.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Users Table Card */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-bold text-lg">All Users</h2>
              <p className="text-xs text-muted-foreground">{users.length} users in the system</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-9" />
            </div>
          </div>

          {/* Mobile cards */}
          <div className="block sm:hidden px-4 pb-4 space-y-3">
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">No users found</p>
            ) : (
              filtered.map((u) => {
                const primaryRole = getUserPrimaryRole(u.id, u.is_admin);
                return (
                  <div key={u.id} className="rounded-xl border border-border/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: getAvatarColor(u.id) }}>
                          {getInitials(u.full_name)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{u.full_name || "Unnamed User"}</p>
                          <p className="text-[10px] text-muted-foreground">{u.email || "—"}</p>
                          <UserDomainBadges userId={u.id} />
                        </div>
                      </div>
                      {primaryRole && (
                        <Badge className="text-[10px] font-semibold border-0" style={{ backgroundColor: primaryRole.color, color: "#fff" }}>
                          {primaryRole.name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEdit(u)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {u.id !== user?.id && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteConfirm(u)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Domains</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Joined</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No users found</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((u) => {
                    const primaryRole = getUserPrimaryRole(u.id, u.is_admin);
                    return (
                      <TableRow key={u.id} className="border-border/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: getAvatarColor(u.id) }}>
                              {getInitials(u.full_name)}
                            </div>
                            <span className="font-medium text-sm">{u.full_name || "Unnamed User"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{u.email || "—"}</TableCell>
                        <TableCell><UserDomainBadges userId={u.id} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </TableCell>
                        <TableCell>
                          {primaryRole ? (
                            <Badge className="text-[11px] font-semibold border-0 px-3" style={{ backgroundColor: primaryRole.color, color: "#fff" }}>
                              {primaryRole.name}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEdit(u)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            {u.id !== user?.id && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteConfirm(u)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg">Edit User</DialogTitle>
            <DialogDescription>Update user information and role.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Full Name</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <Input value={editEmail} readOnly className="bg-muted/50 cursor-not-allowed" />
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Role</label>
              <Select value={editRoleId} onValueChange={setEditRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {customRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
                        {role.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Domains */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Domains</label>
              <div className="rounded-lg border border-border p-3 space-y-2 max-h-52 overflow-y-auto">
                {/* All Domains */}
                <label className="flex items-center gap-3 py-1 cursor-pointer">
                  <Checkbox
                    checked={allDomainsChecked}
                    onCheckedChange={(checked) => handleAllDomainsToggle(!!checked)}
                  />
                  <span className="text-sm font-medium">All Domains</span>
                </label>

                {domains.map((domain) => (
                  <label key={domain.id} className="flex items-center gap-3 py-1 cursor-pointer">
                    <Checkbox
                      checked={allDomainsChecked || editDomainIds.has(domain.id)}
                      disabled={allDomainsChecked}
                      onCheckedChange={() => handleToggleEditDomain(domain.id)}
                    />
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: domain.color }} />
                    <span className="text-sm">{domain.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Reset Password */}
            <div className="space-y-3 pt-1 border-t border-border">
              <button
                type="button"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setResetPwOpen(!resetPwOpen)}
              >
                <KeyRound className="w-4 h-4" />
                Reset Password
              </button>

              {resetPwOpen && (
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                  <label className="text-sm font-medium">New Password</label>
                  <div className="relative">
                    <Input
                      type={resetPwShow ? "text" : "password"}
                      value={resetPwValue}
                      onChange={(e) => setResetPwValue(e.target.value)}
                      placeholder="Enter new password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                      onClick={() => setResetPwShow(!resetPwShow)}
                    >
                      {resetPwShow ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setResetPwOpen(false); setResetPwValue(""); setResetPwShow(false); }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={!resetPwValue.trim() || resetPwSaving}
                      onClick={async () => {
                        if (!editUser || !resetPwValue.trim()) return;
                        setResetPwSaving(true);
                        try {
                          const { data: sessionData } = await supabase.auth.getSession();
                          const token = sessionData.session?.access_token;
                          const res = await fetch(
                            `https://dmnrgpdpqgudqgrrlhjc.supabase.co/functions/v1/admin-reset-password`,
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`,
                                apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtbnJncGRwcWd1ZHFncnJsaGpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MjYxMzIsImV4cCI6MjA5MDQwMjEzMn0.hzNvxq6RYsJ6S5coWglIumxlA9lYKy6kjGtJyqevwk4",
                              },
                              body: JSON.stringify({ user_id: editUser.id, password: resetPwValue }),
                            }
                          );
                          const result = await res.json();
                          if (!res.ok) throw new Error(result.error || "Failed to reset password");
                          toast({ title: "Password reset successfully" });
                          setResetPwOpen(false);
                          setResetPwValue("");
                          setResetPwShow(false);
                        } catch (err: any) {
                          toast({ title: "Error", description: err.message, variant: "destructive" });
                        } finally {
                          setResetPwSaving(false);
                        }
                      }}
                    >
                      {resetPwSaving ? "Resetting..." : "Confirm Reset"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={editSaving}>
              {editSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{deleteConfirm?.full_name || "this user"}" from the system? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (!deleteConfirm) return;
              try {
                const { data: sessionData } = await supabase.auth.getSession();
                const token = sessionData.session?.access_token;
                const res = await fetch(
                  `https://dmnrgpdpqgudqgrrlhjc.supabase.co/functions/v1/admin-delete-user`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                      apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtbnJncGRwcWd1ZHFncnJsaGpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MjYxMzIsImV4cCI6MjA5MDQwMjEzMn0.hzNvxq6RYsJ6S5coWglIumxlA9lYKy6kjGtJyqevwk4",
                    },
                    body: JSON.stringify({ user_id: deleteConfirm.id }),
                  }
                );
                const result = await res.json();
                if (!res.ok) throw new Error(result.error || "Failed to delete user");
                queryClient.invalidateQueries({ queryKey: ["admin-users"] });
                queryClient.invalidateQueries({ queryKey: ["user-custom-roles"] });
                queryClient.invalidateQueries({ queryKey: ["user-domains"] });
                toast({ title: "User deleted successfully" });
              } catch (err: any) {
                toast({ title: "Error", description: err.message, variant: "destructive" });
              } finally {
                setDeleteConfirm(null);
              }
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg">Create New User</DialogTitle>
            <DialogDescription>Add a new user to the system with specified role and credentials.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Full Name</label>
              <Input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="Dr. Ahmed Al-Rashid" />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} placeholder="user@hospital.com" />
            </div>

            {/* Temporary Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Temporary Password</label>
                <Button type="button" variant="ghost" size="sm" className="gap-1.5 h-7 text-xs text-primary" onClick={generatePassword}>
                  <RefreshCw className="w-3 h-3" /> Generate
                </Button>
              </div>
              <div className="relative">
                <Input
                  type={createShowPw ? "text" : "password"}
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  className="pr-20"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground"
                    onClick={() => {
                      navigator.clipboard.writeText(createPassword);
                      toast({ title: "Password copied" });
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground"
                    onClick={() => setCreateShowPw(!createShowPw)}
                  >
                    {createShowPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">User should change this password after first login.</p>
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Role</label>
              <Select value={createRoleId} onValueChange={setCreateRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {customRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
                        {role.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Domains */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Domains</label>
              <div className="rounded-lg border border-border p-3 space-y-2 max-h-52 overflow-y-auto">
                <label className="flex items-center gap-3 py-1 cursor-pointer">
                  <Checkbox checked={createAllDomains} onCheckedChange={(checked) => handleCreateAllDomainsToggle(!!checked)} />
                  <span className="text-sm font-medium">All Domains</span>
                </label>
                {domains.map((domain) => (
                  <label key={domain.id} className="flex items-center gap-3 py-1 cursor-pointer">
                    <Checkbox
                      checked={createAllDomains || createDomainIds.has(domain.id)}
                      disabled={createAllDomains}
                      onCheckedChange={() => handleToggleCreateDomain(domain.id)}
                    />
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: domain.color }} />
                    <span className="text-sm">{domain.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateUser} disabled={createSaving || !createEmail.trim() || !createPassword.trim()}>
              {createSaving ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminUsers;
