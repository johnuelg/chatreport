import { createClient } from "@supabase/supabase-js";

const CUSTOM_SUPABASE_CONFIG_KEY = "custom_supabase_connection";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? "https://tfwvrvpildtqdffowjry.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_QxbZI1oZOLyqqRQCVx7pXw_q5Gm1-mp";

export interface SupabaseConnectionConfig {
  url: string;
  publishableKey: string;
}

const getStoredConfig = (): SupabaseConnectionConfig | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(CUSTOM_SUPABASE_CONFIG_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<SupabaseConnectionConfig>;
    if (!parsed.url || !parsed.publishableKey) return null;

    return {
      url: parsed.url,
      publishableKey: parsed.publishableKey,
    };
  } catch {
    return null;
  }
};

const getActiveConfig = (): SupabaseConnectionConfig => {
  const stored = getStoredConfig();
  return {
    url: stored?.url ?? SUPABASE_URL,
    publishableKey: stored?.publishableKey ?? SUPABASE_PUBLISHABLE_KEY,
  };
};

let activeConfig = getActiveConfig();

export let supabase = createClient(activeConfig.url, activeConfig.publishableKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const getSupabaseConnectionConfig = () => activeConfig;

export const saveSupabaseConnectionConfig = (config: SupabaseConnectionConfig) => {
  if (typeof window === "undefined") return;

  const normalized: SupabaseConnectionConfig = {
    url: config.url.trim(),
    publishableKey: config.publishableKey.trim(),
  };

  localStorage.setItem(CUSTOM_SUPABASE_CONFIG_KEY, JSON.stringify(normalized));
  activeConfig = normalized;
  supabase = createClient(normalized.url, normalized.publishableKey, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
};

export const clearSupabaseConnectionConfig = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(CUSTOM_SUPABASE_CONFIG_KEY);
  }

  activeConfig = {
    url: SUPABASE_URL,
    publishableKey: SUPABASE_PUBLISHABLE_KEY,
  };

  supabase = createClient(activeConfig.url, activeConfig.publishableKey, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
};
