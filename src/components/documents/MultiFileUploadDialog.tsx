import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  X,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Loader2,
  FolderIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AnyError = unknown;

function formatUploadError(err: AnyError) {
  if (!err) return "Unknown error";
  const e = err as any;
  const parts: string[] = [];

  if (typeof e.name === "string") parts.push(e.name);
  if (typeof e.message === "string") parts.push(e.message);
  if (typeof e.status === "number") parts.push(`status ${e.status}`);
  if (typeof e.statusCode === "number") parts.push(`status ${e.statusCode}`);
  if (typeof e.code === "string") parts.push(`code ${e.code}`);
  if (typeof e.error === "string") parts.push(e.error);
  if (typeof e.details === "string") parts.push(e.details);

  const message = parts.filter(Boolean).join(" • ");
  return message || "Unknown error";
}

interface Domain {
  id: string;
  name: string;
  slug: string;
  color: string;
  abbreviation: string | null;
}

interface DocumentFolder {
  id: string;
  name: string;
  description: string | null;
  color: string;
  domain_id?: string | null;
}

type UploadStatus = "pending" | "uploading" | "success" | "error";

interface FileUploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
}

interface MultiFileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  domains: Domain[];
  folders: DocumentFolder[];
  initialDomainId?: string | null;
  initialFolderId?: string | null;
  onUploadComplete: () => void;
}

const FILE_ICONS: Record<string, React.ElementType> = {
  "application/pdf": FileText,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": FileSpreadsheet,
  "application/vnd.ms-excel": FileSpreadsheet,
  "text/csv": FileSpreadsheet,
  "image/png": FileImage,
  "image/jpeg": FileImage,
  "image/jpg": FileImage,
};

