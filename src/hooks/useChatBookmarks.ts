import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ChatBookmark {
  id: string;
  user_id: string;
  message_id: string;
  conversation_id: string;
  content: string;
  role: string;
  note: string;
  created_at: string;
}

export function useChatBookmarks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["chat-bookmarks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_bookmarks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ChatBookmark[];
    },
  });
}

export function useToggleBookmark() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      message_id: string;
      conversation_id: string;
      content: string;
      role: string;
      isBookmarked: boolean;
    }) => {
      if (!user) throw new Error("Not authenticated");

      if (params.isBookmarked) {
        const { error } = await supabase
          .from("chat_bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("message_id", params.message_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("chat_bookmarks")
          .insert({
            user_id: user.id,
            message_id: params.message_id,
            conversation_id: params.conversation_id,
            content: params.content,
            role: params.role,
          } as any);
        if (error) throw error;
      }
    },
    onSuccess: (_, params) => {
      qc.invalidateQueries({ queryKey: ["chat-bookmarks"] });
      toast.success(params.isBookmarked ? "Bookmark removed" : "Message bookmarked");
    },
    onError: () => {
      toast.error("Failed to update bookmark");
    },
  });
}

export function useDeleteBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("chat_bookmarks")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-bookmarks"] });
      toast.success("Bookmark removed");
    },
  });
}
