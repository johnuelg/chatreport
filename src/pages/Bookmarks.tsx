import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  BookmarkCheck, 
  Search, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  MessageSquare,
  Calendar,
  StickyNote,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownMessage } from "@/components/chat/MarkdownMessage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BookmarkedMessage {
  id: string;
  message_id: string | null;
  note: string | null;
  created_at: string;
  message: {
    id: string;
    content: string;
    role: string;
    created_at: string;
  } | null;
}

interface BookmarkedMessageRow {
  id: string;
  message_id: string | null;
  note: string | null;
  created_at: string;
  message:
    | {
        id: string;
        content: string;
        role: string;
        created_at: string;
      }
    | {
        id: string;
        content: string;
        role: string;
        created_at: string;
      }[]
    | null;
}

export default function Bookmarks() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState("");

  useEffect(() => {
    fetchBookmarks();
  }, [user]);

  const fetchBookmarks = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("chat_bookmarks")
      .select(`
        id,
        message_id,
        note,
        created_at,
        message:chat_messages!chat_bookmarks_message_id_fkey (
          id,
          content,
          role,
          created_at
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bookmarks:", error);
      toast.error("Failed to load bookmarks");
    } else if (data) {
      const normalized = (data as BookmarkedMessageRow[]).map((row) => ({
        ...row,
        message: Array.isArray(row.message) ? (row.message[0] ?? null) : row.message,
      }));

      setBookmarks(normalized);
    }
    setLoading(false);
  };

  const deleteBookmark = async (bookmarkId: string) => {
    const { error } = await supabase
      .from("chat_bookmarks")
      .delete()
      .eq("id", bookmarkId);

    if (error) {
      toast.error("Failed to delete bookmark");
    } else {
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
      toast.success("Bookmark deleted");
    }
  };

  const startEditNote = (bookmark: BookmarkedMessage) => {
    setEditingId(bookmark.id);
    setEditNote(bookmark.note || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditNote("");
  };

  const saveNote = async (bookmarkId: string) => {
    const { error } = await supabase
      .from("chat_bookmarks")
      .update({ note: editNote.trim() || null })
      .eq("id", bookmarkId);

    if (error) {
      toast.error("Failed to save note");
    } else {
      setBookmarks(prev => 
        prev.map(b => b.id === bookmarkId ? { ...b, note: editNote.trim() || null } : b)
      );
      toast.success("Note saved");
      cancelEdit();
    }
  };

  const filteredBookmarks = bookmarks.filter(bookmark => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      bookmark.message?.content.toLowerCase().includes(query) ||
      bookmark.note?.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <BookmarkCheck className="h-6 w-6 text-primary" />
              Saved Bookmarks
            </h1>
            <p className="text-muted-foreground mt-1">
              {bookmarks.length} bookmarked message{bookmarks.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Bookmarks List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Your Bookmarks</CardTitle>
            <CardDescription>
              Messages you've saved from chat conversations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredBookmarks.length === 0 ? (
              <div className="text-center py-12">
                <BookmarkCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No bookmarks match your search" : "No bookmarks yet"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {searchQuery ? "Try a different search term" : "Bookmark messages in the chat to save them here"}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {filteredBookmarks.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="border border-border rounded-lg p-4 bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      {/* Bookmark Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Saved on {formatDate(bookmark.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => startEditNote(bookmark)}
                          >
                            <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Bookmark</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this bookmark? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteBookmark(bookmark.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      {/* Message Content */}
                      <div className="bg-background rounded-lg p-3 border border-border">
                        <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>
                            {bookmark.message
                              ? `Assistant response from ${formatDate(bookmark.message.created_at)}`
                              : "Original message was cleared during chat reset"}
                          </span>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {bookmark.message ? (
                            <MarkdownMessage content={bookmark.message.content} />
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Your bookmark note is preserved, but the referenced chat message is no longer available.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Note Section */}
                      {editingId === bookmark.id ? (
                        <div className="mt-3 space-y-2">
                          <Textarea
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            placeholder="Add a note about this bookmark..."
                            className="min-h-[80px] text-sm"
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEdit}
                              className="h-8"
                            >
                              <X className="h-3.5 w-3.5 mr-1" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => saveNote(bookmark.id)}
                              className="h-8"
                            >
                              <Save className="h-3.5 w-3.5 mr-1" />
                              Save Note
                            </Button>
                          </div>
                        </div>
                      ) : bookmark.note ? (
                        <div className="mt-3 p-2 rounded-md bg-primary/10 border border-primary/20">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-primary mb-1">
                            <StickyNote className="h-3 w-3" />
                            Note
                          </div>
                          <p className="text-sm text-foreground">{bookmark.note}</p>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}