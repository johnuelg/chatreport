import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  FolderPlus, ChevronRight, ChevronDown, FileText, Folder,
  MoreHorizontal, Pencil, Trash2, LayoutGrid, AlertCircle, PanelLeftOpen,
  ChevronsUpDown, ChevronsDownUp,
} from "lucide-react";
import {
  useDocumentFolders, useAddDocumentFolder, useUpdateDocumentFolder, useDeleteDocumentFolder,
} from "@/hooks/useDocumentFolders";
import { useDomains } from "@/hooks/useDomains";
import { toast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface DocumentSidebarProps {
  documents: any[];
  selectedDomain: string;
  setSelectedDomain: (id: string) => void;
  selectedFolder: string;
  setSelectedFolder: (id: string) => void;
}

const DocumentSidebar = ({
  documents,
  selectedDomain,
  setSelectedDomain,
  selectedFolder,
  setSelectedFolder,
}: DocumentSidebarProps) => {
  const { data: domains = [] } = useDomains();
  const { data: folders = [] } = useDocumentFolders();
  const addFolder = useAddDocumentFolder();
  const updateFolder = useUpdateDocumentFolder();
  const deleteFolder = useDeleteDocumentFolder();

  
  
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDomain, setNewFolderDomain] = useState<string>("none");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [inlineAddDomainId, setInlineAddDomainId] = useState<string | null>(null);
  const [inlineFolderName, setInlineFolderName] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const deleteFolderObj = folders.find(f => f.id === deleteConfirmId);

  const unassignedCount = documents.filter(doc => !doc.domain_id).length;

  const toggleDomainExpand = (domainId: string) => {
    setExpandedDomains(prev => ({ ...prev, [domainId]: !prev[domainId] }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    domains.forEach(d => { next[d.id] = true; });
    setExpandedDomains(next);
  };

  const collapseAll = () => {
    setExpandedDomains({});
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await addFolder.mutateAsync({
        name: newFolderName.trim(),
        domain_id: newFolderDomain !== "none" ? newFolderDomain : null,
      });
      toast({ title: "Folder created" });
      setNewFolderName("");
      setNewFolderDomain("none");
      setCreateDialogOpen(false);
      if (newFolderDomain !== "none") {
        setExpandedDomains(prev => ({ ...prev, [newFolderDomain]: true }));
      }
    } catch (err: any) {
      toast({ title: "Failed to create folder", description: err.message, variant: "destructive" });
    }
  };

  const handleRename = async (id: string) => {
    if (!renameValue.trim()) return;
    try {
      await updateFolder.mutateAsync({ id, name: renameValue.trim() });
      toast({ title: "Folder renamed" });
      setRenamingId(null);
      setRenameValue("");
    } catch (err: any) {
      toast({ title: "Rename failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      if (selectedFolder === deleteConfirmId) {
        setSelectedFolder("all");
        setSelectedDomain("all");
      }
      await deleteFolder.mutateAsync(deleteConfirmId);
      toast({ title: "Folder deleted" });
      setDeleteConfirmId(null);
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  const handleNavClick = (domainId: string, folderId: string) => {
    setSelectedDomain(domainId);
    setSelectedFolder(folderId);
    setMobileOpen(false);
  };

  const sidebarBtn = (
    active: boolean,
    onClick: () => void,
    label: React.ReactNode,
    count: number,
    icon?: React.ReactNode,
    className?: string
  ) => (
    <button
      onClick={onClick}
      title={typeof label === "string" ? label : undefined}
      className={`w-full grid grid-cols-[minmax(0,1fr),auto] items-start gap-3 rounded-xl text-sm font-medium text-left transition-all duration-200 px-3 py-3 ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "hover:bg-muted/80 text-foreground/80 hover:text-foreground"
      } ${className ?? ""}`}
    >
      <span className="flex min-w-0 items-start gap-2.5">
        {icon ? <span className="mt-0.5 flex w-4 shrink-0 justify-center">{icon}</span> : null}
        <span className="min-w-0 break-words whitespace-normal leading-5">{label}</span>
      </span>
      <Badge
        variant="secondary"
        className={`mt-0.5 rounded-full text-[10px] px-2 min-w-[24px] justify-center shrink-0 font-semibold ${
          active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        {count}
      </Badge>
    </button>
  );

  const renderFolderItem = (f: { id: string; name: string; count: number }) => (
    <div key={f.id} className="group relative">
      {renamingId === f.id ? (
        <div className="flex items-center gap-1.5 px-2 py-1.5 pl-9">
          <Input
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            className="h-8 text-xs rounded-lg"
            autoFocus
            onKeyDown={e => {
              if (e.key === "Enter") handleRename(f.id);
              if (e.key === "Escape") { setRenamingId(null); setRenameValue(""); }
            }}
          />
          <Button size="sm" className="h-8 px-3 text-xs rounded-lg" onClick={() => handleRename(f.id)} disabled={!renameValue.trim()}>
            Save
          </Button>
        </div>
      ) : (
        <div className="flex items-center">
          <div className="flex-1 min-w-0">
            {sidebarBtn(
              selectedFolder === f.id,
              () => handleNavClick(selectedDomain, f.id),
              f.name,
              f.count,
              <Folder className="h-4 w-4 shrink-0 text-primary/70" />,
              "pl-7"
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 mr-1">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => { setRenamingId(f.id); setRenameValue(f.name); }}>
                <Pencil className="h-3.5 w-3.5 mr-2" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeleteConfirmId(f.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );

  const handleInlineAdd = async (domainId: string) => {
    if (!inlineFolderName.trim()) return;
    try {
      await addFolder.mutateAsync({ name: inlineFolderName.trim(), domain_id: domainId });
      toast({ title: "Folder created" });
      setInlineFolderName("");
      setInlineAddDomainId(null);
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const renderTopLevelItem = (
    active: boolean,
    onClick: () => void,
    label: React.ReactNode,
    count: number,
    icon: React.ReactNode,
    leading?: React.ReactNode
  ) => (
    <div className="grid grid-cols-[1.25rem,minmax(0,1fr)] items-start gap-2">
      <div className="flex h-11 items-center justify-center text-muted-foreground/70 shrink-0">
        {leading}
      </div>
      <div className="min-w-0">{sidebarBtn(active, onClick, label, count, icon)}</div>
    </div>
  );

  const topNav = (
    <div className="p-2.5 space-y-1">
      {renderTopLevelItem(
        selectedDomain === "all" && selectedFolder === "all",
        () => handleNavClick("all", "all"),
        "All Documents",
        documents.length,
        <FileText className="h-4 w-4 shrink-0 text-primary" />
      )}
      {unassignedCount > 0 && renderTopLevelItem(
        selectedDomain === "unassigned",
        () => handleNavClick("unassigned", "all"),
        "Unassigned",
        unassignedCount,
        <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
      )}
    </div>
  );

  const domainsNav = (
    <>
      {domains.length > 0 && (
        <div className="pt-1 pb-1 px-3">
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
            Domains
          </p>
        </div>
      )}
      <div className="px-2.5 space-y-1">
        {domains.map(d => {
          const domainDocs = documents.filter(doc => doc.domain_id === d.id);
          const domainFolders = folders
            .filter(f => f.domain_id === d.id)
            .map(f => ({
              ...f,
              count: documents.filter(doc => doc.folder_id === f.id).length,
            }));
          const isExpanded = expandedDomains[d.id] || selectedDomain === d.id;
          const isDomainActive = selectedDomain === d.id && selectedFolder === "all";

          return (
            <Collapsible key={d.id} open={isExpanded} onOpenChange={() => toggleDomainExpand(d.id)}>
              {renderTopLevelItem(
                isDomainActive,
                () => handleNavClick(d.id, "all"),
                d.name,
                domainDocs.length,
                <span
                  className="h-3 w-3 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-card"
                  style={{ background: d.color, boxShadow: `0 0 6px ${d.color}40` }}
                />,
                domainFolders.length > 0 ? (
                  <CollapsibleTrigger asChild>
                    <button
                      className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                      aria-label={isExpanded ? `Collapse ${d.name}` : `Expand ${d.name}`}
                    >
                      <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                    </button>
                  </CollapsibleTrigger>
                ) : (
                  <span className="block h-6 w-6" aria-hidden="true" />
                )
              )}
              <CollapsibleContent className="nav-collapsible overflow-hidden">
                <div className="mb-1 ml-[1.75rem] border-l-2 border-muted pl-1">
                  {domainFolders.map(f => renderFolderItem(f))}
                  {inlineAddDomainId === d.id ? (
                    <div className="flex items-center gap-1.5 px-2 py-1.5 pl-7">
                      <Input
                        value={inlineFolderName}
                        onChange={e => setInlineFolderName(e.target.value)}
                        placeholder="Folder name"
                        className="h-8 text-xs rounded-lg"
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === "Enter") handleInlineAdd(d.id);
                          if (e.key === "Escape") { setInlineAddDomainId(null); setInlineFolderName(""); }
                        }}
                      />
                      <Button
                        size="sm"
                        className="h-8 px-3 text-xs rounded-lg"
                        disabled={!inlineFolderName.trim()}
                        onClick={() => handleInlineAdd(d.id)}
                      >
                        Add
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setInlineAddDomainId(d.id); setInlineFolderName(""); }}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2 pl-7 text-left text-xs text-muted-foreground/60 transition-all hover:bg-primary/5 hover:text-primary"
                    >
                      <FolderPlus className="h-3.5 w-3.5" /> New folder
                    </button>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </>
  );

  const dialogs = (
    <>
      {/* Delete Folder Confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={open => { if (!open) setDeleteConfirmId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Folder</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deleteFolderObj?.name}</strong>? Documents inside will be moved to Unfiled.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={open => { if (!open) { setCreateDialogOpen(false); setNewFolderName(""); setNewFolderDomain("none"); } else setCreateDialogOpen(true); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Folder Name</Label>
              <Input
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                className="mt-1"
                autoFocus
                onKeyDown={e => { if (e.key === "Enter" && newFolderName.trim()) handleCreateFolder(); }}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Domain</Label>
              <Select value={newFolderDomain} onValueChange={setNewFolderDomain}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select domain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No domain</SelectItem>
                  {domains.map(d => (
                    <SelectItem key={d.id} value={d.id}>
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                        {d.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateDialogOpen(false); setNewFolderName(""); setNewFolderDomain("none"); }}>Cancel</Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  return (
    <>
      {/* Mobile: Sheet trigger + drawer */}
      <div className="md:hidden mb-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full justify-start gap-2 rounded-2xl px-4 py-6">
              <PanelLeftOpen className="h-4 w-4" />
              <span className="font-medium">Navigator</span>
              <Badge variant="secondary" className="ml-auto rounded-full text-[10px] px-2">
                {documents.length}
              </Badge>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[92vw] max-w-[22rem] p-0">
            <div className="px-4 py-3 border-b border-border bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">Navigator</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary"
                    onClick={expandAll}
                    title="Expand all"
                  >
                    <ChevronsUpDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary"
                    onClick={collapseAll}
                    title="Collapse all"
                  >
                    <ChevronsDownUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary"
                    onClick={() => setCreateDialogOpen(true)}
                    title="New folder"
                  >
                    <FolderPlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex flex-col h-[calc(100vh-60px)]">
              {topNav}
              <div className="flex-1 min-h-0 overflow-y-auto nav-scroll pb-2">
                {domainsNav}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Fixed sidebar */}
      <div className="hidden shrink-0 md:block md:w-[18.5rem] lg:w-80 xl:w-[22rem]">
        <div className="bg-card border border-border rounded-2xl overflow-hidden sticky top-4">
          {/* Sidebar Header */}
          <div className="px-4 py-3 border-b border-border bg-muted/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-foreground">Navigator</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary"
                  onClick={expandAll}
                  title="Expand all"
                >
                  <ChevronsUpDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary"
                  onClick={collapseAll}
                  title="Collapse all"
                >
                  <ChevronsDownUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary"
                  onClick={() => setCreateDialogOpen(true)}
                  title="New folder"
                >
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col max-h-[calc(100vh-240px)]">
            {topNav}
            <div className="flex-1 min-h-0 overflow-y-auto nav-scroll pb-2">
              {domainsNav}
            </div>
          </div>
        </div>
      </div>

      {dialogs}
    </>
  );
};

export default DocumentSidebar;
