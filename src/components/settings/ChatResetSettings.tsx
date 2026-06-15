import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
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

export function ChatResetSettings() {
  const [isResetting, setIsResetting] = useState(false);

  const resetAllChats = async () => {
    setIsResetting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const userId = session?.user?.id;
      if (!userId) {
        throw new Error("Please sign in again");
      }

      // Preserve bookmarked chat history by keeping any bookmarked message rows.
      const { data: bookmarkRows, error: bookmarksError } = await supabase
        .from("chat_bookmarks")
        .select("message_id")
        .eq("user_id", userId)
        .not("message_id", "is", null);

      if (bookmarksError) {
        throw bookmarksError;
      }

      const bookmarkedMessageIds = (bookmarkRows || [])
        .map((r) => r.message_id)
        .filter(Boolean) as string[];

      // If nothing is bookmarked, it's safe to delete all conversations (which clears all messages).
      if (bookmarkedMessageIds.length === 0) {
        const { error: conversationsError } = await supabase
          .from("chat_conversations")
          .delete()
          .eq("user_id", userId);

        if (conversationsError) {
          throw conversationsError;
        }

        toast.success("All chat history has been reset");
        return;
      }

      // Keep any conversations that contain bookmarked messages so we don't cascade-delete those messages.
      const { data: bookmarkedMessages, error: bookmarkedMessagesError } = await supabase
        .from("chat_messages")
        .select("conversation_id")
        .eq("user_id", userId)
        .in("id", bookmarkedMessageIds);

      if (bookmarkedMessagesError) {
        throw bookmarkedMessagesError;
      }

      const conversationIdsToKeep = Array.from(
        new Set(
          (bookmarkedMessages || [])
            .map((m) => m.conversation_id)
            .filter(Boolean) as string[]
        )
      );

      if (conversationIdsToKeep.length > 0) {
        const { error: conversationsError } = await supabase
          .from("chat_conversations")
          .delete()
          .eq("user_id", userId)
          .not("id", "in", `(${conversationIdsToKeep.join(",")})`);

        if (conversationsError) {
          throw conversationsError;
        }
      }

      // Delete all non-bookmarked messages (including any orphan messages).
      const { error: messagesError } = await supabase
        .from("chat_messages")
        .delete()
        .eq("user_id", userId)
        .not("id", "in", `(${bookmarkedMessageIds.join(",")})`);

      if (messagesError) {
        throw messagesError;
      }

      toast.success("Chat history reset (bookmarked messages preserved)");
    } catch (error) {
      console.error("Error resetting chats:", error);
      toast.error("Failed to reset chat history");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Trash2 className="h-5 w-5" />
          Reset Chat History
        </CardTitle>
        <CardDescription>
          Permanently delete all chat messages for all users. Bookmarks will be preserved.
          This action cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isResetting}>
              {isResetting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Reset All Chat History
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all chat messages for all users. Bookmarks will be preserved.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={resetAllChats}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Yes, Reset Everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
