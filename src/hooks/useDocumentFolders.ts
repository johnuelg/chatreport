import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DocumentFolder {
  id: string;
  name: string;
  domain_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useDocumentFolders() {
  return useQuery({
    queryKey: ["document_folders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_folders")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as DocumentFolder[];
    },
  });
}

export function useAddDocumentFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (folder: { name: string; domain_id?: string | null; created_by?: string | null }) => {
      const { data, error } = await supabase.from("document_folders").insert(folder).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["document_folders"] }),
  });
}

export function useUpdateDocumentFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("document_folders").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["document_folders"] }),
  });
}

export function useDeleteDocumentFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Unfile documents in this folder first
      const { error: unfileError } = await supabase
        .from("documents")
        .update({ folder_id: null })
        .eq("folder_id", id);
      if (unfileError) throw unfileError;
      const { error } = await supabase.from("document_folders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["document_folders"] });
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}
