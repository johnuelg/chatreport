import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Download, Loader2, X, FileText, Image, Table2, File, Code2, FileType } from "lucide-react";
import { toast } from "sonner";
import { PDFPreviewContent } from "./preview/PDFPreviewContent";
import { ImagePreviewContent } from "./preview/ImagePreviewContent";
import { SpreadsheetPreviewContent } from "./preview/SpreadsheetPreviewContent";
import { TextPreviewContent } from "./preview/TextPreviewContent";
import { CodePreviewContent } from "./preview/CodePreviewContent";
import { WordPreviewContent } from "./preview/WordPreviewContent";
import { cn } from "@/lib/utils";

interface Document {
  id: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  description: string | null;
  content: string | null;
  category?: string | null;
}

interface DocumentPreviewDialogProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PreviewType = "pdf" | "image" | "spreadsheet" | "text" | "code" | "word" | "unsupported";

// Code file extensions for syntax highlighting
const CODE_EXTENSIONS = [
  ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
  ".html", ".htm", ".xml", ".svg", ".css", ".scss", ".sass", ".less",
  ".json", ".yaml", ".yml", ".toml",
  ".py", ".rb", ".go", ".rs", ".java", ".kt", ".swift",
  ".c", ".cpp", ".h", ".hpp", ".cs", ".php",
  ".sh", ".bash", ".zsh", ".fish", ".ps1",
  ".dockerfile", ".makefile", ".sql", ".graphql", ".gql",
];

const getPreviewType = (fileType: string, fileName: string): PreviewType => {
  const lowerName = fileName.toLowerCase();
  
  // PDF
  if (fileType === "application/pdf" || lowerName.endsWith(".pdf")) {
    return "pdf";
  }
  
  // Images
  if (
    fileType.startsWith("image/") ||
    [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp"].some((ext) =>
      lowerName.endsWith(ext)
    )
  ) {
    return "image";
  }
  
  // Spreadsheets
  if (
    fileType === "text/csv" ||
    fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    fileType === "application/vnd.ms-excel" ||
    [".csv", ".xlsx", ".xls"].some((ext) => lowerName.endsWith(ext))
  ) {
    return "spreadsheet";
  }

  // Word documents
  if (
    fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileType === "application/msword" ||
    lowerName.endsWith(".docx")
  ) {
    return "word";
  }

  // Code files (with syntax highlighting)
  if (CODE_EXTENSIONS.some((ext) => lowerName.endsWith(ext))) {
    return "code";
  }

  // Plain text files (including markdown)
  if (
    fileType === "text/plain" ||
    fileType === "text/markdown" ||
    [".txt", ".md", ".mdx", ".log", ".readme"].some((ext) => lowerName.endsWith(ext))
  ) {
    return "text";
  }
  
  return "unsupported";
};

const getPreviewIcon = (type: PreviewType) => {
  switch (type) {
    case "pdf":
      return <FileText className="h-4 w-4" />;
    case "image":
      return <Image className="h-4 w-4" />;
    case "spreadsheet":
      return <Table2 className="h-4 w-4" />;
    case "text":
      return <FileType className="h-4 w-4" />;
    case "code":
      return <Code2 className="h-4 w-4" />;
    case "word":
      return <FileText className="h-4 w-4" />;
    default:
      return <File className="h-4 w-4" />;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export function DocumentPreviewDialog({
  document,
  open,
  onOpenChange,
}: DocumentPreviewDialogProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewType = document ? getPreviewType(document.file_type, document.name) : "unsupported";

  // Load preview when dialog opens
  useEffect(() => {
    if (open && document) {
      loadPreview();
    } else {
      // Cleanup on close
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setError(null);
    }

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [open, document?.id]);

  const loadPreview = async () => {
    if (!document) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: downloadError } = await supabase.storage
        .from("documents")
        .download(document.file_path);

      if (downloadError) throw downloadError;

      const url = URL.createObjectURL(data);
      setPreviewUrl(url);
    } catch (err) {
      console.error("Preview error:", err);
      setError("Failed to load preview");
      toast.error("Failed to load preview");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = useCallback(() => {
    if (!previewUrl || !document) return;

    const a = window.document.createElement("a");
    a.href = previewUrl;
    a.download = document.name;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  }, [previewUrl, document]);

  const renderPreviewContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-96 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading preview...</p>
        </div>
      );
    }

    if (error || !previewUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            {getPreviewIcon(previewType)}
          </div>
          <p className="text-muted-foreground">
            {error || "Preview not available"}
          </p>
          <Button onClick={handleDownload} disabled={!previewUrl}>
            <Download className="h-4 w-4 mr-2" />
            Download to View
          </Button>
        </div>
      );
    }

    switch (previewType) {
      case "pdf":
        return (
          <PDFPreviewContent
            url={previewUrl}
            fileName={document?.name || "document.pdf"}
            onDownload={handleDownload}
          />
        );

      case "image":
        return (
          <ImagePreviewContent
            url={previewUrl}
            fileName={document?.name || "image"}
            onDownload={handleDownload}
          />
        );

      case "spreadsheet":
        return (
          <SpreadsheetPreviewContent
            url={previewUrl}
            fileName={document?.name || "spreadsheet"}
            fileType={document?.file_type || ""}
            onDownload={handleDownload}
          />
        );

      case "text":
        return (
          <TextPreviewContent
            url={previewUrl}
            fileName={document?.name || "text"}
            onDownload={handleDownload}
          />
        );

      case "code":
        return (
          <CodePreviewContent
            url={previewUrl}
            fileName={document?.name || "code"}
            onDownload={handleDownload}
          />
        );

      case "word":
        return (
          <WordPreviewContent
            url={previewUrl}
            fileName={document?.name || "document.docx"}
            onDownload={handleDownload}
          />
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <File className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Preview not available for this file type
            </p>
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download to View
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        className={cn(
          "flex flex-col p-0 gap-0",
          (previewType === "spreadsheet" || previewType === "code")
            ? "max-w-6xl max-h-[90vh]"
            : "max-w-4xl max-h-[90vh]"
        )}
      >
        {/* Header */}
        <DialogHeader className="flex-row items-center justify-between space-y-0 px-4 py-3 border-b">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className={cn(
                "shrink-0 w-8 h-8 rounded flex items-center justify-center",
                previewType === "pdf" && "bg-destructive/10 text-destructive",
                previewType === "image" && "bg-primary/10 text-primary",
                previewType === "spreadsheet" && "bg-accent text-accent-foreground",
                previewType === "text" && "bg-secondary text-secondary-foreground",
                previewType === "code" && "bg-chart-4/20 text-chart-4",
                previewType === "word" && "bg-chart-1/20 text-chart-1",
                previewType === "unsupported" && "bg-muted text-muted-foreground"
              )}
            >
              {getPreviewIcon(previewType)}
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="font-display truncate text-base">
                {document?.name}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                {document && formatFileSize(document.file_size)} •{" "}
                {document?.file_type || "Unknown type"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!previewUrl}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Preview content */}
        <div className="flex-1 min-h-0 overflow-hidden bg-muted/30">
          {renderPreviewContent()}
        </div>

        {/* Description footer */}
        {document?.description && (
          <div className="px-4 py-3 border-t bg-muted/20">
            <p className="text-sm text-muted-foreground">{document.description}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
