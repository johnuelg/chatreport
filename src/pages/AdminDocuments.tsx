import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useDocuments, useUpdateDocument, useDeleteDocument } from "@/hooks/useDocuments";
import { useDomains } from "@/hooks/useDomains";
import { useDocumentFolders, useAddDocumentFolder } from "@/hooks/useDocumentFolders";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, Eye, Download, FolderOpen, Pencil, Trash2,
  FileText, Loader2, Sparkles, Folder, FolderPlus, AlertTriangle, Clock, CheckSquare, Square,
  ArrowUpDown, Filter, X, LayoutGrid, List, Check, Settings2, ChevronDown, Home,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage
} from "@/components/ui/breadcrumb";
import UploadDocumentDialog from "@/components/admin/documents/UploadDocumentDialog";
import DocumentSidebar from "@/components/admin/documents/DocumentSidebar";
import VersionHistoryDialog from "@/components/admin/documents/VersionHistoryDialog";

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type SortField = "title" | "created_at" | "file_size";
type SortDir = "asc" | "desc";

const fileTypeIcon = (fileType: string) => {
  if (fileType.includes("pdf")) return "📄";
  if (fileType.includes("sheet") || fileType.includes("csv") || fileType.includes("excel") || fileType.includes("xlsx")) return "📊";
  if (fileType.includes("word") || fileType.includes("doc")) return "📝";
  if (fileType.includes("image") || fileType.includes("png") || fileType.includes("jpg") || fileType.includes("jpeg")) return "🖼️";
  return "📎";
};

