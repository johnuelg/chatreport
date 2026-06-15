import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  clearSupabaseConnectionConfig,
  getSupabaseConnectionConfig,
  saveSupabaseConnectionConfig,
} from "@/integrations/supabase/client";

const isValidUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
};

export function DatabaseConnectionSettings() {
  const activeConfig = getSupabaseConnectionConfig();
  const [url, setUrl] = useState(activeConfig.url);
  const [publishableKey, setPublishableKey] = useState(activeConfig.publishableKey);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const trimmedUrl = url.trim();
    const trimmedKey = publishableKey.trim();

    if (!trimmedUrl || !trimmedKey) {
      toast.error("Supabase URL and publishable key are required");
      return;
    }

    if (!isValidUrl(trimmedUrl)) {
      toast.error("Please enter a valid https:// Supabase URL");
      return;
    }

    setIsSaving(true);
    try {
      saveSupabaseConnectionConfig({
        url: trimmedUrl,
        publishableKey: trimmedKey,
      });

      toast.success("Database connection updated. Reloading app...");
      window.location.reload();
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    clearSupabaseConnectionConfig();
    toast.success("Connection reset to Lovable Cloud. Reloading app...");
    window.location.reload();
  };

  return (
    <Card className="border-0 shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Database className="h-5 w-5 text-primary" />
          Database Connection
        </CardTitle>
        <CardDescription>
          Switch this app between Lovable Cloud and your own Supabase project using URL + publishable key.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="supabase-url">Supabase URL</Label>
          <Input
            id="supabase-url"
            placeholder="https://your-project-ref.supabase.co"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="supabase-key">Publishable / anon key</Label>
          <Input
            id="supabase-key"
            placeholder="sb_publishable_..."
            value={publishableKey}
            onChange={(e) => setPublishableKey(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save and reconnect"}
          </Button>

          <Button type="button" variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Lovable Cloud
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}