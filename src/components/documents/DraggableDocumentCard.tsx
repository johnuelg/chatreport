import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Download, 
  Eye, 
  RefreshCw, 
  Pencil, 
  Trash2, 
  Loader2, 
  Sparkles, 
  Clock,
  GripVertical,
  Folder
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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
  color: string;
}

interface DraggableDocumentCardProps {
  doc: Document;
  index: number;
  isSelected: boolean;
  isAdmin: boolean;
  parsingDocId: string | null;
  replacingDocId?: string | null;
  replaceProgress?: number;
  domain?: Domain | null;
  onToggleSelect: (id: string) => void;
  onPreview: (doc: Document) => void;
  onDownload: (doc: Document) => void;
  onReparse: (doc: Document) => void;
  onQuickMove?: (doc: Document, folderId: string | null) => void;
  onRename: (doc: Document) => void;
  onDelete: (doc: Document) => void;
  folderOptions?: DocumentFolder[];
  getFileIcon: (fileType: string) => React.ElementType;
  formatFileSize: (bytes: number) => string;
}

export function DraggableDocumentCard({
  doc,
  index,
  isSelected,
  isAdmin,
  parsingDocId,
  replacingDocId,
  replaceProgress,
  domain,
  onToggleSelect,
  onPreview,
  onDownload,
  onReparse,
  onQuickMove,
  onRename,
  onDelete,
  folderOptions = [],
  getFileIcon,
  formatFileSize,
}: DraggableDocumentCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: doc.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = getFileIcon(doc.file_type);
  const isReplacing = replacingDocId === doc.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group p-4 rounded-lg border transition-all duration-200",
        isDragging && "opacity-50 shadow-lg z-50",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/30 hover:shadow-elegant"
      )}
    >
      <div className="flex items-start gap-3">
        {isAdmin && (
          <div className="flex flex-col items-center gap-1">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect(doc.id)}
            />
          </div>
        )}
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-foreground truncate flex-1">
              {doc.name}
            </h4>
            {domain && (
              <Badge
                variant="outline"
                className="shrink-0 text-xs"
                style={{ 
                  borderColor: domain.color,
                  color: domain.color 
                }}
                title={domain.name}
              >
                {domain.abbreviation || domain.name}
              </Badge>
            )}
            {doc.content ? (
              <Badge
                variant="secondary"
                className="shrink-0 text-xs bg-primary/10 text-primary border-0"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                AI Ready
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="shrink-0 text-xs text-muted-foreground"
              >
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatFileSize(doc.file_size)} •{" "}
            {format(new Date(doc.created_at), "MMM d, yyyy")}
          </p>
          {doc.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {doc.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1"
          onClick={() => onPreview(doc)}
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDownload(doc)}>
          <Download className="h-4 w-4" />
        </Button>
        {isAdmin && (
          <>
            {onQuickMove && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary"
                    title="Quick Move"
                  >
                    <Folder className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[220px]">
                  <DropdownMenuItem onClick={() => onQuickMove(doc, null)}>
                    <span className="mr-2 inline-block h-2 w-2 rounded-full bg-muted-foreground/40" />
                    No folder
                  </DropdownMenuItem>
                  {folderOptions.length > 0 ? (
                    folderOptions.map((f) => (
                      <DropdownMenuItem key={f.id} onClick={() => onQuickMove(doc, f.id)}>
                        <span
                          className="mr-2 inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: f.color }}
                        />
                        {f.name}
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled>No folders in this domain</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary"
                    onClick={() => onReparse(doc)}
                    disabled={parsingDocId === doc.id}
                  >
                    {parsingDocId === doc.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{doc.content ? "Re-extract content" : "Extract content for AI"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary"
                    onClick={() => onRename(doc)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(doc)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {isReplacing && typeof replaceProgress === "number" && (
        <div className="mt-3 text-xs text-muted-foreground">
          Updating... {Math.round(replaceProgress)}%
        </div>
      )}
    </div>
  );
}