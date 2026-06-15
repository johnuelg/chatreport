import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ChatConversation {
  id: string;
  user_id: string;
  title: string;
  domain_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export function useChatConversations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["chat-conversations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_conversations" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ChatConversation[];
    },
  });
}

export function useChatMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["chat-messages", conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages" as any)
        .select("*")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as ChatMessage[];
    },
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (conv: { user_id: string; title: string; domain_id: string | null }) => {
      const { data, error } = await supabase
        .from("chat_conversations" as any)
        .insert(conv as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ChatConversation;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat-conversations"] }),
  });
}

export function useUpdateConversationTitle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await supabase
        .from("chat_conversations" as any)
        .update({ title, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat-conversations"] }),
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("chat_conversations" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-conversations"] });
      qc.invalidateQueries({ queryKey: ["chat-messages"] });
    },
  });
}

export function useAddChatMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (msg: { conversation_id: string; role: string; content: string }) => {
      const { data, error } = await supabase
        .from("chat_messages" as any)
        .insert(msg as any)
        .select()
        .single();
      if (error) throw error;
      // Touch conversation updated_at
      await supabase
        .from("chat_conversations" as any)
        .update({ updated_at: new Date().toISOString() } as any)
        .eq("id", msg.conversation_id);
      return data as unknown as ChatMessage;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["chat-messages", (data as ChatMessage).conversation_id] });
      qc.invalidateQueries({ queryKey: ["chat-conversations"] });
    },
  });
}