const getFileIconComponent = (fileType: string) => {
  return FILE_ICONS[fileType] || File;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function MultiFileUploadDialog({
  open,
  onOpenChange,
  userId,
  domains,
  folders,
  initialDomainId,
  initialFolderId,
  onUploadComplete,
}: MultiFileUploadDialogProps) {
  const [uploadQueue, setUploadQueue] = useState<FileUploadItem[]>([]);
  const [domainId, setDomainId] = useState<string | null>(initialDomainId || null);
  const [folderId, setFolderId] = useState<string | null>(initialFolderId || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Folder options based on selected domain
  const availableFolders = folders.filter((f) => (f.domain_id || null) === domainId);

  // Reset state when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setDomainId(initialDomainId || null);
      setFolderId(initialFolderId || null);
      setUploadQueue([]);
      setIsDragOver(false);
    }
    onOpenChange(newOpen);
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Unsupported file type";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File too large (max 10MB)";
    }
    return null;
  };

  const addFilesToQueue = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const newItems: FileUploadItem[] = fileArray.map((file, i) => {
      const validationError = validateFile(file);
      return {
        id: `${Date.now()}-${i}-${file.name}`,
        file,
        status: validationError ? "error" : "pending",
        progress: 0,
        error: validationError || undefined,
      } as FileUploadItem;
    });

    setUploadQueue((prev) => [...prev, ...newItems]);
  }, []);

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    addFilesToQueue(files);
    e.target.value = ""; // Reset input
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) {
      setIsDragOver(true);
    }
  }, [isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (isUploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      addFilesToQueue(files);
    }
  }, [isUploading, addFilesToQueue]);

  const removeFromQueue = (id: string) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItemStatus = useCallback(
    (id: string, updates: Partial<FileUploadItem>) => {
      setUploadQueue((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
    },
    []
  );

  const uploadSingleFile = async (item: FileUploadItem): Promise<boolean> => {
    const { file, id } = item;
    
    updateItemStatus(id, { status: "uploading", progress: 10, error: undefined });

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      updateItemStatus(id, { progress: 30 });

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      updateItemStatus(id, { progress: 60 });

      // Create document record
      const { data: docData, error: dbError } = await supabase
        .from("documents")
        .insert({
          name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          description: null,
          uploaded_by: userId,
          folder_id: folderId,
          domain_id: domainId,
        })
        .select()
        .single();

      if (dbError) {
        // Cleanup orphaned file
        try {
          await supabase.storage.from("documents").remove([filePath]);
        } catch {
          // ignore
        }
        throw dbError;
      }

      updateItemStatus(id, { progress: 80 });

      // Trigger background parsing
      const parsableTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
      ];

      const imageTypes = ["image/png", "image/jpeg", "image/jpg"];

      if (docData && parsableTypes.includes(file.type)) {
        supabase.functions.invoke("parse-document", {
          body: { documentId: docData.id, filePath, fileType: file.type },
        });
      } else if (docData && imageTypes.includes(file.type)) {
        supabase.functions.invoke("analyze-image", {
          body: { documentId: docData.id, filePath, fileType: file.type },
        });
      }

      updateItemStatus(id, { status: "success", progress: 100 });
      return true;
    } catch (error) {
      console.error("Upload error:", error);
      updateItemStatus(id, {
        status: "error",
        progress: 0,
        error: formatUploadError(error),
      });
      return false;
    }
  };

  const handleUploadAll = async () => {
    const pendingItems = uploadQueue.filter((item) => item.status === "pending");
    if (pendingItems.length === 0) return;

    setIsUploading(true);

    let successCount = 0;
    let errorCount = 0;

    for (const item of pendingItems) {
      const success = await uploadSingleFile(item);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    setIsUploading(false);

    if (successCount > 0 && errorCount === 0) {
      toast.success(`${successCount} file(s) uploaded successfully`);
      onUploadComplete();
      handleOpenChange(false);
    } else if (successCount > 0 && errorCount > 0) {
      toast.warning(`${successCount} uploaded, ${errorCount} failed`);
      onUploadComplete();
    } else if (errorCount > 0) {
      toast.error(`${errorCount} file(s) failed to upload`);
    }
  };

  const handleRetryFailed = async () => {
    const failedItems = uploadQueue.filter((item) => item.status === "error" && !validateFile(item.file));
    if (failedItems.length === 0) return;

    // Reset failed items to pending
    for (const item of failedItems) {
      updateItemStatus(item.id, { status: "pending", progress: 0, error: undefined });
    }

    // Wait for state update then upload
    setTimeout(() => {
      handleUploadAll();
    }, 100);
  };

  const pendingCount = uploadQueue.filter((i) => i.status === "pending").length;
  const successCount = uploadQueue.filter((i) => i.status === "success").length;
  const errorCount = uploadQueue.filter((i) => i.status === "error").length;
  const retryableCount = uploadQueue.filter(
    (i) => i.status === "error" && !validateFile(i.file)
  ).length;

  const getStatusIcon = (status: UploadStatus) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-primary" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "uploading":
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Upload Documents</DialogTitle>
          <DialogDescription>
            Select multiple files to upload at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Domain & Folder Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Domain {!domainId && <span className="text-destructive">*</span>}</Label>
              <Select
                value={domainId || "none"}
                onValueChange={(value) => {
                  setDomainId(value === "none" ? null : value);
                  setFolderId(null); // Reset folder when domain changes
                }}
              >
                <SelectTrigger className={!domainId ? "border-destructive/50" : ""}>
                  <SelectValue placeholder="Select domain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No domain</SelectItem>
                  {domains.map((domain) => (
                    <SelectItem key={domain.id} value={domain.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: domain.color }}
                        />
                        {domain.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Folder</Label>
              <Select
                value={folderId || "none"}
                onValueChange={(value) => setFolderId(value === "none" ? null : value)}
                disabled={!domainId}
              >
                <SelectTrigger className={!domainId ? "opacity-50" : ""}>
                  <SelectValue placeholder={domainId ? "Select folder" : "Select domain first"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No folder (unfiled)</SelectItem>
                  {availableFolders.length > 0 ? (
                    availableFolders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        <div className="flex items-center gap-2">
                          <FolderIcon className="h-4 w-4" style={{ color: folder.color }} />
                          {folder.name}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-folders" disabled>
                      No folders in this domain
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative border-2 border-dashed rounded-lg p-6 transition-colors text-center",
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50",
              isUploading && "opacity-50 pointer-events-none"
            )}
          >
            <input
              id="files"
              type="file"
              multiple
              onChange={handleFilesSelect}
              accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.png,.jpg,.jpeg"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            <Upload className={cn(
              "mx-auto h-8 w-8 mb-2",
              isDragOver ? "text-primary" : "text-muted-foreground"
            )} />
            <p className="text-sm font-medium">
              {isDragOver ? "Drop files here" : "Drag & drop files or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, Excel, CSV, Word, Images (max 10MB each)
            </p>
          </div>

          {/* Upload Queue */}
          {uploadQueue.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  Upload Queue ({uploadQueue.length} file{uploadQueue.length !== 1 ? "s" : ""})
                </Label>
                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadQueue([])}
                    className="h-6 text-xs"
                  >
                    Clear all
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[200px] border rounded-lg p-2">
                <div className="space-y-2">
                  {uploadQueue.map((item) => {
                    const IconComponent = getFileIconComponent(item.file.type);
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg border bg-background",
                          item.status === "error" && "border-destructive/50 bg-destructive/5",
                          item.status === "success" && "border-primary/50 bg-primary/5"
                        )}
                      >
                        <IconComponent className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">
                              {item.file.name}
                            </span>
                            {getStatusIcon(item.status)}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(item.file.size)}
                            </span>
                            {item.error && (
                              <span className="text-xs text-destructive truncate">
                                {item.error}
                              </span>
                            )}
                          </div>
                          {item.status === "uploading" && (
                            <Progress value={item.progress} className="h-1 mt-1" />
                          )}
                        </div>
                        {!isUploading && item.status !== "uploading" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={() => removeFromQueue(item.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Summary */}
          {uploadQueue.length > 0 && (successCount > 0 || errorCount > 0) && (
            <div className="flex items-center gap-4 text-sm">
              {successCount > 0 && (
                <span className="flex items-center gap-1 text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  {successCount} uploaded
                </span>
              )}
              {errorCount > 0 && (
                <span className="flex items-center gap-1 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {errorCount} failed
                </span>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isUploading}
          >
            {successCount > 0 && pendingCount === 0 ? "Done" : "Cancel"}
          </Button>
          {retryableCount > 0 && !isUploading && (
            <Button variant="secondary" onClick={handleRetryFailed} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Retry Failed ({retryableCount})
            </Button>
          )}
          <Button
            onClick={handleUploadAll}
            disabled={pendingCount === 0 || isUploading}
            className="gradient-primary"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {pendingCount > 0 ? `(${pendingCount})` : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
