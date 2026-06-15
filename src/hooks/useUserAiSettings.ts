import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserAiSettings {
  gemini_api_key: string;
  use_personal_key: boolean;
}

export function useUserAiSettings() {
  return useQuery({
    queryKey: ["user-ai-settings"],
    queryFn: async (): Promise<UserAiSettings> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { gemini_api_key: "", use_personal_key: false };
      const { data } = await supabase
        .from("user_ai_settings" as any)
        .select("gemini_api_key, use_personal_key")
        .eq("user_id", user.id)
        .maybeSingle();
      return {
        gemini_api_key: (data as any)?.gemini_api_key ?? "",
        use_personal_key: (data as any)?.use_personal_key ?? false,
      };
    },
  });
}

export function useSaveUserAiSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: UserAiSettings) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("user_ai_settings" as any)
        .upsert(
          { user_id: user.id, ...settings, updated_at: new Date().toISOString() } as any,
          { onConflict: "user_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-ai-settings"] }),
  });
}
