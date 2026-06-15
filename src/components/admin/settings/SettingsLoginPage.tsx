import type { SiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Upload, Save, Image, Type, Loader2 } from "lucide-react";
import { useState } from "react";

interface SettingsLoginPageProps {
  loginPage: SiteSettings["login_page"];
  onChange: (value: SiteSettings["login_page"]) => void;
  onSaveAll: () => Promise<void>;
  saving?: boolean;
}

const SettingsLoginPage = ({ loginPage, onChange, onSaveAll, saving = false }: SettingsLoginPageProps) => {
  const [uploadingBg, setUploadingBg] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleUpload = async (
    file: File,
    pathPrefix: string,
    field: "bg_image" | "logo",
    setUploading: (v: boolean) => void
  ) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `login/${pathPrefix}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("site-assets")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(path);
      const updated = { ...loginPage, [field]: urlData.publicUrl };
      onChange(updated);
      toast({ title: `${field === "bg_image" ? "Background" : "Logo"} uploaded successfully` });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Background Image */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Image className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-heading font-bold text-lg">Background Image</h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="w-32 h-20 rounded-xl border border-border bg-secondary/50 flex items-center justify-center overflow-hidden">
            {loginPage.bg_image ? (
              <img src={loginPage.bg_image} alt="Login BG" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-muted-foreground">No image</span>
            )}
          </div>
          <label className="relative cursor-pointer">
            <input type="file" accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f, "bg-image", "bg_image", setUploadingBg);
            }} className="hidden" />
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <span>{uploadingBg ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Upload Background</span>
            </Button>
          </label>
        </div>
      </section>

      {/* Login Logo */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Image className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-heading font-bold text-lg">Login Logo</h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-xl border border-border bg-secondary/50 flex items-center justify-center overflow-hidden">
            {loginPage.logo ? (
              <img src={loginPage.logo} alt="Login Logo" className="w-full h-full object-contain" />
            ) : (
              <span className="text-xs text-muted-foreground">No logo</span>
            )}
          </div>
          <label className="relative cursor-pointer">
            <input type="file" accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f, "login-logo", "logo", setUploadingLogo);
            }} className="hidden" />
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <span>{uploadingLogo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Upload Logo</span>
            </Button>
          </label>
        </div>
      </section>

      {/* Title */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Type className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-heading font-bold text-lg">Login Page Title</h2>
        </div>
        <div className="grid gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Title (English)</label>
            <Input value={loginPage.title_en} onChange={(e) => onChange({ ...loginPage, title_en: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Title (Arabic)</label>
            <Input value={loginPage.title_ar} onChange={(e) => onChange({ ...loginPage, title_ar: e.target.value })} dir="rtl" />
          </div>
        </div>
      </section>

      <Button size="sm" className="gap-2" onClick={onSaveAll} disabled={saving}>
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save All Changes
      </Button>
    </div>
  );
};

export default SettingsLoginPage;
