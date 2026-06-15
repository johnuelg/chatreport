import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface UserQuickQuestionsRow {
  id: string;
  user_id: string;
  domain_key: string;
  questions: string[];
  created_at: string;
  updated_at: string;
}

/** Fetch all quick-question rows for the current user, keyed by domain_key */
export function useUserQuickQuestions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-quick-questions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_quick_questions")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      const map: Record<string, string[]> = {};
      (data ?? []).forEach((row: any) => {
        map[row.domain_key] = (row.questions as string[]) ?? [];
      });
      return map;
    },
  });
}

/** Save the full set of per-user quick questions (upsert by domain_key) */
export function useSaveUserQuickQuestions() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (draft: Record<string, string[]>) => {
      if (!user) throw new Error("Not authenticated");

      for (const [domainKey, questions] of Object.entries(draft)) {
        const payload = {
          user_id: user.id,
          domain_key: domainKey,
          questions: JSON.parse(JSON.stringify(questions)),
          updated_at: new Date().toISOString(),
        };

        // Try update first
        const { data: updated, error: updateErr } = await supabase
          .from("user_quick_questions")
          .update({ questions: payload.questions, updated_at: payload.updated_at })
          .eq("user_id", user.id)
          .eq("domain_key", domainKey)
          .select("id");

        if (updateErr) throw updateErr;

        if (!updated || updated.length === 0) {
          const { error: insertErr } = await supabase
            .from("user_quick_questions")
            .insert(payload);
          if (insertErr) throw insertErr;
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-quick-questions"] });
      toast({ title: "Your quick questions saved" });
    },
    onError: (err: any) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });
}
