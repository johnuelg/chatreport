import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CustomRole {
  id: string;
  name: string;
  color: string;
  description: string;
  is_system: boolean;
  created_at: string;
}

export interface UserCustomRole {
  id: string;
  user_id: string;
  custom_role_id: string;
  assigned_at: string;
}

export function useCustomRoles() {
  return useQuery({
    queryKey: ["custom-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_roles" as any)
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as CustomRole[];
    },
  });
}

export function useUserCustomRoles() {
  return useQuery({
    queryKey: ["user-custom-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_custom_roles" as any)
        .select("*");
      if (error) throw error;
      return (data ?? []) as unknown as UserCustomRole[];
    },
  });
}

export function useCreateCustomRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, color, description }: { name: string; color: string; description: string }) => {
      const { error } = await supabase
        .from("custom_roles" as any)
        .insert({ name, color, description } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom-roles"] }),
  });
}

export function useUpdateCustomRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, color, description }: { id: string; name: string; color: string; description: string }) => {
      const { error } = await supabase
        .from("custom_roles" as any)
        .update({ name, color, description } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom-roles"] }),
  });
}

export function useDeleteCustomRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("custom_roles" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-roles"] });
      qc.invalidateQueries({ queryKey: ["user-custom-roles"] });
    },
  });
}

export function useAssignCustomRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ user_id, custom_role_id }: { user_id: string; custom_role_id: string }) => {
      const { error } = await supabase
        .from("user_custom_roles" as any)
        .insert({ user_id, custom_role_id } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-custom-roles"] }),
  });
}

export function useRemoveCustomRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ user_id, custom_role_id }: { user_id: string; custom_role_id: string }) => {
      const { error } = await supabase
        .from("user_custom_roles" as any)
        .delete()
        .eq("user_id", user_id)
        .eq("custom_role_id", custom_role_id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-custom-roles"] }),
  });
}
