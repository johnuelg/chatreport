import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Trash2, GripVertical, Pencil, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Domain {
  id: string;
  name: string;
  slug: string;
  color: string;
  abbreviation: string | null;
  description: string | null;
  display_order: number;
}

export function DomainsSettings() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState({ name: "", slug: "", abbreviation: "", color: "#6366f1" });
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ name: "", abbreviation: "", color: "" });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDomains = async () => {
    try {
      const { data, error } = await supabase
        .from("domains")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setDomains(data || []);
    } catch (error) {
      console.error("Error fetching domains:", error);
      toast.error("Failed to load domains");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const handleAddDomain = async () => {
    if (!newDomain.name.trim() || !newDomain.slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }

    setAdding(true);
    try {
      const { error } = await supabase.from("domains").insert({
        name: newDomain.name.trim(),
        slug: newDomain.slug.trim().toLowerCase().replace(/\s+/g, "-"),
        abbreviation: newDomain.abbreviation.trim() || null,
        color: newDomain.color,
        display_order: domains.length,
      });

      if (error) throw error;

      toast.success("Domain added successfully");
      setNewDomain({ name: "", slug: "", abbreviation: "", color: "#6366f1" });
      fetchDomains();
    } catch (error: any) {
      console.error("Error adding domain:", error);
      if (error.code === "23505") {
        toast.error("A domain with this slug already exists");
      } else {
        toast.error("Failed to add domain");
      }
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteDomain = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from("domains").delete().eq("id", id);

      if (error) throw error;

      toast.success("Domain deleted successfully");
      fetchDomains();
    } catch (error) {
      console.error("Error deleting domain:", error);
      toast.error("Failed to delete domain");
    } finally {
      setDeletingId(null);
    }
  };

  const startEditing = (domain: Domain) => {
    setEditingId(domain.id);
    setEditValues({ name: domain.name, abbreviation: domain.abbreviation || "", color: domain.color });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValues({ name: "", abbreviation: "", color: "" });
  };

  const handleSaveEdit = async (id: string) => {
    if (!editValues.name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      const { error } = await supabase
        .from("domains")
        .update({ 
          name: editValues.name.trim(), 
          abbreviation: editValues.abbreviation.trim() || null,
          color: editValues.color 
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Domain updated successfully");
      setEditingId(null);
      fetchDomains();
    } catch (error) {
      console.error("Error updating domain:", error);
      toast.error("Failed to update domain");
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Domains</CardTitle>
        <CardDescription>
          Manage document domains. These are used to categorize documents and assign users.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new domain */}
        <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/50">
          <h4 className="font-medium">Add New Domain</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="domain-name">Name</Label>
              <Input
                id="domain-name"
                placeholder="e.g., Emergency Department"
                value={newDomain.name}
                onChange={(e) => {
                  setNewDomain({
                    ...newDomain,
                    name: e.target.value,
                    slug: generateSlug(e.target.value),
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain-abbreviation">Abbreviation</Label>
              <Input
                id="domain-abbreviation"
                placeholder="e.g., ED"
                value={newDomain.abbreviation}
                onChange={(e) => setNewDomain({ ...newDomain, abbreviation: e.target.value })}
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain-slug">Slug</Label>
              <Input
                id="domain-slug"
                placeholder="e.g., emergency-department"
                value={newDomain.slug}
                onChange={(e) => setNewDomain({ ...newDomain, slug: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain-color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="domain-color"
                  type="color"
                  className="w-12 h-10 p-1 cursor-pointer"
                  value={newDomain.color}
                  onChange={(e) => setNewDomain({ ...newDomain, color: e.target.value })}
                />
                <Input
                  value={newDomain.color}
                  onChange={(e) => setNewDomain({ ...newDomain, color: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <Button onClick={handleAddDomain} disabled={adding} className="w-fit">
            <Plus className="h-4 w-4 mr-2" />
            {adding ? "Adding..." : "Add Domain"}
          </Button>
        </div>

        {/* Existing domains */}
        <div className="space-y-2">
          <h4 className="font-medium">Existing Domains</h4>
          {domains.length === 0 ? (
            <p className="text-muted-foreground text-sm">No domains created yet.</p>
          ) : (
            <div className="space-y-2">
              {domains.map((domain) => (
                <div
                  key={domain.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-background"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    {editingId === domain.id ? (
                      <>
                        <Input
                          type="color"
                          className="w-8 h-8 p-0.5 cursor-pointer"
                          value={editValues.color}
                          onChange={(e) => setEditValues({ ...editValues, color: e.target.value })}
                        />
                        <Input
                          value={editValues.name}
                          onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                          className="max-w-[180px]"
                          placeholder="Name"
                          autoFocus
                        />
                        <Input
                          value={editValues.abbreviation}
                          onChange={(e) => setEditValues({ ...editValues, abbreviation: e.target.value })}
                          className="w-20"
                          placeholder="Abbr"
                          maxLength={10}
                        />
                      </>
                    ) : (
                      <>
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: domain.color }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{domain.name}</p>
                            {domain.abbreviation && (
                              <Badge 
                                variant="outline" 
                                className="text-xs"
                                style={{ borderColor: domain.color, color: domain.color }}
                              >
                                {domain.abbreviation}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{domain.slug}</p>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {editingId === domain.id ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSaveEdit(domain.id)}
                          className="text-primary hover:text-primary"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={cancelEditing}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditing(domain)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              disabled={deletingId === domain.id}
                            >
                              {deletingId === domain.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Domain</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{domain.name}"? Documents and users using this domain will be unassigned. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteDomain(domain.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
