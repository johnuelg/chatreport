import { useState, useEffect, useCallback, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  FileText, 
  FileSpreadsheet,
  FileImage,
  File,
  Trash2,
  Search,
  Plus,
  Loader2,
  FolderIcon,
  ChevronLeft,
  FolderPlus,
  Pencil
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DocumentPreviewDialog } from "@/components/documents/DocumentPreviewDialog";
import { DomainFilter } from "@/components/documents/DomainFilter";
import { DraggableDocumentCard } from "@/components/documents/DraggableDocumentCard";
import { DroppableFolderCard } from "@/components/documents/DroppableFolderCard";
import { MultiFileUploadDialog } from "@/components/documents/MultiFileUploadDialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from "@dnd-kit/sortable";

type AnyError = unknown;

function formatUploadError(err: AnyError) {
  if (!err) return "Unknown error";

  // Supabase errors are not always consistent across storage / functions / postgrest.
  const e = err as any;
  const parts: string[] = [];

  if (typeof e.name === "string") parts.push(e.name);
  if (typeof e.message === "string") parts.push(e.message);

  // Common fields
  if (typeof e.status === "number") parts.push(`status ${e.status}`);
  if (typeof e.statusCode === "number") parts.push(`status ${e.statusCode}`);
  if (typeof e.code === "string") parts.push(`code ${e.code}`);
  if (typeof e.error === "string") parts.push(e.error);
  if (typeof e.details === "string") parts.push(e.details);
  if (typeof e.hint === "string") parts.push(`hint: ${e.hint}`);

  // Edge function invoke errors sometimes include a nested context
  if (e.context && typeof e.context === "object") {
    if (typeof e.context.status === "number") parts.push(`status ${e.context.status}`);
    if (typeof e.context.statusText === "string") parts.push(e.context.statusText);
  }

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

interface Document {
  id: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  description: string | null;
  content: string | null;
  created_at: string;
  uploaded_by: string | null;
  folder_id: string | null;
  domain_id: string | null;
}

interface DocumentFolder {
  id: string;
  name: string;
  description: string | null;
  color: string;
  domain_id?: string | null;
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

const getFileIcon = (fileType: string) => {
  return FILE_ICONS[fileType] || File;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default function Documents() {
  const { user, isAdmin } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [openFolderId, setOpenFolderId] = useState<string | null>(null); // Folder currently opened to view contents
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [parsingDocId, setParsingDocId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDomainId, setEditDomainId] = useState<string | null>(null);
  const [editFolderId, setEditFolderId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkMoveDialogOpen, setBulkMoveDialogOpen] = useState(false);
  const [bulkMoveTargetFolder, setBulkMoveTargetFolder] = useState<string | null>(null);
  const [isBulkMoving, setIsBulkMoving] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string | null>(null);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  // Folder create/edit dialog state
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<DocumentFolder | null>(null);
  const [folderName, setFolderName] = useState("");
  const [folderColor, setFolderColor] = useState("#6366f1");
  const [isFolderSaving, setIsFolderSaving] = useState(false);
  const [deleteFolderDialogOpen, setDeleteFolderDialogOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<DocumentFolder | null>(null);
  const [deleteFolderMoveTarget, setDeleteFolderMoveTarget] = useState<string | null>(null);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);

  const FOLDER_COLORS = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316",
    "#eab308", "#22c55e", "#14b8a6", "#0ea5e9", "#64748b",
  ];

  // Replace file state (admin)
  const [replaceTargetDoc, setReplaceTargetDoc] = useState<Document | null>(null);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);
  const [replacingDocId, setReplacingDocId] = useState<string | null>(null);
  const [replaceProgress, setReplaceProgress] = useState(0);

  // Upload form state
  const [uploadFolderId, setUploadFolderId] = useState<string | null>(null);
  const [uploadDomainId, setUploadDomainId] = useState<string | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } else {
      setDocuments(data as Document[]);
    }
    setIsLoading(false);
  }, []);

  const fetchFolders = useCallback(async () => {
    const { data, error } = await supabase
      .from("document_folders")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching folders:", error);
    } else {
      setFolders(data as DocumentFolder[]);
    }
  }, []);

  const fetchDomains = useCallback(async () => {
    const { data, error } = await supabase
      .from("domains")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching domains:", error);
    } else {
      setDomains(data as Domain[]);
    }
  }, []);


  useEffect(() => {
    fetchDocuments();
    fetchFolders();
    fetchDomains();
  }, [fetchDocuments, fetchFolders, fetchDomains]);

  const selectedDomain = useMemo(() => {
    if (!selectedDomainFilter || selectedDomainFilter === "unassigned") return null;
    return domains.find((d) => d.id === selectedDomainFilter) || null;
  }, [domains, selectedDomainFilter]);

  const domainScopedFolders = useMemo(() => {
    if (!selectedDomain) return [];
    return folders.filter((f) => (f.domain_id || null) === selectedDomain.id);
  }, [folders, selectedDomain]);

  const folderOptionsByDomainId = useMemo(() => {
    const map = new Map<string | null, DocumentFolder[]>();
    for (const f of folders) {
      const key = (f.domain_id || null) as string | null;
      const existing = map.get(key) || [];
      existing.push(f);
      map.set(key, existing);
    }
    // keep options stable + predictable
    for (const [key, list] of map.entries()) {
      map.set(
        key,
        [...list].sort((a, b) => a.name.localeCompare(b.name))
      );
    }
    return map;
  }, [folders]);

  // If the user switches domains, clear any folder selection that doesn't belong to that domain.
  useEffect(() => {
    if (!selectedFolderId) return;
    if (!selectedDomain) {
      setSelectedFolderId(null);
      setOpenFolderId(null);
      return;
    }
    const stillValid = domainScopedFolders.some((f) => f.id === selectedFolderId);
    if (!stillValid) {
      setSelectedFolderId(null);
      setOpenFolderId(null);
    }
  }, [selectedDomain, selectedFolderId, domainScopedFolders]);

  // When domain changes, close any open folder
  useEffect(() => {
    setOpenFolderId(null);
  }, [selectedDomainFilter]);

  // Compute document counts per folder (scoped to selected domain)
  const documentCounts = useMemo(() => {
    const counts: Record<string, number> = { unfoldered: 0 };
    domainScopedFolders.forEach((f) => (counts[f.id] = 0));

    const scopedDocs = selectedDomain
      ? documents.filter((d) => d.domain_id === selectedDomain.id)
      : [];

    scopedDocs.forEach((doc) => {
      if (doc.folder_id && counts[doc.folder_id] !== undefined) {
        counts[doc.folder_id]++;
      } else {
        counts["unfoldered"]++;
      }
    });

    return counts;
  }, [documents, domainScopedFolders, selectedDomain]);

  // Get unfiled documents (not in any folder) for the current domain
  const unfiledDocuments = useMemo(() => {
    if (!selectedDomain) return [];
    return documents.filter(
      (d) => d.domain_id === selectedDomain.id && !d.folder_id
    );
  }, [documents, selectedDomain]);

  // Get documents inside the currently open folder
  const folderDocuments = useMemo(() => {
    if (!openFolderId) return [];
    return documents.filter((d) => d.folder_id === openFolderId);
  }, [documents, openFolderId]);

  // Get the currently open folder object
  const openFolder = useMemo(() => {
    if (!openFolderId) return null;
    return domainScopedFolders.find((f) => f.id === openFolderId) || null;
  }, [openFolderId, domainScopedFolders]);

  // Compute document counts per domain
  const domainCounts = useMemo(() => {
    const counts: Record<string, number> = { unassigned: 0 };
    documents.forEach((doc) => {
      if (doc.domain_id) {
        counts[doc.domain_id] = (counts[doc.domain_id] || 0) + 1;
      } else {
        counts["unassigned"]++;
      }
    });
    return counts;
  }, [documents]);


  const handleEditReplaceFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // allow re-selecting same file
    e.currentTarget.value = "";
    if (!file || !selectedDocument) return;

    setReplaceTargetDoc(selectedDocument);

    // Validate format matches original (best-effort: browser sometimes returns empty MIME)
    if (file.type && selectedDocument.file_type && file.type !== selectedDocument.file_type) {
      toast.error(
        `File type mismatch. Expected ${selectedDocument.file_type} but got ${file.type || "unknown"}.`
      );
      return;
    }

    // Validate file size (max 10MB to match upload rules)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 10MB.");
      return;
    }

    setReplaceFile(file);
    setReplaceDialogOpen(true);
  };

  const handleConfirmReplace = async () => {
    if (!user || !replaceTargetDoc || !replaceFile) return;

    setReplacingDocId(replaceTargetDoc.id);
    setReplaceProgress(10);

    try {
      // Compute next revision version
      const { data: versionData, error: versionError } = await supabase.rpc(
        "next_document_revision_version",
        { _document_id: replaceTargetDoc.id }
      );
      if (versionError) throw versionError;
      const version = Number(versionData || 1);

      setReplaceProgress(25);

      const safeName = replaceFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const newPath = `${user.id}/${replaceTargetDoc.id}/v${version}-${Date.now()}-${safeName}`;

      // Upload replacement file
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(newPath, replaceFile, { upsert: false });

      if (uploadError) {
        toast.error(`Update failed (storage): ${formatUploadError(uploadError)}`);
        throw uploadError;
      }

      setReplaceProgress(65);

      // Record revision (previous file metadata)
      const { error: revError } = await supabase.from("document_revisions").insert({
        document_id: replaceTargetDoc.id,
        version,
        replaced_by: user.id,
        previous_file_path: replaceTargetDoc.file_path,
        previous_file_type: replaceTargetDoc.file_type,
        previous_file_size: replaceTargetDoc.file_size,
      });
      if (revError) {
        // Cleanup newly uploaded file if revision insert fails
        try {
          await supabase.storage.from("documents").remove([newPath]);
        } catch {
          // ignore
        }
        toast.error(`Update failed (database): ${formatUploadError(revError)}`);
        throw revError;
      }

      setReplaceProgress(85);

      // Update document pointer to new file
      const { error: docUpdateError } = await supabase
        .from("documents")
        .update({
          file_path: newPath,
          file_type: replaceFile.type || replaceTargetDoc.file_type,
          file_size: replaceFile.size,
          updated_at: new Date().toISOString(),
        })
        .eq("id", replaceTargetDoc.id);

      if (docUpdateError) {
        toast.error(`Update failed (database): ${formatUploadError(docUpdateError)}`);
        throw docUpdateError;
      }

      setReplaceProgress(100);
      toast.success("Document updated successfully!");
      setReplaceDialogOpen(false);
      setReplaceFile(null);
      setReplaceTargetDoc(null);
      fetchDocuments();
    } catch (error) {
      console.error("Replace error:", error);
      toast.error(`Failed to update document: ${formatUploadError(error)}`);
    } finally {
      // keep a short delay so the user sees 100%
      setTimeout(() => {
        setReplacingDocId(null);
        setReplaceProgress(0);
      }, 400);
    }
  };


  const handleDelete = async () => {
    if (!selectedDocument) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([selectedDocument.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("documents")
        .delete()
        .eq("id", selectedDocument.id);

      if (dbError) throw dbError;

      toast.success("Document deleted");
      setDeleteDialogOpen(false);
      setSelectedDocument(null);
      fetchDocuments();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete document");
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download document");
    }
  };

  const handleReparse = async (doc: Document) => {
    const parsableTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];

    const imageTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];

    const isImage = imageTypes.includes(doc.file_type);
    const isParsable = parsableTypes.includes(doc.file_type);

    if (!isParsable && !isImage) {
      toast.error("This file type cannot be analyzed for AI search");
      return;
    }

    setParsingDocId(doc.id);
    toast.info(isImage ? "Analyzing image with AI vision..." : "Extracting document content...");

    try {
      const functionName = isImage ? "analyze-image" : "parse-document";
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          documentId: doc.id,
          filePath: doc.file_path,
          fileType: doc.file_type,
        },
      });

      if (error) throw error;

      console.log("Document processed:", data);
      toast.success(isImage ? "Image data extracted for AI search!" : "Document content extracted for AI search!");
      fetchDocuments();
    } catch (error) {
      console.error("Processing error:", error);
      toast.error(isImage ? "Failed to analyze image" : "Failed to extract document content");
    } finally {
      setParsingDocId(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedDocument || !editName.trim()) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("documents")
        .update({ 
          name: editName.trim(),
          description: editDescription || null,
          domain_id: editDomainId,
          folder_id: editFolderId,
        })
        .eq("id", selectedDocument.id);

      if (error) throw error;

      toast.success("Document updated");
      setEditDialogOpen(false);
      setSelectedDocument(null);
      fetchDocuments();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to update document");
    } finally {
      setIsSaving(false);
    }
  };

  const openEditDialog = (doc: Document) => {
    setSelectedDocument(doc);
    setEditName(doc.name);
    setEditDescription(doc.description || "");
    setEditDomainId(doc.domain_id);
    setEditFolderId(doc.folder_id);
    setEditDialogOpen(true);
  };

  const toggleSelectDocument = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredDocuments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDocuments.map((doc) => doc.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    setIsBulkDeleting(true);
    try {
      const docsToDelete = documents.filter((doc) => selectedIds.has(doc.id));
      
      // Delete from storage
      const filePaths = docsToDelete.map((doc) => doc.file_path);
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove(filePaths);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("documents")
        .delete()
        .in("id", Array.from(selectedIds));

      if (dbError) throw dbError;

      toast.success(`${selectedIds.size} document(s) deleted`);
      setBulkDeleteDialogOpen(false);
      setSelectedIds(new Set());
      fetchDocuments();
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast.error("Failed to delete documents");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkMove = async () => {
    if (selectedIds.size === 0) return;

    setIsBulkMoving(true);
    try {
      const targetFolderId = bulkMoveTargetFolder === "unfiled" ? null : bulkMoveTargetFolder;

      const { error } = await supabase
        .from("documents")
        .update({ folder_id: targetFolderId })
        .in("id", Array.from(selectedIds));

      if (error) throw error;

      const targetLabel = targetFolderId
        ? domainScopedFolders.find((f) => f.id === targetFolderId)?.name || "folder"
        : "unfiled";

      toast.success(`${selectedIds.size} document(s) moved to ${targetLabel}`);
      setBulkMoveDialogOpen(false);
      setBulkMoveTargetFolder(null);
      setSelectedIds(new Set());
      fetchDocuments();
    } catch (error) {
      console.error("Bulk move error:", error);
      toast.error("Failed to move documents");
    } finally {
      setIsBulkMoving(false);
    }
  };

  const openPreview = (doc: Document) => {
    setPreviewDocument(doc);
    setPreviewOpen(true);
  };

  const handleQuickMove = useCallback(
    async (doc: Document, folderId: string | null) => {
      if (!isAdmin) return;
      try {
        const { error } = await supabase
          .from("documents")
          .update({ folder_id: folderId })
          .eq("id", doc.id);

        if (error) throw error;

        setDocuments((prev) =>
          prev.map((d) => (d.id === doc.id ? { ...d, folder_id: folderId } : d))
        );
        toast.success("Moved");
      } catch (error) {
        console.error("Quick move error:", error);
        toast.error("Failed to move document");
      }
    },
    [isAdmin]
  );

  // Folder CRUD handlers
  const handleCreateFolder = async () => {
    if (!folderName.trim() || !selectedDomain) return;

    setIsFolderSaving(true);
    try {
      const { error } = await supabase.from("document_folders").insert({
        name: folderName.trim(),
        color: folderColor,
        domain_id: selectedDomain.id,
      });

      if (error) throw error;

      toast.success("Folder created");
      setFolderDialogOpen(false);
      setFolderName("");
      setFolderColor("#6366f1");
      fetchFolders();
    } catch (error) {
      console.error("Create folder error:", error);
      toast.error("Failed to create folder");
    } finally {
      setIsFolderSaving(false);
    }
  };

  const handleUpdateFolder = async () => {
    if (!editingFolder || !folderName.trim()) return;

    setIsFolderSaving(true);
    try {
      const { error } = await supabase
        .from("document_folders")
        .update({ name: folderName.trim(), color: folderColor })
        .eq("id", editingFolder.id);

      if (error) throw error;

      toast.success("Folder updated");
      setFolderDialogOpen(false);
      setEditingFolder(null);
      setFolderName("");
      fetchFolders();
    } catch (error) {
      console.error("Update folder error:", error);
      toast.error("Failed to update folder");
    } finally {
      setIsFolderSaving(false);
    }
  };

  // Count documents in the folder being deleted
  const folderToDeleteDocCount = useMemo(() => {
    if (!folderToDelete) return 0;
    return documents.filter((d) => d.folder_id === folderToDelete.id).length;
  }, [folderToDelete, documents]);

  // Get other folders in the same domain for move target
  const folderMoveOptions = useMemo(() => {
    if (!folderToDelete) return [];
    return domainScopedFolders.filter((f) => f.id !== folderToDelete.id);
  }, [folderToDelete, domainScopedFolders]);

  const handleDeleteFolder = async () => {
    if (!folderToDelete) return;

    setIsDeletingFolder(true);
    try {
      // If there are documents and a move target is selected, move them first
      if (folderToDeleteDocCount > 0 && deleteFolderMoveTarget) {
        const { error: moveError } = await supabase
          .from("documents")
          .update({ folder_id: deleteFolderMoveTarget === "unfiled" ? null : deleteFolderMoveTarget })
          .eq("folder_id", folderToDelete.id);

        if (moveError) throw moveError;
      } else if (folderToDeleteDocCount > 0) {
        // No move target selected - documents become unfiled
        const { error: unfileError } = await supabase
          .from("documents")
          .update({ folder_id: null })
          .eq("folder_id", folderToDelete.id);

        if (unfileError) throw unfileError;
      }

      // Now delete the folder
      const { error } = await supabase
        .from("document_folders")
        .delete()
        .eq("id", folderToDelete.id);

      if (error) throw error;

      toast.success("Folder deleted");
      if (openFolderId === folderToDelete.id) {
        setOpenFolderId(null);
      }
      setDeleteFolderDialogOpen(false);
      setFolderToDelete(null);
      setDeleteFolderMoveTarget(null);
      fetchFolders();
      fetchDocuments();
    } catch (error) {
      console.error("Delete folder error:", error);
      toast.error("Failed to delete folder");
    } finally {
      setIsDeletingFolder(false);
    }
  };

  const openFolderEditDialog = (folder: DocumentFolder) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderColor(folder.color);
    setFolderDialogOpen(true);
  };

  const openFolderCreateDialog = () => {
    setEditingFolder(null);
    setFolderName("");
    setFolderColor("#6366f1");
    setFolderDialogOpen(true);
  };

  // Filter documents by folder, search, and tags
  const filteredDocuments = useMemo(() => {
    // If a folder is open, show folder contents
    let filtered = openFolderId ? folderDocuments : unfiledDocuments;

    // If no domain selected, show all documents
    if (!selectedDomain) {
      filtered = documents;
      
      // Apply domain filter
      if (selectedDomainFilter === "unassigned") {
        filtered = filtered.filter((doc) => !doc.domain_id);
      } else if (selectedDomainFilter) {
        filtered = filtered.filter((doc) => doc.domain_id === selectedDomainFilter);
      }
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(
        (doc) =>
          doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [documents, openFolderId, folderDocuments, unfiledDocuments, searchQuery, selectedDomain, selectedDomainFilter]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDocId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDocId(null);

    if (!over) return;

    // Check if dropped on a folder
    const overId = over.id as string;
    if (overId.startsWith("folder-")) {
      const targetFolderId = overId.replace("folder-", "");
      const draggedDocId = active.id as string;
      const draggedDoc = documents.find((d) => d.id === draggedDocId);

      if (!draggedDoc || draggedDoc.folder_id === targetFolderId) return;

      const targetFolder = domainScopedFolders.find((f) => f.id === targetFolderId);
      if (!targetFolder) return;

      try {
        const { error } = await supabase
          .from("documents")
          .update({ folder_id: targetFolderId })
          .eq("id", draggedDocId);

        if (error) throw error;

        // Optimistic update
        setDocuments((prev) =>
          prev.map((d) => (d.id === draggedDocId ? { ...d, folder_id: targetFolderId } : d))
        );

        toast.success(`Moved "${draggedDoc.name}" to "${targetFolder.name}"`);
      } catch (error) {
        console.error("Drag move error:", error);
        toast.error("Failed to move document");
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Document Management
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Upload and manage ER reports, data files, and documents
            </p>
          </div>

          {isAdmin && (
            <>
              <Button
                onClick={() => {
                  setUploadDomainId(selectedDomain?.id || null);
                  setUploadFolderId(openFolderId || null);
                  setUploadDialogOpen(true);
                }}
                className="gradient-primary hover:opacity-90 transition-opacity"
              >
                <Plus className="h-4 w-4 mr-2" />
                Upload Documents
              </Button>
              <MultiFileUploadDialog
                open={uploadDialogOpen}
                onOpenChange={setUploadDialogOpen}
                userId={user?.id || ""}
                domains={domains}
                folders={folders}
                initialDomainId={uploadDomainId}
                initialFolderId={uploadFolderId}
                onUploadComplete={fetchDocuments}
              />
            </>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Domain Sidebar */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <Card className="border-0 shadow-elegant lg:col-span-1">
              <CardContent className="pt-6">
                <DomainFilter
                  selectedDomain={selectedDomainFilter}
                  onSelectDomain={setSelectedDomainFilter}
                  domainCounts={domainCounts}
                  userId={user?.id}
                  isAdmin={isAdmin}
                />
              </CardContent>
            </Card>

            {/* Documents Grid */}
            <Card className="border-0 shadow-elegant lg:col-span-3">
              <CardHeader>
                <div className="flex flex-col gap-4">
                  {/* Folder breadcrumb / back navigation */}
                  {openFolderId && openFolder && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setOpenFolderId(null)}
                        className="gap-1.5"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Back
                      </Button>
                      <div className="flex items-center gap-2">
                        <FolderIcon className="h-4 w-4" style={{ color: openFolder.color }} />
                        <span className="font-medium">{openFolder.name}</span>
                      </div>
                    </div>
                  )}

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-display">
                        {openFolderId
                          ? `${openFolder?.name || "Folder"} (${filteredDocuments.length})`
                          : selectedDomain
                          ? `${selectedDomain.name} (${unfiledDocuments.length} files)`
                          : `Documents (${filteredDocuments.length})`}
                      </CardTitle>
                      <CardDescription>
                        {openFolderId
                          ? "Files in this folder"
                          : selectedDomain
                          ? "Folders and unfiled documents"
                          : selectedDomainFilter === "unassigned"
                          ? "Unassigned documents"
                          : "All uploaded reports and data files"}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Add folder button for admins when domain is selected */}
                      {isAdmin && selectedDomain && !openFolderId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={openFolderCreateDialog}
                          className="gap-1.5"
                        >
                          <FolderPlus className="h-4 w-4" />
                          Add Folder
                        </Button>
                      )}
                      {isAdmin && filteredDocuments.length > 0 && (
                        <div className="flex items-center gap-4">
                          {selectedIds.size > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {selectedIds.size} selected
                              </span>
                              {selectedDomain && domainScopedFolders.length > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setBulkMoveDialogOpen(true)}
                                >
                                  <FolderIcon className="h-4 w-4 mr-2" />
                                  Move
                                </Button>
                              )}
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setBulkDeleteDialogOpen(true)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="selectAll"
                              checked={selectedIds.size === filteredDocuments.length && filteredDocuments.length > 0}
                              onCheckedChange={toggleSelectAll}
                            />
                            <Label htmlFor="selectAll" className="text-sm cursor-pointer">
                              All
                            </Label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    {/* Folder Cards (only show when domain selected and no folder is open) */}
                    {selectedDomain && !openFolderId && domainScopedFolders.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">
                          Folders ({domainScopedFolders.length})
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                          {domainScopedFolders.map((folder) => (
                            <DroppableFolderCard
                              key={folder.id}
                              folder={folder}
                              documentCount={documentCounts[folder.id] || 0}
                              isAdmin={isAdmin}
                              isDragging={!!activeDocId}
                              onClick={() => setOpenFolderId(folder.id)}
                              onEdit={openFolderEditDialog}
                              onDelete={(f) => {
                                setFolderToDelete(f);
                                setDeleteFolderDialogOpen(true);
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Unfiled Documents section (when domain selected and no folder open) */}
                    {selectedDomain && !openFolderId && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">
                          Unfiled Documents ({unfiledDocuments.filter((d) =>
                            !searchQuery ||
                            d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            d.description?.toLowerCase().includes(searchQuery.toLowerCase())
                          ).length})
                        </h3>
                        {unfiledDocuments.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No unfiled documents</p>
                          </div>
                        ) : (
                          <SortableContext
                            items={filteredDocuments.map((doc) => doc.id)}
                            strategy={rectSortingStrategy}
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {filteredDocuments.map((doc, index) => (
                                <DraggableDocumentCard
                                  key={doc.id}
                                  doc={doc}
                                  index={index}
                                  isSelected={selectedIds.has(doc.id)}
                                  isAdmin={isAdmin}
                                  parsingDocId={parsingDocId}
                                  replacingDocId={replacingDocId}
                                  replaceProgress={replacingDocId === doc.id ? replaceProgress : undefined}
                                  domain={domains.find(d => d.id === doc.domain_id)}
                                  onToggleSelect={toggleSelectDocument}
                                  onPreview={openPreview}
                                  onDownload={handleDownload}
                                  onReparse={handleReparse}
                                  onQuickMove={handleQuickMove}
                                  onRename={openEditDialog}
                                  onDelete={(doc) => {
                                    setSelectedDocument(doc);
                                    setDeleteDialogOpen(true);
                                  }}
                                  folderOptions={folderOptionsByDomainId.get(doc.domain_id || null) || []}
                                  getFileIcon={getFileIcon}
                                  formatFileSize={formatFileSize}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        )}
                      </div>
                    )}

                    {/* Folder contents (when a folder is open) */}
                    {openFolderId && (
                      <>
                        {filteredDocuments.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="p-4 rounded-full bg-secondary inline-block mb-4">
                              <FileText className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-medium text-foreground">Folder is empty</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {searchQuery ? "No files match your search" : "Add documents to this folder"}
                            </p>
                          </div>
                        ) : (
                          <SortableContext
                            items={filteredDocuments.map((doc) => doc.id)}
                            strategy={rectSortingStrategy}
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {filteredDocuments.map((doc, index) => (
                                <DraggableDocumentCard
                                  key={doc.id}
                                  doc={doc}
                                  index={index}
                                  isSelected={selectedIds.has(doc.id)}
                                  isAdmin={isAdmin}
                                  parsingDocId={parsingDocId}
                                  replacingDocId={replacingDocId}
                                  replaceProgress={replacingDocId === doc.id ? replaceProgress : undefined}
                                  domain={domains.find(d => d.id === doc.domain_id)}
                                  onToggleSelect={toggleSelectDocument}
                                  onPreview={openPreview}
                                  onDownload={handleDownload}
                                  onReparse={handleReparse}
                                  onQuickMove={handleQuickMove}
                                  onRename={openEditDialog}
                                  onDelete={(doc) => {
                                    setSelectedDocument(doc);
                                    setDeleteDialogOpen(true);
                                  }}
                                  folderOptions={folderOptionsByDomainId.get(doc.domain_id || null) || []}
                                  getFileIcon={getFileIcon}
                                  formatFileSize={formatFileSize}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        )}
                      </>
                    )}

                    {/* All documents view (no domain selected) */}
                    {!selectedDomain && (
                      <>
                        {filteredDocuments.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="p-4 rounded-full bg-secondary inline-block mb-4">
                              <FileText className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-medium text-foreground">No documents found</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {searchQuery ? "Try a different search term" : "Select a domain to view documents"}
                            </p>
                          </div>
                        ) : (
                          <SortableContext
                            items={filteredDocuments.map((doc) => doc.id)}
                            strategy={rectSortingStrategy}
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {filteredDocuments.map((doc, index) => (
                                <DraggableDocumentCard
                                  key={doc.id}
                                  doc={doc}
                                  index={index}
                                  isSelected={selectedIds.has(doc.id)}
                                  isAdmin={isAdmin}
                                  parsingDocId={parsingDocId}
                                  replacingDocId={replacingDocId}
                                  replaceProgress={replacingDocId === doc.id ? replaceProgress : undefined}
                                  domain={domains.find(d => d.id === doc.domain_id)}
                                  onToggleSelect={toggleSelectDocument}
                                  onPreview={openPreview}
                                  onDownload={handleDownload}
                                  onReparse={handleReparse}
                                  onQuickMove={handleQuickMove}
                                  onRename={openEditDialog}
                                  onDelete={(doc) => {
                                    setSelectedDocument(doc);
                                    setDeleteDialogOpen(true);
                                  }}
                                  folderOptions={folderOptionsByDomainId.get(doc.domain_id || null) || []}
                                  getFileIcon={getFileIcon}
                                  formatFileSize={formatFileSize}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        )}
                      </>
                    )}
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </DndContext>
        </div>

        {/* Document Preview Dialog */}
        <DocumentPreviewDialog
          document={previewDocument}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Document</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedDocument?.name}"?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Edit Document</DialogTitle>
              <DialogDescription>
                Update document details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Document Name</Label>
                <Input
                  id="editName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter document name..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Add a description..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editDomain">Domain</Label>
                <Select
                  value={editDomainId || "none"}
                  onValueChange={(value) => setEditDomainId(value === "none" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a domain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No domain</SelectItem>
                    {domains.map((domain) => (
                      <SelectItem key={domain.id} value={domain.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: domain.color }} />
                          {domain.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {editDomainId && folders.filter((f) => (f.domain_id || null) === editDomainId).length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="editFolder">Folder</Label>
                  <Select
                    value={editFolderId || "none"}
                    onValueChange={(value) => setEditFolderId(value === "none" ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a folder" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No folder</SelectItem>
                      {folders
                        .filter((f) => (f.domain_id || null) === editDomainId)
                        .map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          <div className="flex items-center gap-2">
                            <FolderIcon className="h-4 w-4" style={{ color: folder.color }} />
                            {folder.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {isAdmin && selectedDocument && (
                <div className="space-y-2">
                  <Label htmlFor="replaceFile">Replace file</Label>
                  <Input
                    id="replaceFile"
                    type="file"
                    onChange={handleEditReplaceFileSelect}
                    accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.png,.jpg,.jpeg"
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    Replacement must match the original format.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={!editName.trim() || isSaving}
                className="gradient-primary"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Delete Confirmation Dialog */}
        <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {selectedIds.size} Document(s)</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selectedIds.size} selected document(s)?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isBulkDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Move Dialog */}
        <Dialog 
          open={bulkMoveDialogOpen} 
          onOpenChange={(open) => {
            setBulkMoveDialogOpen(open);
            if (!open) setBulkMoveTargetFolder(null);
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Move {selectedIds.size} Document(s)</DialogTitle>
              <DialogDescription>
                Select a destination folder for the selected documents.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Destination Folder</Label>
                <Select
                  value={bulkMoveTargetFolder || "unfiled"}
                  onValueChange={(value) => setBulkMoveTargetFolder(value === "unfiled" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unfiled">
                      <span className="text-muted-foreground">Unfiled (no folder)</span>
                    </SelectItem>
                    {domainScopedFolders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        <div className="flex items-center gap-2">
                          <FolderIcon className="h-4 w-4" style={{ color: folder.color }} />
                          {folder.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkMoveDialogOpen(false)} disabled={isBulkMoving}>
                Cancel
              </Button>
              <Button onClick={handleBulkMove} disabled={isBulkMoving}>
                {isBulkMoving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Moving...
                  </>
                ) : (
                  "Move Documents"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={replaceDialogOpen} onOpenChange={setReplaceDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Replace file?</AlertDialogTitle>
              <AlertDialogDescription>
                {replaceTargetDoc ? (
                  <span>
                    You’re about to replace <strong>{replaceTargetDoc.name}</strong>
                    {replaceFile ? (
                      <> with <strong>{replaceFile.name}</strong>.</>
                    ) : (
                      "."
                    )}
                  </span>
                ) : (
                  "You’re about to replace this document’s file."
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {replacingDocId && replaceTargetDoc?.id === replacingDocId && (
              <div className="space-y-2">
                <Progress value={replaceProgress} />
                <p className="text-xs text-muted-foreground">Uploading & updating…</p>
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel disabled={!!replacingDocId}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmReplace}
                disabled={!replaceFile || !!replacingDocId}
                className="gradient-primary"
              >
                {replacingDocId ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Replace"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Folder Create/Edit Dialog */}
        <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingFolder ? "Edit Folder" : "Create Folder"}
              </DialogTitle>
              <DialogDescription>
                {editingFolder ? "Update folder name and color" : "Create a new folder to organize documents"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="folderName">Folder Name</Label>
                <Input
                  id="folderName"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Enter folder name..."
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {FOLDER_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setFolderColor(color)}
                      className={cn(
                        "w-8 h-8 rounded-full transition-all",
                        folderColor === color && "ring-2 ring-offset-2 ring-primary"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFolderDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={editingFolder ? handleUpdateFolder : handleCreateFolder}
                disabled={!folderName.trim() || isFolderSaving}
                className="gradient-primary"
              >
                {isFolderSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingFolder ? (
                  "Save"
                ) : (
                  "Create"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Folder Delete Confirmation */}
        <AlertDialog 
          open={deleteFolderDialogOpen} 
          onOpenChange={(open) => {
            setDeleteFolderDialogOpen(open);
            if (!open) {
              setFolderToDelete(null);
              setDeleteFolderMoveTarget(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Folder</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p>
                    Are you sure you want to delete "<strong>{folderToDelete?.name}</strong>"?
                  </p>
                  
                  {folderToDeleteDocCount > 0 ? (
                    <div className="rounded-lg border bg-muted/50 p-3 space-y-3">
                      <p className="text-sm font-medium text-foreground">
                        This folder contains {folderToDeleteDocCount} document{folderToDeleteDocCount !== 1 ? "s" : ""}.
                      </p>
                      
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          What should happen to these documents?
                        </Label>
                        <Select
                          value={deleteFolderMoveTarget || "unfiled"}
                          onValueChange={(value) => setDeleteFolderMoveTarget(value === "unfiled" ? null : value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unfiled">
                              <span className="text-muted-foreground">Leave unfiled</span>
                            </SelectItem>
                            {folderMoveOptions.map((folder) => (
                              <SelectItem key={folder.id} value={folder.id}>
                                <div className="flex items-center gap-2">
                                  <FolderIcon className="h-4 w-4" style={{ color: folder.color }} />
                                  Move to "{folder.name}"
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      This folder is empty and can be safely deleted.
                    </p>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingFolder}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteFolder}
                disabled={isDeletingFolder}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeletingFolder ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
