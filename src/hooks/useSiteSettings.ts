import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { defaultLanguageSettings, mergeLanguageSettings, type SiteLanguageSettings } from "@/lib/site-language";

export interface SiteSettings {
  logo: { url: string; alt: string };
  hero: {
    badge: string;
    title_line1: string;
    title_line2: string;
    highlight_word: string;
    description: string;
    cta_primary: string;
    cta_secondary: string;
    typewriter_words: string[];
  };
  sections_visibility: {
    hero: boolean;
    about: boolean;
    features: boolean;
    domains: boolean;
  };
  footer: { name: string; copyright: string };
  login_page: {
    bg_image: string;
    logo: string;
    title_en: string;
    title_ar: string;
  };
  language: SiteLanguageSettings;
}

export const defaultSiteSettings: SiteSettings = {
  logo: { url: "", alt: "Taif Children's Hospital" },
  hero: {
    badge: "AI-Powered Healthcare Data Assistant",
    title_line1: "Chat with Your Data.",
    title_line2: "Get Summaries Instantly.",
    highlight_word: "Summaries",
    description: "Skip manual reports. Our personalized AI assistant performs instant analysis on your hospital KPI data, enabling fast decision-making.",
    cta_primary: "Get Started",
    cta_secondary: "Learn More",
    typewriter_words: ["Answers", "Summaries", "Charts", "Reports", "Insights"],
  },
  sections_visibility: { hero: true, about: true, features: true, domains: true },
  footer: { name: "Taif Children's Hospital", copyright: "© 2026 Taif Children's Hospital. Smart Reporting. Powered by Intelligent Chat." },
  login_page: { bg_image: "/images/login-bg.png", logo: "/images/hospital-logo.svg", title_en: "Taif Children's Hospital", title_ar: "مستشفى الطائف للأطفال" },
  language: defaultLanguageSettings,
};

function sanitizeSettingValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function mergeSiteSettings(settings?: Partial<SiteSettings>): SiteSettings {
  return {
    ...defaultSiteSettings,
    ...settings,
    logo: {
      ...defaultSiteSettings.logo,
      ...(settings?.logo ?? {}),
    },
    hero: {
      ...defaultSiteSettings.hero,
      ...(settings?.hero ?? {}),
      typewriter_words: settings?.hero?.typewriter_words?.length
        ? settings.hero.typewriter_words
        : defaultSiteSettings.hero.typewriter_words,
    },
    sections_visibility: {
      ...defaultSiteSettings.sections_visibility,
      ...(settings?.sections_visibility ?? {}),
    },
    footer: {
      ...defaultSiteSettings.footer,
      ...(settings?.footer ?? {}),
    },
    login_page: {
      ...defaultSiteSettings.login_page,
      ...(settings?.login_page ?? {}),
    },
    language: mergeLanguageSettings(settings?.language),
  };
}

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async (): Promise<SiteSettings> => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value");
      if (error) throw error;
      const settings: Partial<SiteSettings> = {};
      data?.forEach((row: any) => {
        if (row.key in defaultSiteSettings) {
          (settings as any)[row.key] = row.value;
        }
      });
      return mergeSiteSettings(settings);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateSiteSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload = {
        key,
        value: sanitizeSettingValue(value),
        updated_at: new Date().toISOString(),
        updated_by: user?.id ?? null,
      };

      // Try update first, then insert if no rows were updated
      const { data: updated, error: updateError } = await supabase
        .from("site_settings")
        .update({ value: payload.value, updated_at: payload.updated_at, updated_by: payload.updated_by })
        .eq("key", key)
        .select("key");

      if (updateError) throw updateError;

      // If update matched 0 rows, the key doesn't exist yet — insert it
      if (!updated || updated.length === 0) {
        const { error: insertError } = await supabase
          .from("site_settings")
          .insert(payload);
        if (insertError) throw insertError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.setQueryData(["site-settings"], (current: SiteSettings | undefined) =>
        mergeSiteSettings({
          ...(current ?? defaultSiteSettings),
          [variables.key]: variables.value,
        })
      );
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
  });
}

export function useSaveSiteSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<SiteSettings>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const updatedAt = new Date().toISOString();

      const errors: string[] = [];

      // Save each key sequentially to avoid race conditions
      for (const [key, value] of Object.entries(settings)) {
        const sanitizedValue = sanitizeSettingValue(value);

        // Try update first
        const { data: updated, error: updateError } = await supabase
          .from("site_settings")
          .update({ value: sanitizedValue, updated_at: updatedAt, updated_by: user.id })
          .eq("key", key)
          .select("key");

        if (updateError) {
          errors.push(`${key}: ${updateError.message}`);
          continue;
        }

        // If no row was updated, insert a new one
        if (!updated || updated.length === 0) {
          const { error: insertError } = await supabase
            .from("site_settings")
            .insert({
              key,
              value: sanitizedValue,
              updated_at: updatedAt,
              updated_by: user.id,
            });

          if (insertError) {
            errors.push(`${key}: ${insertError.message}`);
          }
        }
      }

      if (errors.length > 0) {
        throw new Error(`Failed to save: ${errors.join("; ")}`);
      }

      return mergeSiteSettings(settings);
    },
    onSuccess: (savedSettings) => {
      queryClient.setQueryData(["site-settings"], savedSettings);
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
  });
}

export function useIsAdmin() {
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
  });
}
