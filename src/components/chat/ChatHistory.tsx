import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  MessageSquare,
  Trash2,
  Pencil,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Globe,
  PanelLeftClose,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Domain {
  id: string;
  name: string;
  slug: string;
  color: string;
  abbreviation?: string | null;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  domain_id: string | null;
}

interface ChatHistoryProps {
  currentConversationId: string | null;
  onSelectConversation: (id: string | null, domainId?: string | null) => void;
  onNewConversation: () => void;
  onToggleSidebar: () => void;
  domains: Domain[];
}

interface GroupedConversations {
  [domainId: string]: Conversation[];
}

export function ChatHistory({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onToggleSidebar,
  domains,
}: ChatHistoryProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] =
    useState<Conversation | null>(null);
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(
    new Set(["global"])
  );

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("chat_conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
    } else {
      setConversations((data as Conversation[]) || []);
    }
  };

  // Group conversations by domain
  const groupedConversations: GroupedConversations = conversations.reduce(
    (acc, conv) => {
      const key = conv.domain_id || "global";
      if (!acc[key]) acc[key] = [];
      acc[key].push(conv);
      return acc;
    },
    {} as GroupedConversations
  );

  const toggleDomain = (domainId: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domainId)) {
        next.delete(domainId);
      } else {
        next.add(domainId);
      }
      return next;
    });
  };

  const getDomainInfo = (domainId: string | null) => {
    if (!domainId || domainId === "global") {
      return { name: "General", color: "hsl(var(--muted-foreground))", abbreviation: null };
    }
    const domain = domains.find((d) => d.id === domainId);
    return domain || { name: "Unknown", color: "#6366f1", abbreviation: null };
  };

  const openDeleteDialog = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversationToDelete(conv);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!conversationToDelete) return;

    const { error } = await supabase
      .from("chat_conversations")
      .delete()
      .eq("id", conversationToDelete.id);

    if (error) {
      toast.error("Failed to delete conversation");
      return;
    }

    setConversations((prev) =>
      prev.filter((c) => c.id !== conversationToDelete.id)
    );

    if (currentConversationId === conversationToDelete.id) {
      onSelectConversation(null);
    }

    toast.success("Conversation deleted");
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  const startEdit = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditTitle("");
  };

  const saveEdit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!editTitle.trim()) {
      cancelEdit(e);
      return;
    }

    const { error } = await supabase
      .from("chat_conversations")
      .update({ title: editTitle.trim() })
      .eq("id", id);

    if (error) {
      toast.error("Failed to rename conversation");
      return;
    }

    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: editTitle.trim() } : c))
    );
    setEditingId(null);
    setEditTitle("");
  };

  const renderConversationItem = (conv: Conversation) => {
    const domainInfo = getDomainInfo(conv.domain_id);

    return (
      <div
        key={conv.id}
        onClick={() => onSelectConversation(conv.id, conv.domain_id)}
        className={cn(
          "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
          "hover:bg-secondary",
          currentConversationId === conv.id &&
            "bg-primary/10 border border-primary/20"
        )}
      >
        <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />

        {editingId === conv.id ? (
          <div
            className="flex-1 flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="h-6 text-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit(conv.id, e as any);
                if (e.key === "Escape") cancelEdit(e as any);
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => saveEdit(conv.id, e)}
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={cancelEdit}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium break-words whitespace-normal leading-snug flex-1">
                  {conv.title}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(conv.updated_at), {
                  addSuffix: true,
                })}
              </p>
            </div>

            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => startEdit(conv, e)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={(e) => openDeleteDialog(conv, e)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderDomainSection = (
    domainId: string,
    convs: Conversation[],
    domainInfo: { name: string; color: string; abbreviation?: string | null }
  ) => {
    const isExpanded = expandedDomains.has(domainId);
    const isGlobal = domainId === "global";

    return (
      <Collapsible
        key={domainId}
        open={isExpanded}
        onOpenChange={() => toggleDomain(domainId)}
      >
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary/50">
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 shrink-0" />
            ) : (
              <ChevronRight className="h-3 w-3 shrink-0" />
            )}
            {isGlobal ? (
              <Globe className="h-3 w-3 shrink-0" />
            ) : (
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: domainInfo.color }}
              />
            )}
            <span className="flex-1 text-left">{domainInfo.name}</span>
            <span className="text-muted-foreground/70">{convs.length}</span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 mt-1">
          {convs.map(renderConversationItem)}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  // Sort domain keys: global first, then by domain order
  const sortedDomainKeys = Object.keys(groupedConversations).sort((a, b) => {
    if (a === "global") return -1;
    if (b === "global") return 1;
    const domainA = domains.find((d) => d.id === a);
    const domainB = domains.find((d) => d.id === b);
    return (domainA?.name || "").localeCompare(domainB?.name || "");
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Button onClick={onNewConversation} className="flex-1" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleSidebar}
                className="h-8 w-8 shrink-0"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Collapse sidebar
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No conversations yet
            </div>
          ) : (
            sortedDomainKeys.map((domainId) => {
              const domainInfo = getDomainInfo(
                domainId === "global" ? null : domainId
              );
              return renderDomainSection(
                domainId,
                groupedConversations[domainId],
                domainInfo
              );
            })
          )}
        </div>
      </ScrollArea>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{conversationToDelete?.title}"?
              This action cannot be undone and all messages in this conversation
              will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
