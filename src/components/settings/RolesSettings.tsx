import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Plus, Pencil, Trash2, Loader2, Lock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Role {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  is_system: boolean;
  display_order: number;
  created_at: string;
}

const PRESET_COLORS = [
  "#dc2626", // red
  "#ea580c", // orange
  "#ca8a04", // yellow
  "#16a34a", // green
  "#0891b2", // cyan
  "#2563eb", // blue
  "#7c3aed", // violet
  "#c026d3", // fuchsia
  "#6b7280", // gray
];

export function RolesSettings() {
  const { t } = useLanguage();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[5]);

  const fetchRoles = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("roles")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching roles:", error);
      toast.error("Failed to load roles");
    } else {
      setRoles(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const resetForm = () => {
    setName("");
    setSlug("");
    setDescription("");
    setColor(PRESET_COLORS[5]);
    setEditingRole(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (role: Role) => {
    setEditingRole(role);
    setName(role.name);
    setSlug(role.slug);
    setDescription(role.description || "");
    setColor(role.color || PRESET_COLORS[5]);
    setIsDialogOpen(true);
  };

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!editingRole) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Role name is required");
      return;
    }

    if (!slug.trim()) {
      toast.error("Role slug is required");
      return;
    }

    setIsSaving(true);

    try {
      if (editingRole) {
        // Update existing role
        const { error } = await supabase
          .from("roles")
          .update({
            name: name.trim(),
            slug: slug.trim(),
            description: description.trim() || null,
            color,
          })
          .eq("id", editingRole.id);

        if (error) throw error;
        toast.success("Role updated successfully");
      } else {
        // Create new role
        const maxOrder = Math.max(...roles.map((r) => r.display_order), 0);
        const { error } = await supabase.from("roles").insert({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          color,
          display_order: maxOrder + 1,
        });

        if (error) throw error;
        toast.success("Role created successfully");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchRoles();
    } catch (error: any) {
      console.error("Error saving role:", error);
      if (error.message?.includes("duplicate")) {
        toast.error("A role with this name or slug already exists");
      } else {
        toast.error(error.message || "Failed to save role");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (role: Role) => {
    if (role.is_system) {
      toast.error("System roles cannot be deleted");
      return;
    }

    setDeletingId(role.id);

    try {
      // Check if any users have this role
      const { data: usersWithRole, error: checkError } = await supabase
        .from("user_roles")
        .select("id")
        .eq("role", role.slug as any)
        .limit(1);

      if (checkError) throw checkError;

      if (usersWithRole && usersWithRole.length > 0) {
        toast.error("Cannot delete role: users are assigned to this role");
        return;
      }

      const { error } = await supabase.from("roles").delete().eq("id", role.id);

      if (error) throw error;

      toast.success("Role deleted successfully");
      fetchRoles();
    } catch (error: any) {
      console.error("Error deleting role:", error);
      toast.error(error.message || "Failed to delete role");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="border-0 shadow-elegant">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-display">
              <Shield className="h-5 w-5 text-primary" />
              Roles Management
            </CardTitle>
            <CardDescription>
              Create and manage user roles that appear in User Management
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Role
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle className="font-display">
                    {editingRole ? "Edit Role" : "Create New Role"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingRole
                      ? "Update the role details below"
                      : "Define a new role for user assignment"}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="role-name">Role Name</Label>
                    <Input
                      id="role-name"
                      placeholder="e.g., Nurse, Technician"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      disabled={editingRole?.is_system}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role-slug">
                      Slug{" "}
                      <span className="text-xs text-muted-foreground">
                        (unique identifier)
                      </span>
                    </Label>
                    <Input
                      id="role-slug"
                      placeholder="e.g., nurse, technician"
                      value={slug}
                      onChange={(e) => setSlug(generateSlug(e.target.value))}
                      disabled={editingRole?.is_system}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role-description">Description</Label>
                    <Textarea
                      id="role-description"
                      placeholder="Brief description of this role's permissions"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                            color === c
                              ? "border-foreground scale-110"
                              : "border-transparent"
                          }`}
                          style={{ backgroundColor: c }}
                          onClick={() => setColor(c)}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="gradient-primary"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : editingRole ? (
                      "Save Changes"
                    ) : (
                      "Create Role"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : roles.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No roles defined yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {roles.map((role) => (
              <div
                key={role.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: role.color || "#6366f1" }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{role.name}</span>
                      {role.is_system && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          <Lock className="h-3 w-3" />
                          System
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {role.description || `Slug: ${role.slug}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(role)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  {!role.is_system && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={deletingId === role.id}
                        >
                          {deletingId === role.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Role</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the role "
                            <strong>{role.name}</strong>"? This action cannot be
                            undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(role)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete Role
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
