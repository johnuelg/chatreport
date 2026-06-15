import { useState } from "react";
import { useDomains, useAddDomain, useUpdateDomain, useDeleteDomain, Domain } from "@/hooks/useDomains";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, GripVertical, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DomainIconPicker, { getIconComponent } from "./DomainIconPicker";

const SettingsDomains = () => {
  const { data: domains, isLoading } = useDomains();
  const addDomain = useAddDomain();
  const updateDomain = useUpdateDomain();
  const deleteDomain = useDeleteDomain();

  const [form, setForm] = useState({ name: "", abbreviation: "", slug: "", color: "#6366f1", icon: "activity" });
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!form.name || !form.abbreviation || !form.slug) {
      toast({ title: "All fields required", variant: "destructive" });
      return;
    }
    try {
      await addDomain.mutateAsync({ ...form, sort_order: (domains?.length ?? 0) });
      setForm({ name: "", abbreviation: "", slug: "", color: "#6366f1", icon: "activity" });
      toast({ title: "Domain added" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      await updateDomain.mutateAsync({ id: editingId, ...form });
      setEditingId(null);
      setForm({ name: "", abbreviation: "", slug: "", color: "#6366f1", icon: "activity" });
      toast({ title: "Domain updated" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDomain.mutateAsync(id);
      toast({ title: "Domain deleted" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const startEdit = (d: Domain) => {
    setEditingId(d.id);
    setForm({ name: d.name, abbreviation: d.abbreviation, slug: d.slug, color: d.color, icon: d.icon || "activity" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: "", abbreviation: "", slug: "", color: "#6366f1", icon: "activity" });
  };

  const autoSlug = (name: string) => name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-heading font-bold text-foreground">Domains</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage document domains. These are used to categorize documents and assign users.</p>
      </div>

      {/* Add / Edit Form */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h3 className="font-heading font-bold text-base">{editingId ? "Edit Domain" : "Add New Domain"}</h3>
        <div className="grid grid-cols-5 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Name</label>
            <Input
              placeholder="e.g., Emergency Department"
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm({ ...form, name, slug: editingId ? form.slug : autoSlug(name) });
              }}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Abbreviation</label>
            <Input placeholder="e.g., ED" value={form.abbreviation} onChange={(e) => setForm({ ...form, abbreviation: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Slug</label>
            <Input placeholder="e.g., emergency-department" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Icon</label>
            <DomainIconPicker value={form.icon} onChange={(icon) => setForm({ ...form, icon })} color={form.color} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent" />
              <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="flex-1" />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {editingId ? (
            <>
              <Button size="sm" className="gap-2" onClick={handleUpdate}><Pencil className="w-3 h-3" /> Update Domain</Button>
              <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
            </>
          ) : (
            <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={handleAdd}><Plus className="w-3 h-3" /> Add Domain</Button>
          )}
        </div>
      </section>

      {/* Existing Domains */}
      <div className="space-y-3">
        <h3 className="font-heading font-bold text-base">Existing Domains</h3>
        {domains?.map((d) => (
          <div key={d.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:bg-secondary/30 transition-colors">
            <GripVertical className="w-4 h-4 text-muted-foreground/50" />
            {(() => { const Icon = getIconComponent(d.icon || "activity"); return <Icon className="w-5 h-5" style={{ color: d.color }} />; })()}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{d.name}</span>
                <Badge variant="outline" className="text-xs">{d.abbreviation}</Badge>
              </div>
              <span className="text-xs text-muted-foreground">{d.slug}</span>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(d)}>
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDelete(d.id)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SettingsDomains;
