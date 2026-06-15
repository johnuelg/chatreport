import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  useCustomRoles, useCreateCustomRole, useUpdateCustomRole, useDeleteCustomRole,
  type CustomRole,
} from "@/hooks/useCustomRoles";

const ROLE_COLORS = [
  "#ec4899", "#3b82f6", "#10b981", "#6b7280", "#f59e0b",
  "#ef4444", "#8b5cf6", "#14b8a6", "#f97316", "#6366f1",
];

const SettingsRoles = () => {
  const { data: roles = [], isLoading } = useCustomRoles();
  const createRole = useCreateCustomRole();
  const updateRole = useUpdateCustomRole();
  const deleteRole = useDeleteCustomRole();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [roleColor, setRoleColor] = useState(ROLE_COLORS[0]);
  const [deleteConfirm, setDeleteConfirm] = useState<CustomRole | null>(null);

  const openCreate = () => {
    setEditingRole(null);
    setRoleName("");
    setRoleDescription("");
    setRoleColor(ROLE_COLORS[Math.floor(Math.random() * ROLE_COLORS.length)]);
    setDialogOpen(true);
  };

  const openEdit = (role: CustomRole) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || "");
    setRoleColor(role.color);
    setDialogOpen(true);
  };

  const handleSaveRole = async () => {
    if (!roleName.trim()) return;
    try {
      if (editingRole) {
        await updateRole.mutateAsync({ id: editingRole.id, name: roleName.trim(), color: roleColor, description: roleDescription.trim() });
        toast({ title: "Role updated" });
      } else {
        await createRole.mutateAsync({ name: roleName.trim(), color: roleColor, description: roleDescription.trim() });
        toast({ title: "Role created" });
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteRole.mutateAsync(deleteConfirm.id);
      toast({ title: "Role deleted" });
      setDeleteConfirm(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg">Roles Management</h2>
              <p className="text-sm text-muted-foreground">Create and manage user roles that appear in User Management</p>
            </div>
          </div>
          <Button size="sm" className="gap-1.5" onClick={openCreate}>
            <Plus className="w-3.5 h-3.5" /> Add Role
          </Button>
        </div>
      </div>

      {/* Roles List */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : roles.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No roles created yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {roles.map((role) => (
            <div
              key={role.id}
              className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: role.color }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-sm">{role.name}</span>
                    {role.is_system && (
                      <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0 h-5 font-normal text-muted-foreground border-border">
                        <Lock className="w-2.5 h-2.5" /> System
                      </Badge>
                    )}
                  </div>
                  {role.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  onClick={() => openEdit(role)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                {!role.is_system && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteConfirm(role)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Create Role"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role Name</label>
              <Input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="e.g. Pharmacist" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input value={roleDescription} onChange={(e) => setRoleDescription(e.target.value)} placeholder="e.g. Hospital Pharmacist" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <div className="flex flex-wrap gap-2">
                {ROLE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${roleColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setRoleColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRole} disabled={!roleName.trim() || createRole.isPending || updateRole.isPending}>
              {(createRole.isPending || updateRole.isPending) && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
              {editingRole ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{deleteConfirm?.name}"? All users with this role will have it removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SettingsRoles;