const AdminDocuments = () => {
  const { data: documents = [], isLoading } = useDocuments();
  const { data: domains = [] } = useDomains();
  const { data: folders = [] } = useDocumentFolders();
  const addFolder = useAddDocumentFolder();
  const updateDocument = useUpdateDocument();
  const deleteDocument = useDeleteDocument();

  const [search, setSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editDoc, setEditDoc] = useState<any>(null);
  const [deleteDoc, setDeleteDoc] = useState<any>(null);
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveDoc, setMoveDoc] = useState<any>(null);
  const [moveFolderId, setMoveFolderId] = useState<string>("none");
  const [addFolderOpen, setAddFolderOpen] = useState(false);
  const [addFolderName, setAddFolderName] = useState("");
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [versionHistoryDoc, setVersionHistoryDoc] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false);
  const [bulkMoveFolderId, setBulkMoveFolderId] = useState<string>("none");
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dragDocId, setDragDocId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Column visibility for table view
  const [visibleColumns, setVisibleColumns] = useState({
    domain: true,
    folder: true,
    description: true,
    size: true,
    date: true,
  });

  const toggleColumn = (col: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const columnLabels: Record<keyof typeof visibleColumns, string> = {
    domain: "Domain",
    folder: "Folder",
    description: "Description",
    size: "Size",
    date: "Date",
  };

  // Inline editing state for table view
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineField, setInlineField] = useState<string | null>(null);
  const [inlineValue, setInlineValue] = useState("");

  // Edit form state (dialog)
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDomain, setEditDomain] = useState("");
  const [editAiReady, setEditAiReady] = useState(false);

  const currentDomainObj = domains.find(d => d.id === selectedDomain);
  const isSpecificDomain = selectedDomain !== "all" && selectedDomain !== "unassigned";

  // Folders relevant to the selected domain
  const domainFolders = isSpecificDomain
    ? folders.filter(f => f.domain_id === selectedDomain || !f.domain_id)
    : folders;
  const domainFolderCounts = domainFolders.map(f => ({
    ...f,
    count: documents.filter(doc => doc.folder_id === f.id).length,
  }));

  const getDomain = (domainId: string | null) => domains.find(d => d.id === domainId);
  const getFolder = (folderId: string | null) => folders.find(f => f.id === folderId);
  const currentFolderObj = selectedFolder !== "all" && selectedFolder !== "unfiled" ? folders.find(f => f.id === selectedFolder) : null;

  // Build a map of file_name -> list of folder names where duplicates exist
  const duplicateMap = new Map<string, string[]>();
  for (const doc of documents) {
    const key = doc.file_name;
    if (!duplicateMap.has(key)) duplicateMap.set(key, []);
    duplicateMap.get(key)!.push(doc.id);
  }
  const getDuplicateLocations = (doc: any) => {
    const ids = duplicateMap.get(doc.file_name) || [];
    if (ids.length <= 1) return null;
    const otherDocs = documents.filter(d => d.file_name === doc.file_name && d.id !== doc.id);
    return otherDocs.map(d => {
      const f = getFolder(d.folder_id);
      const dm = getDomain(d.domain_id);
      return f ? f.name : dm ? dm.name : "Unfiled";
    });
  };

  const isDomainRootView = isSpecificDomain && (selectedFolder === "all");

  const filtered = documents
    .filter(doc => {
      const matchSearch = !search || doc.title.toLowerCase().includes(search.toLowerCase()) ||
        doc.file_name.toLowerCase().includes(search.toLowerCase()) ||
        doc.description?.toLowerCase().includes(search.toLowerCase());
      const matchDomain = selectedDomain === "all" ||
        (selectedDomain === "unassigned" ? !doc.domain_id : doc.domain_id === selectedDomain);
      const matchFolder = selectedFolder === "all" ||
        (selectedFolder === "unfiled" ? !doc.folder_id : doc.folder_id === selectedFolder);
      const matchType = typeFilter === "all" ||
        (typeFilter === "pdf" && doc.file_type.includes("pdf")) ||
        (typeFilter === "excel" && (doc.file_type.includes("sheet") || doc.file_type.includes("csv") || doc.file_type.includes("excel"))) ||
        (typeFilter === "word" && (doc.file_type.includes("word") || doc.file_type.includes("doc"))) ||
        (typeFilter === "image" && (doc.file_type.includes("image") || doc.file_type.includes("png") || doc.file_type.includes("jpg")));

      if (isDomainRootView && doc.folder_id) return false;

      return matchSearch && matchDomain && matchFolder && matchType;
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortField === "title") return dir * a.title.localeCompare(b.title);
      if (sortField === "file_size") return dir * (a.file_size - b.file_size);
      return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });

  const openEdit = (doc: any) => {
    setEditDoc(doc);
    setEditTitle(doc.title);
    setEditDescription(doc.description || "");
    setEditDomain(doc.domain_id || "");
    setEditAiReady(doc.ai_ready);
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editDoc) return;
    try {
      await updateDocument.mutateAsync({
        id: editDoc.id,
        title: editTitle,
        description: editDescription,
        domain_id: editDomain || null,
        ai_ready: editAiReady,
      });
      toast({ title: "Document updated" });
      setEditOpen(false);
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteDoc) return;
    try {
      await deleteDocument.mutateAsync({ id: deleteDoc.id, file_path: deleteDoc.file_path });
      toast({ title: "Document deleted" });
      setDeleteOpen(false);
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  const handlePreview = async (doc: any) => {
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.file_path, 60);

    if (error || !data?.signedUrl) {
      toast({ title: "Preview failed", description: error?.message ?? "Could not generate secure preview link", variant: "destructive" });
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownload = async (doc: any) => {
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

  const openMove = (doc: any) => {
    setMoveDoc(doc);
    setMoveFolderId(doc.folder_id || "none");
    setMoveOpen(true);
  };

  const handleMove = async () => {
    if (!moveDoc) return;
    try {
      await updateDocument.mutateAsync({
        id: moveDoc.id,
        folder_id: moveFolderId !== "none" ? moveFolderId : null,
      });
      toast({ title: "Document moved" });
      setMoveOpen(false);
    } catch (err: any) {
      toast({ title: "Move failed", description: err.message, variant: "destructive" });
    }
  };

  const handleAddFolderToDomain = async () => {
    if (!addFolderName.trim()) return;
    try {
      await addFolder.mutateAsync({
        name: addFolderName.trim(),
        domain_id: isSpecificDomain ? selectedDomain : null,
      });
      toast({ title: "Folder created" });
      setAddFolderName("");
      setAddFolderOpen(false);
    } catch (err: any) {
      toast({ title: "Failed to create folder", description: err.message, variant: "destructive" });
    }
  };

  const getVersionsForFile = (doc: any) => {
    return documents.filter(d => d.file_name === doc.file_name && d.folder_id === doc.folder_id && d.domain_id === doc.domain_id);
  };

  const openVersionHistory = (doc: any) => {
    setVersionHistoryDoc(doc);
    setVersionHistoryOpen(true);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(d => d.id)));
    }
  };

  const handleBulkDelete = async () => {
    setBulkProcessing(true);
    try {
      const toDelete = documents.filter(d => selectedIds.has(d.id));
      for (const doc of toDelete) {
        await deleteDocument.mutateAsync({ id: doc.id, file_path: doc.file_path });
      }
      toast({ title: `${toDelete.length} document(s) deleted` });
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
    } catch (err: any) {
      toast({ title: "Bulk delete failed", description: err.message, variant: "destructive" });
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkMove = async () => {
    setBulkProcessing(true);
    try {
      for (const id of selectedIds) {
        await updateDocument.mutateAsync({
          id,
          folder_id: bulkMoveFolderId !== "none" ? bulkMoveFolderId : null,
        });
      }
      toast({ title: `${selectedIds.size} document(s) moved` });
      setSelectedIds(new Set());
      setBulkMoveOpen(false);
    } catch (err: any) {
      toast({ title: "Bulk move failed", description: err.message, variant: "destructive" });
    } finally {
      setBulkProcessing(false);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const hasActiveFilters = search || typeFilter !== "all";

  const startInlineEdit = (docId: string, field: string, currentValue: string) => {
    setInlineEditId(docId);
    setInlineField(field);
    setInlineValue(currentValue);
  };

  const cancelInlineEdit = () => {
    setInlineEditId(null);
    setInlineField(null);
    setInlineValue("");
  };

  const saveInlineEdit = async () => {
    if (!inlineEditId || !inlineField) return;
    try {
      const update: any = { id: inlineEditId };
      if (inlineField === "title") update.title = inlineValue.trim() || undefined;
      else if (inlineField === "description") update.description = inlineValue.trim();
      else if (inlineField === "domain_id") update.domain_id = inlineValue || null;

      if (inlineField === "title" && !inlineValue.trim()) {
        toast({ title: "Title cannot be empty", variant: "destructive" });
        return;
      }

      await updateDocument.mutateAsync(update);
      toast({ title: "Updated" });
      cancelInlineEdit();
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
  };

  const handleInlineKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveInlineEdit();
    else if (e.key === "Escape") cancelInlineEdit();
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold font-heading text-foreground">Document Management</h1>
            <p className="text-muted-foreground text-sm mt-1">Upload, organize and manage your documents</p>
          </div>
          <Button
            onClick={() => setUploadOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 shadow-md hover:shadow-lg transition-all gap-2"
          >
            <Plus className="h-4 w-4" /> Upload Documents
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <DocumentSidebar
            documents={documents}
            selectedDomain={selectedDomain}
            setSelectedDomain={setSelectedDomain}
            selectedFolder={selectedFolder}
            setSelectedFolder={setSelectedFolder}
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search & Filter Bar */}
            <div className="bg-card border border-border rounded-2xl p-3 mb-5">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by title, filename, or description..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-10 pr-8 rounded-xl border-border bg-background"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[130px] rounded-xl">
                      <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      <SelectValue placeholder="File type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="pdf">📄 PDF</SelectItem>
                      <SelectItem value="excel">📊 Excel/CSV</SelectItem>
                      <SelectItem value="word">📝 Word</SelectItem>
                      <SelectItem value="image">🖼️ Images</SelectItem>
                    </SelectContent>
                  </Select>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-xl shrink-0"
                          onClick={() => toggleSort(sortField)}
                        >
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Sort by {sortField === "created_at" ? "date" : sortField} ({sortDir})
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              {/* Sort chips */}
              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                {(["created_at", "title", "file_size"] as SortField[]).map(field => (
                  <button
                    key={field}
                    onClick={() => toggleSort(field)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                      sortField === field
                        ? "bg-primary/10 border-primary/30 text-primary font-semibold"
                        : "border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
                    }`}
                  >
                    {field === "created_at" ? "Date" : field === "title" ? "Name" : "Size"}
                    {sortField === field && (sortDir === "asc" ? " ↑" : " ↓")}
                  </button>
                ))}
                {hasActiveFilters && (
                  <button
                    onClick={() => { setSearch(""); setTypeFilter("all"); }}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-destructive/30 text-destructive hover:bg-destructive/5 transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {/* Breadcrumb Navigation — enhanced for mobile quick nav */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Breadcrumb className="flex-1 min-w-0">
                <BreadcrumbList className="flex-wrap">
                  <BreadcrumbItem>
                    {selectedDomain !== "all" || selectedFolder !== "all" ? (
                      <BreadcrumbLink
                        className="cursor-pointer text-primary hover:text-primary/80 flex items-center gap-1"
                        onClick={() => { setSelectedDomain("all"); setSelectedFolder("all"); }}
                      >
                        <Home className="h-3.5 w-3.5 md:hidden" />
                        <span className="hidden md:inline">All Documents</span>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="flex items-center gap-1">
                        <Home className="h-3.5 w-3.5 md:hidden" />
                        <span className="hidden md:inline">All Documents</span>
                        <span className="md:hidden">All</span>
                      </BreadcrumbPage>
                    )}
                  </BreadcrumbItem>

                  {/* Domain level — with mobile dropdown switcher */}
                  {currentDomainObj && (
                    <>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="flex items-center gap-1 text-sm md:hidden">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ background: currentDomainObj.color }}
                            />
                            <span className={`truncate max-w-[120px] ${currentFolderObj ? "text-primary" : "font-medium text-foreground"}`}>
                              {currentDomainObj.abbreviation}
                            </span>
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-52">
                            {domains.map(d => (
                              <DropdownMenuItem
                                key={d.id}
                                onClick={() => { setSelectedDomain(d.id); setSelectedFolder("all"); }}
                                className={d.id === selectedDomain ? "bg-primary/10 font-medium" : ""}
                              >
                                <span className="w-2.5 h-2.5 rounded-full shrink-0 mr-2" style={{ background: d.color }} />
                                {d.name}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setSelectedDomain("unassigned"); setSelectedFolder("all"); }}>
                              <AlertTriangle className="h-3.5 w-3.5 mr-2 text-amber-500" /> Unassigned
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {/* Desktop: plain breadcrumb link */}
                        {currentFolderObj ? (
                          <BreadcrumbLink
                            className="cursor-pointer text-primary hover:text-primary/80 hidden md:inline"
                            onClick={() => setSelectedFolder("all")}
                          >
                            {currentDomainObj.name}
                          </BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage className="hidden md:inline">{currentDomainObj.name}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                    </>
                  )}

                  {selectedDomain === "unassigned" && (
                    <>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>Unassigned</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}

                  {/* Folder level — with mobile dropdown switcher */}
                  {currentFolderObj && (
                    <>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="flex items-center gap-1 text-sm md:hidden">
                            <Folder className="h-3.5 w-3.5 text-primary/70" />
                            <span className="font-medium text-foreground truncate max-w-[100px]">{currentFolderObj.name}</span>
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48">
                            {folders
                              .filter(f => f.domain_id === selectedDomain)
                              .map(f => (
                                <DropdownMenuItem
                                  key={f.id}
                                  onClick={() => setSelectedFolder(f.id)}
                                  className={f.id === selectedFolder ? "bg-primary/10 font-medium" : ""}
                                >
                                  <Folder className="h-3.5 w-3.5 mr-2 text-primary/70" />
                                  {f.name}
                                </DropdownMenuItem>
                              ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setSelectedFolder("all")}>
                              <FolderOpen className="h-3.5 w-3.5 mr-2" /> All in domain
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <BreadcrumbPage className="hidden md:inline">{currentFolderObj.name}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}
                </BreadcrumbList>
              </Breadcrumb>

              {/* Mobile: quick domain pill when at "All" level */}
              {selectedDomain === "all" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs md:hidden h-8">
                      Go to domain <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    {domains.map(d => (
                      <DropdownMenuItem
                        key={d.id}
                        onClick={() => { setSelectedDomain(d.id); setSelectedFolder("all"); }}
                      >
                        <span className="w-2.5 h-2.5 rounded-full shrink-0 mr-2" style={{ background: d.color }} />
                        {d.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Section Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold font-heading text-foreground">
                  {currentFolderObj ? currentFolderObj.name : currentDomainObj ? currentDomainObj.name : selectedDomain === "unassigned" ? "Unassigned" : "All Documents"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isDomainRootView
                    ? `${domainFolderCounts.length} folder${domainFolderCounts.length !== 1 ? "s" : ""}${filtered.length > 0 ? ` • ${filtered.length} unfiled` : ""}`
                    : `${filtered.length} document${filtered.length !== 1 ? "s" : ""}`
                  }
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* View Toggle */}
                <div className="flex items-center border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 transition-colors ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 transition-colors ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
                {viewMode === "list" && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon" className="rounded-xl h-9 w-9">
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-44 p-2">
                      <p className="text-xs font-medium text-muted-foreground px-2 py-1.5">Toggle columns</p>
                      {(Object.keys(visibleColumns) as (keyof typeof visibleColumns)[]).map(col => (
                        <label
                          key={col}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/60 cursor-pointer transition-colors"
                        >
                          <Checkbox
                            checked={visibleColumns[col]}
                            onCheckedChange={() => toggleColumn(col)}
                            className="h-3.5 w-3.5"
                          />
                          <span className="text-sm text-foreground">{columnLabels[col]}</span>
                        </label>
                      ))}
                    </PopoverContent>
                  </Popover>
                )}
                {isSpecificDomain && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddFolderOpen(true)}
                    className="rounded-xl gap-2 text-xs"
                  >
                    <FolderPlus className="h-3.5 w-3.5" /> Add Folder
                  </Button>
                )}
              </div>
            </div>

            {/* Folder Cards (drop targets) */}
            {selectedFolder === "all" && domainFolderCounts.length > 0 && (
              <div className="mb-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {domainFolderCounts.map(f => {
                    const isDragOver = dragOverFolderId === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setSelectedFolder(f.id)}
                        onDragOver={e => { e.preventDefault(); setDragOverFolderId(f.id); }}
                        onDragEnter={e => { e.preventDefault(); setDragOverFolderId(f.id); }}
                        onDragLeave={() => setDragOverFolderId(null)}
                        onDrop={async e => {
                          e.preventDefault();
                          setDragOverFolderId(null);
                          const docId = e.dataTransfer.getData("text/doc-id");
                          if (!docId) return;
                          // If multiple selected and dragged doc is among them, move all selected
                          const idsToMove = selectedIds.has(docId) && selectedIds.size > 1
                            ? Array.from(selectedIds)
                            : [docId];
                          try {
                            for (const id of idsToMove) {
                              await updateDocument.mutateAsync({ id, folder_id: f.id });
                            }
                            toast({ title: `${idsToMove.length} document${idsToMove.length > 1 ? "s" : ""} moved to ${f.name}` });
                            setSelectedIds(new Set());
                          } catch (err: any) {
                            toast({ title: "Move failed", description: err.message, variant: "destructive" });
                          }
                          setDragDocId(null);
                        }}
                        className={`bg-card border rounded-2xl p-4 text-left transition-all duration-200 group ${
                          isDragOver
                            ? "border-primary border-2 bg-primary/5 shadow-lg scale-[1.02]"
                            : "border-border hover:shadow-lg hover:border-primary/40 hover:-translate-y-0.5"
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl w-fit mb-3 transition-colors ${isDragOver ? "bg-primary/20" : "bg-primary/8 group-hover:bg-primary/15"}`}>
                          <Folder className={`h-6 w-6 ${isDragOver ? "text-primary animate-pulse" : "text-primary"}`} />
                        </div>
                        <p className="text-sm font-semibold text-foreground truncate">{f.name}</p>
                        <p className={`text-xs flex items-center gap-1 mt-1 ${isDragOver ? "text-primary font-medium" : "text-muted-foreground"}`}>
                          {isDragOver ? (
                            <>Drop here to move</>
                          ) : (
                            <><FileText className="h-3 w-3" /> {f.count} {f.count === 1 ? "file" : "files"}</>
                          )}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 mb-4 p-3 bg-primary/5 border border-primary/20 rounded-xl animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckSquare className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{selectedIds.size} selected</span>
                </div>
                <div className="flex-1" />
                <Button size="sm" variant="outline" className="gap-1.5 rounded-xl" onClick={() => { setBulkMoveFolderId("none"); setBulkMoveOpen(true); }}>
                  <FolderOpen className="h-3.5 w-3.5" /> Move
                </Button>
                <Button size="sm" variant="destructive" className="gap-1.5 rounded-xl" onClick={() => setBulkDeleteOpen(true)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
                <Button size="sm" variant="ghost" className="text-muted-foreground rounded-xl" onClick={() => setSelectedIds(new Set())}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading documents...</p>
              </div>
            ) : filtered.length === 0 && !isDomainRootView ? (
              <div className="text-center py-20">
                <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="h-10 w-10 text-muted-foreground/40" />
                </div>
                <p className="text-foreground font-medium">No documents found</p>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
                <Button variant="outline" className="mt-4 rounded-xl" onClick={() => { setSearch(""); setTypeFilter("all"); }}>
                  Clear filters
                </Button>
              </div>
            ) : isDomainRootView && filtered.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <div className="h-16 w-16 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                  <Folder className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium">Navigate into a folder above to view documents</p>
              </div>
            ) : (
              <>
                {/* Select All */}
                <div className="flex items-center gap-2 mb-3">
                  <button onClick={toggleSelectAll} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    {selectedIds.size === filtered.length && filtered.length > 0
                      ? <CheckSquare className="h-4 w-4 text-primary" />
                      : <Square className="h-4 w-4" />
                    }
                    Select all ({filtered.length})
                  </button>
                </div>
                {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filtered.map(doc => {
                    const domain = getDomain(doc.domain_id);
                    const folder = getFolder(doc.folder_id);
                    const isSelected = selectedIds.has(doc.id);
                    const dupes = getDuplicateLocations(doc);
                    const emoji = fileTypeIcon(doc.file_type);

                    return (
                      <div
                        key={doc.id}
                        draggable
                        onDragStart={e => {
                          setDragDocId(doc.id);
                          e.dataTransfer.setData("text/doc-id", doc.id);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={() => { setDragDocId(null); setDragOverFolderId(null); }}
                        className={`bg-card border rounded-2xl p-4 hover:shadow-lg transition-all duration-200 group cursor-grab active:cursor-grabbing ${
                          dragDocId === doc.id
                            ? "opacity-50 scale-95 border-primary/40"
                            : isSelected
                              ? "border-primary ring-2 ring-primary/10 shadow-md"
                              : "border-border hover:border-primary/20"
                        }`}
                      >
                        {/* Card Header */}
                        <div className="flex items-start gap-3">
                          <button onClick={() => toggleSelect(doc.id)} className="mt-1 shrink-0">
                            {isSelected
                              ? <CheckSquare className="h-5 w-5 text-primary" />
                              : <Square className="h-5 w-5 text-muted-foreground/30 hover:text-muted-foreground group-hover:text-muted-foreground/60 transition-colors" />
                            }
                          </button>
                          <div className="h-12 w-12 rounded-xl bg-primary/8 flex items-center justify-center text-xl shrink-0">
                            {emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground text-sm truncate" title={doc.title}>
                              {doc.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate" title={doc.file_name}>
                              {doc.file_name}
                            </p>
                            {/* Badges */}
                            <div className="flex items-center gap-1.5 flex-wrap mt-2">
                              {domain && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-2 py-0 font-semibold rounded-md"
                                  style={{ borderColor: domain.color, color: domain.color }}
                                >
                                  {domain.abbreviation}
                                </Badge>
                              )}
                              {doc.ai_ready && (
                                <Badge variant="outline" className="text-[10px] px-2 py-0 border-primary text-primary font-medium gap-1 rounded-md">
                                  <Sparkles className="h-3 w-3" /> AI
                                </Badge>
                              )}
                              {(doc as any).version > 1 && (
                                <Badge variant="outline" className="text-[10px] px-2 py-0 border-muted-foreground/40 text-muted-foreground font-medium rounded-md">
                                  v{(doc as any).version}
                                </Badge>
                              )}
                              {dupes && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge variant="outline" className="text-[10px] px-2 py-0 border-amber-400 text-amber-600 font-medium gap-1 cursor-help rounded-md">
                                        <AlertTriangle className="h-3 w-3" /> Dup
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-[200px]">
                                      <p className="text-xs">Also in: {dupes.join(", ")}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Meta info */}
                        <div className="flex items-center gap-3 mt-3 ml-[68px] text-[11px] text-muted-foreground">
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                          <span>{formatDate(doc.created_at)}</span>
                          {folder && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                              <span className="flex items-center gap-1">
                                <FolderOpen className="h-3 w-3" /> {folder.name}
                              </span>
                            </>
                          )}
                        </div>

                        {doc.description && (
                          <p className="text-xs text-muted-foreground ml-[68px] mt-1.5 line-clamp-2">{doc.description}</p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-0.5 mt-3 ml-[68px] pt-3 border-t border-border">
                          <TooltipProvider delayDuration={300}>
                            {[
                              { icon: Eye, label: "Preview", onClick: () => handlePreview(doc) },
                              { icon: Download, label: "Download", onClick: () => handleDownload(doc) },
                              { icon: FolderOpen, label: "Move", onClick: () => openMove(doc) },
                              { icon: Clock, label: "Versions", onClick: () => openVersionHistory(doc) },
                              { icon: Pencil, label: "Edit", onClick: () => openEdit(doc) },
                            ].map(({ icon: Icon, label, onClick }) => (
                              <Tooltip key={label}>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={onClick}
                                    className="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/5 transition-all"
                                  >
                                    <Icon className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
                              </Tooltip>
                            ))}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => { setDeleteDoc(doc); setDeleteOpen(true); }}
                                  className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/5 transition-all"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="text-xs">Delete</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    );
                  })}
                </div>
                ) : (
                /* Table / List View */
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="w-10 px-3 py-3 text-left">
                            <button onClick={toggleSelectAll}>
                              {selectedIds.size === filtered.length && filtered.length > 0
                                ? <CheckSquare className="h-4 w-4 text-primary" />
                                : <Square className="h-4 w-4 text-muted-foreground" />
                              }
                            </button>
                          </th>
                          <th className="px-3 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground w-[30%]" onClick={() => toggleSort("title")}>
                            Name {sortField === "title" && (sortDir === "asc" ? "↑" : "↓")}
                          </th>
                          {visibleColumns.domain && (
                            <th className="px-3 py-3 text-left font-medium text-muted-foreground">Domain</th>
                          )}
                          {visibleColumns.folder && (
                            <th className="px-3 py-3 text-left font-medium text-muted-foreground">Folder</th>
                          )}
                          {visibleColumns.description && (
                            <th className="px-3 py-3 text-left font-medium text-muted-foreground">Description</th>
                          )}
                          {visibleColumns.size && (
                            <th className="px-3 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => toggleSort("file_size")}>
                              Size {sortField === "file_size" && (sortDir === "asc" ? "↑" : "↓")}
                            </th>
                          )}
                          {visibleColumns.date && (
                            <th className="px-3 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => toggleSort("created_at")}>
                              Date {sortField === "created_at" && (sortDir === "asc" ? "↑" : "↓")}
                            </th>
                          )}
                          <th className="px-3 py-3 text-right font-medium text-muted-foreground w-[120px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(doc => {
                          const domain = getDomain(doc.domain_id);
                          const folder = getFolder(doc.folder_id);
                          const isSelected = selectedIds.has(doc.id);
                          const emoji = fileTypeIcon(doc.file_type);

                          return (
                            <tr
                              key={doc.id}
                              draggable
                              onDragStart={e => {
                                setDragDocId(doc.id);
                                e.dataTransfer.setData("text/doc-id", doc.id);
                                e.dataTransfer.effectAllowed = "move";
                              }}
                              onDragEnd={() => { setDragDocId(null); setDragOverFolderId(null); }}
                              className={`border-b border-border last:border-0 transition-colors cursor-grab active:cursor-grabbing ${
                                dragDocId === doc.id
                                  ? "opacity-50 bg-primary/5"
                                  : isSelected
                                    ? "bg-primary/5"
                                    : "hover:bg-muted/40"
                              }`}
                            >
                              <td className="px-3 py-2.5">
                                <button onClick={() => toggleSelect(doc.id)}>
                                  {isSelected
                                    ? <CheckSquare className="h-4 w-4 text-primary" />
                                    : <Square className="h-4 w-4 text-muted-foreground/40 hover:text-muted-foreground" />
                                  }
                                </button>
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="text-base shrink-0">{emoji}</span>
                                  {inlineEditId === doc.id && inlineField === "title" ? (
                                    <div className="flex items-center gap-1 flex-1 min-w-0">
                                      <Input
                                        value={inlineValue}
                                        onChange={e => setInlineValue(e.target.value)}
                                        onKeyDown={handleInlineKeyDown}
                                        onBlur={saveInlineEdit}
                                        className="h-7 text-sm rounded-lg px-2"
                                        autoFocus
                                      />
                                    </div>
                                  ) : (
                                    <div
                                      className="min-w-0 flex-1 cursor-pointer group/title rounded px-1 -mx-1 hover:bg-muted/60 transition-colors"
                                      onClick={() => startInlineEdit(doc.id, "title", doc.title)}
                                      title="Click to edit"
                                    >
                                      <p className="font-medium text-foreground truncate text-sm">{doc.title}</p>
                                      <p className="text-[11px] text-muted-foreground truncate">{doc.file_name}</p>
                                    </div>
                                  )}
                                  {doc.ai_ready && <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />}
                                  {(doc as any).version > 1 && (
                                    <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 shrink-0">v{(doc as any).version}</span>
                                  )}
                                </div>
                              </td>
                              {visibleColumns.domain && (
                              <td className="px-3 py-2.5">
                                {inlineEditId === doc.id && inlineField === "domain_id" ? (
                                  <Select
                                    value={inlineValue}
                                    onValueChange={val => {
                                      setInlineValue(val === "none" ? "" : val);
                                    }}
                                    onOpenChange={open => { if (!open) saveInlineEdit(); }}
                                    defaultOpen
                                  >
                                    <SelectTrigger className="h-7 text-[11px] rounded-lg w-full">
                                      <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">None</SelectItem>
                                      {domains.map(d => (
                                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <div
                                    className="cursor-pointer rounded px-1 -mx-1 hover:bg-muted/60 transition-colors py-0.5"
                                    onClick={() => startInlineEdit(doc.id, "domain_id", doc.domain_id || "")}
                                    title="Click to edit"
                                  >
                                    {domain ? (
                                      <Badge variant="outline" className="text-[10px] px-2 py-0 font-semibold rounded-md" style={{ borderColor: domain.color, color: domain.color }}>
                                        {domain.abbreviation}
                                      </Badge>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">—</span>
                                    )}
                                  </div>
                                )}
                              </td>
                              )}
                              {visibleColumns.folder && (
                              <td className="px-3 py-2.5">
                                {folder ? (
                                  <span className="text-xs text-foreground flex items-center gap-1 truncate">
                                    <Folder className="h-3 w-3 text-muted-foreground shrink-0" /> {folder.name}
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </td>
                              )}
                              {visibleColumns.description && (
                              <td className="px-3 py-2.5">
                                {inlineEditId === doc.id && inlineField === "description" ? (
                                  <Input
                                    value={inlineValue}
                                    onChange={e => setInlineValue(e.target.value)}
                                    onKeyDown={handleInlineKeyDown}
                                    onBlur={saveInlineEdit}
                                    className="h-7 text-xs rounded-lg px-2"
                                    autoFocus
                                    placeholder="Add description..."
                                  />
                                ) : (
                                  <p
                                    className="text-xs text-muted-foreground truncate cursor-pointer rounded px-1 -mx-1 hover:bg-muted/60 transition-colors py-0.5"
                                    title={doc.description ? `${doc.description} — Click to edit` : "Click to add description"}
                                    onClick={() => startInlineEdit(doc.id, "description", doc.description || "")}
                                  >
                                    {doc.description || <span className="italic text-muted-foreground/50">Add description...</span>}
                                  </p>
                                )}
                              </td>
                              )}
                              {visibleColumns.size && (
                                <td className="px-3 py-2.5 text-xs text-muted-foreground">{formatFileSize(doc.file_size)}</td>
                              )}
                              {visibleColumns.date && (
                                <td className="px-3 py-2.5 text-xs text-muted-foreground">{formatDate(doc.created_at)}</td>
                              )}
                              <td className="px-3 py-2.5">
                                <div className="flex items-center justify-end gap-0.5">
                                  <TooltipProvider delayDuration={300}>
                                    {[
                                      { icon: Eye, label: "Preview", onClick: () => handlePreview(doc) },
                                      { icon: Download, label: "Download", onClick: () => handleDownload(doc) },
                                      { icon: Pencil, label: "Edit", onClick: () => openEdit(doc) },
                                      { icon: Trash2, label: "Delete", onClick: () => { setDeleteDoc(doc); setDeleteOpen(true); }, destructive: true },
                                    ].map(({ icon: Icon, label, onClick, destructive }) => (
                                      <Tooltip key={label}>
                                        <TooltipTrigger asChild>
                                          <button
                                            onClick={onClick}
                                            className={`p-1.5 rounded-lg transition-all ${destructive ? "text-muted-foreground hover:text-destructive hover:bg-destructive/5" : "text-muted-foreground hover:text-primary hover:bg-primary/5"}`}
                                          >
                                            <Icon className="h-3.5 w-3.5" />
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
                                      </Tooltip>
                                    ))}
                                  </TooltipProvider>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Upload Dialog */}
      <UploadDocumentDialog open={uploadOpen} onOpenChange={setUploadOpen} />

      {/* Move to Folder Dialog */}
      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Move to Folder</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-2">
            Move <strong>{moveDoc?.title}</strong> to a folder:
          </p>
          <Select value={moveFolderId} onValueChange={setMoveFolderId}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No folder (unfiled)</SelectItem>
              {folders.map(f => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveOpen(false)}>Cancel</Button>
            <Button onClick={handleMove}>Move</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Title</label>
              <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="mt-1 rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} className="mt-1 rounded-xl" rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Domain</label>
              <Select value={editDomain} onValueChange={setEditDomain}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Select domain" /></SelectTrigger>
                <SelectContent>
                  {domains.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={editAiReady} onChange={e => setEditAiReady(e.target.checked)} className="rounded border-input" id="ai-ready" />
              <label htmlFor="ai-ready" className="text-sm text-foreground flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> AI Ready
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={!editTitle}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deleteDoc?.title}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Folder Dialog */}
      <Dialog open={addFolderOpen} onOpenChange={open => { if (!open) { setAddFolderOpen(false); setAddFolderName(""); } else setAddFolderOpen(true); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Folder{currentDomainObj ? ` to ${currentDomainObj.name}` : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground">Folder Name</label>
              <Input
                value={addFolderName}
                onChange={e => setAddFolderName(e.target.value)}
                placeholder="Enter folder name"
                className="mt-1 rounded-xl"
                autoFocus
                onKeyDown={e => { if (e.key === "Enter" && addFolderName.trim()) handleAddFolderToDomain(); }}
              />
            </div>
            {isSpecificDomain && currentDomainObj && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: currentDomainObj.color }} />
                Will be saved to <strong>{currentDomainObj.name}</strong>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddFolderOpen(false); setAddFolderName(""); }}>Cancel</Button>
            <Button onClick={handleAddFolderToDomain} disabled={!addFolderName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <VersionHistoryDialog
        open={versionHistoryOpen}
        onOpenChange={setVersionHistoryOpen}
        versions={versionHistoryDoc ? getVersionsForFile(versionHistoryDoc) : []}
        fileName={versionHistoryDoc?.file_name || ""}
      />

      {/* Bulk Move Dialog */}
      <Dialog open={bulkMoveOpen} onOpenChange={setBulkMoveOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Move {selectedIds.size} Document(s)</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-2">Select destination folder:</p>
          <Select value={bulkMoveFolderId} onValueChange={setBulkMoveFolderId}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No folder (unfiled)</SelectItem>
              {folders.map(f => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkMoveOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkMove} disabled={bulkProcessing}>
              {bulkProcessing ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Moving...</> : "Move All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.size} Document(s)</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{selectedIds.size} document(s)</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={bulkProcessing}>
              {bulkProcessing ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Deleting...</> : "Delete All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminDocuments;
