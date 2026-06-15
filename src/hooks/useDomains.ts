import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Domain {
  id: string;
  name: string;
  abbreviation: string;
  slug: string;
  color: string;
  icon: string;
  sort_order: number;
}

export function useDomains() {
  return useQuery({
    queryKey: ["domains"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("domains")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as Domain[];
    },
  });
}

export function useAddDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (domain: Omit<Domain, "id">) => {
      const { error } = await supabase.from("domains").insert(domain);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["domains"] }),
  });
}

export function useUpdateDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Domain> & { id: string }) => {
      const { error } = await supabase.from("domains").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["domains"] }),
  });
}

export function useDeleteDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("domains").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["domains"] }),
  });
}
