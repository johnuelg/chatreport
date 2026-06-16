import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Eye, FileText, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Document } from "@/hooks/useDocuments";

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versions: Document[];
  fileName: string;
}

const VersionHistoryDialog = ({ open, onOpenChange, versions, fileName }: Props) => {
  const sorted = [...versions].sort((a, b) => (b as any).version - (a as any).version);

  const handlePreview = async (doc: Document) => {
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.file_path, 60);

    if (error || !data?.signedUrl) {
      toast({ title: "Preview failed", description: error?.message ?? "Could not generate secure preview link", variant: "destructive" });
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownload = async (doc: Document) => {
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.file_path, 60);

    if (error || !data?.signedUrl) {
      toast({ title: "Download failed", description: error?.message ?? "Could not generate secure download link", variant: "destructive" });
      return;
    }

    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = doc.file_name;
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Clock className="h-5 w-5 text-primary" />
            Version History
          </DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{fileName}</p>
        </DialogHeader>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {sorted.map((doc, idx) => {
            const version = (doc as any).version || 1;
            const isLatest = idx === 0;
            return (
              <div
                key={doc.id}
                className={`flex items-center gap-3 rounded-xl p-3 border transition-colors ${
                  isLatest ? "border-primary/30 bg-primary/5" : "border-border bg-card"
                }`}
              >
                <div className="p-2 bg-muted rounded-lg shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">v{version}</span>
                    {isLatest && (
                      <Badge variant="outline" className="text-[10px] px-2 py-0 border-primary text-primary font-medium">
                        Latest
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatFileSize(doc.file_size)} • {formatDateTime(doc.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => handlePreview(doc)}
                    title="Preview"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => handleDownload(doc)}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {sorted.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No versions found.</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VersionHistoryDialog;
