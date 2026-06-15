import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Folder, MoreVertical, Pencil, Trash2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentFolder {
  id: string;
  name: string;
  description: string | null;
  color: string;
}

interface FolderCardProps {
  folder: DocumentFolder;
  documentCount: number;
  isAdmin: boolean;
  onClick: () => void;
  onEdit: (folder: DocumentFolder) => void;
  onDelete: (folder: DocumentFolder) => void;
}

export function FolderCard({
  folder,
  documentCount,
  isAdmin,
  onClick,
  onEdit,
  onDelete,
}: FolderCardProps) {
  return (
    <Card
      className={cn(
        "group relative p-4 cursor-pointer transition-all duration-200",
        "border-border hover:border-primary/40 hover:shadow-elegant",
        "bg-gradient-to-br from-background to-muted/30"
      )}
      onClick={onClick}
    >
      {/* Admin dropdown */}
      {isAdmin && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(folder);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(folder);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Folder icon */}
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: `${folder.color}20` }}
      >
        <Folder
          className="h-8 w-8"
          style={{ color: folder.color }}
          fill={`${folder.color}40`}
        />
      </div>

      {/* Folder name */}
      <h4 className="font-medium text-foreground truncate mb-1">{folder.name}</h4>

      {/* Document count */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <FileText className="h-3.5 w-3.5" />
        <span>
          {documentCount} {documentCount === 1 ? "file" : "files"}
        </span>
      </div>

      {/* Description tooltip on hover */}
      {folder.description && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {folder.description}
        </p>
      )}
    </Card>
  );
}
