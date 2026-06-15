import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import type { SiteLanguageSettings } from "@/lib/site-language";

type Lang = "en" | "ar";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  isRtl: boolean;
  t: (section: string, field: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const { data: settings } = useSiteSettings();
  const langSettings = settings?.language as SiteLanguageSettings | undefined;
  const defaultLang = langSettings?.default_language || "en";

  const [lang, setLang] = useState<Lang>(() => {
    const stored = localStorage.getItem("site-lang");
    return (stored === "en" || stored === "ar") ? stored : defaultLang;
  });

  useEffect(() => {
    if (!localStorage.getItem("site-lang") && defaultLang) {
      setLang(defaultLang);
    }
  }, [defaultLang]);

  useEffect(() => {
    localStorage.setItem("site-lang", lang);
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (section: string, field: string): string => {
    const translations = langSettings?.translations;
    if (translations?.[section]?.[field]?.[lang]) {
      return translations[section][field][lang];
    }
    return "";
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, isRtl: lang === "ar", t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
