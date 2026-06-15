import { useEffect, useState } from "react";
import { Loader2, Save, Sparkles, Eye, EyeOff, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useUserAiSettings, useSaveUserAiSettings } from "@/hooks/useUserAiSettings";

const SettingsAiProvider = () => {
  const { data, isLoading } = useUserAiSettings();
  const save = useSaveUserAiSettings();
  const [usePersonal, setUsePersonal] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (data) {
      setUsePersonal(data.use_personal_key);
      setApiKey(data.gemini_api_key);
    }
  }, [data]);

  const handleSave = async () => {
    try {
      await save.mutateAsync({
        use_personal_key: usePersonal,
        gemini_api_key: apiKey.trim(),
      });
      toast({ title: "AI settings saved" });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 sm:p-6 space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-primary" />
        <div>
          <h2 className="text-base font-heading font-bold text-foreground">AI Provider</h2>
          <p className="text-xs text-muted-foreground">
            Use the built-in AI or bring your own Google Gemini API key.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between bg-secondary/40 rounded-xl p-4">
        <div>
          <Label className="text-sm font-semibold">Use my own Gemini API key</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            When off, requests use the shared workspace AI.
          </p>
        </div>
        <Switch checked={usePersonal} onCheckedChange={setUsePersonal} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gemini-key" className="text-sm">
          Google Gemini API Key
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="gemini-key"
              type={show ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza..."
              className="pr-10 font-mono text-sm"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Get a Gemini API key <ExternalLink className="w-3 h-3" />
        </a>
        <p className="text-xs text-muted-foreground">
          Your key is stored securely and only used for your own requests.
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={save.isPending} className="gap-2">
          {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </Button>
      </div>
    </div>
  );
};

export default SettingsAiProvider;
