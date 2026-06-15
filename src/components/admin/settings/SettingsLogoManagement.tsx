import { useState } from "react";
import type { SiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Upload, Save, Image, Loader2 } from "lucide-react";

interface SettingsLogoManagementProps {
  logo: SiteSettings["logo"];
  onLogoChange: (value: SiteSettings["logo"]) => void;
  onSaveAll: () => Promise<void>;
  saving?: boolean;
}

const SettingsLogoManagement = ({
  logo,
  onLogoChange,
  onSaveAll,
  saving = false,
}: SettingsLogoManagementProps) => {
  const [uploading, setUploading] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `logo/site-logo.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("site-assets").upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(path);
      const newLogo = { ...logo, url: urlData.publicUrl };
      onLogoChange(newLogo);
      toast({ title: "Logo uploaded successfully" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Image className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-heading font-bold text-lg">Logo Management</h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-xl border border-border bg-secondary/50 flex items-center justify-center overflow-hidden">
            {logo.url ? (
              <img src={logo.url} alt={logo.alt} className="w-full h-full object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-heading font-bold text-sm">T</span>
              </div>
            )}
          </div>
          <div className="space-y-2 flex-1">
            <label className="relative cursor-pointer">
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <span>{uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Upload Logo</span>
              </Button>
            </label>
            <Input placeholder="Alt text" value={logo.alt} onChange={(e) => onLogoChange({ ...logo, alt: e.target.value })} className="text-sm" />
          </div>
        </div>
        <Button size="sm" className="gap-2" onClick={onSaveAll} disabled={saving || uploading}>
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save All Changes
        </Button>
      </section>
    </div>
  );
};

export default SettingsLogoManagement;
