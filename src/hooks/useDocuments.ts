import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Document {
  id: string;
  title: string;
  description: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  domain_id: string | null;
  folder_id: string | null;
  uploaded_by: string | null;
  ai_ready: boolean;
  version: number;
  content_text?: string;
  created_at: string;
  updated_at: string;
}

export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Document[];
    },
  });
}

export function useAddDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doc: Omit<Document, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("documents").insert(doc).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
}

export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Document> & { id: string }) => {
      const { error } = await supabase.from("documents").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file_path }: { id: string; file_path: string }) => {
      // Delete file from storage
      const { error: storageError } = await supabase.storage.from("documents").remove([file_path]);
      if (storageError) console.error("Storage delete error:", storageError);
      // Delete record
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
}
