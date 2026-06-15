import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { data: settings } = useSiteSettings();
  const { lang, t } = useLanguage();
  const footer = settings?.footer ?? { name: "Taif Children's Hospital", copyright: "© 2026 Taif Children's Hospital. Smart Reporting. Powered by Intelligent Chat." };
  const logo = settings?.logo;

  const name = t("footer", "name") || (lang === "ar" ? "مستشفى الطائف للأطفال" : footer.name);
  const copyright = t("footer", "copyright") || (lang === "ar" ? "© 2026 مستشفى الطائف للأطفال. تقارير ذكية." : footer.copyright);

  return (
    <footer className="border-t border-border/50 py-8 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          {logo?.url ? (
            <img src={logo.url} alt={logo.alt} className="w-7 h-7 rounded-lg object-contain" />
          ) : (
            <img src="/images/hospital-logo.svg" alt="Taif Children's Hospital" className="w-7 h-7 rounded-lg object-contain" />
          )}
          <span className="font-heading font-bold text-sm tracking-tight">{name}</span>
        </div>
        <p className="text-xs text-muted-foreground text-center font-medium">{copyright}</p>
      </div>
    </footer>
  );
};

export default Footer;
