import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserDomain {
  id: string;
  user_id: string;
  domain_id: string;
  assigned_at: string;
}

export function useUserDomains() {
  return useQuery({
    queryKey: ["user-domains"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_domains" as any)
        .select("*");
      if (error) throw error;
      return (data ?? []) as unknown as UserDomain[];
    },
  });
}

export function useAssignDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ user_id, domain_id }: { user_id: string; domain_id: string }) => {
      const { error } = await supabase
        .from("user_domains" as any)
        .insert({ user_id, domain_id } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-domains"] }),
  });
}

export function useRemoveDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ user_id, domain_id }: { user_id: string; domain_id: string }) => {
      const { error } = await supabase
        .from("user_domains" as any)
        .delete()
        .eq("user_id", user_id)
        .eq("domain_id", domain_id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-domains"] }),
  });
}
